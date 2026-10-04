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
  pdfFilename = 'TechWash_Daily_Sales_Report.pdf'
}) {
  const provider = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : (process.env.SMTP_HOST ? 'smtp' : 'mock'))).toLowerCase().trim();
  const from = process.env.EMAIL_FROM || 'Tech Wash Laundry <reports@techwash.in>';

  // Parse recipient strings/arrays
  const parseRecipients = (val) => {
    if (val === undefined || val === null) return null;
    if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
    return String(val).split(',').map(s => String(s).trim()).filter(Boolean);
  };

  const parsedTo = parseRecipients(to);
  const toList = parsedTo !== null ? parsedTo : parseRecipients(process.env.EMAIL_TO || 'admin@techwash.in');
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

  // --- 1. MOCK PROVIDER (FOR AUTOMATED TESTING & LOCAL DEVELOPMENT) ---
  if (provider === 'mock' || process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL === 'true') {
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

  // --- 2. RESEND PROVIDER ---
  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable for Resend provider.');
    }

    const resend = new Resend(apiKey);
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
    };

    if (ccList.length > 0) {
      payload.cc = ccList;
    }

    const res = await resend.emails.send(payload);
    if (res.error) {
      throw new Error(`Resend Email Error: ${res.error.message || JSON.stringify(res.error)}`);
    }

    return {
      success: true,
      messageId: res.data?.id || 'resend-sent',
      provider: 'resend',
      recipients: toList,
      cc: ccList,
      deliveredAt: new Date().toISOString()
    };
  }

  // --- 3. SMTP / NODEMAILER PROVIDER ---
  if (provider === 'smtp' || provider === 'nodemailer') {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host) {
      throw new Error('Missing SMTP_HOST environment variable for SMTP provider.');
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

  throw new Error(`Unsupported EMAIL_PROVIDER: "${provider}". Expected 'resend', 'smtp', or 'mock'.`);
}
