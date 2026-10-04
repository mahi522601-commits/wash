import { generateDailyReportPDF } from '../api/_utils/pdfGenerator.js';
import { getFirebaseAdmin } from '../api/_utils/firebaseAdmin.js';
import { put } from '@vercel/blob';

async function testVercelBlobAndPdf() {
  console.log('--- STARTING VERCEL BLOB & PDF TEST ---');
  
  // 1. Test Firebase Admin (Auth & Firestore ONLY, NO Firebase Storage)
  try {
    const admin = getFirebaseAdmin();
    console.log('✅ Firebase Admin initialized successfully (Auth & Firestore ready, Storage removed).');
    
    // Test Firestore Read
    const ordersSnap = await admin.db.collection('orders').limit(1).get();
    console.log(`✅ Firestore Read Test Passed! Found ${ordersSnap.size} order document(s).`);
  } catch (err) {
    console.error('❌ Firebase Admin / Firestore Test Failed:', err.message);
  }

  // 2. Test PDF Generation
  let pdfBuffer;
  try {
    const mockReportData = {
      dateStr: '2026-10-02',
      dateFormatted: '02/10/2026',
      generatedAtFormatted: '06:45 PM',
      metrics: {
        totalOrdersCount: 12,
        totalGrossBilled: 4500,
        totalPiecesCount: 35,
        totalWeightKg: 14.5,
        category1: {
          cashReceived: 2000,
          upiReceived: 1500,
          cardReceived: 500,
          onlineReceived: 500,
          totalInflowCollections: 4500,
        },
        category2: {
          totalInitialDuesCreated: 0,
          totalRecoveredDues: 250,
          totalNetPendingDues: 0,
          fullyPaidOrdersCount: 12,
          partialOrdersCount: 0,
          unpaidOrdersCount: 0,
        },
      },
      branchStats: [
        { name: 'Main Branch — Manikonda (POS-01)', count: 6, billed: 2500, received: 2500 },
        { name: 'Branch 1 — Tolichowki (POS-02)', count: 4, billed: 1200, received: 1200 },
        { name: 'Pick Up Point — Ambience (POS-03)', count: 2, billed: 800, received: 800 },
      ],
      cancellations: { count: 0, totalAmount: 0 },
    };

    pdfBuffer = await generateDailyReportPDF(mockReportData);
    console.log(`✅ PDF Generation Passed! Generated PDF buffer size: ${pdfBuffer.length} bytes.`);
  } catch (err) {
    console.error('❌ PDF Generation Failed:', err.message);
  }

  // 3. Test Vercel Blob Upload
  if (pdfBuffer) {
    try {
      console.log('Testing Vercel Blob Upload...');
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('ℹ️ BLOB_READ_WRITE_TOKEN is not defined in local environment.');
        console.log('   In production, Vercel automatically injects BLOB_READ_WRITE_TOKEN when Vercel Blob store is linked.');
      } else {
        const blob = await put('reports/daily/test-report.pdf', pdfBuffer, {
          access: 'public',
          allowOverwrite: true,
          contentType: 'application/pdf',
        });
        console.log('✅ Vercel Blob Upload Passed! Blob URL:', blob.url);
      }
    } catch (err) {
      console.error('❌ Vercel Blob Upload Error:', err.message);
    }
  }

  console.log('--- TEST COMPLETE ---');
}

testVercelBlobAndPdf();
