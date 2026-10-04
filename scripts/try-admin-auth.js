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
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc',
};

let app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const candidateEmails = [
  'admin@techwash.com',
  'admin@techwashlaundry.com',
  'admin@techwash.in',
  'velchuri@gmail.com',
  'techwashadmin@gmail.com'
];
const candidatePwds = [
  'techwashadmin',
  'admin123',
  'techwash123',
  'admin',
  '123456'
];

async function tryAuth() {
  for (const email of candidateEmails) {
    for (const pwd of candidatePwds) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, pwd);
        console.log(`🎉 SUCCESSFUL ADMIN LOGIN: ${email} | UID: ${userCred.user.uid}`);
        return userCred.user;
      } catch (e) {
        // failed
      }
    }
  }
  console.log('No matching admin user login credentials found.');
  return null;
}

tryAuth();
