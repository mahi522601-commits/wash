import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

let app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'orders'));
  const list = [];
  snap.forEach(docSnap => {
    const d = docSnap.data();
    list.push({
      id: docSnap.id,
      orderNumber: d.orderNumber || d.id,
      createdAt: d.createdAt,
      orderDate: d.orderDate,
      customerName: d.customerName || d.customer?.name,
      totalAmount: d.totalAmount || d.pricing?.total,
    });
  });

  console.log(`Total orders in Firestore: ${list.length}`);
  console.log(JSON.stringify(list, null, 2));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
