/**
 * Tech Wash Offline Synchronization Queue & Terminal Health Service
 * IndexedDB Primary Store: Persistent offline sync queue and terminal health engine.
 * Idempotent Firestore setDoc writes, exponential backoff, and live sync status monitoring.
 */

import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { posIndexedDB } from './posIndexedDB.js';
import { posBridgeService } from './posBridgeService.js';

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
    this.memoryQueue = [];
    this.terminalHealthStatus = 'ONLINE';
    this.initQueue();
  }

  async initQueue() {
    if (typeof window !== 'undefined') {
      try {
        await this.loadQueueFromDB();
        await this.reconcileFromIndexedDB();
      } catch (e) {
        console.warn('IndexedDB sync queue init notice:', e);
      }

      // Background retry loop every 30 seconds
      this.startAutoSyncTimer(30000);

      // Listen for browser online event to trigger immediate retry
      window.addEventListener('online', () => {
        console.log('🌐 Browser online event detected. Triggering IndexedDB sync queue retry...');
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
   * Load queue from IndexedDB store into memory
   */
  async loadQueueFromDB() {
    try {
      this.memoryQueue = await posIndexedDB.getSyncQueue();
      this.notifyListeners(this.memoryQueue);
      return this.memoryQueue;
    } catch (e) {
      console.warn('Sync queue load from IndexedDB error:', e);
      return this.memoryQueue;
    }
  }

  /**
   * Get current queue array
   */
  getQueue() {
    return this.memoryQueue || [];
  }

  /**
   * Get summary metrics for UI widgets
   */
  getQueueSummary(queue = this.getQueue()) {
    const list = Array.isArray(queue) ? queue : [];
    const pendingCount = list.filter(i => i.status === 'SYNC_PENDING').length;
    const syncingCount = list.filter(i => i.status === 'SYNCING').length;
    const failedCount = list.filter(i => i.status === 'SYNC_FAILED').length;
    const syncedCount = list.filter(i => i.status === 'SYNCED').length;

    return {
      totalCount: list.length,
      pendingCount,
      syncingCount,
      failedCount,
      syncedCount,
      isSyncing: this.isSyncing,
      terminalStatus: this.terminalHealthStatus,
    };
  }

  /**
   * Register state listener for UI components (e.g. TerminalSyncHealthWidget)
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
   * Enqueue a local order transaction or update in IndexedDB
   */
  async enqueueTransaction(orderPayload, action = 'CREATE') {
    if (!orderPayload) return null;

    const localId = orderPayload.localId || orderPayload.id || orderPayload.orderNumber;
    const terminalId = orderPayload.terminalId || 'counter-1';
    const branchId = orderPayload.branchId || 'main';

    // 1. Ensure order is saved to IndexedDB orders store
    try {
      await posIndexedDB.saveOrder({
        ...orderPayload,
        syncStatus: 'LOCAL_SAVED',
      });
    } catch (e) {
      console.warn('IndexedDB order save error during enqueue:', e);
    }

    // 2. Check if item is already in queue memory
    const existingIndex = this.memoryQueue.findIndex(item => item.localId === localId);

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
      const oldItem = this.memoryQueue[existingIndex];
      const mergedPayload = {
        ...oldItem.payload,
        ...orderPayload,
        paymentHistory: this.mergePaymentHistories(oldItem.payload?.paymentHistory, orderPayload.paymentHistory),
        statusTimeline: this.mergeTimelines(oldItem.payload?.statusTimeline, orderPayload.statusTimeline),
      };
      const updatedQueueItem = {
        ...oldItem,
        payload: mergedPayload,
        action,
        status: 'SYNC_PENDING',
        retryCount: 0,
        nextRetryTime: new Date().toISOString(),
      };
      this.memoryQueue[existingIndex] = updatedQueueItem;
      await posIndexedDB.saveSyncItem(updatedQueueItem);
    } else {
      this.memoryQueue.push(queueItem);
      await posIndexedDB.saveSyncItem(queueItem);
    }

    this.notifyListeners(this.memoryQueue);

    // Attempt immediate background sync if browser is online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.processQueue(), 50);
    }

    return queueItem;
  }

  /**
   * Self-healing recovery: Scans IndexedDB 'orders' store for any unsynced bills
   * and ensures they exist in the IndexedDB 'syncQueue'.
   */
  async reconcileFromIndexedDB() {
    try {
      const allOrders = await posIndexedDB.getAllOrders();
      const existingQueueIds = new Set(this.memoryQueue.map(item => item.localId));
      let count = 0;

      for (const ord of allOrders) {
        const lId = ord.localId || ord.id || ord.orderNumber;
        const sStatus = ord.syncStatus || 'LOCAL_SAVED';

        if (lId && sStatus !== 'SYNCED' && !existingQueueIds.has(lId)) {
          await this.enqueueTransaction(ord, 'CREATE');
          count++;
        }
      }

      if (count > 0 && typeof navigator !== 'undefined' && navigator.onLine) {
        setTimeout(() => this.processQueue(), 100);
      }

      return { reconciledCount: count };
    } catch (e) {
      console.warn('IndexedDB queue reconciliation notice:', e.message);
      return { reconciledCount: 0, error: e.message };
    }
  }

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
   * Process pending items in IndexedDB sync queue
   */
  async processQueue() {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.terminalHealthStatus = 'OFFLINE';
      this.notifyListeners(this.memoryQueue);
      return;
    }

    await this.loadQueueFromDB();
    const pendingItems = this.memoryQueue.filter(item => item.status === 'SYNC_PENDING' || item.status === 'SYNC_FAILED');

    if (pendingItems.length === 0) {
      this.terminalHealthStatus = 'ONLINE';
      this.notifyListeners(this.memoryQueue);
      return;
    }

    this.isSyncing = true;
    this.terminalHealthStatus = 'SYNCING';
    this.notifyListeners(this.memoryQueue);

    const now = new Date();

    for (let i = 0; i < this.memoryQueue.length; i++) {
      const item = this.memoryQueue[i];
      if (item.status === 'SYNCED') continue;

      // Check backoff time
      if (item.nextRetryTime && new Date(item.nextRetryTime) > now) {
        continue;
      }

      item.status = 'SYNCING';
      await posIndexedDB.saveSyncItem(item);
      this.notifyListeners(this.memoryQueue);

      try {
        const success = await this.syncItemToFirestore(item);
        if (success) {
          item.status = 'SYNCED';
          item.lastError = null;
          item.syncedAt = new Date().toISOString();

          // Update order status in IndexedDB
          await posIndexedDB.updateOrderStatus(item.localId, 'SYNCED', {
            syncTimestamp: item.syncedAt,
          });

          // Save item in IndexedDB queue
          await posIndexedDB.saveSyncItem(item);

          // Inform Local Bridge for PDF & Excel update
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
          await posIndexedDB.saveSyncItem(item);
          await posIndexedDB.updateOrderStatus(item.localId, 'SYNC_FAILED', {
            lastSyncError: item.lastError,
          });
        }
      } catch (err) {
        console.warn(`Sync item ${item.localId} failed:`, err.message);
        item.status = 'SYNC_FAILED';
        item.lastError = err.message;
        item.retryCount = (item.retryCount || 0) + 1;
        const backoffMs = BACKOFF_STEPS_MS[Math.min(item.retryCount - 1, BACKOFF_STEPS_MS.length - 1)];
        item.nextRetryTime = new Date(Date.now() + backoffMs).toISOString();
        await posIndexedDB.saveSyncItem(item);
        await posIndexedDB.updateOrderStatus(item.localId, 'SYNC_FAILED', {
          lastSyncError: err.message,
        });
      }
    }

    this.isSyncing = false;
    
    // Check remaining pending items
    const remainingPending = this.memoryQueue.filter(i => i.status === 'SYNC_PENDING' || i.status === 'SYNC_FAILED');
    if (remainingPending.length === 0) {
      this.terminalHealthStatus = 'ONLINE';
    } else {
      this.terminalHealthStatus = 'ERROR';
    }
    this.notifyListeners(this.memoryQueue);
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

    let finalOrderPayload = { ...payload };

    if (remoteData) {
      const localUpdated = new Date(payload.updatedAt || payload.createdAt || 0).getTime();
      const remoteUpdated = new Date(remoteData.updatedAt || remoteData.createdAt || 0).getTime();

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
        console.warn(`Firestore order update notice for ${targetDocId}:`, e.message);
      } else {
        throw e;
      }
    }

    // Secondary collection sync: 'bookings' (non-blocking)
    try {
      await setDoc(doc(db, 'bookings', targetDocId), finalOrderPayload, { merge: true });
    } catch (e) {}

    // 3. Customer CRM Sync in Firestore
    const phone = finalOrderPayload.phone || finalOrderPayload.customer?.phone ? String(finalOrderPayload.phone || finalOrderPayload.customer.phone).replace(/\D/g, '') : '';
    if (phone) {
      try {
        const custRef = doc(db, 'customers', phone);
        const custSnap = await getDoc(custRef);

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
            address: finalOrderPayload.address || '',
            createdAt: finalOrderPayload.createdAt,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (e) {}
    }

    return true;
  }
}

export const syncQueueService = new SyncQueueService();
