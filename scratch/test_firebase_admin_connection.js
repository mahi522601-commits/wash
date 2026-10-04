import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  type: "service_account",
  project_id: "laundry-37abc",
  private_key_id: "35a321030eda8388962fc2091c3927ee191400b7",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMJooeKgctI7zW\nFDHSVQ+JcQqn1bN/JDaSprzbyR4bKYbr9NwJt9xBj+sbPiup8fYmRPSy6iQYg+ZX\n75p7zdIq3SUcvhh3N2nV5jwpm4Smo7IecmHSomnYJxHKUPzoOV/exmQMll/hPfIK\n15uz/lud6CCDEHPEFn9uKT0biDXqg1T3TBUIvGTiTX4w8QhnfUmOr5FtByMfbFV/\nP8cudHuBsyRJMzWwzXCb3xo/f3Pm85cVYqoUzjnV7qPHMLnhk4p8pJshATaG/W9E\n/OHYCYx4AImY2gF3d90hwOaGmN+hbTwYlQUbR52f4mZylnNmM9+lqR3w02ygXnWU\nkrfJJADXAgMBAAECggEAD5ugsqau7sYNMWbQ2k5ThkQEtwkxFHbdzz99L+aD7Tqz\nDIYnbnzGk6KfrHEH4JHVql5aQPWCtfcbnLx+WJnHSCypIjXsY+zyI/7auamgribU\nvtwq23I8WmC+TPP9Kfn8+Oi9DHNQuEVGpIqQZmX7diqhlbOjzimUK4VunRTAXoHx\n69Jw31olujrPvIQksmy8rBeCLr+kV6S/LdSqPhwSSacJGyLv22Lt+L53IgH6vgP0\n07fOHuDlvA9P4V+JpO8PJGGZdRP0Pg6eg3Or2fpwQhXJDoavzhnmBkZF3y1ON0ew\n4lD72ctzYKvHwlGZP5Q7oBJFtB03C8CFHKYIga/N+QKBgQD0XScQYxWVarE5AXAh\ncJg1LL9mYHcxhUCsgaVIqsg7qz2uR4jZD21/Jz2AKEndiOw79A8/VMxGVJIySQZG\ndW3FUW4u0LsRK63L6roun0pXPmLLJIIOqUEw6+mbokTGlLQj09kxpKayAyXIE98P\nd3hMuiOwTd1forTuyMKgmpR3PwKBgQDV3y2KaxktaE5hk4yXb2Z+E5qS6Eugz2EJ\nF5EJzfic1y7jg9JrOfLRALsNaISDSNCrVjnAS54VsEMHG71rC3G3Mq9xxXw2EDzI\nAgof/YqLd+VeYl884A9gQI4lV2FWGeJYAZrJOwoCXiproT8QSOMBzRnJlWz8g+Ef\nUyZnXFLoaQKBgQDG8gAXy1OLLi3S52TPFMgWorPBOdBQtNgOmg5itwgF7EhvVzYG\n4hSXbO8ZI7PfdNY/iVfQi80zhS7xWZqOSpRwDPfTjYR/WjxIxHWH94+ir9vm33Yz\nUYENv0OVveqYcgCnGpa9X/uG+iEMX4E/Klj6vqDHrN0KO4Fq1m/+KVuuKQKBgBEu\ngckZ+4bTV2CtauELmQ9N4eAle1Xq8x+43fUMsAlhnCm5AGGO4Tv7NAvKtsKZSfJJ\n1g/lw0h4xZm/l8MOw071anTYabcqLMfgqhGR29yCgFHJ017fnTydUw4a6/3vzGhH\nkLjT3mT8Taoh5SAYyuvtH0I7l+rdaWuL0Y0CNMLpAoGBAN1eQJU7qcaeU4pkJTA4\nXlKKCdzZmZtVhcSuw8X2ISUeXoUO6k6Okm/1aRs7iozPWdA6rt5ZeraH2iq0Nz7A\nqdk9gIxxiA2CZoRK+808hxB+OMz1pNCP1HFoFZdAjH0m9ndDhaehHSHrsfuZfgBK\n0SlyMbTsNAbBX3iJpRgJKvZ1\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@laundry-37abc.iam.gserviceaccount.com",
};

async function runVerification() {
  console.log("=== STARTING FIREBASE ADMIN VERIFICATION TEST ===");

  // TEST 1: Firebase Admin Initialization
  console.log("\n[1/5] Initializing Firebase Admin SDK...");
  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "laundry-37abc.firebasestorage.app",
  });
  console.log("  ✓ Firebase Admin Initialized with Project ID:", serviceAccount.project_id);

  const db = getFirestore(app);
  const storage = getStorage(app);

  // TEST 2: Firestore Read
  console.log("\n[2/5] Testing Firestore Read from 'orders' collection...");
  const ordersSnap = await db.collection('orders').limit(5).get();
  console.log(`  ✓ Firestore Read Successful! Retreived ${ordersSnap.docs.length} orders.`);

  // TEST 3: Firestore Write
  console.log("\n[3/5] Testing Firestore Write to 'dailyReportLogs' collection...");
  const testDocRef = db.collection('dailyReportLogs').doc('verification-test-log');
  await testDocRef.set({
    testDate: new Date().toISOString(),
    status: 'VERIFICATION_SUCCESSFUL',
    environment: 'Vercel Serverless Function Environment',
  }, { merge: true });
  console.log("  ✓ Firestore Write Successful! Document 'dailyReportLogs/verification-test-log' written.");

  // TEST 4 & 5: Try Storage Buckets
  const candidateBucketNames = [
    "laundry-37abc.firebasestorage.app",
    "laundry-37abc.appspot.com",
    "laundry-37abc",
  ];

  let workingBucketName = null;
  let signedUrlResult = null;

  console.log("\n[4/5] Testing Firebase Storage Upload candidates...");
  for (const bucketName of candidateBucketNames) {
    try {
      console.log(`  Testing bucket name: '${bucketName}'...`);
      const bucket = storage.bucket(bucketName);
      const testFile = bucket.file('reports/daily/verification-test.pdf');
      const dummyBuffer = Buffer.from('%PDF-1.4 %Verification test pdf content');

      await testFile.save(dummyBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: { verification: 'true' }
        }
      });

      console.log(`  ✓ Storage Upload Successful using bucket: '${bucketName}'!`);

      // TEST 5: Signed URL
      console.log(`\n[5/5] Testing Private Signed URL generation for '${bucketName}'...`);
      const [signedUrl] = await testFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });

      workingBucketName = bucketName;
      signedUrlResult = signedUrl;
      console.log("  ✓ Private Signed Download URL Generated Successfully!");
      break;
    } catch (bucketErr) {
      console.warn(`  ⚠️ Bucket '${bucketName}' notice:`, bucketErr.message || bucketErr);
    }
  }

  if (!workingBucketName) {
    throw new Error("Firebase Storage bucket requires activation in Firebase Console for project 'laundry-37abc'. (Firestore Read & Write passed 100%).");
  }

  console.log("\n=== ALL 5 FIREBASE ADMIN VERIFICATION TESTS PASSED SUCCESSFULLY ===");
  console.log("  Verified Project ID:", serviceAccount.project_id);
  console.log("  Verified Storage Bucket:", workingBucketName);
  console.log("  Verified Signed URL Generated: TRUE");
}

runVerification().catch(err => {
  console.error("\n❌ VERIFICATION STOPPED:", err.message);
  process.exit(1);
});
