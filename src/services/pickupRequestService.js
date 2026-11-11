/**
 * Tech Wash – Doorstep Pickup Request Service
 * Single source of truth in Firebase Firestore: `doorstep_pickup_requests` collection
 * Fully synchronized between Website, Admin Dashboard, and TW-POS-02 (Tolichowki Branch Counter 2)
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
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { orderService } from './orderService.js';
import { startOrderRingingAlarm, stopOrderRingingAlarm } from '../utils/audioNotification.js';

export const PICKUP_COLLECTION = 'doorstep_pickup_requests';
export const PICKUP_LOCAL_STORAGE_KEY = 'techwash_doorstep_pickup_requests';
export const PICKUP_SEQ_STORAGE_KEY = 'techwash_doorstep_pickup_seq';

export const PICKUP_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Pickup Boy Assigned',
  OUT_FOR_PICKUP: 'Out for Pickup',
  COLLECTED: 'Collected',
  DELIVERED_TO_BRANCH: 'Delivered to Branch',
  CONVERTED: 'Converted to Order',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const PICKUP_STATUS_STEPS = [
  { key: PICKUP_STATUSES.PENDING, label: 'Pending Review', color: 'amber', step: 1 },
  { key: PICKUP_STATUSES.CONFIRMED, label: 'Confirmed', color: 'blue', step: 2 },
  { key: PICKUP_STATUSES.ASSIGNED, label: 'Pickup Boy Assigned', color: 'indigo', step: 3 },
  { key: PICKUP_STATUSES.OUT_FOR_PICKUP, label: 'Out for Pickup', color: 'purple', step: 4 },
  { key: PICKUP_STATUSES.COLLECTED, label: 'Clothes Collected', color: 'teal', step: 5 },
  { key: PICKUP_STATUSES.DELIVERED_TO_BRANCH, label: 'Delivered to Branch (TW-POS-02)', color: 'sky', step: 6 },
  { key: PICKUP_STATUSES.CONVERTED, label: 'Converted to POS Order', color: 'emerald', step: 7 },
  { key: PICKUP_STATUSES.COMPLETED, label: 'Completed', color: 'emerald', step: 8 },
  { key: PICKUP_STATUSES.CANCELLED, label: 'Cancelled', color: 'rose', step: 0 }
];

// Cross-tab broadcast channel for instant multi-window synchronization
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('techwash_doorstep_pickup_sync');
  } catch (e) {
    console.warn('BroadcastChannel not supported for pickup sync:', e);
  }
}

const notifyLocalSubscribers = (eventData = {}) => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('techwash-pickup-requests-updated', { detail: eventData }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'PICKUP_REQUEST_UPDATED', ...eventData });
    }
  } catch (e) {}
};

/**
 * Helper to get cached requests from localStorage
 */
const getLocalCachedRequests = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PICKUP_LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Helper to set cached requests in localStorage
 */
const setLocalCachedRequests = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PICKUP_LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
};

