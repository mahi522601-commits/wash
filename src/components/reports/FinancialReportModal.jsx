import React, { useState, useRef, useEffect } from 'react';
import { PrintFinancialReport } from './PrintFinancialReport';
import { reportService } from '../../services/reportService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { dailyReportScheduler } from '../../services/dailyReportScheduler';
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
  Clock
} from 'lucide-react';

export const FinancialReportModal = ({
  isOpen,
  reportData,
  onClose,
  onDateChange,
}) => {
  const { success, error, info } = useToast();
  const { settings } = useSettings();
  const reportRef = useRef(null);

  const defaultPhone = settings?.general?.primaryPhone || '6304845567';
  const [whatsappPhone, setWhatsappPhone] = useState(defaultPhone);
  const [isCopied, setIsCopied] = useState(false);
  const [isSendingWa, setIsSendingWa] = useState(false);

  // Active Report State with dynamic filter controls
  const [activeReport, setActiveReport] = useState(reportData);
  const [selectedBranch, setSelectedBranch] = useState(reportData?.branchFilter || 'ALL_POS');
  const [selectedPreset, setSelectedPreset] = useState(reportData?.datePreset || 'today');
  const [customDate, setCustomDate] = useState('');
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if (reportData) {
      setActiveReport(reportData);
      setSelectedBranch(reportData.branchFilter || 'ALL_POS');
      setSelectedPreset(reportData.datePreset || 'today');
    }
  }, [reportData]);

  if (!isOpen || !activeReport) return null;

  // Handle Quick Scope / Date Switch
  const handleFilterChange = async (branch, preset, targetDate = null) => {
    setIsReloading(true);
    setSelectedBranch(branch);
    setSelectedPreset(preset);
    try {
      const data = await reportService.generateFinancialReport({
        datePreset: preset,
        targetDate: targetDate || (preset === 'single' ? customDate : null),
        branchFilter: branch,
        channelFilter: (branch === 'POS_ONLY' || branch === 'ALL_POS' || branch.startsWith('counter')) ? 'POS_ONLY' : (branch === 'ONLINE_WEBSITE' ? 'ONLINE_ONLY' : 'ALL'),
        onlyOfflinePos: branch === 'POS_ONLY' || branch === 'ALL_POS' || branch.startsWith('counter'),
      });
      if (data) {
        setActiveReport(data);
        if (onDateChange) onDateChange(data);
      }
    } catch (err) {
      error('Filter Error', 'Failed to refresh financial settlement ledger.');
    } finally {
      setIsReloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!activeReport?.orders || activeReport.orders.length === 0) {
      info('No Data', 'There are no orders to export for this report.');
      return;
    }
    const csvContent = reportService.convertOrdersToCSV(activeReport.orders);
    const dateTag = activeReport.datePreset || 'report';
    reportService.downloadFile(
      csvContent,
      `techwash-financial-report-${dateTag}-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    success('CSV Exported', 'Detailed orders ledger downloaded successfully.');
  };

  const handleCopySharableLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/admin/reports?preset=${activeReport.datePreset || 'today'}&branch=${activeReport.branchFilter || 'ALL'}`;
    navigator.clipboard.writeText(link);
    success('Link Copied!', 'Sharable report URL copied to clipboard.');
  };

  const handleCopySummary = async () => {
    const text = dailyReportScheduler.buildDailyReportWhatsAppDocument(activeReport, 'Management');
    await whatsappNotificationService.copyMessageToClipboard(text);
    setIsCopied(true);
    success('Summary Copied!', `Full billing history for ${activeReport.dateRangeLabel || 'Today'} copied.`);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsAppReport = () => {
    if (!whatsappPhone.trim()) {
      error('Phone Required', 'Please enter a valid WhatsApp mobile number.');
      return;
    }
    const message = dailyReportScheduler.buildDailyReportWhatsAppDocument(activeReport, 'Management');
    whatsappNotificationService.openWhatsAppManual(whatsappPhone, message);
    success('WhatsApp Opened', `Prepared ${activeReport.dateRangeLabel || "Today's"} billing report for ${whatsappPhone}.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:z-auto print:overflow-visible">
      
      {/* Container Card */}
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Top Modal Action Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">
                  Financial Statement & Pin-to-Pin Shift PDF
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {activeReport.orders?.length || 0} Bills Loaded
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeReport.dateRangeLabel} • {activeReport.branchFilter === 'ALL_POS' || activeReport.branchFilter === 'POS_ONLY' ? 'All Offline POS Counters' : activeReport.branchFilter}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick WhatsApp Send Bar */}
            <div className="flex items-center gap-1.5 bg-emerald-950/80 p-1 rounded-xl border border-emerald-500/40">
              <input
                type="tel"
                placeholder="WhatsApp (e.g. 6304845567)"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-32 sm:w-36 px-2.5 py-1 text-xs font-mono font-bold text-white bg-slate-900 border border-emerald-500/50 rounded-lg outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleSendWhatsAppReport}
                className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Send today's complete billing report to this WhatsApp"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Send WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copy formatted text report of this day"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySharableLink}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copy link to this report"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Link</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Download CSV for Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Scope & Date Filter Bar (Hidden during print) */}
        <div className="px-5 py-2 bg-slate-800 text-slate-200 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          
          {/* Left: Terminal Scope Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Store className="w-3 h-3 text-orange-400" />
              Scope:
            </span>

            <button
              type="button"
              onClick={() => handleFilterChange('ALL_POS', selectedPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedBranch === 'ALL_POS' || selectedBranch === 'POS_ONLY'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              🏪 All POS Counters (All Bills)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('counter-1', selectedPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedBranch === 'counter-1'
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Counter 1 (Main — Manikonda)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('counter-2', selectedPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedBranch === 'counter-2'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Counter 2 (Branch 1 — Tolichowki)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('counter-3', selectedPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedBranch === 'counter-3'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Counter 3 (Pick Up — Ambience)
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('ALL', selectedPreset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedBranch === 'ALL'
                  ? 'bg-slate-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              🌐 All (POS + Online)
            </button>
          </div>

          {/* Right: Date Range Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              Date:
            </span>

            <button
              type="button"
              onClick={() => handleFilterChange(selectedBranch, 'today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedPreset === 'today'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(selectedBranch, 'yesterday')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPreset === 'yesterday'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(selectedBranch, '7days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPreset === '7days'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              7 Days
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(selectedBranch, '30days')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPreset === '30days'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              30 Days
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(selectedBranch, 'all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedPreset === 'all'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              All Time
            </button>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-700">
              <input
                type="date"
                value={customDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  handleFilterChange(selectedBranch, 'single', e.target.value);
                }}
                className="bg-transparent text-white text-[11px] font-mono outline-none cursor-pointer"
                title="Pick specific date for report"
              />
            </div>

            {isReloading && (
              <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin ml-1" />
            )}
          </div>

        </div>

        {/* Scrollable Printable Report Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <PrintFinancialReport reportData={activeReport} />
        </div>

        {/* Bottom Footer Notice (Hidden during print) */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Complete Shift Settlement Ledger Active • <strong>{activeReport.orders?.length || 0} Bills</strong> Recorded (Zero Omissions)</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Tech Wash Internal Reporting Engine</span>
        </div>

      </div>

    </div>
  );
};

export default FinancialReportModal;

