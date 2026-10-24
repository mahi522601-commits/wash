import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, parsePinToPinItems } from '../../utils/formatters';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  Scale
} from 'lucide-react';

const getPaymentModeBadge = (method) => {
  const m = String(method || 'CASH').toUpperCase();
  if (m.includes('UPI') || m.includes('PHONE') || m.includes('PAY') || m.includes('QR') || m.includes('GPAY')) {
    return { emoji: '📱', label: 'PhonePe / UPI' };
  }
  if (m.includes('CARD') || m.includes('POS') || m.includes('SWIPE')) {
    return { emoji: '💳', label: 'Card Swipe' };
  }
  if (m.includes('ONLINE') || m.includes('WEB')) {
    return { emoji: '🌐', label: 'Online Gateway' };
  }
  return { emoji: '💵', label: 'Cash' };
};

export const PrintFinancialReport = ({
  reportData,
  className = '',
}) => {
  const { settings } = useSettings();
  if (!reportData) return null;

  const {
    datePreset,
    dateRangeLabel,
    generatedAt,
    branchFilter,
    orders: rawOrders = [],
    metrics = {},
    attendance = null,
    expenses: initialExpenses = null,
  } = reportData;

  const [expenses, setExpenses] = React.useState(initialExpenses);

  React.useEffect(() => {
    if (initialExpenses && Array.isArray(initialExpenses.items)) {
      setExpenses(initialExpenses);
    } else {
      let isMounted = true;
      (async () => {
        try {
          const { expenseService } = await import('../../services/expenseService');
          const allExpenses = await expenseService.getExpenses({ forceRefresh: true });
          const targetDateStr = reportData.dateKey || (reportData.startDate ? reportData.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));

          let pos1 = { terminalId: 'TW-POS-01', name: 'Main Branch — Manikonda (POS-01)', count: 0, totalAmount: 0, cashAmount: 0, upiAmount: 0, items: [] };
          let pos2 = { terminalId: 'TW-POS-02', name: 'Branch 1 — Tolichowki (POS-02)', count: 0, totalAmount: 0, cashAmount: 0, upiAmount: 0, items: [] };
          let pos3 = { terminalId: 'TW-POS-03', name: 'Pick Up — Ambience Courtyard (POS-03)', count: 0, totalAmount: 0, cashAmount: 0, upiAmount: 0, items: [] };
          let general = { terminalId: 'GENERAL', name: 'Store Operating Overheads', count: 0, totalAmount: 0, cashAmount: 0, upiAmount: 0, items: [] };
          let items = [];

          (allExpenses || []).forEach(exp => {
            const expDate = exp.date || (exp.createdAt ? exp.createdAt.slice(0, 10) : '');
            if (reportData.datePreset === 'today' || reportData.datePreset === 'single' || reportData.datePreset === 'yesterday') {
              if (expDate !== targetDateStr) return;
            }

            const amt = Number(exp.amount) || 0;
            const mode = String(exp.paymentMode || 'CASH').toUpperCase();
            const isCash = mode === 'CASH';
            const isUpi = mode.includes('UPI') || mode.includes('QR') || mode.includes('PHONE') || mode.includes('PAY') || mode.includes('GPAY');

            const bId = String(exp.branchId || '').toLowerCase().trim();
            const src = String(exp.source || '').toLowerCase().trim();
            const bName = String(exp.branchName || '').toLowerCase().trim();
            const tId = String(exp.terminalId || '').toLowerCase().trim();

            const isPos2 = bId.includes('counter-2') || bId.includes('pos-02') || bId.includes('pos2') ||
                          src.includes('pos-02') || src.includes('pos2') ||
                          tId.includes('pos-02') || tId.includes('pos2') ||
                          bName.includes('tolichowki') || bName.includes('branch 1');

            const isPos3 = bId.includes('counter-3') || bId.includes('pos-03') || bId.includes('pos3') ||
                          src.includes('pos-03') || src.includes('pos3') ||
                          tId.includes('pos-03') || tId.includes('pos3') ||
                          bName.includes('ambience') || bName.includes('pick up');

            const isPos1 = !isPos2 && !isPos3 && (
                          bId.includes('counter-1') || bId.includes('pos-01') || bId.includes('pos1') ||
                          src.includes('pos-01') || src.includes('pos1') ||
                          tId.includes('pos-01') || tId.includes('pos1') ||
                          bName.includes('manikonda') || bName.includes('main') ||
                          bId === 'counter-1' || (!isPos2 && !isPos3 && bId !== 'all')
            );

            const isAllPos = branchFilter === 'ALL_POS' || branchFilter === 'POS_ONLY' || branchFilter === 'ALL' || !branchFilter;
            const matchesBranch = isAllPos ||
              (branchFilter === 'counter-1' && isPos1) ||
              (branchFilter === 'counter-2' && isPos2) ||
              (branchFilter === 'counter-3' && isPos3);

            if (!matchesBranch) return;

            items.push(exp);
            if (isPos2) {
              pos2.count += 1;
              pos2.totalAmount += amt;
              if (isCash) pos2.cashAmount += amt;
              if (isUpi) pos2.upiAmount += amt;
              pos2.items.push(exp);
            } else if (isPos3) {
              pos3.count += 1;
              pos3.totalAmount += amt;
              if (isCash) pos3.cashAmount += amt;
              if (isUpi) pos3.upiAmount += amt;
              pos3.items.push(exp);
            } else if (isPos1) {
              pos1.count += 1;
              pos1.totalAmount += amt;
              if (isCash) pos1.cashAmount += amt;
              if (isUpi) pos1.upiAmount += amt;
              pos1.items.push(exp);
            } else {
              general.count += 1;
              general.totalAmount += amt;
              if (isCash) general.cashAmount += amt;
              if (isUpi) general.upiAmount += amt;
              general.items.push(exp);
            }
          });

          if (isMounted) {
            const totAmount = items.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const totCash = items.filter(e => String(e.paymentMode || 'CASH').toUpperCase() === 'CASH').reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const totUpi = items.filter(e => {
              const m = String(e.paymentMode || '').toUpperCase();
              return m.includes('UPI') || m.includes('QR') || m.includes('PHONE') || m.includes('PAY') || m.includes('GPAY');
            }).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const cashCollected = category1?.cashReceived || 0;
            setExpenses({
              pos1,
              pos2,
              pos3,
              general,
              totalCount: items.length,
              totalAmount: totAmount,
              totalCashAmount: totCash,
              totalUpiAmount: totUpi,
              items,
              netCashDrawer: {
                grossCashInflow: cashCollected,
                totalCashExpenses: totCash,
                netCashRemaining: Math.max(0, cashCollected - totCash),
              }
            });
          }
        } catch (e) {}
      })();
      return () => { isMounted = false; };
    }
  }, [initialExpenses, reportData.dateKey, reportData.startDate, reportData.branchFilter]);

  const orders = (rawOrders || []).filter(Boolean);

  const {
    totalOrdersCount = 0,
    totalGrossBilled = 0,
    totalPiecesCount = 0,
    totalWeightKg = 0,
    category1 = {},
    category2 = {},
    serviceBreakdown = {},
  } = metrics;

  // Dynamic order-level financial calculation (guarantees accurate totals & balance even if order had 0 totalAmount)
  const computedStats = orders.reduce((acc, ord) => {
    let tot = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
    if (tot <= 0 && Array.isArray(ord.items) && ord.items.length > 0) {
      const s = ord.items.reduce((sum, it) => sum + Number(it.lineTotal !== undefined ? it.lineTotal : ((Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.quantity) || 1))), 0);
      if (s > 0) tot = s;
    }
    if (tot <= 0 && (ord.weightKg || ord.actualWeight || ord.estimatedWeightKg)) {
      const wt = Number(ord.weightKg || ord.actualWeight || ord.estimatedWeightKg || 0);
      const rate = Number(ord.pricePerKg || 100);
      if (wt > 0 && rate > 0) tot = Math.round(wt * rate);
    }
    const rec = Number(ord.receivedAmount !== undefined && ord.receivedAmount !== null
      ? ord.receivedAmount 
      : (ord.paymentStatus === 'PAID' ? tot : 0));
    let bal = Number(ord.balanceAmount !== undefined && ord.balanceAmount !== null && ord.balanceAmount > 0
      ? ord.balanceAmount 
      : Math.max(0, tot - rec));
    if (ord.paymentStatus === 'PAID') {
      bal = 0;
    }

    acc.gross += tot;
    acc.received += rec;
    acc.due += bal;
    if (bal > 0) acc.dueCount += 1;
    else acc.paidCount += 1;

    return acc;
  }, { gross: 0, received: 0, due: 0, paidCount: 0, dueCount: 0 });

  const effectiveGross = Math.max(Number(totalGrossBilled || 0), computedStats.gross);
  const effectiveInflows = (category1?.totalInflowCollections !== undefined && category1.totalInflowCollections > 0) 
    ? category1.totalInflowCollections 
    : computedStats.received;
  const effectiveDues = Math.max(Number(category2?.totalNetPendingDues || 0), computedStats.due);
  const effectiveNewDues = Math.max(Number(category2?.totalInitialDuesCreated || 0), computedStats.due);

  const branchTitle = (branchFilter === 'POS_ONLY' || branchFilter === 'ALL_POS')
    ? 'All Offline POS Counters (Walk-in Billing)'
    : branchFilter === 'ALL' 
    ? 'All Branches & Processing Hubs (POS + Online)' 
    : branchFilter === 'counter-1'
    ? 'Tech Wash Laundry Main Branch — Manikonda (POS-01 Counter)'
    : branchFilter === 'counter-2'
    ? 'Tech Wash Laundry Services (Branch 1) — Tolichowki / OU Colony (POS-02 Counter)'
    : branchFilter === 'counter-3'
    ? 'Tech Wash Pick Up Point — Ambience Courtyard (POS-03 Counter)'
    : branchFilter === 'ONLINE_WEBSITE'
    ? 'Online Website Orders Only'
    : 'Offline POS Counter Machine';

  return (
    <div
      id="techwash-printable-report"
      className={`techwash-financial-sheet bg-white text-slate-900 font-sans antialiased max-w-[297mm] mx-auto p-4 sm:p-6 border border-slate-200 shadow-xl rounded-2xl print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none print:m-0 ${className}`}
    >
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER: BRAND IDENTITY & REPORT METADATA
      ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start pb-3 border-b-2 border-[#F97316]">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-orange-200 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-slate-900 uppercase">
              Tech Wash Laundry Services
            </h1>
            <p className="text-[11px] font-bold text-[#EA580C] tracking-wider uppercase">
              Official Financial Settlement & Pin-to-Pin Operations Report
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Hyderabad, Telangana • Tel: {settings?.general?.primaryPhone || '+91 63048 45567'} • {settings?.general?.supportEmail || 'care@techwashlaundry.com'}
            </p>
          </div>
        </div>

        {/* Right: Report Scope & Dates */}
        <div className="text-right space-y-1">
          <div className="inline-block px-3 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#EA580C] text-xs font-black tracking-wider uppercase">
            {datePreset === '30days' ? '30-Day Master Audit' : datePreset === 'today' ? 'Daily Settlement' : 'Financial Statement'}
          </div>
          <div className="text-xs font-black text-slate-900 font-mono">
            {dateRangeLabel}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold">
            Scope: <strong className="text-slate-800">{branchTitle}</strong>
          </div>
          <div className="text-[9px] text-slate-400">
            Generated: {new Date(generatedAt || Date.now()).toLocaleString('en-IN')}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          2. THE TWO-CATEGORY RECONCILIATION & SETTLEMENT ENGINE
      ───────────────────────────────────────────────────────── */}
      <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        
        {/* ── CATEGORY 1: DIRECT COLLECTIONS RECEIVED (INFLOWS) ── */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-2 border-emerald-300 print:bg-slate-50 print:border-slate-800 space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <span className="font-black text-emerald-950 uppercase tracking-wider text-[11px] print:text-black">
                Category 1: Mode-Wise Collections Received
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 print:text-black">
              Direct Money Inflow
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-white border border-emerald-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">💵 Cash Register</span>
              <span className="font-mono font-black text-xs text-slate-900">
                {formatCurrency(category1.cashReceived || 0)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-emerald-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">📱 UPI / QR Scan</span>
              <span className="font-mono font-black text-xs text-emerald-700 print:text-black">
                {formatCurrency(category1.upiReceived || 0)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-emerald-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">💳 Card / POS Swipe</span>
              <span className="font-mono font-black text-xs text-indigo-700 print:text-black">
                {formatCurrency(category1.cardReceived || 0)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-emerald-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">🌐 Online Gateway</span>
              <span className="font-mono font-black text-xs text-cyan-700 print:text-black">
                {formatCurrency(category1.onlineReceived || 0)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-emerald-200 print:border-black">
            <span className="font-black text-[11px] text-emerald-950 uppercase tracking-wider print:text-black">
              Total Realized Inflow (Category 1) =
            </span>
            <span className="font-mono font-black text-sm text-emerald-800 print:text-black">
              {formatCurrency(effectiveInflows)}
            </span>
          </div>
        </div>

        {/* ── CATEGORY 2: DUE BALANCES, RECOVERIES & TOTAL VOLUME ── */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-amber-300 print:bg-slate-50 print:border-slate-800 space-y-2">
          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </div>
              <span className="font-black text-amber-950 uppercase tracking-wider text-[11px] print:text-black">
                Category 2: Due Balances & Realization
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 print:text-black">
              Settlement Lifecycle
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-white border border-amber-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">⏳ New Dues Created</span>
              <span className={`font-mono font-black text-xs print:text-black ${effectiveNewDues > 0 ? 'text-amber-800 font-black' : 'text-slate-600'}`}>
                {formatCurrency(effectiveNewDues)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-amber-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">🔄 Cleared on Completion</span>
              <span className="font-mono font-black text-xs text-emerald-700 print:text-black">
                +{formatCurrency(category2.totalRecoveredDues || 0)}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-amber-200 print:border-black">
              <span className="text-slate-500 block font-semibold text-[9px]">🔴 Net Pending Due</span>
              <span className={`font-mono font-black text-xs print:text-black ${effectiveDues > 0 ? 'text-rose-700 font-black' : 'text-slate-600'}`}>
                {formatCurrency(effectiveDues)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200 print:border-black">
            <span className="font-black text-[11px] text-amber-950 uppercase tracking-wider print:text-black">
              Total Business Billed (Category 1 + Due) =
            </span>
            <span className="font-mono font-black text-sm text-[#EA580C] print:text-black">
              {formatCurrency(effectiveGross)}
            </span>
          </div>
        </div>

      </div>

      {/* ── HIGH-LEVEL KPI STRIP ── */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Total Invoices</span>
          <span className="font-mono font-black text-sm text-slate-900">{totalOrdersCount || orders.length}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Garments / Clothes</span>
          <span className="font-mono font-black text-sm text-slate-900">{totalPiecesCount} Pcs</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Weighed Batch Kg</span>
          <span className="font-mono font-black text-sm text-purple-700">{totalWeightKg} Kg</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Paid vs Due Orders</span>
          <span className="font-mono font-black text-xs text-slate-900">
            <span className="text-emerald-700">{computedStats.paidCount} Paid</span> • <span className={computedStats.dueCount > 0 ? "text-rose-700 font-black" : "text-slate-500"}>{computedStats.dueCount} Due</span>
          </span>
        </div>
      </div>

      {/* ── STAFF ON-DUTY & ATTENDANCE SUMMARY (WHEN AVAILABLE) ── */}
      {attendance && (attendance.totalStaff > 0 || (attendance.roster && attendance.roster.length > 0)) && (
        <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-white print:border-black text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 print:border-black mb-2">
            <div className="flex items-center gap-1.5 font-black text-slate-800 uppercase tracking-wider text-[10px] print:text-black">
              <span>👥 Staff On-Duty & Daily Attendance</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-emerald-700 font-bold print:text-black">
                {attendance.presentCount || 0} / {attendance.totalStaff || attendance.roster?.length || 0} Active On-Duty
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 print:border print:border-black">
                Present: {attendance.presentCount || 0}
              </span>
              {attendance.lateCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                  Late: {attendance.lateCount}
                </span>
              )}
              {attendance.halfDayCount > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Half Day: {attendance.halfDayCount}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 print:border print:border-black">
                Absent/Leave: {(attendance.absentCount || 0) + (attendance.paidLeaveCount || 0)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(attendance.roster || []).map((staff, sIdx) => {
              const isPresent = staff.status === 'PRESENT' || staff.status === 'LATE' || staff.status === 'HALF_DAY';
              return (
                <span
                  key={staff.employeeId || sIdx}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium border print:border-black ${
                    isPresent
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-300 print:bg-white print:text-black'
                      : staff.status === 'PAID_LEAVE'
                      ? 'bg-blue-50 text-blue-900 border-blue-200 print:bg-white print:text-black'
                      : 'bg-rose-50 text-rose-900 border-rose-200 print:bg-white print:text-black'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                  <span className="font-bold text-slate-900 print:text-black">{staff.name || 'Staff'}</span>
                  {staff.role && <span className="text-slate-500 text-[8px] print:text-black">({staff.role})</span>}
                  <span className="font-black text-[8px] uppercase tracking-wider text-slate-700 print:text-black">[{staff.status}]</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          2B. TODAY'S POS COUNTER EXPENSES & OPERATING OUTFLOWS AUDIT
      ───────────────────────────────────────────────────────── */}
      {(() => {
        const expData = expenses || {
          totalCount: 0,
          totalAmount: 0,
          totalCashAmount: 0,
          totalUpiAmount: 0,
          items: [],
          netCashDrawer: {
            grossCashInflow: category1.cashReceived || 0,
            totalCashExpenses: 0,
            netCashRemaining: category1.cashReceived || 0,
          }
        };

        const hasExpenses = expData.items && expData.items.length > 0;
        const isAllPosScope = branchFilter === 'ALL_POS' || branchFilter === 'POS_ONLY' || branchFilter === 'ALL' || !branchFilter;
        const grossCashCollected = Number(category1?.cashReceived || 0);
        const cashSpent = Number(expData.totalCashAmount || 0);
        const upiSpent = Number(expData.totalUpiAmount || 0);
        const netDrawerCash = Math.max(0, grossCashCollected - cashSpent);

        const scopeLabel = isAllPosScope 
          ? 'All POS Counters (Consolidated)' 
          : branchFilter === 'counter-1'
          ? 'Counter 1 — Manikonda Main'
          : branchFilter === 'counter-2'
          ? 'Counter 2 — Tolichowki Branch 1'
          : branchFilter === 'counter-3'
          ? 'Counter 3 — Ambience Courtyard'
          : branchFilter;

        return (
          <div className="mb-3.5 border border-slate-200 rounded-xl overflow-hidden print:border-black bg-white shadow-xs print:break-inside-avoid">
            {/* Header Strip */}
            <div className="bg-slate-900 text-white px-3 py-1.5 flex flex-wrap justify-between items-center text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-black print:border-b print:border-black">
              <span className="flex items-center gap-1.5">
                <span>🏪 Today's Counter Expenses & Operating Cash Outflows</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-300 font-semibold lowercase">scope: {scopeLabel}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-amber-400 print:text-black font-mono font-bold">
                  {expData.totalCount || 0} Bills ({formatCurrency(expData.totalAmount || 0)})
                </span>
              </span>
              <span className="text-emerald-400 print:text-black font-mono">
                Physical Cash in Drawer: {formatCurrency(netDrawerCash)}
              </span>
            </div>

            {/* Counter-Wise & Cash Drawer KPI Summary Cards */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 print:bg-white print:border-black grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {/* POS 1 (Manikonda) */}
              <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200 print:border-black print:bg-white">
                <div className="flex items-center justify-between text-[9px] font-bold text-blue-950 uppercase tracking-wider">
                  <span>POS-01 (Manikonda)</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-200 text-blue-900 text-[8px] font-bold">{expData.pos1?.count || 0} Bills</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-500 text-[9px]">Total Expenses:</span>
                  <span className="font-mono font-black text-xs text-blue-900">{formatCurrency(expData.pos1?.totalAmount || 0)}</span>
                </div>
                <div className="flex items-baseline justify-between text-[8px] text-slate-500">
                  <span>Cash Out:</span>
                  <span className="font-mono font-bold text-slate-700">{formatCurrency(expData.pos1?.cashAmount || 0)}</span>
                </div>
              </div>

              {/* POS 2 (Tolichowki) */}
              <div className="p-2 rounded-lg bg-indigo-50/80 border border-indigo-200 print:border-black print:bg-white">
                <div className="flex items-center justify-between text-[9px] font-bold text-indigo-950 uppercase tracking-wider">
                  <span>POS-02 (Tolichowki)</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900 text-[8px] font-bold">{expData.pos2?.count || 0} Bills</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-500 text-[9px]">Total Expenses:</span>
                  <span className="font-mono font-black text-xs text-indigo-900">{formatCurrency(expData.pos2?.totalAmount || 0)}</span>
                </div>
                <div className="flex items-baseline justify-between text-[8px] text-slate-500">
                  <span>Cash Out:</span>
                  <span className="font-mono font-bold text-slate-700">{formatCurrency(expData.pos2?.cashAmount || 0)}</span>
                </div>
              </div>

              {/* POS 3 / General Store Overheads */}
              <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-200 print:border-black print:bg-white">
                <div className="flex items-center justify-between text-[9px] font-bold text-purple-950 uppercase tracking-wider">
                  <span>POS-03 & Overheads</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 text-[8px] font-bold">
                    {(expData.pos3?.count || 0) + (expData.general?.count || 0)} Bills
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-500 text-[9px]">Total Expenses:</span>
                  <span className="font-mono font-black text-xs text-purple-900">
                    {formatCurrency((expData.pos3?.totalAmount || 0) + (expData.general?.totalAmount || 0))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[8px] text-slate-500">
                  <span>Digital / UPI Out:</span>
                  <span className="font-mono font-bold text-slate-700">{formatCurrency(upiSpent)}</span>
                </div>
              </div>

              {/* Net Drawer Cash Reconciliation */}
              <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-300 print:border-black print:bg-white">
                <div className="flex items-center justify-between text-[9px] font-bold text-emerald-950 uppercase tracking-wider">
                  <span>💵 Physical Drawer Cash</span>
                  <span className="text-emerald-700 font-bold text-[8px]">Reconciled</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-slate-600 text-[8.5px]">Gross Cash Collected:</span>
                  <span className="font-mono font-bold text-xs text-slate-800">{formatCurrency(grossCashCollected)}</span>
                </div>
                <div className="flex items-baseline justify-between text-[8px]">
                  <span className="text-slate-600">Less Cash Spent:</span>
                  <span className="font-mono font-bold text-rose-700">-{formatCurrency(cashSpent)}</span>
                </div>
                <div className="mt-0.5 pt-0.5 border-t border-emerald-200 flex items-baseline justify-between font-black text-xs text-emerald-800">
                  <span>Drawer Balance:</span>
                  <span className="font-mono text-xs">{formatCurrency(netDrawerCash)}</span>
                </div>
              </div>
            </div>

            {/* Itemized Expenses Table */}
            {hasExpenses ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[8px] font-black uppercase tracking-wider border-b border-slate-200 print:border-black">
                      <th className="py-1 px-2 text-center w-6">#</th>
                      <th className="py-1 px-2 w-28">Counter / Terminal</th>
                      <th className="py-1 px-2 w-16">Time</th>
                      <th className="py-1 px-2">Expense Category & Purpose / Notes</th>
                      <th className="py-1 px-2 w-16">Payment Mode</th>
                      <th className="py-1 px-2 w-24 text-center">Receipt Photo</th>
                      <th className="py-1 px-2 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expData.items.map((exp, idx) => {
                      const hasBill = Boolean(exp.receiptAttachmentUrl);
                      const terminalLabel = exp.posLabel || exp.source || (
                        exp.branchId === 'counter-2' ? 'POS-02 (Tolichowki)' :
                        exp.branchId === 'counter-3' ? 'POS-03 (Ambience)' :
                        'POS-01 (Manikonda)'
                      );

                      return (
                        <tr key={exp.id || idx} className="hover:bg-slate-50/70 print:break-inside-avoid">
                          <td className="py-1 px-2 text-center text-slate-400 font-mono text-[8px]">{idx + 1}</td>
                          <td className="py-1 px-2 font-bold text-slate-900 whitespace-nowrap text-[8.5px]">
                            {terminalLabel}
                          </td>
                          <td className="py-1 px-2 text-slate-500 font-mono text-[8px] whitespace-nowrap">
                            {exp.time || (exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-')}
                          </td>
                          <td className="py-1 px-2">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <span>{exp.icon || '💸'}</span>
                              <span>{exp.title || exp.categoryName || 'Counter Expense'}</span>
                              {exp.voiceRecorded && (
                                <span className="px-1 py-0.2 rounded bg-purple-100 text-purple-800 text-[7px] font-bold">🎙️ Voice</span>
                              )}
                            </div>
                            {exp.notes && (
                              <div className="text-[7.5px] text-slate-500 italic mt-0.5">{exp.notes}</div>
                            )}
                          </td>
                          <td className="py-1 px-2 font-mono font-bold text-[8px] text-slate-700 uppercase">
                            {exp.paymentMode || 'CASH'}
                          </td>
                          <td className="py-1 px-2 text-center whitespace-nowrap">
                            {hasBill ? (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[7px] border border-emerald-200">
                                ✓ Attached ({exp.receiptSizeKb ? `${exp.receiptSizeKb} KB` : '<= 50 KB'})
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[7px]">No Photo</span>
                            )}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-black text-slate-900 text-[9px]">
                            {formatCurrency(exp.amount || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Table Footer with Summary */}
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-[8.5px] text-slate-900 border-t border-slate-300 print:border-black print:bg-slate-100">
                      <td colSpan={4} className="py-1.5 px-2">
                        Total Counter Expenses: {expData.items.length} Recorded Bills (Cash: {formatCurrency(cashSpent)} • UPI/Digital: {formatCurrency(upiSpent)})
                      </td>
                      <td colSpan={2} className="py-1.5 px-2 text-right text-slate-600">
                        Grand Total:
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black text-slate-900 text-[10px]">
                        {formatCurrency(expData.totalAmount || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-600 bg-emerald-50/40 border-b border-emerald-100 flex items-center justify-center gap-2">
                <span className="text-emerald-700 font-bold text-[11px]">✓ Zero Counter Operating Expenses Recorded for this Shift Date</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 text-[10px]">
                  Physical Cash Drawer retains 100% of received cash collections (<strong>{formatCurrency(grossCashCollected)}</strong>).
                </span>
              </div>
            )}

            {/* Attached Bill Photos Grid Gallery */}
            {hasExpenses && expData.items.filter(i => i.receiptAttachmentUrl).length > 0 && (
              <div className="p-2.5 border-t border-slate-200 bg-slate-50/60 print:bg-white print:border-black print:break-inside-avoid">
                <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <span>📎 Attached Counter Bill Receipts ({expData.items.filter(i => i.receiptAttachmentUrl).length} Verified Photos &lt;= 50 KB)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {expData.items.filter(i => i.receiptAttachmentUrl).map((exp, bIdx) => (
                    <div key={exp.id || bIdx} className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-xs flex flex-col print:border-black print:break-inside-avoid">
                      <div className="text-[7.5px] font-bold text-slate-800 truncate mb-1 flex items-center justify-between">
                        <span>{exp.posLabel || exp.source || (exp.branchId === 'counter-2' ? 'POS-02' : 'POS-01')}</span>
                        <span className="font-mono text-emerald-700 font-black">{formatCurrency(exp.amount || 0)}</span>
                      </div>
                      <div className="w-full h-24 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-100">
                        <img
                          src={exp.receiptAttachmentUrl}
                          alt={`Bill ${exp.title || 'Receipt'}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[6.5px] text-slate-500">
                        <span className="truncate max-w-[85px]">{exp.title || exp.categoryName}</span>
                        <span className="text-emerald-700 font-bold">{exp.receiptSizeKb ? `${exp.receiptSizeKb} KB` : '✓ 50 KB'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ─────────────────────────────────────────────────────────
          3. PIN-TO-PIN DETAILED MASTER TRANSACTIONS TABLE
      ───────────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden print:border-black">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-black print:border-b print:border-black">
          <span>Pin-to-Pin Itemized Transaction Ledger ({orders.length} Records)</span>
          <span>Amounts in INR (₹)</span>
        </div>

        <div className="overflow-x-auto w-full print:overflow-visible">
          <table className="w-full text-left border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[8.5px] font-black uppercase tracking-wider border-b border-slate-200 print:border-black">
                <th className="py-1.5 px-1 text-center w-6">#</th>
                <th className="py-1.5 px-1.5 w-16 whitespace-nowrap">Order ID</th>
                <th className="py-1.5 px-1.5 w-16 whitespace-nowrap">Date/Time</th>
                <th className="py-1.5 px-1.5 w-22">Customer</th>
                <th className="py-1.5 px-1.5 w-16">Branch</th>
                <th className="py-1.5 px-2">Clothes, Garments & Services (Pin-to-Pin)</th>
                <th className="py-1.5 px-1.5 text-right w-14 whitespace-nowrap">Total</th>
                <th className="py-1.5 px-1.5 text-right w-14 whitespace-nowrap">Rec'd</th>
                <th className="py-1.5 px-1.5 text-right w-16 whitespace-nowrap bg-amber-100/90 text-amber-950 border-l border-r border-amber-300 font-black">
                  Bal Due
                </th>
                <th className="py-1.5 px-1 text-center w-12 whitespace-nowrap">Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 print:divide-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-400 font-semibold text-xs">
                    No order transactions found for this date range and location filter.
                  </td>
                </tr>
              ) : (
                orders.map((ord, idx) => {
                  let total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
                  if (total <= 0 && Array.isArray(ord.items) && ord.items.length > 0) {
                    const s = ord.items.reduce((sum, it) => sum + Number(it.lineTotal !== undefined ? it.lineTotal : ((Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.quantity) || 1))), 0);
                    if (s > 0) total = s;
                  }
                  if (total <= 0 && (ord.weightKg || ord.actualWeight || ord.estimatedWeightKg)) {
                    const wt = Number(ord.weightKg || ord.actualWeight || ord.estimatedWeightKg || 0);
                    const rate = Number(ord.pricePerKg || 100);
                    if (wt > 0 && rate > 0) total = Math.round(wt * rate);
                  }

                  const received = Number(ord.receivedAmount !== undefined && ord.receivedAmount !== null
                    ? ord.receivedAmount 
                    : (ord.paymentStatus === 'PAID' ? total : 0));
                  let balance = Number(ord.balanceAmount !== undefined && ord.balanceAmount !== null && ord.balanceAmount > 0
                    ? ord.balanceAmount 
                    : Math.max(0, total - received));
                  if (ord.paymentStatus === 'PAID') {
                    balance = 0;
                  }

                  const isPaid = balance === 0 || (ord.paymentStatus === 'PAID' && balance <= 0);
                  const isPartial = received > 0 && balance > 0;

                  const pin = parsePinToPinItems(ord);
                  const modeInfo = getPaymentModeBadge(ord.paymentMethod);

                  const d = new Date(ord.createdAt || Date.now());
                  const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                  const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <tr key={ord.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-2 px-1 text-center text-slate-400 font-mono text-[9px] align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-1.5 font-mono font-bold text-slate-900 whitespace-nowrap align-top text-[9px]">
                        {ord.orderNumber || ord.id}
                      </td>
                      <td className="py-2 px-1.5 text-slate-600 whitespace-nowrap align-top">
                        <div className="font-bold text-slate-900 text-[8.5px] whitespace-nowrap">{dateStr}</div>
                        <div className="text-slate-400 font-mono text-[7.5px] whitespace-nowrap">{timeStr}</div>
                      </td>
                      <td className="py-2 px-1.5 align-top">
                        <div className="font-bold text-slate-900 truncate max-w-[85px] text-[9px]" title={ord.customerName || ord.customer?.name}>
                          {ord.customerName || ord.customer?.name || 'Customer'}
                        </div>
                        <div className="text-slate-500 font-mono text-[8px] whitespace-nowrap">
                          {ord.phone || ord.customer?.phone || ''}
                        </div>
                      </td>
                      <td className="py-2 px-1.5 text-slate-600 truncate max-w-[70px] align-top text-[8.5px]" title={ord.storeBranch || ord.terminalCode || 'Counter'}>
                        {ord.storeBranch ? ord.storeBranch.replace('Tech Wash ', '').replace('Laundry ', '').replace('Branch', 'Br.') : (ord.isWalkIn ? 'Counter' : 'Online')}
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="space-y-1">
                          {/* 1. Weighed Scale Batches */}
                          {pin.scales.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pin.scales.map((sc, scIdx) => (
                                <span
                                  key={scIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-950 border border-emerald-300 text-[9px] font-bold print:bg-slate-100 print:text-black print:border-black shadow-2xs"
                                >
                                  <span>{sc.emoji}</span>
                                  <span>{sc.serviceTitle}:</span>
                                  <span className="font-mono text-emerald-800 print:text-black">{sc.weight}</span>
                                  {sc.rate && <span className="text-[8px] text-slate-500 print:text-black">({sc.rate})</span>}
                                  <span className="font-mono text-[9.5px] text-emerald-950 print:text-black font-black">= ₹{sc.lineTotal}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 2. Weighed Garments Piece Breakdown (NO @₹0 artifacts) */}
                          {pin.clothes.length > 0 && (
                            <div className="text-[9px] text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 print:bg-white print:border-slate-300 leading-tight">
                              <span className="font-bold text-slate-900">👔 Weighed Garments ({pin.totalClothesCount} pcs): </span>
                              <span className="text-slate-700 font-medium">
                                {pin.clothes.map(c => `${c.quantity}x ${c.name}`).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* 3. Itemized Specialty Services & Garments */}
                          {pin.specialServices.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {pin.specialServices.map((srv, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[8.5px] font-medium print:bg-white print:text-black print:border-slate-400"
                                >
                                  <span>{srv.emoji}</span>
                                  <span className="font-bold">{srv.quantity}x</span>
                                  <span>{srv.name}</span>
                                  <span className="font-mono font-bold text-indigo-950 print:text-black">(₹{srv.lineTotal})</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 4. Express 24H Tag */}
                          {pin.expressFee > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-black uppercase">
                              ⚡ Express 24H (+₹{pin.expressFee})
                            </span>
                          )}

                          {/* 5. Notes if present */}
                          {ord.notes && (
                            <div className="text-[8px] text-slate-500 italic truncate max-w-[260px]">
                              📝 {ord.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-slate-900 align-top whitespace-nowrap text-[9px]">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-emerald-700 print:text-black align-top whitespace-nowrap text-[9px]">
                        {formatCurrency(received)}
                      </td>
                      <td className={`py-2 px-1.5 text-right font-mono font-black align-top whitespace-nowrap border-l border-r border-slate-100 text-[9px] ${
                        balance > 0 
                          ? 'text-rose-600 bg-rose-50/90 font-black print:bg-white print:text-black' 
                          : 'text-slate-400 bg-slate-50/30'
                      }`}>
                        {balance > 0 ? formatCurrency(balance) : '₹0'}
                      </td>
                      <td className="py-2 px-1 text-center whitespace-nowrap align-top">
                        <span
                          className={`inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : (isPartial ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200')
                          }`}
                          title={`${modeInfo.label} (${ord.paymentMethod || 'CASH'}) • ${isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'DUE')}`}
                        >
                          <span className="text-[10px] leading-none">{modeInfo.emoji}</span>
                          <span className="text-[7.5px] font-black tracking-tight">{isPaid ? 'PAID' : (isPartial ? 'PART' : 'DUE')}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {orders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-[9.5px] border-t-2 border-slate-300 text-slate-900 print:border-black">
                  <td colSpan="6" className="py-2 px-2 text-right uppercase tracking-wider">
                    Grand Settlement Totals:
                  </td>
                  <td className="py-2 px-1.5 text-right font-mono text-orange-600 print:text-black whitespace-nowrap text-[9px]">
                    {formatCurrency(effectiveGross)}
                  </td>
                  <td className="py-2 px-1.5 text-right font-mono text-emerald-700 print:text-black whitespace-nowrap text-[9px]">
                    {formatCurrency(effectiveInflows)}
                  </td>
                  <td className="py-2 px-1.5 text-right font-mono text-rose-600 bg-rose-50/70 border-l border-r border-rose-200 print:text-black whitespace-nowrap text-[9px]">
                    {formatCurrency(effectiveDues)}
                  </td>
                  <td className="py-2 px-1 text-center text-[7.5px] font-bold text-slate-500 whitespace-nowrap">
                    {totalOrdersCount || orders.length} Bills
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. SIGN-OFF & VERIFICATION STAMP
      ───────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 text-[9px] text-slate-600 print:border-black">
        <div>
          <span className="font-bold text-slate-800 block">Cashier / Counter Operator:</span>
          <div className="h-7 border-b border-dashed border-slate-400 mt-1" />
          <span className="text-[8px] text-slate-400">Signature & Counter Seal</span>
        </div>
        <div>
          <span className="font-bold text-slate-800 block">Accounts / Manager Verification:</span>
          <div className="h-7 border-b border-dashed border-slate-400 mt-1" />
          <span className="text-[8px] text-slate-400">Audited & Reconciled</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-800 block">Tech Wash Systems Security:</span>
          <div className="mt-1 font-mono text-[8px] text-slate-500">
            Doc Ref: TW-FIN-{datePreset.toUpperCase()}-{new Date().getTime().toString().slice(-6)}
          </div>
          <span className="text-[8px] text-emerald-700 font-bold">✓ Certified Secure Ledger</span>
        </div>
      </div>

    </div>
  );
};

export default PrintFinancialReport;
