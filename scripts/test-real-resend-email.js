import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// 1. Load .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// Enforce RESEND provider
process.env.EMAIL_PROVIDER = 'resend';
delete process.env.MOCK_EMAIL;

import handler from '../api/daily-sales-report.js';

class MockReq {
  constructor(method = 'POST', headers = {}, query = {}, body = {}) {
    this.method = method;
    this.headers = headers;
    this.query = query;
    this.body = body;
  }
}

class MockRes {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
  }
  setHeader(key, val) {
    this.headers[key] = val;
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  json(data) {
    this.body = data;
    return this;
  }
  end() {
    return this;
  }
}

async function runRealEmailVerification() {
  console.log('====================================================');
  console.log('📧 TECH WASH — REAL RESEND EMAIL PRODUCTION TEST');
  console.log('====================================================\n');

  console.log('Checking Environment Configuration...');
  const resendKeyPresent = Boolean(process.env.RESEND_API_KEY);
  const provider = process.env.EMAIL_PROVIDER || 'resend';
  const emailFrom = process.env.EMAIL_FROM || 'Tech Wash Laundry <reports@techwash.in>';
  const emailTo = process.env.EMAIL_TO || 'admin@techwash.in';
  const emailCc = process.env.EMAIL_CC || 'N/A';
  const cronSecret = process.env.CRON_SECRET || 'techwash_cron_secret_2026';
  process.env.CRON_SECRET = cronSecret;

  console.log(`├─ Provider: ${provider}`);
  console.log(`├─ RESEND_API_KEY: ${resendKeyPresent ? 'PRESENT' : 'MISSING'}`);
  console.log(`├─ EMAIL_FROM: ${emailFrom}`);
  console.log(`├─ EMAIL_TO: ${emailTo}`);
  console.log(`└─ EMAIL_CC: ${emailCc}\n`);

  if (!resendKeyPresent) {
    console.error('❌ RESEND_API_KEY is missing in environment! Cannot test real Resend delivery.');
    process.exit(1);
  }

  // 1. SECURITY TEST: Unauthorized Request
  console.log('--- 1. SECURITY VERIFICATION (UNAUTHORIZED REJECTION) ---');
  const unauthReq = new MockReq('GET', {}, {});
  const unauthRes = new MockRes();
  await handler(unauthReq, unauthRes);
  if (unauthRes.statusCode === 401 && unauthRes.body?.status === 'UNAUTHORIZED') {
    console.log('✅ Security Test PASSED: Unauthorized request properly rejected with HTTP 401.');
  } else {
    console.error(`❌ Security Test FAILED: Expected 401, got ${unauthRes.statusCode}`);
  }

  // 2. EXECUTE REAL EMAIL REPORTING
  console.log('\n--- 2. EXECUTING REAL DAILY REPORT GENERATION & EMAIL DELIVERY ---');
  const todayStr = new Date().toISOString().slice(0, 10);
  const authReq = new MockReq('POST', { authorization: `Bearer ${cronSecret}` }, { force: 'true', date: todayStr });
  const authRes = new MockRes();

  await handler(authReq, authRes);

  console.log(`API Response Status: ${authRes.statusCode}`);
  console.log('API Response Body:', JSON.stringify(authRes.body, null, 2));

  if (authRes.statusCode !== 200 || !authRes.body?.success) {
    console.error('❌ Real Email Delivery Test FAILED!');
    process.exit(1);
  }

  console.log(`\n✅ REAL RESEND EMAIL DISPATCHED SUCCESSFULLY!`);
  console.log(`   ├─ Provider: ${authRes.body.emailProvider}`);
  console.log(`   ├─ Message ID: ${authRes.body.messageId}`);
  console.log(`   ├─ Recipients: ${authRes.body.recipients}`);
  console.log(`   ├─ Orders Count: ${authRes.body.ordersCount}`);
  console.log(`   └─ Gross Billed: ₹${authRes.body.grossBilledSales}`);

  // 3. DUPLICATE IDEMPOTENCY TEST
  console.log('\n--- 3. DUPLICATE-RUN IDEMPOTENCY TEST ---');
  const dupReq = new MockReq('POST', { authorization: `Bearer ${cronSecret}` }, { date: todayStr });
  const dupRes = new MockRes();

  await handler(dupReq, dupRes);

  console.log(`Duplicate API Response Status: ${dupRes.statusCode}`);
  console.log('Duplicate Response Body:', JSON.stringify(dupRes.body, null, 2));

  if (dupRes.statusCode === 200 && dupRes.body?.status === 'ALREADY_COMPLETED') {
    console.log('✅ Idempotency Duplicate Protection PASSED: Second attempt returned ALREADY_COMPLETED without re-sending.');
  } else {
    console.error('❌ Idempotency Duplicate Protection FAILED!');
  }

  process.exit(0);
}

runRealEmailVerification().catch(err => {
  console.error('Fatal Error during Real Email Test:', err);
  process.exit(1);
});
