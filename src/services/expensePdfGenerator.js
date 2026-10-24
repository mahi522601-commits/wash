/**
 * Tech Wash Laundry Services — Client-Side Pure JavaScript Expense PDF Report Generator
 * Generates official, multi-page vector A4 Expense Report & Audit Ledger PDF documents.
 * Includes Tech Wash branding logo, executive KPI cards, category breakdown, itemized expenses table,
 * tax/payment summaries, cashier/manager verification signatures, and POS terminal contacts.
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

function sanitizePdfText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/[()]/g, ch => ch === '(' ? '[' : ']')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
}

function formatDateSafe(val) {
  if (!val) return 'N/A';
  const d = new Date(val);
  if (isNaN(d.getTime())) return sanitizePdfText(val);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrencySafe(num) {
  const n = Number(num) || 0;
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function textAt(font, size, colorRgb, x, y, str) {
  const safeStr = sanitizePdfText(str);
  return `BT /${font} ${size} Tf ${colorRgb} rg ${x} ${y} Td (${safeStr}) Tj ET\n`;
}

/**
 * Generates an official multi-page Expense Report PDF as a Uint8Array
 * @param {Array} rawExpenses - List of recorded expense objects
 * @param {Object} options - Report parameters: periodLabel, branchLabel, generatedBy, etc.
 * @returns {Uint8Array}
 */
