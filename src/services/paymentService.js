/**
 * Payment Architecture & Gateway Integration Service for Tech Wash
 * Manages UPI QR Code, Gateway toggles, and payment status lifecycle machine:
 * CREATED -> INITIATED -> PENDING -> SUCCESSFUL -> FAILED -> CANCELLED -> REFUNDED
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
    description: 'Instant zero-fee scan & pay via Google Pay, PhonePe, Paytm, or BHIM.',
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
    instructions: 'Scan this QR code using any UPI app (Google Pay, PhonePe, Paytm, BHIM) and enter the exact order amount.',
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
   * Get payment configuration
   */
  async getPaymentConfig() {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payments'));
        if (snap.exists()) {
          return { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() };
        }
      } catch (e) {
        console.warn("Firestore payment config read error:", e);
      }
    }

    try {
      const cached = localStorage.getItem(PAYMENT_SETTINGS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_PAYMENT_CONFIG;
    } catch (e) {
      return DEFAULT_PAYMENT_CONFIG;
    }
  },

  /**
   * Save payment configuration from Admin
   */
  async savePaymentConfig(config) {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'payments'), config, { merge: true });
      } catch (e) {
        console.warn("Firestore save payment config error:", e);
      }
    }
    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(config));
    return config;
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
