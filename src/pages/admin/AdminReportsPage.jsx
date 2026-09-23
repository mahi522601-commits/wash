import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { FinancialReportModal } from '../../components/reports/FinancialReportModal';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
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
  Receipt
} from 'lucide-react';

export const AdminReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error, info } = useToast();

  // Read initial filter from URL parameters if available
  const initialPreset = searchParams.get('preset') || searchParams.get('range') || '30days';
  const initialBranch = searchParams.get('branch') || 'ALL';

  const [datePreset, setDatePreset] = useState(initialPreset);
  const [branchFilter, setBranchFilter] = useState(initialBranch);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  // Load report data
  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.generateFinancialReport({
        datePreset,
        startDate: customStartDate || null,
        endDate: customEndDate || null,
        branchFilter,
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
  };

  useEffect(() => {
    loadReport();
  }, [datePreset, branchFilter, customStartDate, customEndDate]);

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

  const metrics = reportData?.metrics || {};
  const cat1 = metrics.category1 || {};
  const cat2 = metrics.category2 || {};

  return (
    <div className="space-y-6 pb-16">
      
      {/* ── TOP PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Financial Reports & Settlement Ledger
            </h1>
            <Badge variant="primary" className="bg-orange-500/10 text-orange-700 border-orange-200">
              Pin-to-Pin Audit
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile daily counter cash/UPI receipts, view 30-day complete transaction history, track dues lifecycle, and auto-archive orders.
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

      {/* ── FILTER CONTROLS (DATE TABS & LOCATION SELECTOR) ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        
        {/* Date Preset Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'today', label: 'Today (Settlement)', emoji: '📅' },
              { key: 'tomorrow', label: 'Tomorrow (Pickups)', emoji: '⏳' },
              { key: 'yesterday', label: 'Yesterday', emoji: '⏪' },
              { key: '7days', label: 'Last 7 Days', emoji: '📊' },
              { key: '30days', label: 'Last 30 Days (View All)', emoji: '🌟' },
              { key: 'custom', label: 'Custom Range', emoji: '🗓️' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setDatePreset(tab.key)}
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
          </div>

          <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            {reportData?.dateRangeLabel || 'Loading range...'}
          </div>
        </div>

        {/* Location Dropdown & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Branch / Terminal Selector */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Store Branch / Billing Location:
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-orange-500"
            >
              <option value="ALL">🏢 All Branches & Online Pickups</option>
              <option value="counter-1">🏪 Counter 1 — Jubilee Hills Flagship (TW-POS-01)</option>
              <option value="counter-2">🏪 Counter 2 — Hitec City Processing Hub (TW-POS-02)</option>
              <option value="counter-3">🏪 Counter 3 — Banjara Hills Express (TW-POS-03)</option>
              <option value="ONLINE_WEBSITE">🌐 Online Website Orders Only</option>
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
                            <div className="p-3 rounded-xl bg-white border border-orange-200 text-xs space-y-1.5 shadow-2xs">
                              <span className="font-bold text-orange-900 block text-[11px] uppercase tracking-wider">
                                Clothes & Garments Details:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {ord.items.map((it, i) => (
                                  <div key={i} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex justify-between items-center">
                                    <span className="font-semibold text-slate-800 truncate mr-2" title={it.name}>
                                      {it.quantity || 1}x {it.name}
                                    </span>
                                    <span className="font-mono font-bold text-orange-600 shrink-0">
                                      ₹{(Number(it.unitPrice || it.price || 0) * Number(it.quantity || 1))}
                                    </span>
                                  </div>
                                ))}
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
