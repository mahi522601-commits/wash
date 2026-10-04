/**
 * Automated Daily Financial Report WhatsApp Dispatcher & Number Manager
 * Manages recipient numbers, persistent schedules in Firebase/localStorage,
 * and authenticated Vercel Serverless Function invocations.
 */

import { reportService } from './reportService.js';
import { whatsappNotificationService } from './whatsappNotificationService.js';
import { auditService } from './auditService.js';
import { db, auth, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { parsePinToPinItems } from '../utils/formatters.js';

const DAILY_SCHEDULE_STORAGE_KEY = 'techwash_daily_report_schedule_v2';

export const DEFAULT_SCHEDULE_CONFIG = {
  enabled: true,
  scheduleTime: '22:00', // 10:00 PM IST
  hour: 10,
  minute: 0,
  amPm: 'PM',
  scheduleTimeFormatted: '10:00 PM',
  timezone: 'Asia/Kolkata',
  recipients: [
    { 
      id: 'rec-1', 
      name: 'Store Owner / Director', 
      phone: '+91 93987 24704', 
      role: 'Management', 
      active: true 
    },
    { 
      id: 'rec-2', 
      name: 'Executive Director', 
      phone: '+91 95502 47676', 
      role: 'Management', 
      active: true 
    },
  ],
  branchScope: 'ALL',
  autoDispatchPdf: true,
  lastDispatchedDate: '',
  lastDispatchedTimestamp: '',
  lastStatus: 'IDLE', // 'IDLE' | 'SCHEDULED' | 'RUNNING' | 'PDF_GENERATED' | 'WHATSAPP_SENDING' | 'COMPLETED' | 'FAILED' | 'DRY_RUN_COMPLETED'
  dispatchHistory: []
};

class DailyReportSchedulerService {
  constructor() {
    this.timerId = null;
    this.isChecking = false;
  }

  /**
   * Fetch current Schedule & Recipient configuration from Firebase / localStorage
   */
  async getConfig() {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(DAILY_SCHEDULE_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          return { ...DEFAULT_SCHEDULE_CONFIG, ...parsed };
        }
      }

      if (isFirebaseConfigured && db) {
        const docRef = doc(db, 'settings', 'daily_report_schedule');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof window !== 'undefined') {
            localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(data));
          }
          return { ...DEFAULT_SCHEDULE_CONFIG, ...data };
        }
      }
    } catch (e) {
      console.warn('Could not fetch daily schedule config, using default:', e);
    }
    return DEFAULT_SCHEDULE_CONFIG;
  }

  /**
   * Save Schedule & Recipient configuration to Firebase & localStorage
   */
  async saveConfig(updatedConfig) {
    const merged = { ...DEFAULT_SCHEDULE_CONFIG, ...updatedConfig, updatedAt: new Date().toISOString() };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(merged));
    }

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'daily_report_schedule');
        const mainDocRef = doc(db, 'settings', 'daily_report');
        await setDoc(docRef, merged, { merge: true });
        await setDoc(mainDocRef, merged, { merge: true });
      } catch (e) {
        console.warn('Firebase daily schedule save warning:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-daily-schedule-updated', { detail: merged }));
    }

    return merged;
  }

  /**
   * Save Admin-configured daily report send time
   */
  async saveScheduleTime({ hour, minute, amPm, enabled = true, updatedBy = 'Admin' }) {
    let h24 = Number(hour);
    if (amPm === 'PM' && h24 < 12) h24 += 12;
    if (amPm === 'AM' && h24 === 12) h24 = 0;

    const hourStr = String(h24).padStart(2, '0');
    const minStr = String(minute).padStart(2, '0');
    const scheduleTime = `${hourStr}:${minStr}`;
    const scheduleTimeFormatted = `${hour}:${minStr} ${amPm}`;

    const config = await this.getConfig();
    const updated = {
      ...config,
      enabled: Boolean(enabled),
      hour: Number(hour),
      minute: Number(minute),
      amPm: String(amPm).toUpperCase(),
      scheduleTime,
      scheduleTimeFormatted,
      timezone: 'Asia/Kolkata',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    return this.saveConfig(updated);
  }

  /**
   * Add a new WhatsApp recipient phone number
   */
  async addRecipient({ name, phone, role = 'Staff / Manager' }) {
    if (!phone) throw new Error('Phone number is required.');
    const config = await this.getConfig();
    const cleanPhone = whatsappNotificationService.formatWhatsAppNumber(phone);
    
    const newRecipient = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name?.trim() || 'Admin Recipient',
      phone: phone.trim(),
      cleanPhone: `+${cleanPhone}`,
      role: role.trim() || 'Management',
      active: true,
      addedAt: new Date().toISOString(),
    };

    const updatedRecipients = [...(config.recipients || []), newRecipient];
    return this.saveConfig({ ...config, recipients: updatedRecipients });
  }

  /**
   * Remove a WhatsApp recipient phone number by ID
   */
  async deleteRecipient(recipientId) {
    const config = await this.getConfig();
    const updatedRecipients = (config.recipients || []).filter(r => r.id !== recipientId);
    return this.saveConfig({ ...config, recipients: updatedRecipients });
  }

  /**
   * Toggle recipient active status
   */
  async toggleRecipientActive(recipientId) {
    const config = await this.getConfig();
    const updatedRecipients = (config.recipients || []).map(r => {
      if (r.id === recipientId) return { ...r, active: !r.active };
      return r;
    });
    return this.saveConfig({ ...config, recipients: updatedRecipients });
  }

  /**
   * Helper to invoke serverless endpoint /api/daily-sales-report with Firebase ID Token
   */
  async triggerServerlessReport({ action = 'send_today' } = {}) {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in as an authenticated Admin to execute this operation.');
    }

    let token;
    try {
      token = await currentUser.getIdToken(false);
    } catch (e) {
      token = await currentUser.getIdToken(true);
    }

    const res = await fetch('/api/daily-sales-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      data = {
        success: false,
        status: 'FAILED',
        error: `Server HTTP ${res.status} (${res.statusText}): ${rawText.slice(0, 200) || 'Non-JSON API response'}`
      };
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.details || data.message || `Server error (${res.status})`);
    }

    return data;
  }

  /**
   * Builds the official Daily PDF / Settlement Document WhatsApp payload text
   */
  buildDailyReportWhatsAppDocument(reportData, recipientName = 'Management') {
    if (!reportData) return '';

    const dateLabel = reportData.dateRangeLabel || 'Today';
    const metrics = reportData.metrics || {};
    const c1 = metrics.category1 || reportData.category1 || {};
    const c2 = metrics.category2 || reportData.category2 || {};
    const orders = reportData.orders || [];

    const origin = 'https://techwashlaundry.com';
    const documentPdfUrl = `${origin}/admin/reports?preset=today&print=auto`;
    const thirtyDaysUrl = `${origin}/admin/reports?preset=30days`;

    const branchStats = {
      main: { name: 'Main Branch — Manikonda (POS-01)', count: 0, billed: 0, received: 0 },
      branch1: { name: 'Branch 1 — Tolichowki (POS-02)', count: 0, billed: 0, received: 0 },
      pickup: { name: 'Pick Up Point — Ambience (POS-03)', count: 0, billed: 0, received: 0 },
      online: { name: 'Website Online Pickup', count: 0, billed: 0, received: 0 },
    };

    orders.forEach(ord => {
      const isPos = Boolean(ord.isWalkIn || ord.orderSource === 'OFFLINE_POS' || ord.terminalCode);
      const total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
      const rec = Number(ord.receivedAmount !== undefined ? ord.receivedAmount : (ord.paymentStatus === 'PAID' ? total : 0));
      const tId = (ord.terminalId || '').toLowerCase();
      const tCode = (ord.terminalCode || '').toLowerCase();
      const branchName = (ord.storeBranch || '').toLowerCase();

      if (!isPos) {
        branchStats.online.count += 1; branchStats.online.billed += total; branchStats.online.received += rec;
      } else if (tId === 'counter-1' || tCode.includes('pos-01') || branchName.includes('main branch') || branchName.includes('manikonda')) {
        branchStats.main.count += 1; branchStats.main.billed += total; branchStats.main.received += rec;
      } else if (tId === 'counter-2' || tCode.includes('pos-02') || branchName.includes('branch 1') || branchName.includes('tolichowki')) {
        branchStats.branch1.count += 1; branchStats.branch1.billed += total; branchStats.branch1.received += rec;
      } else if (tId === 'counter-3' || tCode.includes('pos-03') || branchName.includes('ambience')) {
        branchStats.pickup.count += 1; branchStats.pickup.billed += total; branchStats.pickup.received += rec;
      } else {
        branchStats.main.count += 1; branchStats.main.billed += total; branchStats.main.received += rec;
      }
    });

    const serviceBreakdown = metrics.serviceBreakdown || {};
    const serviceLines = Object.entries(serviceBreakdown)
      .filter(([_, data]) => data.count > 0 || data.revenue > 0)
      .map(([name, data]) => `  • *${name}:* ${data.count} Orders (₹${(data.revenue || 0).toLocaleString('en-IN')})`)
      .join('\n') || '  • *General Services:* Active';

    const itemsList = orders.slice(0, 12).map((ord, idx) => {
      const isPos = Boolean(ord.isWalkIn || ord.orderSource === 'OFFLINE_POS' || ord.terminalCode);
      const prefix = isPos ? '🏪' : '🌐';
      const orderNum = ord.orderNumber || ord.id || `TW-${idx+1}`;
      const total = Number(ord.totalAmount || ord.finalPrice || ord.priceSnapshot?.finalTotal || 0);
      const rec = Number(ord.receivedAmount !== undefined ? ord.receivedAmount : (ord.paymentStatus === 'PAID' ? total : 0));
      const bal = Number(ord.balanceAmount !== undefined ? ord.balanceAmount : Math.max(0, total - rec));
      const statusStr = bal === 0 ? '✅ PAID' : `🔴 ₹${bal.toLocaleString('en-IN')} DUE`;
      const cust = ord.customerName || ord.customer?.name || 'Walk-in Customer';
      const pin = parsePinToPinItems(ord);
      const itemDesc = pin.textSummary ? ` [${pin.textSummary}]` : '';
      return `  ${idx + 1}. ${prefix} *#${orderNum}* (${cust}) • ₹${total.toLocaleString('en-IN')}${itemDesc} - ${statusStr}`;
    }).join('\n');

    const totalInflow = c1.totalInflowCollections !== undefined ? c1.totalInflowCollections : (c1.cashReceived || 0) + (c1.upiReceived || 0) + (c1.cardReceived || 0) + (c1.onlineReceived || 0);
    const grossBilled = metrics.totalGrossBilled || 0;
    const netDues = c2.totalNetPendingDues !== undefined ? c2.totalNetPendingDues : Math.max(0, grossBilled - totalInflow);

    return `📑 *TECH WASH LAUNDRY SERVICES — OFFICIAL DAILY EXECUTIVE SALES AUDIT*
📅 *Audit Date:* ${dateLabel} (${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })})
👤 *Recipient:* ${recipientName}

───────────────────────────────
📊 *DAILY REVENUE & SALES SUMMARY*
───────────────────────────────
💰 *TOTAL GROSS SALES BILLED:* *₹${grossBilled.toLocaleString('en-IN')}*
💵 *TOTAL CASH / UPI COLLECTED:* *₹${totalInflow.toLocaleString('en-IN')}*
🔴 *NET PENDING DUES / BALANCES:* *₹${netDues.toLocaleString('en-IN')}*
🔄 *Dues Recovered Today:* *₹${(c2.totalRecoveredDues || 0).toLocaleString('en-IN')}*

───────────────────────────────
💳 *COLLECTIONS INFLOW BY PAYMENT MODE*
───────────────────────────────
• 💵 Cash at Register: *₹${(c1.cashReceived || 0).toLocaleString('en-IN')}*
• 📱 UPI / Dynamic QR: *₹${(c1.upiReceived || 0).toLocaleString('en-IN')}*
• 💳 Card / POS Machine: *₹${(c1.cardReceived || 0).toLocaleString('en-IN')}*
• 🌐 Online Pre-paid: *₹${(c1.onlineReceived || 0).toLocaleString('en-IN')}*

───────────────────────────────
🏬 *BRANCH-WISE SALES PERFORMANCE*
───────────────────────────────
• 🏪 *Main Branch — Manikonda (POS-01):* ${branchStats.main.count} Bills • ₹${branchStats.main.billed.toLocaleString('en-IN')} (Rec: ₹${branchStats.main.received.toLocaleString('en-IN')})
• 🏪 *Branch 1 — Tolichowki (POS-02):* ${branchStats.branch1.count} Bills • ₹${branchStats.branch1.billed.toLocaleString('en-IN')} (Rec: ₹${branchStats.branch1.received.toLocaleString('en-IN')})
• 🏪 *Pick Up Point — Ambience (POS-03):* ${branchStats.pickup.count} Bills • ₹${branchStats.pickup.billed.toLocaleString('en-IN')} (Rec: ₹${branchStats.pickup.received.toLocaleString('en-IN')})
• 🌐 *Online Website Pickup:* ${branchStats.online.count} Bookings • ₹${branchStats.online.billed.toLocaleString('en-IN')}

───────────────────────────────
🧺 *SERVICE CATEGORY REVENUE*
───────────────────────────────
${serviceLines}

───────────────────────────────
📈 *OPERATIONAL VOLUME METRICS*
───────────────────────────────
• Total Invoices Billed: *${metrics.totalOrdersCount || 0} Orders*
• Fully Paid / Settled: *${c2.fullyPaidOrdersCount || 0} Bills*
• Partial / Outstanding Dues: *${(c2.partialOrdersCount || 0) + (c2.unpaidOrdersCount || 0)} Bills*
• Garments Cleaned: *${metrics.totalPiecesCount || 0} Pieces*
• Total Laundry Weighed: *${metrics.totalWeightKg || 0} Kg*

───────────────────────────────
📋 *TODAY'S INVOICE HIGHLIGHTS:*
${itemsList || '  (No transactions recorded for today)'}

───────────────────────────────
📄 *VIEW & PRINT OFFICIAL A4 PDF STATEMENT:*
${documentPdfUrl}

📊 *VIEW 30-DAY MONTHLY MASTER AUDIT:*
${thirtyDaysUrl}
───────────────────────────────
_Tech Wash Financial Reconciliation Engine • Certified Operations Report_
_Confidential Daily Executive Summary for Authorized Management Only._`;
  }
}

export const dailyReportScheduler = new DailyReportSchedulerService();
