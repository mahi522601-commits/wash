/**
 * Customer CRM & Intelligence Service for Tech Wash
 * Computes customer LTV, order counts, last visit, and segmentation tags
 */
import { orderService } from './orderService.js';

export const CUSTOMER_SEGMENTS = {
  VIP: { label: 'VIP Customer', color: 'purple', minSpend: 5000 },
  RETURNING: { label: 'Returning', color: 'blue', minOrders: 2 },
  NEW: { label: 'New Customer', color: 'emerald', maxOrders: 1 },
  INACTIVE: { label: 'Inactive (30+ Days)', color: 'slate', inactiveDays: 30 },
};

export const customerService = {
  /**
   * Derive customer list & metrics directly from historical orders and custom records
   */
  async getCustomers() {
    const orders = await orderService.getOrders({ limitCount: 1000 });
    const customerMap = new Map();

    orders.forEach((order) => {
      const phone = order.customer?.phone;
      if (!phone) return;

      const existing = customerMap.get(phone) || {
        id: `cust-${phone.replace(/\D/g, '')}`,
        name: order.customer?.name || 'Valued Customer',
        phone: phone,
        email: order.customer?.email || '—',
        address: order.customer?.address || '—',
        locality: order.customer?.locality || '',
        orderCount: 0,
        totalSpent: 0,
        orders: [],
        firstOrderDate: order.createdAt,
        lastOrderDate: order.createdAt,
      };

      existing.orderCount += 1;
      existing.totalSpent += Number(order.priceSnapshot?.finalTotal || order.totalAmount || 0);
      existing.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        amount: order.priceSnapshot?.finalTotal || order.totalAmount || 0,
        status: order.customerStage,
      });

      if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) < new Date(existing.firstOrderDate)) {
        existing.firstOrderDate = order.createdAt;
      }

      customerMap.set(phone, existing);
    });

    const now = new Date();
    const customers = Array.from(customerMap.values()).map((c) => {
      const daysSinceLast = Math.floor((now - new Date(c.lastOrderDate)) / (1000 * 60 * 60 * 24));
      
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
        daysSinceLastOrder: daysSinceLast,
        averageOrderValue: c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
      };
    });

    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  }
};
