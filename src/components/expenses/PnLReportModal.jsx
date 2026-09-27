import React, { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  FileText, 
  Check, 
  Copy,
  Calendar,
  Sparkles,
  MessageSquare,
  Send,
  Phone,
  Store,
  Filter,
  CheckCircle2,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Building,
  ShieldCheck,
  Award
} from 'lucide-react';

const BRANCH_OPTIONS = [
  { 
    id: 'ALL', 
    name: 'All 3 Branches (Consolidated & Comparative)', 
    code: 'ALL',
    locationName: 'Tech Wash Store Network & Central Plant',
    address: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089'
  },
  { 
    id: 'counter-1', 
    name: 'Counter 1 — Main Branch (Shaikpet / Manikonda)', 
    code: 'TW-POS-01',
    locationName: 'Tech Wash Laundry Main Branch',
    address: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089'
  },
  { 
    id: 'counter-2', 
    name: 'Counter 2 — Branch 1 (Tolichowki / OU Colony)', 
    code: 'TW-POS-02',
    locationName: 'Tech Wash Laundry Services (Branch 1)',
    address: 'Beside Dreamscape hotel Ward No 8, Block No 1, tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008'
  },
  { 
    id: 'counter-3', 
    name: 'Counter 3 — Pick Up Point (Ambience Courtyard)', 
    code: 'TW-POS-03',
    locationName: 'Tech Wash Pick Up Point',
    address: 'Beside Ambience Courtyard, Hyderabad, Telangana, 500089'
  },
];

