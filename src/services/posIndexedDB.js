/**
 * Tech Wash POS — Client-side IndexedDB Engine (TechWashPOS)
 * Persistent local-first transaction store & sync queue.
 * Replaces local JSON transaction files with standard browser IndexedDB storage.
 */

const DB_NAME = 'TechWashPOS';
const DB_VERSION = 1;

class PosIndexedDB {
  constructor() {
    this.dbPromise = null;
  }

  /**
   * Opens / initializes the IndexedDB database and creates all 5 object stores
   */
  openDB() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

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
        }

        // 3. Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('name', 'name', { unique: false });
        }

        // 4. Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'localId' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('nextRetryTime', 'nextRetryTime', { unique: false });
          queueStore.createIndex('createdLocallyAt', 'createdLocallyAt', { unique: false });
        }

        // 5. Terminal Settings Store
        if (!db.objectStoreNames.contains('terminalSettings')) {
          const settingsStore = db.createObjectStore('terminalSettings', { keyPath: 'id' });
          settingsStore.createIndex('key', 'key', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
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
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('orders', 'readonly');
      const store = tx.objectStore('orders');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
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
