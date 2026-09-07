import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const cleanEnv = (val) => {
  if (typeof val === 'string') {
    return val.trim().replace(/^["']|["']$/g, '');
  }
  return val;
};

export const firebaseConfig = {
  apiKey: cleanEnv(env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(env.VITE_FIREBASE_APP_ID),
  measurementId: cleanEnv(env.VITE_FIREBASE_MEASUREMENT_ID)
};

// Initialize Firebase App singleton
let app;
let auth;
let db;
let analytics = null;
let isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize Analytics in browser if supported
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && isFirebaseConfigured) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics unsupported in current environment
    });
  }
} catch (error) {
  console.warn("Firebase initialization notice:", error?.message || error);
}

export { app, auth, db, analytics, isFirebaseConfigured };
