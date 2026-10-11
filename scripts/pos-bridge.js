/**
 * Tech Wash Laundry Services — Local Windows Storage Bridge Service
 * Listens strictly on 127.0.0.1:9123
 * PDF Invoices & Excel Reports under C:\TechWash\POS-XX\
 * Primary POS database is browser IndexedDB (TechWashPOS) — JSON transaction storage disabled.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

// --- TERMINAL CONFIGURATION & MAPPING ---
const TERMINAL_PRESETS = {
  'admin': {
    terminalId: 'admin',
    terminalCode: 'TW-ADMIN-01',
    branch: 'Admin Command Center',
    folderName: 'Admin',
  },
  'counter-1': {
    terminalId: 'counter-1',
    terminalCode: 'TW-POS-01',
    branch: 'Main Branch — Manikonda',
    folderName: 'POS-01',
  },
  'counter-2': {
    terminalId: 'counter-2',
    terminalCode: 'TW-POS-02',
    branch: 'Branch 1 — Tolichowki',
    folderName: 'POS-02',
  },
  'counter-3': {
    terminalId: 'counter-3',
    terminalCode: 'TW-POS-03',
    branch: 'Pick Up Point — Ambience',
    folderName: 'POS-03',
  },
};

function loadActiveTerminalId() {
  if (process.env.TERMINAL_ID) {
    return process.env.TERMINAL_ID.trim();
  }
  try {
    const configPath = path.join(process.cwd(), 'techwash-terminal.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg && cfg.terminalId) {
        return String(cfg.terminalId).trim();
      }
    }
  } catch (e) {}
  return 'counter-1';
}

const activeTerminalId = loadActiveTerminalId();
const activePreset = TERMINAL_PRESETS[activeTerminalId] || TERMINAL_PRESETS['counter-1'];

const PORT = Number(process.env.PORT || 9123);
const HOST = '127.0.0.1';

const ROOT_BASE = process.env.TECHWASH_ROOT || 'C:\\TechWash';
const STORAGE_ROOT = path.join(ROOT_BASE, activePreset.folderName);

const INVOICES_DIR = path.join(STORAGE_ROOT, 'Invoices');
const EXPORTS_DIR = path.join(STORAGE_ROOT, 'Exports');

// --- HELPER: ENSURE DIRECTORY STRUCTURE FOR ALL TERMINALS ---
function ensureDirectories() {
  if (!fs.existsSync(ROOT_BASE)) {
    fs.mkdirSync(ROOT_BASE, { recursive: true });
  }
  Object.values(TERMINAL_PRESETS).forEach(preset => {
    const tRoot = path.join(ROOT_BASE, preset.folderName);
    const subDirs = [
      tRoot,
      path.join(tRoot, 'Data'),
      path.join(tRoot, 'Invoices'),
      path.join(tRoot, 'PDFs'),
      path.join(tRoot, 'Exports'),
    ];
    subDirs.forEach(d => {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    });
  });
}

ensureDirectories();

// --- SANITIZE FILENAME HELPER ---
function sanitizeFilename(name) {
  return String(name || '').replace(/[^a-zA-Z0-9_\-.]/g, '_');
}

// --- EXTRACT LOCAL DATE KEY HELPER (YYYY-MM-DD) ---
function extractLocalDateKey(payload = {}) {
  const candidates = [payload.dateKey, payload.createdAt, payload.orderDate, payload.pickupDate];
  for (const cand of candidates) {
    if (!cand) continue;
    const str = String(cand).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.slice(0, 10);
    }
  }

  const dateInput = payload.createdAt || payload.orderDate || Date.now();
  let d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// --- RESOLVE TERMINAL PRESET HELPER ---
function resolveTerminalPreset(terminalIdInput) {
  const tId = String(terminalIdInput || '').toLowerCase().trim();
  if (tId === 'admin' || tId.includes('admin')) {
    return TERMINAL_PRESETS['admin'];
  }
  if (tId === 'counter-2' || tId.includes('pos-02') || tId.includes('02') || tId.includes('tolichowki')) {
    return TERMINAL_PRESETS['counter-2'];
  }
  if (tId === 'counter-3' || tId.includes('pos-03') || tId.includes('03') || tId.includes('ambience')) {
    return TERMINAL_PRESETS['counter-3'];
  }
  return TERMINAL_PRESETS['counter-1'];
}

// --- RESOLVE LOGO PATH HELPER ---
function getActualLogoPath() {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'techwashlogo.webp'),
    path.join(process.cwd(), 'src', 'assets', 'techwashlogo.webp'),
    path.join(process.cwd(), 'techwashlogo.webp'),
    path.join(process.cwd(), 'public', 'techwashh.webp'),
    path.join(process.cwd(), 'src', 'assets', 'techwashh.webp'),
    path.join(process.cwd(), 'techwashh.webp'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// --- GENERATE CUSTOMER INVOICE PDF ---
function generateInvoicePDFBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryNavy = '#0f172a';
      const brandBlue = '#2563eb';
      const textColor = '#1e293b';
      const mutedText = '#64748b';
      const lightBg = '#f8fafc';
      const borderGray = '#cbd5e1';

      // 1. HEADER SECTION & BRAND LOGO
      const logoPath = getActualLogoPath();
      let headerY = 36;

      if (logoPath) {
        try {
          doc.image(logoPath, 36, 36, { fit: [140, 50] });
        } catch (e) {
          doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH', 36, 36);
        }
      } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH', 36, 36);
      }

      // Business Info Block next to logo
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH LAUNDRY SERVICES', 190, 36);
      doc.fontSize(8).font('Helvetica').fillColor(mutedText)
        .text('Premium Eco Laundry, Hydrocarbon Dry Cleaning & 3D Steam Pressing', 190, 52)
        .text('Plot 42, Manikonda Main Rd, Hyderabad | Support: +91 98765 43210 | www.techwash.in', 190, 64);

      // Title & Invoice Meta Box (Right aligned)
      doc.rect(400, 34, 159, 58).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(brandBlue).fontSize(10).font('Helvetica-Bold').text('CUSTOMER TAX INVOICE', 405, 40, { width: 149, align: 'center' });

      const rawInvNum = order.invoiceNumber || order.orderNumber || order.id || 'INV-00001';
      const invNum = rawInvNum.toUpperCase().startsWith('INV-') ? rawInvNum : `INV-${rawInvNum}`;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(primaryNavy)
        .text(`INV #: ${invNum}`, 405, 54, { width: 149, align: 'center' })
        .text(`Order #: ${order.orderNumber || order.id}`, 405, 66, { width: 149, align: 'center' });

      const dateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText)
        .text(`${dateStr} | ${timeStr}`, 405, 78, { width: 149, align: 'center' });

      let y = 104;

      // 2. STORE BRANCH & CUSTOMER DETAILS CARDS
      // Left Card: Customer Details
      doc.rect(36, y, 256, 75).fillAndStroke(lightBg, borderGray);
      doc.fillColor(primaryNavy).fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER DETAILS', 46, y + 8);
      
      const custName = order.customerName || order.customer?.name || 'Valued Customer';
      const custPhone = order.phone || order.customer?.phone || 'N/A';
      const custId = order.customerId || (custPhone !== 'N/A' ? `cust-${custPhone}` : 'N/A');
      const custAddr = (order.address || order.customer?.address || 'In-Store Walk-in Drop').slice(0, 50);

      doc.fontSize(8).font('Helvetica').fillColor(textColor)
        .text(`Name: `, 46, y + 22, { continued: true }).font('Helvetica-Bold').text(custName)
        .font('Helvetica').text(`Mobile: `, 46, y + 34, { continued: true }).font('Helvetica-Bold').text(custPhone)
        .font('Helvetica').text(`Customer ID: `, 46, y + 46, { continued: true }).font('Helvetica-Bold').text(custId)
        .font('Helvetica').text(`Address: `, 46, y + 58, { continued: true }).text(custAddr);

      // Right Card: Store & Terminal Info
      doc.rect(303, y, 256, 75).fillAndStroke(lightBg, borderGray);
      doc.fillColor(primaryNavy).fontSize(8.5).font('Helvetica-Bold').text('STORE & TERMINAL DETAILS', 313, y + 8);

      const branchName = order.storeBranch || activePreset.branch;
      const termCode = order.terminalCode || activePreset.terminalCode;
      const termId = order.terminalId || activePreset.terminalId;
      const cashier = order.cashierName || 'Cashier #1';

      doc.fontSize(8).font('Helvetica').fillColor(textColor)
        .text(`Branch: `, 313, y + 22, { continued: true }).font('Helvetica-Bold').text(branchName)
        .font('Helvetica').text(`Terminal: `, 313, y + 34, { continued: true }).font('Helvetica-Bold').text(`${termCode} (${termId})`)
        .font('Helvetica').text(`Cashier: `, 313, y + 46, { continued: true }).font('Helvetica-Bold').text(cashier)
        .font('Helvetica').text(`Pickup/Delivery: `, 313, y + 58, { continued: true }).text(`${order.pickupDate || 'Today'} -> ${order.deliveryDate || 'Standard'}`);

      y += 88;

      // 3. ITEM SERVICE TABLE
      // Table Header Bar
      doc.rect(36, y, 523, 20).fill(primaryNavy);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('S.No', 42, y + 6);
      doc.text('Service & Treatment', 75, y + 6);
      doc.text('Garment / Description', 185, y + 6);
      doc.text('Qty / Wt', 355, y + 6, { width: 55, align: 'right' });
      doc.text('Rate', 420, y + 6, { width: 60, align: 'right' });
      doc.text('Amount (₹)', 490, y + 6, { width: 62, align: 'right' });

      y += 20;

      const items = order.items || [];
      if (items.length === 0) {
        items.push({
          name: order.serviceName || order.service || 'Laundry Service',
          quantity: order.actualWeight || order.estimatedWeightKg || 1,
          unitPrice: order.totalAmount || order.finalPrice || 0,
          lineTotal: order.totalAmount || order.finalPrice || 0,
        });
      }

      items.forEach((it, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, y, 523, 18).fillAndStroke(bg, '#f1f5f9');

        const serviceTitle = (it.serviceName || order.serviceName || order.service || 'Laundry Care').slice(0, 22);
        const desc = (it.name || it.subServiceName || 'Garment Item').slice(0, 32);
        const qty = it.weight ? `${it.weight} Kg` : (it.quantity ? `${it.quantity} Pcs` : '1 Pcs');
        const uPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
        const lTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (uPrice * (Number(it.quantity) || 1)));

        doc.fillColor(textColor).fontSize(7.5).font('Helvetica');
        doc.text(String(idx + 1), 42, y + 5);
        doc.text(serviceTitle, 75, y + 5);
        doc.text(desc, 185, y + 5);
        doc.text(qty, 355, y + 5, { width: 55, align: 'right' });
        doc.text(`₹${uPrice.toFixed(2)}`, 420, y + 5, { width: 60, align: 'right' });
        doc.font('Helvetica-Bold').text(`₹${lTotal.toFixed(2)}`, 490, y + 5, { width: 62, align: 'right' });
        y += 18;
      });

      y += 12;

      // 4. FINANCIAL SUMMARY & PAYMENT DETAILS BOXES
      // Left Box: Payment Details
      const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
      const rec = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
      const bal = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - rec));
      const payStatus = order.paymentStatus || (bal === 0 ? 'PAID' : (rec > 0 ? 'PARTIAL' : 'PENDING'));

      doc.rect(36, y, 256, 75).fillAndStroke(lightBg, borderGray);
      doc.fillColor(primaryNavy).fontSize(8.5).font('Helvetica-Bold').text('PAYMENT DETAILS', 46, y + 8);

      const statusColor = payStatus === 'PAID' ? '#15803d' : (payStatus === 'PARTIAL' ? '#b45309' : '#b91c1c');
      doc.fontSize(8).font('Helvetica').fillColor(textColor)
        .text('Payment Status: ', 46, y + 24, { continued: true })
        .font('Helvetica-Bold').fillColor(statusColor).text(payStatus)
        .fillColor(textColor).font('Helvetica').text('Payment Method: ', 46, y + 38, { continued: true })
        .font('Helvetica-Bold').text(order.paymentMethod || 'CASH')
        .font('Helvetica').text('Payment Ref: ', 46, y + 52, { continued: true })
        .text(order.paymentReference || order.transactionId || 'N/A');

      // Right Box: Financial Summary
      doc.rect(303, y, 256, 75).fillAndStroke('#f8fafc', borderGray);
      doc.fillColor(textColor).fontSize(8);

      const subtotal = Number(order.priceSnapshot?.itemsSubtotal || total);
      const discount = Number(order.priceSnapshot?.discountAmount || order.discount || 0);

      doc.font('Helvetica').text('Subtotal:', 313, y + 8);
      doc.font('Helvetica').text(`₹${subtotal.toFixed(2)}`, 490, y + 8, { width: 60, align: 'right' });

      if (discount > 0) {
        doc.font('Helvetica').text('Discount:', 313, y + 20);
        doc.font('Helvetica').fillColor('#b91c1c').text(`- ₹${discount.toFixed(2)}`, 490, y + 20, { width: 60, align: 'right' });
      } else {
        doc.font('Helvetica').text('Tax (GST):', 313, y + 20);
        doc.font('Helvetica').text(`₹0.00`, 490, y + 20, { width: 60, align: 'right' });
      }

      doc.fillColor(primaryNavy).font('Helvetica-Bold').fontSize(9).text('GRAND TOTAL:', 313, y + 34);
      doc.font('Helvetica-Bold').fontSize(9).text(`₹${total.toFixed(2)}`, 490, y + 34, { width: 60, align: 'right' });

      doc.fillColor(textColor).font('Helvetica').fontSize(8).text('Amount Paid:', 313, y + 48);
      doc.font('Helvetica-Bold').text(`₹${rec.toFixed(2)}`, 490, y + 48, { width: 60, align: 'right' });

      doc.font('Helvetica-Bold').text('Balance Due:', 313, y + 60);
      doc.fillColor(bal > 0 ? '#b91c1c' : '#15803d');
      doc.font('Helvetica-Bold').text(`₹${bal.toFixed(2)}`, 490, y + 60, { width: 60, align: 'right' });

      y += 88;

      // 5. FOOTER & CARE NOTES
      doc.rect(36, y, 523, 1).fill('#e2e8f0');
      y += 8;

      doc.fillColor(mutedText).fontSize(7.5).font('Helvetica');
      doc.text('Garment Care Note: All items processed using 100% RO softened water, eco-friendly bio-detergents, and low-heat drying. Please verify item count upon delivery.', 36, y, { width: 523, align: 'center' });
      y += 12;
      doc.fillColor(primaryNavy).fontSize(8.5).font('Helvetica-Bold');
      doc.text('Thank you for choosing Tech Wash Laundry Services!', 36, y, { width: 523, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// --- UPDATE OR APPEND DAILY EXCEL FILE ---
async function updateDailyExcelFile(excelPath, order) {
  const workbook = new ExcelJS.Workbook();

  if (fs.existsSync(excelPath)) {
    try {
      await workbook.xlsx.readFile(excelPath);
    } catch (e) {
      // Create new if corrupted
    }
  }

  let worksheet = workbook.getWorksheet('Daily Sales Ledger');
  if (!worksheet) {
    worksheet = workbook.addWorksheet('Daily Sales Ledger');
    worksheet.columns = [
      { header: 'Local Transaction ID', key: 'localId', width: 26 },
      { header: 'Order Number', key: 'orderNumber', width: 16 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 26 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Time', key: 'time', width: 14 },
      { header: 'Store Branch', key: 'branch', width: 28 },
      { header: 'POS Terminal', key: 'terminal', width: 22 },
      { header: 'Cashier Operator', key: 'cashier', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 22 },
      { header: 'Customer Mobile', key: 'customerPhone', width: 16 },
      { header: 'Primary Service', key: 'service', width: 22 },
      { header: 'Weight', key: 'weight', width: 12 },
      { header: 'Garment Breakdown', key: 'itemsBreakdown', width: 35 },
      { header: 'Gross Billed', key: 'grossBilled', width: 15 },
      { header: 'Received Amount', key: 'receivedAmount', width: 16 },
      { header: 'Balance Due', key: 'balanceDue', width: 15 },
      { header: 'Payment Mode', key: 'paymentMode', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 16 },
      { header: 'Sync Status', key: 'syncStatus', width: 14 },
    ];
    worksheet.getRow(1).font = { bold: true };
  }

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString('en-IN');
  const timeStr = createdAt.toLocaleTimeString('en-IN');

  const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
  const rec = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
  const bal = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - rec));

  const itemsBreakdown = (order.items || []).map(it => `${it.quantity || 1}x ${it.name}`).join(', ');

  const rowData = {
    localId: order.localId || order.id || '',
    orderNumber: order.orderNumber || order.id || '',
    invoiceNumber: order.invoiceNumber || order.orderNumber || '',
    date: dateStr,
    time: timeStr,
    branch: order.storeBranch || activePreset.branch,
    terminal: `${activePreset.terminalCode} (${activePreset.terminalId})`,
    cashier: order.cashierName || 'Cashier #1',
    customerName: order.customerName || order.customer?.name || 'Valued Customer',
    customerPhone: order.phone || order.customer?.phone || '',
    service: order.serviceName || order.service || 'Laundry Care',
    weight: order.actualWeight || order.estimatedWeightKg || order.weightKg || '',
    itemsBreakdown,
    grossBilled: total,
    receivedAmount: rec,
    balanceDue: bal,
    paymentMode: order.paymentMethod || 'CASH',
    paymentStatus: order.paymentStatus || (bal === 0 ? 'PAID' : 'PENDING'),
    syncStatus: order.syncStatus || 'LOCAL_SAVED',
  };

  let existingRow = null;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell(1).value === rowData.localId) {
      existingRow = row;
    }
  });

  if (existingRow) {
    existingRow.values = Object.values(rowData);
  } else {
    worksheet.addRow(rowData);
  }

  await workbook.xlsx.writeFile(excelPath);
}

// --- GENERATE DAILY SHIFT SUMMARY PDF ---
function generateShiftPDFBuffer(dateKey, orders = [], targetPreset = activePreset) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryNavy = '#0f172a';
      const brandBlue = '#2563eb';
      const textColor = '#1e293b';
      const mutedText = '#64748b';
      const lightBg = '#f8fafc';
      const borderGray = '#cbd5e1';

      // 1. Header & Logo
      const logoPath = getActualLogoPath();
      if (logoPath) {
        try { doc.image(logoPath, 36, 36, { fit: [140, 50] }); } catch (e) {
          doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH', 36, 36);
        }
      } else {
        doc.fontSize(18).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH', 36, 36);
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryNavy).text('TECH WASH LAUNDRY SERVICES', 190, 36);
      doc.fontSize(8).font('Helvetica').fillColor(mutedText)
        .text('Premium Eco Laundry & Dry Cleaning Operations', 190, 52)
        .text('Daily Shift Handover, Sales Closing Reconciliation & Summary Statement', 190, 64);

      // Shift Meta Box
      doc.rect(380, 34, 179, 58).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(brandBlue).fontSize(10).font('Helvetica-Bold').text('DAILY SHIFT CLOSING', 385, 40, { width: 169, align: 'center' });
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryNavy)
        .text(`Date: ${dateKey}`, 385, 54, { width: 169, align: 'center' })
        .text(`Store: ${targetPreset.branch}`, 385, 66, { width: 169, align: 'center' });
      doc.fontSize(7.5).font('Helvetica').fillColor(mutedText)
        .text(`Generated: ${new Date().toLocaleTimeString('en-IN')}`, 385, 78, { width: 169, align: 'center' });

      let y = 104;

      // 2. Cumulative Financial Totals
      let totalGross = 0;
      let totalRec = 0;
      let totalBal = 0;
      let cashRec = 0;
      let upiRec = 0;
      let cardRec = 0;
      let totalGarments = 0;

      orders.forEach(o => {
        const tot = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
        const rec = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? tot : 0));
        const bal = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, tot - rec));
        totalGross += tot;
        totalRec += rec;
        totalBal += bal;

        const pm = String(o.paymentMethod || 'CASH').toUpperCase();
        if (pm === 'CASH') cashRec += rec;
        else if (pm.includes('UPI') || pm.includes('QR')) upiRec += rec;
        else if (pm.includes('CARD') || pm.includes('POS')) cardRec += rec;
        else cashRec += rec;

        if (Array.isArray(o.items)) {
          o.items.forEach(it => { totalGarments += Number(it.quantity) || 1; });
        }
      });

      // KPI Metric Cards
      const cardW = 125;
      const cardH = 50;
      // Box 1: Total Bills
      doc.rect(36, y, cardW, cardH).fillAndStroke(lightBg, borderGray);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedText).text('TOTAL BILLS', 46, y + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryNavy).text(String(orders.length), 46, y + 20);
      doc.fontSize(7).font('Helvetica').fillColor(mutedText).text(`${totalGarments} Garments Processed`, 46, y + 36);

      // Box 2: Gross Billed
      doc.rect(169, y, cardW, cardH).fillAndStroke(lightBg, borderGray);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedText).text('GROSS BILLED VOLUME', 179, y + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(brandBlue).text(`₹${totalGross.toFixed(2)}`, 179, y + 20);
      doc.fontSize(7).font('Helvetica').fillColor(mutedText).text('Total Order Value', 179, y + 36);

      // Box 3: Collections
      doc.rect(302, y, cardW, cardH).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#15803d').text('COLLECTED INFLOWS', 312, y + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#15803d').text(`₹${totalRec.toFixed(2)}`, 312, y + 20);
      doc.fontSize(7).font('Helvetica').fillColor('#166534').text(`Cash: ₹${cashRec} | UPI: ₹${upiRec}`, 312, y + 36);

      // Box 4: Pending Dues
      doc.rect(435, y, cardW, cardH).fillAndStroke('#fef2f2', '#fecaca');
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#b91c1c').text('PENDING BALANCE DUES', 445, y + 8);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#b91c1c').text(`₹${totalBal.toFixed(2)}`, 445, y + 20);
      doc.fontSize(7).font('Helvetica').fillColor('#991b1b').text('Customer Outstanding', 445, y + 36);

      y += 62;

      // 3. Itemized Bills Table
      doc.rect(36, y, 523, 18).fill(primaryNavy);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('S.No', 42, y + 5);
      doc.text('Bill / Order #', 70, y + 5);
      doc.text('Time', 140, y + 5);
      doc.text('Customer Name', 180, y + 5);
      doc.text('Mobile', 270, y + 5);
      doc.text('Gross (₹)', 340, y + 5, { width: 55, align: 'right' });
      doc.text('Paid (₹)', 405, y + 5, { width: 50, align: 'right' });
      doc.text('Due (₹)', 465, y + 5, { width: 45, align: 'right' });
      doc.text('Mode', 520, y + 5, { width: 35, align: 'center' });

      y += 18;

      orders.slice(0, 30).forEach((ord, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, y, 523, 15).fillAndStroke(bg, '#f1f5f9');

        const bNum = String(ord.orderNumber || ord.id || idx + 1).slice(0, 14);
        const timeStr = ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--';
        const cName = String(ord.customerName || ord.customer?.name || 'Customer').slice(0, 16);
        const cPhone = String(ord.phone || ord.customer?.phone || '').slice(0, 10);
        const gAmt = Number(ord.totalAmount || ord.finalPrice || 0);
        const pAmt = Number(ord.receivedAmount !== undefined ? ord.receivedAmount : (ord.paymentStatus === 'PAID' ? gAmt : 0));
        const dAmt = Number(ord.balanceAmount !== undefined ? ord.balanceAmount : Math.max(0, gAmt - pAmt));
        const pMod = String(ord.paymentMethod || 'CASH').slice(0, 5);

        doc.fillColor(textColor).fontSize(7).font('Helvetica');
        doc.text(String(idx + 1), 42, y + 4);
        doc.font('Helvetica-Bold').text(bNum, 70, y + 4);
        doc.font('Helvetica').text(timeStr, 140, y + 4);
        doc.text(cName, 180, y + 4);
        doc.text(cPhone, 270, y + 4);
        doc.text(`₹${gAmt.toFixed(2)}`, 340, y + 4, { width: 55, align: 'right' });
        doc.fillColor('#15803d').text(`₹${pAmt.toFixed(2)}`, 405, y + 4, { width: 50, align: 'right' });
        doc.fillColor(dAmt > 0 ? '#b91c1c' : textColor).text(`₹${dAmt.toFixed(2)}`, 465, y + 4, { width: 45, align: 'right' });
        doc.fillColor(mutedText).text(pMod, 520, y + 4, { width: 35, align: 'center' });

        y += 15;
      });

      if (orders.length > 30) {
        doc.rect(36, y, 523, 14).fill('#f8fafc');
        doc.fillColor(mutedText).fontSize(7).text(`+ ${orders.length - 30} additional bills recorded in Excel Ledger & daily Invoices folder.`, 42, y + 3);
        y += 16;
      }

      y += 12;

      // 4. Reconciliation Sign-off box
      doc.rect(36, y, 523, 50).fillAndStroke(lightBg, borderGray);
      doc.fillColor(primaryNavy).fontSize(8).font('Helvetica-Bold').text('SHIFT CASH & AUDIT VERIFICATION', 46, y + 6);
      doc.fontSize(7.5).font('Helvetica').fillColor(textColor)
        .text(`Physical Cash in Drawer: ₹${cashRec.toFixed(2)}  |  Digital / UPI Inflows: ₹${upiRec.toFixed(2)}  |  Card Inflows: ₹${cardRec.toFixed(2)}`, 46, y + 18)
        .text('Staff / Cashier Signature: __________________________        Store Manager / Owner Signature: __________________________', 46, y + 34);

      y += 56;
      doc.fontSize(7).fillColor(mutedText).text('Tech Wash Laundry Services — Confidential Shift Report for Owners & Management', 36, y, { width: 523, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// --- GENERATE MONTHLY EXCEL FILE ---
async function generateMonthlyExcelFile(excelPath, monthKey, orders = [], targetPreset = activePreset) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tech Wash Laundry Services';
  workbook.created = new Date();

  // Sheet 1: Monthly Bills Register
  const ws = workbook.addWorksheet('Monthly Bills Register');
  ws.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Order Number', key: 'orderNumber', width: 16 },
    { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 12 },
    { header: 'Store Branch', key: 'branch', width: 28 },
    { header: 'Terminal', key: 'terminal', width: 18 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Customer Mobile', key: 'phone', width: 16 },
    { header: 'Service', key: 'service', width: 22 },
    { header: 'Garments Breakdown', key: 'items', width: 35 },
    { header: 'Weight (Kg)', key: 'weight', width: 12 },
    { header: 'Gross Billed (₹)', key: 'gross', width: 16 },
    { header: 'Received Amount (₹)', key: 'received', width: 18 },
    { header: 'Balance Due (₹)', key: 'balance', width: 16 },
    { header: 'Payment Mode', key: 'mode', width: 14 },
    { header: 'Payment Status', key: 'status', width: 16 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  let totalGross = 0;
  let totalRec = 0;
  let totalBal = 0;

  orders.forEach((o, idx) => {
    const d = o.createdAt ? new Date(o.createdAt) : new Date();
    const g = Number(o.totalAmount || o.finalPrice || 0);
    const r = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? g : 0));
    const b = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, g - r));
    totalGross += g;
    totalRec += r;
    totalBal += b;

    const itemsSummary = (o.items || []).map(it => `${it.quantity || 1}x ${it.name}`).join(', ');

    ws.addRow({
      sno: idx + 1,
      orderNumber: o.orderNumber || o.id || '',
      invoiceNumber: o.invoiceNumber || o.orderNumber || '',
      date: d.toLocaleDateString('en-IN'),
      time: d.toLocaleTimeString('en-IN'),
      branch: o.storeBranch || targetPreset.branch,
      terminal: o.terminalCode || targetPreset.terminalCode,
      customerName: o.customerName || o.customer?.name || 'Customer',
      phone: o.phone || o.customer?.phone || '',
      service: o.serviceName || o.service || 'Laundry Service',
      items: itemsSummary,
      weight: o.actualWeight || o.estimatedWeightKg || '',
      gross: g,
      received: r,
      balance: b,
      mode: o.paymentMethod || 'CASH',
      status: o.paymentStatus || (b === 0 ? 'PAID' : 'PENDING'),
    });
  });

  // Summary row
  const sumRow = ws.addRow({
    sno: '',
    orderNumber: 'TOTALS',
    invoiceNumber: `${orders.length} Bills`,
    date: '',
    time: '',
    branch: '',
    terminal: '',
    customerName: '',
    phone: '',
    service: '',
    items: '',
    weight: '',
    gross: totalGross,
    received: totalRec,
    balance: totalBal,
    mode: '',
    status: '',
  });
  sumRow.font = { bold: true };

  // Sheet 2: Summary Dashboard
  const sumWs = workbook.addWorksheet('Summary KPIs');
  sumWs.columns = [
    { header: 'Performance Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 24 },
  ];
  sumWs.getRow(1).font = { bold: true };
  sumWs.addRow({ metric: 'Month Period', value: monthKey });
  sumWs.addRow({ metric: 'Store Location', value: targetPreset.branch });
  sumWs.addRow({ metric: 'Total Bills Count', value: orders.length });
  sumWs.addRow({ metric: 'Gross Sales Volume (₹)', value: totalGross });
  sumWs.addRow({ metric: 'Total Cash / UPI Collections (₹)', value: totalRec });
  sumWs.addRow({ metric: 'Net Pending Customer Dues (₹)', value: totalBal });

  await workbook.xlsx.writeFile(excelPath);
  return excelPath;
}

// --- HTTP SERVER SETUP ---
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-terminal-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // --- HEALTH ENDPOINT ---
  if (req.method === 'GET' && pathname === '/api/health') {
    const foldersOk = {
      root: fs.existsSync(STORAGE_ROOT),
      invoices: fs.existsSync(INVOICES_DIR),
      exports: fs.existsSync(EXPORTS_DIR),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      terminalId: activePreset.terminalId,
      terminalCode: activePreset.terminalCode,
      branch: activePreset.branch,
      storageRoot: STORAGE_ROOT,
      folders: foldersOk,
      primaryStorage: 'IndexedDB TechWashPOS',
      bridgeVersion: '2.0.0-indexeddb-redesigned-pdf',
    }));
  }

  // --- SAVE TRANSACTION ENDPOINT ---
  if (req.method === 'POST' && pathname === '/api/save-transaction') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');

        // 1. Resolve Dynamic Terminal Preset
        const incomingTerminalId = req.headers['x-terminal-id'] || payload.terminalId || activeTerminalId;
        const targetPreset = resolveTerminalPreset(incomingTerminalId);

        const terminalStorageRoot = path.join(ROOT_BASE, targetPreset.folderName);
        const terminalInvoicesDir = path.join(terminalStorageRoot, 'Invoices');
        const terminalExportsDir = path.join(terminalStorageRoot, 'Exports');

        // 2. Validate Required Payload Fields
        const localId = payload.localId || payload.id || payload.orderNumber;
        if (!localId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: false,
            error: 'Malformed Payload: Missing localId or orderNumber identifier.',
          }));
        }

        if (String(localId).includes('..') || String(localId).includes('/') || String(localId).includes('\\')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: false,
            error: 'Invalid Identifier: Path traversal symbols detected.',
          }));
        }

        const dateKey = extractLocalDateKey(payload);

        // Ensure date invoice directory exists
        const dateInvoiceDir = path.join(terminalInvoicesDir, dateKey);
        if (!fs.existsSync(dateInvoiceDir)) {
          fs.mkdirSync(dateInvoiceDir, { recursive: true });
        }

        // Ensure exports directory exists
        if (!fs.existsSync(terminalExportsDir)) {
          fs.mkdirSync(terminalExportsDir, { recursive: true });
        }

        const orderRecord = {
          ...payload,
          localId,
          terminalId: targetPreset.terminalId,
          terminalCode: targetPreset.terminalCode,
          storeBranch: payload.storeBranch || targetPreset.branch,
          syncStatus: payload.syncStatus || 'LOCAL_SAVED',
          updatedAt: new Date().toISOString(),
        };

        // 3. Generate & Save Customer Invoice PDF (Saved with Bill Number inside Date folder)
        const billNumber = String(orderRecord.orderNumber || orderRecord.id || localId).trim();
        const rawInvName = String(orderRecord.invoiceNumber || billNumber).trim();
        const formattedInvName = rawInvName.toUpperCase().startsWith('INV-') ? rawInvName : `INV-${rawInvName}`;
        
        // Exact Bill Number PDF (e.g. TW-00001.pdf)
        const pdfFilePath = path.join(dateInvoiceDir, `${sanitizeFilename(billNumber)}.pdf`);
        const pdfBuffer = await generateInvoicePDFBuffer(orderRecord);
        fs.writeFileSync(pdfFilePath, pdfBuffer);

        // Also save formatted INV-<BillNumber>.pdf if distinct
        if (sanitizeFilename(formattedInvName) !== sanitizeFilename(billNumber)) {
          const altPdfPath = path.join(dateInvoiceDir, `${sanitizeFilename(formattedInvName)}.pdf`);
          try { fs.writeFileSync(altPdfPath, pdfBuffer); } catch (e) {}
        }

        // Mirror directly to Admin\Invoices\<dateKey>\<billNumber>.pdf
        try {
          const adminDateInvoiceDir = path.join(ROOT_BASE, 'Admin', 'Invoices', dateKey);
          if (!fs.existsSync(adminDateInvoiceDir)) {
            fs.mkdirSync(adminDateInvoiceDir, { recursive: true });
          }
          fs.writeFileSync(path.join(adminDateInvoiceDir, `${sanitizeFilename(billNumber)}.pdf`), pdfBuffer);
        } catch (e) {}

        // 3b. Also save into dedicated PDFs\<dateKey>\<billNumber>.pdf for Terminal and Admin
        try {
          const terminalDatePdfDir = path.join(terminalStorageRoot, 'PDFs', dateKey);
          if (!fs.existsSync(terminalDatePdfDir)) fs.mkdirSync(terminalDatePdfDir, { recursive: true });
          fs.writeFileSync(path.join(terminalDatePdfDir, `${sanitizeFilename(billNumber)}.pdf`), pdfBuffer);

          const adminDatePdfDir = path.join(ROOT_BASE, 'Admin', 'PDFs', dateKey);
          if (!fs.existsSync(adminDatePdfDir)) fs.mkdirSync(adminDatePdfDir, { recursive: true });
          fs.writeFileSync(path.join(adminDatePdfDir, `${sanitizeFilename(billNumber)}.pdf`), pdfBuffer);
        } catch (e) {}

        // 4. Update Daily Excel Spreadsheet for Terminal and Admin
        const excelFilePath = path.join(terminalExportsDir, `${dateKey}.xlsx`);
        await updateDailyExcelFile(excelFilePath, orderRecord);
        try {
          const adminExportsDir = path.join(ROOT_BASE, 'Admin', 'Exports');
          if (!fs.existsSync(adminExportsDir)) fs.mkdirSync(adminExportsDir, { recursive: true });
          await updateDailyExcelFile(path.join(adminExportsDir, `${dateKey}.xlsx`), orderRecord);
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          localId,
          billNumber,
          status: 'LOCAL_SAVED',
          paths: {
            pdf: pdfFilePath,
            excel: excelFilePath,
          },
        }));

      } catch (err) {
        console.error('Local Bridge save-transaction error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: false,
          error: err.message || 'Internal Bridge Error',
        }));
      }
    });
    return;
  }

  // --- EXPORT SHIFT BUNDLE ENDPOINT (Saves all bills of same day into daily folder & zip for company owners) ---
  if (req.method === 'POST' && pathname === '/api/export-shift-bundle') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');
        const incomingTerminalId = req.headers['x-terminal-id'] || payload.terminalId || activeTerminalId;
        const targetPreset = resolveTerminalPreset(incomingTerminalId);
        const dateKey = payload.dateKey || new Date().toISOString().slice(0, 10);

        const terminalStorageRoot = path.join(ROOT_BASE, targetPreset.folderName);
        const shiftExportDir = path.join(terminalStorageRoot, 'Exports', dateKey);
        const shiftInvoicesDir = path.join(shiftExportDir, 'Invoices');
        const shiftPDFsDir = path.join(shiftExportDir, 'PDFs');

        if (!fs.existsSync(shiftExportDir)) fs.mkdirSync(shiftExportDir, { recursive: true });
        if (!fs.existsSync(shiftInvoicesDir)) fs.mkdirSync(shiftInvoicesDir, { recursive: true });
        if (!fs.existsSync(shiftPDFsDir)) fs.mkdirSync(shiftPDFsDir, { recursive: true });

        // Admin mirror directory
        const adminShiftExportDir = path.join(ROOT_BASE, 'Admin', 'Exports', dateKey);
        const adminShiftInvoicesDir = path.join(adminShiftExportDir, 'Invoices');
        const adminShiftPDFsDir = path.join(adminShiftExportDir, 'PDFs');
        if (!fs.existsSync(adminShiftExportDir)) fs.mkdirSync(adminShiftExportDir, { recursive: true });
        if (!fs.existsSync(adminShiftInvoicesDir)) fs.mkdirSync(adminShiftInvoicesDir, { recursive: true });
        if (!fs.existsSync(adminShiftPDFsDir)) fs.mkdirSync(adminShiftPDFsDir, { recursive: true });

        const orders = Array.isArray(payload.orders) ? payload.orders : [];

        // 1. Generate & Save each order's PDF into Exports/<dateKey>/PDFs/<billNumber>.pdf, Invoices/<billNumber>.pdf, and ZIP
        const zip = new JSZip();
        const zipPDFs = zip.folder('PDFs');
        const zipInvoices = zip.folder('Invoices');

        for (const order of orders) {
          const bNum = String(order.orderNumber || order.id || 'BILL').trim();
          const cleanName = `${sanitizeFilename(bNum)}.pdf`;
          const pdfBuffer = await generateInvoicePDFBuffer(order);

          // Save in shift export PDFs directory
          fs.writeFileSync(path.join(shiftPDFsDir, cleanName), pdfBuffer);
          fs.writeFileSync(path.join(adminShiftPDFsDir, cleanName), pdfBuffer);

          // Save in shift export Invoices directory
          fs.writeFileSync(path.join(shiftInvoicesDir, cleanName), pdfBuffer);
          fs.writeFileSync(path.join(adminShiftInvoicesDir, cleanName), pdfBuffer);

          // Also mirror to root terminal & admin PDFs directory: PDFs/<dateKey>/<billNumber>.pdf
          try {
            const rootTermPdfDir = path.join(terminalStorageRoot, 'PDFs', dateKey);
            if (!fs.existsSync(rootTermPdfDir)) fs.mkdirSync(rootTermPdfDir, { recursive: true });
            fs.writeFileSync(path.join(rootTermPdfDir, cleanName), pdfBuffer);

            const rootAdminPdfDir = path.join(ROOT_BASE, 'Admin', 'PDFs', dateKey);
            if (!fs.existsSync(rootAdminPdfDir)) fs.mkdirSync(rootAdminPdfDir, { recursive: true });
            fs.writeFileSync(path.join(rootAdminPdfDir, cleanName), pdfBuffer);
          } catch (e) {}

          // Add to ZIP folders
          zipPDFs.file(cleanName, pdfBuffer);
          zipInvoices.file(cleanName, pdfBuffer);
        }

        // 2. Generate Shift Summary Statement PDF
        const shiftPdfBuffer = await generateShiftPDFBuffer(dateKey, orders, targetPreset);
        const shiftPdfPath = path.join(shiftExportDir, `Shift-Statement-${dateKey}.pdf`);
        fs.writeFileSync(shiftPdfPath, shiftPdfBuffer);
        fs.writeFileSync(path.join(adminShiftExportDir, `Shift-Statement-${dateKey}.pdf`), shiftPdfBuffer);
        zip.file(`Shift-Statement-${dateKey}.pdf`, shiftPdfBuffer);

        // 3. Generate Daily Sales Excel Ledger
        const excelPath = path.join(shiftExportDir, `Daily-Sales-Ledger-${dateKey}.xlsx`);
        const wb = new ExcelJS.Workbook();
        wb.creator = 'Tech Wash Laundry Services';
        wb.created = new Date();
        const ws = wb.addWorksheet('Daily Shift Ledger');
        ws.columns = [
          { header: 'Order Number', key: 'orderNumber', width: 16 },
          { header: 'Invoice Number', key: 'invoiceNumber', width: 18 },
          { header: 'Date', key: 'date', width: 14 },
          { header: 'Customer Name', key: 'customerName', width: 22 },
          { header: 'Customer Mobile', key: 'phone', width: 16 },
          { header: 'Primary Service', key: 'service', width: 22 },
          { header: 'Gross (₹)', key: 'gross', width: 14 },
          { header: 'Received (₹)', key: 'received', width: 14 },
          { header: 'Balance (₹)', key: 'balance', width: 14 },
          { header: 'Payment Mode', key: 'mode', width: 14 },
          { header: 'Status', key: 'status', width: 14 },
        ];
        ws.getRow(1).font = { bold: true };
        orders.forEach(o => {
          ws.addRow({
            orderNumber: o.orderNumber || o.id,
            invoiceNumber: o.invoiceNumber || o.orderNumber || '',
            date: dateKey,
            customerName: o.customerName || o.customer?.name || 'Customer',
            phone: o.phone || o.customer?.phone || '',
            service: o.serviceName || o.service || 'Laundry Care',
            gross: Number(o.totalAmount || o.finalPrice || 0),
            received: Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? (o.totalAmount || 0) : 0)),
            balance: Number(o.balanceAmount || 0),
            mode: o.paymentMethod || 'CASH',
            status: o.paymentStatus || 'SETTLED',
          });
        });
        await wb.xlsx.writeFile(excelPath);
        await wb.xlsx.writeFile(path.join(adminShiftExportDir, `Daily-Sales-Ledger-${dateKey}.xlsx`));

        const excelBuffer = await wb.xlsx.writeBuffer();
        zip.file(`Daily-Sales-Ledger-${dateKey}.xlsx`, excelBuffer);

        // 4. Generate & Save ZIP Archive
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const zipPath = path.join(shiftExportDir, `Daily-Shift-Bundle-${dateKey}.zip`);
        fs.writeFileSync(zipPath, zipBuffer);
        fs.writeFileSync(path.join(adminShiftExportDir, `Daily-Shift-Bundle-${dateKey}.zip`), zipBuffer);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          dateKey,
          totalBills: orders.length,
          folderPath: shiftExportDir,
          zipPath,
          zipBase64: zipBuffer.toString('base64'),
          message: `Shift bundle with all ${orders.length} bill PDFs and Excel saved to ${shiftExportDir}`,
        }));
      } catch (err) {
        console.error('Export shift bundle error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // --- EXPORT MONTHLY EXCEL ENDPOINT ---
  if (req.method === 'POST' && pathname === '/api/export-monthly-excel') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');
        const incomingTerminalId = req.headers['x-terminal-id'] || payload.terminalId || activeTerminalId;
        const targetPreset = resolveTerminalPreset(incomingTerminalId);
        const monthKey = payload.monthKey || new Date().toISOString().slice(0, 7);

        const terminalStorageRoot = path.join(ROOT_BASE, targetPreset.folderName);
        const terminalExportsDir = path.join(terminalStorageRoot, 'Exports');
        if (!fs.existsSync(terminalExportsDir)) fs.mkdirSync(terminalExportsDir, { recursive: true });

        const excelFileName = `TechWash-Monthly-Report-${monthKey}.xlsx`;
        const excelFilePath = path.join(terminalExportsDir, excelFileName);

        const orders = Array.isArray(payload.orders) ? payload.orders : [];
        await generateMonthlyExcelFile(excelFilePath, monthKey, orders, targetPreset);

        // Mirror to Admin/Exports/
        try {
          const adminExportsDir = path.join(ROOT_BASE, 'Admin', 'Exports');
          if (!fs.existsSync(adminExportsDir)) fs.mkdirSync(adminExportsDir, { recursive: true });
          await generateMonthlyExcelFile(path.join(adminExportsDir, excelFileName), monthKey, orders, targetPreset);
        } catch (e) {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          monthKey,
          totalBills: orders.length,
          path: excelFilePath,
          fileName: excelFileName,
          message: `Monthly Excel report generated at ${excelFilePath}`,
        }));
      } catch (err) {
        console.error('Export monthly excel error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // --- INIT STORAGE ENDPOINT (Creates C:\TechWash folders & saves data files) ---
  if (req.method === 'POST' && pathname === '/api/init-storage') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        ensureDirectories();
        const payload = JSON.parse(bodyText || '{}');
        const pos01DataDir = path.join(ROOT_BASE, 'POS-01', 'Data');
        const adminDataDir = path.join(ROOT_BASE, 'Admin', 'Data');
        if (!fs.existsSync(pos01DataDir)) fs.mkdirSync(pos01DataDir, { recursive: true });
        if (!fs.existsSync(adminDataDir)) fs.mkdirSync(adminDataDir, { recursive: true });

        const targetDataDirs = [adminDataDir, pos01DataDir];

        targetDataDirs.forEach(dir => {
          if (Array.isArray(payload.orders) && payload.orders.length > 0) {
            fs.writeFileSync(path.join(dir, 'orders.json'), JSON.stringify(payload.orders, null, 2));
          }
          if (Array.isArray(payload.customers) && payload.customers.length > 0) {
            fs.writeFileSync(path.join(dir, 'customers.json'), JSON.stringify(payload.customers, null, 2));
          }
          if (Array.isArray(payload.dues) && payload.dues.length > 0) {
            fs.writeFileSync(path.join(dir, 'dues.json'), JSON.stringify(payload.dues, null, 2));
          }
          if (Array.isArray(payload.payments) && payload.payments.length > 0) {
            fs.writeFileSync(path.join(dir, 'payments.json'), JSON.stringify(payload.payments, null, 2));
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          message: 'All storage directories and data files initialized in C:\\TechWash',
          root: ROOT_BASE,
          folder: pos01DataDir,
        }));
      } catch (err) {
        console.error('Local Bridge init-storage error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 404 Route Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Route Not Found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Tech Wash Local Windows Storage Bridge Active (IndexedDB Primary Mode)!`);
  console.log(`   Host: http://${HOST}:${PORT}`);
  console.log(`   Terminal: ${activePreset.terminalCode} (${activePreset.terminalId} - ${activePreset.branch})`);
  console.log(`   Storage Root: ${STORAGE_ROOT}`);
});
