import fs from 'node:fs';
import path from 'node:path';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('  TECH WASH LOCAL WINDOWS BRIDGE — PHASE 3 TEST SUITE');
  console.log('====================================================\n');

  const BRIDGE_URL = 'http://127.0.0.1:9123';
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, details = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`✅ TEST ${totalCount}: ${testName} — PASSED ${details ? `(${details})` : ''}`);
    } else {
      console.error(`❌ TEST ${totalCount}: ${testName} — FAILED ${details ? `(${details})` : ''}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Health Endpoint Check
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BRIDGE_URL}/api/health`);
    const data = await res.json();
    assert(res.ok && data.ok === true && data.terminalId === 'counter-1', 'Health Endpoint GET /api/health', `Terminal: ${data.terminalId}, Code: ${data.terminalCode}`);
  } catch (err) {
    assert(false, 'Health Endpoint GET /api/health', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Folder Creation Check
  // ----------------------------------------------------
  const storageRoot = 'C:\\TechWash\\POS-01';
  const dataDir = path.join(storageRoot, 'Data');
  const invoicesDir = path.join(storageRoot, 'Invoices');
  const exportsDir = path.join(storageRoot, 'Exports');
  const backupsDir = path.join(storageRoot, 'Backups');

  const foldersExist = fs.existsSync(storageRoot) &&
                       fs.existsSync(dataDir) &&
                       fs.existsSync(invoicesDir) &&
                       fs.existsSync(exportsDir) &&
                       fs.existsSync(backupsDir);

  assert(foldersExist, 'Folder Structure Creation (C:\\TechWash\\POS-01\\)', `Root: ${storageRoot}`);

  // ----------------------------------------------------
  // TEST 3: Save Valid Transaction #1 (JSON, PDF, Excel)
  // ----------------------------------------------------
  const todayStr = new Date().toISOString().split('T')[0];
  const testOrder1 = {
    localId: 'POS01-TEST-000001',
    id: 'POS01-TEST-000001',
    orderNumber: 'TW-TEST01',
    invoiceNumber: 'INV-POS01-TEST01',
    branchId: 'main',
    storeBranch: 'Main Branch — Manikonda',
    terminalId: 'counter-1',
    terminalCode: 'TW-POS-01',
    cashierName: 'Cashier Rahul',
    createdAt: new Date().toISOString(),
    customerName: 'Anil Kumar',
    phone: '9876543210',
    address: 'Flat 101, Manikonda Main Rd, Hyderabad',
    serviceName: 'Wash & Steam Iron',
    actualWeightKg: 4.2,
    items: [
      { name: 'Shirts', quantity: 5, unitPrice: 40, lineTotal: 200 },
      { name: 'Trousers', quantity: 3, unitPrice: 50, lineTotal: 150 }
    ],
    totalAmount: 350,
    receivedAmount: 350,
    balanceAmount: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    syncStatus: 'LOCAL_SAVED'
  };

  try {
    const res = await fetch(`${BRIDGE_URL}/api/save-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-terminal-id': 'counter-1' },
      body: JSON.stringify(testOrder1)
    });
    const data = await res.json();
    
    const jsonPath = path.join(dataDir, `${todayStr}.json`);
    const pdfPath = data.paths?.pdf;
    const excelPath = path.join(exportsDir, `${todayStr}.xlsx`);

    const jsonFileExists = fs.existsSync(jsonPath);
    const pdfFileExists = pdfPath && fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 0;
    const excelFileExists = fs.existsSync(excelPath) && fs.statSync(excelPath).size > 0;

    assert(res.ok && data.ok === true && jsonFileExists && pdfFileExists && excelFileExists, 
      'Save Transaction #1 (JSON, PDF, Excel created)', 
      `PDF: ${pdfPath ? path.basename(pdfPath) : 'N/A'}, Excel Size: ${excelFileExists ? fs.statSync(excelPath).size : 0} bytes`
    );
  } catch (err) {
    assert(false, 'Save Transaction #1', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Save Transaction #2 / Duplicate Update
  // ----------------------------------------------------
  const testOrder1Updated = {
    ...testOrder1,
    paymentStatus: 'PAID',
    receivedAmount: 350,
    balanceAmount: 0,
    notes: 'Updated note via second save request'
  };

  try {
    const res = await fetch(`${BRIDGE_URL}/api/save-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-terminal-id': 'counter-1' },
      body: JSON.stringify(testOrder1Updated)
    });
    const data = await res.json();
    
    const jsonPath = path.join(dataDir, `${todayStr}.json`);
    const dayOrders = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const matched = dayOrders.find(o => o.localId === 'POS01-TEST-000001');

    assert(res.ok && matched && matched.notes === 'Updated note via second save request', 
      'Duplicate Transaction Save / Update Check', 
      `Order updated cleanly without corrupting array (${dayOrders.length} item(s))`
    );
  } catch (err) {
    assert(false, 'Duplicate Transaction Save', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Terminal Mismatch Rejection (HTTP 403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BRIDGE_URL}/api/save-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-terminal-id': 'counter-2' }, // Wrong terminal!
      body: JSON.stringify({ ...testOrder1, localId: 'POS02-WRONG-001', terminalId: 'counter-2' })
    });
    const data = await res.json();

    assert(res.status === 403 && data.ok === false, 
      'Terminal Mismatch Rejection (HTTP 403)', 
      `Response: ${data.error}`
    );
  } catch (err) {
    assert(false, 'Terminal Mismatch Rejection', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Path Traversal Attack Rejection (HTTP 400)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BRIDGE_URL}/api/save-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-terminal-id': 'counter-1' },
      body: JSON.stringify({ ...testOrder1, localId: '../../etc/passwd' }) // Malicious traversal!
    });
    const data = await res.json();

    assert(res.status === 400 && data.ok === false, 
      'Path Traversal Security Protection (HTTP 400)', 
      `Response: ${data.error}`
    );
  } catch (err) {
    assert(false, 'Path Traversal Security Protection', err.message);
  }

  console.log('\n====================================================');
  console.log(`  PHASE 3 TEST SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('====================================================');

  if (passedCount === totalCount) {
    console.log('🎉 ALL PHASE 3 TESTS PASSED 100% PERFECTLY!');
  } else {
    console.error('❌ SOME TESTS FAILED. PLEASE REVIEW.');
  }
}

runPhase3Tests();
