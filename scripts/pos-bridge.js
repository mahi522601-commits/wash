/**
 * Tech Wash Laundry Services — Local Windows Storage Bridge Service
 * Listens strictly on 127.0.0.1:9123
 * No SQL database — File-based storage only under C:\TechWash\POS-XX\
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

const DATA_DIR = path.join(STORAGE_ROOT, 'Data');
const INVOICES_DIR = path.join(STORAGE_ROOT, 'Invoices');
const EXPORTS_DIR = path.join(STORAGE_ROOT, 'Exports');
const BACKUPS_DIR = path.join(STORAGE_ROOT, 'Backups');

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
      path.join(tRoot, 'Exports'),
      path.join(tRoot, 'Backups'),
    ];
    subDirs.forEach(d => {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    });
  });
}

ensureDirectories();

// --- ATOMIC FILE WRITE HELPER ---
function atomicWriteJsonSync(filePath, dataObj) {
  const tempPath = `${filePath}.${Date.now()}-${Math.random().toString(36).substring(2, 6)}.tmp`;
  const jsonContent = JSON.stringify(dataObj, null, 2);
  fs.writeFileSync(tempPath, jsonContent, 'utf8');
  fs.renameSync(tempPath, filePath);
}

// --- SANITIZE FILENAME HELPER ---
function sanitizeFilename(name) {
  return String(name || '').replace(/[^a-zA-Z0-9_\-.]/g, '_');
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

      const primaryColor = '#0f172a';
      const accentColor = '#f97316';
      const textColor = '#1e293b';

      // Header Banner
      doc.rect(36, 36, 523, 50).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('TECH WASH LAUNDRY SERVICES', 50, 48);
      doc.fontSize(9).font('Helvetica').text('Official Customer Tax Invoice & Receipt', 50, 68);

      const invNum = order.invoiceNumber || order.orderNumber || order.id || 'INV-0000';
      doc.fontSize(10).font('Helvetica-Bold').text(`INV #: ${invNum}`, 400, 48, { align: 'right' });
      const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN');
      doc.fontSize(8).font('Helvetica').text(`Date: ${dateStr}`, 400, 64, { align: 'right' });

      let y = 100;

      // Store & Customer Info Grid
      doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text('STORE BRANCH:', 40, y);
      doc.font('Helvetica').text(order.storeBranch || activePreset.branch, 130, y);
      doc.font('Helvetica-Bold').text('CUSTOMER:', 320, y);
      doc.font('Helvetica').text(order.customerName || order.customer?.name || 'Valued Customer', 390, y);

      y += 16;
      doc.font('Helvetica-Bold').text('TERMINAL:', 40, y);
      doc.font('Helvetica').text(`${activePreset.terminalCode} (${activePreset.terminalId})`, 130, y);
      doc.font('Helvetica-Bold').text('MOBILE:', 320, y);
      doc.font('Helvetica').text(order.phone || order.customer?.phone || 'N/A', 390, y);

      y += 16;
      doc.font('Helvetica-Bold').text('CASHIER:', 40, y);
      doc.font('Helvetica').text(order.cashierName || 'Cashier #1', 130, y);
      doc.font('Helvetica-Bold').text('ADDRESS:', 320, y);
      doc.font('Helvetica').text((order.address || order.customer?.address || 'Counter Pick-up').slice(0, 35), 390, y);

      y += 25;

      // Items Table Header
      doc.rect(40, y, 515, 18).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 45, y + 5);
      doc.text('Item / Service Description', 65, y + 5);
      doc.text('Qty', 330, y + 5, { align: 'right' });
      doc.text('Unit Price', 410, y + 5, { align: 'right' });
      doc.text('Line Total', 490, y + 5, { align: 'right' });

      y += 18;

      const items = order.items || [];
      items.forEach((it, idx) => {
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, y, 515, 18).fillAndStroke(bg, '#e2e8f0');

        const qty = Number(it.quantity || 1);
        const uPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
        const lTotal = Number(it.lineTotal !== undefined ? it.lineTotal : (uPrice * qty));

        doc.fillColor(textColor).fontSize(8).font('Helvetica');
        doc.text(String(idx + 1), 45, y + 5);
        doc.text(String(it.name || it.subServiceName || 'Garment Item').slice(0, 45), 65, y + 5);
        doc.text(String(qty), 330, y + 5, { align: 'right' });
        doc.text(`Rs. ${uPrice.toFixed(2)}`, 410, y + 5, { align: 'right' });
        doc.text(`Rs. ${lTotal.toFixed(2)}`, 490, y + 5, { align: 'right' });
        y += 18;
      });

      y += 15;

      // Totals Box
      const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
      const rec = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
      const bal = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - rec));

      doc.rect(320, y, 235, 60).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor(textColor).fontSize(9);

      doc.font('Helvetica-Bold').text('GRAND TOTAL:', 330, y + 10);
      doc.font('Helvetica-Bold').text(`Rs. ${total.toFixed(2)}`, 490, y + 10, { align: 'right' });

      doc.font('Helvetica').text('Amount Received:', 330, y + 26);
      doc.text(`Rs. ${rec.toFixed(2)}`, 490, y + 26, { align: 'right' });

      doc.font('Helvetica-Bold').text('Balance Due:', 330, y + 42);
      doc.fillColor(bal > 0 ? '#b91c1c' : '#15803d');
      doc.text(`Rs. ${bal.toFixed(2)}`, 490, y + 42, { align: 'right' });

      y += 80;

      // Footer
      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      doc.text('Thank you for choosing Tech Wash Laundry Services!', 40, y, { align: 'center' });
      doc.text(`Payment Mode: ${order.paymentMethod || 'CASH'} • Status: ${order.paymentStatus || (bal === 0 ? 'PAID' : 'PENDING')}`, 40, y + 12, { align: 'center' });

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

  // Check if row exists by localId
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
  // CORS Headers for Localhost React Apps
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
      data: fs.existsSync(DATA_DIR),
      invoices: fs.existsSync(INVOICES_DIR),
      exports: fs.existsSync(EXPORTS_DIR),
      backups: fs.existsSync(BACKUPS_DIR),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      terminalId: activePreset.terminalId,
      terminalCode: activePreset.terminalCode,
      branch: activePreset.branch,
      storageRoot: STORAGE_ROOT,
      folders: foldersOk,
      bridgeVersion: '1.0.0-phase4-hardened',
    }));
  }

  // --- GET LOCAL TRANSACTIONS ENDPOINT (for local queue recovery & reconciliation) ---
  if (req.method === 'GET' && pathname === '/api/get-transactions') {
    const targetDate = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const jsonPath = path.join(DATA_DIR, `${targetDate}.json`);
    let dayOrders = [];
    if (fs.existsSync(jsonPath)) {
      try {
        dayOrders = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        dayOrders = [];
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      dateKey: targetDate,
      terminalId: activePreset.terminalId,
      orders: Array.isArray(dayOrders) ? dayOrders : []
    }));
  }

  // --- SAVE TRANSACTION ENDPOINT ---
  if (req.method === 'POST' && pathname === '/api/save-transaction') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText || '{}');

        // 1. Validate Terminal Identity
        const incomingTerminalId = req.headers['x-terminal-id'] || payload.terminalId || activePreset.terminalId;
        if (incomingTerminalId !== activePreset.terminalId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: false,
            error: `Terminal Mismatch: Request for terminalId "${incomingTerminalId}" rejected by Local Bridge bound to "${activePreset.terminalId}".`,
          }));
        }

        // 2. Validate Required Payload Fields
        const localId = payload.localId || payload.id || payload.orderNumber;
        if (!localId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: false,
            error: 'Malformed Payload: Missing localId or orderNumber identifier.',
          }));
        }

        // Security check for path traversal
        if (String(localId).includes('..') || String(localId).includes('/') || String(localId).includes('\\')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            ok: false,
            error: 'Invalid Identifier: Path traversal symbols detected.',
          }));
        }

        const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();
        const year = createdAt.getFullYear();
        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
        const day = String(createdAt.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        // Ensure date invoice directory exists
        const dateInvoiceDir = path.join(INVOICES_DIR, dateKey);
        if (!fs.existsSync(dateInvoiceDir)) {
          fs.mkdirSync(dateInvoiceDir, { recursive: true });
        }

        const orderRecord = {
          ...payload,
          localId,
          terminalId: activePreset.terminalId,
          terminalCode: activePreset.terminalCode,
          storeBranch: payload.storeBranch || activePreset.branch,
          syncStatus: payload.syncStatus || 'LOCAL_SAVED',
          updatedAt: new Date().toISOString(),
        };

        // 3. Atomic JSON Storage
        const jsonFilePath = path.join(DATA_DIR, `${dateKey}.json`);
        let dayOrders = [];
        if (fs.existsSync(jsonFilePath)) {
          try {
            dayOrders = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
            if (!Array.isArray(dayOrders)) dayOrders = [];
          } catch (e) {
            dayOrders = [];
          }
        }

        const existingIdx = dayOrders.findIndex(o => o.localId === localId || o.orderNumber === localId || o.id === localId);
        if (existingIdx >= 0) {
          dayOrders[existingIdx] = orderRecord;
        } else {
          dayOrders.push(orderRecord);
        }

        atomicWriteJsonSync(jsonFilePath, dayOrders);

        // 4. Generate & Save Customer Invoice PDF
        const rawInvName = String(orderRecord.invoiceNumber || orderRecord.orderNumber || localId).trim();
        const formattedInvName = rawInvName.toUpperCase().startsWith('INV-') ? rawInvName : `INV-${rawInvName}`;
        const pdfFilePath = path.join(dateInvoiceDir, `${sanitizeFilename(formattedInvName)}.pdf`);
        const pdfBuffer = await generateInvoicePDFBuffer(orderRecord);
        fs.writeFileSync(pdfFilePath, pdfBuffer);

        // 5. Update Daily Excel Spreadsheet
        const excelFilePath = path.join(EXPORTS_DIR, `${dateKey}.xlsx`);
        await updateDailyExcelFile(excelFilePath, orderRecord);

        // 6. Write Date-wise Backup Snapshots
        const backupJsonPath = path.join(BACKUPS_DIR, `${activePreset.folderName}-orders-${dateKey}.json`);
        const backupExcelPath = path.join(BACKUPS_DIR, `${activePreset.folderName}-orders-${dateKey}.xlsx`);
        atomicWriteJsonSync(backupJsonPath, dayOrders);
        await updateDailyExcelFile(backupExcelPath, orderRecord);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          localId,
          status: 'LOCAL_SAVED',
          paths: {
            json: jsonFilePath,
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
  console.log(`✅ Tech Wash Local Windows Storage Bridge Active!`);
  console.log(`   Host: http://${HOST}:${PORT}`);
  console.log(`   Terminal: ${activePreset.terminalCode} (${activePreset.terminalId} - ${activePreset.branch})`);
  console.log(`   Storage Root: ${STORAGE_ROOT}`);
});
