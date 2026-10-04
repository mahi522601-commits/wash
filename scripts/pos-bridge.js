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

// --- TERMINAL CONFIGURATION & MAPPING ---
const TERMINAL_PRESETS = {
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
      path.join(tRoot, 'Invoices'),
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

        // 3. Generate & Save Customer Invoice PDF
        const rawInvName = String(orderRecord.invoiceNumber || orderRecord.orderNumber || localId).trim();
        const formattedInvName = rawInvName.toUpperCase().startsWith('INV-') ? rawInvName : `INV-${rawInvName}`;
        const pdfFilePath = path.join(dateInvoiceDir, `${sanitizeFilename(formattedInvName)}.pdf`);
        const pdfBuffer = await generateInvoicePDFBuffer(orderRecord);
        fs.writeFileSync(pdfFilePath, pdfBuffer);

        // 4. Update Daily Excel Spreadsheet
        const excelFilePath = path.join(terminalExportsDir, `${dateKey}.xlsx`);
        await updateDailyExcelFile(excelFilePath, orderRecord);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          localId,
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
