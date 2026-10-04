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

async function checkAdmins() {
  console.log('=== CHECKING ADMINS IN FIRESTORE ===');
  try {
    const adminSnap = await getDocs(collection(db, 'admins'));
    console.log(`Found ${adminSnap.size} admins in 'admins' collection:`);
    adminSnap.docs.forEach(d => console.log(d.id, d.data()));
  } catch (e) {
    console.log('Error fetching admins:', e.message);
  }

  try {
    const userSnap = await getDocs(collection(db, 'users'));
    console.log(`Found ${userSnap.size} users in 'users' collection:`);
    userSnap.docs.forEach(d => console.log(d.id, d.data()));
  } catch (e) {
    console.log('Error fetching users:', e.message);
  }
}

checkAdmins();
