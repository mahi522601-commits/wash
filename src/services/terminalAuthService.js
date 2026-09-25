/**
 * In-Store POS Billing Terminals & Authentication Service
 * Manages 3 dedicated counter machines mapped to Tech Wash store locations.
 * Stores passwords, operator names, and session states in Firebase Firestore + localStorage.
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const TERMINALS_STORAGE_KEY = 'techwash_billing_terminals';
const TERMINAL_SESSION_PREFIX = 'techwash_terminal_session_';

// 3 Default In-Store Billing Terminals mapped to store locations from /locations
export const DEFAULT_BILLING_TERMINALS = [
  {
    id: 'counter-1',
    numericId: '1',
    name: 'Counter 1 — Jubilee Hills Flagship',
    code: 'TW-POS-01',
    locationId: 'loc-jubilee-hills',
    locationName: 'Tech Wash Flagship Lounge — Jubilee Hills',
    address: 'Road No. 36, CBI Colony, Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+91 63048 45567',
    assignedOperator: 'Rahul Verma (Cashier #1)',
    password: 'techwash1',
    active: true,
    lastLoginAt: null,
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    themeColor: '#0284c7', // Brand Blue
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'counter-2',
    numericId: '2',
    name: 'Counter 2 — Hitec City Express Hub',
    code: 'TW-POS-02',
    locationId: 'loc-hitec-city',
    locationName: 'Tech Wash Express Hub — Hitec City',
    address: 'Near Cyber Towers, Madhapur, Hitec City, Hyderabad, Telangana 500081',
    phone: '+91 63048 45567',
    assignedOperator: 'Sneha Reddy (Cashier #2)',
    password: 'techwash2',
    active: true,
    lastLoginAt: null,
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    themeColor: '#7c3aed', // Purple
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'counter-3',
    numericId: '3',
    name: 'Counter 3 — Banjara Hills Care Center',
    code: 'TW-POS-03',
    locationId: 'loc-banjara-hills',
    locationName: 'Tech Wash Care Center — Banjara Hills',
    address: 'Road No. 12, MLA Colony, Banjara Hills, Hyderabad, Telangana 500034',
    phone: '+91 63048 45567',
    assignedOperator: 'Vikram Rao (Cashier #3)',
    password: 'techwash3',
    active: true,
    lastLoginAt: null,
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    themeColor: '#ea580c', // Orange
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
  }
];

export const terminalAuthService = {
  /**
   * Normalize terminal key: "counter-1", "1", "counter1", "terminal-1" -> "counter-1"
   */
  normalizeTerminalId(input) {
    if (!input) return 'counter-1';
    const clean = String(input).trim().toLowerCase();
    if (clean === '1' || clean === 'counter-1' || clean === 'counter1' || clean === 'machine-1' || clean === 'terminal-1') return 'counter-1';
    if (clean === '2' || clean === 'counter-2' || clean === 'counter2' || clean === 'machine-2' || clean === 'terminal-2') return 'counter-2';
    if (clean === '3' || clean === 'counter-3' || clean === 'counter3' || clean === 'machine-3' || clean === 'terminal-3') return 'counter-3';
    return clean;
  },

  /**
   * Retrieve all 3 billing terminals from Firestore or localStorage
   */
  async getTerminals() {
    let list = [];

    // 1. Try Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'billing_terminals'));
        if (!snap.empty) {
          const remoteList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Ensure all 3 default terminals exist
          list = DEFAULT_BILLING_TERMINALS.map(def => {
            const found = remoteList.find(r => r.id === def.id || r.numericId === def.numericId);
            return found ? { ...def, ...found } : def;
          });
          try {
            localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
          return list;
        }
      } catch (e) {
        console.warn('Firestore billing_terminals read error:', e);
      }
    }

    // 2. Try localStorage fallback
    try {
      const stored = localStorage.getItem(TERMINALS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = DEFAULT_BILLING_TERMINALS.map(def => {
            const found = parsed.find(p => p.id === def.id);
            return found ? { ...def, ...found } : def;
          });
          return list;
        }
      }
    } catch (e) {}

    // 3. Fallback to default
    list = [...DEFAULT_BILLING_TERMINALS];
    try {
      localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    return list;
  },

  /**
   * Get single terminal config by ID
   */
  async getTerminalById(id) {
    const normId = this.normalizeTerminalId(id);
    const list = await this.getTerminals();
    return list.find(t => t.id === normId) || DEFAULT_BILLING_TERMINALS[0];
  },

  /**
   * Admin: Update terminal settings (Password/PIN, Name, Location, Operator)
   */
  async updateTerminal(id, updates) {
    const normId = this.normalizeTerminalId(id);
    const list = await this.getTerminals();
    const idx = list.findIndex(t => t.id === normId);
    if (idx === -1) throw new Error(`Terminal ${normId} not found.`);

    const current = list[idx];
    const payload = {
      ...current,
      ...updates,
      id: normId,
      updatedAt: new Date().toISOString()
    };

    list[idx] = payload;

    // 1. Save to Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'billing_terminals', normId), payload, { merge: true });
      } catch (e) {
        console.warn('Firebase Firestore terminal save error:', e);
      }
    }

    // 2. Save to localStorage
    try {
      localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    return payload;
  },

  /**
   * Sign in to a specific billing terminal with Password / Security PIN
   */
  async loginTerminal(id, password) {
    const normId = this.normalizeTerminalId(id);
    const terminal = await this.getTerminalById(normId);

    if (!terminal) {
      throw new Error('Invalid Billing Terminal.');
    }

    if (terminal.active === false) {
      throw new Error('This Billing Terminal is currently inactive. Please contact your administrator.');
    }

    const cleanInputPwd = String(password || '').trim().toLowerCase();
    const targetPwd = String(terminal.password || '').trim().toLowerCase();
    
    // Master Admin fallback passwords, numeric pin, or exact terminal password
    const isValid = 
      cleanInputPwd === targetPwd || 
      cleanInputPwd === 'quick_unlock' ||
      cleanInputPwd === 'techwashadmin' || 
      cleanInputPwd === 'admin123' || 
      cleanInputPwd === 'admin' ||
      cleanInputPwd === '123456' ||
      cleanInputPwd === 'pos' ||
      cleanInputPwd === terminal.numericId ||
      cleanInputPwd === `techwash${terminal.numericId}`;

    if (!isValid) {
      throw new Error(`Incorrect Password. (Default PIN: ${terminal.password || 'techwash' + terminal.numericId})`);
    }

    const session = {
      terminalId: terminal.id,
      terminalName: terminal.name,
      terminalCode: terminal.code,
      locationId: terminal.locationId,
      locationName: terminal.locationName,
      address: terminal.address,
      phone: terminal.phone,
      assignedOperator: terminal.assignedOperator,
      loggedInAt: new Date().toISOString(),
      active: true
    };

    try {
      localStorage.setItem(`${TERMINAL_SESSION_PREFIX}${normId}`, JSON.stringify(session));
    } catch (e) {}

    // Update last login in background
    try {
      await this.updateTerminal(normId, { lastLoginAt: new Date().toISOString() });
    } catch (e) {}

    return session;
  },

  /**
   * 1-Click Instant Unlock without requiring password entry
   */
  async quickUnlockTerminal(id) {
    return this.loginTerminal(id, 'quick_unlock');
  },

  /**
   * Get active terminal session
   */
  getTerminalSession(id) {
    const normId = this.normalizeTerminalId(id);
    try {
      const data = localStorage.getItem(`${TERMINAL_SESSION_PREFIX}${normId}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Sign out of billing terminal
   */
  logoutTerminal(id) {
    const normId = this.normalizeTerminalId(id);
    try {
      localStorage.removeItem(`${TERMINAL_SESSION_PREFIX}${normId}`);
    } catch (e) {}
  },

  /**
   * Check if terminal is logged in
   */
  isTerminalAuthenticated(id) {
    const session = this.getTerminalSession(id);
    return Boolean(session && session.terminalId);
  }
};
