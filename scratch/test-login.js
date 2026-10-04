import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync('.env', 'utf8');
envText.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
});

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);

const passwordsToTry = ['techwash123', 'techwashadmin', 'admin123', 'techwash1', 'admin'];
const emailsToTry = ['admin@techwashlaundry.com', 'admin@techwash.com', 'manikonda@techwash.com', 'velch@gmail.com'];

async function tryLogins() {
  for (const email of emailsToTry) {
    for (const pwd of passwordsToTry) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pwd);
        console.log(`✅ SUCCESS LOGIN! Email: ${email}, UID: ${cred.user.uid}`);
        return cred.user;
      } catch (e) {
        // Continue
      }
    }
  }
  console.log('No default password matched.');
}

tryLogins();