export function generateExpensePDFUint8Array(rawExpenses = [], options = {}) {
  const logoBytes = getLogoJpegBytes();
  const expenses = Array.isArray(rawExpenses) ? [...rawExpenses] : [];

  // Sort expenses by date descending
  expenses.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

  const periodLabel = sanitizePdfText(options.periodLabel || 'Current Period');
  const branchLabel = sanitizePdfText(options.branchLabel || 'All Branches (Consolidated)');
  const generatedBy = sanitizePdfText(options.generatedBy || 'Tech Wash POS Financial System');
  const genDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const refCode = `EXP-REP-${Date.now().toString().slice(-6)}`;

  // Financial aggregates
  let totalAmount = 0;
  let totalTaxable = 0;
  let totalGst = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let otherModeTotal = 0;
  const categoryMap = {};

  expenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    totalAmount += amt;

    const gst = Number(exp.gstAmount) || 0;
    totalGst += gst;
    totalTaxable += (Number(exp.taxableAmount) || Math.max(0, amt - gst));

    const mode = String(exp.paymentMode || 'CASH').toUpperCase();
    if (mode === 'CASH') cashTotal += amt;
    else if (mode.includes('UPI') || mode.includes('QR')) upiTotal += amt;
    else otherModeTotal += amt;

    const cat = exp.categoryName || exp.categoryId || 'General Expenses';
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  // Top Category
  let topCatName = 'None';
  let topCatAmount = 0;
  Object.keys(categoryMap).forEach(cat => {
    if (categoryMap[cat] > topCatAmount) {
      topCatAmount = categoryMap[cat];
      topCatName = cat;
    }
  });

  // Category breakdown top 4
  const sortedCategories = Object.keys(categoryMap)
    .map(c => ({ name: c, amount: categoryMap[c], pct: totalAmount > 0 ? ((categoryMap[c] / totalAmount) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  // Pagination logic:
  // Page 1: Header + Meta Box + KPI Cards + Category Summary + Table header
  // Table rows on Page 1: starts at y=485 down to y=110 => ~20 rows.
  // Page 2+: Running header (y=780 down to y=740), table header at y=720, rows down to y=110 => ~32 rows.
  const rowsPage1Max = 18;
  const rowsSubsequentMax = 30;

  const pagesChunks = [];
  if (expenses.length <= rowsPage1Max) {
    pagesChunks.push(expenses);
  } else {
    pagesChunks.push(expenses.slice(0, rowsPage1Max));
    let remaining = expenses.slice(rowsPage1Max);
    while (remaining.length > 0) {
      pagesChunks.push(remaining.slice(0, rowsSubsequentMax));
      remaining = remaining.slice(rowsSubsequentMax);
    }
  }

  const pageCount = Math.max(1, pagesChunks.length);
  const pagesStreams = [];

  for (let pIdx = 0; pIdx < pageCount; pIdx++) {
    const isFirstPage = pIdx === 0;
    const isLastPage = pIdx === pageCount - 1;
    const pageRows = pagesChunks[pIdx] || [];
    let s = '';

    // --- PAGE 1 HEADER & KPI SUMMARY ---
    if (isFirstPage) {
      // 1. Tech Wash Branding Header (Top Left: Logo at x=36, y=748, w=54, h=54)
      if (logoBytes && logoBytes.length > 0) {
        s += 'q 54 0 0 54 36 748 cm /Im1 Do Q\n';
      }

      s += textAt('F2', 15, '0.06 0.09 0.16', 98, 788, 'TECH WASH LAUNDRY SERVICES');
      s += textAt('F2', 9, '0.85 0.38 0.08', 98, 773, 'OFFICIAL OPERATING EXPENSE REPORT & AUDIT LEDGER');
      s += textAt('F1', 7.5, '0.4 0.45 0.5', 98, 760, 'Tech Wash Store Network | Shaikpet - Manikonda - Tolichowki | Helpline: +91 63048 45567');
      s += textAt('F1', 7, '0.45 0.5 0.55', 98, 749, 'Next-Generation Commercial Fabric Care & Plant Operations');

      // Header Divider Line
      s += '0.85 0.88 0.92 RG 0.8 w 36 738 523 0 re S\n';

      // 2. Report Meta Box (y: 695, h: 36)
      s += '0.96 0.97 0.99 rg 36 695 523 36 re f\n';
      s += '0.85 0.88 0.92 RG 0.5 w 36 695 523 36 re S\n';

      s += textAt('F2', 8, '0.1 0.15 0.2', 46, 718, `Branch / Scope: ${branchLabel.slice(0, 42)}`);
      s += textAt('F1', 8, '0.3 0.35 0.4', 46, 703, `Statement Period: ${periodLabel}`);

      s += textAt('F2', 8, '0.1 0.15 0.2', 340, 718, `Generated On: ${genDate}`);
      s += textAt('F1', 7.5, '0.3 0.35 0.4', 340, 703, `Report Ref: ${refCode}  |  By: ${generatedBy.slice(0, 25)}`);

      // 3. Executive KPI Summary Cards (y: 636, h: 48)
      const cardW = 124;
      const cardH = 48;
      const cardGap = 9;

      // Card 1: Total Expenses
      const c1X = 36;
      s += `0.98 0.92 0.92 rg ${c1X} 636 ${cardW} ${cardH} re f\n`;
      s += `0.85 0.4 0.4 RG 0.6 w ${c1X} 636 ${cardW} ${cardH} re S\n`;
      s += textAt('F1', 7, '0.6 0.2 0.2', c1X + 8, 670, 'TOTAL EXPENSES:');
      s += textAt('F2', 11, '0.75 0.08 0.08', c1X + 8, 654, `Rs. ${totalAmount.toLocaleString('en-IN')}`);
      s += textAt('F1', 6.5, '0.5 0.2 0.2', c1X + 8, 642, `${expenses.length} Records Reconciled`);

      // Card 2: Total Records
      const c2X = c1X + cardW + cardGap;
      s += `0.92 0.96 0.99 rg ${c2X} 636 ${cardW} ${cardH} re f\n`;
      s += `0.4 0.6 0.85 RG 0.6 w ${c2X} 636 ${cardW} ${cardH} re S\n`;
      s += textAt('F1', 7, '0.1 0.3 0.6', c2X + 8, 670, 'LEDGER ENTRIES:');
      s += textAt('F2', 11, '0.08 0.3 0.65', c2X + 8, 654, `${expenses.length} Entries`);
      s += textAt('F1', 6.5, '0.2 0.4 0.6', c2X + 8, 642, `Avg ₹${expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0} per entry`);

      // Card 3: Top Cost Driver
      const c3X = c2X + cardW + cardGap;
      s += `0.99 0.95 0.91 rg ${c3X} 636 ${cardW} ${cardH} re f\n`;
      s += `0.88 0.55 0.2 RG 0.6 w ${c3X} 636 ${cardW} ${cardH} re S\n`;
      s += textAt('F1', 7, '0.6 0.3 0.1', c3X + 8, 670, 'TOP COST DRIVER:');
      s += textAt('F2', 9, '0.7 0.3 0.05', c3X + 8, 654, topCatName.slice(0, 18));
      s += textAt('F1', 6.5, '0.6 0.3 0.1', c3X + 8, 642, `Rs. ${topCatAmount.toLocaleString('en-IN')}`);

      // Card 4: Payment Split
      const c4X = c3X + cardW + cardGap;
      s += `0.93 0.97 0.94 rg ${c4X} 636 ${cardW} ${cardH} re f\n`;
      s += `0.4 0.75 0.5 RG 0.6 w ${c4X} 636 ${cardW} ${cardH} re S\n`;
      s += textAt('F1', 7, '0.1 0.5 0.2', c4X + 8, 670, 'PAYMENT SPLIT:');
      s += textAt('F2', 8, '0.1 0.45 0.2', c4X + 8, 655, `Cash: Rs. ${cashTotal.toLocaleString('en-IN')}`);
      s += textAt('F2', 8, '0.1 0.45 0.2', c4X + 8, 642, `UPI / Digital: Rs. ${upiTotal.toLocaleString('en-IN')}`);

      // 4. Concise Category Subtotal Pill (y: 602, h: 22)
      s += '0.97 0.98 1.0 rg 36 604 523 22 re f\n';
      s += '0.85 0.88 0.94 RG 0.5 w 36 604 523 22 re S\n';
      s += textAt('F2', 7.5, '0.2 0.25 0.35', 44, 612, 'TOP CATEGORIES:');
      let catX = 135;
      sortedCategories.slice(0, 4).forEach((c) => {
        s += textAt('F1', 7, '0.3 0.35 0.45', catX, 612, `${c.name}: Rs.${c.amount} (${c.pct}%)   |`);
        catX += 100;
      });

    } else {
      // --- SUBSEQUENT PAGES: COMPACT RUNNING HEADER (y: 790 to 815) ---
      if (logoBytes && logoBytes.length > 0) {
        s += 'q 28 0 0 28 36 784 cm /Im1 Do Q\n';
      }
      s += textAt('F2', 10, '0.06 0.09 0.16', 72, 800, 'TECH WASH LAUNDRY SERVICES — EXPENSE LEDGER REPORT');
      s += textAt('F1', 7.5, '0.4 0.45 0.5', 72, 788, `Period: ${periodLabel}  |  Branch: ${branchLabel.slice(0, 35)}  |  Ref: ${refCode}`);
      s += textAt('F1', 7.5, '0.4 0.45 0.5', 470, 788, `Page ${pIdx + 1} of ${pageCount}`);
      s += '0.85 0.88 0.92 RG 0.5 w 36 776 523 0 re S\n';
    }

    // --- ITEMIZE TABLE HEADER ---
    const tableTopY = isFirstPage ? 578 : 752;
    const thH = 18;

    s += `0.12 0.16 0.22 rg 36 ${tableTopY} 523 ${thH} re f\n`;

    // Column Headers
    s += textAt('F2', 7, '1 1 1', 40, tableTopY + 5, '#');
    s += textAt('F2', 7, '1 1 1', 58, tableTopY + 5, 'DATE');
    s += textAt('F2', 7, '1 1 1', 114, tableTopY + 5, 'CATEGORY');
    s += textAt('F2', 7, '1 1 1', 198, tableTopY + 5, 'DESCRIPTION / PURPOSE');
    s += textAt('F2', 7, '1 1 1', 350, tableTopY + 5, 'BRANCH / POS');
    s += textAt('F2', 7, '1 1 1', 416, tableTopY + 5, 'MODE');
    s += textAt('F2', 7, '1 1 1', 454, tableTopY + 5, 'VENDOR / REF');
    s += textAt('F2', 7, '1 1 1', 518, tableTopY + 5, 'AMOUNT');

    // --- TABLE ROWS ---
    let rowY = tableTopY - 17;
    const rowH = 17;

    const startIndex = isFirstPage ? 0 : rowsPage1Max + (pIdx - 1) * rowsSubsequentMax;

    pageRows.forEach((exp, idx) => {
      const overallIndex = startIndex + idx + 1;
      const isAlt = idx % 2 === 1;

      // Alternating row background
      if (isAlt) {
        s += `0.97 0.98 0.99 rg 36 ${rowY} 523 ${rowH} re f\n`;
      }

      // Border bottom
      s += `0.88 0.9 0.93 RG 0.3 w 36 ${rowY} 523 0 re S\n`;

      const expDate = formatDateSafe(exp.date || exp.createdAt);
      const catName = sanitizePdfText(exp.categoryName || exp.categoryId || 'Expense').slice(0, 16);
      const desc = sanitizePdfText(exp.description || exp.notes || exp.title || 'General operating expense').slice(0, 32);
      const branch = sanitizePdfText(exp.branchName || (exp.branchId === 'counter-2' ? 'POS-2' : exp.branchId === 'counter-3' ? 'POS-3' : 'POS-1')).slice(0, 13);
      const mode = sanitizePdfText(exp.paymentMode || 'CASH').slice(0, 7);
      const vendor = sanitizePdfText(exp.vendorName || exp.invoiceNumber || exp.paymentReference || '-').slice(0, 11);
      const amtStr = `Rs. ${(Number(exp.amount) || 0).toFixed(2)}`;

      s += textAt('F1', 6.5, '0.4 0.45 0.5', 40, rowY + 5, String(overallIndex));
      s += textAt('F1', 6.5, '0.2 0.25 0.3', 58, rowY + 5, expDate);
      s += textAt('F2', 6.5, '0.1 0.2 0.35', 114, rowY + 5, catName);
      s += textAt('F1', 6.5, '0.15 0.2 0.25', 198, rowY + 5, desc);
      s += textAt('F1', 6.5, '0.3 0.35 0.4', 350, rowY + 5, branch);
      s += textAt('F1', 6.5, '0.2 0.25 0.3', 416, rowY + 5, mode);
      s += textAt('F1', 6.5, '0.35 0.4 0.45', 454, rowY + 5, vendor);
      s += textAt('F2', 7, '0.75 0.1 0.1', 510, rowY + 5, amtStr);

      rowY -= rowH;
    });

    // Outer table border
    const tableFullH = tableTopY - rowY + thH;
    s += `0.8 0.84 0.88 RG 0.5 w 36 ${rowY} 523 ${tableFullH} re S\n`;

    // --- GRAND TOTAL ROW (ONLY ON LAST PAGE) ---
    if (isLastPage) {
      const sumY = rowY - 24;
      s += `0.93 0.95 0.98 rg 36 ${sumY} 523 24 re f\n`;
      s += `0.7 0.75 0.82 RG 0.8 w 36 ${sumY} 523 24 re S\n`;

      s += textAt('F2', 8.5, '0.06 0.09 0.16', 46, sumY + 8, `TOTAL OPERATING EXPENSES (${expenses.length} Logged Entries):`);
      s += textAt('F2', 10.5, '0.8 0.08 0.08', 460, sumY + 8, `Rs. ${totalAmount.toFixed(2)}`);

      // Signatures block
      const sigY = 62;
      s += `0.85 0.88 0.92 RG 0.5 w 36 ${sigY + 36} 523 0 re S\n`;
      s += textAt('F2', 7.5, '0.15 0.2 0.25', 46, sigY + 22, 'Store Cashier / Operator Signature:');
      s += `0.6 0.65 0.7 RG 0.5 w 46 ${sigY + 6} 160 0 re S\n`;

      s += textAt('F2', 7.5, '0.15 0.2 0.25', 340, sigY + 22, 'Auditor / Accounts Verification Signature:');
      s += `0.6 0.65 0.7 RG 0.5 w 340 ${sigY + 6} 180 0 re S\n`;
    }

    // --- FOOTER ON ALL PAGES ---
    s += `0.85 0.88 0.92 RG 0.4 w 36 34 523 0 re S\n`;
    s += textAt('F1', 6.5, '0.45 0.5 0.55', 36, 22, 'Official Financial Ledger Document generated by Tech Wash POS Management System. Valid for taxation, P&L audit, and expense reconciliation.');
    s += textAt('F2', 6.5, '0.1 0.2 0.35', 36, 12, 'Terminal Support & Contact: POS-1: 6304845567 | POS-2: 9000813444 | POS-3: 9866740179');
    s += textAt('F2', 7, '0.2 0.25 0.3', 510, 12, `Page ${pIdx + 1} of ${pageCount}`);

    pagesStreams.push(s);
  }

  // --- ASSEMBLE PDF OBJECTS & OFFSETS ---
  const enc = new TextEncoder();
  const header = enc.encode('%PDF-1.4\n');

  const font1Num = 3 + pageCount * 2;
  const font2Num = 4 + pageCount * 2;
  const imgObjNum = 5 + pageCount * 2;
  const totalObjects = 5 + pageCount * 2;

  // Obj 1: Catalog
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Obj 2: Pages
  const kids = [];
  for (let i = 0; i < pageCount; i++) {
    kids.push(`${3 + i * 2} 0 R`);
  }
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>\nendobj\n`;

  const bObj1 = enc.encode(obj1);
  const bObj2 = enc.encode(obj2);

  const pageObjs = [];
  const contentObjs = [];

  for (let i = 0; i < pageCount; i++) {
    const pNum = 3 + i * 2;
    const cNum = 4 + i * 2;
    const streamBytes = enc.encode(pagesStreams[i]);

    const pStr = `${pNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${cNum} 0 R /Resources << /Font << /F1 ${font1Num} 0 R /F2 ${font2Num} 0 R >> /XObject << /Im1 ${imgObjNum} 0 R >> >> >>\nendobj\n`;
    const cHdr = `${cNum} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
    const cFtr = '\nendstream\nendobj\n';

    pageObjs.push(enc.encode(pStr));
    contentObjs.push({
      hdr: enc.encode(cHdr),
      stream: streamBytes,
      ftr: enc.encode(cFtr)
    });
  }

  const font1Str = `${font1Num} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  const font2Str = `${font2Num} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`;
  const imgHdr = `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width 320 /Height 320 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n`;
  const imgFtr = '\nendstream\nendobj\n';

  const bFont1 = enc.encode(font1Str);
  const bFont2 = enc.encode(font2Str);
  const bImgHdr = enc.encode(imgHdr);
  const bImgFtr = enc.encode(imgFtr);

  // Compute byte offsets
  const offsets = [];
  let curr = header.length;

  offsets.push(curr); curr += bObj1.length;
  offsets.push(curr); curr += bObj2.length;

  for (let i = 0; i < pageCount; i++) {
    offsets.push(curr); curr += pageObjs[i].length;
    offsets.push(curr); curr += contentObjs[i].hdr.length + contentObjs[i].stream.length + contentObjs[i].ftr.length;
  }

  offsets.push(curr); curr += bFont1.length;
  offsets.push(curr); curr += bFont2.length;
  offsets.push(curr); curr += bImgHdr.length + logoBytes.length + bImgFtr.length;

  // Strict 20-byte entries for PDF xref table
  let xrefStr = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  xrefStr += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${curr}\n%%EOF\n`;
  const bXref = enc.encode(xrefStr);

  const totalLen = curr + bXref.length;
  const finalBytes = new Uint8Array(totalLen);

  let pos = 0;
  finalBytes.set(header, pos); pos += header.length;
  finalBytes.set(bObj1, pos); pos += bObj1.length;
  finalBytes.set(bObj2, pos); pos += bObj2.length;

  for (let i = 0; i < pageCount; i++) {
    finalBytes.set(pageObjs[i], pos); pos += pageObjs[i].length;
    finalBytes.set(contentObjs[i].hdr, pos); pos += contentObjs[i].hdr.length;
    finalBytes.set(contentObjs[i].stream, pos); pos += contentObjs[i].stream.length;
    finalBytes.set(contentObjs[i].ftr, pos); pos += contentObjs[i].ftr.length;
  }

  finalBytes.set(bFont1, pos); pos += bFont1.length;
  finalBytes.set(bFont2, pos); pos += bFont2.length;
  finalBytes.set(bImgHdr, pos); pos += bImgHdr.length;
  finalBytes.set(logoBytes, pos); pos += logoBytes.length;
  finalBytes.set(bImgFtr, pos); pos += bImgFtr.length;
  finalBytes.set(bXref, pos);

  return finalBytes;
}

/**
 * Generates an official Expense Report PDF as a Blob
 * @param {Array} expenses
 * @param {Object} options
 * @returns {Blob}
 */
export function generateExpensePDFBlob(expenses, options) {
  const bytes = generateExpensePDFUint8Array(expenses, options);
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Initiates automatic browser download of the Expense Report PDF
 * @param {Array} expenses
 * @param {Object} options
 */
export function downloadExpensePDF(expenses, options = {}) {
  const blob = generateExpensePDFBlob(expenses, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const slug = (options.periodLabel || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `TechWash_Expense_Report_${slug}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Opens the Expense Report PDF in a new tab for preview and printing
 * @param {Array} expenses
 * @param {Object} options
 */
export function openExpensePDFPreview(expenses, options = {}) {
  const blob = generateExpensePDFBlob(expenses, options);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
}
