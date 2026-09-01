import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { generateQrImageUrl, generateUpiQrData } from '../../utils/qrCode';
import { 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Check, 
  QrCode,
  Truck
} from 'lucide-react';

export const PrintReceipt = ({
  receiptData,
  config,
  includeInternalNotes = false,
  className = '',
}) => {
  if (!receiptData) return null;

  const {
    invoiceNumber,
    orderNumber,
    invoiceDate,
    receiptGeneratedDate,
    customer,
    pickupLocation,
    serviceName,
    schedule,
    items = [],
    priceSnapshot,
    paymentStatus,
    paymentMethod,
    paymentId,
    customerStage,
    internalNotes,
  } = receiptData;

  // Compute tracking and payment QR URLs
  const trackingUrl = `https://techwash.in/track-order?id=${orderNumber}`;
  const trackingQrUrl = generateQrImageUrl(trackingUrl, 160);

  const upiQrData = generateUpiQrData({
    upiId: config.upiId || 'techwash@upi',
    payeeName: config.businessName || 'Tech Wash Laundry',
    amount: paymentStatus === 'PAID' ? 0 : priceSnapshot?.finalTotal,
    orderNumber: orderNumber,
  });
  const upiQrUrl = generateQrImageUrl(upiQrData, 160);

  // Status mapping for the 6-stage visual milestone
  const MILESTONES = [
    { key: 'CONFIRMED', label: 'Booked' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'CLEANING', label: 'Hygienic Wash' },
    { key: 'FINISHING', label: 'Steam Press' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStageIdx = Math.max(
    0,
    MILESTONES.findIndex((m) => m.key === customerStage)
  );

  return (
    <div
      id="techwash-printable-receipt"
      className={`techwash-receipt-sheet bg-white text-[#171717] font-sans antialiased max-w-[210mm] mx-auto p-8 sm:p-10 border border-slate-200 shadow-2xl rounded-2xl print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none ${className}`}
      style={{ minHeight: '290mm' }}
    >
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER: BRANDING (LEFT) + INVOICE META (RIGHT)
      ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-[#6D28D9]/30">
        
        {/* Left: Brand Identity */}
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E1B4B] via-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white shadow-md print:shadow-none">
              <Sparkles className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h1 className="text-xl font-black font-display tracking-tight text-[#1E1B4B] uppercase">
                {config.businessName || 'Tech Wash'}
              </h1>
              <p className="text-[10px] font-bold text-[#6D28D9] tracking-wider uppercase">
                {config.tagline || 'Next-Gen Fabric Care & Couture Spa'}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-1 space-y-0.5 leading-tight">
            <p className="font-medium text-slate-700">{config.address}</p>
            <div className="flex flex-wrap items-center gap-x-3 text-slate-600 font-semibold">
              <span>Tel: {config.phone}</span>
              <span>•</span>
              <span>{config.email}</span>
              <span>•</span>
              <span>{config.website}</span>
            </div>
            {config.showGst && config.gstNumber && (
              <p className="font-bold text-slate-800">
                GSTIN: <span className="font-mono text-[#6D28D9]">{config.gstNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Invoice Number & Dates */}
        <div className="text-right space-y-1.5">
          <div className="inline-block px-3 py-1 rounded-lg bg-[#F5F3FF] border border-[#6D28D9]/20 text-[#6D28D9] text-xs font-black tracking-wider uppercase">
            Tax Invoice / Receipt
          </div>
          
          <div>
            <div className="text-lg sm:text-xl font-black font-display text-[#1E1B4B] font-mono tracking-tight">
              {invoiceNumber}
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              Order ID: <span className="font-mono text-slate-700">{orderNumber}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div>Order Date: <strong className="text-slate-800">{invoiceDate}</strong></div>
            <div>Generated: <span className="text-slate-600">{receiptGeneratedDate}</span></div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          2. CUSTOMER & ORDER LOGISTICS (2-COLUMN BOX)
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 py-4 text-xs">
        
        {/* Customer Information */}
        <div className="p-3.5 rounded-xl bg-[#F5F3FF]/70 border border-[#6D28D9]/20 space-y-1">
          <span className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-wider block">
            Billed & Delivered To
          </span>
          <div className="font-black text-slate-900 text-sm">{customer.name}</div>
          <div className="text-slate-600 font-medium">
            Phone: <strong className="text-slate-900">{customer.phone}</strong>
          </div>
          {customer.email && (
            <div className="text-slate-500 text-[11px] truncate">{customer.email}</div>
          )}
          <div className="text-[11px] text-slate-700 font-normal leading-snug pt-0.5">
            {customer.address}
          </div>
        </div>

        {/* Order Logistics & Schedule */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Logistics & Schedule
          </span>
          <div className="flex justify-between">
            <span className="text-slate-500">Service Category:</span>
            <span className="font-bold text-slate-900">{serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pickup Date & Slot:</span>
            <span className="font-semibold text-slate-900">{schedule.pickupDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Time Window:</span>
            <span className="font-medium text-slate-800">{schedule.pickupSlot}</span>
          </div>
          <div className="flex justify-between pt-0.5 border-t border-slate-200">
            <span className="text-slate-500">Delivery Speed:</span>
            <span className="font-bold text-[#6D28D9]">
              {priceSnapshot?.expressFee > 0 ? '⚡ 24H Express Turnaround' : 'Standard 48H Eco-Care'}
            </span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          3. GARMENTS & SERVICES LINE ITEM TABLE
      ───────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#1E1B4B] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 rounded-l-lg w-10 text-center">#</th>
              <th className="py-2.5 px-3">Service & Garment Description</th>
              <th className="py-2.5 px-3 text-center w-16">Qty</th>
              <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
              <th className="py-2.5 px-3 rounded-r-lg text-right w-28">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/80">
                <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-900 text-xs">
                    {item.name || item.title || serviceName}
                  </div>
                  {(item.category || item.instructions) && (
                    <div className="text-[10px] text-slate-500">
                      {item.category ? `Category: ${item.category}` : ''}
                      {item.instructions ? ` • Note: ${item.instructions}` : ''}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                  {item.quantity || 1}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                  {formatCurrency(item.unitPrice || item.price || 0)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                  {formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. PAYMENT BREAKDOWN + GRAND TOTAL BOX
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 pt-4 border-t border-slate-200">
        
        {/* Left Col: Payment Method & Compact Notes */}
        <div className="col-span-7 space-y-3">
          
          {/* Payment Status & Method Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                Payment Status
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                paymentStatus === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : paymentStatus === 'REFUNDED'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {paymentStatus === 'PAID' ? '✓ PAID IN FULL' : paymentStatus}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 text-[11px]">
              <span className="text-slate-500">Payment Option:</span>
              <span className="font-semibold text-slate-900">{paymentMethod.replace(/_/g, ' ')}</span>
            </div>

            {paymentId && (
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Transaction Ref:</span>
                <span className="text-slate-800">{paymentId}</span>
              </div>
            )}
          </div>

          {/* Customer Special Instructions (if any) */}
          {schedule.instructions && (
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900">
              <strong className="text-amber-800">Customer Note:</strong> {schedule.instructions}
            </div>
          )}

          {/* Internal Staff Notes (Only if Admin enabled) */}
          {includeInternalNotes && internalNotes && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-900">
              <strong className="text-rose-800">Internal Remarks:</strong> {internalNotes}
            </div>
          )}

        </div>

        {/* Right Col: Itemized Totals & Grand Total */}
        <div className="col-span-5 space-y-1.5 text-xs text-slate-600">
          
          <div className="flex justify-between py-0.5">
            <span>Items Subtotal:</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(priceSnapshot?.itemsSubtotal || receiptData.totalAmount)}
            </span>
          </div>

          {priceSnapshot?.expressFee > 0 && (
            <div className="flex justify-between py-0.5 text-[#6D28D9]">
              <span>Express Priority Fee:</span>
              <span className="font-mono font-bold">+{formatCurrency(priceSnapshot.expressFee)}</span>
            </div>
          )}

          {priceSnapshot?.discountAmount > 0 && (
            <div className="flex justify-between py-0.5 text-emerald-600">
              <span>Promotional Discount:</span>
              <span className="font-mono font-bold">-{formatCurrency(priceSnapshot.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between py-0.5">
            <span>Doorstep Logistics Fee:</span>
            <span className="font-mono text-slate-900">
              {priceSnapshot?.deliveryFee === 0 ? 'FREE' : formatCurrency(priceSnapshot?.deliveryFee || 0)}
            </span>
          </div>

          <div className="flex justify-between py-0.5 text-slate-400 text-[11px]">
            <span>GST / Taxes (5% Included):</span>
            <span className="font-mono">{formatCurrency(priceSnapshot?.taxAmount || 0)}</span>
          </div>

          {/* GRAND TOTAL HIGHLIGHT BOX */}
          <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-[#1E1B4B] to-[#6D28D9] text-white flex items-center justify-between shadow-md print:shadow-none">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                Grand Total Payable
              </div>
              <div className="text-[10px] text-slate-300">Net Amount (INR)</div>
            </div>
            <div className="text-xl font-black font-display font-mono text-white">
              {formatCurrency(priceSnapshot?.finalTotal || receiptData.totalAmount)}
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          5. 6-STAGE VISUAL TIMELINE BAR
      ───────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Order Status Lifecycle
        </span>
        <div className="flex items-center justify-between text-[10px] font-semibold">
          {MILESTONES.map((m, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;
            return (
              <div key={m.key} className="flex items-center gap-1.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    isCompleted
                      ? 'bg-[#6D28D9] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={isCurrent ? 'font-bold text-[#6D28D9]' : isCompleted ? 'text-slate-800' : 'text-slate-400'}>
                  {m.label}
                </span>
                {idx < MILESTONES.length - 1 && (
                  <span className={`mx-1 text-[8px] ${isCompleted ? 'text-[#6D28D9]' : 'text-slate-300'}`}>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          6. QR CODES + PICKUP LOCATION REFERENCE
      ───────────────────────────────────────────────────────── */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-3 items-center text-xs">
        
        {/* Left: Location Confirmation text */}
        <div className="col-span-8 space-y-1">
          <div className="flex items-center gap-1.5 text-[#6D28D9] font-bold text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Doorstep Pickup Coordinates Locked</span>
            {pickupLocation?.locationSource === 'GPS' && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-mono">
                🛰️ GPS Verified
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-700 leading-snug">
            {pickupLocation?.formattedAddress || customer.address}
          </p>
          {pickupLocation?.landmark && (
            <p className="text-[10px] text-slate-500 font-medium">
              Landmark: {pickupLocation.landmark}
            </p>
          )}
        </div>

        {/* Right: Live Tracking QR */}
        {config.showTrackingQr && (
          <div className="col-span-4 flex items-center justify-end gap-2.5">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-900 leading-tight">Live Tracking</div>
              <div className="text-[9px] text-slate-400">Scan via Mobile Camera</div>
            </div>
            <img
              src={trackingQrUrl}
              alt="Tracking QR Code"
              className="w-14 h-14 object-contain rounded-md border border-slate-300 p-0.5 bg-white shrink-0"
            />
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────
          7. FOOTER & TERMS & CONDITIONS
      ───────────────────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t-2 border-slate-100 text-[10px] text-slate-500 flex justify-between items-end gap-4">
        
        <div className="space-y-1 max-w-lg">
          <p className="font-bold text-slate-800">
            {config.thankYouMessage || 'Thank you for choosing Tech Wash Laundry Services.'}
          </p>
          {config.showTerms && config.termsAndConditions && (
            <p className="text-[9px] text-slate-400 leading-tight whitespace-pre-line">
              {config.termsAndConditions}
            </p>
          )}
          <p className="text-[9px] text-slate-400">
            {config.footerContactNote || 'Customer Concierge: +91 98765 43210 • care@techwash.in'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold text-[#1E1B4B]">Authorized Signatory</div>
          <div className="text-[9px] text-slate-400 font-mono">Tech Wash Operations</div>
        </div>

      </div>

    </div>
  );
};
