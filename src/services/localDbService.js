/**
 * Tech Wash Local-First Data Access Repository (localDbService)
 * Primary source of truth for POS and local admin UI dashboards.
 * Wraps IndexedDB operations so UI components never directly depend on raw IndexedDB or Firestore.
 */

import { posIndexedDB } from './posIndexedDB.js';
import { posBridgeService } from './posBridgeService.js';
import { generateInvoicePDFBlob } from './pdfInvoiceGenerator.js';

let _activeDirectoryHandle = null;

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
    let appUsage = 0;
    let isPersisted = false;

    if (typeof navigator !== 'undefined' && navigator.storage) {
      try {
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          usage = estimate.usage || 0;
          quota = estimate.quota || 0;
          if (estimate.usageDetails && estimate.usageDetails.indexedDB) {
            appUsage = estimate.usageDetails.indexedDB;
          }
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

    let physicalConnected = false;
    try {
      const isConnected = await posIndexedDB.getTerminalSetting('physical_directory_connected');
      physicalConnected = Boolean(isConnected);
    } catch (e) {}

    return {
      isPersisted,
      usage,
      appUsage,
      quota,
      orderCount,
      customerCount,
      paymentCount,
      dueCount,
      settingsCount,
      physicalConnected,
      fileSystemSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
      storageRoot: 'C:\\TechWash',
      databaseName: 'TechWashPOS',
      terminals: {
        'admin': { code: 'TW-ADMIN-01', folder: 'Admin', path: 'C:\\TechWash\\Admin' },
        'counter-1': { code: 'TW-POS-01', folder: 'POS-01', path: 'C:\\TechWash\\POS-01' },
        'counter-2': { code: 'TW-POS-02', folder: 'POS-02', path: 'C:\\TechWash\\POS-02' },
        'counter-3': { code: 'TW-POS-03', folder: 'POS-03', path: 'C:\\TechWash\\POS-03' },
      },
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

    // 7. Physical Disk / Local Bridge Mirroring
    try {
      const dirHandle = await this.getDirectoryHandle();
      if (dirHandle) {
        notify('Mirroring business records to C:\\TechWash on disk...');
        const adminFolder = await dirHandle.getDirectoryHandle('Admin', { create: true });
        const adminData = await adminFolder.getDirectoryHandle('Data', { create: true });
        const pos01 = await dirHandle.getDirectoryHandle('POS-01', { create: true });
        const pos01Data = await pos01.getDirectoryHandle('Data', { create: true });

        for (const dataHandle of [adminData, pos01Data]) {
          await this._writeJsonFile(dataHandle, 'orders.json', allOrders);
          await this._writeJsonFile(dataHandle, 'customers.json', customerList);
          await this._writeJsonFile(dataHandle, 'dues.json', dueList);
          await this._writeJsonFile(dataHandle, 'payments.json', paymentList);
        }
      }
    } catch (diskErr) {
      console.warn('Physical disk sync notice:', diskErr);
    }

    // Mirror to Local Windows Bridge if active
    try {
      await posBridgeService.initStorage({
        orders: allOrders,
        customers: customerList,
        dues: dueList,
        payments: paymentList,
      });
    } catch (bridgeErr) {}

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
  },

  /**
   * Check if browser supports File System Access API
   */
  isFileSystemAccessSupported() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  },

  /**
   * Retrieve active directory handle (memory or IndexedDB)
   */
  async getDirectoryHandle() {
    if (_activeDirectoryHandle) {
      try {
        const perm = await _activeDirectoryHandle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') return _activeDirectoryHandle;
      } catch (e) {}
    }

    try {
      const stored = await posIndexedDB.getTerminalSetting('physical_directory_handle');
      if (stored) {
        try {
          const perm = await stored.queryPermission({ mode: 'readwrite' });
          if (perm === 'granted') {
            _activeDirectoryHandle = stored;
            return _activeDirectoryHandle;
          }
        } catch (permErr) {}
      }
    } catch (e) {}
    return null;
  },

  /**
   * Request physical storage folder selection via File System Access API
   * and auto-creates C:\TechWash\POS-01\Data, Invoices, Exports etc.
   */
  async setupPhysicalDirectory(options = {}) {
    if (!this.isFileSystemAccessSupported()) {
      return { 
        ok: false, 
        error: 'File System Access API is not supported in this browser. Please use the 1-click Windows setup script instead.' 
      };
    }

    try {
      const rootHandle = await window.showDirectoryPicker({
        id: 'techwash-storage-root',
        mode: 'readwrite',
        startIn: 'desktop',
      });

      // Target TechWash handle:
      // If user selected or navigated to a folder named 'TechWash', use it directly.
      // Otherwise, create/open a 'TechWash' subfolder inside the selected folder.
      let techWashHandle = rootHandle;
      if (rootHandle.name.toLowerCase() !== 'techwash') {
        techWashHandle = await rootHandle.getDirectoryHandle('TechWash', { create: true });
      }

      // Automatically create subfolders for Admin and all 3 POS terminals:
      const terminals = ['Admin', 'POS-01', 'POS-02', 'POS-03'];
      const handlesMap = {};

      for (const tName of terminals) {
        const tHandle = await techWashHandle.getDirectoryHandle(tName, { create: true });
        const dataHandle = await tHandle.getDirectoryHandle('Data', { create: true });
        const invoicesHandle = await tHandle.getDirectoryHandle('Invoices', { create: true });
        const exportsHandle = await tHandle.getDirectoryHandle('Exports', { create: true });
        handlesMap[tName] = { tHandle, dataHandle, invoicesHandle, exportsHandle };
      }

      // Populate files from IndexedDB immediately:
      const [orders, customers, dues, payments] = await Promise.all([
        this.getLocalOrders(),
        this.getLocalCustomers(),
        this.getLocalDueBills(),
        this.getLocalPayments(),
      ]);

      // Write data files into Admin/Data/ and POS-01/Data/
      const targetDataHandles = [
        handlesMap['Admin']?.dataHandle,
        handlesMap['POS-01']?.dataHandle,
      ].filter(Boolean);

      for (const dHandle of targetDataHandles) {
        await this._writeJsonFile(dHandle, 'orders.json', orders);
        await this._writeJsonFile(dHandle, 'customers.json', customers);
        await this._writeJsonFile(dHandle, 'dues.json', dues);
        await this._writeJsonFile(dHandle, 'payments.json', payments);
      }

      // Automatically generate & write real .pdf format invoices for all orders into Invoices/ and PDFs/
      for (const ord of orders) {
        try {
          const dateKey = (ord.createdAt || new Date().toISOString()).slice(0, 10);
          const bNum = String(ord.orderNumber || ord.id || ord.localId || 'BILL').trim();
          const pdfBlob = generateInvoicePDFBlob(ord);

          const targetPresets = [handlesMap['Admin'], handlesMap['POS-01']].filter(Boolean);
          for (const p of targetPresets) {
            const dateInvHandle = await p.invoicesHandle.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(dateInvHandle, `${bNum}.pdf`, pdfBlob);

            const pdfsHandle = await p.tHandle.getDirectoryHandle('PDFs', { create: true });
            const datePdfHandle = await pdfsHandle.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(datePdfHandle, `${bNum}.pdf`, pdfBlob);
          }
        } catch (pdfErr) {
          console.warn('PDF invoice write notice:', pdfErr);
        }
      }

      // Also write root storage marker
      await this._writeJsonFile(techWashHandle, 'techwash-storage-info.json', {
        name: 'Tech Wash Laundry Master Storage',
        connectedAt: new Date().toISOString(),
        orderCount: orders.length,
        customerCount: customers.length,
        dueCount: dues.length,
        paymentCount: payments.length,
        terminals: ['Admin', 'POS-01', 'POS-02', 'POS-03'],
      });

      _activeDirectoryHandle = techWashHandle;

      // Save connection flags in IndexedDB
      try {
        await posIndexedDB.saveTerminalSetting('physical_directory_connected', true);
        await posIndexedDB.saveTerminalSetting('physical_directory_handle', techWashHandle);
      } catch (storageSaveErr) {
        console.warn('Directory handle storage save notice (non-fatal):', storageSaveErr);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-directory-connected', {
          detail: { folderName: techWashHandle.name, orderCount: orders.length }
        }));
      }

      return {
        ok: true,
        folderName: techWashHandle.name,
        orderCount: orders.length,
        customerCount: customers.length,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { ok: false, aborted: true, error: 'Folder selection was cancelled.' };
      }
      return { ok: false, error: err.message };
    }
  },

  async _writeJsonFile(dirHandle, fileName, data) {
    try {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      console.warn(`Error writing file ${fileName}:`, e);
      return false;
    }
  },

  async _writeBinaryFile(dirHandle, fileName, dataBlobOrBuffer) {
    try {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(dataBlobOrBuffer);
      await writable.close();
      return true;
    } catch (e) {
      console.warn(`Error writing binary file ${fileName}:`, e);
      return false;
    }
  },

  /**
   * Sync an individual order to physical storage if connected
   * Writes order data to Data/orders.json and genuine .pdf invoice to Invoices/<dateKey>/<billNumber>.pdf
   */
  async writeOrderToPhysicalStorage(order, targetFolder = 'Admin') {
    if (!order) return;
    try {
      const handle = await this.getDirectoryHandle();
      if (handle) {
        const foldersToUpdate = new Set(['Admin']);
        if (targetFolder) foldersToUpdate.add(targetFolder);
        if (order.terminalId === 'counter-1' || !order.terminalId) {
          foldersToUpdate.add('POS-01');
        } else if (order.terminalId === 'counter-2') {
          foldersToUpdate.add('POS-02');
        } else if (order.terminalId === 'counter-3') {
          foldersToUpdate.add('POS-03');
        }

        const allOrders = await this.getLocalOrders();
        
        let dateKey = order.dateKey;
        if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          if (order.createdAt) dateKey = String(order.createdAt).slice(0, 10);
          else if (order.pickupDate) dateKey = String(order.pickupDate).slice(0, 10);
          else dateKey = new Date().toISOString().slice(0, 10);
        }

        const dayOrders = allOrders.filter(o => {
          const oDate = o.dateKey || (o.createdAt ? String(o.createdAt).slice(0, 10) : '') || '';
          return oDate === dateKey;
        });

        const billNumber = String(order.orderNumber || order.manualBillNumber || order.id || order.localId || 'BILL').trim();
        const pdfBlob = generateInvoicePDFBlob(order);

        // 1. Update Subfolders: Admin, POS-01, POS-02, POS-03
        for (const fName of foldersToUpdate) {
          try {
            const fHandle = await handle.getDirectoryHandle(fName, { create: true });
            const dataHandle = await fHandle.getDirectoryHandle('Data', { create: true });
            await this._writeJsonFile(dataHandle, 'orders.json', allOrders);
            await this._writeJsonFile(dataHandle, `${dateKey}.json`, dayOrders);

            // SAVE AS REAL .pdf IN Invoices/<dateKey>/<billNumber>.pdf
            const invDirHandle = await fHandle.getDirectoryHandle('Invoices', { create: true });
            const dateInvDirHandle = await invDirHandle.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(dateInvDirHandle, `${billNumber}.pdf`, pdfBlob);

            // ALSO SAVE AS REAL .pdf IN dedicated PDFs/<dateKey>/<billNumber>.pdf
            const pdfDirHandle = await fHandle.getDirectoryHandle('PDFs', { create: true });
            const datePdfDirHandle = await pdfDirHandle.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(datePdfDirHandle, `${billNumber}.pdf`, pdfBlob);
          } catch (e) {}
        }

        // 2. Mirror into Root Invoices/<dateKey>/ and PDFs/<dateKey>/ for fast 1-click access
        try {
          const rootInvHandle = await handle.getDirectoryHandle('Invoices', { create: true });
          const rootDateInvHandle = await rootInvHandle.getDirectoryHandle(dateKey, { create: true });
          await this._writeBinaryFile(rootDateInvHandle, `${billNumber}.pdf`, pdfBlob);

          const rootPdfHandle = await handle.getDirectoryHandle('PDFs', { create: true });
          const rootDatePdfHandle = await rootPdfHandle.getDirectoryHandle(dateKey, { create: true });
          await this._writeBinaryFile(rootDatePdfHandle, `${billNumber}.pdf`, pdfBlob);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('writeOrderToPhysicalStorage notice:', e);
    }
  },

  /**
   * Generates and writes .pdf invoices for all local orders into internal storage
   */
  async syncAllInvoicesAsPdfToPhysicalStorage(onProgress = null) {
    try {
      const handle = await this.getDirectoryHandle();
      if (!handle) return { ok: false, error: 'Internal storage folder not connected' };

      const allOrders = await this.getLocalOrders();
      let generatedCount = 0;

      for (let i = 0; i < allOrders.length; i++) {
        const ord = allOrders[i];
        try {
          const dateKey = (ord.createdAt || new Date().toISOString()).slice(0, 10);
          const bNum = String(ord.orderNumber || ord.id || ord.localId || 'BILL').trim();
          const pdfBlob = generateInvoicePDFBlob(ord);

          const folders = ['Admin', 'POS-01'];
          for (const fName of folders) {
            const fHandle = await handle.getDirectoryHandle(fName, { create: true });
            const invDir = await fHandle.getDirectoryHandle('Invoices', { create: true });
            const dateInvDir = await invDir.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(dateInvDir, `${bNum}.pdf`, pdfBlob);

            const pdfDir = await fHandle.getDirectoryHandle('PDFs', { create: true });
            const datePdfDir = await pdfDir.getDirectoryHandle(dateKey, { create: true });
            await this._writeBinaryFile(datePdfDir, `${bNum}.pdf`, pdfBlob);
          }
          generatedCount++;
          if (onProgress) {
            onProgress(`Generated PDF invoice ${i + 1}/${allOrders.length}: ${bNum}.pdf`);
          }
        } catch (e) {}
      }

      return { ok: true, count: generatedCount };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  /**
   * Remove an individual order from physical storage files if connected
   */
  async removeOrderFromPhysicalStorage(orderId, targetFolder = 'Admin') {
    if (!orderId) return;
    try {
      const handle = await this.getDirectoryHandle();
      if (handle) {
        const allOrders = await this.getLocalOrders();
        const foldersToUpdate = ['Admin', 'POS-01', 'POS-02', 'POS-03'];
        for (const fName of foldersToUpdate) {
          try {
            const fHandle = await handle.getDirectoryHandle(fName, { create: false });
            const dataHandle = await fHandle.getDirectoryHandle('Data', { create: false });
            await this._writeJsonFile(dataHandle, 'orders.json', allOrders);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('removeOrderFromPhysicalStorage notice:', e);
    }
  },

  /**
   * Generate & download 1-click Windows setup batch script
   */
  downloadWindowsFolderSetupScript() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const batContent = `@echo off
title Tech Wash Local Master Storage Auto-Setup
color 0A
cls
echo ===================================================================
echo     TECH WASH LAUNDRY SERVICES - INTERNAL STORAGE INITIALIZER
echo ===================================================================
echo Target Location: C:\\TechWash
echo.
echo Creating directories on this computer...
echo.

if not exist "C:\\TechWash" (
    mkdir "C:\\TechWash"
    echo [OK] Created C:\\TechWash
) else (
    echo [OK] C:\\TechWash already exists
)

if not exist "C:\\TechWash\\Admin\\Data" (
    mkdir "C:\\TechWash\\Admin\\Data"
    mkdir "C:\\TechWash\\Admin\\Invoices"
    mkdir "C:\\TechWash\\Admin\\PDFs"
    mkdir "C:\\TechWash\\Admin\\Exports"
    echo [OK] Created C:\\TechWash\\Admin (Order Management - Admin Portal)
)

if not exist "C:\\TechWash\\POS-01\\Data" (
    mkdir "C:\\TechWash\\POS-01\\Data"
    mkdir "C:\\TechWash\\POS-01\\Invoices"
    mkdir "C:\\TechWash\\POS-01\\PDFs"
    mkdir "C:\\TechWash\\POS-01\\Exports"
    echo [OK] Created C:\\TechWash\\POS-01 (Main Branch - Manikonda)
)

if not exist "C:\\TechWash\\POS-02\\Data" (
    mkdir "C:\\TechWash\\POS-02\\Data"
    mkdir "C:\\TechWash\\POS-02\\Invoices"
    mkdir "C:\\TechWash\\POS-02\\PDFs"
    mkdir "C:\\TechWash\\POS-02\\Exports"
    echo [OK] Created C:\\TechWash\\POS-02 (Branch 1 - Tolichowki)
)

if not exist "C:\\TechWash\\POS-03\\Data" (
    mkdir "C:\\TechWash\\POS-03\\Data"
    mkdir "C:\\TechWash\\POS-03\\Invoices"
    mkdir "C:\\TechWash\\POS-03\\PDFs"
    mkdir "C:\\TechWash\\POS-03\\Exports"
    echo [OK] Created C:\\TechWash\\POS-03 (Pick Up Point - Ambience)
)

echo.
echo ===================================================================
echo  [SUCCESS] All Tech Wash internal storage folders are ready!
echo  Location: C:\\TechWash\\
echo ===================================================================
echo.
echo Opening folder in Windows File Explorer...
explorer C:\\TechWash
echo.
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Create-TechWash-Folders.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export all data files as JSON backup download
   */
  async exportAllDataAsJson() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const [orders, customers, dues, payments] = await Promise.all([
      this.getLocalOrders(),
      this.getLocalCustomers(),
      this.getLocalDueBills(),
      this.getLocalPayments(),
    ]);

    const backup = {
      brand: 'Tech Wash Laundry Services',
      exportedAt: new Date().toISOString(),
      counts: {
        orders: orders.length,
        customers: customers.length,
        dues: dues.length,
        payments: payments.length,
      },
      orders,
      customers,
      dues,
      payments,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechWash-Data-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export default localDbService;

