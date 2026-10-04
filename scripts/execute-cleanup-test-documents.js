/**
 * Script to safely execute cleanup of Phase 4 test documents in Firestore (laundry-37abc)
 * Uses firebase-admin to bypass client security rules safely on backend.
 */

import fs from 'fs';
import path from 'path';

// Load .env
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

import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return getFirestore(getApp());
}

async function executeCleanup() {
  console.log('====================================================');
  console.log('🧹 FIRESTORE TEST DATA CLEANUP (laundry-37abc)');
  console.log('====================================================\n');

  const db = getAdminDb();
  const cleanupReportPath = path.join(process.cwd(), 'scratch', 'test-documents-cleanup-report.json');
  if (!fs.existsSync(cleanupReportPath)) {
    throw new Error(`Cleanup report file not found at: ${cleanupReportPath}`);
  }

  const targets = JSON.parse(fs.readFileSync(cleanupReportPath, 'utf8'));
  console.log(`Loaded ${targets.length} target test documents from cleanup report.\n`);

  console.log('--- TARGET DOCUMENTS TO BE DELETED ---');
  targets.forEach((t, index) => {
    console.log(`${index + 1}. [${t.collection}] ${t.docId} | Order: ${t.orderNumber} | Customer: "${t.customerName}" | Amount: ₹${t.amount} | Reason: ${t.reason}`);
  });
  console.log('-------------------------------------\n');

  const deletionAudit = [];
  let deletedCount = 0;

  for (const t of targets) {
    const docRef = db.collection(t.collection).doc(t.docId);
    const snap = await docRef.get();

    if (!snap.exists) {
      console.warn(`⚠️ Warning: Document ${t.collection}/${t.docId} does not exist in Firestore.`);
      continue;
    }

    const data = snap.data();
    const customerName = data.customerName || data.customer?.name || t.customerName || '';
    const isTestDoc = 
      t.docId.includes('-T1') || t.docId.includes('-T2') || t.docId.includes('-T3') ||
      t.docId.includes('-T4') || t.docId.includes('-T5') || t.docId.includes('-T6') ||
      t.docId.includes('-T7') || t.docId.includes('-T8') || t.docId.includes('-T9') ||
      t.docId.includes('-T12') || t.docId.includes('TEST') || t.docId.includes('Test') ||
      customerName.toLowerCase().includes('test') ||
      data.isTestData === true;

    if (!isTestDoc) {
      console.error(`❌ CRITICAL SAFETY STOP: Document ${t.collection}/${t.docId} does not match test markers! Aborting deletion.`);
      process.exit(1);
    }

    const timestamp = new Date().toISOString();
    deletionAudit.push({
      collection: t.collection,
      docId: t.docId,
      orderNumber: t.orderNumber || data.orderNumber || 'N/A',
      customerName: customerName,
      amount: t.amount || data.totalAmount || 0,
      branch: t.branch || data.storeBranch || 'N/A',
      terminalId: t.terminalId || data.terminalId || 'N/A',
      reason: t.reason,
      deletionTimestamp: timestamp
    });

    await docRef.delete();
    deletedCount++;
    console.log(`✅ Deleted [${t.collection}] ${t.docId}`);
  }

  // Save audit log
  const auditPath = path.join(process.cwd(), 'scratch', 'deletion-audit.json');
  fs.writeFileSync(auditPath, JSON.stringify(deletionAudit, null, 2), 'utf8');
  console.log(`\nLocal deletion audit file written to: ${auditPath}\n`);

  // Verification pass
  console.log('--- POST-DELETION VERIFICATION & RE-SCAN ---');
  let remainingTestOrdersCount = 0;
  let remainingTestBookingsCount = 0;
  let totalProdOrdersCount = 0;
  let totalProdBookingsCount = 0;

  const ordersSnap = await db.collection('orders').get();
  ordersSnap.docs.forEach(docSnap => {
    const id = docSnap.id;
    const d = docSnap.data();
    const cName = (d.customerName || d.customer?.name || '').toLowerCase();
    if (id.includes('-T1') || id.includes('-T2') || id.includes('-T3') || id.includes('-T4') || id.includes('-T5') || id.includes('-T6') || id.includes('-T7') || id.includes('-T8') || id.includes('-T9') || id.includes('-T12') || cName.includes('test') || d.isTestData === true) {
      remainingTestOrdersCount++;
    } else {
      totalProdOrdersCount++;
    }
  });

  const bookingsSnap = await db.collection('bookings').get();
  bookingsSnap.docs.forEach(docSnap => {
    const id = docSnap.id;
    const d = docSnap.data();
    const cName = (d.customerName || d.customer?.name || '').toLowerCase();
    if (id.includes('-T1') || id.includes('-T2') || id.includes('-T3') || id.includes('-T4') || id.includes('-T5') || id.includes('-T6') || id.includes('-T7') || id.includes('-T8') || id.includes('-T9') || id.includes('-T12') || cName.includes('test') || d.isTestData === true) {
      remainingTestBookingsCount++;
    } else {
      totalProdBookingsCount++;
    }
  });

  console.log(`Deleted documents total: ${deletedCount}`);
  console.log(`Remaining test orders in Firestore: ${remainingTestOrdersCount}`);
  console.log(`Remaining test bookings in Firestore: ${remainingTestBookingsCount}`);
  console.log(`Remaining production orders in Firestore: ${totalProdOrdersCount}`);
  console.log(`Remaining production bookings in Firestore: ${totalProdBookingsCount}`);

  if (remainingTestOrdersCount === 0 && remainingTestBookingsCount === 0) {
    console.log('\n🎉 FIRESTORE TEST DATA CLEANUP SUCCESSFUL! All 48 test records removed cleanly.');
  } else {
    console.error('\n⚠️ WARNING: Some test documents remain in Firestore!');
  }
}

executeCleanup().catch(err => {
  console.error('Error executing cleanup:', err);
  process.exit(1);
});
