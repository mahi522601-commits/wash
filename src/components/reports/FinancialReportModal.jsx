import React, { useRef } from 'react';
import { PrintFinancialReport } from './PrintFinancialReport';
import { reportService } from '../../services/reportService';
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
  Sparkles
} from 'lucide-react';

export const FinancialReportModal = ({
  isOpen,
  reportData,
  onClose,
}) => {
  const { success, info } = useToast();
  const reportRef = useRef(null);

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
    const link = `${origin}/admin/reports?preset=${reportData.datePreset || '30days'}&branch=${reportData.branchFilter || 'ALL'}`;
    navigator.clipboard.writeText(link);
    success('Link Copied!', 'Sharable report URL copied to clipboard.');
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySharableLink}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Copy link to this report"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Link</span>
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
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
