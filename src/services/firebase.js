import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevEnvironment",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "laundry-37abc.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "laundry-37abc",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "laundry-37abc.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "103984029384",
  appId: env.VITE_FIREBASE_APP_ID || "1:103984029384:web:7f8e9a0b1c2d3e4f5a6b7c",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO123456"
};

// Initialize Firebase safely
let app;
let auth;
let db;
let analytics = null;
let isFirebaseConfigured = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);

  // Safely check if real API key is configured
  isFirebaseConfigured = !!(import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Example'));

  // Analytics initialization
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && isFirebaseConfigured) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics not supported in this environment
    });
  }
} catch (error) {
  console.warn("Firebase initialization notice:", error.message);
}

export { app, auth, db, analytics, isFirebaseConfigured };
