/**
 * Automated Daily 9:30 PM Financial Report WhatsApp Dispatcher & Number Manager
 * Manages recipient numbers, persistent schedules in Firebase/localStorage,
 * and automated document/PDF dispatch at 9:30 PM nightly.
 */

import { reportService } from './reportService.js';
import { whatsappNotificationService } from './whatsappNotificationService.js';
import { auditService } from './auditService.js';
import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { parsePinToPinItems } from '../utils/formatters.js';

const DAILY_SCHEDULE_STORAGE_KEY = 'techwash_daily_report_schedule_v2';

export const DEFAULT_SCHEDULE_CONFIG = {
  enabled: true,
  scheduleTime: '22:00', // 10:00 PM IST
  recipients: [
    { 
      id: 'rec-1', 
      name: 'Store Owner / Director', 
      phone: '+91 63048 45567', 
      role: 'Management', 
      active: true 
    },
  ],
  branchScope: 'ALL',
  autoDispatchPdf: true,
  lastDispatchedDate: '',
  lastDispatchedTimestamp: '',
  lastStatus: 'IDLE', // 'IDLE' | 'SCHEDULED' | 'DISPATCHED' | 'ERROR'
  dispatchHistory: []
};

class DailyReportSchedulerService {
  constructor() {
    this.timerId = null;
    this.isChecking = false;
    this.initBackgroundScheduler();
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
        await setDoc(docRef, merged, { merge: true });
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
   * Builds the official Daily PDF / Settlement Document WhatsApp payload
   */
  buildDailyReportWhatsAppDocument(reportData, recipientName = 'Management') {
    if (!reportData) return '';

    const dateLabel = reportData.dateRangeLabel || 'Today';
    const metrics = reportData.metrics || {};
    const c1 = metrics.category1 || reportData.category1 || {};
    const c2 = metrics.category2 || reportData.category2 || {};
    const orders = reportData.orders || [];

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwashlaundry.com';
    const documentPdfUrl = `${origin}/admin/reports?preset=today&print=auto`;
    const thirtyDaysUrl = `${origin}/admin/reports?preset=30days`;

    // Branch-wise Sales Computation
    const branchStats = {
      main: { name: 'Main Branch — Manikonda (POS-01)', count: 0, billed: 0, received: 0 },
      branch1: { name: 'Branch 1 — Tolichowki (POS-02)', count: 0, billed: 0, received: 0 },
      pickup: { name: 'Pick Up Point — Ambience Courtyard (POS-03)', count: 0, billed: 0, received: 0 },
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
        branchStats.online.count += 1;
        branchStats.online.billed += total;
        branchStats.online.received += rec;
      } else if (tId === 'counter-1' || tCode.includes('pos-01') || branchName.includes('main branch') || branchName.includes('manikonda') || branchName.includes('shaikpet main')) {
        branchStats.main.count += 1;
        branchStats.main.billed += total;
        branchStats.main.received += rec;
      } else if (tId === 'counter-2' || tCode.includes('pos-02') || branchName.includes('branch 1') || branchName.includes('tolichowki') || branchName.includes('ou colony') || branchName.includes('dreamscape')) {
        branchStats.branch1.count += 1;
        branchStats.branch1.billed += total;
        branchStats.branch1.received += rec;
      } else if (tId === 'counter-3' || tCode.includes('pos-03') || branchName.includes('pick up point') || branchName.includes('ambience') || branchName.includes('courtyard')) {
        branchStats.pickup.count += 1;
        branchStats.pickup.billed += total;
        branchStats.pickup.received += rec;
      } else {
        branchStats.main.count += 1;
        branchStats.main.billed += total;
        branchStats.main.received += rec;
      }
    });

    // Format Service Breakdown Lines
    const serviceBreakdown = metrics.serviceBreakdown || {};
    const serviceLines = Object.entries(serviceBreakdown)
      .filter(([_, data]) => data.count > 0 || data.revenue > 0)
      .map(([name, data]) => `  • *${name}:* ${data.count} Orders (₹${(data.revenue || 0).toLocaleString('en-IN')})`)
      .join('\n') || '  • *General Services:* Active';

    // Format top items breakdown with clear pin-to-pin description
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
⏰ *Automated 10:00 PM Night Settlement Overview*
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

