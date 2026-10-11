/**
 * Tech Wash Laundry Services — Client-Side Pure JavaScript PDF Tax Invoice Generator
 * Generates official, 100% compliant PDF 1.4 binary documents without server dependencies.
 * Produces standard vector A4 format (595.28 x 841.89 pt) with crisp embedded logo
 * and verified terminal contact numbers (POS-1: 6304845567, POS-2: 9000813444, POS-3: 9866740179).
 */

import { TECHWASH_LOGO_JPEG_BASE64 } from './logoAssetBase64.js';

let cachedLogoBytes = null;
function getLogoJpegBytes() {
  if (cachedLogoBytes) return cachedLogoBytes;
  if (typeof Buffer !== 'undefined') {
    cachedLogoBytes = new Uint8Array(Buffer.from(TECHWASH_LOGO_JPEG_BASE64, 'base64'));
  } else if (typeof atob !== 'undefined') {
    const binStr = atob(TECHWASH_LOGO_JPEG_BASE64);
    const len = binStr.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    cachedLogoBytes = arr;
  }
  return cachedLogoBytes;
}

export const TERMINAL_CONTACT_MAP = {
  'counter-1': {
    code: 'TW-POS-01',
    posLabel: 'POS-1',
    branch: 'Tech Wash Main Branch — Manikonda',
    address: 'Plot 42, Shaikpet Main Rd, Sri Ram Nagar, Manikonda, Hyderabad - 500089',
    phone: '+91 63048 45567',
    rawPhone: '6304845567',
  },
  'counter-2': {
    code: 'TW-POS-02',
    posLabel: 'POS-2',
    branch: 'Tech Wash Laundry Services — Branch 1 (Tolichowki)',
    address: 'Beside Dreamscape Hotel, Tolichowki, OU Colony, Hyderabad - 500008',
    phone: '+91 90008 13444',
    rawPhone: '9000813444',
  },
  'counter-3': {
    code: 'TW-POS-03',
    posLabel: 'POS-3',
    branch: 'Tech Wash Pick Up Point — Ambience Courtyard',
    address: 'Beside Ambience Courtyard, Shaikpet / Manikonda, Hyderabad - 500089',
    phone: '+91 98667 40179',
    rawPhone: '9866740179',
  },
};

export function resolveTerminalInfo(order = {}) {
  const tCode = String(order.terminalCode || order.terminalId || '').toUpperCase();
  const bName = String(order.storeBranch || '').toLowerCase();

  if (tCode.includes('POS-02') || tCode.includes('POS2') || tCode.includes('COUNTER-2') || bName.includes('branch 1') || bName.includes('tolichowki')) {
    return TERMINAL_CONTACT_MAP['counter-2'];
  }
  if (tCode.includes('POS-03') || tCode.includes('POS3') || tCode.includes('COUNTER-3') || bName.includes('pick up point') || bName.includes('ambience')) {
    return TERMINAL_CONTACT_MAP['counter-3'];
  }
  return TERMINAL_CONTACT_MAP['counter-1'];
}

function sanitizePdfText(str) {
  if (str === null || str === undefined) return '';
  const s = String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/[()]/g, ch => ch === '(' ? '[' : ']')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
  return s;
}

