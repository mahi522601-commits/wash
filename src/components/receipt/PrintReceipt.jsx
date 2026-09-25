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
  config = {},
  includeInternalNotes = false,
  className = '',
}) => {
  if (!receiptData) return null;

  const {
    invoiceNumber,
    orderNumber,
    invoiceDate,
    receiptGeneratedDate,
    customer = {},
    pickupLocation,
    serviceName,
    schedule = {},
    items = [],
    priceSnapshot,
    paymentStatus,
    paymentMethod = 'CASH',
    paymentId,
    customerStage,
    internalNotes,
  } = receiptData;

  // Compute tracking and payment QR URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwashlaundry.com';
  const trackingUrl = `${origin}/track-order?id=${orderNumber}`;
  const trackingQrUrl = generateQrImageUrl(trackingUrl, 120);

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
      className={`techwash-receipt-sheet bg-white text-[#111827] font-sans antialiased max-w-[210mm] mx-auto p-4 sm:p-5 border border-slate-200 shadow-xl rounded-2xl print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none print:m-0 ${className}`}
    >
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER: BRANDING (LEFT) + INVOICE META (RIGHT)
      ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start pb-2 border-b-2 border-[#F97316]/40">
        
        {/* Left: Brand Identity */}
        <div className="space-y-0.5 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-orange-200 flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden">
              <img 
                src="/techwashlogo.webp" 
                alt="Tech Wash" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <h1 className="text-base font-black font-display tracking-tight text-slate-900 uppercase leading-none">
                {config.businessName || 'Tech Wash'}
              </h1>
              <p className="text-[9px] font-bold text-[#EA580C] tracking-wider uppercase mt-0.5">
                {config.tagline || 'Next-Gen Fabric Care & Couture Spa'}
              </p>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-500 pt-0.5 space-y-0.5 leading-tight">
            <p className="font-medium text-slate-700">{config.address || 'Doorstep Pickup & Delivery Hub, Hyderabad'}</p>
            <div className="flex flex-wrap items-center gap-x-2 text-slate-600 font-semibold text-[8px]">
              <span>Tel: {config.phone || '+91 63048 45567'}</span>
              <span>•</span>
              <span>{config.email || 'care@techwashlaundry.com'}</span>
              <span>•</span>
              <span>{config.website || 'https://techwashlaundry.com'}</span>
            </div>
            {config.showGst && config.gstNumber && (
              <p className="font-bold text-slate-800 text-[8px]">
                GSTIN: <span className="font-mono text-[#EA580C]">{config.gstNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Invoice Number & Dates */}
        <div className="text-right space-y-0.5">
          <div className="inline-block px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#EA580C] text-[9.5px] font-black tracking-wider uppercase">
            Tax Invoice / Receipt
          </div>
          
          <div>
            <div className="text-sm font-black font-display text-slate-900 font-mono tracking-tight">
              {invoiceNumber}
            </div>
            <div className="text-[9.5px] font-bold text-slate-500">
              Order ID: <span className="font-mono text-slate-800 font-bold">{orderNumber}</span>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-500 space-y-0.5 leading-tight">
            <div>Order Date: <strong className="text-slate-800">{invoiceDate}</strong></div>
            <div>Generated: <span className="text-slate-600">{receiptGeneratedDate}</span></div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          2. CUSTOMER & ORDER LOGISTICS (2-COLUMN BOX)
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 py-1.5 text-[10.5px]">
        
        {/* Customer Information */}
        <div className="p-2 rounded-lg bg-orange-50/40 border border-orange-200/70 space-y-0.5">
          <span className="text-[8.5px] font-bold text-[#EA580C] uppercase tracking-wider block">
            Billed & Delivered To
          </span>
          <div className="font-black text-slate-900 text-[11px]">{customer.name || 'Valued Customer'}</div>
          <div className="text-slate-600 font-medium text-[9.5px]">
            Phone: <strong className="text-slate-900">{customer.phone}</strong>
          </div>
          <div className="text-[9.5px] text-slate-600 font-normal leading-tight truncate">
            {customer.address || 'Direct Shop / Counter Drop'}
          </div>
        </div>

        {/* Order Logistics & Schedule */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
          <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">
            Logistics & Schedule
          </span>
          <div className="flex justify-between text-[9.5px]">
            <span className="text-slate-500">Service:</span>
            <span className="font-bold text-slate-900 truncate">{serviceName}</span>
          </div>
          <div className="flex justify-between text-[9.5px]">
            <span className="text-slate-500">Pickup Date:</span>
            <span className="font-semibold text-slate-900">{schedule.pickupDate || 'Today'}</span>
          </div>
          <div className="flex justify-between text-[9.5px]">
            <span className="text-slate-500">Turnaround:</span>
            <span className="font-bold text-[#EA580C]">
              {priceSnapshot?.expressFee > 0 ? '⚡ 24H Express' : 'Standard 48H'}
            </span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          3. GARMENTS & SERVICES LINE ITEM TABLE (SERVICE & SUB-SERVICE)
      ───────────────────────────────────────────────────────── */}
      <div className="pt-0.5">
        <table className="w-full text-left border-collapse text-[10px] print:text-black">
          <thead>
            <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-black text-[8.5px] font-bold uppercase tracking-wider border-b-2 border-slate-900 print:border-black">
              <th className="py-1 px-2 rounded-l-md print:rounded-none w-7 text-center">#</th>
              <th className="py-1 px-2 w-32">Service Name</th>
              <th className="py-1 px-2">Sub-Service / Garment Description</th>
              <th className="py-1 px-2 text-center w-12">Qty</th>
              <th className="py-1 px-2 text-right w-16">Rate (₹)</th>
              <th className="py-1 px-2 rounded-r-md print:rounded-none text-right w-20">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 print:divide-slate-400 text-slate-900 print:text-black">
            {items.map((item, idx) => {
              const itemServiceName = item.serviceName || item.service || serviceName || 'Garment Care';
              const itemSubServiceName = item.name || item.title || item.subServiceName || 'Standard Item';
              const isSameName = itemServiceName.toLowerCase() === itemSubServiceName.toLowerCase();

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 print:hover:bg-transparent border-b border-slate-100 print:border-slate-300">
                  <td className="py-1.5 px-2 text-center text-slate-500 print:text-black font-mono text-[9px]">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-1.5 px-2 font-bold text-slate-800 print:text-black text-[9.5px] align-top">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-orange-50 print:bg-transparent print:p-0 text-orange-900 print:text-black font-semibold text-[9px] border border-orange-200 print:border-none">
                      {itemServiceName}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 align-top">
                    <div className="font-bold text-slate-900 print:text-black text-[10px]">
                      {itemSubServiceName}
                    </div>
                    {(item.category || item.weightKg || item.isWeightItem) && (
                      <div className="text-[8px] text-slate-500 print:text-slate-800 font-medium mt-0.5">
                        {item.category && <span>Category: {item.category}</span>}
                        {item.weightKg && <span className="ml-1">• Weight: {item.weightKg} Kg</span>}
                        {item.dimensions && <span className="ml-1">• Size: {item.dimensions}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-slate-900 print:text-black align-top font-mono">
                    {item.quantity || 1}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-slate-800 print:text-black align-top">
                    {formatCurrency(item.unitPrice !== undefined ? item.unitPrice : (item.price || 0))}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold font-mono text-slate-900 print:text-black align-top">
                    {formatCurrency(item.lineTotal !== undefined ? item.lineTotal : (item.totalPrice || ((item.quantity || 1) * (item.unitPrice || item.price || 0))))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. PAYMENT BREAKDOWN + GRAND TOTAL BOX
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-2.5 pt-1.5 border-t border-slate-200 text-[10px]">
        
        {/* Left Col: Payment Method & Compact Notes */}
        <div className="col-span-7 space-y-1">
          
          {/* Status Badge & Mode */}
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[8.5px]">
                Payment Status
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                (receiptData.balanceAmount === 0 || paymentStatus === 'PAID')
                  ? 'bg-emerald-100 text-emerald-800'
                  : (receiptData.receivedAmount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
              }`}>
                {(receiptData.balanceAmount === 0 || paymentStatus === 'PAID')
                  ? '✓ FULLY PAID'
                  : (receiptData.receivedAmount > 0 ? `⏳ PARTIAL (₹${receiptData.balanceAmount} DUE)` : `⏳ DUE ₹${receiptData.totalAmount || receiptData.balanceAmount}`)}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 text-[9.5px]">
              <span className="text-slate-500">Payment Option:</span>
              <span className="font-semibold text-slate-900">{String(paymentMethod).replace(/_/g, ' ')}</span>
            </div>

            {receiptData.storeBranch && (
              <div className="flex justify-between text-slate-700 text-[8.5px]">
                <span className="text-slate-500">Counter Branch:</span>
                <span className="font-semibold text-orange-700 truncate max-w-[150px]">{receiptData.storeBranch}</span>
              </div>
            )}

            {paymentId && (
              <div className="flex justify-between text-[8.5px] text-slate-500 font-mono">
                <span>Ref:</span>
                <span className="text-slate-800">{paymentId}</span>
              </div>
            )}
          </div>

          {/* Special Instructions (if any) */}
          {schedule.instructions && (
            <div className="p-1 rounded bg-amber-50/70 border border-amber-200 text-[8.5px] text-amber-900 leading-tight">
              <strong className="text-amber-800">Note:</strong> {schedule.instructions}
            </div>
          )}

          {/* Internal Staff Notes (Only if Admin enabled) */}
          {includeInternalNotes && internalNotes && (
            <div className="p-1 rounded bg-rose-50 border border-rose-200 text-[8.5px] text-rose-900 leading-tight">
              <strong className="text-rose-800">Internal:</strong> {internalNotes}
            </div>
          )}

        </div>

        {/* Right Col: Itemized Totals & Grand Total & Balance Due */}
        <div className="col-span-5 space-y-0.5 text-slate-600">
          
          <div className="flex justify-between py-0.2 text-[9.5px]">
            <span>Items Subtotal:</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrency(priceSnapshot?.itemsSubtotal || receiptData.totalAmount || 0)}
            </span>
          </div>

          {priceSnapshot?.expressFee > 0 && (
            <div className="flex justify-between py-0.2 text-[#EA580C] text-[9.5px]">
              <span>Express Priority:</span>
              <span className="font-mono font-bold">+{formatCurrency(priceSnapshot.expressFee)}</span>
            </div>
          )}

          {priceSnapshot?.deliveryFee > 0 && (
            <div className="flex justify-between py-0.2 text-[9.5px]">
              <span>Doorstep Logistics:</span>
              <span className="font-mono text-slate-900">
                {formatCurrency(priceSnapshot.deliveryFee)}
              </span>
            </div>
          )}

          {/* GRAND TOTAL HIGHLIGHT BOX */}
          <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 text-white flex items-center justify-between border border-orange-400/30 print:bg-slate-100 print:text-black print:border-black">
            <div>
              <div className="text-[8px] font-bold uppercase tracking-widest text-orange-300 print:text-black">
                Grand Total
              </div>
              <div className="text-[7.5px] text-slate-400 print:text-slate-600">Net Bill Amount</div>
            </div>
            <div className="text-sm sm:text-base font-black font-display font-mono text-[#F97316] print:text-black">
              {formatCurrency(priceSnapshot?.finalTotal || receiptData.totalAmount || 0)}
            </div>
          </div>

          {/* RECEIVED & BALANCE DUE ROW */}
          <div className="pt-1 space-y-0.5 text-[9px] border-t border-slate-100">
            <div className="flex justify-between text-slate-700">
              <span>Amount Received:</span>
              <span className="font-mono font-bold text-emerald-700 print:text-black">
                {formatCurrency(receiptData.receivedAmount || 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold text-slate-800">Balance Due:</span>
              <span className={`font-mono font-black ${(receiptData.balanceAmount || 0) > 0 ? 'text-rose-600 print:text-black' : 'text-emerald-600 print:text-black'}`}>
                {(receiptData.balanceAmount || 0) > 0 ? formatCurrency(receiptData.balanceAmount) : '₹0 (Cleared)'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          5. 6-STAGE VISUAL TIMELINE BAR
      ───────────────────────────────────────────────────────── */}
      <div className="mt-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-[8px] font-semibold">
          {MILESTONES.map((m, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;
            return (
              <div key={m.key} className="flex items-center gap-0.5">
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center text-[7.5px] font-bold shrink-0 ${
                    isCompleted
                      ? 'bg-[#F97316] text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={isCurrent ? 'font-bold text-[#EA580C]' : isCompleted ? 'text-slate-800' : 'text-slate-400'}>
                  {m.label}
                </span>
                {idx < MILESTONES.length - 1 && (
                  <span className={`mx-0.5 text-[6.5px] ${isCompleted ? 'text-[#F97316]' : 'text-slate-300'}`}>
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
      <div className="mt-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center text-[9.5px]">
        
        {/* Left: Location Confirmation text */}
        <div className="col-span-9 space-y-0.5">
          <div className="flex items-center gap-1 text-[#EA580C] font-bold text-[9px]">
            <MapPin className="w-2.5 h-2.5 text-[#EA580C] shrink-0" />
            <span>Doorstep Coordinates Locked</span>
            {pickupLocation?.locationSource === 'GPS' && (
              <span className="text-[7.5px] px-1 py-0.2 rounded bg-orange-100 text-[#EA580C] font-mono">
                🛰️ GPS
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-700 leading-snug truncate">
            {pickupLocation?.formattedAddress || customer.address || 'In-Store Drop Counter'}
          </p>
        </div>

        {/* Right: Live Tracking QR */}
        {config.showTrackingQr !== false && (
          <div className="col-span-3 flex items-center justify-end gap-1">
            <div className="text-right">
              <div className="text-[8px] font-bold text-slate-800 leading-none">Live Status</div>
              <div className="text-[7px] text-slate-400 leading-none mt-0.5">Scan to Track</div>
            </div>
            <img
              src={trackingQrUrl}
              alt="Tracking QR Code"
              className="w-8 h-8 object-contain rounded border border-slate-300 p-0.5 bg-white shrink-0"
            />
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────
          7. FOOTER & TERMS & CONDITIONS
      ───────────────────────────────────────────────────────── */}
      <div className="mt-1.5 pt-1 border-t border-slate-200 text-[8px] text-slate-500 flex justify-between items-end gap-2 leading-tight">
        
        <div className="space-y-0.5 max-w-md">
          <p className="font-bold text-slate-800 text-[8.5px]">
            {config.thankYouMessage || 'Thank you for choosing Tech Wash Laundry Services.'}
          </p>
          <p className="text-[7.5px] text-slate-400">
            {config.footerContactNote || 'Customer Concierge: +91 63048 45567 • care@techwashlaundry.com • https://techwashlaundry.com'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[8px] font-bold text-slate-900">Authorized Signatory</div>
          <div className="text-[7px] text-slate-400 font-mono">Tech Wash Operations</div>
        </div>

      </div>

    </div>
  );
};
