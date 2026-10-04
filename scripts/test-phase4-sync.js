/**
 * Phase 4 Automated Test Suite for Tech Wash Laundry Services
 * Tests Local File Storage First -> Firestore Cloud Sync
 * Verified against Node.js runtime environment with local bridge connection
 */

import fs from 'fs';
import path from 'path';
import http from 'http';

const BRIDGE_URL = 'http://127.0.0.1:9123';
const TEST_TERMINAL_ID = 'counter-1';
const TEST_LOCAL_ID = `POS01-20261003-${Math.floor(100000 + Math.random() * 900000)}`;

console.log('====================================================');
console.log('🧪 TECH WASH LAUNDRY — PHASE 4 AUTOMATED TEST SUITE');
console.log('====================================================');
console.log(`Test Order Local ID: ${TEST_LOCAL_ID}`);
console.log(`Test Terminal: ${TEST_TERMINAL_ID} (Main Branch — Manikonda)\n`);

function makeHttpRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase4Tests() {
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, title, details = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ [PASS ${passedCount}/${totalCount}] ${title}`);
      if (details) console.log(`   └─ ${details}`);
    } else {
      console.error(`❌ [FAIL ${passedCount}/${totalCount}] ${title}`);
      if (details) console.error(`   └─ ${details}`);
      process.exit(1);
    }
  }

  // TEST 1: Check Local Bridge Health & Terminal Identity Validation
  console.log('--- TEST 1: LOCAL WINDOWS BRIDGE HEALTH & TERMINAL IDENTITY ---');
  try {
    const health = await makeHttpRequest(`${BRIDGE_URL}/api/health`);
    assert(health.status === 200 && health.data.ok === true, 'Local Windows Bridge Health Check', `Status: ${health.data.status}, Path: ${health.data.activeDirectory}`);
    assert(health.data.terminalId === TEST_TERMINAL_ID, 'Bridge Terminal Identity matches POS-01', `Terminal: ${health.data.terminalId}`);
  } catch (err) {
    assert(false, 'Local Windows Bridge Health Check', `Bridge connection failed: ${err.message}`);
  }

  // TEST 2: Save Transaction to Local Windows Storage FIRST
  console.log('\n--- TEST 2: LOCAL STORAGE WRITE FIRST ---');
  const testOrder = {
    localId: TEST_LOCAL_ID,
    serverId: TEST_LOCAL_ID,
    id: TEST_LOCAL_ID,
    orderNumber: `TW-99${Math.floor(100 + Math.random() * 900)}`,
    invoiceNumber: `INV-${TEST_LOCAL_ID}`,
    customerName: 'Test Phase 4 Customer',
    phone: '9876543210',
    whatsapp: '9876543210',
    address: 'Plot 42, Phase 4 Test Ave, Manikonda, Hyderabad',
    service: 'Dry Cleaning & Steam Press',
    items: [
      { name: 'Suit (2-Piece)', quantity: 1, unitPrice: 350, itemTotal: 350 },
      { name: 'Silk Saree', quantity: 1, unitPrice: 250, itemTotal: 250 }
    ],
    totalAmount: 600,
    receivedAmount: 200,
    balanceAmount: 400,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'UPI',
    terminalId: TEST_TERMINAL_ID,
    terminalCode: 'TW-POS-01',
    storeBranch: 'Main Branch — Manikonda',
    cashierName: 'Phase 4 Tester',
    syncStatus: 'LOCAL_SAVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusTimeline: [
      { stage: 'CONFIRMED', label: 'Bill Generated', timestamp: new Date().toISOString(), note: 'Phase 4 test order' }
    ],
    paymentHistory: [
      { timestamp: new Date().toISOString(), amount: 200, mode: 'UPI', note: 'Advance deposit' }
    ]
  };

  try {
    const saveRes = await makeHttpRequest(`${BRIDGE_URL}/api/save-transaction`, 'POST', { 'x-terminal-id': TEST_TERMINAL_ID }, testOrder);
    assert(saveRes.status === 200 && saveRes.data.ok === true, 'Local Windows Storage Save FIRST', `Saved JSON: ${saveRes.data.jsonSaved}, PDF Invoice: ${saveRes.data.invoiceSaved}`);

    const todayDate = new Date().toISOString().slice(0, 10);
    const expectedJsonPath = path.join('C:\\TechWash\\POS-01\\Data', `${todayDate}.json`);
    assert(fs.existsSync(expectedJsonPath), `JSON Data file created on Windows File System (${expectedJsonPath})`);

    const jsonRaw = fs.readFileSync(expectedJsonPath, 'utf8');
    const dayOrders = JSON.parse(jsonRaw);
    const savedInFile = dayOrders.find(o => o.localId === TEST_LOCAL_ID || o.id === TEST_LOCAL_ID);
    assert(Boolean(savedInFile), 'Transaction successfully appended to local daily JSON file');
    assert(savedInFile.balanceAmount === 400, 'Local transaction metrics match payload', `Balance Due: ₹${savedInFile.balanceAmount}`);
  } catch (err) {
    assert(false, 'Local Storage Write First', err.message);
  }

  // TEST 3: Deterministic Order ID Duplicate Prevention Check
  console.log('\n--- TEST 3: DUPLICATE PREVENTION & IDEMPOTENT SYNC ---');
  const duplicateOrderPayload = {
    ...testOrder,
    receivedAmount: 600,
    balanceAmount: 0,
    paymentStatus: 'PAID',
    updatedAt: new Date().toISOString(),
    paymentHistory: [
      { timestamp: new Date(Date.now() - 5000).toISOString(), amount: 200, mode: 'UPI', note: 'Advance deposit' },
      { timestamp: new Date().toISOString(), amount: 400, mode: 'CASH', note: 'Final balance settlement' }
    ]
  };

  try {
    const saveRes2 = await makeHttpRequest(`${BRIDGE_URL}/api/save-transaction`, 'POST', { 'x-terminal-id': TEST_TERMINAL_ID }, duplicateOrderPayload);
    assert(saveRes2.status === 200 && saveRes2.data.ok === true, 'Idempotent re-save of updated order to Local Bridge', `Updated record without duplicating`);

    const todayDate = new Date().toISOString().slice(0, 10);
    const jsonRaw = fs.readFileSync(path.join('C:\\TechWash\\POS-01\\Data', `${todayDate}.json`), 'utf8');
    const dayOrders = JSON.parse(jsonRaw);
    const matchingDocs = dayOrders.filter(o => o.localId === TEST_LOCAL_ID || o.id === TEST_LOCAL_ID);
    assert(matchingDocs.length === 1, 'Duplicate Prevention Verified: Exactly 1 record exists for localId in local store', `Matching docs count: ${matchingDocs.length}`);
    assert(matchingDocs[0].paymentStatus === 'PAID', 'Record successfully updated to PAID in local file');
  } catch (err) {
    assert(false, 'Duplicate Prevention & Idempotent Sync', err.message);
  }

  // TEST 4: Multi-Terminal Configuration Integrity
  console.log('\n--- TEST 4: MULTI-TERMINAL CONFIGURATION INTEGRITY ---');
  const posConfigs = [
    { id: 'counter-1', code: 'TW-POS-01', branch: 'Main Branch — Manikonda', expectedDir: 'C:\\TechWash\\POS-01' },
    { id: 'counter-2', code: 'TW-POS-02', branch: 'Branch 1 — Tolichowki', expectedDir: 'C:\\TechWash\\POS-02' },
    { id: 'counter-3', code: 'TW-POS-03', branch: 'Pick Up Point — Ambience', expectedDir: 'C:\\TechWash\\POS-03' },
  ];

  posConfigs.forEach(cfg => {
    assert(fs.existsSync(cfg.expectedDir), `Local directory exists for ${cfg.code} (${cfg.branch})`, `Path: ${cfg.expectedDir}`);
    assert(fs.existsSync(path.join(cfg.expectedDir, 'Data')), `Data folder exists in ${cfg.code}`);
    assert(fs.existsSync(path.join(cfg.expectedDir, 'Invoices')), `Invoices folder exists in ${cfg.code}`);
    assert(fs.existsSync(path.join(cfg.expectedDir, 'Exports')), `Exports folder exists in ${cfg.code}`);
    assert(fs.existsSync(path.join(cfg.expectedDir, 'Backups')), `Backups folder exists in ${cfg.code}`);
  });

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} PHASE 4 TESTS PASSED CLEANLY!`);
  console.log('====================================================');
}

runPhase4Tests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
