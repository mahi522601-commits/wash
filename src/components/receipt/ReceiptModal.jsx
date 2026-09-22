import React, { useState, useEffect } from 'react';
import { receiptService } from '../../services/receiptService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { PrintReceipt } from './PrintReceipt';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
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
  Maximize2,
  MessageSquare,
  Send
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
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      receiptService.getReceiptConfig().then((cfg) => {
        setConfig(cfg);
        const mapped = receiptService.mapOrderToReceiptData(order, cfg);
        setReceiptData(mapped);
      });
      const initialPhone = order.whatsapp || order.phone || order.customer?.whatsapp || order.customer?.phone || '';
      setWhatsappPhone(initialPhone);
    }
  }, [order, isOpen]);

  if (!isOpen || !order || !receiptData || !config) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsAppInvoice = () => {
    const phone = whatsappPhone || order.whatsapp || order.phone || order.customer?.phone;
    if (!phone) {
      alert('Please enter a valid mobile number to send via WhatsApp.');
      return;
    }
    const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(order, receiptData);
    whatsappNotificationService.openWhatsAppManual(phone, msg);
  };

  const handleCopyInvoice = async () => {
    const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(order, receiptData);
    await whatsappNotificationService.copyMessageToClipboard(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      
      <div className="relative w-full max-w-5xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in print:max-h-none print:shadow-none print:border-none print:bg-white print:rounded-none print:overflow-visible print:w-full print:static">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          
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
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  previewMode === 'MOBILE'
                    ? 'bg-white text-navy-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Mobile
              </button>
            </div>

            {/* Direct WhatsApp Share Bar */}
            <div className="flex items-center gap-1.5 bg-emerald-50 p-1 rounded-xl border border-emerald-300">
              <input
                type="tel"
                placeholder="Mobile (e.g. 9398724704)"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-32 sm:w-36 px-2.5 py-1 text-xs font-mono font-bold text-emerald-950 bg-white border border-emerald-300 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleSendWhatsAppInvoice}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Send invoice details directly to customer WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Copy Text Invoice Button */}
            <button
              type="button"
              onClick={handleCopyInvoice}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Print / Save PDF Trigger Button */}
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Printer}
              onClick={handlePrint}
              className="shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              Print / Save PDF
            </Button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* Scrollable Receipt Canvas Preview Area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-200/70 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible print:w-full print:static">
          <div className={previewMode === 'MOBILE' ? 'w-full max-w-sm print:max-w-none print:w-full' : 'w-full max-w-[210mm] print:max-w-none print:w-full'}>
            <PrintReceipt
              receiptData={receiptData}
              config={config}
              includeInternalNotes={includeInternalNotes}
              className="shadow-xl print:shadow-none"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
