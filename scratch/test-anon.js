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
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

async function testAuth() {
  try {
    const cred = await signInAnonymously(auth);
    console.log('Anon Auth User UID:', cred.user.uid);
    const docId = 'anon-test-' + Date.now();
    const testRef = doc(db, 'orders', docId);
    await setDoc(testRef, { test: true, localId: docId });
    console.log('✅ Created doc successfully');
    await setDoc(testRef, { test: true, updated: true }, { merge: true });
    console.log('✅ Updated doc successfully');
    const snap = await getDoc(testRef);
    console.log('Doc contents:', snap.data());
  } catch (e) {
    console.error('Anon auth / write error:', e.message);
  }
}

testAuth();
