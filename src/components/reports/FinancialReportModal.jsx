import React, { useState, useRef } from 'react';
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
  Phone
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

  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    if (!reportData?.orders || reportData.orders.length === 0) {
      info('No Data', 'There are no orders to export for this report.');
      return;
    }
    const csvContent = reportService.convertOrdersToCSV(reportData.orders);
    const dateTag = reportData.datePreset || 'report';
    reportService.downloadFile(
      csvContent,
      `techwash-financial-report-${dateTag}-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv;charset=utf-8;'
    );
    success('CSV Exported', 'Detailed orders ledger downloaded successfully.');
  };

  const handleCopySharableLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/admin/reports?preset=${reportData.datePreset || 'today'}&branch=${reportData.branchFilter || 'ALL'}`;
    navigator.clipboard.writeText(link);
    success('Link Copied!', 'Sharable report URL copied to clipboard.');
  };

  const handleCopySummary = async () => {
    const text = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, 'Management');
    await whatsappNotificationService.copyMessageToClipboard(text);
    setIsCopied(true);
    success('Summary Copied!', `Full billing history for ${reportData.dateRangeLabel || 'Today'} copied.`);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsAppReport = () => {
    if (!whatsappPhone.trim()) {
      error('Phone Required', 'Please enter a valid WhatsApp mobile number.');
      return;
    }
    const message = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, 'Management');
    whatsappNotificationService.openWhatsAppManual(whatsappPhone, message);
    success('WhatsApp Opened', `Prepared ${reportData.dateRangeLabel || "Today's"} billing report for ${whatsappPhone}.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:z-auto print:overflow-visible">
      
      {/* Container Card */}
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Top Modal Action Bar (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                Financial Statement & Pin-to-Pin Operations PDF
              </h2>
              <p className="text-[11px] text-slate-400">
                {reportData.dateRangeLabel} • {reportData.orders?.length || 0} Invoices
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

        {/* Scrollable Printable Report Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <PrintFinancialReport reportData={reportData} />
        </div>

        {/* Bottom Footer Notice (Hidden during print) */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 print:hidden shrink-0">
          <span>Tip: Select <strong>"Save as PDF"</strong> in your browser print dialog for a crisp digital copy.</span>
          <span className="font-mono text-[10px] text-slate-400">Tech Wash Internal Reporting Engine</span>
        </div>

      </div>

    </div>
  );
};

export default FinancialReportModal;