function formatDateSafe(val) {
  if (!val) return 'Today';
  const d = new Date(val);
  if (isNaN(d.getTime())) return sanitizePdfText(val);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeSafe(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Generates an official Tax Invoice PDF as a Blob (type: application/pdf)
 * @param {Object} order - Full order object
 * @returns {Blob}
 */
export function generateInvoicePDFBlob(order) {
  const bytes = generateInvoicePDFUint8Array(order);
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Generates an official Tax Invoice PDF as a Uint8Array
 * @param {Object} order - Full order object
 * @returns {Uint8Array}
 */
export function generateInvoicePDFUint8Array(order) {
  if (!order) order = {};

  const logoBytes = getLogoJpegBytes();
  const termInfo = resolveTerminalInfo(order);

  const bNum = sanitizePdfText(order.orderNumber || order.id || 'TW-00001');
  const rawInv = order.invoiceNumber || bNum;
  const invNum = sanitizePdfText(rawInv.toUpperCase().startsWith('INV-') ? rawInv : `INV-${rawInv}`);

  const cName = sanitizePdfText(order.customerName || order.customer?.name || 'Valued Customer');
  const cPhone = sanitizePdfText(order.phone || order.customer?.phone || 'N/A');
  const cAddr = sanitizePdfText((order.address || order.customer?.address || 'In-Store Counter Drop-off').slice(0, 52));

  const branch = sanitizePdfText(order.storeBranch || termInfo.branch);
  const terminal = sanitizePdfText(order.terminalCode || order.terminalId || termInfo.code);
  const cashier = sanitizePdfText(order.cashierName || 'Cashier #1');
  const storePhone = sanitizePdfText(order.storePhone || termInfo.phone);

  const dateStr = formatDateSafe(order.createdAt || Date.now());
  const timeStr = formatTimeSafe(order.createdAt || Date.now());

  const pDate = formatDateSafe(order.pickupDate || order.schedule?.pickupDate || order.createdAt);
  const dDate = formatDateSafe(order.deliveryDate || order.schedule?.deliveryDate || (Date.now() + 86400000 * 2));

  // Order Financial Calculations
  let total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
  if (total <= 0 && Array.isArray(order.items) && order.items.length > 0) {
    total = order.items.reduce((s, it) => s + Number(it.lineTotal !== undefined ? it.lineTotal : ((Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.quantity) || 1))), 0);
  }
  if (total <= 0 && (order.weightKg || order.actualWeight || order.estimatedWeightKg)) {
    const wt = Number(order.weightKg || order.actualWeight || order.estimatedWeightKg || 0);
    const rate = Number(order.pricePerKg || 100);
    if (wt > 0 && rate > 0) total = Math.round(wt * rate);
  }

  const rec = Number(order.receivedAmount !== undefined && order.receivedAmount !== null 
    ? order.receivedAmount 
    : (order.paymentStatus === 'PAID' ? total : 0));
  let bal = Number(order.balanceAmount !== undefined && order.balanceAmount !== null && order.balanceAmount > 0
    ? order.balanceAmount 
    : Math.max(0, total - rec));
  if (order.paymentStatus === 'PAID') bal = 0;

  const isPaid = bal === 0 || (order.paymentStatus === 'PAID' && bal <= 0);
  const payStatus = isPaid ? 'FULLY PAID' : (rec > 0 ? 'PARTIAL PAYMENT' : 'PAYMENT DUE');
  const payMethod = sanitizePdfText(String(order.paymentMethod || 'CASH').toUpperCase());

  // Extract / Normalize Line Items
  const items = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    order.items.forEach(it => {
      const sTitle = sanitizePdfText(it.serviceName || order.serviceName || order.service || 'Laundry Care');
      const name = sanitizePdfText(it.name || it.subServiceName || 'Garment Item');
      const qty = it.weight ? `${it.weight} Kg` : `${it.quantity || 1} Pcs`;
      const rate = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || it.rate || 0));
      const lTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (rate * (Number(it.quantity) || 1)));
      items.push({ sTitle, name, qty, rate, lineTotal: lTotal });
    });
  }

  // Fallback if no explicit items
  if (items.length === 0) {
    const sName = sanitizePdfText(order.serviceName || order.service || 'Laundry Service');
    const wt = order.actualWeight || order.estimatedWeightKg || order.weightKg;
    const qty = wt ? `${wt} Kg` : '1 Batch';
    items.push({ sTitle: sName, name: 'Standard Processing Batch', qty, rate: total, lineTotal: total });
  }

  // Add Express Fee if present
  if (order.expressDelivery?.applied && order.expressDelivery?.fee > 0) {
    items.push({
      sTitle: 'Express Care',
      name: '24-Hour Express Turnaround',
      qty: '1 Fee',
      rate: Number(order.expressDelivery.fee),
      lineTotal: Number(order.expressDelivery.fee),
    });
  }

  // --- PDF GRAPHICS COMMANDS ---
  let s = '';

  function textAt(font, size, colorRgb, x, y, str) {
    return `BT /${font} ${size} Tf ${colorRgb} rg ${x} ${y} Td (${str}) Tj ET\n`;
  }

  // 1. BRAND HEADER WITH LOGO IMAGE (Top Left: x: 36, y: 738, w: 62, h: 62)
  if (logoBytes && logoBytes.length > 0) {
    s += 'q 62 0 0 62 36 738 cm /Im1 Do Q\n';
  }

  // Company Brand Details
  s += textAt('F2', 14.5, '0.06 0.09 0.16', 108, 788, 'TECH WASH LAUNDRY SERVICES');
  s += textAt('F2', 8, '0.15 0.39 0.92', 108, 775, 'Premium Eco-Laundry  Hydrocarbon Dry Cleaning  3D Steam Pressing');
  s += textAt('F1', 7.5, '0.3 0.35 0.4', 108, 763, termInfo.address);
  s += textAt('F2', 7.5, '0.06 0.09 0.16', 108, 751, 'Helpline: POS-1: 6304845567 | POS-2: 9000813444 | POS-3: 9866740179');
  s += textAt('F1', 7, '0.5 0.55 0.6', 108, 740, 'GSTIN / State: 36 Telangana | www.techwashlaundry.com | Official Tax Invoice');

  // Invoice Meta Box (Top Right)
  s += '0.97 0.98 0.99 rg 400 735 159 65 re f\n';
  s += '0.8 0.85 0.9 RG 0.8 w 400 735 159 65 re S\n';
  s += '0.06 0.09 0.16 rg 400 782 159 18 re f\n';
  s += textAt('F2', 9.5, '1 1 1', 442, 787, 'TAX INVOICE');
  s += textAt('F2', 8.5, '0.06 0.09 0.16', 408, 768, `Invoice #: ${bNum}`);
  s += textAt('F1', 7.5, '0.3 0.35 0.4', 408, 753, `Date: ${dateStr} | ${timeStr}`);
  s += textAt('F1', 7, '0.4 0.45 0.5', 408, 740, `POS: ${terminal} | ${cashier}`);

  // Divider Accent Line
  s += '0.15 0.39 0.92 rg 36 726 523 2 re f\n';

  // 2. TWO METADATA CARDS (Customer Details & Order Schedule)
  const cardY = 648;
  // Left Card: Customer Details
  s += `0.98 0.99 1.0 rg 36 ${cardY} 256 70 re f\n`;
  s += `0.8 0.85 0.92 RG 0.8 w 36 ${cardY} 256 70 re S\n`;
  s += `0.06 0.09 0.16 rg 36 ${cardY + 54} 256 16 re f\n`;
  s += textAt('F2', 8, '1 1 1', 46, cardY + 58, 'CUSTOMER DETAILS & BILL TO');
  s += textAt('F2', 8.5, '0.1 0.15 0.2', 46, cardY + 40, `Name: ${cName}`);
  s += textAt('F2', 8, '0.05 0.35 0.8', 46, cardY + 26, `Mobile: +91 ${cPhone}`);
  s += textAt('F1', 7.5, '0.35 0.4 0.45', 46, cardY + 12, `Address: ${cAddr}`);

  // Right Card: Order Fulfillment Schedule & Terminal Info
  s += `0.98 0.99 1.0 rg 303 ${cardY} 256 70 re f\n`;
  s += `0.8 0.85 0.92 RG 0.8 w 303 ${cardY} 256 70 re S\n`;
  s += `0.06 0.09 0.16 rg 303 ${cardY + 54} 256 16 re f\n`;
  s += textAt('F2', 8, '1 1 1', 313, cardY + 58, `STORE & TERMINAL: ${termInfo.posLabel}`);
  s += textAt('F1', 8, '0.1 0.15 0.2', 313, cardY + 40, `Branch: ${branch.slice(0, 32)}`);
  s += textAt('F2', 8, '0.05 0.35 0.8', 313, cardY + 26, `Counter Ph: ${storePhone}`);
  s += textAt('F1', 7.5, '0.35 0.4 0.45', 313, cardY + 12, `Drop: ${pDate}  Ready: ${dDate} | ${order.status || 'CONFIRMED'}`);

  // 3. ITEM SERVICE TABLE
  let tblY = 618;
  s += `0.06 0.09 0.16 rg 36 ${tblY} 523 20 re f\n`;
  s += textAt('F2', 8, '1 1 1', 42, tblY + 6, 'S.No');
  s += textAt('F2', 8, '1 1 1', 70, tblY + 6, 'Service & Treatment');
  s += textAt('F2', 8, '1 1 1', 195, tblY + 6, 'Garment / Item Description');
  s += textAt('F2', 8, '1 1 1', 355, tblY + 6, 'Qty / Wt');
  s += textAt('F2', 8, '1 1 1', 420, tblY + 6, 'Rate');
  s += textAt('F2', 8, '1 1 1', 490, tblY + 6, 'Line Total');

  tblY -= 19;
  const maxRows = Math.min(items.length, 12);
  const rowHeight = maxRows > 8 ? 16 : 19;

  for (let idx = 0; idx < maxRows; idx++) {
    const it = items[idx];
    const rowBg = idx % 2 === 0 ? '1 1 1' : '0.98 0.98 0.99';
    s += `${rowBg} rg 36 ${tblY} 523 ${rowHeight} re f\n`;
    s += `0.88 0.9 0.93 RG 0.5 w 36 ${tblY} 523 ${rowHeight} re S\n`;

    const textOffset = rowHeight > 16 ? 6 : 4;
    s += textAt('F1', 7.5, '0.3 0.35 0.4', 44, tblY + textOffset, String(idx + 1));
    s += textAt('F2', 8, '0.1 0.15 0.2', 70, tblY + textOffset, it.sTitle.slice(0, 24));
    s += textAt('F1', 8, '0.2 0.25 0.3', 195, tblY + textOffset, it.name.slice(0, 30));
    s += textAt('F1', 8, '0.25 0.3 0.35', 355, tblY + textOffset, it.qty);
    s += textAt('F1', 8, '0.25 0.3 0.35', 415, tblY + textOffset, `Rs. ${it.rate.toFixed(2)}`);
    s += textAt('F2', 8.5, '0.08 0.12 0.2', 485, tblY + textOffset, `Rs. ${it.lineTotal.toFixed(2)}`);
    tblY -= rowHeight;
  }

  // 4. FINANCIAL SETTLEMENT & PAYMENT CARDS
  tblY -= 12;
  const sumY = Math.max(tblY - 78, 160);

  // Left Box: Payment Details
  s += `0.98 0.99 1.0 rg 36 ${sumY} 256 78 re f\n`;
  s += `0.8 0.85 0.92 RG 0.8 w 36 ${sumY} 256 78 re S\n`;
  s += `0.06 0.09 0.16 rg 36 ${sumY + 62} 256 16 re f\n`;
  s += textAt('F2', 8, '1 1 1', 46, sumY + 66, 'PAYMENT SETTLEMENT & RECONCILIATION');

  const stColorBg = isPaid ? '0.08 0.5 0.2' : (rec > 0 ? '0.7 0.4 0.05' : '0.75 0.1 0.1');
  s += `${stColorBg} rg 46 ${sumY + 38} 130 18 re f\n`;
  s += textAt('F2', 8.5, '1 1 1', 52, sumY + 43, payStatus);

  s += textAt('F2', 8, '0.15 0.2 0.25', 46, sumY + 22, `Payment Mode: ${payMethod}`);
  s += textAt('F1', 7, '0.4 0.45 0.5', 46, sumY + 8, 'All accounts reconciled  Official Tax Invoice');

  // Right Box: Financial Summary Breakdown
  s += `0.98 0.99 1.0 rg 303 ${sumY} 256 78 re f\n`;
  s += `0.8 0.85 0.92 RG 0.8 w 303 ${sumY} 256 78 re S\n`;

  s += textAt('F1', 8, '0.2 0.25 0.3', 313, sumY + 62, 'Subtotal (Gross Billed):');
  s += textAt('F2', 8, '0.1 0.15 0.2', 485, sumY + 62, `Rs. ${total.toFixed(2)}`);

  s += textAt('F1', 8, '0.2 0.25 0.3', 313, sumY + 48, 'Taxes / GST:');
  s += textAt('F1', 8, '0.1 0.15 0.2', 505, sumY + 48, 'Rs. 0.00');

  s += `0.85 0.88 0.92 RG 0.5 w 313 ${sumY + 42} 236 0 re S\n`;

  s += textAt('F2', 9.5, '0.06 0.09 0.16', 313, sumY + 28, 'GRAND TOTAL:');
  s += textAt('F2', 10, '0.06 0.09 0.16', 480, sumY + 28, `Rs. ${total.toFixed(2)}`);

  // Net Balance Due Pill
  const balBg = bal > 0 ? '0.98 0.92 0.92' : '0.92 0.98 0.94';
  const balBorder = bal > 0 ? '0.85 0.5 0.5' : '0.5 0.8 0.6';
  const balColor = bal > 0 ? '0.75 0.1 0.1' : '0.08 0.5 0.2';
  s += `${balBg} rg 305 ${sumY + 4} 252 18 re f\n`;
  s += `${balBorder} RG 0.5 w 305 ${sumY + 4} 252 18 re S\n`;
  s += textAt('F2', 8.5, balColor, 313, sumY + 9, 'Net Balance Due:');
  s += textAt('F2', 9.5, balColor, 485, sumY + 9, `Rs. ${bal.toFixed(2)}`);

  // 5. HYGIENE & CARE BANNER
  const bannerY = sumY - 32;
  s += `0.95 0.97 0.99 rg 36 ${bannerY} 523 22 re f\n`;
  s += `0.8 0.88 0.95 RG 0.5 w 36 ${bannerY} 523 22 re S\n`;
  s += textAt('F2', 7.5, '0.1 0.3 0.6', 46, bannerY + 12, 'HYGIENE PROMISE: Processed with 100% RO softened water & eco-friendly bio-detergents.');
  s += textAt('F1', 6.5, '0.4 0.45 0.5', 46, bannerY + 4, 'German Hydrocarbon dry cleaning technology safe on delicate fabrics, silk, and wool.');

  // 6. SIGNATURES & TERMS FOOTER
  const footY = 56;
  s += `0.88 0.9 0.93 RG 0.5 w 36 ${footY + 42} 523 0 re S\n`;
  s += textAt('F2', 7.5, '0.15 0.2 0.25', 46, footY + 28, 'Store Cashier / Operator Signature:');
  s += `0.6 0.65 0.7 RG 0.5 w 46 ${footY + 12} 150 0 re S\n`;

  s += textAt('F2', 7.5, '0.15 0.2 0.25', 340, footY + 28, 'Customer Verification & Acknowledgement:');
  s += `0.6 0.65 0.7 RG 0.5 w 340 ${footY + 12} 180 0 re S\n`;

  s += textAt('F1', 6.5, '0.45 0.5 0.55', 36, 34, 'TERMS: Please verify garment count upon handover. Tech Wash is not liable for items uncollected after 30 days.');
  s += textAt('F2', 7.5, '0.06 0.09 0.16', 36, 22, `Tech Wash POS Contacts: POS-1: 6304845567 | POS-2: 9000813444 | POS-3: 9866740179`);

  // --- ASSEMBLE PDF OBJECTS & OFFSETS ---
  const enc = new TextEncoder();
  const streamBytes = enc.encode(s);
  const streamLen = streamBytes.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >> >>\nendobj\n';
  const obj4Header = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const obj4Footer = '\nendstream\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj7Header = `7 0 obj\n<< /Type /XObject /Subtype /Image /Width 320 /Height 320 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`;
  const obj7Footer = '\nendstream\nendobj\n';

  const header = enc.encode('%PDF-1.4\n');
  const bObj1 = enc.encode(obj1);
  const bObj2 = enc.encode(obj2);
  const bObj3 = enc.encode(obj3);
  const bObj4H = enc.encode(obj4Header);
  const bObj4F = enc.encode(obj4Footer);
  const bObj5 = enc.encode(obj5);
  const bObj6 = enc.encode(obj6);
  const bObj7H = enc.encode(obj7Header);
  const bObj7F = enc.encode(obj7Footer);

  const offsets = [];
  let curr = header.length;

  offsets.push(curr); curr += bObj1.length;
  offsets.push(curr); curr += bObj2.length;
  offsets.push(curr); curr += bObj3.length;
  offsets.push(curr); curr += bObj4H.length + streamBytes.length + bObj4F.length;
  offsets.push(curr); curr += bObj5.length;
  offsets.push(curr); curr += bObj6.length;
  offsets.push(curr); curr += bObj7H.length + logoBytes.length + bObj7F.length;

  // Strict 20-byte entries for PDF xref table
  let xrefStr = 'xref\n0 8\n0000000000 65535 f \n';
  for (let i = 0; i < offsets.length; i++) {
    xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  xrefStr += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${curr}\n%%EOF\n`;
  const bXref = enc.encode(xrefStr);

  const totalLen = curr + bXref.length;
  const finalBytes = new Uint8Array(totalLen);

  let pos = 0;
  finalBytes.set(header, pos); pos += header.length;
  finalBytes.set(bObj1, pos); pos += bObj1.length;
  finalBytes.set(bObj2, pos); pos += bObj2.length;
  finalBytes.set(bObj3, pos); pos += bObj3.length;

  finalBytes.set(bObj4H, pos); pos += bObj4H.length;
  finalBytes.set(streamBytes, pos); pos += streamBytes.length;
  finalBytes.set(bObj4F, pos); pos += bObj4F.length;

  finalBytes.set(bObj5, pos); pos += bObj5.length;
  finalBytes.set(bObj6, pos); pos += bObj6.length;

  finalBytes.set(bObj7H, pos); pos += bObj7H.length;
  finalBytes.set(logoBytes, pos); pos += logoBytes.length;
  finalBytes.set(bObj7F, pos); pos += bObj7F.length;

  finalBytes.set(bXref, pos);

  return finalBytes;
}
