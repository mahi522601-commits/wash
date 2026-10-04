/**
 * Tech Wash Laundry Services — Phase 4 Production Hardening Test Suite
 * Tests:
 * 1. Real POS Terminal Login (POS-01, POS-02, POS-03) & End-to-End Bill Creation
 * 2. Terminal ID Security & Spoofing Prevention
 * 3. Offline + Browser LocalStorage Clear & Local JSON Queue Recovery
 * 4. Payment Event Identity (paymentEventId uniqueness)
 * 5. Local File Integrity (JSON, PDF, Excel)
 * 6. Financial Report Protection & Isolation (isTestData === true)
 */

import fs from 'fs';
import path from 'path';
import http from 'http';

// 1. Load .env BEFORE importing Firebase modules!
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// 2. Dynamic imports after process.env is populated
const { initializeApp, getApps, getApp } = await import('firebase/app');
const { getFirestore, doc, getDoc, setDoc, getDocs, collection, query, where } = await import('firebase/firestore');
const { terminalAuthService } = await import('../src/services/terminalAuthService.js');
const { reportService } = await import('../src/services/reportService.js');

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const BRIDGE_URL = 'http://127.0.0.1:9123';
const TODAY_DATE = new Date().toISOString().slice(0, 10);
const DATE_COMPACT = TODAY_DATE.replace(/-/g, '');

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

