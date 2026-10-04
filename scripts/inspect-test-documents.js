/**
 * Script to inspect and identify all test transactions created in Firestore laundry-37abc
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

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc',
};

let app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function inspectTestDocuments() {
  console.log('====================================================');
  console.log('🔍 FIRESTORE TEST DOCUMENT INSPECTION (laundry-37abc)');
  console.log('====================================================\n');

  const collectionsToInspect = ['orders', 'bookings'];
  const testArtifacts = [];

  for (const colName of collectionsToInspect) {
    const snap = await getDocs(collection(db, colName));
    snap.docs.forEach(docSnap => {
      const d = docSnap.data();
      const id = docSnap.id;
      const cName = d.customerName || d.customer?.name || '';
      const notes = d.notes || d.adminNotes || '';
      const phone = d.phone || d.customer?.phone || '';

      const isTestDoc = 
        id.includes('-T1') || id.includes('-T2') || id.includes('-T3') ||
        id.includes('-T4') || id.includes('-T5') || id.includes('-T6') ||
        id.includes('-T7') || id.includes('-T8') || id.includes('-T9') ||
        id.includes('-T12') || id.includes('TEST') || id.includes('Test') ||
        cName.toLowerCase().includes('test') ||
        cName.toLowerCase().includes('phase 4') ||
        notes.toLowerCase().includes('test') ||
        phone === '9876543210' || phone === '9876543211' ||
        d.isTestData === true;

      if (isTestDoc) {
        testArtifacts.push({
          collection: colName,
          docId: id,
          orderNumber: d.orderNumber || 'N/A',
          customerName: cName || 'N/A',
          amount: d.totalAmount || d.finalPrice || 0,
          branch: d.storeBranch || d.branchName || 'N/A',
          terminalId: d.terminalId || 'N/A',
          reason: cName.toLowerCase().includes('test') ? `Test customer name: "${cName}"` : `Test ID pattern / marker (${id})`,
        });
      }
    });
  }

  console.log(`Found ${testArtifacts.length} test documents in Firestore:\n`);
  console.table(testArtifacts);

  // Save report to scratch JSON
  const reportPath = path.join(process.cwd(), 'scratch', 'test-documents-cleanup-report.json');
  fs.mkdirSync(path.join(process.cwd(), 'scratch'), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(testArtifacts, null, 2), 'utf8');

  console.log(`\nCleanup report saved to: ${reportPath}`);
}

inspectTestDocuments().catch(err => {
  console.error('Error inspecting test documents:', err);
  process.exit(1);
});
