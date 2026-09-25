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
  deleteDoc,
  query, 
  orderBy, 
  where,
  limit,
  onSnapshot
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
const ORDER_SEQ_KEY = 'techwash_order_sequence_counter';

export const getOrderBranchKey = (order) => {
  if (!order) return 'ONLINE_WEBSITE';
  const isPos = Boolean(
    order.isWalkIn === true || 
    order.orderSource === 'OFFLINE_POS' || 
    order.orderSource === 'WALK_IN' || 
    order.orderSource === 'POS' ||
    order.terminalId || 
    order.terminalCode || 
    order.manualBillNumber
  );
  if (!isPos) return 'ONLINE_WEBSITE';

  const tId = String(order.terminalId || '').toLowerCase().trim();
  const tCode = String(order.terminalCode || '').toLowerCase().trim();
  const bName = String(order.storeBranch || '').toLowerCase().trim();

  // Explicit Counter 2 checks
  if (
    tId === 'counter-2' || tId === '2' || tId.includes('counter-2') || tId.includes('pos-02') || 
    tCode === 'tw-pos-02' || tCode.includes('pos-02') || tCode.includes('02') ||
    bName.includes('hitec') || bName.includes('cyber') || bName.includes('express hub')
  ) {
    return 'counter-2';
  }

  // Explicit Counter 3 checks
  if (
    tId === 'counter-3' || tId === '3' || tId.includes('counter-3') || tId.includes('pos-03') || 
    tCode === 'tw-pos-03' || tCode.includes('pos-03') || tCode.includes('03') ||
    bName.includes('banjara') || bName.includes('care center')
  ) {
    return 'counter-3';
  }

  // Counter 1 or fallback POS
  return 'counter-1';
};

