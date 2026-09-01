/**
 * Order Management & 10-Stage Tracking Service for Tech Wash
 * Maps 10 customer-facing milestones with internal operational sub-stages
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';

export const ORDER_CUSTOMER_STAGES = [
  { key: 'CONFIRMED', label: 'Booking Confirmed', stepNumber: 1, icon: 'CheckCircle2', color: 'emerald' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', stepNumber: 2, icon: 'Calendar', color: 'blue' },
  { key: 'PICKED_UP', label: 'Picked Up', stepNumber: 3, icon: 'Truck', color: 'indigo' },
  { key: 'INSPECTION', label: 'Garment Inspection', stepNumber: 4, icon: 'Search', color: 'cyan' },
  { key: 'CLEANING', label: 'Hygienic Cleaning', stepNumber: 5, icon: 'Sparkles', color: 'brand' },
  { key: 'FINISHING', label: 'Steam Finishing & Press', stepNumber: 6, icon: 'Flame', color: 'purple' },
  { key: 'QUALITY_CHECK', label: 'Dual Quality Check', stepNumber: 7, icon: 'ShieldCheck', color: 'teal' },
  { key: 'PACKED', label: 'Eco-Friendly Packing', stepNumber: 8, icon: 'Package', color: 'sky' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', stepNumber: 9, icon: 'Send', color: 'amber' },
  { key: 'DELIVERED', label: 'Delivered to Customer', stepNumber: 10, icon: 'Home', color: 'emerald' },
];

export const INTERNAL_OPERATIONAL_STAGES = {
  RECEIVED_AT_HUB: { label: 'Received at Central Hub', customerStage: 'INSPECTION' },
  SORTING: { label: 'Fabric Classification & Tagging', customerStage: 'INSPECTION' },
  STAIN_TREATMENT: { label: 'Targeted Stain Treatment', customerStage: 'CLEANING' },
  ECO_WASH: { label: 'Soft Water Eco Cleaning', customerStage: 'CLEANING' },
  DRYING: { label: 'Moisture Controlled Drying', customerStage: 'CLEANING' },
  STEAM_PRESSING: { label: '3D Form Finishing & Steam Press', customerStage: 'FINISHING' },
  QC_INSPECTION: { label: '10-Point QC Verification', customerStage: 'QUALITY_CHECK' },
  BARCODE_SCAN_PACK: { label: 'Sealed Barrier Packing', customerStage: 'PACKED' },
  DISPATCH_ASSIGNED: { label: 'Assigned to Delivery Rider', customerStage: 'OUT_FOR_DELIVERY' },
};

const ORDERS_STORAGE_KEY = 'techwash_orders_store';

export const orderService = {
  /**
   * Create a new booking with immutable price snapshot
   */
  async createOrder(orderPayload) {
    const orderNumber = `TW-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = orderPayload.id || orderNumber;

    const fullOrder = {
      ...orderPayload,
      id: orderId,
      orderNumber,
      customerStage: 'CONFIRMED',
      internalStage: 'RECEIVED_AT_HUB',
      paymentStatus: orderPayload.paymentStatus || 'PENDING', // PENDING, PAID, REFUNDED
      paymentMethod: orderPayload.paymentMethod || 'PAY_ON_DELIVERY', // PAY_ON_DELIVERY, UPI_QR, ONLINE_GATEWAY
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusTimeline: [
        {
          stage: 'CONFIRMED',
          label: 'Booking Confirmed',
          timestamp: new Date().toISOString(),
          note: 'Your pickup order has been placed successfully.',
        }
      ],
      assignedStaff: orderPayload.assignedStaff || null,
      internalNotes: orderPayload.internalNotes || '',
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', orderId), fullOrder);
      } catch (e) {
        console.warn("Firestore order create error:", e);
      }
    }

    const orders = await this.getOrders();
    orders.unshift(fullOrder);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return fullOrder;
  },

  /**
   * Get all orders with optional filtering
   */
  async getOrders({ status = null, search = '', limitCount = 100 } = {}) {
    let ordersList = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          ordersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore orders read failed:", e);
      }
    }

    if (ordersList.length === 0) {
      try {
        ordersList = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
      } catch (e) {
        ordersList = [];
      }
    }

    // Filter by search query (orderNumber, customer name, phone)
    if (search) {
      const q = search.toLowerCase();
      ordersList = ordersList.filter(o => 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        (o.serviceName && o.serviceName.toLowerCase().includes(q))
      );
    }

    // Filter by status stage
    if (status && status !== 'ALL') {
      ordersList = ordersList.filter(o => o.customerStage === status || o.paymentStatus === status);
    }

    return ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limitCount);
  },

  /**
   * Get single order by Order ID or Order Number
   */
  async getOrderById(orderIdOrNumber) {
    const orders = await this.getOrders({ limitCount: 500 });
    const target = orderIdOrNumber.trim().toUpperCase();
    return orders.find(o => 
      (o.id && o.id.toUpperCase() === target) || 
      (o.orderNumber && o.orderNumber.toUpperCase() === target)
    ) || null;
  },

  /**
   * Update order status & append to timeline
   */
  async updateOrderStatus(orderId, { customerStage, internalStage, note = '', paymentStatus = null, assignedStaff = null }) {
    const orders = await this.getOrders({ limitCount: 500 });
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === customerStage) || { label: customerStage };

    const newTimelineEntry = {
      stage: customerStage || order.customerStage,
      label: stageConfig.label,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${stageConfig.label}`,
    };

    const updatedOrder = {
      ...order,
      customerStage: customerStage || order.customerStage,
      internalStage: internalStage || order.internalStage,
      paymentStatus: paymentStatus || order.paymentStatus,
      assignedStaff: assignedStaff !== undefined ? assignedStaff : order.assignedStaff,
      updatedAt: new Date().toISOString(),
      statusTimeline: [...(order.statusTimeline || []), newTimelineEntry],
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true });
      } catch (e) {
        console.warn("Firestore order update error:", e);
      }
    }

    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    return updatedOrder;
  }
};
