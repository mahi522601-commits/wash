import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
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
    orders = [],
    metrics = {},
  } = reportData;

  const {
    totalOrdersCount = 0,
    totalGrossBilled = 0,
    totalPiecesCount = 0,
    totalWeightKg = 0,
    category1 = {},
    category2 = {},
    serviceBreakdown = {},
  } = metrics;

  const branchTitle = (branchFilter === 'POS_ONLY' || branchFilter === 'ALL_POS')
    ? 'All Offline POS Counters (Walk-in Billing)'
    : branchFilter === 'ALL' 
    ? 'All Branches & Processing Hubs (POS + Online)' 
    : branchFilter === 'counter-1'
    ? 'Jubilee Hills Flagship (POS-01 Counter)'
    : branchFilter === 'counter-2'
    ? 'Hitec City Processing Hub (POS-02 Counter)'
    : branchFilter === 'counter-3'
    ? 'Banjara Hills Express (POS-03 Counter)'
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
              {formatCurrency(category1.totalInflowCollections || 0)}
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
              <span className="font-mono font-black text-xs text-amber-800 print:text-black">
                {formatCurrency(category2.totalInitialDuesCreated || 0)}
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
              <span className="font-mono font-black text-xs text-rose-700 print:text-black">
                {formatCurrency(category2.totalNetPendingDues || 0)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-amber-200 print:border-black">
            <span className="font-black text-[11px] text-amber-950 uppercase tracking-wider print:text-black">
              Total Business Billed (Category 1 + Due) =
            </span>
            <span className="font-mono font-black text-sm text-[#EA580C] print:text-black">
              {formatCurrency(totalGrossBilled || 0)}
            </span>
          </div>
        </div>

      </div>

      {/* ── HIGH-LEVEL KPI STRIP ── */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Total Invoices</span>
          <span className="font-mono font-black text-sm text-slate-900">{totalOrdersCount}</span>
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
            <span className="text-emerald-700">{category2.fullyPaidOrdersCount || 0} Paid</span> • <span className="text-rose-700">{(category2.partialOrdersCount || 0) + (category2.unpaidOrdersCount || 0)} Due</span>
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. PIN-TO-PIN DETAILED MASTER TRANSACTIONS TABLE
      ───────────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden print:border-black">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-black print:border-b print:border-black">
          <span>Pin-to-Pin Itemized Transaction Ledger ({orders.length} Records)</span>
          <span>Amounts in INR (₹)</span>
        </div>

        <table className="w-full text-left border-collapse text-[9.5px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[8.5px] font-black uppercase tracking-wider border-b border-slate-200 print:border-black">
              <th className="py-1.5 px-2 text-center w-7">#</th>
              <th className="py-1.5 px-2 w-20">Order ID</th>
              <th className="py-1.5 px-2 w-28">Date & Time</th>
              <th className="py-1.5 px-2 w-32">Customer & Phone</th>
              <th className="py-1.5 px-2 w-28">Branch / Channel</th>
              <th className="py-1.5 px-2">Clothes, Garments & Services (Pin-to-Pin)</th>
              <th className="py-1.5 px-2 text-right w-16">Total Bill</th>
              <th className="py-1.5 px-2 text-right w-16">Received</th>
              <th className="py-1.5 px-2 text-right w-16">Balance Left</th>
              <th className="py-1.5 px-2 text-center w-20">Mode & Status</th>
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
                const total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
                const received = Number(ord.receivedAmount !== undefined 
                  ? ord.receivedAmount 
                  : (ord.paymentStatus === 'PAID' ? total : 0));
                const balance = Number(ord.balanceAmount !== undefined 
                  ? ord.balanceAmount 
                  : Math.max(0, total - received));

                const isPaid = balance === 0 || ord.paymentStatus === 'PAID';
                const isPartial = received > 0 && balance > 0;

                const itemsSummary = (ord.items && ord.items.length > 0)
                  ? ord.items.map(it => `${it.quantity || 1}x ${it.name} (@₹${it.unitPrice || it.price || 0})`).join(', ')
                  : (ord.pricingType === 'per_kg' && (ord.actualWeight || ord.estimatedWeightKg || ord.weightKg)
                      ? `${ord.serviceName || 'Wash & Fold'} (${ord.actualWeight || ord.estimatedWeightKg || ord.weightKg} Kg @ ₹${ord.pricePerKg || 100}/Kg)`
                      : (ord.serviceName || 'Garment Care'));

                const dateDisplay = new Date(ord.createdAt || Date.now()).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={ord.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[9px]">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 font-mono font-bold text-slate-900">
                      {ord.orderNumber || ord.id}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">
                      {dateDisplay}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="font-bold text-slate-900 truncate max-w-[120px]" title={ord.customerName || ord.customer?.name}>
                        {ord.customerName || ord.customer?.name || 'Valued Customer'}
                      </div>
                      <div className="text-slate-500 font-mono text-[8.5px]">
                        {ord.phone || ord.customer?.phone || ''}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 truncate max-w-[110px]" title={ord.storeBranch || ord.terminalCode || 'Counter'}>
                      {ord.storeBranch ? ord.storeBranch.replace('Tech Wash ', '') : (ord.isWalkIn ? 'POS Counter' : 'Online Website')}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="font-medium text-slate-900 leading-tight block">
                        {itemsSummary}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(total)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700 print:text-black">
                      {formatCurrency(received)}
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono font-black ${balance > 0 ? 'text-rose-600 print:text-black' : 'text-slate-400'}`}>
                      {balance > 0 ? formatCurrency(balance) : '₹0'}
                    </td>
                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        isPaid 
                          ? 'bg-emerald-100 text-emerald-800'
                          : (isPartial ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                      }`}>
                        {String(ord.paymentMethod || 'CASH')} • {isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'DUE')}
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
                <td className="py-2 px-2 text-right font-mono text-orange-600 print:text-black">
                  {formatCurrency(totalGrossBilled)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-emerald-700 print:text-black">
                  {formatCurrency(category1.totalInflowCollections || 0)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-rose-600 print:text-black">
                  {formatCurrency(category2.totalNetPendingDues || 0)}
                </td>
                <td className="py-2 px-2 text-center text-[8.5px]">
                  {totalOrdersCount} Bills
                </td>
              </tr>
            </tfoot>
          )}
        </table>
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