export const orderService = {
  /**
   * Generates next sequential 5-digit order number (e.g. 00001 -> 99999, TW-00001)
   */
  async getNextOrderSequence() {
    let nextSeq = 1;

    // 1. Try Firebase Firestore settings/order_sequence
    if (isFirebaseConfigured && db) {
      try {
        const seqRef = doc(db, 'settings', 'order_sequence');
        const snap = await getDoc(seqRef);
        if (snap.exists()) {
          const data = snap.data();
          const current = Number(data.currentSeq || data.counter || 0);
          nextSeq = current + 1;
        } else {
          // Initialize sequence counter from existing orders in Firestore
          const ordersSnap = await getDocs(collection(db, 'orders'));
          if (!ordersSnap.empty) {
            let maxNum = 0;
            ordersSnap.docs.forEach(d => {
              const oData = d.data();
              const numMatch = (oData.orderNumber || oData.id || '').replace(/[^0-9]/g, '');
              if (numMatch) {
                const parsed = parseInt(numMatch, 10);
                if (parsed > 0 && parsed < 100000 && parsed > maxNum) {
                  maxNum = parsed;
                }
              }
            });
            nextSeq = maxNum + 1;
          }
        }
        await setDoc(seqRef, { currentSeq: nextSeq, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn("Firestore order sequence fetch error:", e);
      }
    }

    // 2. Fallback / Sync with local storage
    try {
      const storedSeq = parseInt(localStorage.getItem(ORDER_SEQ_KEY) || '0', 10);
      if (storedSeq >= nextSeq) {
        nextSeq = storedSeq + 1;
      }
      localStorage.setItem(ORDER_SEQ_KEY, String(nextSeq));
    } catch (e) {}

    const formattedSeq = String(nextSeq).padStart(5, '0');
    return {
      sequenceNumber: nextSeq,
      formattedSeq,
      orderNumber: `TW-${formattedSeq}`,
      orderId: `TW-${formattedSeq}`,
      invoiceNumber: `TW-${formattedSeq}`
    };
  },

  /**
   * Create a new booking with immutable price snapshot & customer CRM sync
   */
  async createOrder(orderPayload) {
    let orderNumber = orderPayload.orderNumber;
    let orderId = orderPayload.id;

    if (!orderNumber || !orderNumber.startsWith('TW-')) {
      const seqData = await this.getNextOrderSequence();
      orderNumber = seqData.orderNumber;
      orderId = orderId || seqData.orderId;
    } else {
      orderId = orderId || orderNumber;
    }

    const phone = orderPayload.customer?.phone ? String(orderPayload.customer.phone).replace(/\D/g, '') : '';
    const customerId = `cust-${phone || Math.random().toString(36).substring(2, 8)}`;

    const estimatedPrice = Number(orderPayload.priceSnapshot?.finalTotal || orderPayload.totalAmount || 0);
    const estimatedWeight = orderPayload.estimatedWeightKg || orderPayload.estimatedWeight || null;

    const isWalkIn = Boolean(orderPayload.isWalkIn || orderPayload.terminalId || orderPayload.terminalCode);
    const orderSource = isWalkIn ? 'OFFLINE_POS' : 'ONLINE_WEBSITE';

    // Received Amount & Balance Due calculation
    const totalAmount = estimatedPrice;
    let receivedAmount = orderPayload.receivedAmount !== undefined 
      ? Number(orderPayload.receivedAmount || 0) 
      : (orderPayload.paymentStatus === 'PAID' ? totalAmount : 0);
    
    // Auto-fix if marked PAID
    if (orderPayload.paymentStatus === 'PAID' && receivedAmount < totalAmount) {
      receivedAmount = totalAmount;
    }

    const balanceAmount = Math.max(0, totalAmount - receivedAmount);
    let resolvedPaymentStatus = orderPayload.paymentStatus || 'PENDING';
    if (receivedAmount >= totalAmount && totalAmount > 0) {
      resolvedPaymentStatus = 'PAID';
    } else if (receivedAmount > 0 && receivedAmount < totalAmount) {
      resolvedPaymentStatus = 'PARTIAL';
    } else if (receivedAmount === 0 && resolvedPaymentStatus === 'PAID') {
      resolvedPaymentStatus = 'PENDING';
    }

    const priceSnapshot = {
      itemsSubtotal: orderPayload.priceSnapshot?.itemsSubtotal || totalAmount,
      deliveryFee: orderPayload.priceSnapshot?.deliveryFee || 0,
      expressFee: orderPayload.priceSnapshot?.expressFee || (orderPayload.isExpress ? 100 : 0),
      discountAmount: orderPayload.priceSnapshot?.discountAmount || 0,
      taxAmount: 0, // GST REMOVED
      taxes: 0,
      finalTotal: totalAmount,
      receivedAmount,
      balanceAmount,
      isExpress: Boolean(orderPayload.priceSnapshot?.isExpress || orderPayload.isExpress),
    };

    const fullOrder = {
      ...orderPayload,
      id: orderId,
      bookingId: orderId,
      orderNumber,
      invoiceNumber: orderPayload.invoiceNumber || orderNumber,
      customerId,
      customerName: orderPayload.customer?.name || 'Valued Customer',
      phone: orderPayload.customer?.phone || '',
      whatsapp: orderPayload.customer?.whatsapp || orderPayload.customer?.phone || '',
      address: orderPayload.customer?.address || orderPayload.pickupLocation?.formattedAddress || (isWalkIn ? 'In-Store Walk-in Drop' : ''),
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
      finalPrice: totalAmount,
      totalAmount,
      receivedAmount,
      balanceAmount,
      isWalkIn,
      orderSource,
      terminalId: orderPayload.terminalId || null,
      terminalCode: orderPayload.terminalCode || null,
      storeBranch: orderPayload.storeBranch || null,
      cashierName: orderPayload.cashierName || null,
      pickupDate: orderPayload.schedule?.pickupDate || orderPayload.pickupDate || new Date().toISOString().split('T')[0],
      pickupSlot: orderPayload.schedule?.pickupSlot || orderPayload.pickupSlot || (isWalkIn ? 'In-Store Counter' : '10:00 AM - 12:00 PM'),
      notes: orderPayload.schedule?.instructions || orderPayload.notes || '',
      adminNotes: orderPayload.adminNotes || '',
      customerStage: orderPayload.customerStage || 'CONFIRMED',
      status: orderPayload.status || 'CONFIRMED',
      internalStage: orderPayload.internalStage || 'RECEIVED_AT_HUB',
      paymentStatus: resolvedPaymentStatus,
      paymentMethod: orderPayload.paymentMethod || 'PAY_ON_DELIVERY',
      priceSnapshot,
      createdAt: orderPayload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusTimeline: orderPayload.statusTimeline || [
        {
          stage: 'CONFIRMED',
          label: isWalkIn ? 'In-Store Walk-in Bill Generated' : 'Booking Confirmed',
          timestamp: new Date().toISOString(),
          note: isWalkIn ? 'Invoice created at physical store counter.' : 'Your pickup order has been placed successfully.',
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
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
      } catch (e) {
        localOrders = [];
      }
      // Insert fullOrder at start, deduplicate by id & orderNumber
      const updatedLocal = [fullOrder, ...localOrders.filter(o => o.id !== fullOrder.id && o.orderNumber !== fullOrder.orderNumber)];
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedLocal));
    } catch (e) {
      console.warn("Local storage order caching error:", e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-new-order-placed', { detail: fullOrder }));
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { detail: fullOrder }));
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ type: 'NEW_ORDER', order: fullOrder });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return fullOrder;
  },

  /**
   * Get all orders with optional filtering
   */
  async getOrders({ status = null, search = '', limitCount = 2000 } = {}) {
    let ordersList = [];

    // 1. Fetch from Firestore if configured
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

    // 2. Fetch and merge LocalStorage orders so offline/counter POS orders are never lost
    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
    } catch (e) {
      localOrders = [];
    }

    const orderMap = new Map();
    // A. Insert Firestore orders
    ordersList.forEach(o => {
      const key = o.id || o.orderNumber;
      if (key) orderMap.set(key, o);
    });
    // B. Merge LocalStorage orders (Local overrides or supplements if matching/newer)
    localOrders.forEach(o => {
      const key = o.id || o.orderNumber;
      if (key) {
        const existing = orderMap.get(key);
        if (!existing) {
          orderMap.set(key, o);
        } else {
          const localTime = new Date(o.updatedAt || o.createdAt || 0).getTime();
          const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            orderMap.set(key, { ...existing, ...o });
          }
        }
      }
    });

    let mergedList = Array.from(orderMap.values());

    // Filter by search query (orderNumber, customer name, phone, address, serviceName)
    if (search) {
      const q = search.toLowerCase();
      mergedList = mergedList.filter(o => 
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
      mergedList = mergedList.filter(o => 
        o.customerStage === status || 
        o.status === status || 
        o.paymentStatus === status
      );
    }

    return mergedList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, limitCount);
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
  },

  /**
   * Dedicated helper to update received payment, balance due, and payment status
   */
  async updateOrderPayment(orderId, { receivedAmount, paymentMethod, paymentStatus, note = 'Payment updated' }) {
    const orders = await this.getOrders({ limitCount: 500 });
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId || o.bookingId === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const newReceived = Number(receivedAmount);
    const oldReceived = Number(order.receivedAmount !== undefined ? order.receivedAmount : 0);
    const diffCollected = Math.max(0, newReceived - oldReceived);
    const newBalance = Math.max(0, total - newReceived);
    
    let newStatus = paymentStatus;
    if (!newStatus) {
      if (newReceived >= total && total > 0) newStatus = 'PAID';
      else if (newReceived > 0) newStatus = 'PARTIAL';
      else newStatus = 'PENDING';
    }

    const newPaymentEntry = {
      timestamp: new Date().toISOString(),
      amount: diffCollected > 0 ? diffCollected : newReceived,
      mode: paymentMethod || order.paymentMethod || 'CASH',
      note: note || `Payment recorded`,
      isBalanceSettlement: oldReceived > 0,
      balanceRemaining: newBalance,
    };

    const updatedOrder = {
      ...order,
      receivedAmount: newReceived,
      balanceAmount: newBalance,
      paymentStatus: newStatus,
      paymentMethod: paymentMethod || order.paymentMethod,
      paymentHistory: [...(order.paymentHistory || []), newPaymentEntry],
      priceSnapshot: {
        ...(order.priceSnapshot || {}),
        receivedAmount: newReceived,
        balanceAmount: newBalance,
      },
      updatedAt: new Date().toISOString(),
      statusTimeline: [
        ...(order.statusTimeline || []),
        {
          stage: order.customerStage || 'CONFIRMED',
          label: `Payment: ₹${newReceived} Received (Balance: ₹${newBalance})`,
          timestamp: new Date().toISOString(),
          note: note || `Payment of ₹${newReceived} recorded via ${paymentMethod || order.paymentMethod}.`,
        }
      ]
    };

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true }),
          setDoc(doc(db, 'bookings', order.id), updatedOrder, { merge: true })
        ]);
      } catch (e) {
        console.warn("Firestore updateOrderPayment error:", e);
      }
    }

    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-order-payment-updated', { detail: updatedOrder }));
    }

    return updatedOrder;
  },

  /**
   * Subscribe to real-time newly placed orders across Firestore, BroadcastChannel, and CustomEvents.
   * Callback receives the new order object when any order is placed or received.
   */
  subscribeToNewOrders(callback) {
    if (typeof callback !== 'function') return () => {};

    const unsubscribers = [];
    const processedOrderIds = new Set();

    // 1. Same-window CustomEvent listener
    const handleLocalEvent = (e) => {
      const order = e.detail;
      const key = order?.id || order?.orderNumber;
      if (order && key && !processedOrderIds.has(key)) {
        processedOrderIds.add(key);
        if (order.id) processedOrderIds.add(order.id);
        if (order.orderNumber) processedOrderIds.add(order.orderNumber);
        callback(order);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('techwash-new-order-placed', handleLocalEvent);
      unsubscribers.push(() => window.removeEventListener('techwash-new-order-placed', handleLocalEvent));
    }

    // 2. Cross-Tab BroadcastChannel listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('techwash_orders_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
            const order = event.data.order;
            const key = order?.id || order?.orderNumber;
            if (order && key && !processedOrderIds.has(key)) {
              processedOrderIds.add(key);
              if (order.id) processedOrderIds.add(order.id);
              if (order.orderNumber) processedOrderIds.add(order.orderNumber);
              callback(order);
            }
          }
        };
        unsubscribers.push(() => {
          try {
            channel.close();
          } catch (e) {}
        });
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }

    // 3. Firestore Real-time Snapshot Listener
    if (isFirebaseConfigured && db) {
      try {
        let isInitialLoad = true;
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(25));
        const firestoreUnsub = onSnapshot(q, (snapshot) => {
          if (isInitialLoad) {
            // Populate initial existing order IDs so we only alert on newly added orders
            snapshot.docs.forEach((doc) => {
              processedOrderIds.add(doc.id);
              const data = doc.data();
              if (data?.orderNumber) processedOrderIds.add(data.orderNumber);
            });
            isInitialLoad = false;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const orderData = { id: change.doc.id, ...change.doc.data() };
              const orderKey = orderData.id || orderData.orderNumber;
              if (orderKey && !processedOrderIds.has(orderKey)) {
                processedOrderIds.add(orderKey);
                if (orderData.id) processedOrderIds.add(orderData.id);
                if (orderData.orderNumber) processedOrderIds.add(orderData.orderNumber);
                callback(orderData);
              }
            }
          });
        }, (err) => {
          console.warn('Firestore orders onSnapshot error:', err);
        });

        unsubscribers.push(firestoreUnsub);
      } catch (err) {
        console.warn('Failed to attach Firestore orders listener:', err);
      }
    }

    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {}
      });
    };
  },

  /**
   * Assign an order to a worker/delivery executive with real-time event dispatch
   */
  async assignWorkerToOrder(orderId, staffMember, note = '') {
    if (!orderId || !staffMember) throw new Error('Order and staff member required.');

    const assignmentNote = note || `Order dispatched to rider ${staffMember.name} (${staffMember.phone || ''})`;
    const updated = await this.updateOrderStatus(orderId, {
      assignedStaff: staffMember.name,
      note: assignmentNote,
    });

    // Enrich with worker metadata
    updated.assignedStaffId = staffMember.id;
    updated.assignedStaffName = staffMember.name;
    updated.assignedStaffPhone = staffMember.phone;
    updated.assignedStaffEmail = staffMember.email;
    updated.assignedAt = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', updated.id), updated, { merge: true }),
          setDoc(doc(db, 'bookings', updated.id), updated, { merge: true })
        ]);
      } catch (e) {
        console.warn('Firestore assignment sync error:', e);
      }
    }

    // Cache locally
    const orders = await this.getOrders({ limitCount: 500 });
    const idx = orders.findIndex(o => o.id === updated.id);
    if (idx >= 0) orders[idx] = updated;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    // Broadcast assignment to Worker Portal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-worker-order-assigned', { 
        detail: { order: updated, workerId: staffMember.id } 
      }));

      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ 
            type: 'WORKER_ORDER_ASSIGNED', 
            order: updated, 
            workerId: staffMember.id 
          });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return updated;
  },

  /**
   * Get all orders assigned to a specific worker
   */
  async getOrdersForWorker(workerId, { status = 'ALL', search = '' } = {}) {
    const allOrders = await this.getOrders({ limitCount: 500 });
    if (!workerId) return [];

    let workerOrders = allOrders.filter(o => {
      const matchId = o.assignedStaffId === workerId;
      const matchName = o.assignedStaff && o.assignedStaff.toLowerCase() === workerId.toLowerCase();
      const matchEmail = o.assignedStaffEmail && o.assignedStaffEmail.toLowerCase() === workerId.toLowerCase();
      return matchId || matchName || matchEmail;
    });

    if (search) {
      const q = search.toLowerCase();
      workerOrders = workerOrders.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.address && o.address.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'ALL') {
      workerOrders = workerOrders.filter(o => o.customerStage === status || o.status === status);
    }

    return workerOrders;
  },

  /**
   * Subscribe to orders specifically assigned to a given worker
   */
  subscribeToWorkerOrders(workerId, callback) {
    if (!workerId || typeof callback !== 'function') return () => {};

    const unsubscribers = [];

    // Local custom event listener
    const handleLocalAssignment = (e) => {
      const { order, workerId: targetWorkerId } = e.detail || {};
      if (
        order && 
        (targetWorkerId === workerId || 
         order.assignedStaffId === workerId || 
         order.assignedStaffEmail === workerId)
      ) {
        callback(order);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('techwash-worker-order-assigned', handleLocalAssignment);
      unsubscribers.push(() => window.removeEventListener('techwash-worker-order-assigned', handleLocalAssignment));
    }

    // Cross-tab BroadcastChannel listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('techwash_orders_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'WORKER_ORDER_ASSIGNED' && event.data?.order) {
            const { order, workerId: targetWorkerId } = event.data;
            if (
              targetWorkerId === workerId || 
              order.assignedStaffId === workerId || 
              order.assignedStaffEmail === workerId
            ) {
              callback(order);
            }
          }
        };
        unsubscribers.push(() => {
          try { channel.close(); } catch (e) {}
        });
      } catch (e) {}
    }

    // Also listen to general new order additions in Firestore
    const generalUnsub = this.subscribeToNewOrders((order) => {
      if (
        order.assignedStaffId === workerId || 
        order.assignedStaffEmail === workerId || 
        (order.assignedStaff && order.assignedStaff.toLowerCase() === workerId.toLowerCase())
      ) {
        callback(order);
      }
    });
    unsubscribers.push(generalUnsub);

    return () => {
      unsubscribers.forEach(unsub => {
        try { unsub(); } catch (e) {}
      });
    };
  },

  /**
   * Delete order completely from Firebase Firestore and local cache
   */
  async deleteOrder(orderId) {
    if (!orderId) throw new Error('Order ID required for deletion.');
    const targetId = String(orderId).trim();

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          deleteDoc(doc(db, 'orders', targetId)),
          deleteDoc(doc(db, 'bookings', targetId)),
        ]);
      } catch (e) {
        console.warn('Firestore order deletion notice:', e);
      }
    }

    try {
      const orders = await this.getOrders({ limitCount: 1000 });
      const filtered = orders.filter(o => 
        o.id !== targetId && 
        o.orderNumber !== targetId && 
        o.bookingId !== targetId
      );
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Local storage delete order error:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-order-deleted', { detail: { orderId: targetId } }));
      window.dispatchEvent(new CustomEvent('techwash-worker-refresh-tasks', { detail: { orderId: targetId } }));
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ type: 'ORDER_DELETED', orderId: targetId });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return true;
  },

  /**
   * Unassign worker from an order (return task to unassigned dispatch queue)
   */
  async unassignWorkerFromOrder(orderId, note = 'Worker unassigned from task') {
    if (!orderId) throw new Error('Order ID required.');

    const orders = await this.getOrders({ limitCount: 500 });
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId || o.bookingId === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const updatedOrder = {
      ...order,
      assignedStaff: null,
      assignedStaffId: null,
      assignedStaffName: null,
      assignedStaffPhone: null,
      assignedStaffEmail: null,
      assignedAt: null,
      updatedAt: new Date().toISOString(),
      statusTimeline: [
        ...(order.statusTimeline || []),
        {
          stage: order.customerStage || 'CONFIRMED',
          label: 'Rider Unassigned',
          timestamp: new Date().toISOString(),
          note: note || 'Task returned to unassigned dispatch queue.',
        }
      ]
    };

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true }),
          setDoc(doc(db, 'bookings', order.id), updatedOrder, { merge: true })
        ]);
      } catch (e) {
        console.warn('Firestore unassign worker error:', e);
      }
    }

    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-worker-refresh-tasks', { detail: { orderId } }));
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ type: 'WORKER_TASK_UNASSIGNED', orderId });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return updatedOrder;
  },

  /**
   * Permanently delete an order from Firebase Firestore and local storage
   */
  async deleteOrder(orderId) {
    if (!orderId) throw new Error('Order ID required for deletion.');

    // 1. Delete from Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          deleteDoc(doc(db, 'orders', orderId)),
          deleteDoc(doc(db, 'bookings', orderId))
        ]);
      } catch (e) {
        console.warn('Firestore delete order error (continuing local clean):', e);
      }
    }

    // 2. Remove from local storage cache
    try {
      const orders = (await this.getOrders({ limitCount: 2000 })).filter(
        o => o.id !== orderId && o.orderNumber !== orderId && o.bookingId !== orderId
      );
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {}

    // 3. Dispatch global broadcast to refresh all components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-orders-updated', { detail: { deletedId: orderId } }));
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ type: 'ORDER_DELETED', orderId });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return true;
  }
};


