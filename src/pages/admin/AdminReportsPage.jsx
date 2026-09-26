import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { orderService } from '../../services/orderService';
import { dailyReportScheduler } from '../../services/dailyReportScheduler';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { FinancialReportModal } from '../../components/reports/FinancialReportModal';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { DailyWhatsAppSchedulerCard } from '../../components/reports/DailyWhatsAppSchedulerCard';
import { 
  FileText, 
  Printer, 
  Download, 
  Share2, 
  Calendar, 
  Store, 
  Search, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Database,
  Archive,
  ChevronDown,
  ChevronUp,
  Receipt,
  Send,
  MessageSquare,
  TrendingUp,
  History,
  ListOrdered
} from 'lucide-react';

export const AdminReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error, info } = useToast();

  // Read initial filter from URL parameters if available
  const initialPreset = searchParams.get('preset') || searchParams.get('range') || '30days';
  const initialBranch = searchParams.get('branch') || 'POS_ONLY';
  const initialChannel = searchParams.get('channel') || 'POS_ONLY';

  // Active View Mode: 'date-wise' (Saved Shifts Archive) vs 'transactions' (Itemized Invoices Ledger)
  const [viewMode, setViewMode] = useState('date-wise');

  // Channel filter: 'POS_ONLY' (Default - Offline POS Walk-ins Only) | 'ONLINE_ONLY' | 'ALL'
  const [channelFilter, setChannelFilter] = useState(initialChannel);
  const [datePreset, setDatePreset] = useState(initialPreset);
  const [branchFilter, setBranchFilter] = useState(initialBranch);
  const [searchQuery, setSearchQuery] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  
  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Date-wise Shift Ledger State
  const [dateWiseLedger, setDateWiseLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [dateSearchQuery, setDateSearchQuery] = useState('');

  // Report Data & Loading State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null);

  // Backup Engine State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStats, setBackupStats] = useState(null);

  // Expanded items state in table
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpanded = (orderId) => {
    setExpandedRows(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Load Date-Wise Shift Ledger (Strictly Offline POS Walk-In Orders by default)
  const loadDateWiseLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const days = await reportService.getDateWiseSavedShiftLedger({ 
        branchFilter,
        channelFilter,
        onlyOfflinePos: channelFilter === 'POS_ONLY',
        limitDays: 90 
      });
      setDateWiseLedger(days || []);
    } catch (err) {
      console.warn('Failed to load date-wise shifts ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  }, [branchFilter, channelFilter]);

  // Load Itemized Report Data
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.generateFinancialReport({
        datePreset,
        startDate: customStartDate || null,
        endDate: customEndDate || null,
        targetDate: specificDate || null,
        branchFilter,
        channelFilter,
        onlyOfflinePos: channelFilter === 'POS_ONLY',
        searchQuery,
      });
      setReportData(data);

      // Check auto backup milestone on load
      const totalCount = data.metrics?.totalOrdersCount || 0;
      setBackupStats({
        totalCount,
        nextMilestone: (Math.floor(totalCount / 1000) + 1) * 1000,
      });
    } catch (err) {
      error('Report Error', 'Failed to generate financial report data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [datePreset, branchFilter, channelFilter, customStartDate, customEndDate, specificDate, searchQuery, error]);

  // Sync state when URL params change
  useEffect(() => {
    const p = searchParams.get('preset') || searchParams.get('range');
    const b = searchParams.get('branch');
    const c = searchParams.get('channel');
    if (p && p !== datePreset) setDatePreset(p);
    if (b && b !== branchFilter) setBranchFilter(b);
    if (c && c !== channelFilter) setChannelFilter(c);
  }, [searchParams]);

  useEffect(() => {
    loadReport();
    loadDateWiseLedger();
  }, [loadReport, loadDateWiseLedger]);

  // Handle Search Input Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  // 1-Click Backup & Download Trigger
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await reportService.checkAndTrigger1000OrdersBackup(true);
      if (res.success) {
        success('Archive Downloaded', `Full backup (${res.totalOrders} orders) downloaded in .JSON and .CSV formats.`);
      } else {
        info('Backup Checked', 'Backup archive evaluated.');
      }
    } catch (err) {
      error('Backup Error', err.message || 'Failed to trigger local storage backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Copy Sharable Link
  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/admin/reports?preset=${datePreset}&branch=${branchFilter}`;
    navigator.clipboard.writeText(link);
    success('Sharable Link Copied', `Direct URL copied: /admin/reports?preset=${datePreset}&branch=${branchFilter}`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!reportData?.orders || reportData.orders.length === 0) {
      info('No Data', 'There are no orders matching this filter.');
      return;
    }
    const csvContent = reportService.convertOrdersToCSV(reportData.orders);
    reportService.downloadFile(
      csvContent,
      `techwash-${datePreset}-financial-ledger-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    success('CSV Exported', 'Orders ledger downloaded successfully.');
  };

  // Quick Action: View & Print Single Day Shift PDF
  const handleViewDateShiftPDF = async (dateKey) => {
    setLoading(true);
    try {
      const data = await reportService.generateFinancialReport({
        datePreset: 'single',
        targetDate: dateKey,
        branchFilter,
        channelFilter,
        onlyOfflinePos: channelFilter === 'POS_ONLY',
      });
      setReportData(data);
      setIsReportModalOpen(true);
    } catch (err) {
      error('Report Error', 'Could not generate shift report for ' + dateKey);
    } finally {
      setLoading(false);
    }
  };

  // Quick Action: Dispatch Single Day Shift to WhatsApp
  const handleSendDateWhatsApp = async (dayGroup) => {
    try {
      const data = await reportService.generateFinancialReport({
        datePreset: 'single',
        targetDate: dayGroup.dateKey,
        branchFilter,
        channelFilter,
        onlyOfflinePos: channelFilter === 'POS_ONLY',
      });
      const text = dailyReportScheduler.buildDailyReportWhatsAppDocument(data, 'Store Management');
      const cfg = await dailyReportScheduler.getConfig();
      const primaryRecipient = cfg.recipients?.find(r => r.active)?.phone || '6304845567';
      whatsappNotificationService.openWhatsAppManual(primaryRecipient, text);
      success('WhatsApp Prepared', `Shift overview for ${dayGroup.dateLabel} generated for WhatsApp.`);
    } catch (err) {
      error('WhatsApp Error', 'Could not generate WhatsApp summary for ' + dayGroup.dateLabel);
    }
  };

  // Quick Action: Inspect Invoices for that day in-place
  const handleInspectDateInvoices = (dayGroup) => {
    setSpecificDate(dayGroup.dateKey);
    setDatePreset('single');
    setViewMode('transactions');
    success('Viewing Invoices', `Loaded ${dayGroup.totalBills} bills for ${dayGroup.dateLabel}.`);
  };

  // Quick Action: Export Day CSV
  const handleExportDayCSV = (dayGroup) => {
    if (!dayGroup.orders || dayGroup.orders.length === 0) {
      info('No Data', 'No orders recorded for ' + dayGroup.dateLabel);
      return;
    }
    const csv = reportService.convertOrdersToCSV(dayGroup.orders);
    reportService.downloadFile(csv, `techwash-shift-${dayGroup.dateKey}.csv`, 'text/csv;charset=utf-8;');
    success('CSV Exported', `Shift ledger for ${dayGroup.dateLabel} downloaded.`);
  };

  // Filtered Date-wise Ledger by search query
  const filteredDateWiseLedger = useMemo(() => {
    if (!dateSearchQuery.trim()) return dateWiseLedger;
    const q = dateSearchQuery.toLowerCase();
    return dateWiseLedger.filter(d => 
      d.dateKey.includes(q) || 
      d.dateLabel.toLowerCase().includes(q) ||
      String(d.totalBills).includes(q) ||
      String(d.grossBilled).includes(q)
    );
  }, [dateWiseLedger, dateSearchQuery]);

  // Cumulative Stats for Date-Wise Ledger
  const cumulativeStats = useMemo(() => {
    return dateWiseLedger.reduce((acc, d) => {
      acc.daysCount += 1;
      acc.totalBills += (d.totalBills || 0);
      acc.grossBilled += (d.grossBilled || 0);
      acc.collected += (d.collected || 0);
      acc.pendingDues += (d.pendingDues || 0);
      acc.cash += (d.cash || 0);
      acc.upi += (d.upi || 0);
      acc.card += (d.card || 0);
      acc.online += (d.online || 0);
      acc.pieces += (d.pieces || 0);
      acc.weightKg += (d.weightKg || 0);
      return acc;
    }, {
      daysCount: 0,
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
    });
  }, [dateWiseLedger]);

  const metrics = reportData?.metrics || {};
  const cat1 = metrics.category1 || {};
  const cat2 = metrics.category2 || {};

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-16">
      <div className="no-print space-y-6">
        
        {/* ── TOP PAGE HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Financial Reports & Settlement Ledger
              </h1>
              <Badge variant="primary" className="bg-orange-500/10 text-orange-700 border-orange-200">
                Date-Wise Saved Billing
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Maintain and inspect complete date-wise daily shift history, reconcile multi-branch collections, print A4 statements, and dispatch 10:00 PM WhatsApp summaries.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5"
              title="Copy sharable URL to this report"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print PDF</span>
            </Button>
          </div>
        </div>

        {/* ── VIEW MODE SWITCHER TABS ── */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('date-wise')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'date-wise'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>📅 Date-Wise Daily Shifts Archive</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold">
              {dateWiseLedger.length} Days Saved
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'transactions'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <span>📋 Pin-to-Pin Itemized Invoices</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              {reportData?.orders?.length || 0} Bills
            </span>
          </button>
        </div>

        {/* ── 1,000 ORDERS LOCAL ARCHIVAL & BACKUP STRIP ── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-display">
                  Automated 1,000-Order Archival Engine
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  ✓ LocalStorage & Disk Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Every 1,000 orders, a complete immutable JSON & CSV database snapshot is downloaded locally to your computer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleTriggerBackup}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isBackingUp ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Generating Snapshot...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>📥 Manual 1,000-Order Backup</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 10:00 PM AUTOMATED DAILY PDF WHATSAPP DISPATCHER & RECIPIENTS ── */}
        <DailyWhatsAppSchedulerCard reportData={reportData} onRefresh={loadReport} />

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: DATE-WISE SAVED DAILY SHIFTS ARCHIVE
           ───────────────────────────────────────────────────────────── */}
        {viewMode === 'date-wise' && (
          <div className="space-y-6">
            
            {/* Top Date-wise Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Channel / Source Quick Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Channel Mode:
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => { setChannelFilter('POS_ONLY'); setBranchFilter('POS_ONLY'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        channelFilter === 'POS_ONLY' && (branchFilter === 'POS_ONLY' || branchFilter.startsWith('counter-'))
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>🏪 Offline POS Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChannelFilter('ONLINE_ONLY'); setBranchFilter('ONLINE_WEBSITE'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        channelFilter === 'ONLINE_ONLY' || branchFilter === 'ONLINE_WEBSITE'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>🌐 Online Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setChannelFilter('ALL'); setBranchFilter('ALL'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        channelFilter === 'ALL' && branchFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>🏢 All Billings</span>
                    </button>
                  </div>
                </div>

                {/* Branch / Terminal Selector */}
                <div className="min-w-[260px]">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Store Branch / Billing Location:
                  </label>
                  <select
                    value={branchFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBranchFilter(val);
                      if (val === 'ONLINE_WEBSITE') setChannelFilter('ONLINE_ONLY');
                      else if (val === 'ALL') setChannelFilter('ALL');
                      else setChannelFilter('POS_ONLY');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                  >
                    <option value="POS_ONLY">🏪 All Offline POS Counters (POS-01, 02, 03)</option>
                    <option value="counter-1">🏪 Counter 1 — Main Branch (Shaikpet / Manikonda) (TW-POS-01)</option>
                    <option value="counter-2">🏪 Counter 2 — Branch 1 (Tolichowki / OU Colony) (TW-POS-02)</option>
                    <option value="counter-3">🏪 Counter 3 — Pick Up Point (Ambience Courtyard) (TW-POS-03)</option>
                    <option value="ONLINE_WEBSITE">🌐 Online Website Orders Only</option>
                    <option value="ALL">🏢 Master Consolidated (Offline POS + Online)</option>
                  </select>
                </div>

                {/* Search within Dates */}
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Search Date or Amount:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search date (e.g. 24 Sep, 2026-09-24) or amount..."
                      value={dateSearchQuery}
                      onChange={(e) => setDateSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { loadDateWiseLedger(); loadReport(); }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Reload date-wise shift records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? 'animate-spin' : ''}`} />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>

            {/* Date-Wise Cumulative Summary Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">🗓️ Saved Shift Days</span>
                  <span className="p-1 rounded-lg bg-orange-50 text-orange-600"><History className="w-3.5 h-3.5" /></span>
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {cumulativeStats.daysCount} Days
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {cumulativeStats.totalBills} Total POS Bills
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">💰 Gross Sales Billed</span>
                  <span className="p-1 rounded-lg bg-amber-50 text-amber-600"><DollarSign className="w-3.5 h-3.5" /></span>
                </div>
                <div className="text-xl font-black text-amber-700 font-mono">
                  {formatCurrency(cumulativeStats.grossBilled)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Total Billed Volume
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700">💵 Total Collected Inflows</span>
                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /></span>
                </div>
                <div className="text-xl font-black text-emerald-700 font-mono">
                  {formatCurrency(cumulativeStats.collected)}
                </div>
                <div className="text-[11px] text-emerald-600 font-medium font-mono">
                  Cash: {formatCurrency(cumulativeStats.cash)} • UPI: {formatCurrency(cumulativeStats.upi)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-700">🔴 Net Pending Dues</span>
                  <span className="p-1 rounded-lg bg-rose-50 text-rose-600"><AlertCircle className="w-3.5 h-3.5" /></span>
                </div>
                <div className="text-xl font-black text-rose-700 font-mono">
                  {formatCurrency(cumulativeStats.pendingDues)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Outstanding Customer Dues
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">👕 Garments Cleaned</span>
                  <span className="p-1 rounded-lg bg-purple-50 text-purple-600"><Sparkles className="w-3.5 h-3.5" /></span>
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {cumulativeStats.pieces} Clothes
                </div>
                <div className="text-[11px] text-purple-700 font-medium font-mono">
                  {cumulativeStats.weightKg > 0 ? `${cumulativeStats.weightKg.toFixed(1)} Kg Weighed` : 'Itemized Clean'}
                </div>
              </div>
            </div>

            {/* Date-Wise Shifts Ledger Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                <div>
                  <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>Saved Date-Wise Daily Shifts Ledger</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Day-by-day maintained records. Click any date to view multi-page PDF shift report, send WhatsApp overview, or inspect order slips.
                  </p>
                </div>

                <span className="text-xs font-bold text-orange-700 bg-orange-100/70 px-3 py-1 rounded-full border border-orange-200">
                  {filteredDateWiseLedger.length} Shift Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-10 text-center">#</th>
                      <th className="py-3.5 px-4 w-44">Shift Date</th>
                      <th className="py-3.5 px-4 w-28 text-center">Total Bills</th>
                      <th className="py-3.5 px-4 w-36">Garment Volume</th>
                      <th className="py-3.5 px-4 text-right w-28">Gross Billed</th>
                      <th className="py-3.5 px-4 text-right w-36">Collected Inflows</th>
                      <th className="py-3.5 px-4 text-right w-28">Pending Due</th>
                      <th className="py-3.5 px-4 text-center">1-Click Actions & Reports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {loadingLedger ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-2" />
                          <span>Loading saved date-wise shifts...</span>
                        </td>
                      </tr>
                    ) : filteredDateWiseLedger.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                          No saved shift records found for this branch or filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDateWiseLedger.map((day, idx) => {
                        const isToday = day.dateKey === todayStr;
                        const isYesterday = day.dateKey === yesterdayStr;

                        return (
                          <tr key={day.dateKey} className="hover:bg-orange-50/30 transition-colors">
                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{day.dateLabel}</span>
                                {isToday && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase">
                                    Today (Live)
                                  </span>
                                )}
                                {isYesterday && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-slate-700 text-white text-[9px] font-black uppercase">
                                    Yesterday
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Date Key: {day.dateKey}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
                                {day.totalBills} Bills
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 text-xs">
                                {day.pieces} Clothes
                              </div>
                              {day.weightKg > 0 && (
                                <div className="text-[10px] text-purple-700 font-mono font-semibold">
                                  {day.weightKg.toFixed(1)} Kg Weighed
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                              {formatCurrency(day.grossBilled)}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="font-mono font-black text-emerald-700 text-sm">
                                {formatCurrency(day.collected)}
                              </div>
                              <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] font-mono text-slate-500">
                                {day.cash > 0 && <span className="bg-emerald-50 text-emerald-700 px-1 rounded">💵₹{day.cash}</span>}
                                {day.upi > 0 && <span className="bg-cyan-50 text-cyan-700 px-1 rounded">📱₹{day.upi}</span>}
                                {day.card > 0 && <span className="bg-indigo-50 text-indigo-700 px-1 rounded">💳₹{day.card}</span>}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-black">
                              {day.pendingDues > 0 ? (
                                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-xs">
                                  {formatCurrency(day.pendingDues)}
                                </span>
                              ) : (
                                <span className="text-emerald-700 text-xs font-semibold">
                                  ✓ Settled (₹0)
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* 1. Print PDF Shift Report */}
                                <button
                                  type="button"
                                  onClick={() => handleViewDateShiftPDF(day.dateKey)}
                                  className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                                  title={`Print official PDF statement for ${day.dateLabel}`}
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>PDF Shift</span>
                                </button>

                                {/* 2. Send WhatsApp Summary */}
                                <button
                                  type="button"
                                  onClick={() => handleSendDateWhatsApp(day)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1 cursor-pointer"
                                  title={`Dispatch WhatsApp executive report for ${day.dateLabel}`}
                                >
                                  <Send className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>

                                {/* 3. Inspect Invoices */}
                                <button
                                  type="button"
                                  onClick={() => handleInspectDateInvoices(day)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                                  title={`View all ${day.totalBills} garment bills for ${day.dateLabel}`}
                                >
                                  <Search className="w-3 h-3" />
                                  <span>View Bills</span>
                                </button>

                                {/* 4. Export CSV */}
                                <button
                                  type="button"
                                  onClick={() => handleExportDayCSV(day)}
                                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                                  title={`Download CSV for ${day.dateLabel}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: PIN-TO-PIN DETAILED INVOICES & RECONCILIATION
           ───────────────────────────────────────────────────────────── */}
        {viewMode === 'transactions' && (
          <div className="space-y-6">
            
            {/* ── FILTER CONTROLS (DATE TABS & LOCATION SELECTOR) ── */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              
              {/* Date Preset Tabs & Specific Date Picker */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
                  {[
                    { key: 'today', label: 'Today (Settlement)', emoji: '📅' },
                    { key: 'yesterday', label: 'Yesterday', emoji: '⏪' },
                    { key: 'tomorrow', label: 'Tomorrow (Pickups)', emoji: '⏳' },
                    { key: '7days', label: 'Last 7 Days', emoji: '📊' },
                    { key: '30days', label: 'Last 30 Days (View All)', emoji: '🌟' },
                    { key: 'all', label: 'All History', emoji: '📚' },
                    { key: 'single', label: 'Specific Date', emoji: '🗓️' },
                    { key: 'custom', label: 'Custom Range', emoji: '↔️' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setDatePreset(tab.key);
                        if (tab.key === 'single' && !specificDate) {
                          setSpecificDate(new Date().toISOString().split('T')[0]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                        datePreset === tab.key
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{tab.emoji}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}

                  {/* Quick Specific Date Input */}
                  {datePreset === 'single' && (
                    <div className="inline-flex items-center gap-1.5 ml-1 bg-orange-50 px-2 py-1 rounded-xl border border-orange-200">
                      <span className="text-[10px] font-bold text-orange-900">Select Date:</span>
                      <input
                        type="date"
                        value={specificDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setSpecificDate(e.target.value);
                          setDatePreset('single');
                        }}
                        className="px-2 py-0.5 rounded-lg border border-orange-300 text-xs font-bold text-orange-950 bg-white outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  {reportData?.dateRangeLabel || 'Loading range...'}
                </div>
              </div>

              {/* Location Dropdown & Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Branch / Terminal Selector */}
                <div className="md:col-span-5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Branch / Billing Location:
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setChannelFilter('POS_ONLY'); setBranchFilter('POS_ONLY'); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          channelFilter === 'POS_ONLY' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        POS Only
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChannelFilter('ONLINE_ONLY'); setBranchFilter('ONLINE_WEBSITE'); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          channelFilter === 'ONLINE_ONLY' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Online Only
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChannelFilter('ALL'); setBranchFilter('ALL'); }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          channelFilter === 'ALL' && branchFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>

                  <select
                    value={branchFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBranchFilter(val);
                      if (val === 'ONLINE_WEBSITE') setChannelFilter('ONLINE_ONLY');
                      else if (val === 'ALL') setChannelFilter('ALL');
                      else setChannelFilter('POS_ONLY');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
                  >
                    <option value="POS_ONLY">🏪 All Offline POS Counters (POS-01, 02, 03)</option>
                    <option value="counter-1">🏪 Counter 1 — Main Branch (Shaikpet / Manikonda) (TW-POS-01)</option>
                    <option value="counter-2">🏪 Counter 2 — Branch 1 (Tolichowki / OU Colony) (TW-POS-02)</option>
                    <option value="counter-3">🏪 Counter 3 — Pick Up Point (Ambience Courtyard) (TW-POS-03)</option>
                    <option value="ONLINE_WEBSITE">🌐 Online Website Orders Only</option>
                    <option value="ALL">🏢 Master Consolidated (Offline POS + Online)</option>
                  </select>
                </div>

                {/* Custom Date Pickers (Only visible if 'custom' is selected) */}
                {datePreset === 'custom' && (
                  <div className="md:col-span-4 flex items-center gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">From Date:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">To Date:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className={datePreset === 'custom' ? 'md:col-span-4' : 'md:col-span-8'}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Filter Within Orders:
                  </label>
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by Order #, Customer, Phone, Garment (e.g. Saree, Shirt, Shoes)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      Filter
                    </button>
                  </form>
                </div>

              </div>

            </div>

            {/* ── THE TWO-CATEGORY FINANCIAL SETTLEMENT ENGINE ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* ── CATEGORY 1: DIRECT COLLECTIONS RECEIVED (INFLOWS) ── */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border-2 border-emerald-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      1
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-emerald-950 uppercase tracking-wider">
                        Category 1: Mode-Wise Collections Received
                      </h2>
                      <p className="text-[11px] text-emerald-700">
                        Total Fresh Cash, UPI, Card & Online Inflows
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-800 font-mono bg-emerald-100 px-2.5 py-1 rounded-lg">
                    {formatCurrency(cat1.totalInflowCollections || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">💵 Cash Register</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(cat1.cashReceived || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">📱 UPI QR Scan</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {formatCurrency(cat1.upiReceived || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">💳 Card / POS Swipe</span>
                    <span className="text-lg font-black text-indigo-700 font-mono">
                      {formatCurrency(cat1.cardReceived || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">🌐 Online Gateway</span>
                    <span className="text-lg font-black text-cyan-700 font-mono">
                      {formatCurrency(cat1.onlineReceived || 0)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">Total Realized Inflow Today</span>
                    <span className="text-[11px] text-emerald-100">Sum of all collected payments</span>
                  </div>
                  <span className="text-2xl font-black font-mono">
                    {formatCurrency(cat1.totalInflowCollections || 0)}
                  </span>
                </div>
              </div>

              {/* ── CATEGORY 2: DUE BALANCES, RECOVERIES & TOTAL VOLUME ── */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50/50 border-2 border-amber-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      2
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-amber-950 uppercase tracking-wider">
                        Category 2: Due Balances & Total Realization
                      </h2>
                      <p className="text-[11px] text-amber-700">
                        Unpaid Dues, Recoveries & Total Expected Realization
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-800 font-mono bg-amber-100 px-2.5 py-1 rounded-lg">
                    {formatCurrency(metrics.totalGrossBilled || 0)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">⏳ New Dues Created</span>
                    <span className="text-lg font-black text-amber-800 font-mono">
                      {formatCurrency(cat2.totalInitialDuesCreated || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">🔄 Cleared on Delivery</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      +{formatCurrency(cat2.totalRecoveredDues || 0)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-1">
                    <span className="text-slate-500 block text-xs font-semibold">🔴 Net Pending Due</span>
                    <span className="text-lg font-black text-rose-700 font-mono">
                      {formatCurrency(cat2.totalNetPendingDues || 0)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">Total Gross Billed Volume</span>
                    <span className="text-[11px] text-orange-100">Category 1 + Outstanding Realization</span>
                  </div>
                  <span className="text-2xl font-black font-mono">
                    {formatCurrency(metrics.totalGrossBilled || 0)}
                  </span>
                </div>
              </div>

            </div>

            {/* ── PIN-TO-PIN DETAILED TRANSACTIONS TABLE ── */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h2 className="font-bold text-base text-slate-900">
                    Pin-to-Pin Itemized Transaction Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Showing {reportData?.orders?.length || 0} order records for {reportData?.dateRangeLabel} ({branchFilter})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-600">
                    Total: <strong>{metrics.totalPiecesCount || 0} Clothes</strong>
                    {metrics.totalWeightKg > 0 ? ` • ${metrics.totalWeightKg} Kg` : ''}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 w-8 text-center">#</th>
                      <th className="py-3 px-3 w-28">Order ID</th>
                      <th className="py-3 px-3 w-32">Date & Time</th>
                      <th className="py-3 px-3 w-40">Customer</th>
                      <th className="py-3 px-3 w-36">Location</th>
                      <th className="py-3 px-3">Garments / Clothes (Pin-to-Pin)</th>
                      <th className="py-3 px-3 text-right w-24">Total (₹)</th>
                      <th className="py-3 px-3 text-right w-24">Received (₹)</th>
                      <th className="py-3 px-3 text-right w-24">Balance Left (₹)</th>
                      <th className="py-3 px-3 text-center w-28">Status</th>
                      <th className="py-3 px-3 text-center w-16">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan="11" className="py-12 text-center text-slate-400">
                          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-2" />
                          <span>Loading report ledger...</span>
                        </td>
                      </tr>
                    ) : reportData?.orders?.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="py-12 text-center text-slate-400 font-semibold">
                          No orders found matching this filter criteria.
                        </td>
                      </tr>
                    ) : (
                      reportData.orders.map((ord, idx) => {
                        const total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
                        const received = Number(ord.receivedAmount !== undefined 
                          ? ord.receivedAmount 
                          : (ord.paymentStatus === 'PAID' ? total : 0));
                        const balance = Number(ord.balanceAmount !== undefined 
                          ? ord.balanceAmount 
                          : Math.max(0, total - received));

                        const isPaid = balance === 0 || ord.paymentStatus === 'PAID';
                        const isPartial = received > 0 && balance > 0;
                        const isExpanded = !!expandedRows[ord.id];

                        const itemsCount = ord.items?.length || 0;

                        return (
                          <React.Fragment key={ord.id || idx}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                {ord.orderNumber || ord.id}
                              </td>
                              <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                                {new Date(ord.createdAt || Date.now()).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 truncate max-w-[150px]" title={ord.customerName || ord.customer?.name}>
                                  {ord.customerName || ord.customer?.name || 'Customer'}
                                </div>
                                <div className="text-slate-500 font-mono text-[10px]">
                                  {ord.phone || ord.customer?.phone || ''}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]" title={ord.storeBranch || 'Counter'}>
                                <span className="font-semibold text-slate-800">
                                  {ord.storeBranch ? ord.storeBranch.replace('Tech Wash ', '') : (ord.isWalkIn ? 'POS Counter' : 'Online')}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                    <span>{ord.serviceEmoji || '👔'}</span>
                                    <span>{ord.serviceName || ord.service || 'Care'}</span>
                                    {ord.pricingType === 'per_kg' && ord.weightKg && (
                                      <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 rounded font-mono">
                                        {ord.weightKg} Kg
                                      </span>
                                    )}
                                  </div>

                                  {itemsCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleRowExpanded(ord.id)}
                                      className="text-[11px] text-orange-600 hover:text-orange-800 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{itemsCount} Garment Items</span>
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(total)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                                {formatCurrency(received)}
                              </td>
                              <td className={`py-3 px-3 text-right font-mono font-black ${balance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {balance > 0 ? formatCurrency(balance) : '₹0'}
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : (isPartial ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                                }`}>
                                  {String(ord.paymentMethod || 'CASH')} • {isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'DUE')}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setActiveReceiptOrder(ord)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-orange-600 transition cursor-pointer"
                                  title="Print 1-Page Tax Invoice"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Clothes Breakdown Row */}
                            {isExpanded && ord.items && (
                              <tr className="bg-orange-50/40">
                                <td colSpan="11" className="p-3 pl-12">
                                  <div className="p-3.5 rounded-xl bg-white border border-orange-200 text-xs space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between border-b border-orange-100 pb-1.5">
                                      <span className="font-bold text-orange-900 block text-[11px] uppercase tracking-wider">
                                        Pin-to-Pin Clothes & Service Breakdown ({ord.items.length} Line Items):
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        Order ID: <strong>{ord.orderNumber || ord.id}</strong>
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {ord.items.map((it, i) => {
                                        const itemSrv = it.serviceName || ord.serviceName || 'Garment Care';
                                        const itemRate = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
                                        const itemQty = Number(it.quantity || 1);
                                        const itemTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (itemRate * itemQty));

                                        return (
                                          <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="text-[9px] font-bold text-orange-700 bg-orange-100/70 px-1.5 py-0.2 rounded truncate">
                                                {itemSrv}
                                              </span>
                                              <span className="font-mono font-bold text-slate-900">
                                                ₹{itemTotal}
                                              </span>
                                            </div>
                                            <div className="font-bold text-slate-800 text-[11px] truncate" title={it.name}>
                                              {it.name}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                              <span>Qty: <strong>{itemQty}</strong></span>
                                              <span>Rate: ₹{itemRate}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ── MODALS ── */}
      {/* 1. Full Printable Report Modal */}
      {isReportModalOpen && reportData && (
        <FinancialReportModal
          isOpen={isReportModalOpen}
          reportData={reportData}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* 2. Single Order Tax Receipt Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          isOpen={Boolean(activeReceiptOrder)}
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

    </div>
  );
};

export default AdminReportsPage;
