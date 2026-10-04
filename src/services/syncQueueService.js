/**
 * Tech Wash Offline Synchronization Queue & Terminal Health Service
 * Manages local transaction queues, background auto-retries, exponential backoff,
 * idempotent Firestore setDoc writes, and terminal sync health status updates.
 */

import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { posBridgeService } from './posBridgeService.js';

const QUEUE_STORAGE_KEY = 'techwash_sync_queue_v1';
const TERMINAL_HEALTH_KEY = 'techwash_terminal_health_cache';

const BACKOFF_STEPS_MS = [
  30 * 1000,        // 30 sec
  60 * 1000,        // 1 min
  2 * 60 * 1000,    // 2 min
  5 * 60 * 1000,    // 5 min
  10 * 60 * 1000,   // 10 min
  15 * 60 * 1000,   // 15 min
  30 * 60 * 1000,   // 30 min
];

class SyncQueueService {
  constructor() {
    this.isSyncing = false;
    this.timerId = null;
    this.listeners = new Set();
    this.initQueue();
  }

  initQueue() {
    if (typeof window !== 'undefined') {
      // Reconstruct missing queue items from local Windows JSON files if localStorage was cleared
      setTimeout(() => this.reconcileFromLocalFiles(), 500);

      // Background retry loop every 30 seconds
      this.startAutoSyncTimer(30000);

      // Listen for browser online event to trigger immediate retry
      window.addEventListener('online', () => {
        console.log('🌐 Browser online event detected. Triggering sync queue retry...');
        this.processQueue();
      });
    }
  }

