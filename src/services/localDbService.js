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
  }
};

export default localDbService;