  /**
   * Execute immediate dispatch to all configured recipient numbers
   */
  async dispatchDailyReportNow({ recipientOverride = null, isManual = false } = {}) {
    const config = await this.getConfig();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Generate fresh Financial Report for Today
    const reportData = await reportService.generateFinancialReport({
      datePreset: 'today',
      branchFilter: config.branchScope || 'ALL',
    });

    const activeRecipients = recipientOverride 
      ? [recipientOverride]
      : (config.recipients || []).filter(r => r.active !== false);

    if (activeRecipients.length === 0) {
      return { success: false, message: 'No active WhatsApp recipients configured.' };
    }

    const results = [];

    for (const rec of activeRecipients) {
      const rawPhone = rec.phone || rec.cleanPhone;
      const cleanPhone = whatsappNotificationService.formatWhatsAppNumber(rawPhone);
      const documentMessage = this.buildDailyReportWhatsAppDocument(reportData, rec.name);

      // Dispatch via configured WhatsApp provider in background
      const dispatchResult = await whatsappNotificationService.dispatchAutomatedMessage({
        phone: cleanPhone,
        message: documentMessage,
        type: 'DAILY_10PM_FINANCIAL_REPORT_PDF',
      });

      results.push({
        recipient: rec.name,
        phone: cleanPhone,
        success: dispatchResult.success,
        timestamp: new Date().toISOString(),
      });
    }

    // Update dispatch log history
    const updatedHistory = [
      {
        id: `disp-${Date.now()}`,
        date: todayStr,
        timestamp: new Date().toISOString(),
        isManual,
        recipientCount: results.length,
        results,
        grossBilled: reportData.metrics?.totalGrossBilled || 0,
        inflowReceived: reportData.category1?.totalRealizedInflows || 0,
        netDues: reportData.category2?.netPendingDues || 0,
      },
      ...(config.dispatchHistory || []).slice(0, 30) // keep last 30 daily logs
    ];

    const updatedConfig = await this.saveConfig({
      ...config,
      lastDispatchedDate: todayStr,
      lastDispatchedTimestamp: new Date().toISOString(),
      lastStatus: 'DISPATCHED',
      dispatchHistory: updatedHistory,
    });

    try {
      await auditService.logAction({
        action: 'DISPATCH',
        entity: 'DailyReport',
        entityId: todayStr,
        entityName: `10:00 PM Daily Sales Overview (${results.length} WhatsApp Recipients)`,
        newValue: { results, summary: reportData.metrics },
      });
    } catch (e) {}

    return {
      success: true,
      results,
      reportData,
      config: updatedConfig,
      dispatchedCount: results.length,
    };
  }

  /**
   * Background Scheduler: Checks every 30 seconds for 10:00 PM (22:00) trigger
   */
  initBackgroundScheduler() {
    if (typeof window === 'undefined') return;

    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.timerId = setInterval(() => {
      this.checkAndRunScheduledDispatch();
    }, 30000); // check every 30 seconds
  }

  /**
   * Evaluates if current time matches scheduled 10:00 PM time and executes dispatch
   */
  async checkAndRunScheduledDispatch() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const config = await this.getConfig();
      if (!config.enabled) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      const [targetHours, targetMinutes] = (config.scheduleTime || '22:00').split(':').map(Number);

      // Check if current time is at or after scheduled time (e.g. 22:00)
      const isTimeReached = currentHours > targetHours || (currentHours === targetHours && currentMinutes >= targetMinutes);

      // Check if not already dispatched today
      if (isTimeReached && config.lastDispatchedDate !== todayStr) {
        console.log(`⏰ [TechWash] Executing 10:00 PM Automated WhatsApp Financial Overview Dispatch for ${todayStr}...`);
        
        // Lock today's date immediately to prevent race conditions
        await this.saveConfig({
          ...config,
          lastDispatchedDate: todayStr,
          lastStatus: 'PROCESSING',
        });

        await this.dispatchDailyReportNow({ isManual: false });
        console.log(`✅ [TechWash] 10:00 PM WhatsApp Financial Overview Dispatch completed successfully for ${todayStr}.`);
      }
    } catch (err) {
      console.warn('Scheduled 10:00 PM dispatch check error:', err);
    } finally {
      this.isChecking = false;
    }
  }
}

export const dailyReportScheduler = new DailyReportSchedulerService();
