import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getFirebaseAdmin() {
  let app;
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    let privateKey = rawPrivateKey;
    if (privateKey) {
      try {
        privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim();
      } catch (e) {
        // Fallback to raw string
      }
    }

    if (clientEmail && privateKey) {
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } catch (err) {
        console.warn('Firebase Admin cert initialization failed, falling back to default:', err.message);
        try {
          app = initializeApp({ projectId });
        } catch (e) {
          app = getApps()[0] || getApp();
        }
      }
    } else {
      try {
        app = initializeApp({ projectId });
      } catch (e) {
        app = getApps()[0] || getApp();
      }
    }
  } else {
    app = getApps()[0] || getApp();
  }

  const db = getFirestore(app);
  const auth = getAuth(app);

  return { app, db, auth };
}

