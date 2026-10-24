/**
 * Automated Daily Financial Report Email Dispatcher & Schedule Manager
 * Manages email recipients, persistent schedules in Firebase settings/daily_report,
 * and authenticated Vercel Serverless Function invocations.
 */

import { reportService } from './reportService.js';
import { auditService } from './auditService.js';
import { db, auth, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { localDbService } from './localDbService.js';

const DAILY_SCHEDULE_STORAGE_KEY = 'techwash_daily_report_schedule_v3';

export const DEFAULT_SCHEDULE_CONFIG = {
  enabled: true,
  scheduleTime: '22:00', // 10:00 PM IST
  hour: 10,
  minute: 0,
  amPm: 'PM',
  cutoffHour: 10,
  cutoffMinute: 0,
  cutoffAmPm: 'PM',
  scheduleTimeFormatted: '10:00 PM',
  timezone: 'Asia/Kolkata',
  emailTo: ['admin@techwash.in'],
  emailCc: [],
  recipientsTo: ['admin@techwash.in'],
  recipientsCc: [],
  userSaved: false,
  lastDispatchedDate: '',
  lastDispatchedTimestamp: '',
  lastStatus: 'Ready', // 'Ready' | 'SENT' | 'FAILED' | 'UNAUTHORIZED'
  dispatchHistory: []
};

class DailyReportSchedulerService {
  /**
   * Fetch current Schedule & Recipient configuration from local IndexedDB first, then localStorage & Firebase
   */
  async getConfig() {
    try {
      // 1. Try reading from permanent local IndexedDB first
      const localIndexedDbSetting = await localDbService.getTerminalSetting('daily_report_schedule');
      if (localIndexedDbSetting && typeof localIndexedDbSetting === 'object') {
        const mergedLocal = { ...DEFAULT_SCHEDULE_CONFIG, ...localIndexedDbSetting };
        if (typeof window !== 'undefined') {
          localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(mergedLocal));
        }
        return mergedLocal;
      }

      // 2. Try reading from Firebase settings/daily_report
      if (isFirebaseConfigured && db) {
        const mainDocRef = doc(db, 'settings', 'daily_report');
        const snap = await getDoc(mainDocRef);
        if (snap.exists()) {
          const data = snap.data();
          
          // Migrate legacy default 06:00 PM if user has not explicitly saved custom time
          const isLegacySixPm = (data.hour === 6 || data.cutoffHour === 6 || data.scheduleTime === '18:00') && !data.userSaved;
          if (isLegacySixPm) {
            const migrated = {
              ...DEFAULT_SCHEDULE_CONFIG,
              ...data,
              hour: 10,
              minute: 0,
              amPm: 'PM',
              cutoffHour: 10,
              cutoffMinute: 0,
              cutoffAmPm: 'PM',
              scheduleTime: '22:00',
              scheduleTimeFormatted: '10:00 PM',
            };
            await localDbService.saveTerminalSetting('daily_report_schedule', migrated);
            if (typeof window !== 'undefined') {
              localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(migrated));
            }
            return migrated;
          }

          const merged = { ...DEFAULT_SCHEDULE_CONFIG, ...data };
          await localDbService.saveTerminalSetting('daily_report_schedule', merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(merged));
          }
          return merged;
        }
      }

      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(DAILY_SCHEDULE_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          const mergedLocal = { ...DEFAULT_SCHEDULE_CONFIG, ...parsed };
          await localDbService.saveTerminalSetting('daily_report_schedule', mergedLocal);
          return mergedLocal;
        }
      }
    } catch (e) {
      console.warn('Could not fetch daily schedule config, using default:', e);
    }
    return DEFAULT_SCHEDULE_CONFIG;
  }

  /**
   * Save Schedule & Recipient configuration to IndexedDB FIRST, then localStorage & Firebase
   */
  async saveConfig(updatedConfig) {
    const merged = {
      ...DEFAULT_SCHEDULE_CONFIG,
      ...updatedConfig,
      userSaved: true,
      timezone: 'Asia/Kolkata',
      cutoffHour: updatedConfig.hour !== undefined ? updatedConfig.hour : (updatedConfig.cutoffHour || 10),
      cutoffMinute: updatedConfig.minute !== undefined ? updatedConfig.minute : (updatedConfig.cutoffMinute || 0),
      cutoffAmPm: updatedConfig.amPm || updatedConfig.cutoffAmPm || 'PM',
      emailTo: updatedConfig.emailTo || updatedConfig.recipientsTo || ['admin@techwash.in'],
      emailCc: updatedConfig.emailCc || updatedConfig.recipientsCc || [],
      recipientsTo: updatedConfig.emailTo || updatedConfig.recipientsTo || ['admin@techwash.in'],
      recipientsCc: updatedConfig.emailCc || updatedConfig.recipientsCc || [],
      updatedAt: new Date().toISOString()
    };
    
    // Save to IndexedDB FIRST (LOCAL_SAVED)
    try {
      await localDbService.saveTerminalSetting('daily_report_schedule', merged);
    } catch (dbErr) {
      console.warn('IndexedDB terminal settings save error:', dbErr);
    }

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
      userSaved: true,
      hour: Number(hour),
      minute: Number(minute),
      amPm: String(amPm).toUpperCase(),
      cutoffHour: Number(hour),
      cutoffMinute: Number(minute),
      cutoffAmPm: String(amPm).toUpperCase(),
      scheduleTime,
      scheduleTimeFormatted,
      timezone: 'Asia/Kolkata',
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    return this.saveConfig(updated);
  }

  /**
   * Invoke serverless endpoint /api/daily-sales-report with Firebase ID Token
   */
  async triggerServerlessReport(payload = {}) {
    let currentUser = auth?.currentUser;

    if (!currentUser && auth) {
      await new Promise(resolve => setTimeout(resolve, 500));
      currentUser = auth.currentUser;
    }

    if (!currentUser) {
      throw new Error('Authentication required: Please log in to your administrator account to send a test report email.');
    }

    let token = '';
    try {
      token = await currentUser.getIdToken(false);
    } catch (e) {
      token = await currentUser.getIdToken(true);
    }

    if (!token) {
      throw new Error('Authentication Error: Unable to acquire valid Firebase ID token. Please re-authenticate.');
    }

    const requestBody = typeof payload === 'object' ? payload : { action: payload };

    const res = await fetch('/api/daily-sales-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      data = {
        success: false,
        status: 'FAILED',
        error: `Server HTTP ${res.status} (${res.statusText}): ${rawText.slice(0, 300) || 'Non-JSON API response'}`
      };
    }

    if (!res.ok || data.success === false) {
      const errorMsg = data.error || data.details || data.message || `Server Error (HTTP ${res.status})`;
      const errObj = new Error(errorMsg);
      errObj.status = data.status || `HTTP_${res.status}`;
      throw errObj;
    }

    return data;
  }

  /**
   * Builds an official WhatsApp financial document summary string
   * formatted for store managers and owners with POS 1 & POS 2 expenses.
   */
  buildDailyReportWhatsAppDocument(reportData, recipient = 'Management') {
    if (!reportData) return 'No report data available.';

    const metrics = reportData.metrics || {};
    const c1 = metrics.category1 || {};
    const c2 = metrics.category2 || {};
    const expenses = reportData.expenses || {};
    const dateLabel = reportData.dateRangeLabel || reportData.dateFormatted || 'Today';

    const grossBilled = Number(metrics.totalGrossBilled || 0);
    const collections = Number(c1.totalInflowCollections || 0);
    const netDues = Number(c2.totalNetPendingDues || 0);
    const recoveredDues = Number(c2.totalRecoveredDues || 0);

    const pos1Exp = expenses.pos1 || { count: 0, totalAmount: 0, cashAmount: 0 };
    const pos2Exp = expenses.pos2 || { count: 0, totalAmount: 0, cashAmount: 0 };
    const pos3Exp = expenses.pos3 || { count: 0, totalAmount: 0, cashAmount: 0 };
    const totalExp = Number(expenses.totalAmount || (pos1Exp.totalAmount + pos2Exp.totalAmount + pos3Exp.totalAmount) || 0);
    const totalCashExp = Number(expenses.totalCashAmount || (pos1Exp.cashAmount + pos2Exp.cashAmount + pos3Exp.cashAmount) || 0);
    const grossCash = Number(c1.cashReceived || 0);
    const netDrawer = Math.max(0, grossCash - totalCashExp);

    let posExpensesBlock = `*3. 🏪 POS COUNTER EXPENSES & CASH OUTFLOWS*
• *POS-01 (Manikonda Main):* ${pos1Exp.count || 0} Bills • ₹${(pos1Exp.totalAmount || 0).toLocaleString('en-IN')} (Cash: ₹${(pos1Exp.cashAmount || 0).toLocaleString('en-IN')})
• *POS-02 (Tolichowki Branch 1):* ${pos2Exp.count || 0} Bills • ₹${(pos2Exp.totalAmount || 0).toLocaleString('en-IN')} (Cash: ₹${(pos2Exp.cashAmount || 0).toLocaleString('en-IN')})`;

    if (pos3Exp.count > 0 || pos3Exp.totalAmount > 0) {
      posExpensesBlock += `\n• *POS-03 (Ambience Courtyard):* ${pos3Exp.count || 0} Bills • ₹${(pos3Exp.totalAmount || 0).toLocaleString('en-IN')} (Cash: ₹${(pos3Exp.cashAmount || 0).toLocaleString('en-IN')})`;
    }

    posExpensesBlock += `\n• *Total Counter Expenses:* ₹${totalExp.toLocaleString('en-IN')}
• *💵 Physical Drawer Cash Remaining:* ₹${netDrawer.toLocaleString('en-IN')}
  _(Gross Cash ₹${grossCash.toLocaleString('en-IN')} - Cash Expenses ₹${totalCashExp.toLocaleString('en-IN')})_
📎 *Attached Receipts:* ${expenses.items ? expenses.items.filter(i => i.receiptAttachmentUrl).length : 0} Bills Verified in PDF`;

    return `*TECH WASH LAUNDRY SERVICES*
*DAILY EXECUTIVE AUDIT & SETTLEMENT REPORT*
📅 *Period:* ${dateLabel}
👤 *Audited For:* ${recipient}
─────────────────────────────
*1. OVERALL REVENUE SUMMARY*
• Gross Billed Sales: ₹${grossBilled.toLocaleString('en-IN')}
• Direct Collections Inflow: ₹${collections.toLocaleString('en-IN')}
• Net Pending Dues: ₹${netDues.toLocaleString('en-IN')}
• Dues Recovered Today: ₹${recoveredDues.toLocaleString('en-IN')}

*2. COLLECTIONS BY PAYMENT MODE*
• 💵 Cash at Register: ₹${(c1.cashReceived || 0).toLocaleString('en-IN')}
• 📱 UPI / Dynamic QR: ₹${(c1.upiReceived || 0).toLocaleString('en-IN')}
• 💳 Card / POS Swipe: ₹${(c1.cardReceived || 0).toLocaleString('en-IN')}
• 🌐 Online Website: ₹${(c1.onlineReceived || 0).toLocaleString('en-IN')}

${posExpensesBlock}

*4. ORDERS & VOLUME AUDIT*
• Total Orders: ${metrics.totalOrdersCount || reportData.orders?.length || 0} Bills
• Garments Cleaned: ${metrics.totalPiecesCount || 0} Pcs | ${metrics.totalWeightKg || 0} Kg
• Fully Settled Orders: ${c2.fullyPaidOrdersCount || 0} Bills
• Unpaid / Partial: ${(c2.partialOrdersCount || 0) + (c2.unpaidOrdersCount || 0)} Bills

📄 *Certified A4 Shift PDF with Attached Bill Receipts available on Admin Portal:*
https://techwashlaundry.com/admin/reports
─────────────────────────────
_Tech Wash Operations & Accounts Engine_`;
  }
}

export const dailyReportScheduler = new DailyReportSchedulerService();
export default dailyReportScheduler;
