/**
 * Tech Wash POS — Client-side IndexedDB Engine (TechWashPOS)
 * Persistent local-first transaction store & sync queue.
 * Permanent local business database for orders, payments, customers, dues, cancellations, refunds, serviceTransactions, syncQueue, reportSnapshots, and terminalSettings.
 */

const DB_NAME = 'TechWashPOS';
const DB_VERSION = 3;

class PosIndexedDB {
  constructor() {
    this.dbPromise = null;
  }

  /**
   * Opens / initializes the IndexedDB database and creates all 10 object stores
   */
  openDB() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onblocked = () => {
        console.warn('IndexedDB TechWashPOS upgrade blocked - please close other tabs');
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. Orders Store
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'localId' });
          orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          orderStore.createIndex('orderNumber', 'orderNumber', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
          orderStore.createIndex('terminalId', 'terminalId', { unique: false });
          orderStore.createIndex('phone', 'phone', { unique: false });
        }

        // 2. Payments Store
        if (!db.objectStoreNames.contains('payments')) {
          const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentStore.createIndex('localId', 'localId', { unique: false });
          paymentStore.createIndex('orderId', 'orderId', { unique: false });
          paymentStore.createIndex('createdAt', 'createdAt', { unique: false });
          paymentStore.createIndex('method', 'method', { unique: false });
        }

        // 3. Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('name', 'name', { unique: false });
        }

        // 4. Dues Store
        if (!db.objectStoreNames.contains('dues')) {
          const dueStore = db.createObjectStore('dues', { keyPath: 'id' });
          dueStore.createIndex('localId', 'localId', { unique: false });
          dueStore.createIndex('phone', 'phone', { unique: false });
          dueStore.createIndex('status', 'status', { unique: false });
        }

        // 5. Cancellations Store
        if (!db.objectStoreNames.contains('cancellations')) {
          const cancelStore = db.createObjectStore('cancellations', { keyPath: 'id' });
          cancelStore.createIndex('localId', 'localId', { unique: false });
          cancelStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 6. Refunds Store
        if (!db.objectStoreNames.contains('refunds')) {
          const refundStore = db.createObjectStore('refunds', { keyPath: 'id' });
          refundStore.createIndex('localId', 'localId', { unique: false });
          refundStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 7. Service Transactions Store
        if (!db.objectStoreNames.contains('serviceTransactions')) {
          const srvTxStore = db.createObjectStore('serviceTransactions', { keyPath: 'id' });
          srvTxStore.createIndex('localId', 'localId', { unique: false });
          srvTxStore.createIndex('category', 'category', { unique: false });
          srvTxStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 8. Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'localId' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('nextRetryTime', 'nextRetryTime', { unique: false });
          queueStore.createIndex('createdLocallyAt', 'createdLocallyAt', { unique: false });
        }

        // 9. Report Snapshots Store
        if (!db.objectStoreNames.contains('reportSnapshots')) {
          const reportStore = db.createObjectStore('reportSnapshots', { keyPath: 'id' });
          reportStore.createIndex('reportDate', 'reportDate', { unique: false });
          reportStore.createIndex('date', 'date', { unique: false });
          reportStore.createIndex('branchFilter', 'branchFilter', { unique: false });
          reportStore.createIndex('createdAt', 'createdAt', { unique: false });
        } else {
          try {
            const reportStore = event.target.transaction.objectStore('reportSnapshots');
            if (!reportStore.indexNames.contains('date')) {
              reportStore.createIndex('date', 'date', { unique: false });
            }
            if (!reportStore.indexNames.contains('branchFilter')) {
              reportStore.createIndex('branchFilter', 'branchFilter', { unique: false });
            }
          } catch (e) {}
        }

        // 10. Terminal Settings Store
        if (!db.objectStoreNames.contains('terminalSettings')) {
          const settingsStore = db.createObjectStore('terminalSettings', { keyPath: 'id' });
          settingsStore.createIndex('key', 'key', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        this.dbPromise = null;
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  // --- GENERIC STORE METHODS ---

  async saveItem(storeName, item, keyField = 'id') {
    if (!item) return null;
    const db = await this.openDB();
    const keyVal = item[keyField] || item.localId || item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      ...item,
      [keyField]: keyVal,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getItem(storeName, key) {
    if (!key) return null;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllItems(storeName) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteItem(storeName, key) {
    if (!key) return false;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async clearStore(storeName) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async saveBulkItems(storeName, items, keyField = 'id') {
    if (!items || !items.length) return [];
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      tx.oncomplete = () => resolve(items);
      tx.onerror = (e) => reject(e.target.error);

      for (const item of items) {
        if (!item) continue;
        const keyVal = item[keyField] || item.localId || item.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = {
          ...item,
          [keyField]: keyVal,
          updatedAt: item.updatedAt || new Date().toISOString(),
        };
        store.put(record);
      }
    });
  }

  async countItems(storeName) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // --- ORDERS STORE METHODS ---

  async saveOrder(order) {
    if (!order) return null;
    const db = await this.openDB();
    const localId = order.localId || order.id || order.orderNumber;
    const record = {
      ...order,
      localId,
      id: order.id || localId,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readwrite');
      const store = tx.objectStore('orders');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getOrder(localId) {
    if (!localId) return null;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const req = store.get(localId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllOrders() {
    return this.getAllItems('orders');
  }

  async getOrdersBySyncStatus(syncStatus) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const index = store.index('syncStatus');
      const req = index.getAll(syncStatus);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async updateOrderStatus(localId, syncStatus, extraData = {}) {
    const order = await this.getOrder(localId);
    if (!order) return null;
    const updated = {
      ...order,
      ...extraData,
      syncStatus,
      updatedAt: new Date().toISOString(),
    };
    return this.saveOrder(updated);
  }

  // --- CUSTOMERS STORE METHODS ---

  async saveCustomer(customer) {
    if (!customer) return null;
    const db = await this.openDB();
    const phone = customer.phone ? String(customer.phone).replace(/\D/g, '') : '';
    const id = customer.id || `cust-${phone || Math.random().toString(36).substring(2, 8)}`;
    const record = {
      ...customer,
      id,
      phone,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getCustomer(idOrPhone) {
    if (!idOrPhone) return null;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readonly');
      const store = tx.objectStore('customers');
      const req = store.get(idOrPhone);

      req.onsuccess = () => {
        if (req.result) return resolve(req.result);

        // Try index lookup by phone
        const phoneIdx = store.index('phone');
        const phoneReq = phoneIdx.get(idOrPhone);
        phoneReq.onsuccess = () => resolve(phoneReq.result || null);
        phoneReq.onerror = () => resolve(null);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllCustomers() {
    return this.getAllItems('customers');
  }

  // --- PAYMENTS STORE METHODS ---

  async savePayment(payment) {
    if (!payment) return null;
    const db = await this.openDB();
    const id = payment.id || `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      ...payment,
      id,
      createdAt: payment.createdAt || new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('payments', 'readwrite');
      const store = tx.objectStore('payments');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getPaymentsForOrder(localId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('payments', 'readonly');
      const store = tx.objectStore('payments');
      const index = store.index('localId');
      const req = index.getAll(localId);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllPayments() {
    return this.getAllItems('payments');
  }

  // --- DUES STORE METHODS ---

  async saveDue(due) {
    return this.saveItem('dues', due, 'id');
  }

  async getAllDues() {
    return this.getAllItems('dues');
  }

  // --- CANCELLATIONS STORE METHODS ---

  async saveCancellation(cancellation) {
    return this.saveItem('cancellations', cancellation, 'id');
  }

  async getAllCancellations() {
    return this.getAllItems('cancellations');
  }

  // --- REFUNDS STORE METHODS ---

  async saveRefund(refund) {
    return this.saveItem('refunds', refund, 'id');
  }

  async getAllRefunds() {
    return this.getAllItems('refunds');
  }

  // --- SERVICE TRANSACTIONS STORE METHODS ---

  async saveServiceTransaction(txData) {
    return this.saveItem('serviceTransactions', txData, 'id');
  }

  async getAllServiceTransactions() {
    return this.getAllItems('serviceTransactions');
  }

  // --- REPORT SNAPSHOTS STORE METHODS ---

  async saveReportSnapshot(snapshot) {
    if (!snapshot) return null;
    const id = snapshot.id || snapshot.snapshotId || `shift_${snapshot.date || snapshot.reportDate || Date.now()}_${snapshot.branchFilter || snapshot.terminalId || 'all'}`;
    const record = {
      ...snapshot,
      id,
      savedAt: snapshot.savedAt || new Date().toISOString(),
    };
    try {
      return await this.saveItem('reportSnapshots', record, 'id');
    } catch (e) {
      console.warn('posIndexedDB saveReportSnapshot notice:', e);
      return record;
    }
  }

  async getAllReportSnapshots() {
    try {
      return await this.getAllItems('reportSnapshots');
    } catch (e) {
      console.warn('posIndexedDB getAllReportSnapshots notice:', e);
      return [];
    }
  }

  async getReportSnapshot(id) {
    if (!id) return null;
    try {
      return await this.getItem('reportSnapshots', id);
    } catch (e) {
      console.warn('posIndexedDB getReportSnapshot notice:', e);
      return null;
    }
  }

  async getReportSnapshotsByDate(dateStr) {
    if (!dateStr) return [];
    try {
      const all = await this.getAllReportSnapshots();
      return (all || []).filter(s => s && (s.date === dateStr || s.reportDate === dateStr || String(s.id).includes(dateStr)));
    } catch (e) {
      return [];
    }
  }

  // --- SYNC QUEUE STORE METHODS ---

  async saveSyncItem(queueItem) {
    if (!queueItem || !queueItem.localId) return null;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const req = store.put(queueItem);

      req.onsuccess = () => resolve(queueItem);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getSyncQueue() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteSyncItem(localId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      const req = store.delete(localId);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // --- TERMINAL SETTINGS STORE METHODS ---

  async saveTerminalSetting(key, value) {
    const db = await this.openDB();
    const record = { id: key, key, value, updatedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction('terminalSettings', 'readwrite');
      const store = tx.objectStore('terminalSettings');
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getTerminalSetting(key) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('terminalSettings', 'readonly');
      const store = tx.objectStore('terminalSettings');
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

export const posIndexedDB = new PosIndexedDB();
