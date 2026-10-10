/**
 * Verification Script: Tech Wash Internal Storage & Auto-Hydration Architecture
 * Validates IndexedDB tables, persistent storage request, bulk operations, and auto-sync.
 */

// In-memory IndexedDB mock for Node.js execution
class MockObjectStore {
  constructor(name) {
    this.name = name;
    this.data = new Map();
    this.indices = new Map();
  }
  createIndex(name, keyPath, options) {
    this.indices.set(name, { keyPath, options });
  }
  index(name) {
    return {
      getAll: (val) => {
        const req = { onsuccess: null, onerror: null, result: [] };
        setTimeout(() => {
          req.result = Array.from(this.data.values());
          if (req.onsuccess) req.onsuccess({ target: req });
        }, 1);
        return req;
      },
      get: (val) => {
        const req = { onsuccess: null, onerror: null, result: null };
        setTimeout(() => {
          req.result = Array.from(this.data.values())[0] || null;
          if (req.onsuccess) req.onsuccess({ target: req });
        }, 1);
        return req;
      }
    };
  }
  put(item) {
    const req = { onsuccess: null, onerror: null };
    const key = item.localId || item.id || `key-${Date.now()}`;
    this.data.set(key, item);
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
  get(key) {
    const req = { onsuccess: null, onerror: null, result: null };
    setTimeout(() => {
      req.result = this.data.get(key) || null;
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
  getAll() {
    const req = { onsuccess: null, onerror: null, result: [] };
    setTimeout(() => {
      req.result = Array.from(this.data.values());
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
  delete(key) {
    const req = { onsuccess: null, onerror: null };
    this.data.delete(key);
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
  count() {
    const req = { onsuccess: null, onerror: null, result: 0 };
    setTimeout(() => {
      req.result = this.data.size;
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
  clear() {
    const req = { onsuccess: null, onerror: null };
    this.data.clear();
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 1);
    return req;
  }
}

class MockIDBDatabase {
  constructor() {
    this.stores = new Map();
    this.objectStoreNames = {
      contains: (name) => this.stores.has(name),
    };
  }
  createObjectStore(name, options) {
    const store = new MockObjectStore(name);
    this.stores.set(name, store);
    return store;
  }
  transaction(storeNames, mode) {
    const sName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
    const store = this.stores.get(sName);
    const tx = {
      objectStore: (name) => this.stores.get(name) || store,
      oncomplete: null,
      onerror: null,
    };
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 5);
    return tx;
  }
}

const mockDbInstance = new MockIDBDatabase();

globalThis.window = {
  indexedDB: {
    open(name, version) {
      const req = { onsuccess: null, onerror: null, onupgradeneeded: null };
      setTimeout(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: { result: mockDbInstance } });
        }
        if (req.onsuccess) {
          req.onsuccess({ target: { result: mockDbInstance } });
        }
      }, 5);
      return req;
    }
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.indexedDB = globalThis.window.indexedDB;
Object.defineProperty(globalThis, 'navigator', {
  value: {
    storage: {
      persist: async () => true,
      persisted: async () => true,
      estimate: async () => ({ usage: 1024 * 1024 * 5, quota: 1024 * 1024 * 1000 }),
    },
    onLine: true,
  },
  configurable: true,
  writable: true,
});
globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING TECH WASH INTERNAL STORAGE VERIFICATION');
  console.log('==================================================\n');

  const { posIndexedDB } = await import('../src/services/posIndexedDB.js');
  const { localDbService } = await import('../src/services/localDbService.js');

  // Test 1: Open DB and verify all 10 object stores
  console.log('Test 1: Opening IndexedDB TechWashPOS v2...');
  const db = await posIndexedDB.openDB();
  const expectedStores = [
    'orders', 'payments', 'customers', 'dues', 'cancellations',
    'refunds', 'serviceTransactions', 'syncQueue', 'reportSnapshots', 'terminalSettings'
  ];

  for (const store of expectedStores) {
    if (!db.objectStoreNames.contains(store)) {
      throw new Error(`Missing expected object store: ${store}`);
    }
  }
  console.log(`✅ All 10 object stores present: ${expectedStores.join(', ')}\n`);

  // Test 2: Persistent Storage Permission
  console.log('Test 2: Testing persistent storage permission request...');
  const persistRes = await localDbService.requestPersistentStorage();
  if (!persistRes.granted || !persistRes.isPersisted) {
    throw new Error('Persistent storage permission request failed');
  }
  const isPersisted = await localDbService.isStoragePersisted();
  if (!isPersisted) {
    throw new Error('isStoragePersisted returned false');
  }
  console.log('✅ Persistent storage permission: GRANTED\n');

  // Test 3: Bulk saving items
  console.log('Test 3: Testing bulk items insert (saveBulkItems)...');
  const mockOrders = [
    {
      localId: 'ORD-TEST-001',
      orderNumber: 'TW-001',
      customerName: 'Aarav Sharma',
      phone: '9876543210',
      totalAmount: 1200,
      receivedAmount: 1200,
      balanceAmount: 0,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      items: [{ name: 'Dry Cleaning Suit', price: 1200, quantity: 1 }]
    },
    {
      localId: 'ORD-TEST-002',
      orderNumber: 'TW-002',
      customerName: 'Priya Patel',
      phone: '9123456780',
      totalAmount: 850,
      receivedAmount: 500,
      balanceAmount: 350,
      paymentMethod: 'CASH',
      paymentStatus: 'PARTIAL',
      status: 'CONFIRMED',
      items: [{ name: 'Laundry Wash & Fold', price: 850, quantity: 5 }]
    },
    {
      localId: 'ORD-TEST-003',
      orderNumber: 'TW-003',
      customerName: 'Rahul Verma',
      phone: '9888777666',
      totalAmount: 450,
      receivedAmount: 0,
      balanceAmount: 450,
      paymentMethod: 'PAY_ON_DELIVERY',
      paymentStatus: 'UNPAID',
      status: 'CANCELLED',
      notes: 'Customer cancelled due to travel',
      items: [{ name: 'Steam Press Only', price: 450, quantity: 10 }]
    }
  ];

  await posIndexedDB.saveBulkItems('orders', mockOrders, 'localId');
  const savedOrders = await posIndexedDB.getAllOrders();
  if (savedOrders.length !== 3) {
    throw new Error(`Expected 3 orders, found ${savedOrders.length}`);
  }
  console.log(`✅ Bulk saved ${savedOrders.length} orders into TechWashPOS orders store\n`);

  // Test 4: Single saveLocalOrder extracting customer, payment, dues
  console.log('Test 4: Testing saveLocalOrder auto-extraction (customers, payments, dues)...');
  await localDbService.saveLocalOrder(mockOrders[1]); // Priya Patel partial payment

  const customers = await posIndexedDB.getAllCustomers();
  const payments = await posIndexedDB.getAllPayments();
  const dues = await posIndexedDB.getAllDues();

  console.log(`- Customers store count: ${customers.length}`);
  console.log(`- Payments store count: ${payments.length}`);
  console.log(`- Dues store count: ${dues.length}`);

  if (customers.length === 0 || payments.length === 0 || dues.length === 0) {
    throw new Error('Auto-extraction into customers, payments, dues failed');
  }
  console.log('✅ Auto-extraction verified across all internal stores\n');

  // Test 5: Terminal settings store
  console.log('Test 5: Testing terminal settings store...');
  await localDbService.saveTerminalSetting('daily_report_schedule', {
    enabled: true,
    scheduleTime: '22:00',
    scheduleTimeFormatted: '10:00 PM',
    emailTo: ['admin@techwashlaundry.com']
  });

  const setting = await localDbService.getTerminalSetting('daily_report_schedule');
  if (!setting || setting.scheduleTime !== '22:00') {
    throw new Error('Terminal setting retrieval failed');
  }
  console.log('✅ Terminal settings saved and retrieved from internal storage\n');

  // Test 6: Storage Telemetry Stats
  console.log('Test 6: Testing getStorageStats...');
  const stats = await localDbService.getStorageStats();
  console.log('Storage Stats:', stats);

  if (stats.orderCount !== 3 || stats.customerCount === 0 || stats.paymentCount === 0) {
    throw new Error('Storage stats counts mismatch');
  }
  console.log('✅ getStorageStats successfully aggregates across all internal stores\n');

  console.log('==================================================');
  console.log('🎉 ALL INTERNAL STORAGE VERIFICATION TESTS PASSED!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
