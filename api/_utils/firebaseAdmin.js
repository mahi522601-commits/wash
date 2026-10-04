import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'laundry-37abc';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    let privateKey = rawPrivateKey;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim();
    }

    if (clientEmail && privateKey) {
      try {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } catch (err) {
        console.warn('Firebase Admin cert initialization warning, falling back to default app:', err.message);
        initializeApp({ projectId });
      }
    } else {
      // Initialize with default project ID
      initializeApp({ projectId });
    }
  }

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  return { app, db, auth };
}
