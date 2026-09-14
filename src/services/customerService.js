/**
 * Customer CRM & Intelligence Service for Tech Wash
 * Single Source of Truth in Firebase Firestore `customers` collection with historical order aggregation
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { orderService } from './orderService.js';

export const CUSTOMER_SEGMENTS = {
  VIP: { label: 'VIP Customer', color: 'purple', minSpend: 5000 },
  RETURNING: { label: 'Returning', color: 'blue', minOrders: 2 },
  NEW: { label: 'New Customer', color: 'emerald', maxOrders: 1 },
  INACTIVE: { label: 'Inactive (30+ Days)', color: 'slate', inactiveDays: 30 },
};

export const customerService = {
  /**
   * Derive customer list & metrics directly from Firestore `customers` and historical orders
   */
  async getCustomers() {
    const orders = await orderService.getOrders({ limitCount: 1000 });
    const customerMap = new Map();

    // 1. First fetch any direct customer documents from Firestore `customers`
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'customers'));
        if (!snap.empty) {
          snap.docs.forEach(d => {
            const data = d.data();
            const phone = data.phone || d.id;
            customerMap.set(phone, {
              id: data.id || `cust-${phone.replace(/\D/g, '')}`,
              name: data.name || 'Valued Customer',
              phone: phone,
              email: data.email || '—',
              address: data.address || '—',
              locality: data.locality || '',
              city: data.city || 'Hyderabad',
              orderCount: Number(data.orderCount || 0),
              totalSpent: Number(data.totalSpent || 0),
              orders: [],
              firstOrderDate: data.firstOrderDate || new Date().toISOString(),
              lastOrderDate: data.lastOrderDate || new Date().toISOString(),
            });
          });
        }
      } catch (e) {
        console.warn("Firestore customers collection read warning:", e);
      }
    }

    // 2. Overlay / enrich with orders
    orders.forEach((order) => {
      const phone = order.phone || order.customer?.phone;
      if (!phone) return;

      const existing = customerMap.get(phone) || {
        id: `cust-${phone.replace(/\D/g, '')}`,
        name: order.customerName || order.customer?.name || 'Valued Customer',
        phone: phone,
        email: order.customer?.email || '—',
        address: order.address || order.customer?.address || '—',
        locality: order.locality || order.customer?.locality || '',
        city: order.city || order.customer?.city || 'Hyderabad',
        orderCount: 0,
        totalSpent: 0,
        orders: [],
        firstOrderDate: order.createdAt,
        lastOrderDate: order.createdAt,
      };

      // If existing was created from Firestore without orders array populated
      if (!existing.orders) existing.orders = [];

      const orderAmount = Number(order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount || 0);

      // Check if this order is already counted in existing.orders
      const alreadyInList = existing.orders.some(o => o.id === order.id || o.orderNumber === order.orderNumber);
      if (!alreadyInList) {
        existing.orders.push({
          id: order.id,
          orderNumber: order.orderNumber,
          date: order.createdAt,
          amount: orderAmount,
          status: order.customerStage || order.status,
        });
      }

      // If customer was newly synthesized from orders, aggregate count and spent
      if (!customerMap.has(phone)) {
        existing.orderCount += 1;
        existing.totalSpent += orderAmount;
      }

      if (new Date(order.createdAt) > new Date(existing.lastOrderDate || 0)) {
        existing.lastOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) < new Date(existing.firstOrderDate || Date.now())) {
        existing.firstOrderDate = order.createdAt;
      }

      customerMap.set(phone, existing);
    });

    const now = new Date();
    const customers = Array.from(customerMap.values()).map((c) => {
      const daysSinceLast = Math.floor((now - new Date(c.lastOrderDate || now)) / (1000 * 60 * 60 * 24));
      
      let segment = 'NEW';
      if (c.totalSpent >= CUSTOMER_SEGMENTS.VIP.minSpend) {
        segment = 'VIP';
      } else if (daysSinceLast >= CUSTOMER_SEGMENTS.INACTIVE.inactiveDays) {
        segment = 'INACTIVE';
      } else if (c.orderCount >= CUSTOMER_SEGMENTS.RETURNING.minOrders) {
        segment = 'RETURNING';
      }

      return {
        ...c,
        segment,
        daysSinceLastOrder: Math.max(0, daysSinceLast),
        averageOrderValue: c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
      };
    });

    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  }
};
