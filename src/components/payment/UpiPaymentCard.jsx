import React, { useState } from 'react';
import { generateQrImageUrl, generateUpiQrData } from '../../utils/qrCode';
import { UpiAppLogosRow, UpiIcon } from './UpiLogos';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';

export const UpiPaymentCard = ({
  upiConfig = {},
  amount = 0,
  orderNumber = '',
  customerName = '',
  className = '',
  compact = false,
  showDirectPayButton = true,
  title = "Instant UPI Scan & Pay",
  description = "Instant verification with Google Pay, PhonePe, Paytm & BHIM"
}) => {
  const [copied, setCopied] = useState(false);

  const upiId = (upiConfig?.upiId || 'techwash@upi').trim();
  const merchantName = (upiConfig?.merchantName || 'Tech Wash Laundry Services').trim();
  const customQrImage = upiConfig?.qrImageUrl || '';
  const instructions = upiConfig?.instructions || 'Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM) and complete payment.';

  // Construct standard UPI payment URI
  const upiDeepLink = generateUpiQrData({
    upiId,
    payeeName: merchantName,
    amount: amount > 0 ? amount : undefined,
    orderNumber: orderNumber || 'TECHWASH',
    note: orderNumber ? `Tech Wash Order #${orderNumber}` : 'Tech Wash Laundry Payment'
  });

  // Generate QR Code URL
  const qrCodeUrl = customQrImage || generateQrImageUrl(upiDeepLink, 220);

  const handleCopyUpiId = () => {
    try {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  return (
    <div className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-900 text-white border border-purple-500/30 shadow-xl space-y-5 ${className}`}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shadow-md shrink-0">
            <UpiIcon className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black font-display tracking-tight text-white">
                {title}
              </h4>
              <Badge variant="emerald" size="sm">0% Surcharge</Badge>
            </div>
            <p className="text-[11px] text-purple-200/80">
              {description}
            </p>
          </div>
        </div>

        {amount > 0 && (
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Payable Amount</span>
            <span className="text-lg sm:text-xl font-black font-display text-emerald-400">
              {formatCurrency(amount)}
            </span>
          </div>
        )}
      </div>

      {/* Main Body: QR Code + Details */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        
        {/* Left / Center: QR Code Display */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-white/20 group">
            <img 
              src={qrCodeUrl} 
              alt={`UPI QR Code for ${merchantName}`} 
              className="w-40 h-40 object-contain rounded-lg"
              onError={(e) => {
                // Fallback to dynamic QR server
                e.target.src = generateQrImageUrl(upiDeepLink, 220);
              }}
            />
            {/* Center UPI Mini Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center p-0.5">
                <span className="text-[9px] font-black text-emerald-700">UPI</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-300 font-medium mt-2 flex items-center gap-1">
            <QrCode className="w-3 h-3 text-purple-300" />
            <span>Point camera to scan & pay</span>
          </span>
        </div>

        {/* Right: UPI ID, App Logos & 1-Tap Pay Action */}
        <div className="sm:col-span-7 space-y-4">
          
          {/* Merchant UPI ID Box */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-purple-300 block">
              Official Merchant UPI ID
            </span>
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/10 border border-white/15">
              <div className="flex-1 min-w-0 font-mono font-bold text-xs sm:text-sm text-yellow-300 truncate select-all px-1">
                {upiId}
              </div>
              <button
                type="button"
                onClick={handleCopyUpiId}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                title="Copy UPI ID to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-[10px] text-slate-300 flex items-center justify-between px-1">
              <span>Payee: <strong className="text-white">{merchantName}</strong></span>
              {orderNumber && <span>Ref: <strong className="text-purple-300 font-mono">#{orderNumber}</strong></span>}
            </div>
          </div>

          {/* Supported UPI Apps Row */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Accepted on all UPI Apps
            </span>
            <UpiAppLogosRow />
          </div>

          {/* Direct Pay with UPI App (Deep Link for Mobile) */}
          {showDirectPayButton && (
            <div className="pt-1">
              <a
                href={upiDeepLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4" />
                <span>Tap to Open Bank / UPI App</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          )}

        </div>

      </div>

      {/* Footer Info Notice */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {instructions}
        </p>
      </div>

    </div>
  );
};

