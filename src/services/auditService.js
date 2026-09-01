/**
 * Audit Logging Service for Tech Wash Admin
 * Tracks all administrative mutations: action, entity, changedBy, timestamp, diff
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const LOCAL_AUDIT_LOG_KEY = 'techwash_audit_logs';

export const auditService = {
  /**
   * Log an admin action
   */
  async logAction({
    action, // 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE' | 'PRICE_CHANGE'
    entity, // 'Service' | 'Banner' | 'Order' | 'Location' | 'Settings' | 'Pricing' | 'Media'
    entityId = null,
    entityName = '',
    previousValue = null,
    newValue = null,
    user = null,
  }) {
    const actor = user || { email: 'admin@techwash.in', displayName: 'Admin User', role: 'admin' };
    
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      entity,
      entityId,
      entityName: entityName || entityId || 'Item',
      timestamp: new Date().toISOString(),
      user: {
        email: actor.email,
        displayName: actor.displayName || actor.email,
        role: actor.role || 'admin',
      },
      previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    };

    // 1. Try writing to Firestore if configured
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'activityLogs'), entry);
      } catch (e) {
        console.warn("Could not write audit log to Firestore, saving locally:", e);
      }
    }

    // 2. Write to local storage buffer (keeps last 200 logs)
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOG_KEY) || '[]');
      existing.unshift(entry);
      if (existing.length > 200) existing.pop();
      localStorage.setItem(LOCAL_AUDIT_LOG_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn("Local storage audit log error:", e);
    }

    return entry;
  },

  /**
   * Fetch recent audit logs
   */
  async getLogs(maxLimit = 50) {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(maxLimit));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (e) {
        console.warn("Firestore audit logs read failed, reading local:", e);
      }
    }

    // Fallback to local logs
    try {
      const logs = JSON.parse(localStorage.getItem(LOCAL_AUDIT_LOG_KEY) || '[]');
      return logs.slice(0, maxLimit);
    } catch (e) {
      return [];
    }
  }
};
