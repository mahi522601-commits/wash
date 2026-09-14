/**
 * Centralized Booking & Order Lifecycle Management Service for Tech Wash
 * Single source of truth in Firebase Firestore: `bookings` and `orders` collections
 * Synchronizes customer CRM `customers` collection on every booking and financial update.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  limit
} from 'firebase/firestore';

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
  { key: 'CANCELLED', label: 'Cancelled', stepNumber: 0, icon: 'XCircle', color: 'red' },
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
   * Create a new booking with immutable price snapshot & customer CRM sync
   */
  async createOrder(orderPayload) {
    const orderNumber = `TW-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = orderPayload.id || orderNumber;
    const phone = orderPayload.customer?.phone ? String(orderPayload.customer.phone).replace(/\D/g, '') : '';
    const customerId = `cust-${phone || Math.random().toString(36).substring(2, 8)}`;

    const estimatedPrice = Number(orderPayload.priceSnapshot?.finalTotal || orderPayload.totalAmount || 0);
    const estimatedWeight = orderPayload.estimatedWeightKg || orderPayload.estimatedWeight || null;

    const fullOrder = {
      ...orderPayload,
      id: orderId,
      bookingId: orderId,
      orderNumber,
      customerId,
      customerName: orderPayload.customer?.name || 'Valued Customer',
      phone: orderPayload.customer?.phone || '',
      whatsapp: orderPayload.customer?.whatsapp || orderPayload.customer?.phone || '',
      address: orderPayload.customer?.address || orderPayload.pickupLocation?.formattedAddress || '',
      landmark: orderPayload.customer?.landmark || orderPayload.pickupLocation?.landmark || '',
      locality: orderPayload.customer?.locality || orderPayload.pickupLocation?.area || '',
      city: orderPayload.customer?.city || orderPayload.pickupLocation?.city || 'Hyderabad',
      service: orderPayload.serviceName || orderPayload.service || 'Laundry Service',
      serviceId: orderPayload.serviceId || 'srv-dry-cleaning',
      serviceEmoji: orderPayload.serviceEmoji || '🧺',
      pricingType: orderPayload.pricingType || 'per_item',
      items: orderPayload.items || [],
      estimatedWeight: estimatedWeight,
      estimatedWeightKg: estimatedWeight,
      estimatedPrice: estimatedPrice,
      actualWeight: orderPayload.actualWeight || null,
      finalPrice: orderPayload.finalPrice || estimatedPrice,
      pickupDate: orderPayload.schedule?.pickupDate || orderPayload.pickupDate || new Date().toISOString().split('T')[0],
      pickupSlot: orderPayload.schedule?.pickupSlot || orderPayload.pickupSlot || '10:00 AM - 12:00 PM',
      notes: orderPayload.schedule?.instructions || orderPayload.notes || '',
      adminNotes: orderPayload.adminNotes || '',
      customerStage: 'CONFIRMED',
      status: 'CONFIRMED',
      internalStage: 'RECEIVED_AT_HUB',
      paymentStatus: orderPayload.paymentStatus || 'PENDING', // PENDING, PAID, REFUNDED, CANCELLED
      paymentMethod: orderPayload.paymentMethod || 'PAY_ON_DELIVERY',
      totalAmount: estimatedPrice,
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
    };

    if (isFirebaseConfigured && db) {
      try {
        // Write to both 'orders' and 'bookings' for compatibility
        await Promise.all([
          setDoc(doc(db, 'orders', orderId), fullOrder),
          setDoc(doc(db, 'bookings', orderId), fullOrder)
        ]);

        // Synchronize customer CRM record in Firestore 'customers'
        if (phone) {
          const customerRef = doc(db, 'customers', phone);
          const custSnap = await getDoc(customerRef);
          let custData = {
            id: customerId,
            name: fullOrder.customerName,
            phone: fullOrder.phone,
            whatsapp: fullOrder.whatsapp,
            email: orderPayload.customer?.email || '',
            address: fullOrder.address,
            locality: fullOrder.locality,
            city: fullOrder.city,
            orderCount: 1,
            totalSpent: estimatedPrice,
            lastOrderDate: fullOrder.createdAt,
            firstOrderDate: fullOrder.createdAt,
            updatedAt: new Date().toISOString(),
          };

          if (custSnap.exists()) {
            const prev = custSnap.data();
            custData = {
              ...prev,
              name: fullOrder.customerName || prev.name,
              address: fullOrder.address || prev.address,
              orderCount: (prev.orderCount || 0) + 1,
              totalSpent: (prev.totalSpent || 0) + estimatedPrice,
              lastOrderDate: fullOrder.createdAt,
              updatedAt: new Date().toISOString(),
            };
          }

          await setDoc(customerRef, custData, { merge: true });
        }
      } catch (e) {
        console.warn("Firestore order create / customer sync error:", e);
      }
    }

    try {
      const orders = await this.getOrders();
      orders.unshift(fullOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn("Local storage order caching error:", e);
    }

    return fullOrder;
  },

  /**
   * Get all orders with optional filtering
   */
  async getOrders({ status = null, search = '', limitCount = 200 } = {}) {
    let ordersList = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        if (!snap.empty) {
          ordersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } else {
          // Check 'bookings' collection if 'orders' is empty
          const bookingSnap = await getDocs(collection(db, 'bookings'));
          if (!bookingSnap.empty) {
            ordersList = bookingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
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

    // Filter by search query (orderNumber, customer name, phone, address, serviceName)
    if (search) {
      const q = search.toLowerCase();
      ordersList = ordersList.filter(o => 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        (o.serviceName && o.serviceName.toLowerCase().includes(q)) ||
        (o.service && o.service.toLowerCase().includes(q))
      );
    }

    // Filter by status stage
    if (status && status !== 'ALL') {
      ordersList = ordersList.filter(o => 
        o.customerStage === status || 
        o.status === status || 
        o.paymentStatus === status
      );
    }

    return ordersList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, limitCount);
  },

  /**
   * Get single order by Order ID or Order Number
   */
  async getOrderById(orderIdOrNumber) {
    if (!orderIdOrNumber) return null;
    const target = orderIdOrNumber.trim().toUpperCase();

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'orders', orderIdOrNumber.trim());
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (e) {}
    }

    const orders = await this.getOrders({ limitCount: 500 });
    return orders.find(o => 
      (o.id && o.id.toUpperCase() === target) || 
      (o.bookingId && o.bookingId.toUpperCase() === target) ||
      (o.orderNumber && o.orderNumber.toUpperCase() === target)
    ) || null;
  },

  /**
   * Update order status, milestone stage, actual weight, final price, staff assignment & append to timeline
   */
  async updateOrderStatus(orderId, { 
    customerStage, 
    status,
    internalStage, 
    note = '', 
    paymentStatus = null, 
    assignedStaff = null,
    actualWeight = undefined,
    finalPrice = undefined,
    adminNotes = undefined
  }) {
    const orders = await this.getOrders({ limitCount: 500 });
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId || o.bookingId === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const stageKey = customerStage || status || order.customerStage || order.status || 'CONFIRMED';
    const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === stageKey) || { label: stageKey };

    const newTimelineEntry = {
      stage: stageKey,
      label: stageConfig.label,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${stageConfig.label}`,
    };

    const newActualWeight = actualWeight !== undefined ? (actualWeight === '' ? null : Number(actualWeight)) : order.actualWeight;
    const newFinalPrice = finalPrice !== undefined ? (finalPrice === '' ? null : Number(finalPrice)) : (order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount);
    const newAdminNotes = adminNotes !== undefined ? adminNotes : (order.adminNotes || '');

    const updatedOrder = {
      ...order,
      customerStage: stageKey,
      status: stageKey,
      internalStage: internalStage || order.internalStage || 'RECEIVED_AT_HUB',
      paymentStatus: paymentStatus || order.paymentStatus || 'PENDING',
      assignedStaff: assignedStaff !== undefined ? assignedStaff : order.assignedStaff,
      actualWeight: newActualWeight,
      finalPrice: newFinalPrice,
      totalAmount: newFinalPrice,
      adminNotes: newAdminNotes,
      updatedAt: new Date().toISOString(),
      statusTimeline: [...(order.statusTimeline || []), newTimelineEntry],
    };

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true }),
          setDoc(doc(db, 'bookings', order.id), updatedOrder, { merge: true })
        ]);

        // If price changed, update customer totalSpent in Firestore
        const phone = order.phone || order.customer?.phone ? String(order.phone || order.customer.phone).replace(/\D/g, '') : null;
        if (phone && finalPrice !== undefined && Number(finalPrice) !== Number(order.finalPrice || order.totalAmount)) {
          const custRef = doc(db, 'customers', phone);
          const cSnap = await getDoc(custRef);
          if (cSnap.exists()) {
            const cData = cSnap.data();
            const diff = Number(finalPrice) - Number(order.finalPrice || order.totalAmount || 0);
            await updateDoc(custRef, {
              totalSpent: Math.max(0, (cData.totalSpent || 0) + diff),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.warn("Firestore order update error:", e);
      }
    }

    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    return updatedOrder;
  },

  /**
   * Dedicated helper to update actual weight and recalculate final price for Per-KG services
   */
  async updateActualWeightAndPrice(orderId, { actualWeight, finalPrice, adminNotes, note = 'Doorstep weight inspected' }) {
    return this.updateOrderStatus(orderId, {
      actualWeight: actualWeight !== '' ? Number(actualWeight) : null,
      finalPrice: finalPrice !== '' ? Number(finalPrice) : null,
      adminNotes,
      note,
    });
  }
};
