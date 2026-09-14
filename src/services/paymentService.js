/**
 * Payment Architecture & Gateway Integration Service for Tech Wash
 * Single Source of Truth in Firebase Firestore `settings/payments` and `settings/global`
 * Manages UPI QR Code, Indian App Integrations, Gateway toggles, and payment status lifecycle machine.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const PAYMENT_METHODS = {
  PAY_ON_DELIVERY: {
    id: 'PAY_ON_DELIVERY',
    name: 'Pay After Delivery / Cash',
    description: 'Pay by cash or UPI scanner when your fresh garments arrive at your doorstep.',
    badge: 'Zero Risk',
  },
  UPI_QR: {
    id: 'UPI_QR',
    name: 'Direct UPI / QR Code',
    description: 'Instant scan & pay via Google Pay, PhonePe, Paytm, Amazon Pay or BHIM.',
    badge: 'Fast & Direct',
  },
  ONLINE_GATEWAY: {
    id: 'ONLINE_GATEWAY',
    name: 'Online Payment Gateway (Cards/Netbanking)',
    description: 'Credit Card, Debit Card, Net Banking & Wallets via secure PCI-DSS gateway.',
    badge: '100% Encrypted',
  }
};

export const PAYMENT_STATES = {
  CREATED: 'CREATED',
  INITIATED: 'INITIATED',
  PENDING: 'PENDING',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
};

const PAYMENT_SETTINGS_KEY = 'techwash_payment_settings';

export const DEFAULT_PAYMENT_CONFIG = {
  upi: {
    enabled: true,
    upiId: 'techwash@upi',
    merchantName: 'Tech Wash Laundry Services',
    qrImageUrl: '',
    instructions: 'Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM) and complete payment.',
  },
  gateway: {
    enabled: true,
    provider: 'Razorpay',
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_exampleKey',
    currency: 'INR',
    testMode: true,
    mockFallback: true,
  },
  payLater: {
    cashOnDeliveryEnabled: true,
    payAfterInspectionEnabled: true,
  }
};

export const paymentService = {
  /**
   * Get payment configuration from Firestore or cache
   */
  async getPaymentConfig() {
    let result = null;

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payments'));
        if (snap.exists() && snap.data()) {
          result = { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() };
        } else {
          // Fallback to check global settings document
          const globalSnap = await getDoc(doc(db, 'settings', 'global'));
          if (globalSnap.exists() && globalSnap.data()?.payments) {
            result = { ...DEFAULT_PAYMENT_CONFIG, ...globalSnap.data().payments };
          }
        }
      } catch (e) {
        console.warn("Firestore payment config read warning:", e);
      }
    }

    if (!result) {
      try {
        const cached = localStorage.getItem(PAYMENT_SETTINGS_KEY);
        result = cached ? { ...DEFAULT_PAYMENT_CONFIG, ...JSON.parse(cached) } : DEFAULT_PAYMENT_CONFIG;
      } catch (e) {
        result = DEFAULT_PAYMENT_CONFIG;
      }
    }

    // Ensure upi object is safely initialized
    if (!result.upi) result.upi = DEFAULT_PAYMENT_CONFIG.upi;
    if (!result.upi.upiId) result.upi.upiId = DEFAULT_PAYMENT_CONFIG.upi.upiId;
    if (!result.upi.merchantName) result.upi.merchantName = DEFAULT_PAYMENT_CONFIG.upi.merchantName;

    return result;
  },

  /**
   * Save payment configuration from Admin & sync across Firestore & local cache
   */
  async savePaymentConfig(config) {
    const cleanConfig = {
      ...DEFAULT_PAYMENT_CONFIG,
      ...config,
      upi: {
        ...DEFAULT_PAYMENT_CONFIG.upi,
        ...(config.upi || {}),
        upiId: (config.upi?.upiId || 'techwash@upi').trim(),
        merchantName: (config.upi?.merchantName || 'Tech Wash Laundry Services').trim(),
      },
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await Promise.all([
          setDoc(doc(db, 'settings', 'payments'), cleanConfig, { merge: true }),
          setDoc(doc(db, 'settings', 'global'), { payments: cleanConfig }, { merge: true }),
          setDoc(doc(db, 'settings', 'business'), { payments: cleanConfig }, { merge: true }),
        ]);
      } catch (e) {
        console.warn("Firestore save payment config error:", e);
      }
    }

    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(cleanConfig));

    // Broadcast update event to all active views and listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('techwash-payment-config-updated', { detail: cleanConfig }));
    }

    return cleanConfig;
  },

  /**
   * Simulate or initiate payment transaction safely
   */
  async initiateTransaction({ orderId, amount, customer, method }) {
    const transaction = {
      transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderId,
      amount,
      currency: 'INR',
      method,
      status: PAYMENT_STATES.INITIATED,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      createdAt: new Date().toISOString(),
    };

    return transaction;
  }
};
