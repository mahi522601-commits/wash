/**
 * Tech Wash Local-First Data Access Repository (localDbService)
 * Primary source of truth for POS and local admin UI dashboards.
 * Wraps IndexedDB operations so UI components never directly depend on raw IndexedDB or Firestore.
 */

import { posIndexedDB } from './posIndexedDB.js';

export const localDbService = {
  /**
   * Save order to permanent local IndexedDB store FIRST
   */
  async saveLocalOrder(order) {
    if (!order) return null;
    const localId = order.localId || order.id || order.orderNumber;
    const syncStatus = order.syncStatus || 'LOCAL_SAVED';
    
    const record = {
      ...order,
      localId,
      id: order.id || localId,
      syncStatus,
      createdLocallyAt: order.createdLocallyAt || order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await posIndexedDB.saveOrder(record);

    // Also extract and store customer if present
    if (order.customer || order.customerPhone || order.phone) {
      try {
        const phone = order.customerPhone || order.phone || order.customer?.phone;
        const name = order.customerName || order.customer?.name || 'Walk-in Customer';
        if (phone) {
          await this.saveLocalCustomer({
            id: order.customerId || order.customer?.id || `cust-${String(phone).replace(/\D/g, '')}`,
            name,
            phone: String(phone).replace(/\D/g, ''),
            address: order.customerAddress || order.customer?.address || '',
          });
        }
      } catch (e) {
        console.warn('Customer auto-save error:', e);
      }
    }

    // Extract and store payment if present
    if (order.receivedAmount > 0 || order.paymentMethod) {
      try {
        await this.saveLocalPayment({
          id: `pay-${localId}-${Date.now()}`,
          localId,
          orderId: order.id || localId,
          amount: Number(order.receivedAmount || order.totalAmount || 0),
          method: order.paymentMethod || 'CASH',
          createdAt: order.createdAt || new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Payment auto-save error:', e);
      }
    }

    // Extract and store due if balance is pending
    if (order.balanceAmount > 0 || order.paymentStatus === 'PARTIAL' || order.paymentStatus === 'UNPAID') {
      try {
        await posIndexedDB.saveDue({
          id: `due-${localId}`,
          localId,
          orderNumber: order.orderNumber,
          phone: order.customerPhone || order.phone,
          customerName: order.customerName || order.customer?.name,
          totalAmount: Number(order.totalAmount || 0),
          balanceAmount: Number(order.balanceAmount || 0),
          status: order.paymentStatus || 'UNPAID',
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Due auto-save error:', e);
      }
    }

    return saved;
  },

  /**
   * Get single local order by ID
   */
  async getLocalOrder(localId) {
    return posIndexedDB.getOrder(localId);
  },

  /**
   * Get all orders from local IndexedDB
   */
  async getLocalOrders() {
    return posIndexedDB.getAllOrders();
  },

  /**
   * Get all customers from local IndexedDB
   */
  async getLocalCustomers() {
    return posIndexedDB.getAllCustomers();
  },

  /**
   * Save customer to local IndexedDB
   */
  async saveLocalCustomer(customer) {
    return posIndexedDB.saveCustomer(customer);
  },

  /**
   * Get all payments from local IndexedDB
   */
  async getLocalPayments() {
    return posIndexedDB.getAllPayments();
  },

  /**
   * Save payment to local IndexedDB
   */
  async saveLocalPayment(payment) {
    return posIndexedDB.savePayment(payment);
  },

  /**
   * Get all due bills from local IndexedDB
   */
  async getLocalDueBills() {
    return posIndexedDB.getAllDues();
  },

  /**
   * Get all pending sync items from IndexedDB sync queue
   */
  async getPendingSyncRecords() {
    return posIndexedDB.getSyncQueue();
  },

  /**
   * Mark order as SYNCED in local IndexedDB
   */
  async markSynced(localId, cloudData = {}) {
    return posIndexedDB.updateOrderStatus(localId, 'SYNCED', {
      syncedAt: new Date().toISOString(),
      ...cloudData,
    });
  },

  /**
   * Mark order sync as FAILED in local IndexedDB
   */
  async markSyncFailed(localId, errorMsg = '') {
    return posIndexedDB.updateOrderStatus(localId, 'SYNC_FAILED', {
      lastSyncError: errorMsg,
      failedAt: new Date().toISOString(),
    });
  },

  /**
   * Save terminal setting to local IndexedDB
   */
  async saveTerminalSetting(key, value) {
    return posIndexedDB.saveTerminalSetting(key, value);
  },

  /**
   * Get terminal setting from local IndexedDB
   */
  async getTerminalSetting(key) {
    return posIndexedDB.getTerminalSetting(key);
  },

  /**
   * Request browser persistent storage permission (navigator.storage.persist)
   * Prevents browser from evicting TechWashPOS IndexedDB data under storage pressure.
   */
  async requestPersistentStorage() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log(`[TechWashPOS] Persistent storage permission: ${isPersisted ? 'GRANTED' : 'DEFAULT'}`);
        return { granted: isPersisted, isPersisted };
      } catch (err) {
        console.warn('[TechWashPOS] Persistent storage request notice:', err);
        return { granted: false, isPersisted: false };
      }
    }
    return { granted: false, isPersisted: false };
  },

  /**
   * Check if persistent storage is already granted by browser
   */
  async isStoragePersisted() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch (err) {
        return false;
      }
    }
    return false;
  },

  /**
   * Get storage telemetry: record counts across all 10 object stores & browser storage quota
   */
  async getStorageStats() {
    let quota = 0;
    let usage = 0;
    let isPersisted = false;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      try {
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          usage = estimate.usage || 0;
          quota = estimate.quota || 0;
        }
        if (navigator.storage.persisted) {
          isPersisted = await navigator.storage.persisted();
        }
      } catch (e) {}
    }

    let orderCount = 0, customerCount = 0, paymentCount = 0, dueCount = 0, settingsCount = 0;
    try {
      [orderCount, customerCount, paymentCount, dueCount, settingsCount] = await Promise.all([
        posIndexedDB.countItems('orders').catch(() => 0),
        posIndexedDB.countItems('customers').catch(() => 0),
        posIndexedDB.countItems('payments').catch(() => 0),
        posIndexedDB.countItems('dues').catch(() => 0),
        posIndexedDB.countItems('terminalSettings').catch(() => 0),
      ]);
    } catch (e) {}

    return {
      isPersisted,
      usage,
      quota,
      orderCount,
      customerCount,
      paymentCount,
      dueCount,
      settingsCount,
    };
  },

  /**
   * Master Sync Engine: Pulls ALL cloud data from Firebase Firestore
   * and saves it into the browser's IndexedDB (TechWashPOS) stores.
   * Works on both localhost and production (techwashlaundry.com/admin).
   */
  async syncAllCloudDataToLocalDb(onProgress = null) {
    const notify = (msg) => {
      if (typeof onProgress === 'function') onProgress(msg);
    };

    notify('Requesting persistent storage permission...');
    await this.requestPersistentStorage();

    const { db, isFirebaseConfigured } = await import('./firebase.js');
    if (!isFirebaseConfigured || !db) {
      console.warn('[TechWashPOS] Cloud not configured or offline. Keeping local records.');
      return { success: false, reason: 'OFFLINE_OR_UNCONFIGURED', stats: await this.getStorageStats() };
    }

    const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');

    notify('Fetching business orders from cloud...');
    const orderMap = new Map();
    const customerMap = new Map();
    const paymentMap = new Map();
    const dueMap = new Map();
    const serviceTxList = [];
    const cancellationList = [];
    const refundList = [];

    // 1. Fetch from 'orders' collection
    try {
      const snap = await getDocs(collection(db, 'orders'));
      snap.docs.forEach(d => {
        const data = d.data();
        const key = data.orderNumber || data.id || d.id;
        if (key) orderMap.set(String(key).toUpperCase().trim(), { ...data, id: data.id || d.id, localId: data.localId || data.id || d.id, syncStatus: 'SYNCED' });
      });
    } catch (e) {
      console.warn('[TechWashPOS] Orders collection read notice:', e);
    }

    // 2. Fetch from 'bookings' collection
    try {
      const bSnap = await getDocs(collection(db, 'bookings'));
      bSnap.docs.forEach(d => {
        const data = d.data();
        const key = data.orderNumber || data.id || d.id;
        if (key && !orderMap.has(String(key).toUpperCase().trim())) {
          orderMap.set(String(key).toUpperCase().trim(), { ...data, id: data.id || d.id, localId: data.localId || data.id || d.id, syncStatus: 'SYNCED' });
        }
      });
    } catch (e) {
      console.warn('[TechWashPOS] Bookings collection read notice:', e);
    }

    const allOrders = Array.from(orderMap.values());
    notify(`Processing ${allOrders.length} orders for internal storage...`);

    // Process orders: extract customers, payments, dues, transactions
    for (const order of allOrders) {
      const localId = order.localId || order.id || order.orderNumber;

      // Extract customer
      const phone = order.customerPhone || order.phone || order.customer?.phone;
      if (phone) {
        const normPhone = String(phone).replace(/\D/g, '');
        const existing = customerMap.get(normPhone) || {
          id: order.customerId || order.customer?.id || `cust-${normPhone}`,
          phone: normPhone,
          name: order.customerName || order.customer?.name || 'Customer',
          address: order.customerAddress || order.customer?.address || order.address || '',
          locality: order.locality || order.customer?.locality || '',
          city: order.city || order.customer?.city || 'Hyderabad',
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt || new Date().toISOString(),
          firstOrderDate: order.createdAt || new Date().toISOString(),
        };
        existing.orderCount = (existing.orderCount || 0) + 1;
        existing.totalSpent = (existing.totalSpent || 0) + Number(order.totalAmount || order.finalPrice || 0);
        if (order.createdAt && (!existing.lastOrderDate || order.createdAt > existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        customerMap.set(normPhone, existing);
      }

      // Extract payments
      if (Array.isArray(order.paymentHistory) && order.paymentHistory.length > 0) {
        order.paymentHistory.forEach((p, idx) => {
          const payId = p.id || `pay-${localId}-${idx}`;
          paymentMap.set(payId, {
            ...p,
            id: payId,
            localId,
            orderId: order.id || localId,
            amount: Number(p.amount || 0),
            method: p.method || order.paymentMethod || 'CASH',
            createdAt: p.timestamp || p.createdAt || order.createdAt || new Date().toISOString(),
          });
        });
      } else if (order.receivedAmount > 0 || order.paymentMethod) {
        const payId = `pay-${localId}-initial`;
        paymentMap.set(payId, {
          id: payId,
          localId,
          orderId: order.id || localId,
          amount: Number(order.receivedAmount || order.totalAmount || 0),
          method: order.paymentMethod || 'CASH',
          createdAt: order.createdAt || new Date().toISOString(),
        });
      }

      // Extract dues
      const bal = Number(order.balanceAmount || 0);
      if (bal > 0 || order.paymentStatus === 'PARTIAL' || order.paymentStatus === 'UNPAID') {
        dueMap.set(`due-${localId}`, {
          id: `due-${localId}`,
          localId,
          orderNumber: order.orderNumber,
          phone: phone || '',
          customerName: order.customerName || order.customer?.name || 'Customer',
          totalAmount: Number(order.totalAmount || order.finalPrice || 0),
          balanceAmount: bal,
          status: order.paymentStatus || 'UNPAID',
          updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
        });
      }

      // Extract cancellations
      if (order.status === 'CANCELLED' || order.customerStage === 'CANCELLED') {
        cancellationList.push({
          id: `cancel-${localId}`,
          localId,
          orderNumber: order.orderNumber,
          reason: order.notes || order.adminNotes || 'Cancelled',
          createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
        });
      }

      // Extract refunds
      if (order.status === 'REFUNDED' || Number(order.refundAmount || 0) > 0) {
        refundList.push({
          id: `refund-${localId}`,
          localId,
          orderNumber: order.orderNumber,
          amount: Number(order.refundAmount || order.receivedAmount || 0),
          createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
        });
      }

      // Extract service transactions
      if (Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item, idx) => {
          serviceTxList.push({
            id: `srv-${localId}-${idx}`,
            localId,
            serviceName: item.name || order.serviceName || 'Laundry',
            category: item.category || 'Laundry',
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
            createdAt: order.createdAt || new Date().toISOString(),
          });
        });
      }
    }

    // 3. Fetch from direct 'customers' collection
    notify('Syncing customer profiles...');
    try {
      const cSnap = await getDocs(collection(db, 'customers'));
      cSnap.docs.forEach(d => {
        const data = d.data();
        const phone = data.phone || d.id;
        if (phone) {
          const normPhone = String(phone).replace(/\D/g, '');
          const existing = customerMap.get(normPhone) || {};
          customerMap.set(normPhone, {
            ...existing,
            id: data.id || d.id,
            phone: normPhone,
            name: data.name || existing.name || 'Customer',
            email: data.email || existing.email || '',
            address: data.address || existing.address || '',
            locality: data.locality || existing.locality || '',
            city: data.city || existing.city || 'Hyderabad',
            orderCount: Math.max(Number(data.orderCount || 0), Number(existing.orderCount || 0)),
            totalSpent: Math.max(Number(data.totalSpent || 0), Number(existing.totalSpent || 0)),
          });
        }
      });
    } catch (e) {
      console.warn('[TechWashPOS] Customers collection read notice:', e);
    }

    // 4. Fetch direct 'payments' collection if present
    try {
      const pSnap = await getDocs(collection(db, 'payments'));
      pSnap.docs.forEach(d => {
        const data = d.data();
        const id = data.id || d.id;
        if (id) paymentMap.set(id, { ...data, id });
      });
    } catch (e) {}

    // 5. Fetch Settings & Configuration documents
    notify('Syncing business configuration & report settings...');
    const settingsToSave = [];
    const settingsDocs = [
      { col: 'settings', docId: 'daily_report', key: 'daily_report' },
      { col: 'settings', docId: 'daily_report_schedule', key: 'daily_report_schedule' },
      { col: 'settings', docId: 'pricing', key: 'pricing' },
      { col: 'settings', docId: 'services', key: 'services' },
      { col: 'settings', docId: 'locations', key: 'locations' },
      { col: 'settings', docId: 'terminal_sync_health', key: 'terminal_sync_health' },
    ];

    for (const item of settingsDocs) {
      try {
        const snap = await getDoc(doc(db, item.col, item.docId));
        if (snap.exists()) {
          settingsToSave.push({
            id: item.key,
            key: item.key,
            value: snap.data(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (e) {}
    }

    // 6. Bulk Save to IndexedDB stores
    notify('Writing all business records to internal IndexedDB (TechWashPOS)...');
    const customerList = Array.from(customerMap.values());
    const paymentList = Array.from(paymentMap.values());
    const dueList = Array.from(dueMap.values());

    await Promise.all([
      allOrders.length > 0 ? posIndexedDB.saveBulkItems('orders', allOrders, 'localId') : Promise.resolve(),
      customerList.length > 0 ? posIndexedDB.saveBulkItems('customers', customerList, 'id') : Promise.resolve(),
      paymentList.length > 0 ? posIndexedDB.saveBulkItems('payments', paymentList, 'id') : Promise.resolve(),
      dueList.length > 0 ? posIndexedDB.saveBulkItems('dues', dueList, 'id') : Promise.resolve(),
      serviceTxList.length > 0 ? posIndexedDB.saveBulkItems('serviceTransactions', serviceTxList, 'id') : Promise.resolve(),
      cancellationList.length > 0 ? posIndexedDB.saveBulkItems('cancellations', cancellationList, 'id') : Promise.resolve(),
      refundList.length > 0 ? posIndexedDB.saveBulkItems('refunds', refundList, 'id') : Promise.resolve(),
      settingsToSave.length > 0 ? posIndexedDB.saveBulkItems('terminalSettings', settingsToSave, 'id') : Promise.resolve(),
    ]);

    const finalStats = await this.getStorageStats();
    notify(`Internal storage populated: ${finalStats.orderCount} Orders, ${finalStats.customerCount} Customers, ${finalStats.paymentCount} Payments.`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-internal-storage-synced', { detail: finalStats }));
    }

    return {
      success: true,
      stats: finalStats,
      added: {
        orders: allOrders.length,
        customers: customerList.length,
        payments: paymentList.length,
        dues: dueList.length,
        settings: settingsToSave.length,
      }
    };
  }
};

export default localDbService;
