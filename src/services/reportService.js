/**
 * Financial Reporting, Settlement Reconciliation & Archival Service for Tech Wash
 * Handles 1-Day, 30-Day, Custom Date Range, Branch/Terminal Filtering,
 * Two-Category Reconciliation Accounting, and Automated 1,000-Order Backups.
 */

import { orderService, getOrderBranchKey } from './orderService.js';

const BACKUP_STORAGE_PREFIX = 'techwash_backup_checkpoint_';
const LAST_BACKUP_COUNT_KEY = 'techwash_last_backup_order_count';

export const parseOrderDateSafe = (val) => {
  if (!val) return new Date();
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    return val.toDate();
  }
  if (typeof val === 'string') {
    // Check format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const isSameCalendarDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = parseOrderDateSafe(date1);
  const d2 = parseOrderDateSafe(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const isPosOrder = (order) => {
  if (!order) return false;
  if (order.isWalkIn === true) return true;
  if (order.orderSource === 'OFFLINE_POS' || order.orderSource === 'POS') return true;
  if (order.terminalCode || order.terminalId) return true;
  if (order.manualBillNumber) return true;
  const storeBranch = (order.storeBranch || '').toLowerCase();
  if (storeBranch.includes('counter') || storeBranch.includes('pos-') || storeBranch.includes('pos ') || storeBranch.includes('flagship') || storeBranch.includes('express')) return true;
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
    const allOrders = await orderService.getOrders({ limitCount: 2000 });

    // Determine filter date boundaries
    const now = new Date();
    let start = null;
    let end = null;
    let dateRangeLabel = 'Today';

    if (datePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Today (${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === 'tomorrow') {
      const tmrw = new Date(now);
      tmrw.setDate(tmrw.getDate() + 1);
      start = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 0, 0, 0, 0);
      end = new Date(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Tomorrow (${tmrw.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === 'yesterday') {
      const yday = new Date(now);
      yday.setDate(yday.getDate() - 1);
      start = new Date(yday.getFullYear(), yday.getMonth(), yday.getDate(), 0, 0, 0, 0);
      end = new Date(yday.getFullYear(), yday.getMonth(), yday.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Yesterday (${yday.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})`;
    } else if (datePreset === '7days') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      start = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Last 7 Days (${past7.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`;
    } else if (datePreset === '30days') {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 29);
      start = new Date(past30.getFullYear(), past30.getMonth(), past30.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Last 30 Days (${past30.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`;
    } else if (datePreset === 'all') {
      start = null;
      end = null;
      dateRangeLabel = 'All Master History';
    } else if ((datePreset === 'single' || datePreset === 'specific') && targetDate) {
      const t = parseOrderDateSafe(targetDate);
      start = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0, 0);
      end = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999);
      dateRangeLabel = `Date: ${t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else if (datePreset === 'custom' && (startDate || endDate)) {
      if (startDate) {
        const s = parseOrderDateSafe(startDate);
        start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
      }
      if (endDate) {
        const e = parseOrderDateSafe(endDate);
        end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999);
      }
      dateRangeLabel = `Custom Range (${startDate || 'Start'} to ${endDate || 'Now'})`;
    }

    // Filter orders
    const filteredOrders = allOrders.filter(order => {
      // 1. Date Check (Evaluate createdAt and scheduled pickupDate)
      const orderDate = parseOrderDateSafe(order.createdAt || order.pickupDate || order.schedule?.pickupDate);
      const scheduleDate = order.schedule?.pickupDate ? parseOrderDateSafe(order.schedule.pickupDate) : null;
      
      let matchesDate = true;
      if (start && end) {
        const inCreatedRange = orderDate >= start && orderDate <= end;
        const inScheduleRange = scheduleDate && scheduleDate >= start && scheduleDate <= end;
        matchesDate = inCreatedRange || inScheduleRange;
      }
      if (!matchesDate) return false;

      // 2. Channel & Source Filter (Strict POS Offline vs Online)
      const isPos = isPosOrder(order);
      const isExplicitPosOnly = onlyOfflinePos || channelFilter === 'POS_ONLY' || branchFilter === 'POS_ONLY' || branchFilter === 'ALL_POS';
      const isExplicitOnlineOnly = channelFilter === 'ONLINE_ONLY' || branchFilter === 'ONLINE_WEBSITE';

      if (isExplicitPosOnly && !isPos) return false;
      if (isExplicitOnlineOnly && isPos) return false;

      // 3. Counter Terminal Specific Branch Check
      if (branchFilter && branchFilter !== 'ALL' && branchFilter !== 'POS_ONLY' && branchFilter !== 'ALL_POS' && branchFilter !== 'ONLINE_WEBSITE') {
        if (!isPos) return false;
        const bKey = getOrderBranchKey(order);
        if (bKey !== branchFilter) return false;
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

    return {
      datePreset,
      dateRangeLabel: this.formatDateRangeLabel(datePreset, start, end),
      startDate: start ? start.toISOString() : null,
      endDate: end ? end.toISOString() : null,
      generatedAt: new Date().toISOString(),
      branchFilter,
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
      }
    };
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
    const allOrders = await orderService.getOrders({ limitCount: 3000 });
    
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

      const orderDateObj = parseOrderDateSafe(order.createdAt || order.pickupDate || order.schedule?.pickupDate);
      const year = orderDateObj.getFullYear();
      const month = String(orderDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(orderDateObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

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

    // Sort by date descending (newest first)
    const sortedDays = Object.values(dateGroups)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, limitDays);

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
      const itemsDetail = (ord.items || [])
        .map(it => `${it.quantity || 1}x ${it.name} (₹${it.unitPrice || it.price || 0})`)
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