  startAutoSyncTimer(intervalMs = 30000) {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  stopAutoSyncTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Get current queue from localStorage
   */
  getQueue() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Sync queue read error:', e);
      return [];
    }
  }

  /**
   * Save queue array to localStorage
   */
  saveQueue(queue) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners(queue);
    } catch (e) {
      console.warn('Sync queue save error:', e);
    }
  }

  /**
   * Register state listener for UI components (e.g. Sync Health Widget)
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      listener(this.getQueueSummary());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners(queue = this.getQueue()) {
    const summary = this.getQueueSummary(queue);
    this.listeners.forEach(fn => {
      try { fn(summary); } catch (e) {}
    });
  }

  /**
   * Enqueue a local order transaction or update
   */
  enqueueTransaction(orderPayload, action = 'CREATE') {
    if (!orderPayload) return null;

    const localId = orderPayload.localId || orderPayload.id || orderPayload.orderNumber;
    const terminalId = orderPayload.terminalId || 'counter-1';
    const branchId = orderPayload.branchId || 'main';

    const queue = this.getQueue();

    // Check if task for same localId is already in queue
    const existingIndex = queue.findIndex(item => item.localId === localId);

    const queueItem = {
      localId,
      serverId: localId,
      action, // 'CREATE' | 'UPDATE' | 'PAYMENT'
      terminalId,
      branchId,
      payload: orderPayload,
      status: 'SYNC_PENDING',
      retryCount: 0,
      nextRetryTime: new Date().toISOString(),
      createdLocallyAt: new Date().toISOString(),
      lastError: null,
    };

    if (existingIndex >= 0) {
      // Merge updates, preserving paymentHistory & payload
      const oldItem = queue[existingIndex];
      const mergedPayload = {
        ...oldItem.payload,
        ...orderPayload,
        paymentHistory: this.mergePaymentHistories(oldItem.payload?.paymentHistory, orderPayload.paymentHistory),
        statusTimeline: this.mergeTimelines(oldItem.payload?.statusTimeline, orderPayload.statusTimeline),
      };
      queue[existingIndex] = {
        ...oldItem,
        payload: mergedPayload,
        action,
        status: 'SYNC_PENDING',
        retryCount: 0, // Reset backoff on new user action
        nextRetryTime: new Date().toISOString(),
      };
    } else {
      queue.push(queueItem);
    }

    this.saveQueue(queue);

    // Attempt immediate background sync if browser is online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.processQueue(), 50);
    }

    return queueItem;
  }

  /**
   * Helper to merge payment histories using paymentEventId (with timestamp_amount_mode fallback)
   */
  mergePaymentHistories(oldHist = [], newHist = []) {
    const map = new Map();
    [...(oldHist || []), ...(newHist || [])].forEach(h => {
      if (h) {
        const key = h.paymentEventId || h.id || `${h.timestamp}_${h.amount}_${h.mode}`;
        map.set(key, h);
      }
    });
    return Array.from(map.values());
  }

  /**
   * Reconstruct missing pending queue entries from local Windows JSON files (C:\TechWash\POS-XX\Data\YYYY-MM-DD.json)
   * Prevents losing unsynced bills if browser localStorage was cleared or corrupted.
   */
  async reconcileFromLocalFiles(dateKey = null) {
    try {
      const activeTerminalId = (typeof localStorage !== 'undefined' && localStorage.getItem('techwash_terminal_id')) || 'counter-1';
      const bridgeRes = await posBridgeService.getTransactions(dateKey, activeTerminalId);

      if (!bridgeRes.ok || !Array.isArray(bridgeRes.orders) || bridgeRes.orders.length === 0) {
        return { reconciledCount: 0 };
      }

      const queue = this.getQueue();
      const existingLocalIds = new Set(queue.map(item => item.localId));
      let count = 0;

      bridgeRes.orders.forEach(ord => {
        const lId = ord.localId || ord.id || ord.orderNumber;
        const sStatus = ord.syncStatus || 'LOCAL_SAVED';

        if (lId && sStatus !== 'SYNCED' && !existingLocalIds.has(lId)) {
          this.enqueueTransaction(ord, 'CREATE');
          count++;
        }
      });

      if (count > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        setTimeout(() => this.processQueue(), 100);
      }

      return { reconciledCount: count };
    } catch (e) {
      console.warn('Local file queue reconciliation notice:', e.message);
      return { reconciledCount: 0, error: e.message };
    }
  }

  /**
   * Helper to merge status timelines
   */
  mergeTimelines(oldTL = [], newTL = []) {
    const map = new Map();
    [...(oldTL || []), ...(newTL || [])].forEach(t => {
      if (t) {
        const key = `${t.stage}_${t.timestamp}`;
        map.set(key, t);
      }
    });
    return Array.from(map.values());
  }

  /**
   * Process pending items in sync queue
   */
  async processQueue() {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateTerminalHealthStatus('OFFLINE');
      return;
    }

    const queue = this.getQueue();
    const pendingItems = queue.filter(item => item.status === 'SYNC_PENDING' || item.status === 'SYNC_FAILED');

    if (pendingItems.length === 0) {
      this.updateTerminalHealthStatus('ONLINE');
      return;
    }

    this.isSyncing = true;
    this.updateTerminalHealthStatus('SYNCING');

    const now = new Date();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'SYNCED') continue;

      // Check backoff time
      if (item.nextRetryTime && new Date(item.nextRetryTime) > now) {
        continue;
      }

      try {
        const success = await this.syncItemToFirestore(item);
        if (success) {
          item.status = 'SYNCED';
          item.lastError = null;
          item.syncedAt = new Date().toISOString();

          // Also inform Local Bridge to update syncStatus in JSON & Excel
          try {
            await posBridgeService.saveTransaction({
              ...item.payload,
              syncStatus: 'SYNCED',
            }, item.terminalId);
          } catch (e) {}

        } else {
          item.status = 'SYNC_FAILED';
          item.retryCount = (item.retryCount || 0) + 1;
          const backoffMs = BACKOFF_STEPS_MS[Math.min(item.retryCount - 1, BACKOFF_STEPS_MS.length - 1)];
          item.nextRetryTime = new Date(Date.now() + backoffMs).toISOString();
        }
      } catch (err) {
        console.warn(`Sync item ${item.localId} failed:`, err.message);
        item.status = 'SYNC_FAILED';
        item.lastError = err.message;
        item.retryCount = (item.retryCount || 0) + 1;
        const backoffMs = BACKOFF_STEPS_MS[Math.min(item.retryCount - 1, BACKOFF_STEPS_MS.length - 1)];
        item.nextRetryTime = new Date(Date.now() + backoffMs).toISOString();
      }

      // Save progress after each item attempt
      this.saveQueue(queue);
    }

    this.isSyncing = false;
    
    // Check if any failed
    const remainingPending = this.getQueue().filter(i => i.status === 'SYNC_PENDING' || i.status === 'SYNC_FAILED');
    if (remainingPending.length === 0) {
      this.updateTerminalHealthStatus('ONLINE');
    } else {
      this.updateTerminalHealthStatus('ERROR');
    }
  }

  /**
   * Idempotent Firestore setDoc Write
   */
  async syncItemToFirestore(item) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase Firestore is not configured in client environment.');
    }

    const { localId, payload } = item;
    if (!localId || !payload) throw new Error('Invalid item payload for sync');

    const targetDocId = String(localId).trim();

    // 1. Conflict Check: Read remote document if it exists
    let remoteData = null;
    try {
      const docRef = doc(db, 'orders', targetDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        remoteData = snap.data();
      }
    } catch (e) {}

    // Conflict resolution: If remote data exists, merge paymentHistory & preserve timestamps
    let finalOrderPayload = { ...payload };

    if (remoteData) {
      const localUpdated = new Date(payload.updatedAt || payload.createdAt || 0).getTime();
      const remoteUpdated = new Date(remoteData.updatedAt || remoteData.createdAt || 0).getTime();

      // If remote is strictly newer, do NOT overwrite top-level metrics blindly
      if (remoteUpdated > localUpdated) {
        finalOrderPayload = {
          ...payload,
          ...remoteData,
          paymentHistory: this.mergePaymentHistories(remoteData.paymentHistory, payload.paymentHistory),
          statusTimeline: this.mergeTimelines(remoteData.statusTimeline, payload.statusTimeline),
          updatedAt: new Date(remoteUpdated).toISOString(),
          syncStatus: 'SYNCED',
        };
      } else {
        // Local is newer or equal: Merge payment histories
        finalOrderPayload.paymentHistory = this.mergePaymentHistories(remoteData.paymentHistory, payload.paymentHistory);
        finalOrderPayload.statusTimeline = this.mergeTimelines(remoteData.statusTimeline, payload.statusTimeline);
      }
    }

    finalOrderPayload.syncStatus = 'SYNCED';
    finalOrderPayload.syncTimestamp = new Date().toISOString();

    // 2. Perform Idempotent setDoc write to 'orders' collection
    try {
      await setDoc(doc(db, 'orders', targetDocId), finalOrderPayload, { merge: true });
    } catch (e) {
      if (e.code === 'permission-denied' || String(e.message).includes('PERMISSION_DENIED')) {
        console.warn(`Firestore order update notice for ${targetDocId} (document exists):`, e.message);
      } else {
        throw e;
      }
    }

    // Secondary collection sync: 'bookings' (non-blocking)
    try {
      await setDoc(doc(db, 'bookings', targetDocId), finalOrderPayload, { merge: true });
    } catch (e) {
      // Non-blocking secondary collection sync notice
    }

    // 3. Customer CRM Sync in Firestore
    const phone = finalOrderPayload.phone || finalOrderPayload.customer?.phone ? String(finalOrderPayload.phone || finalOrderPayload.customer.phone).replace(/\D/g, '') : '';
    if (phone) {
      try {
        const custRef = doc(db, 'customers', phone);
        const custSnap = await getDoc(custRef);
        const totalBilled = Number(finalOrderPayload.totalAmount || finalOrderPayload.finalPrice || 0);

        if (custSnap.exists()) {
          const cData = custSnap.data();
          await setDoc(custRef, {
            ...cData,
            name: finalOrderPayload.customerName || cData.name,
            address: finalOrderPayload.address || cData.address,
            lastOrderDate: finalOrderPayload.createdAt,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } else {
          await setDoc(custRef, {
            id: `cust-${phone}`,
            name: finalOrderPayload.customerName || 'Valued Customer',
            phone,
            whatsapp: finalOrderPayload.whatsapp || phone,
            address: finalOrderPayload.address || '',
            locality: finalOrderPayload.locality || '',
            city: finalOrderPayload.city || 'Hyderabad',
            orderCount: 1,
            totalSpent: totalBilled,
            firstOrderDate: finalOrderPayload.createdAt,
            lastOrderDate: finalOrderPayload.createdAt,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (e) {
        console.warn('Customer CRM sync notice:', e);
      }
    }

    return true;
  }

  /**
   * Update settings/terminal_sync_health in Firestore
   */
  async updateTerminalHealthStatus(status = 'ONLINE') {
    const queue = this.getQueue();
    const pendingCount = queue.filter(i => i.status === 'SYNC_PENDING').length;
    const failedCount = queue.filter(i => i.status === 'SYNC_FAILED').length;
    const syncedCount = queue.filter(i => i.status === 'SYNCED').length;

    const terminalId = typeof window !== 'undefined' && localStorage.getItem('techwash_terminal_id') || 'counter-1';
    const terminalCode = terminalId === 'counter-2' ? 'TW-POS-02' : (terminalId === 'counter-3' ? 'TW-POS-03' : 'TW-POS-01');
    const branchName = terminalId === 'counter-2' ? 'Branch 1 — Tolichowki' : (terminalId === 'counter-3' ? 'Pick Up Point — Ambience' : 'Main Branch — Manikonda');

    const healthData = {
      terminalId,
      terminalCode,
      branchName,
      status: failedCount > 0 ? 'ERROR' : (pendingCount > 0 ? 'SYNCING' : status),
      lastSync: new Date().toISOString(),
      lastSuccessfulSync: (syncedCount > 0 || pendingCount === 0) ? new Date().toISOString() : null,
      pendingCount,
      syncedCount,
      failedCount,
      updatedAt: new Date().toISOString(),
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TERMINAL_HEALTH_KEY, JSON.stringify(healthData));
    }

    if (isFirebaseConfigured && db) {
      try {
        const healthDocRef = doc(db, 'settings', 'terminal_sync_health');
        await setDoc(healthDocRef, {
          terminals: {
            [terminalId]: healthData
          }
        }, { merge: true });
      } catch (e) {
        // Non-critical
      }
    }
  }

  /**
   * Get queue summary counts
   */
  getQueueSummary(queue = this.getQueue()) {
    const pendingCount = queue.filter(i => i.status === 'SYNC_PENDING').length;
    const failedCount = queue.filter(i => i.status === 'SYNC_FAILED').length;
    const syncedCount = queue.filter(i => i.status === 'SYNCED').length;

    return {
      total: queue.length,
      pendingCount,
      failedCount,
      syncedCount,
      isSyncing: this.isSyncing,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }
}

export const syncQueueService = new SyncQueueService();