export const pickupRequestService = {
  /**
   * Generate sequential Unique Pickup Request ID: TW-PU-YYYYMMDD-001
   */
  async generatePickupRequestId() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `TW-PU-${dateStr}-`;

    let nextNum = 1;

    // Check localStorage sequence
    try {
      const stored = localStorage.getItem(PICKUP_SEQ_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === dateStr && parsed.seq) {
          nextNum = parsed.seq + 1;
        }
      }
    } catch (e) {}

    // Check Firestore if online
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, PICKUP_COLLECTION),
          where('pickupRequestId', '>=', prefix),
          where('pickupRequestId', '<=', prefix + '\uf8ff'),
          orderBy('pickupRequestId', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const lastId = snap.docs[0].data().pickupRequestId || '';
          const match = lastId.match(/-(\d+)$/);
          if (match && match[1]) {
            const serverNum = parseInt(match[1], 10);
            if (serverNum >= nextNum) {
              nextNum = serverNum + 1;
            }
          }
        }
      } catch (e) {
        console.warn('Firestore pickup sequence check fallback:', e);
      }
    }

    // Save updated sequence
    try {
      localStorage.setItem(PICKUP_SEQ_STORAGE_KEY, JSON.stringify({ date: dateStr, seq: nextNum }));
    } catch (e) {}

    const seqPadded = String(nextNum).padStart(3, '0');
    return `${prefix}${seqPadded}`;
  },

  /**
   * Submit a new doorstep pickup request from customer website
   */
  async createPickupRequest(requestData) {
    const pickupRequestId = requestData.pickupRequestId || await this.generatePickupRequestId();
    const nowIso = new Date().toISOString();

    const normalizedPhone = String(requestData.mobileNumber || '').replace(/\D/g, '').slice(-10);
    const normalizedWhatsapp = requestData.whatsappNumber 
      ? String(requestData.whatsappNumber).replace(/\D/g, '').slice(-10) 
      : normalizedPhone;

    const payload = {
      id: pickupRequestId,
      pickupRequestId,
      customerName: (requestData.customerName || 'Customer').trim(),
      mobileNumber: normalizedPhone,
      whatsappNumber: normalizedWhatsapp,
      alternatePhone: requestData.alternatePhone ? String(requestData.alternatePhone).trim() : '',
      address: {
        houseNumber: requestData.address?.houseNumber || '',
        street: requestData.address?.street || '',
        landmark: requestData.address?.landmark || '',
        city: requestData.address?.city || 'Hyderabad',
        pincode: requestData.address?.pincode || '',
        latitude: requestData.address?.latitude || null,
        longitude: requestData.address?.longitude || null,
        fullAddress: requestData.address?.fullAddress || [
          requestData.address?.houseNumber,
          requestData.address?.street,
          requestData.address?.landmark,
          requestData.address?.city,
          requestData.address?.pincode
        ].filter(Boolean).join(', ')
      },
      services: Array.isArray(requestData.services) ? requestData.services : [],
      serviceNames: Array.isArray(requestData.services) 
        ? requestData.services.map(s => typeof s === 'string' ? s : (s.title || s.name || s.id))
        : [],
      estimatedWeight: requestData.estimatedWeight ? Number(requestData.estimatedWeight) : null,
      numberOfBags: requestData.numberOfBags ? Number(requestData.numberOfBags) : null,
      pickupDate: requestData.pickupDate || new Date().toISOString().split('T')[0],
      pickupTimeSlot: requestData.pickupTimeSlot || 'Morning (08:00 AM - 12:00 PM)',
      specialInstructions: requestData.specialInstructions || '',
      requestSource: 'Website',
      requestType: 'Doorstep Pickup',
      status: PICKUP_STATUSES.PENDING,
      assignedPickupBoy: null,
      assignedPickupBoyId: null,
      assignedPickupBoyPhone: null,
      assignedAt: null,
      posTerminalId: 'TW-POS-02', // Bound to Counter 2 (Tolichowki Central Hub)
      posTerminalCode: 'TW-POS-02',
      counterNumber: '2',
      convertedOrderId: null,
      convertedAt: null,
      cancellationReason: null,
      history: [
        {
          status: PICKUP_STATUSES.PENDING,
          timestamp: nowIso,
          note: 'Doorstep pickup request submitted on Tech Wash website',
          by: 'Customer'
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1. Save to Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, PICKUP_COLLECTION, pickupRequestId), {
          ...payload,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error('Firebase save doorstep pickup request error:', err);
      }
    }

    // 2. Cache in local storage
    const currentList = getLocalCachedRequests();
    const existingIdx = currentList.findIndex(r => r.id === pickupRequestId || r.pickupRequestId === pickupRequestId);
    if (existingIdx >= 0) {
      currentList[existingIdx] = payload;
    } else {
      currentList.unshift(payload);
    }
    setLocalCachedRequests(currentList);

    // 3. Notify all listeners (Admin & TW-POS-02)
    notifyLocalSubscribers({ action: 'CREATED', pickupRequest: payload });

    return payload;
  },

  /**
   * Fetch all pickup requests with optional filtering and sorting
   */
  async getPickupRequests(filters = {}) {
    let requests = [];

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, PICKUP_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(filters.limitCount || 300)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLocalCachedRequests(requests);
        }
      } catch (err) {
        console.warn('Firestore getPickupRequests error, falling back to local cache:', err);
        requests = getLocalCachedRequests();
      }
    } else {
      requests = getLocalCachedRequests();
    }

    // Fallback if firestore returned empty but local has items
    if (requests.length === 0) {
      requests = getLocalCachedRequests();
    }

    // Apply Filters
    if (filters.status && filters.status !== 'ALL') {
      requests = requests.filter(r => r.status === filters.status);
    }

    if (filters.search) {
      const qLower = String(filters.search).toLowerCase().trim();
      requests = requests.filter(r => 
        (r.pickupRequestId && r.pickupRequestId.toLowerCase().includes(qLower)) ||
        (r.customerName && r.customerName.toLowerCase().includes(qLower)) ||
        (r.mobileNumber && r.mobileNumber.includes(qLower)) ||
        (r.address?.fullAddress && r.address.fullAddress.toLowerCase().includes(qLower)) ||
        (r.assignedPickupBoy && r.assignedPickupBoy.toLowerCase().includes(qLower))
      );
    }

    if (filters.date) {
      requests = requests.filter(r => r.pickupDate === filters.date);
    }

    if (filters.assignedPickupBoyId) {
      requests = requests.filter(r => r.assignedPickupBoyId === filters.assignedPickupBoyId);
    }

    return requests;
  },

  /**
   * Fetch single pickup request by ID
   */
  async getPickupRequestById(id) {
    if (!id) return null;

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, PICKUP_COLLECTION, id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('Firestore getPickupRequestById error:', err);
      }
    }

    const cached = getLocalCachedRequests();
    return cached.find(r => r.id === id || r.pickupRequestId === id) || null;
  },

  /**
   * Update pickup request status with audit history
   */
  async updatePickupRequestStatus(id, newStatus, { note = '', updatedBy = 'Staff', cancellationReason = '' } = {}) {
    const existing = await this.getPickupRequestById(id);
    if (!existing) {
      throw new Error(`Pickup request ${id} not found.`);
    }

    const nowIso = new Date().toISOString();
    const historyEntry = {
      status: newStatus,
      timestamp: nowIso,
      note: note || `Status updated to ${newStatus}`,
      by: updatedBy,
      ...(cancellationReason ? { cancellationReason } : {})
    };

    const updatedHistory = [...(existing.history || []), historyEntry];

    const patch = {
      status: newStatus,
      history: updatedHistory,
      updatedAt: nowIso,
      ...(cancellationReason ? { cancellationReason } : {})
    };

    // If accepted or changed from Pending, silence ringing alarm
    if (newStatus !== PICKUP_STATUSES.PENDING) {
      stopOrderRingingAlarm(id);
      stopOrderRingingAlarm(existing.pickupRequestId);
    }

    // 1. Update Firestore
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, PICKUP_COLLECTION, id), {
          ...patch,
          serverUpdatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Firebase update pickup status error:', err);
      }
    }

    // 2. Update local storage
    const list = getLocalCachedRequests();
    const idx = list.findIndex(r => r.id === id || r.pickupRequestId === id);
    const updatedRecord = { ...existing, ...patch };
    if (idx >= 0) {
      list[idx] = updatedRecord;
    } else {
      list.unshift(updatedRecord);
    }
    setLocalCachedRequests(list);

    // 3. Dispatch events
    notifyLocalSubscribers({ action: 'STATUS_UPDATED', pickupRequest: updatedRecord });

    return updatedRecord;
  },

  /**
   * Assign a pickup boy to a request
   */
  async assignPickupBoy(id, pickupBoy, { note = '', updatedBy = 'Admin' } = {}) {
    const existing = await this.getPickupRequestById(id);
    if (!existing) throw new Error(`Pickup request ${id} not found.`);

    const nowIso = new Date().toISOString();
    const boyName = typeof pickupBoy === 'string' ? pickupBoy : (pickupBoy?.name || 'Rider');
    const boyId = typeof pickupBoy === 'object' ? (pickupBoy?.id || null) : null;
    const boyPhone = typeof pickupBoy === 'object' ? (pickupBoy?.phone || null) : null;

    const newStatus = PICKUP_STATUSES.ASSIGNED;
    const historyEntry = {
      status: newStatus,
      timestamp: nowIso,
      note: note || `Assigned to pickup executive: ${boyName} (${boyPhone || 'No phone'})`,
      by: updatedBy
    };

    const patch = {
      assignedPickupBoy: boyName,
      assignedPickupBoyId: boyId,
      assignedPickupBoyPhone: boyPhone,
      assignedAt: nowIso,
      status: newStatus,
      history: [...(existing.history || []), historyEntry],
      updatedAt: nowIso
    };

    // Silence pending ringing if active
    stopOrderRingingAlarm(id);
    stopOrderRingingAlarm(existing.pickupRequestId);

    // 1. Update Firestore
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, PICKUP_COLLECTION, id), {
          ...patch,
          serverUpdatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Firebase assign pickup boy error:', err);
      }
    }

    // 2. Update local cache
    const list = getLocalCachedRequests();
    const idx = list.findIndex(r => r.id === id || r.pickupRequestId === id);
    const updatedRecord = { ...existing, ...patch };
    if (idx >= 0) list[idx] = updatedRecord;
    else list.unshift(updatedRecord);
    setLocalCachedRequests(list);

    // 3. Dispatch events
    notifyLocalSubscribers({ action: 'ASSIGNED', pickupRequest: updatedRecord });

    return updatedRecord;
  },

  /**
   * Edit pickup request details (Customer, Address, Schedule, Special Instructions)
   */
  async updatePickupRequestDetails(id, patchData, { updatedBy = 'Staff', note = 'Details updated' } = {}) {
    const existing = await this.getPickupRequestById(id);
    if (!existing) throw new Error(`Pickup request ${id} not found.`);

    const nowIso = new Date().toISOString();
    const historyEntry = {
      status: existing.status,
      timestamp: nowIso,
      note: note,
      by: updatedBy
    };

    const updatedRecord = {
      ...existing,
      ...patchData,
      history: [...(existing.history || []), historyEntry],
      updatedAt: nowIso
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, PICKUP_COLLECTION, id), {
          ...patchData,
          history: updatedRecord.history,
          serverUpdatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Firebase update details error:', err);
      }
    }

    const list = getLocalCachedRequests();
    const idx = list.findIndex(r => r.id === id || r.pickupRequestId === id);
    if (idx >= 0) list[idx] = updatedRecord;
    setLocalCachedRequests(list);

    notifyLocalSubscribers({ action: 'EDITED', pickupRequest: updatedRecord });
    return updatedRecord;
  },

  /**
   * Convert collected laundry into regular POS Order in TW-POS-02
   */
  async convertPickupToOrder(id, posOrderPayload, { updatedBy = 'TW-POS-02 Operator' } = {}) {
    const pickupReq = await this.getPickupRequestById(id);
    if (!pickupReq) throw new Error(`Pickup request ${id} not found.`);

    // 1. Prepare POS Order via orderService
    const createdOrder = await orderService.createOrder({
      ...posOrderPayload,
      customer: {
        name: pickupReq.customerName,
        phone: pickupReq.mobileNumber,
        address: pickupReq.address?.fullAddress || '',
        ...(posOrderPayload.customer || {})
      },
      customerName: pickupReq.customerName,
      phone: pickupReq.mobileNumber,
      terminalId: 'counter-2',
      counterNumber: '2',
      terminalCode: 'TW-POS-02',
      isWalkIn: false,
      pickupRequestId: pickupReq.pickupRequestId,
      notes: `Converted from Doorstep Pickup Request #${pickupReq.pickupRequestId}. ${posOrderPayload.notes || ''}`.trim()
    });

    const generatedOrderId = createdOrder.id || createdOrder.orderNumber;
    const nowIso = new Date().toISOString();

    // 2. Mark pickup request as Converted to Order
    const historyEntry = {
      status: PICKUP_STATUSES.CONVERTED,
      timestamp: nowIso,
      note: `Converted to official POS Order #${generatedOrderId} at Counter 2 (Tolichowki)`,
      by: updatedBy
    };

    const patch = {
      status: PICKUP_STATUSES.CONVERTED,
      convertedOrderId: generatedOrderId,
      convertedAt: nowIso,
      history: [...(pickupReq.history || []), historyEntry],
      updatedAt: nowIso
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, PICKUP_COLLECTION, id), {
          ...patch,
          serverUpdatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Firebase convert to order update error:', err);
      }
    }

    const list = getLocalCachedRequests();
    const idx = list.findIndex(r => r.id === id || r.pickupRequestId === id);
    const updatedPickup = { ...pickupReq, ...patch };
    if (idx >= 0) list[idx] = updatedPickup;
    setLocalCachedRequests(list);

    notifyLocalSubscribers({ action: 'CONVERTED', pickupRequest: updatedPickup, order: createdOrder });

    return {
      success: true,
      order: createdOrder,
      pickupRequest: updatedPickup
    };
  },

  /**
   * Real-time subscription to doorstep pickup requests
   * Supports Firestore onSnapshot, BroadcastChannel, and window events
   */
  subscribeToPickupRequests(callback, { posTerminalId = null } = {}) {
    let unsubscribeFirestore = null;

    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, PICKUP_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(200)
        );

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setLocalCachedRequests(list);

          // Check for incoming pending requests to alert internal staff
          const pendingRequests = list.filter(r => r.status === PICKUP_STATUSES.PENDING);
          if (pendingRequests.length > 0) {
            // Check if any pending request was created recently
            pendingRequests.forEach(req => {
              startOrderRingingAlarm({
                id: req.id,
                orderNumber: req.pickupRequestId,
                customerName: req.customerName,
                serviceName: req.serviceNames?.join(', ') || 'Doorstep Pickup',
                totalAmount: 0,
                terminalId: 'counter-2',
                isOnlineBooking: true
              });
            });
          }

          callback(list);
        }, (err) => {
          console.warn('Firestore onSnapshot pickup requests error:', err);
          callback(getLocalCachedRequests());
        });
      } catch (e) {
        console.warn('Firestore pickup subscription setup error:', e);
      }
    }

    // Local window listener for immediate UI reactiveness
    const handleLocalUpdate = () => {
      callback(getLocalCachedRequests());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('techwash-pickup-requests-updated', handleLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.onmessage = () => {
          callback(getLocalCachedRequests());
        };
      }
    }

    // Return cleanup function
    return () => {
      if (typeof unsubscribeFirestore === 'function') {
        unsubscribeFirestore();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('techwash-pickup-requests-updated', handleLocalUpdate);
      }
    };
  },

  /**
   * Compute dashboard stats for pickup requests
   */
  getStats(requests = []) {
    const list = Array.isArray(requests) ? requests : [];
    return {
      total: list.length,
      pending: list.filter(r => r.status === PICKUP_STATUSES.PENDING).length,
      confirmed: list.filter(r => r.status === PICKUP_STATUSES.CONFIRMED).length,
      assigned: list.filter(r => r.status === PICKUP_STATUSES.ASSIGNED).length,
      inProgress: list.filter(r => r.status === PICKUP_STATUSES.OUT_FOR_PICKUP || r.status === PICKUP_STATUSES.COLLECTED || r.status === PICKUP_STATUSES.DELIVERED_TO_BRANCH).length,
      converted: list.filter(r => r.status === PICKUP_STATUSES.CONVERTED).length,
      completed: list.filter(r => r.status === PICKUP_STATUSES.COMPLETED || r.status === PICKUP_STATUSES.CONVERTED).length,
      cancelled: list.filter(r => r.status === PICKUP_STATUSES.CANCELLED).length
    };
  },

  /**
   * Get pending count for live badge notification
   */
  async getPendingCount() {
    const all = await this.getPickupRequests();
    return all.filter(r => r.status === PICKUP_STATUSES.PENDING).length;
  }
};
