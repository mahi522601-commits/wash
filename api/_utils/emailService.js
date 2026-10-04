/**
 * Tech Wash Server-Side Email Delivery Service Abstraction
 * Supports Resend, SMTP / Nodemailer, and Mock mode for testing.
 * All credentials remain strictly server-side environment variables.
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function sendDailyReportEmail({
  to,
  cc,
  subject,
  textBody,
  htmlBody,
  pdfBuffer,
  pdfFilename = 'TechWash_Daily_Sales_Report.pdf',
  idempotencyKey
}) {
  const isVercelProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  let provider = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : (process.env.SMTP_HOST ? 'smtp' : (isVercelProd ? 'resend' : 'mock')))).toLowerCase().trim();

  // In production, force real Resend provider and forbid Mock mode
  if (isVercelProd && provider === 'mock' && !process.env.ALLOW_MOCK_IN_PROD) {
    provider = 'resend';
  }

  const from = process.env.EMAIL_FROM || 'Tech Wash Laundry <reports@techwash.in>';

  const parseRecipients = (val) => {
    if (val === undefined || val === null) return null;
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    return String(val).split(',').map(s => String(s).trim()).filter(Boolean);
  };

  const parsedTo = parseRecipients(to);
  const toList = parsedTo && parsedTo.length > 0 ? parsedTo : parseRecipients(process.env.EMAIL_TO || 'admin@techwash.in');
  const ccList = parseRecipients(cc || process.env.EMAIL_CC) || [];

  if (!toList || toList.length === 0) {
    throw new Error('No valid email recipients specified in EMAIL_TO or function parameters.');
  }

  const attachments = pdfBuffer ? [
    {
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ] : [];

  console.log(`📧 Dispatching Daily Report Email via provider: "${provider}"`);
  console.log(`   ├─ From: ${from}`);
  console.log(`   ├─ To: ${toList.join(', ')}`);
  if (ccList.length > 0) console.log(`   ├─ CC: ${ccList.join(', ')}`);
  console.log(`   ├─ Subject: ${subject}`);
  console.log(`   └─ Attachment: ${pdfFilename} (${pdfBuffer ? pdfBuffer.length : 0} bytes)`);

  // --- 1. RESEND PROVIDER (PRIMARY PRODUCTION PROVIDER) ---
  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('CONFIGURATION ERROR: Missing RESEND_API_KEY environment variable on Vercel production server.');
    }

    const resend = new Resend(apiKey);
    const refKey = idempotencyKey || `daily-report-${new Date().toISOString().slice(0, 10)}`;

    const payload = {
      from,
      to: toList,
      subject,
      text: textBody,
      html: htmlBody || textBody.replace(/\n/g, '<br/>'),
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content.toString('base64'),
      })),
      headers: {
        'X-Entity-Ref-ID': refKey,
      }
    };

    if (ccList.length > 0) {
      payload.cc = ccList;
    }

    const res = await resend.emails.send(payload);
    if (res.error) {
      throw new Error(`Resend Email Delivery Failed: ${res.error.message || JSON.stringify(res.error)}`);
    }

    return {
      success: true,
      messageId: res.data?.id || `resend-${refKey}`,
      provider: 'resend',
      recipients: toList,
      cc: ccList,
      deliveredAt: new Date().toISOString()
    };
  }

  // --- 2. SMTP / NODEMAILER PROVIDER ---
  if (provider === 'smtp' || provider === 'nodemailer') {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host) {
      throw new Error('CONFIGURATION ERROR: Missing SMTP_HOST environment variable.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const mailOptions = {
      from,
      to: toList.join(', '),
      cc: ccList.length > 0 ? ccList.join(', ') : undefined,
      subject,
      text: textBody,
      html: htmlBody || textBody.replace(/\n/g, '<br/>'),
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId || 'smtp-sent',
      provider: 'smtp',
      recipients: toList,
      cc: ccList,
      deliveredAt: new Date().toISOString()
    };
  }

  // --- 3. MOCK PROVIDER (LOCAL DEVELOPMENT ONLY) ---
  if (provider === 'mock' || process.env.MOCK_EMAIL === 'true') {
    const mockMessageId = `mock-email-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    console.log(`✅ [MOCK EMAIL DELIVERED] ID: ${mockMessageId}`);
    return {
      success: true,
      messageId: mockMessageId,
      provider: 'mock',
      recipients: toList,
      cc: ccList,
      deliveredAt: new Date().toISOString()
    };
  }

  throw new Error(`Unsupported EMAIL_PROVIDER: "${provider}". Expected 'resend' or 'smtp'.`);
}
