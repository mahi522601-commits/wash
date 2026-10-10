/**
 * Financial Reporting, Settlement Reconciliation & Archival Service for Tech Wash
 * Handles 1-Day, 30-Day, Custom Date Range, Branch/Terminal Filtering,
 * Two-Category Reconciliation Accounting, and Automated 1,000-Order Backups.
 */

import { orderService, getOrderBranchKey } from './orderService.js';
import { parsePinToPinItems } from '../utils/formatters.js';
import { attendanceService } from './attendanceService.js';
import { posIndexedDB } from './posIndexedDB.js';
import { db, isFirebaseConfigured } from './firebase.js';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

const BACKUP_STORAGE_PREFIX = 'techwash_backup_checkpoint_';
const LAST_BACKUP_COUNT_KEY = 'techwash_last_backup_order_count';
const SHIFT_REPORTS_LOCAL_KEY = 'techwash_shift_reports_v2';

export const parseOrderDateSafe = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try { return val.toDate(); } catch (e) {}
    }
    const secs = typeof val.seconds === 'number' ? val.seconds : (typeof val._seconds === 'number' ? val._seconds : null);
    if (secs !== null) {
      return new Date(secs * 1000);
    }
  }
  if (typeof val === 'string') {
    const str = val.trim();
    if (!str) return null;

    // Check numeric epoch timestamp as string e.g. "1728523200000"
    if (/^\d{10,13}$/.test(str)) {
      const num = Number(str);
      const d = new Date(num > 1e11 ? num : num * 1000);
      if (!isNaN(d.getTime())) return d;
    }

    // Check format YYYY-MM-DD or YYYY/MM/DD (parse in local calendar at noon to prevent UTC shifting)
    const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (ymdMatch && !str.includes('Z') && !/[+\-]\d{2}:\d{2}$/.test(str)) {
      const y = Number(ymdMatch[1]);
      const m = Number(ymdMatch[2]) - 1;
      const d = Number(ymdMatch[3]);
      const hh = ymdMatch[4] !== undefined ? Number(ymdMatch[4]) : 12;
      const mm = ymdMatch[5] !== undefined ? Number(ymdMatch[5]) : 0;
      const ss = ymdMatch[6] !== undefined ? Number(ymdMatch[6]) : 0;
      return new Date(y, m, d, hh, mm, ss);
    }

    // Check format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]), 12, 0, 0);
    }

    // Replace September variant 'Sept' -> 'Sep'
    const cleaned = str.replace(/Sept/i, 'Sep');
    let d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;

    // Append current year if string lacks a 4-digit year like "29 Sep, 11:39 am"
    if (!/\d{4}/.test(cleaned)) {
      const currentYear = new Date().getFullYear();
      d = new Date(`${cleaned} ${currentYear}`);
      if (!isNaN(d.getTime())) return d;
    }
  }
  if (typeof val === 'number') {
    const d = new Date(val > 1e11 ? val : val * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export const getLocalDateKey = (d = new Date()) => {
  if (!d) return getLocalDateKey(new Date());
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('T')) return trimmed.split('T')[0];
  }
  const dateObj = d instanceof Date ? d : parseOrderDateSafe(d);
  if (!dateObj || isNaN(dateObj.getTime())) {
    const fallback = new Date();
    const y = fallback.getFullYear();
    const m = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const isSameCalendarDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = parseOrderDateSafe(date1) || new Date();
  const d2 = parseOrderDateSafe(date2) || new Date();
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isPosOrder = (order) => {
  if (!order) return false;
  if (order.isWalkIn === true) return true;
  if (order.orderSource === 'OFFLINE_POS' || order.orderSource === 'POS' || order.orderSource === 'WALK_IN' || order.orderSource === 'COUNTER' || order.orderSource === 'DIRECT' || order.orderSource === 'ADMIN') return true;
  if (order.terminalCode || order.terminalId || order.manualBillNumber) return true;
  if (order.orderType === 'POS' || order.orderType === 'WALK_IN' || order.channel === 'POS') return true;
  const storeBranch = (order.storeBranch || order.branch || order.customer?.storeBranch || '').toLowerCase();
  if (storeBranch.includes('counter') || storeBranch.includes('pos') || storeBranch.includes('flagship') || storeBranch.includes('express') || storeBranch.includes('walk-in') || storeBranch.includes('main') || storeBranch.includes('manikonda') || storeBranch.includes('shaikpet') || storeBranch.includes('tolichowki') || storeBranch.includes('ambience')) return true;
  // If not explicitly marked as an online website booking, consider it a POS counter bill
  if (order.isOnlineBooking !== true && order.orderSource !== 'ONLINE_WEBSITE' && order.channel !== 'ONLINE_WEBSITE' && order.channel !== 'ONLINE') {
    return true;
  }
  return false;
};

export const reportService = {
  /**
   * Filter and aggregate order data for a specific date range and branch/terminal
   */
  async generateFinancialReport({
    datePreset = 'today', // 'today' | 'tomorrow' | 'yesterday' | '7days' | '30days' | 'all' | 'custom' | 'single'
    startDate = null,
    endDate = null,
    targetDate = null,
    branchFilter = 'ALL', // 'ALL' | 'POS_ONLY' | 'ALL_POS' | 'counter-1' | 'counter-2' | 'counter-3' | 'ONLINE_WEBSITE'
    channelFilter = 'ALL', // 'ALL' | 'POS_ONLY' | 'ONLINE_ONLY'
    onlyOfflinePos = false,
    searchQuery = '',
  } = {}) {
    let allOrders = [];
    try {
      allOrders = await orderService.getOrders({ limitCount: 5000 });
    } catch (e) {
      console.warn('[reportService] getOrders warning:', e);
      try {
        allOrders = await posIndexedDB.getAllOrders();
      } catch (err) {}
    }
    if (!Array.isArray(allOrders)) allOrders = [];

    // Determine filter date boundaries
    const now = new Date();
    let start = null;
    let end = null;
    let dateRangeLabel = 'Today';
    let reportDateKey = getLocalDateKey(now);

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(now);
      dateRangeLabel = `Today (${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === 'tomorrow') {
      const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      start = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 0, 0, 0, 0);
      end = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(tmrw);
      dateRangeLabel = `Tomorrow (${tmrw.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === 'yesterday') {
      const yday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      start = new Date(yday.getFullYear(), yday.getMonth(), yday.getDate(), 0, 0, 0, 0);
      end = new Date(yday.getFullYear(), yday.getMonth(), yday.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(yday);
      dateRangeLabel = `Yesterday (${yday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === '7days') {
      const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      start = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(now);
      dateRangeLabel = `Last 7 Days (${past7.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`;
    } else if (datePreset === '30days') {
      const past30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      start = new Date(past30.getFullYear(), past30.getMonth(), past30.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(now);
      dateRangeLabel = `Last 30 Days (${past30.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`;
    } else if (datePreset === 'all') {
      start = null;
      end = null;
      reportDateKey = 'ALL';
      dateRangeLabel = 'All Master History';
    } else if ((datePreset === 'single' || datePreset === 'specific') && targetDate) {
      const t = parseOrderDateSafe(targetDate) || new Date();
      start = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0);
      end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999);
      reportDateKey = getLocalDateKey(targetDate);
      dateRangeLabel = `Date: ${t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else if (datePreset === 'custom' && (startDate || endDate)) {
      if (startDate) {
        const s = parseOrderDateSafe(startDate) || new Date();
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
      }
      if (endDate) {
        const e = parseOrderDateSafe(endDate) || new Date();
        end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
      }
      reportDateKey = `${startDate || 'start'}_${endDate || 'end'}`;
      dateRangeLabel = `Custom Range (${startDate || 'Start'} to ${endDate || 'Now'})`;
    }

    // Filter orders
    const filteredOrders = allOrders.filter(order => {
      // 0. Exclude Test Data Artifacts from Financial Reports
      const isTestDoc = Boolean(
        order.isTestData === true || 
        order.isTestOrder === true ||
        (order.id && (order.id.includes('-T1') || order.id.includes('-T2') || order.id.includes('-T3') || order.id.includes('-T4') || order.id.includes('-T5') || order.id.includes('-T6') || order.id.includes('-T7') || order.id.includes('-T8') || order.id.includes('-T9') || order.id.includes('-T12'))) ||
        (order.customerName && (order.customerName.toLowerCase().includes('real test') || order.customerName.toLowerCase().includes('test customer') || order.customerName.toLowerCase().includes('phase 4')))
      );
      if (isTestDoc) return false;

      // 1. Comprehensive Date Check across creation, operations, and payment timestamps
      if (start && end) {
        const primaryDates = [
          parseOrderDateSafe(order.createdAt),
          parseOrderDateSafe(order.created_at),
          parseOrderDateSafe(order.orderDate),
          parseOrderDateSafe(order.date),
          parseOrderDateSafe(order.timestamp),
          parseOrderDateSafe(order.pickupDate),
          parseOrderDateSafe(order.schedule?.pickupDate),
          parseOrderDateSafe(order.paymentDate),
          parseOrderDateSafe(order.paidAt),
          parseOrderDateSafe(order.statusTimeline?.[0]?.timestamp),
        ].filter(Boolean);

        const fallbackDates = [
          parseOrderDateSafe(order.deliveryDate),
          parseOrderDateSafe(order.schedule?.deliveryDate),
          parseOrderDateSafe(order.updatedAt),
        ].filter(Boolean);

        const dateCandidates = primaryDates.length > 0 ? primaryDates : fallbackDates;
        const hasMatchingDate = dateCandidates.length === 0 || dateCandidates.some(d => d >= start && d <= end);
        if (!hasMatchingDate) return false;
      }

      // 2. Channel & Source Filter (Strict POS Offline vs Online)
      const isPos = isPosOrder(order);
      const isExplicitPosOnly = onlyOfflinePos || channelFilter === 'POS_ONLY' || branchFilter === 'POS_ONLY';
      const isExplicitOnlineOnly = channelFilter === 'ONLINE_ONLY' || branchFilter === 'ONLINE_WEBSITE';

      if (isExplicitPosOnly && !isPos) return false;
      if (isExplicitOnlineOnly && isPos) return false;

      // 3. Counter Terminal Specific Branch Check
      if (branchFilter && branchFilter !== 'ALL' && branchFilter !== 'POS_ONLY' && branchFilter !== 'ALL_POS' && branchFilter !== 'ONLINE_WEBSITE') {
        if (!isPos) return false;
        const bKey = getOrderBranchKey(order);
        const tId = String(order.terminalId || '').toLowerCase().trim();
        const tCode = String(order.terminalCode || '').toLowerCase().trim();
        const targetKey = String(branchFilter).toLowerCase().trim();

        const isDirectMatch = (
          bKey === targetKey ||
          tId === targetKey ||
          tCode.includes(targetKey) ||
          (targetKey === 'counter-1' && (tCode.includes('01') || tId.includes('1') || tId === 'counter-1' || bKey === 'counter-1' || !tId || tId === 'undefined')) ||
          (targetKey === 'counter-2' && (tCode.includes('02') || tId.includes('2') || tId === 'counter-2' || bKey === 'counter-2')) ||
          (targetKey === 'counter-3' && (tCode.includes('03') || tId.includes('3') || tId === 'counter-3' || bKey === 'counter-3'))
        );

        if (!isDirectMatch) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = (order.orderNumber || order.id || '').toLowerCase().includes(q);
        const matchesCust = (order.customerName || order.customer?.name || '').toLowerCase().includes(q);
        const matchesPhone = (order.phone || order.customer?.phone || '').includes(q);
        const matchesSrv = (order.serviceName || order.service || '').toLowerCase().includes(q);
        const matchesItem = (order.items || []).some(it => (it.name || '').toLowerCase().includes(q));
        if (!matchesNum && !matchesCust && !matchesPhone && !matchesSrv && !matchesItem) return false;
      }

      return true;
    });


    // Compute Comprehensive Financial Aggregations
    let totalGrossBilled = 0;
    let totalOrdersCount = filteredOrders.length;
    let totalPiecesCount = 0;
    let totalWeightKg = 0;

    // Category 1: Mode-wise Collections (Cash, UPI, Card, Online)
    let cashReceived = 0;
    let upiReceived = 0;
    let cardReceived = 0;
    let onlineReceived = 0;

    // Category 2: Due Balances & Recoveries
    let totalInitialDuesCreated = 0;
    let totalRecoveredDues = 0;
    let totalNetPendingDues = 0;
    let fullyPaidOrdersCount = 0;
    let partialOrdersCount = 0;
    let unpaidOrdersCount = 0;

    // Service Breakdown Map
    const serviceBreakdown = {};

    filteredOrders.forEach(order => {
      const billTotal = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
      const recAmount = Number(order.receivedAmount !== undefined 
        ? order.receivedAmount 
        : (order.paymentStatus === 'PAID' ? billTotal : 0));
      const balAmount = Number(order.balanceAmount !== undefined 
        ? order.balanceAmount 
        : Math.max(0, billTotal - recAmount));

      totalGrossBilled += billTotal;

      // Count garments / weight
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(it => {
          totalPiecesCount += Number(it.quantity) || 1;
        });
      }
      if (order.actualWeight || order.estimatedWeightKg || order.weightKg) {
        totalWeightKg += Number(order.actualWeight || order.estimatedWeightKg || order.weightKg || 0);
      }

      // Map Payment Mode Collections (Category 1)
      const pMethod = String(order.paymentMethod || 'CASH').toUpperCase();
      if (pMethod === 'CASH') {
        cashReceived += recAmount;
      } else if (pMethod.includes('UPI') || pMethod.includes('QR')) {
        upiReceived += recAmount;
      } else if (pMethod.includes('CARD') || pMethod.includes('POS')) {
        cardReceived += recAmount;
      } else {
        onlineReceived += recAmount;
      }

      // Balances Lifecycle (Category 2)
      if (balAmount === 0 || order.paymentStatus === 'PAID') {
        fullyPaidOrdersCount += 1;
      } else if (recAmount > 0) {
        partialOrdersCount += 1;
        totalNetPendingDues += balAmount;
      } else {
        unpaidOrdersCount += 1;
        totalNetPendingDues += balAmount;
      }

      // Track recovered payments if present in payment history
      if (order.paymentHistory && Array.isArray(order.paymentHistory)) {
        order.paymentHistory.forEach(h => {
          if (h.isBalanceSettlement || h.type === 'BALANCE_COLLECTION') {
            totalRecoveredDues += Number(h.amount || 0);
          }
        });
      }

      // Service Breakdown
      const sName = order.serviceName || order.service || 'General Garment Care';
      if (!serviceBreakdown[sName]) {
        serviceBreakdown[sName] = { count: 0, revenue: 0 };
      }
      serviceBreakdown[sName].count += 1;
      serviceBreakdown[sName].revenue += billTotal;
    });

    const totalInflowCollections = cashReceived + upiReceived + cardReceived + onlineReceived;
    const totalExpectedRealization = totalInflowCollections + totalNetPendingDues;

    // Staff Attendance Summary for Reporting Window
    let attendanceSummary = {
      totalStaff: 0,
      presentCount: 0,
      halfDayCount: 0,
      lateCount: 0,
      absentCount: 0,
      paidLeaveCount: 0,
      unmarkedCount: 0,
      roster: [],
    };

    try {
      const targetDateObj = start || new Date();
      const yr = targetDateObj.getFullYear();
      const mo = String(targetDateObj.getMonth() + 1).padStart(2, '0');
      const da = String(targetDateObj.getDate()).padStart(2, '0');
      const targetDateKey = `${yr}-${mo}-${da}`;

      const dailyAttendance = await attendanceService.getDailyAttendance(targetDateKey, branchFilter);
      if (Array.isArray(dailyAttendance) && dailyAttendance.length > 0) {
        const present = dailyAttendance.filter(a => a.status === 'PRESENT').length;
        const halfDay = dailyAttendance.filter(a => a.status === 'HALF_DAY').length;
        const late = dailyAttendance.filter(a => a.status === 'LATE').length;
        const absent = dailyAttendance.filter(a => a.status === 'ABSENT').length;
        const paidLeave = dailyAttendance.filter(a => a.status === 'PAID_LEAVE').length;
        const unmarked = dailyAttendance.filter(a => !a.status || a.status === 'UNMARKED').length;

        attendanceSummary = {
          totalStaff: dailyAttendance.length,
          presentCount: present + late + halfDay,
          presentStrictCount: present,
          halfDayCount: halfDay,
          lateCount: late,
          absentCount: absent,
          paidLeaveCount: paidLeave,
          unmarkedCount: unmarked,
          roster: dailyAttendance.map(a => ({
            employeeId: a.employeeId,
            name: a.employeeName || a.name || a.employee?.name || 'Staff Member',
            role: a.employee?.role || a.role || 'Staff',
            branch: a.employee?.branch || a.branch || 'counter-1',
            status: a.status || 'UNMARKED',
            checkInTime: a.checkInTime || '',
            checkOutTime: a.checkOutTime || '',
            otHours: a.otHours || 0,
          })),
        };
      }
    } catch (attErr) {
      console.warn('[reportService] Attendance summary collection failed non-fatally:', attErr);
    }

    // If no live orders matched this specific date, hydrate from a stored snapshot if available
    if (filteredOrders.length === 0 && reportDateKey && reportDateKey !== 'ALL') {
      try {
        const storedSnapshots = await this.getStoredShiftReports({ branchFilter, dateKey: reportDateKey });
        if (storedSnapshots && storedSnapshots.length > 0) {
          const snap = storedSnapshots[0];
          if ((snap.ordersCount > 0 || snap.totalBills > 0 || snap.grossBilled > 0 || snap.totalGrossBilled > 0) && snap.metrics) {
            return {
              dateKey: reportDateKey,
              reportDateKey,
              datePreset,
              dateRangeLabel: snap.dateRangeLabel || dateRangeLabel,
              startDate: start ? start.toISOString() : null,
              endDate: end ? end.toISOString() : null,
              generatedAt: snap.savedAt || snap.generatedAt || new Date().toISOString(),
              branchFilter,
              channelFilter,
              orders: snap.ordersSummary || [],
              metrics: snap.metrics,
              attendance: snap.attendance || null,
              isFromStoredSnapshot: true,
            };
          }
        }
      } catch (snapErr) {
        console.warn('[reportService] Stored snapshot fallback check:', snapErr);
      }
    }

    const reportResult = {
      dateKey: reportDateKey,
      reportDateKey,
      datePreset,
      dateRangeLabel: this.formatDateRangeLabel(datePreset, start, end),
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      generatedAt: new Date().toISOString(),
      branchFilter,
      channelFilter,
      orders: filteredOrders,
      metrics: {
        totalOrdersCount,
        totalGrossBilled,
        totalPiecesCount,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        
        // Category 1: Direct Collections Received Today
        category1: {
          title: 'Direct Collections Inflow (Mode-wise)',
          cashReceived,
          upiReceived,
          cardReceived,
          onlineReceived,
          totalInflowCollections,
        },

        // Category 2: Due Balances & Total Realization
        category2: {
          title: 'Balance Due Lifecycle & Realization',
          totalInitialDuesCreated: totalGrossBilled - totalInflowCollections,
          totalRecoveredDues,
          totalNetPendingDues,
          totalExpectedRealization,
          fullyPaidOrdersCount,
          partialOrdersCount,
          unpaidOrdersCount,
        },

        serviceBreakdown,
      },
      attendance: attendanceSummary,
    };

    // Auto-store Shift Report Snapshot into IndexedDB reportSnapshots & localStorage & Firestore
    if (datePreset === 'today' || datePreset === 'single' || datePreset === 'yesterday') {
      this.saveShiftReportSnapshot(reportResult).catch(() => {});
    }

    return reportResult;
  },

  /**
   * Save a formal shift report snapshot into IndexedDB (reportSnapshots), localStorage, and Firestore (shiftReports)
   */
  async saveShiftReportSnapshot(reportData) {
    if (!reportData) return null;
    if (reportData.isFromStoredSnapshot) return reportData;

    const dateKey = reportData.dateKey || reportData.reportDateKey || (
      reportData.targetDate ? getLocalDateKey(reportData.targetDate) : (reportData.startDate ? getLocalDateKey(reportData.startDate) : getLocalDateKey())
    );
    
    const branchKey = reportData.branchFilter || 'ALL_POS';
    const snapshotId = `shift_${dateKey}_${branchKey}`;

    const ordersCount = reportData.orders?.length || reportData.metrics?.totalOrdersCount || 0;
    const totalGrossBilled = reportData.metrics?.totalGrossBilled || 0;

    // Guard: Never overwrite an existing populated snapshot with an empty report
    if (ordersCount === 0 && totalGrossBilled === 0) {
      try {
        const existing = await posIndexedDB.getReportSnapshot(snapshotId);
        if (existing && (existing.ordersCount > 0 || existing.totalGrossBilled > 0)) {
          return existing;
        }
      } catch (e) {}
    }

    const snapshot = {
      id: snapshotId,
      snapshotId,
      date: dateKey,
      reportDate: dateKey,
      terminalId: branchKey,
      branchFilter: branchKey,
      channelFilter: reportData.channelFilter || 'ALL',
      datePreset: reportData.datePreset || 'today',
      dateRangeLabel: reportData.dateRangeLabel || `Shift ${dateKey}`,
      generatedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
      metrics: reportData.metrics || {},
      attendance: reportData.attendance || null,
      ordersCount: ordersCount,
      totalBills: ordersCount,
      totalGrossBilled: totalGrossBilled,
      grossBilled: totalGrossBilled,
      totalInflowCollections: reportData.metrics?.category1?.totalInflowCollections || 0,
      collected: reportData.metrics?.category1?.totalInflowCollections || 0,
      totalNetPendingDues: reportData.metrics?.category2?.totalNetPendingDues || 0,
      pendingDues: reportData.metrics?.category2?.totalNetPendingDues || 0,
      cash: reportData.metrics?.category1?.cashReceived || 0,
      upi: reportData.metrics?.category1?.upiReceived || 0,
      card: reportData.metrics?.category1?.cardReceived || 0,
      online: reportData.metrics?.category1?.onlineReceived || 0,
      pieces: reportData.metrics?.totalPiecesCount || 0,
      weightKg: reportData.metrics?.totalWeightKg || 0,
      ordersSummary: (reportData.orders || []).slice(0, 100).map(o => ({
        id: o.id || o.localId,
        orderNumber: o.orderNumber || o.id,
        customerName: o.customerName || o.customer?.name || 'Customer',
        phone: o.phone || o.customer?.phone || '',
        total: Number(o.totalAmount || o.finalPrice || 0),
        received: Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? (o.totalAmount || 0) : 0)),
        balance: Number(o.balanceAmount !== undefined ? o.balanceAmount : 0),
        method: o.paymentMethod || 'CASH',
        status: o.paymentStatus || 'PENDING',
        time: o.createdAt || new Date().toISOString(),
      })),
      status: 'SAVED_LOCAL'
    };

    // 1. Save to IndexedDB 'reportSnapshots' store
    try {
      await posIndexedDB.saveReportSnapshot(snapshot);
    } catch (e) {
      console.warn('IndexedDB shift snapshot save notice:', e);
    }

    // 2. Save to localStorage fallback
    try {
      let list = [];
      try { list = JSON.parse(localStorage.getItem(SHIFT_REPORTS_LOCAL_KEY) || '[]'); } catch (e) { list = []; }
      const filtered = list.filter(s => s.id !== snapshotId);
      filtered.unshift(snapshot);
      localStorage.setItem(SHIFT_REPORTS_LOCAL_KEY, JSON.stringify(filtered.slice(0, 60)));
    } catch (e) {}

    // 3. Mirror to Firestore 'shiftReports' collection
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'shiftReports', snapshotId), snapshot, { merge: true });
      } catch (e) {
        console.warn('Firestore shift report mirror notice:', e);
      }
    }

    // Dispatch update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash_shift_report_saved', { detail: snapshot }));
    }

    return snapshot;
  },

  /**
   * Save current live shift snapshot explicitly from POS or Admin
   */
  async saveCurrentShiftSnapshot({ branchFilter = 'ALL_POS', terminalId = null } = {}) {
    const reportData = await this.generateFinancialReport({
      datePreset: 'today',
      branchFilter: terminalId || branchFilter,
      channelFilter: 'ALL',
      onlyOfflinePos: false,
    });
    return this.saveShiftReportSnapshot(reportData);
  },

  /**
   * Get all stored shift reports from IndexedDB, LocalStorage, and Firestore
   */
  async getStoredShiftReports({ branchFilter = 'ALL', dateKey = null } = {}) {
    const map = new Map();

    // 1. Read from IndexedDB reportSnapshots
    try {
      const dbSnapshots = await posIndexedDB.getAllReportSnapshots();
      (dbSnapshots || []).forEach(s => {
        if (s && s.id) map.set(s.id, s);
      });
    } catch (e) {}

    // 2. Read from localStorage
    try {
      const local = JSON.parse(localStorage.getItem(SHIFT_REPORTS_LOCAL_KEY) || '[]');
      (local || []).forEach(s => {
        if (s && s.id && !map.has(s.id)) map.set(s.id, s);
      });
    } catch (e) {}

    // 3. Read from Firestore shiftReports if online
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'shiftReports'));
        snap.forEach(d => {
          const data = d.data();
          if (data && d.id) {
            map.set(d.id, { id: d.id, ...data });
          }
        });
      } catch (e) {}
    }

    let results = Array.from(map.values());
    if (dateKey) {
      results = results.filter(s => s.date === dateKey || s.reportDate === dateKey);
    }
    if (branchFilter && branchFilter !== 'ALL' && branchFilter !== 'ALL_POS') {
      results = results.filter(s => s.terminalId === branchFilter || s.branchFilter === branchFilter);
    }
    return results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  /**
   * Format human readable date label
   */
  formatDateRangeLabel(preset, start, end) {
    if (preset === 'today') return `Today (${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    if (preset === 'tomorrow') {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      return `Tomorrow (${tmrw.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    }
    if (preset === 'yesterday') {
      const yday = new Date();
      yday.setDate(yday.getDate() - 1);
      return `Yesterday (${yday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    }
    if (preset === '7days') return 'Last 7 Days';
    if (preset === '30days') return 'Last 30 Days (Full History)';
    if (start && end) {
      return `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    return 'All Time History';
  },

  /**
   * Automated & Manual 1,000 Orders Local Storage & File Archival Engine
   */
  async checkAndTrigger1000OrdersBackup(forceManual = false) {
    try {
      const allOrders = await orderService.getOrders({ limitCount: 5000 });
      const totalCount = allOrders.length;
      
      const lastBackupCount = parseInt(localStorage.getItem(LAST_BACKUP_COUNT_KEY) || '0', 10);
      const currentMilestone = Math.floor(totalCount / 1000) * 1000;

      // Check if threshold crossed (e.g. 1000, 2000, 3000) or forceManual
      const shouldBackup = forceManual || (currentMilestone >= 1000 && currentMilestone > lastBackupCount);

      if (shouldBackup) {
        const checkpointTag = forceManual ? `snapshot-${totalCount}-orders` : `checkpoint-${currentMilestone}-orders`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const backupData = {
          metadata: {
            brand: 'Tech Wash Laundry Services',
            totalOrders: totalCount,
            checkpoint: checkpointTag,
            exportedAt: new Date().toISOString(),
            schemaVersion: '2.0-financial-audit',
          },
          orders: allOrders
        };

        // 1. Save snapshot in LocalStorage
        try {
          localStorage.setItem(`${BACKUP_STORAGE_PREFIX}${checkpointTag}`, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalOrders: totalCount,
            sample: allOrders.slice(0, 10),
          }));
          localStorage.setItem(LAST_BACKUP_COUNT_KEY, String(currentMilestone || totalCount));
        } catch (e) {
          console.warn('Local storage snapshot quota notice:', e);
        }

        // 2. Trigger automatic File Download (.JSON)
        this.downloadFile(
          JSON.stringify(backupData, null, 2),
          `techwash-orders-${checkpointTag}-${timestamp}.json`,
          'application/json'
        );

        // 3. Trigger automatic File Download (.CSV)
        const csvContent = this.convertOrdersToCSV(allOrders);
        this.downloadFile(
          csvContent,
          `techwash-orders-${checkpointTag}-${timestamp}.csv`,
          'text/csv;charset=utf-8;'
        );

        return {
          success: true,
          totalOrders: totalCount,
          checkpoint: checkpointTag,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        totalOrders: totalCount,
        nextMilestone: (Math.floor(totalCount / 1000) + 1) * 1000,
      };
    } catch (err) {
      console.error('Auto backup execution error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Helper to trigger native browser file download
   */
  downloadFile(content, fileName, mimeType) {
    if (typeof window === 'undefined') return;
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.warn('File download trigger error:', e);
    }
  },

  /**
   * Group and compile all saved POS and order billings date-wise
   * Returns sorted array of daily shift records with detailed financial breakdowns
   */
  async getDateWiseSavedShiftLedger({ 
    branchFilter = 'ALL', 
    channelFilter = 'POS_ONLY',
    onlyOfflinePos = true,
    limitDays = 90 
  } = {}) {
    let allOrders = [];
    try {
      allOrders = await orderService.getOrders({ limitCount: 3000 });
    } catch (e) {
      try {
        allOrders = await posIndexedDB.getAllOrders();
      } catch (err) {}
    }
    if (!Array.isArray(allOrders)) allOrders = [];
    
    // Group orders by date (YYYY-MM-DD)
    const dateGroups = {};

    allOrders.forEach(order => {
      // 1. Channel & Source Check (Strict POS Offline vs Online)
      const isPos = isPosOrder(order);
      const isExplicitPosOnly = onlyOfflinePos || channelFilter === 'POS_ONLY' || branchFilter === 'POS_ONLY' || branchFilter === 'ALL_POS';
      const isExplicitOnlineOnly = channelFilter === 'ONLINE_ONLY' || branchFilter === 'ONLINE_WEBSITE';

      if (isExplicitPosOnly && !isPos) return;
      if (isExplicitOnlineOnly && isPos) return;

      // 2. Specific Counter Terminal / Branch Check
      if (branchFilter && branchFilter !== 'ALL' && branchFilter !== 'POS_ONLY' && branchFilter !== 'ALL_POS' && branchFilter !== 'ONLINE_WEBSITE') {
        if (!isPos) return;
        const bKey = getOrderBranchKey(order);
        if (bKey !== branchFilter) return;
      }

      const rawDate = order.createdAt || order.created_at || order.orderDate || order.date || order.timestamp || order.pickupDate || order.schedule?.pickupDate;
      const orderDateObj = parseOrderDateSafe(rawDate) || (order.updatedAt ? parseOrderDateSafe(order.updatedAt) : new Date());
      const dateKey = getLocalDateKey(orderDateObj);

      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          dateKey,
          dateObj: orderDateObj,
          dateLabel: orderDateObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
          orders: [],
          totalBills: 0,
          grossBilled: 0,
          collected: 0,
          pendingDues: 0,
          cash: 0,
          upi: 0,
          card: 0,
          online: 0,
          pieces: 0,
          weightKg: 0,
        };
      }

      const billTotal = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
      const recAmount = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? billTotal : 0));
      const balAmount = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, billTotal - recAmount));

      const group = dateGroups[dateKey];
      group.orders.push(order);
      group.totalBills += 1;
      group.grossBilled += billTotal;
      group.collected += recAmount;
      group.pendingDues += balAmount;

      const pMethod = String(order.paymentMethod || 'CASH').toUpperCase();
      if (pMethod === 'CASH') group.cash += recAmount;
      else if (pMethod.includes('UPI') || pMethod.includes('QR')) group.upi += recAmount;
      else if (pMethod.includes('CARD') || pMethod.includes('POS')) group.card += recAmount;
      else group.online += recAmount;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(it => {
          group.pieces += Number(it.quantity) || 1;
        });
      }
      group.weightKg += Number(order.actualWeight || order.estimatedWeightKg || order.weightKg || 0);
    });

    // 3. Merge Stored Shift Snapshots from IndexedDB & Cloud
    try {
      const storedSnapshots = await this.getStoredShiftReports({ branchFilter });
      storedSnapshots.forEach(snap => {
        if (!snap || !snap.date) return;
        const dKey = snap.date;
        const existing = dateGroups[dKey];
        if (!existing || (existing.totalBills === 0 && (snap.totalBills > 0 || snap.ordersCount > 0))) {
          const snapDate = parseOrderDateSafe(snap.date) || new Date();
          dateGroups[dKey] = {
            dateKey: dKey,
            dateObj: snapDate,
            dateLabel: snap.dateRangeLabel || snapDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
            orders: snap.ordersSummary || [],
            totalBills: snap.totalBills || snap.ordersCount || 0,
            grossBilled: snap.grossBilled || snap.totalGrossBilled || 0,
            collected: snap.collected || snap.totalInflowCollections || 0,
            pendingDues: snap.pendingDues || snap.totalNetPendingDues || 0,
            cash: snap.metrics?.category1?.cashReceived || snap.cash || 0,
            upi: snap.metrics?.category1?.upiReceived || snap.upi || 0,
            card: snap.metrics?.category1?.cardReceived || snap.card || 0,
            online: snap.metrics?.category1?.onlineReceived || snap.online || 0,
            pieces: snap.metrics?.totalPiecesCount || snap.pieces || 0,
            weightKg: snap.metrics?.totalWeightKg || snap.weightKg || 0,
            isSnapshot: true,
          };
        }
      });
    } catch (e) {
      console.warn('[reportService] Stored shift snapshots merge notice:', e);
    }

    // 4. Always ensure Today's active shift is present in the ledger
    const todayObj = new Date();
    const todayKey = getLocalDateKey(todayObj);
    if (!dateGroups[todayKey]) {
      dateGroups[todayKey] = {
        dateKey: todayKey,
        dateObj: todayObj,
        dateLabel: todayObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        orders: [],
        totalBills: 0,
        grossBilled: 0,
        collected: 0,
        pendingDues: 0,
        cash: 0,
        upi: 0,
        card: 0,
        online: 0,
        pieces: 0,
        weightKg: 0,
      };
    }

    // Sort by date descending (newest first)
    const sortedDays = Object.values(dateGroups)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, limitDays);

    // 5. Persist each compiled day's shift report snapshot into IndexedDB for permanent offline retrieval
    sortedDays.forEach(day => {
      posIndexedDB.saveReportSnapshot({
        id: `shift_${day.dateKey}_${branchFilter || 'ALL'}`,
        snapshotId: `shift_${day.dateKey}_${branchFilter || 'ALL'}`,
        date: day.dateKey,
        reportDate: day.dateKey,
        terminalId: branchFilter,
        branchFilter,
        dateRangeLabel: day.dateLabel,
        totalBills: day.totalBills,
        grossBilled: day.grossBilled,
        collected: day.collected,
        pendingDues: day.pendingDues,
        cash: day.cash,
        upi: day.upi,
        card: day.card,
        online: day.online,
        pieces: day.pieces,
        weightKg: day.weightKg,
        ordersCount: day.orders.length,
        savedAt: new Date().toISOString(),
      }).catch(() => {});
    });

    return sortedDays;
  },

  /**
   * Convert Orders list to structured CSV for Excel / Audit
   */
  convertOrdersToCSV(orders = []) {
    const headers = [
      'Order ID',
      'Order Number',
      'Date & Time',
      'Channel / Source',
      'Store Branch / Terminal',
      'Customer Name',
      'Customer Mobile',
      'Customer Address',
      'Service Name',
      'Weighed Kg',
      'Garments & Clothes Breakdown',
      'Subtotal (INR)',
      'Express Fee (INR)',
      'Grand Total (INR)',
      'Amount Received (INR)',
      'Balance Due (INR)',
      'Payment Mode',
      'Payment Status',
      'Order Stage',
      'Notes'
    ];

    const rows = orders.map(ord => {
      const pin = parsePinToPinItems(ord);
      const itemsDetail = pin.textSummary || (ord.items || [])
        .map(it => `${it.quantity || 1}x ${it.name}`)
        .join(' | ');

      const total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
      const received = Number(ord.receivedAmount !== undefined ? ord.receivedAmount : (ord.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(ord.balanceAmount !== undefined ? ord.balanceAmount : Math.max(0, total - received));

      return [
        `"${ord.id || ''}"`,
        `"${ord.orderNumber || ord.id || ''}"`,
        `"${new Date(ord.createdAt || Date.now()).toLocaleString('en-IN')}"`,
        `"${ord.orderSource || (ord.isWalkIn ? 'OFFLINE_POS' : 'ONLINE_WEBSITE')}"`,
        `"${ord.storeBranch || ord.terminalCode || 'Main Hub'}"`,
        `"${(ord.customerName || ord.customer?.name || 'Customer').replace(/"/g, '""')}"`,
        `"${ord.phone || ord.customer?.phone || ''}"`,
        `"${(ord.address || ord.customer?.address || '').replace(/"/g, '""')}"`,
        `"${ord.serviceName || ord.service || 'Garment Care'}"`,
        `"${ord.actualWeight || ord.estimatedWeightKg || ord.weightKg || ''}"`,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        total - (ord.priceSnapshot?.expressFee || 0),
        ord.priceSnapshot?.expressFee || 0,
        total,
        received,
        balance,
        `"${ord.paymentMethod || 'CASH'}"`,
        `"${ord.paymentStatus || (balance === 0 ? 'PAID' : 'PENDING')}"`,
        `"${ord.customerStage || ord.status || 'CONFIRMED'}"`,
        `"${(ord.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
