import fs from 'fs';
import path from 'path';

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

async function inspectRemaining() {
  const ordersSnap = await getDocs(collection(db, 'orders'));
  const remaining = [];

  ordersSnap.docs.forEach(docSnap => {
    const id = docSnap.id;
    const d = docSnap.data();
    const cName = (d.customerName || d.customer?.name || '').toLowerCase();
    const isTest = id.includes('-T1') || id.includes('-T2') || id.includes('-T3') || id.includes('-T4') || id.includes('-T5') || id.includes('-T6') || id.includes('-T7') || id.includes('-T8') || id.includes('-T9') || id.includes('-T12') || id.includes('TEST') || cName.includes('test') || d.isTestData === true;

    if (isTest) {
      remaining.push({ id, customerName: d.customerName, orderNumber: d.orderNumber, isTestData: d.isTestData });
    }
  });

  console.log(`Remaining test orders (${remaining.length}):`);
  console.table(remaining);
}

inspectRemaining();
