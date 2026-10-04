/**
 * Automated Daily Financial Report Email Dispatcher & Schedule Manager
 * Manages email recipients, persistent schedules in Firebase settings/daily_report,
 * and authenticated Vercel Serverless Function invocations.
 */

import { reportService } from './reportService.js';
import { auditService } from './auditService.js';
import { db, auth, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
   * Fetch current Schedule & Recipient configuration from Firebase settings/daily_report
   */
  async getConfig() {
    try {
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
            if (typeof window !== 'undefined') {
              localStorage.setItem(DAILY_SCHEDULE_STORAGE_KEY, JSON.stringify(migrated));
            }
            return migrated;
          }

          const merged = { ...DEFAULT_SCHEDULE_CONFIG, ...data };
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
          return { ...DEFAULT_SCHEDULE_CONFIG, ...parsed };
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
    const currentUser = auth?.currentUser;
    let token = '';
    
    if (currentUser) {
      try {
        token = await currentUser.getIdToken(false);
      } catch (e) {
        token = await currentUser.getIdToken(true);
      }
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
}

export const dailyReportScheduler = new DailyReportSchedulerService();
export default dailyReportScheduler;
