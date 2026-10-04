import fs from 'fs';

let admin = null;
try {
  const { getFirebaseAdmin } = await import('../api/_utils/firebaseAdmin.js');
  const { db } = getFirebaseAdmin();
  console.log('Firebase Admin SDK initialized successfully!');
  const snap = await db.collection('orders').limit(1).get();
  console.log('Firebase Admin orders read count:', snap.size);
} catch (e) {
  console.log('Firebase Admin SDK notice:', e.message);
}
