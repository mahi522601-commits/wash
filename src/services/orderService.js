/**
 * Centralized Booking & Order Lifecycle Management Service for Tech Wash
 * Single source of truth in Firebase Firestore: `bookings` and `orders` collections
 * Synchronizes customer CRM `customers` collection on every booking and financial update.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { posBridgeService } from './posBridgeService.js';
import { syncQueueService } from './syncQueueService.js';
import { posIndexedDB } from './posIndexedDB.js';
import { localDbService } from './localDbService.js';
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

export const TIME_PERIODS = {
  MORNING: {
    key: 'MORNING',
    label: 'Morning',
    timeWindow: '08:00 AM - 12:00 PM',
    icon: '🌅',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  AFTERNOON: {
    key: 'AFTERNOON',
    label: 'Afternoon',
    timeWindow: '12:00 PM - 04:00 PM',
    icon: '☀️',
    color: 'orange',
    badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
  },
  EVENING: {
    key: 'EVENING',
    label: 'Evening',
    timeWindow: '04:00 PM - 08:00 PM',
    icon: '🌙',
    color: 'indigo',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
  }
};

export const TIME_SLOTS = [
  { 
    id: 'morning', 
    period: 'MORNING', 
    label: 'Morning (08:00 AM - 12:00 PM)', 
    time: '08:00 AM - 12:00 PM', 
    shortLabel: 'Morning (8AM - 12PM)',
    icon: '🌅' 
  },
  { 
    id: 'afternoon', 
    period: 'AFTERNOON', 
    label: 'Afternoon (12:00 PM - 04:00 PM)', 
    time: '12:00 PM - 04:00 PM', 
    shortLabel: 'Afternoon (12PM - 4PM)',
    icon: '☀️' 
  },
  { 
    id: 'evening', 
    period: 'EVENING', 
    label: 'Evening (04:00 PM - 08:00 PM)', 
    time: '04:00 PM - 08:00 PM', 
    shortLabel: 'Evening (4PM - 8PM)',
    icon: '🌙' 
  },
];

export const normalizeDateString = (dateInput) => {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Standard JS Date parsing
  let d = new Date(str);
  if (isNaN(d.getTime())) {
    // Replace September variant 'Sept' -> 'Sep'
    const cleaned = str.replace(/Sept/i, 'Sep');
    d = new Date(cleaned);
  }
  // Try DD-MM-YYYY or DD/MM/YYYY format
  if (isNaN(d.getTime())) {
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else if (parts[0].length === 4) {
        d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      }
    }
  }
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Fallback to today's YYYY-MM-DD if unparseable
  return new Date().toISOString().split('T')[0];
};

export const normalizePeriod = (periodOrSlot) => {
  if (!periodOrSlot) return 'MORNING';
  const str = String(periodOrSlot).toUpperCase();
  if (str.includes('AFTERNOON') || str.includes('12:00') || str.includes('01:') || str.includes('02:') || str.includes('03:')) {
    return 'AFTERNOON';
  }
  if (str.includes('EVENING') || str.includes('NIGHT') || str.includes('04:') || str.includes('05:') || str.includes('06:') || str.includes('07:') || str.includes('08:') || str.includes('4:00') || str.includes('8:00')) {
    return 'EVENING';
  }
  return 'MORNING';
};

export const calculateDefaultDelivery = (pickupDateStr, isExpress = false, defaultPeriod = 'MORNING') => {
  const base = pickupDateStr ? new Date(pickupDateStr) : new Date();
  const safeBase = isNaN(base.getTime()) ? new Date() : base;
  const daysToAdd = isExpress ? 1 : 2;
  
  const deliveryDateObj = new Date(safeBase);
  deliveryDateObj.setDate(deliveryDateObj.getDate() + daysToAdd);
  const deliveryDate = normalizeDateString(deliveryDateObj);
  
  const periodKey = normalizePeriod(defaultPeriod);
  const periodObj = TIME_PERIODS[periodKey] || TIME_PERIODS.MORNING;
  const deliverySlot = `${periodObj.label} (${periodObj.timeWindow})`;
  
  return {
    deliveryDate,
    deliveryPeriod: periodKey,
    deliverySlot
  };
};

export const getTodayTomorrowDates = () => {
  const now = new Date();
  const todayStr = normalizeDateString(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = normalizeDateString(tomorrow);
  return { todayStr, tomorrowStr, now };
};

const ORDERS_STORAGE_KEY = 'techwash_orders_store';
const ORDER_SEQ_KEY = 'techwash_order_sequence_counter';

export const getOrderBranchKey = (order) => {
  if (!order) return 'counter-1';

  const tId = String(order.terminalId || '').toLowerCase().trim();
  const tCode = String(order.terminalCode || '').toLowerCase().trim();
  const bName = String(order.storeBranch || order.branch || order.customer?.storeBranch || order.customer?.address || '').toLowerCase().trim();

  // Explicit Counter 2 checks (Branch 1 — Tolichowki / OU Colony / DreamScape / POS-02)
  if (
    tId === 'counter-2' || tId === '2' || tId.includes('counter-2') || tId.includes('pos-02') || 
    tCode === 'tw-pos-02' || tCode.includes('pos-02') || tCode.includes('02') ||
    bName.includes('branch 1') || bName.includes('tolichowki') || bName.includes('ou colony') ||
    bName.includes('dreamscape')
  ) {
    return 'counter-2';
  }

  // Explicit Counter 3 checks (Pick Up Point — Ambience Courtyard / POS-03)
  if (
    tId === 'counter-3' || tId === '3' || tId.includes('counter-3') || tId.includes('pos-03') || 
    tCode === 'tw-pos-03' || tCode.includes('pos-03') || tCode.includes('03') ||
    bName.includes('ambience') || bName.includes('courtyard') || bName.includes('pick up point') ||
    bName.includes('pickup')
  ) {
    return 'counter-3';
  }

  // Explicit Online Website check ONLY IF marked as online website booking
  if (order.isOnlineBooking === true || order.orderSource === 'ONLINE_WEBSITE' || order.channel === 'ONLINE_WEBSITE' || order.channel === 'ONLINE') {
    return 'ONLINE_WEBSITE';
  }

  // Counter 1 or fallback POS (Main Branch — Manikonda / Shaikpet Main Rd / POS-01)
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
    // 1. Generate Deterministic Local ID (POS01-YYYYMMDD-XXXXXX)
    const activeTerminalId = orderPayload.terminalId || (typeof localStorage !== 'undefined' && localStorage.getItem('techwash_terminal_id')) || 'counter-1';
    const activeBranchCode = activeTerminalId === 'counter-2' ? 'POS02' : (activeTerminalId === 'counter-3' ? 'POS03' : 'POS01');
    const dateCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    let orderNumber = orderPayload.orderNumber || orderPayload.id || '';
    if (!orderNumber || !String(orderNumber).startsWith('TW-')) {
      const seqData = await this.getNextOrderSequence();
      orderNumber = seqData.orderNumber;
    }

    const seqNumStr = (orderNumber.match(/\d+/) || [Date.now().toString().slice(-6)])[0].padStart(6, '0');
    const localId = orderPayload.localId || orderPayload.id || `${activeBranchCode}-${dateCompact}-${seqNumStr}`;
    const orderId = localId;

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

    const rawPickupDate = orderPayload.schedule?.pickupDate || orderPayload.pickupDate || new Date().toISOString().split('T')[0];
    const pickupDate = normalizeDateString(rawPickupDate);
    const pickupPeriod = orderPayload.schedule?.pickupPeriod || orderPayload.pickupPeriod || normalizePeriod(orderPayload.schedule?.pickupSlot || orderPayload.pickupSlot);
    const pickupSlot = orderPayload.schedule?.pickupSlot || orderPayload.pickupSlot || (isWalkIn ? 'In-Store Counter' : (TIME_PERIODS[pickupPeriod]?.timeWindow ? `${TIME_PERIODS[pickupPeriod].label} (${TIME_PERIODS[pickupPeriod].timeWindow})` : 'Morning (08:00 AM - 12:00 PM)'));

    const defDelivery = calculateDefaultDelivery(pickupDate, Boolean(orderPayload.isExpress), pickupPeriod);
    const rawDeliveryDate = orderPayload.schedule?.deliveryDate || orderPayload.deliveryDate || defDelivery.deliveryDate;
    const deliveryDate = normalizeDateString(rawDeliveryDate);
    const deliveryPeriod = orderPayload.schedule?.deliveryPeriod || orderPayload.deliveryPeriod || normalizePeriod(orderPayload.schedule?.deliverySlot || orderPayload.deliverySlot || defDelivery.deliveryPeriod);
    const deliverySlot = orderPayload.schedule?.deliverySlot || orderPayload.deliverySlot || (TIME_PERIODS[deliveryPeriod]?.timeWindow ? `${TIME_PERIODS[deliveryPeriod].label} (${TIME_PERIODS[deliveryPeriod].timeWindow})` : defDelivery.deliverySlot);

    const schedule = {
      pickupDate,
      pickupPeriod,
      pickupSlot,
      deliveryDate,
      deliveryPeriod,
      deliverySlot,
      instructions: orderPayload.schedule?.instructions || orderPayload.notes || '',
      ...(orderPayload.schedule || {})
    };

    const fullOrder = {
      ...orderPayload,
      localId,
      serverId: localId,
      id: orderId,
      bookingId: orderId,
      orderNumber,
      invoiceNumber: orderPayload.invoiceNumber || `INV-${localId}`,
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
      terminalId: activeTerminalId,
      terminalCode: activeTerminalId === 'counter-2' ? 'TW-POS-02' : (activeTerminalId === 'counter-3' ? 'TW-POS-03' : 'TW-POS-01'),
      storeBranch: orderPayload.storeBranch || (activeTerminalId === 'counter-2' ? 'Branch 1 — Tolichowki' : (activeTerminalId === 'counter-3' ? 'Pick Up Point — Ambience' : 'Main Branch — Manikonda')),
      cashierName: orderPayload.cashierName || 'Cashier #1',
      pickupDate,
      pickupPeriod,
      pickupSlot,
      deliveryDate,
      deliveryPeriod,
      deliverySlot,
      schedule,
      notes: orderPayload.schedule?.instructions || orderPayload.notes || '',
      adminNotes: orderPayload.adminNotes || '',
      customerStage: orderPayload.customerStage || 'CONFIRMED',
      status: orderPayload.status || 'CONFIRMED',
      internalStage: orderPayload.internalStage || 'RECEIVED_AT_HUB',
      paymentStatus: resolvedPaymentStatus,
      paymentMethod: orderPayload.paymentMethod || 'PAY_ON_DELIVERY',
      priceSnapshot,
      syncStatus: 'LOCAL_SAVED',
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

    // STEP 1: Save transaction to browser IndexedDB FIRST (orders, customers, payments & dues stores)
    try {
      await localDbService.saveLocalOrder(fullOrder);
    } catch (e) {
      console.warn('IndexedDB order write notice:', e);
    }

    // STEP 2: Enqueue into IndexedDB Synchronization Queue (status: SYNC_PENDING)
    await syncQueueService.enqueueTransaction(fullOrder, 'CREATE');

    // STEP 3: Save PDF Invoice & Excel export via Local Windows Bridge
    try {
      await posBridgeService.saveTransaction(fullOrder, activeTerminalId);
    } catch (e) {
      console.warn('Local bridge PDF/Excel write notice:', e);
    }

    // STEP 4: Save in local storage fallback cache & dispatch UI events
    try {
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '[]');
      } catch (e) {
        localOrders = [];
      }
      const updatedLocal = [fullOrder, ...localOrders.filter(o => o.id !== fullOrder.id && o.orderNumber !== fullOrder.orderNumber)];
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedLocal));
    } catch (e) {}

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
        const results = await Promise.allSettled([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'bookings'))
        ]);

        const mapById = new Map();
        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value && !res.value.empty) {
            res.value.docs.forEach(d => {
              const data = d.data();
              const docId = d.id;
              const orderNum = data.orderNumber || data.id || docId;
              if (orderNum) {
                const normKey = String(orderNum).toUpperCase().trim();
                if (!mapById.has(normKey)) {
                  mapById.set(normKey, { id: docId, ...data });
                } else {
                  mapById.set(normKey, { ...data, ...mapById.get(normKey) });
                }
              }
            });
          }
        });
        ordersList = Array.from(mapById.values());
        if (ordersList.length > 0) {
          posIndexedDB.saveBulkItems('orders', ordersList, 'localId').catch(() => {});
        }
      } catch (e) {
        console.warn('Firestore orders fetch notice:', e);
      }
    }

    // 2. Fetch and merge Primary IndexedDB 'orders' store
    const orderMap = new Map();
    ordersList.forEach(o => {
      const key = o.orderNumber || o.id || o.localId;
      if (key) {
        orderMap.set(String(key).toUpperCase().trim(), o);
      }
    });

    try {
      const dbOrders = await posIndexedDB.getAllOrders();
      dbOrders.forEach(o => {
        if (o && typeof o === 'object') {
          const oNum = o.orderNumber || o.invoiceNumber || o.localId || o.id;
          if (oNum) {
            const normKey = String(oNum).toUpperCase().trim();
            const existing = orderMap.get(normKey);
            if (!existing) {
              orderMap.set(normKey, o);
            } else {
              const localTime = new Date(o.updatedAt || o.createdAt || 0).getTime();
              const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
              if (localTime >= remoteTime) {
                orderMap.set(normKey, { ...existing, ...o });
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn('IndexedDB orders read notice:', e);
    }

    // 3. Fallback scan localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const keyName = localStorage.key(i);
          if (!keyName) continue;
          const lowerKey = keyName.toLowerCase();
          if (
            lowerKey.includes('order') || 
            lowerKey.includes('booking') || 
            lowerKey.includes('bill')
          ) {
            try {
              const raw = localStorage.getItem(keyName);
              if (!raw) continue;
              const parsed = JSON.parse(raw);
              const list = Array.isArray(parsed) 
                ? parsed 
                : (parsed?.orders && Array.isArray(parsed.orders) 
                   ? parsed.orders 
                   : (typeof parsed === 'object' ? Object.values(parsed) : []));

              list.forEach(o => {
                if (o && typeof o === 'object') {
                  if (o.type === 'SNAPSHOT' || o.reportDate || o.runId || o.isSnapshot) return;
                  const oNum = o.orderNumber || o.invoiceNumber || o.bookingId || o.id;
                  if (oNum) {
                    const normKey = String(oNum).toUpperCase().trim();
                    if (!orderMap.has(normKey)) {
                      orderMap.set(normKey, o);
                    }
                  }
                }
              });
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

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
   * Get single order by Order ID, Order Number, Manual Slip #, or Customer Phone Number
   * Multi-strategy lookup with Firestore collection queries & local cache fallback
   */
  async getOrderById(orderIdOrNumber) {
    if (!orderIdOrNumber) return null;
    const raw = String(orderIdOrNumber).trim();
    const upper = raw.toUpperCase();
    const cleanDigits = raw.replace(/\D/g, '');
    const withoutPrefix = upper.replace(/^#|^TW-?/, '');
    const withTW = upper.startsWith('TW-') ? upper : `TW-${withoutPrefix}`;

    const searchVariants = Array.from(new Set([
      raw,
      upper,
      withTW,
      withoutPrefix,
      `#${withoutPrefix}`,
      `#${withTW}`,
      cleanDigits,
    ])).filter(Boolean);

    // 1. Check Firebase Firestore
    if (isFirebaseConfigured && db) {
      // Direct doc ID lookups in orders & bookings
      for (const variant of [raw, upper, withTW, withoutPrefix]) {
        try {
          const snapO = await getDoc(doc(db, 'orders', variant));
          if (snapO.exists()) return { id: snapO.id, ...snapO.data() };
          
          const snapB = await getDoc(doc(db, 'bookings', variant));
          if (snapB.exists()) return { id: snapB.id, ...snapB.data() };
        } catch (e) {}
      }

      // Query collections by fields (orderNumber, manualBillNumber, invoiceNumber, phone)
      try {
        const colOrders = collection(db, 'orders');
        for (const variant of searchVariants) {
          // by orderNumber
          const qOrderNum = query(colOrders, where('orderNumber', '==', variant), limit(1));
          const snapOrderNum = await getDocs(qOrderNum);
          if (!snapOrderNum.empty) return { id: snapOrderNum.docs[0].id, ...snapOrderNum.docs[0].data() };

          // by manualBillNumber
          const qManual = query(colOrders, where('manualBillNumber', '==', variant), limit(1));
          const snapManual = await getDocs(qManual);
          if (!snapManual.empty) return { id: snapManual.docs[0].id, ...snapManual.docs[0].data() };

          // by invoiceNumber
          const qInv = query(colOrders, where('invoiceNumber', '==', variant), limit(1));
          const snapInv = await getDocs(qInv);
          if (!snapInv.empty) return { id: snapInv.docs[0].id, ...snapInv.docs[0].data() };
        }

        // Search by phone if >= 10 digits
        if (cleanDigits.length >= 10) {
          const tenDigit = cleanDigits.slice(-10);
          for (const pVariant of [cleanDigits, tenDigit, `+91${tenDigit}`, `91${tenDigit}`]) {
            const qPhone = query(colOrders, where('phone', '==', pVariant), limit(1));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) return { id: snapPhone.docs[0].id, ...snapPhone.docs[0].data() };
          }
        }
      } catch (e) {
        console.warn('Firestore query error in getOrderById:', e);
      }
    }

    // 2. Check Local Storage Orders Cache
    const orders = await this.getOrders({ limitCount: 1000 });
    return orders.find(o => {
      const oId = String(o.id || '').toUpperCase();
      const oNum = String(o.orderNumber || '').toUpperCase();
      const oBooking = String(o.bookingId || '').toUpperCase();
      const oManual = String(o.manualBillNumber || '').toUpperCase();
      const oInv = String(o.invoiceNumber || '').toUpperCase();
      const oPhone = String(o.phone || o.customer?.phone || o.whatsapp || '').replace(/\D/g, '');

      return searchVariants.some(v => {
        const vUpper = v.toUpperCase();
        return (
          oId === vUpper ||
          oNum === vUpper ||
          oBooking === vUpper ||
          oManual === vUpper ||
          oInv === vUpper ||
          (cleanDigits.length >= 10 && oPhone.includes(cleanDigits.slice(-10)))
        );
      });
    }) || null;
  },

  /**
   * Update order status, milestone stage, actual weight, final price, staff assignment & append to timeline
   * Supports both (orderId, 'DELIVERED', 'note') and (orderId, { customerStage, status, note, ... })
   */
  async updateOrderStatus(orderId, statusOrPayload, maybeNote = '') {
    let payload = {};
    if (typeof statusOrPayload === 'string') {
      payload = {
        customerStage: statusOrPayload,
        status: statusOrPayload,
        note: typeof maybeNote === 'string' ? maybeNote : '',
      };
    } else if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
      payload = statusOrPayload;
    }

    const { 
      customerStage, 
      status,
      internalStage, 
      note = '', 
      paymentStatus = null, 
      assignedStaff = null,
      actualWeight = undefined,
      finalPrice = undefined,
      adminNotes = undefined,
      receivedAmount = undefined,
      balanceAmount = undefined
    } = payload;

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
    const newPaymentStatus = paymentStatus || order.paymentStatus || 'PENDING';
    const newReceived = receivedAmount !== undefined ? Number(receivedAmount) : order.receivedAmount;
    const newBalance = balanceAmount !== undefined ? Number(balanceAmount) : (
      newReceived !== undefined && newFinalPrice !== undefined ? Math.max(0, Number(newFinalPrice) - Number(newReceived)) : order.balanceAmount
    );

    const updatedOrder = {
      ...order,
      customerStage: stageKey,
      status: stageKey,
      internalStage: internalStage || order.internalStage || 'RECEIVED_AT_HUB',
      paymentStatus: newPaymentStatus,
      receivedAmount: newReceived !== undefined ? newReceived : order.receivedAmount,
      balanceAmount: newBalance !== undefined ? newBalance : order.balanceAmount,
      assignedStaff: assignedStaff !== undefined ? assignedStaff : order.assignedStaff,
      actualWeight: newActualWeight,
      finalPrice: newFinalPrice,
      totalAmount: newFinalPrice,
      adminNotes: newAdminNotes,
      updatedAt: new Date().toISOString(),
      statusTimeline: [...(order.statusTimeline || []), newTimelineEntry],
    };

    // STEP 1: Save transaction update to IndexedDB master stores FIRST
    try {
      await localDbService.saveLocalOrder(updatedOrder);
    } catch (e) {
      console.warn("Local storage update notice:", e);
    }

    // STEP 2: Save transaction update to Local Windows Bridge
    try {
      await posBridgeService.saveTransaction(updatedOrder, updatedOrder.terminalId || 'counter-1');
    } catch (e) {
      console.warn("Local bridge update status notice:", e);
    }

    // STEP 3: Enqueue update into Sync Queue Service (status: SYNC_PENDING)
    syncQueueService.enqueueTransaction(updatedOrder, 'UPDATE');

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true }),
          setDoc(doc(db, 'bookings', order.id), updatedOrder, { merge: true })
        ]);

        // If price changed, update customer totalSpent in Firestore
        const phone = order.phone || order.customer?.phone ? String(order.phone || order.customer.phone).replace(/\D/g, '') : null;
        if (phone && finalPrice !== undefined && Number(finalPrice) !== Number(order.finalPrice || order.totalAmount || 0)) {
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

    // Dispatch real-time events so all tabs, POS modals & Admin Order Management sync immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { 
        detail: { orderId: order.id, status: stageKey, customerStage: stageKey, order: updatedOrder } 
      }));
      window.dispatchEvent(new CustomEvent('techwash-orders-updated', { 
        detail: { orderId: order.id, status: stageKey, order: updatedOrder } 
      }));
    }

    return updatedOrder;
  },

  /**
   * Reschedule or update pickup / delivery date & time slots
   */
  async updateOrderSchedule(orderId, { deliveryDate, deliverySlot, deliveryPeriod, pickupDate, pickupSlot, pickupPeriod, note = 'Schedule updated' }) {
    const orders = await this.getOrders({ limitCount: 500 });
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId || o.bookingId === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const newPickupDate = pickupDate ? normalizeDateString(pickupDate) : (order.pickupDate || order.schedule?.pickupDate);
    const newPickupPeriod = pickupPeriod || order.pickupPeriod || order.schedule?.pickupPeriod || 'MORNING';
    const newPickupSlot = pickupSlot || order.pickupSlot || order.schedule?.pickupSlot || (TIME_PERIODS[newPickupPeriod]?.timeWindow ? `${TIME_PERIODS[newPickupPeriod].label} (${TIME_PERIODS[newPickupPeriod].timeWindow})` : 'Morning (08:00 AM - 12:00 PM)');

    const newDeliveryDate = deliveryDate ? normalizeDateString(deliveryDate) : (order.deliveryDate || order.schedule?.deliveryDate);
    const newDeliveryPeriod = deliveryPeriod || order.deliveryPeriod || order.schedule?.deliveryPeriod || 'MORNING';
    const newDeliverySlot = deliverySlot || order.deliverySlot || order.schedule?.deliverySlot || (TIME_PERIODS[newDeliveryPeriod]?.timeWindow ? `${TIME_PERIODS[newDeliveryPeriod].label} (${TIME_PERIODS[newDeliveryPeriod].timeWindow})` : 'Morning (08:00 AM - 12:00 PM)');

    const updatedSchedule = {
      ...(order.schedule || {}),
      pickupDate: newPickupDate,
      pickupPeriod: newPickupPeriod,
      pickupSlot: newPickupSlot,
      deliveryDate: newDeliveryDate,
      deliveryPeriod: newDeliveryPeriod,
      deliverySlot: newDeliverySlot,
    };

    const updatedOrder = {
      ...order,
      pickupDate: newPickupDate,
      pickupPeriod: newPickupPeriod,
      pickupSlot: newPickupSlot,
      deliveryDate: newDeliveryDate,
      deliveryPeriod: newDeliveryPeriod,
      deliverySlot: newDeliverySlot,
      schedule: updatedSchedule,
      updatedAt: new Date().toISOString(),
      statusTimeline: [
        ...(order.statusTimeline || []),
        {
          stage: order.customerStage || 'CONFIRMED',
          label: 'Delivery Schedule Updated',
          timestamp: new Date().toISOString(),
          note: note || `Delivery updated to ${newDeliveryDate} (${newDeliverySlot})`,
        }
      ]
    };

    // Save update to Local Windows Bridge FIRST
    try {
      await posBridgeService.saveTransaction(updatedOrder, updatedOrder.terminalId || 'counter-1');
    } catch (e) {}
    syncQueueService.enqueueTransaction(updatedOrder, 'UPDATE');

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'orders', order.id), updatedOrder, { merge: true }),
          setDoc(doc(db, 'bookings', order.id), updatedOrder, { merge: true })
        ]);
      } catch (e) {
        console.warn("Firestore updateOrderSchedule error:", e);
      }
    }

    const idx = orders.findIndex(o => o.id === order.id);
    if (idx >= 0) orders[idx] = updatedOrder;
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { detail: updatedOrder }));
    }

    return updatedOrder;
  },

  /**
   * Group orders into Today's Tasks, Tomorrow's Deliveries (for WhatsApp reminders), and Overdue tasks.
   * Categorizes Morning, Afternoon, Evening delivery slots.
   */
  getTaskScheduleMetrics(orders = []) {
    const { todayStr, tomorrowStr } = getTodayTomorrowDates();

    const activeOrders = (orders || []).filter(o => o && o.status !== 'CANCELLED' && o.customerStage !== 'CANCELLED');

    // All active pending tasks (not yet delivered)
    const allActiveTasks = activeOrders.filter(o => (o.customerStage || o.status) !== 'DELIVERED');

    // Pickups & Intakes scheduled or dropped today
    const pickupPendingStages = ['CONFIRMED', 'PICKUP_SCHEDULED'];
    const todayPickups = activeOrders.filter(o => {
      const pDate = normalizeDateString(o.pickupDate || o.schedule?.pickupDate);
      const isPendingPickup = pickupPendingStages.includes(o.customerStage || o.status);
      const isTodayWalkIn = Boolean(o.isWalkIn || o.orderSource === 'OFFLINE_POS') && 
                            (pDate === todayStr || (o.createdAt && normalizeDateString(o.createdAt) === todayStr));
      return (pDate === todayStr && isPendingPickup) || isTodayWalkIn;
    });

    // Orders booked or dropped off today
    const todayIntakes = activeOrders.filter(o => {
      const pDate = normalizeDateString(o.pickupDate || o.schedule?.pickupDate);
      const cDate = o.createdAt ? normalizeDateString(o.createdAt) : '';
      return pDate === todayStr || cDate === todayStr;
    });

    // Deliveries scheduled for today (not yet delivered)
    const todayDeliveries = activeOrders.filter(o => {
      const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
      const isPendingDelivery = (o.customerStage || o.status) !== 'DELIVERED';
      return dDate === todayStr && isPendingDelivery;
    });

    // Deliveries scheduled for tomorrow (for 1-click WhatsApp reminders)
    const tomorrowDeliveries = activeOrders.filter(o => {
      const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
      const isPendingDelivery = (o.customerStage || o.status) !== 'DELIVERED';
      return dDate === tomorrowStr && isPendingDelivery;
    });

    // Overdue deliveries (scheduled delivery date passed and not yet delivered)
    const overdueDeliveries = activeOrders.filter(o => {
      const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
      const isPendingDelivery = (o.customerStage || o.status) !== 'DELIVERED';
      return dDate && dDate < todayStr && isPendingDelivery;
    });

    // All active pending deliveries (sorted chronologically: overdue -> today -> tomorrow -> upcoming)
    const allDeliveries = [...allActiveTasks].sort((a, b) => {
      const dateA = normalizeDateString(a.deliveryDate || a.schedule?.deliveryDate || a.pickupDate || '9999-99-99');
      const dateB = normalizeDateString(b.deliveryDate || b.schedule?.deliveryDate || b.pickupDate || '9999-99-99');
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const periodOrder = { MORNING: 1, AFTERNOON: 2, EVENING: 3 };
      const pA = periodOrder[normalizePeriod(a.deliveryPeriod || a.schedule?.deliveryPeriod)] || 1;
      const pB = periodOrder[normalizePeriod(b.deliveryPeriod || b.schedule?.deliveryPeriod)] || 1;
      return pA - pB;
    });

    // Breakdown Deliveries by Period (Morning, Afternoon, Evening)
    const groupByPeriod = (orderList) => {
      const morning = [];
      const afternoon = [];
      const evening = [];

      orderList.forEach(o => {
        const period = normalizePeriod(o.deliveryPeriod || o.schedule?.deliveryPeriod || o.deliverySlot || o.schedule?.deliverySlot);
        if (period === 'AFTERNOON') {
          afternoon.push(o);
        } else if (period === 'EVENING') {
          evening.push(o);
        } else {
          morning.push(o);
        }
      });

      return { morning, afternoon, evening };
    };

    const todayDeliveriesByPeriod = groupByPeriod(todayDeliveries);
    const tomorrowDeliveriesByPeriod = groupByPeriod(tomorrowDeliveries);

    return {
      todayStr,
      tomorrowStr,
      allActiveTasks,
      allDeliveries,
      todayIntakes,
      todayPickups,
      todayDeliveries,
      tomorrowDeliveries,
      overdueDeliveries,
      todayDeliveriesByPeriod,
      tomorrowDeliveriesByPeriod,
      counts: {
        allDeliveries: allDeliveries.length,
        allActive: allActiveTasks.length,
        totalTasks: allActiveTasks.length,
        todayIntakes: todayIntakes.length,
        todayPickups: todayPickups.length,
        todayDeliveries: todayDeliveries.length,
        todayMorning: todayDeliveriesByPeriod.morning.length,
        todayAfternoon: todayDeliveriesByPeriod.afternoon.length,
        todayEvening: todayDeliveriesByPeriod.evening.length,
        tomorrowDeliveries: tomorrowDeliveries.length,
        tomorrowMorning: tomorrowDeliveriesByPeriod.morning.length,
        tomorrowAfternoon: tomorrowDeliveriesByPeriod.afternoon.length,
        tomorrowEvening: tomorrowDeliveriesByPeriod.evening.length,
        overdueDeliveries: overdueDeliveries.length,
      }
    };
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
  async updateOrderPayment(orderId, { receivedAmount, paymentMethod, paymentStatus, markDelivered = false, note = 'Payment updated' }) {
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
      paymentEventId: `pay-${order.terminalId || 'POS'}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      amount: diffCollected > 0 ? diffCollected : newReceived,
      mode: paymentMethod || order.paymentMethod || 'CASH',
      note: note || `Payment recorded`,
      isBalanceSettlement: oldReceived > 0,
      balanceRemaining: newBalance,
    };

    const shouldMarkDelivered = Boolean(markDelivered || (paymentMethod === 'CASH' && newStatus === 'PAID' && markDelivered !== false));
    const targetStage = shouldMarkDelivered ? 'DELIVERED' : (order.customerStage || 'CONFIRMED');

    const updatedOrder = {
      ...order,
      receivedAmount: newReceived,
      balanceAmount: newBalance,
      paymentStatus: newStatus,
      paymentMethod: paymentMethod || order.paymentMethod,
      customerStage: targetStage,
      status: targetStage,
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
          stage: targetStage,
          label: `Payment: ₹${newReceived} Received (Balance: ₹${newBalance})`,
          timestamp: new Date().toISOString(),
          note: note || `Payment of ₹${newReceived} recorded via ${paymentMethod || order.paymentMethod}.`,
        },
        ...(shouldMarkDelivered ? [{
          stage: 'DELIVERED',
          label: 'Order Delivered (Payment Cleared)',
          timestamp: new Date().toISOString(),
          note: 'Full payment received at POS counter — Order marked as DELIVERED.',
        }] : [])
      ]
    };

    // STEP 1: Save transaction update to Local Windows Bridge FIRST
    try {
      await posBridgeService.saveTransaction(updatedOrder, updatedOrder.terminalId || 'counter-1');
    } catch (e) {
      console.warn("Local bridge update payment notice:", e);
    }

    // STEP 2: Enqueue update into Sync Queue Service (status: SYNC_PENDING)
    syncQueueService.enqueueTransaction(updatedOrder, 'PAYMENT');

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

    try {
      await posIndexedDB.deleteItem('orders', targetId);
      await posIndexedDB.deleteSyncItem(targetId);
      await posIndexedDB.deleteItem('dues', `due-${targetId}`);
    } catch (e) {
      console.warn('IndexedDB delete notice:', e);
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
  },

  /**
   * Permanently delete all orders (or a list of order IDs) from Firebase Firestore, IndexedDB, and local storage
   */
  async deleteAllOrders(orderIds = null) {
    let targetIds = [];

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      targetIds = orderIds.map(id => String(id).trim()).filter(Boolean);
    } else {
      // Fetch all existing order IDs
      const allOrders = await this.getOrders({ limitCount: 5000 });
      targetIds = allOrders.map(o => o.id).filter(Boolean);
    }

    if (targetIds.length === 0) {
      try {
        localStorage.removeItem(ORDERS_STORAGE_KEY);
      } catch (e) {}
      return { success: true, deletedCount: 0 };
    }

    // 1. Delete from Firebase Firestore in parallel
    if (isFirebaseConfigured && db) {
      const deletePromises = [];
      for (const id of targetIds) {
        deletePromises.push(
          deleteDoc(doc(db, 'orders', id)).catch(e => console.warn(`Firestore delete order error (${id}):`, e.message)),
          deleteDoc(doc(db, 'bookings', id)).catch(e => console.warn(`Firestore delete booking error (${id}):`, e.message))
        );
      }
      try {
        await Promise.all(deletePromises);
      } catch (e) {
        console.warn('Batch delete error:', e);
      }
    }

    // 2. Clear IndexedDB local storage tables if available
    try {
      if (posIndexedDB && typeof posIndexedDB.clearStore === 'function') {
        await posIndexedDB.clearStore('orders');
        await posIndexedDB.clearStore('syncQueue');
      }
    } catch (e) {
      console.warn('IndexedDB clear error:', e);
    }

    // 3. Update / Clear local storage cache
    try {
      if (!orderIds || orderIds.length === 0) {
        localStorage.removeItem(ORDERS_STORAGE_KEY);
      } else {
        const remaining = (await this.getOrders({ limitCount: 5000 })).filter(
          o => !targetIds.includes(o.id) && !targetIds.includes(o.orderNumber)
        );
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(remaining));
      }
    } catch (e) {}

    // 4. Dispatch global broadcast events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-orders-updated', { detail: { deletedAll: true, count: targetIds.length } }));
      window.dispatchEvent(new CustomEvent('techwash-order-deleted', { detail: { deleteAll: true } }));
      window.dispatchEvent(new CustomEvent('techwash-worker-refresh-tasks', { detail: { deleteAll: true } }));
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('techwash_orders_channel');
          channel.postMessage({ type: 'ALL_ORDERS_DELETED', count: targetIds.length });
          setTimeout(() => {
            try { channel.close(); } catch (e) {}
          }, 200);
        }
      } catch (e) {}
    }

    return { success: true, deletedCount: targetIds.length };
  }
};