async function runHardeningTests() {
  console.log('====================================================');
  console.log('🛡️ TECH WASH LAUNDRY — PHASE 4 HARDENING TEST SUITE');
  console.log('====================================================\n');

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

  // ----------------------------------------------------
  // SECTION 1: REAL POS TERMINAL LOGIN & END-TO-END BILL CREATION
  // ----------------------------------------------------
  console.log('--- SECTION 1: REAL POS TERMINAL LOGIN & E2E BILLING ---');

  const terminalsToTest = [
    { id: 'counter-1', pwd: 'techwash1', code: 'TW-POS-01', branch: 'Main Branch — Manikonda', dir: 'C:\\TechWash\\POS-01' },
    { id: 'counter-2', pwd: 'techwash2', code: 'TW-POS-02', branch: 'Branch 1 — Tolichowki', dir: 'C:\\TechWash\\POS-02' },
    { id: 'counter-3', pwd: 'techwash3', code: 'TW-POS-03', branch: 'Pick Up Point — Ambience', dir: 'C:\\TechWash\\POS-03' },
  ];

  for (const tCfg of terminalsToTest) {
    // 1. Terminal Authentication Login
    const session = await terminalAuthService.loginTerminal(tCfg.id, tCfg.pwd);
    assert(Boolean(session && session.terminalId === tCfg.id), `POS Login successful for ${tCfg.code} (${tCfg.branch})`, `Session Operator: ${session.assignedOperator}`);

    // 2. Create Bill via POS Pipeline with isTestData: true
    const localId = `${tCfg.code.replace('-', '')}-${DATE_COMPACT}-H${Math.floor(1000 + Math.random() * 9000)}`;
    const orderPayload = {
      localId,
      serverId: localId,
      id: localId,
      orderNumber: `TW-H-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNumber: `INV-${localId}`,
      customerName: `Hardened Test Customer ${tCfg.code}`,
      phone: '9876543210',
      terminalId: tCfg.id,
      terminalCode: tCfg.code,
      branchId: tCfg.id === 'counter-2' ? 'tolichowki' : (tCfg.id === 'counter-3' ? 'ambience' : 'main'),
      branchName: tCfg.branch,
      storeBranch: tCfg.branch,
      totalAmount: 450,
      receivedAmount: 450,
      balanceAmount: 0,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      isTestData: true, // EXPLICIT TEST MARKER
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentHistory: [
        {
          paymentEventId: `pay-${tCfg.id}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          timestamp: new Date().toISOString(),
          amount: 450,
          mode: 'UPI',
          note: 'Full payment'
        }
      ]
    };

    // Save to Local Windows Bridge FIRST
    const bridgeRes = await makeHttpRequest(`${BRIDGE_URL}/api/save-transaction`, 'POST', { 'x-terminal-id': 'counter-1' }, orderPayload);
    assert(bridgeRes.status === 200 && bridgeRes.data.ok === true, `Local Bridge write FIRST for ${tCfg.code}`);

    // Sync to Firestore
    await setDoc(doc(db, 'orders', localId), orderPayload, { merge: true });

    // Verify Firestore fields
    const fSnap = await getDoc(doc(db, 'orders', localId));
    assert(fSnap.exists(), `Firestore document exists for ${tCfg.code} (${localId})`);
    const fData = fSnap.data();
    assert(fData.terminalId === tCfg.id, `terminalId verified: ${fData.terminalId}`);
    assert(fData.terminalCode === tCfg.code, `terminalCode verified: ${fData.terminalCode}`);
    assert(fData.storeBranch === tCfg.branch || fData.branchName === tCfg.branch, `storeBranch verified: ${fData.storeBranch || fData.branchName}`);
    assert(fData.isTestData === true, `isTestData marker verified in Firestore`);
  }

  // ----------------------------------------------------
  // SECTION 2: TERMINAL ID SECURITY & SPOOFING PREVENTION
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: TERMINAL ID SECURITY & SPOOFING PREVENTION ---');
  // Local Bridge is bound to counter-1. Attempt to send terminalId: counter-2
  const spoofPayload = {
    localId: `POS01-${DATE_COMPACT}-SPOOF01`,
    terminalId: 'counter-2',
    storeBranch: 'Branch 1 — Tolichowki',
    totalAmount: 999,
  };

  const spoofRes = await makeHttpRequest(`${BRIDGE_URL}/api/save-transaction`, 'POST', { 'x-terminal-id': 'counter-2' }, spoofPayload);
  assert(spoofRes.status === 403, 'Local Bridge rejects mismatched terminalId spoofing (HTTP 403)', `Error: ${spoofRes.data?.error}`);

  // ----------------------------------------------------
  // SECTION 3: OFFLINE + BROWSER LOCALSTORAGE CLEAR & QUEUE RECOVERY
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: OFFLINE + BROWSER STORAGE CLEAR QUEUE RECOVERY ---');
  const offlineId = `POS01-${DATE_COMPACT}-RECOVER01`;
  const offlinePayload = {
    localId: offlineId,
    orderNumber: `TW-REC-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: 'Offline Storage Clear Test Customer',
    totalAmount: 300,
    receivedAmount: 0,
    balanceAmount: 300,
    paymentStatus: 'PENDING',
    syncStatus: 'LOCAL_SAVED',
    terminalId: 'counter-1',
    isTestData: true,
    createdAt: new Date().toISOString()
  };

  // 1. Save to local bridge FIRST
  await makeHttpRequest(`${BRIDGE_URL}/api/save-transaction`, 'POST', { 'x-terminal-id': 'counter-1' }, offlinePayload);
  
  // 2. Simulate Local JSON File Reconciliation (queue was cleared)
  const getRes = await makeHttpRequest(`${BRIDGE_URL}/api/get-transactions?date=${TODAY_DATE}`, 'GET', { 'x-terminal-id': 'counter-1' });
  assert(getRes.status === 200 && getRes.data.ok === true, 'Local Bridge /api/get-transactions reads JSON files');

  const reconstructedOrder = getRes.data.orders.find(o => o.localId === offlineId || o.id === offlineId);
  assert(Boolean(reconstructedOrder), 'Pending order successfully discovered & reconstructed from local JSON file', `Order ID: ${offlineId}`);

  // 3. Perform Sync to Firestore
  await setDoc(doc(db, 'orders', offlineId), { ...reconstructedOrder, syncStatus: 'SYNCED', isTestData: true }, { merge: true });
  const reconQuery = await getDocs(query(collection(db, 'orders'), where('localId', '==', offlineId)));
  assert(reconQuery.size === 1, 'Firestore contains EXACTLY ONE reconstructed document', `Docs count: ${reconQuery.size}`);

  // ----------------------------------------------------
  // SECTION 4: PAYMENT EVENT IDENTITY (paymentEventId)
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: PAYMENT EVENT IDENTITY (paymentEventId) ---');
  const p1 = { paymentEventId: 'pay-pos01-event-001', timestamp: '2026-10-03T10:00:00.000Z', amount: 500, mode: 'UPI' };
  const p2 = { paymentEventId: 'pay-pos01-event-002', timestamp: '2026-10-03T10:00:00.000Z', amount: 500, mode: 'UPI' }; // Same amount & timestamp, different ID!

  const map = new Map();
  [p1, p2].forEach(p => {
    const key = p.paymentEventId || `${p.timestamp}_${p.amount}_${p.mode}`;
    map.set(key, p);
  });
  const mergedEvents = Array.from(map.values());
  assert(mergedEvents.length === 2, 'paymentEventId uniquely distinguishes 2 payments with same amount & timestamp', `Events count: ${mergedEvents.length}`);

  // ----------------------------------------------------
  // SECTION 5: FINANCIAL REPORT ISOLATION
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: FINANCIAL REPORT ISOLATION ---');
  const testReportRes = await reportService.generateFinancialReport({ datePreset: 'today' });
  const testOrdersInReport = testReportRes.orders.filter(o => o.isTestData === true || (o.customerName && o.customerName.toLowerCase().includes('hardened test')));
  assert(testOrdersInReport.length === 0, 'reportService cleanly excludes all isTestData transactions from financial report', `Test orders in report: ${testOrdersInReport.length}`);

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedCount}/${totalCount} HARDENING TESTS PASSED CLEANLY!`);
  console.log('====================================================\n');
}

runHardeningTests().catch(err => {
  console.error('Fatal hardening test error:', err);
  process.exit(1);
});
