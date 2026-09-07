import React, { useState, useEffect } from 'react';
import { receiptService } from '../../services/receiptService';
import { PrintReceipt } from './PrintReceipt';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Printer, 
  Download, 
  Eye, 
  FileText, 
  RotateCcw, 
  Check, 
  X, 
  Sliders, 
  Smartphone, 
  Maximize2 
} from 'lucide-react';

export const ReceiptModal = ({
  isOpen,
  onClose,
  order,
}) => {
  const [config, setConfig] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [includeInternalNotes, setIncludeInternalNotes] = useState(false);
  const [previewMode, setPreviewMode] = useState('A4'); // 'A4' | 'MOBILE'

  useEffect(() => {
    if (order && isOpen) {
      receiptService.getReceiptConfig().then((cfg) => {
        setConfig(cfg);
        const mapped = receiptService.mapOrderToReceiptData(order, cfg);
        setReceiptData(mapped);
      });
    }
  }, [order, isOpen]);

  if (!isOpen || !order || !receiptData || !config) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto no-print">
      
      <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-navy-800">
                  Official Tax Invoice & Print Receipt
                </h3>
                <Badge variant="emerald" size="sm">A4 Verified</Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {receiptData.invoiceNumber} • Order {receiptData.orderNumber}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('A4')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  previewMode === 'A4'
                    ? 'bg-white text-navy-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                A4 Sheet
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('MOBILE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  previewMode === 'MOBILE'
                    ? 'bg-white text-navy-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mobile View
              </button>
            </div>

            {/* Internal Notes Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeInternalNotes}
                onChange={(e) => setIncludeInternalNotes(e.target.checked)}
                className="w-3.5 h-3.5 text-brand-600 rounded"
              />
              <span className="hidden sm:inline">Include Internal Notes</span>
            </label>

            {/* Print Trigger Button */}
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Printer}
              onClick={handlePrint}
              className="shadow-lg shadow-brand-500/20"
            >
              Print / Save PDF
            </Button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* Scrollable Receipt Canvas Preview Area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-200/70 flex justify-center items-start">
          <div className={previewMode === 'MOBILE' ? 'w-full max-w-sm' : 'w-full max-w-[210mm]'}>
            <PrintReceipt
              receiptData={receiptData}
              config={config}
              includeInternalNotes={includeInternalNotes}
              className="shadow-xl"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