export const PnLReportModal = ({
  isOpen,
  onClose,
  pnlData,
  comparativeData,
  selectedYear,
  selectedMonth,
  selectedBranch = 'ALL',
  onBranchChange,
}) => {
  const { success, error, info } = useToast();
  const { settings } = useSettings();
  const reportRef = useRef(null);

  const [activeBranch, setActiveBranch] = useState(selectedBranch || 'ALL');
  const [whatsappPhone, setWhatsappPhone] = useState(settings?.general?.primaryPhone || '6304845567');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (selectedBranch) {
      setActiveBranch(selectedBranch);
    }
  }, [selectedBranch]);

  if (!isOpen || !pnlData) return null;

  const handleBranchSelect = (branchId) => {
    setActiveBranch(branchId);
    if (onBranchChange) onBranchChange(branchId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Category', 'Category Group', 'Formula / Units', 'Total Amount (INR)', '% of Total Expenses', '% of Gross Revenue'];
    const rows = (pnlData.categoryBreakdown || []).map(c => [
      `"${c.categoryName}"`,
      `"${c.categoryGroup}"`,
      `"${c.entriesCount} entries"`,
      c.totalAmount,
      `"${c.percentageOfExpenses}%"`,
      `"${c.percentageOfRevenue}%"`
    ]);

    rows.push([]);
    rows.push(['"--- EXECUTIVE P&L SUMMARY ---"', '""', '""', '""', '""', '""']);
    rows.push(['"Gross Billed Revenue"', '""', '""', pnlData.grossRevenue, '""', '100%']);
    rows.push(['"Total Operating Expenses"', '""', '""', pnlData.totalOperatingExpenses, '100%', `"${pnlData.grossRevenue > 0 ? ((pnlData.totalOperatingExpenses / pnlData.grossRevenue) * 100).toFixed(1) : 0}%"`]);
    rows.push(['"Net Operating Profit"', '""', '""', pnlData.netOperatingProfit, '""', `"${pnlData.profitMarginPercentage}%"`]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TechWash_PnL_Statement_${pnlData.monthLabel.replace(' ', '_')}_${activeBranch}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `Downloaded P&L statement for ${pnlData.monthLabel}.`);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = (whatsappPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      error('Phone Required', 'Please enter a valid WhatsApp phone number.');
      return;
    }

    const marginText = `${pnlData.profitMarginPercentage}%`;
    const profitStatus = pnlData.isProfitable ? '🟢 NET PROFIT' : '🔴 NET DEFICIT';

    const text = `📊 *TECH WASH LAUNDRY — MONTHLY P&L & EXPENSES AUDIT*
━━━━━━━━━━━━━━━━━━━━━━
📅 *Period:* ${pnlData.monthLabel}
🏪 *Branch Scope:* ${activeBranch === 'ALL' ? 'All 3 Branches (Consolidated)' : activeBranch}
━━━━━━━━━━━━━━━━━━━━━━
💰 *Gross Billed Revenue:* ₹${pnlData.grossRevenue.toLocaleString('en-IN')}
💵 *Cash Collected:* ₹${pnlData.totalCashReceived.toLocaleString('en-IN')}
📱 *UPI / Online:* ₹${pnlData.totalUpiReceived.toLocaleString('en-IN')}
💳 *Card Collected:* ₹${pnlData.totalCardReceived.toLocaleString('en-IN')}
⏳ *Balance Due:* ₹${pnlData.totalBalanceDue.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━
📉 *Total Operating Expenses:* ₹${pnlData.totalOperatingExpenses.toLocaleString('en-IN')}
📈 *${profitStatus}:* ₹${pnlData.netOperatingProfit.toLocaleString('en-IN')}
🎯 *Operating Margin:* ${marginText}
━━━━━━━━━━━━━━━━━━━━━━
📦 *Orders Processed:* ${pnlData.totalOrdersCount}
⚖️ *Total Weight Processed:* ${pnlData.totalProcessedKg} Kg
🏷️ *Cost per Kg:* ₹${pnlData.costPerKgProcessed}/Kg
━━━━━━━━━━━━━━━━━━━━━━
🏢 *Tech Wash Command Center*
_Official Accounts Audit Statement_`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    success('WhatsApp Ready', 'Opened WhatsApp with formatted P&L summary.');
  };

  const handleCopySummary = () => {
    const text = `📊 TECH WASH LAUNDRY — P&L SUMMARY (${pnlData.monthLabel})
Gross Revenue: ₹${pnlData.grossRevenue.toLocaleString('en-IN')}
Operating Expenses: ₹${pnlData.totalOperatingExpenses.toLocaleString('en-IN')}
Net Operating Profit: ₹${pnlData.netOperatingProfit.toLocaleString('en-IN')} (${pnlData.profitMarginPercentage}%)
Orders: ${pnlData.totalOrdersCount} | Processed: ${pnlData.totalProcessedKg} Kg`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      success('Copied to Clipboard!', 'P&L summary text copied.');
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white animate-fade-in">
      
      {/* ─────────────────────────────────────────────────────────
          MODAL CONTAINER
      ───────────────────────────────────────────────────────── */}
      <div 
        ref={reportRef}
        className="relative bg-white text-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none"
      >
        
        {/* ── 1. MODAL TOP CONTROLS & ACTIONS TOOLBAR (NO-PRINT) ── */}
        <div className="no-print p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display text-white">
                  Monthly P&L Statement & PDF Print
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {pnlData.monthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official A4 Profit & Loss Audit Statement with 3-Branch comparative ledger.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy Summary"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Statement</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. BRANCH FILTER SELECTOR BAR (NO-PRINT) ── */}
        <div className="no-print p-3 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-500 font-bold uppercase text-[10px] shrink-0">Branch Scope:</span>
            {BRANCH_OPTIONS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBranchSelect(b.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeBranch === b.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Quick WhatsApp Dispatch Box */}
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="tel"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="WhatsApp No."
              className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
              title="Send to WhatsApp"
            >
              <Send className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* ── 3. PRINTABLE STATEMENT BODY (SCROLLABLE ON SCREEN, CLEAN ON PRINT) ── */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          
          {/* ─────────────────────────────────────────────────────
              LETTERHEAD HEADER
          ───────────────────────────────────────────────────── */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center p-1 shadow-md shrink-0">
                  <img 
                    src="/techwashlogo.webp" 
                    alt="Tech Wash" 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-950 uppercase">
                    TECH WASH LAUNDRY SERVICES PRIVATE LIMITED
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Commercial Laundry, Eco Dry Cleaning & Garment Care Processing
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    GSTIN: 36AAACT9981F1Z8 • PAN: AAACT9981F • Central Command: Manikonda, Hyderabad
                  </p>
                </div>
              </div>

              {/* Document Reference Badge */}
              <div className="text-right sm:border-l-2 sm:border-slate-200 sm:pl-4">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Document Title</div>
                <div className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">
                  P&L AUDIT STATEMENT
                </div>
                <div className="text-xs font-bold text-rose-600 mt-0.5">
                  {pnlData.monthLabel}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

            </div>

            {/* Scope Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
              <div>
                <strong>Store Location:</strong>{' '}
                <span className="font-bold text-slate-900">
                  {BRANCH_OPTIONS.find(b => b.id === activeBranch)?.name || 'All Branches'}
                </span>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  📍 {BRANCH_OPTIONS.find(b => b.id === activeBranch)?.address || 'All Regional Hubs & Processing Centers'}
                </div>
              </div>
              <div>
                <strong>Accounting Standard:</strong> Accrual & Cash Reconciled (Monthly Period)
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              EXECUTIVE FINANCIAL PERFORMANCE MATRIX
          ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Billed Revenue</span>
              <div className="mt-2 text-xl sm:text-2xl font-black text-slate-950 font-display">
                {formatCurrency(pnlData.grossRevenue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {pnlData.totalOrdersCount} orders • Recv: {formatCurrency(pnlData.totalReceivedRevenue || (pnlData.totalCashReceived + pnlData.totalUpiReceived + pnlData.totalCardReceived))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Total Operating Costs</span>
              <div className="mt-2 text-xl sm:text-2xl font-black text-rose-950 font-display">
                {formatCurrency(pnlData.totalOperatingExpenses)}
              </div>
              <div className="text-[10px] text-rose-700 mt-1">
                11 Cost drivers + Overheads
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              pnlData.isProfitable ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">Net Operating Profit</span>
              <div className="mt-2 text-xl sm:text-2xl font-black font-display">
                {formatCurrency(pnlData.netOperatingProfit)}
              </div>
              <div className="text-[10px] font-bold mt-1">
                {pnlData.isProfitable ? '🟢 Operating Surplus' : '🔴 Operating Deficit'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Margin</span>
              <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400 font-display">
                {pnlData.profitMarginPercentage}%
              </div>
              <div className="text-[10px] text-slate-300 mt-1">
                Cost/Kg: ₹{pnlData.costPerKgProcessed}
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              3-BRANCH COMPARATIVE P&L TABLE (SIDE-BY-SIDE)
          ───────────────────────────────────────────────────── */}
          {comparativeData && comparativeData.branches && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>3-Branch Comparative Financial Performance ({pnlData.monthLabel})</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500">
                  Individual Counters vs Consolidated Total
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                      <th className="p-2.5">Branch / Terminal</th>
                      <th className="p-2.5 text-right">Gross Revenue</th>
                      <th className="p-2.5 text-right">Operating Costs</th>
                      <th className="p-2.5 text-right">Net Profit</th>
                      <th className="p-2.5 text-center">Margin %</th>
                      <th className="p-2.5 text-right">Orders / Vol</th>
                      <th className="p-2.5 text-center">Rev Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparativeData.branches.map((b) => {
                      const bp = b.pnl;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>{b.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{b.code} • 📍 {b.address}</div>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            {formatCurrency(bp.grossRevenue)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-rose-700">
                            {formatCurrency(bp.totalOperatingExpenses)}
                          </td>
                          <td className={`p-2.5 text-right font-black ${bp.isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(bp.netOperatingProfit)}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              bp.profitMarginPercentage >= 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {bp.profitMarginPercentage}%
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-[11px] text-slate-600">
                            <div>{bp.totalOrdersCount} bills</div>
                            <div className="text-[10px] text-slate-400">{bp.totalProcessedKg} Kg</div>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            {b.revenueShare}%
                          </td>
                        </tr>
                      );
                    })}

                    {/* Consolidated Row */}
                    <tr className="bg-slate-900 text-white font-black text-xs">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Consolidated Total (All 3 Branches)</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-right text-white">
                        {formatCurrency(comparativeData.consolidated.grossRevenue)}
                      </td>
                      <td className="p-2.5 text-right text-rose-300">
                        {formatCurrency(comparativeData.consolidated.totalOperatingExpenses)}
                      </td>
                      <td className="p-2.5 text-right text-emerald-400">
                        {formatCurrency(comparativeData.consolidated.netOperatingProfit)}
                      </td>
                      <td className="p-2.5 text-center text-emerald-300">
                        {comparativeData.consolidated.profitMarginPercentage}%
                      </td>
                      <td className="p-2.5 text-right text-slate-300 text-[11px]">
                        {comparativeData.consolidated.totalOrdersCount} bills ({comparativeData.consolidated.totalProcessedKg} Kg)
                      </td>
                      <td className="p-2.5 text-center text-white">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────
              ITEMIZED OPERATIONAL COST DRIVER BREAKDOWN
          ───────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Itemized Operating Expense Breakdown ({pnlData.categoryBreakdown?.length || 0} Categories)</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="p-2.5">Category & Cost Driver</th>
                    <th className="p-2.5">Overhead Classification</th>
                    <th className="p-2.5 text-center">Entries</th>
                    <th className="p-2.5 text-right">Total Amount (₹)</th>
                    <th className="p-2.5 text-right">% of Expenses</th>
                    <th className="p-2.5 text-right">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pnlData.categoryBreakdown && pnlData.categoryBreakdown.length > 0 ? (
                    pnlData.categoryBreakdown.map((cat, idx) => (
                      <tr key={cat.categoryId || idx} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-base">{cat.icon || '💸'}</span>
                            <span>{cat.categoryName}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {cat.categoryGroup || 'Operational Overhead'}
                        </td>
                        <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {cat.entriesCount}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {formatCurrency(cat.totalAmount)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-700">
                          {cat.percentageOfExpenses}%
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          {cat.percentageOfRevenue}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No expenses logged for this period.
                      </td>
                    </tr>
                  )}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                    <td className="p-2.5" colSpan={3}>
                      TOTAL OPERATIONAL EXPENSES
                    </td>
                    <td className="p-2.5 text-right text-rose-700">
                      {formatCurrency(pnlData.totalOperatingExpenses)}
                    </td>
                    <td className="p-2.5 text-right text-rose-700">100%</td>
                    <td className="p-2.5 text-right text-slate-900">
                      {pnlData.grossRevenue > 0 ? Number(((pnlData.totalOperatingExpenses / pnlData.grossRevenue) * 100).toFixed(1)) : 0}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              VOLUME & UNIT ECONOMICS
          ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Orders Count</span>
              <span className="font-bold text-slate-900 text-sm">{pnlData.totalOrdersCount} Bookings</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Weight Processed</span>
              <span className="font-bold text-slate-900 text-sm">{pnlData.totalProcessedKg} Kg</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Avg Expense / Order</span>
              <span className="font-bold text-slate-900 text-sm">₹{pnlData.avgExpensePerOrder}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Cost Per Kg</span>
              <span className="font-black text-emerald-700 text-sm">₹{pnlData.costPerKgProcessed} / Kg</span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              SIGNATURES & OFFICIAL AUDIT BLOCK
          ───────────────────────────────────────────────────── */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="h-10 border-b border-slate-300" />
              <div>
                <div className="font-bold text-slate-900">Branch Accountant</div>
                <div className="text-[10px] text-slate-400">Prepared & Reconciled</div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-slate-300" />
              <div>
                <div className="font-bold text-slate-900">Operations Head</div>
                <div className="text-[10px] text-slate-400">Cost & Volume Verified</div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-slate-300" />
              <div>
                <div className="font-bold text-slate-900">Managing Director</div>
                <div className="text-[10px] text-slate-400">Approved & Authorized</div>
              </div>
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="text-[9px] text-slate-400 text-center border-t border-slate-100 pt-3">
            This Profit & Loss Statement is an official accounting record generated by the Tech Wash Admin Command Center. All currency figures in Indian Rupees (INR ₹).
          </div>

        </div>

      </div>

    </div>
  );
};

export default PnLReportModal;
