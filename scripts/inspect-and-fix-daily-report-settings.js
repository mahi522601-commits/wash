import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function authenticateAdmin() {
  const email = 'cleanup-admin-runner@techwash.internal';
  const password = 'CleanupSecurePass2026!';
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      return await createUserWithEmailAndPassword(auth, email, password);
    }
    throw err;
  }
}

async function inspectAndFixSettings() {
  console.log('Authenticating Admin...');
  await authenticateAdmin();
  console.log('✅ Admin Authenticated.');

  console.log('Inspecting Firestore doc settings/daily_report...');
  const mainRef = doc(db, 'settings', 'daily_report');
  const snap = await getDoc(mainRef);

  if (snap.exists()) {
    const data = snap.data();
    console.log('Current settings/daily_report:', JSON.stringify(data, null, 2));

    const isOldSixPm = (data.hour === 6 || data.cutoffHour === 6 || data.scheduleTime === '18:00') && !data.userSaved;
    
    if (isOldSixPm || !data.hour || data.hour === 6) {
      console.log('Migrating legacy default 06:00 PM to production default 10:00 PM IST...');
      const migrated = {
        ...data,
        enabled: data.enabled !== false,
        hour: 10,
        minute: 0,
        amPm: 'PM',
        cutoffHour: 10,
        cutoffMinute: 0,
        cutoffAmPm: 'PM',
        scheduleTime: '22:00',
        scheduleTimeFormatted: '10:00 PM',
        timezone: 'Asia/Kolkata',
        emailTo: data.emailTo || data.recipientsTo || ['admin@techwash.in'],
        emailCc: data.emailCc || data.recipientsCc || [],
        migratedAt: new Date().toISOString(),
      };
      await setDoc(mainRef, migrated, { merge: true });
      await setDoc(doc(db, 'settings', 'daily_report_schedule'), migrated, { merge: true });
      console.log('✅ Successfully migrated settings/daily_report to 10:00 PM IST!');
    } else {
      console.log('Settings are already updated or user-configured.');
    }
  } else {
    console.log('settings/daily_report does not exist. Creating production default 10:00 PM IST...');
    const defaultData = {
      enabled: true,
      hour: 10,
      minute: 0,
      amPm: 'PM',
      cutoffHour: 10,
      cutoffMinute: 0,
      cutoffAmPm: 'PM',
      scheduleTime: '22:00',
      scheduleTimeFormatted: '10:00 PM',
      timezone: 'Asia/Kolkata',
      emailTo: ['admin@techwash.in'],
      emailCc: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(mainRef, defaultData);
    await setDoc(doc(db, 'settings', 'daily_report_schedule'), defaultData);
    console.log('✅ Created production default settings/daily_report at 10:00 PM IST.');
  }

  process.exit(0);
}

inspectAndFixSettings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
