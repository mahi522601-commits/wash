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
    name: 'Counter 1 — Branch 1 (Tolichowki / OU Colony)',
    code: 'TW-POS-01',
    locationId: 'loc-branch-1',
    locationName: 'Tech Wash Laundry Services (Branch 1)',
    address: 'Beside DreamScape Hotel Ward No 8, Block No 1 , Tolichowki , OU Colony, Shaikpet,Hyderabad,Telangana 500008',
    phone: '+91 63048 45567',
    assignedOperator: 'Cashier #1',
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
    name: 'Counter 2 — Pick Up Point (Ambience Courtyard)',
    code: 'TW-POS-02',
    locationId: 'loc-pickup-point',
    locationName: 'Tech Wash Pick Up Point',
    address: 'Beside Ambience Courtyard,Hyderabad,Telangana,500089',
    phone: '+91 63048 45567',
    assignedOperator: 'Cashier #2',
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
    name: 'Counter 3 — Main Branch (Shaikpet / Manikonda)',
    code: 'TW-POS-03',
    locationId: 'loc-main-branch',
    locationName: 'Tech Wash Laundry Main Branch',
    address: 'Shaikpet Main Rd,Sri Ram Nagar Colony,Manikonda,Hyderabad,Telangana,500089',
    phone: '+91 63048 45567',
    assignedOperator: 'Cashier #3',
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
   * Retrieve all billing terminals dynamically synced with Store Locations
   */
  async getTerminals() {
    let list = [];

    // 1. Try Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'billing_terminals'));
        if (!snap.empty) {
          const remoteList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Ensure all default terminals exist or merge with remote
          list = DEFAULT_BILLING_TERMINALS.map(def => {
            const found = remoteList.find(r => r.id === def.id || r.numericId === def.numericId);
            return found ? { ...def, ...found } : def;
          });
        }
      } catch (e) {
        console.warn('Firestore billing_terminals read error:', e);
      }
    }

    // 2. Try localStorage fallback if Firestore empty
    if (list.length === 0) {
      try {
        const stored = localStorage.getItem(TERMINALS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = DEFAULT_BILLING_TERMINALS.map(def => {
              const found = parsed.find(p => p.id === def.id);
              return found ? { ...def, ...found } : def;
            });
          }
        }
      } catch (e) {}
    }

    if (list.length === 0) {
      list = [...DEFAULT_BILLING_TERMINALS];
    }

    // 3. Dynamically Merge with Store Locations from settingsService
    try {
      const locStr = localStorage.getItem('techwash_store_locations');
      if (locStr) {
        const savedLocs = JSON.parse(locStr);
        if (Array.isArray(savedLocs) && savedLocs.length > 0) {
          list = list.map(t => {
            const matchedLoc = savedLocs.find(l => 
              l.posTerminalId === t.id || 
              l.id === t.locationId || 
              (l.name && t.locationName && (l.name.toLowerCase().includes(t.id) || t.locationName.toLowerCase().includes(l.name.toLowerCase())))
            );
            if (matchedLoc) {
              return {
                ...t,
                name: matchedLoc.name ? `${matchedLoc.posTerminalCode || t.code} — ${matchedLoc.name}` : t.name,
                locationName: matchedLoc.name || t.locationName,
                address: matchedLoc.address || t.address,
                phone: matchedLoc.phone || t.phone,
                assignedOperator: matchedLoc.assignedOperator || t.assignedOperator,
                password: matchedLoc.posPassword || t.password,
                code: matchedLoc.posTerminalCode || t.code,
                active: matchedLoc.posMachineActive !== undefined ? matchedLoc.posMachineActive : (matchedLoc.active !== undefined ? matchedLoc.active : t.active),
              };
            }
            return t;
          });
        }
      }
    } catch (e) {}

    try {
      localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    return list;
  },

  /**
   * Synchronize or create a billing terminal from a location saved in /admin/locations
   */
  async syncTerminalFromLocation(location) {
    if (!location) return null;
    const termId = this.normalizeTerminalId(location.posTerminalId || location.id || 'counter-1');
    const termCode = location.posTerminalCode || (termId === 'counter-2' ? 'TW-POS-02' : termId === 'counter-3' ? 'TW-POS-03' : 'TW-POS-01');
    const numId = termId.replace(/\D/g, '') || '1';

    const list = await this.getTerminals();
    const existing = list.find(t => t.id === termId) || {};

    const updatedTerminal = {
      ...existing,
      id: termId,
      numericId: numId,
      name: `${termCode} — ${location.name}`,
      code: termCode,
      locationId: location.id,
      locationName: location.name,
      address: location.address,
      phone: location.phone || '+91 63048 45567',
      assignedOperator: location.assignedOperator || existing.assignedOperator || `Cashier #${numId}`,
      password: location.posPassword || existing.password || `techwash${numId}`,
      active: location.posMachineActive !== undefined ? location.posMachineActive : (location.active !== undefined ? location.active : true),
      updatedAt: new Date().toISOString()
    };

    return this.updateTerminal(termId, updatedTerminal);
  },

  /**
   * Delete terminal when a location is removed
   */
  async deleteTerminalForLocation(locId) {
    const list = await this.getTerminals();
    const updated = list.filter(t => t.locationId !== locId && t.id !== locId);
    try {
      localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    return true;
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
