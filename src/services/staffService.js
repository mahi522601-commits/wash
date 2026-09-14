/**
 * Staff Directory & Admin Users Management Service
 * Manages operational personnel, delivery executives, and role authorizations
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const STAFF_STORAGE_KEY = 'techwash_staff_directory';
const ADMIN_USERS_STORAGE_KEY = 'techwash_admin_users_list';

// Default initial staff if empty
const INITIAL_DEFAULT_STAFF = [
  {
    id: 'staff-rider-1',
    name: 'Ramesh Kumar',
    phone: '8977769866',
    email: 'rider@techwash.in',
    password: 'Rider@123',
    role: 'Delivery Executive',
    hub: 'Banjara Hills Hub',
    active: true,
    dutyStatus: 'ON_DUTY',
    vehicleNumber: 'TS 09 AB 4421',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-rider-2',
    name: 'Suresh Varma',
    phone: '9848022338',
    email: 'suresh@techwash.in',
    password: 'Suresh@123',
    role: 'Delivery Executive',
    hub: 'Jubilee Hills Hub',
    active: true,
    dutyStatus: 'ON_DUTY',
    vehicleNumber: 'TS 10 CD 8812',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-qc-1',
    name: 'Priya Sharma',
    phone: '9849011223',
    email: 'priya@techwash.in',
    password: 'Priya@123',
    role: 'Hub QC Specialist',
    hub: 'Central Hub',
    active: true,
    dutyStatus: 'ON_DUTY',
    createdAt: new Date().toISOString(),
  }
];

export const staffService = {
  /**
   * Generate a secure random password
   */
  generateSecurePassword(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  },

  /**
   * Get staff members (Operations, Delivery Riders, QC Inspectors)
   */
  async getStaff() {
    let list = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore staff read error:", e);
      }
    }

    if (list.length === 0) {
      try {
        const stored = localStorage.getItem(STAFF_STORAGE_KEY);
        if (stored) {
          list = JSON.parse(stored);
        } else {
          list = [...INITIAL_DEFAULT_STAFF];
          localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
        }
      } catch (e) {
        list = [...INITIAL_DEFAULT_STAFF];
      }
    }

    return list;
  },

  /**
   * Save / Update staff member with email & password
   */
  async saveStaff(staffMember) {
    const id = staffMember.id || `staff-${Date.now()}`;
    const normalizedEmail = (staffMember.email || '').trim().toLowerCase();
    
    const payload = {
      ...staffMember,
      id,
      email: normalizedEmail,
      dutyStatus: staffMember.dutyStatus || 'ON_DUTY',
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'staff', id), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore save staff error:", e);
      }
    }

    const list = await this.getStaff();
    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
    return payload;
  },

  /**
   * Verify worker login credentials
   */
  async verifyWorkerCredentials(email, password) {
    if (!email || !password) throw new Error('Please provide email and password.');
    const targetEmail = email.trim().toLowerCase();
    const staffList = await this.getStaff();

    const staff = staffList.find(
      s => s.email && s.email.trim().toLowerCase() === targetEmail
    );

    if (!staff) {
      throw new Error('Worker account not found with this email.');
    }

    if (!staff.active) {
      throw new Error('This worker account is currently deactivated. Please contact admin.');
    }

    if (staff.password && staff.password !== password) {
      throw new Error('Incorrect password. Please verify credentials.');
    }

    return staff;
  },

  /**
   * Update duty status for a staff member (ON_DUTY / OFF_DUTY)
   */
  async updateDutyStatus(staffId, dutyStatus) {
    const staffList = await this.getStaff();
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return null;

    return this.saveStaff({
      ...staff,
      dutyStatus: dutyStatus === 'ON_DUTY' ? 'ON_DUTY' : 'OFF_DUTY'
    });
  },

  /**
   * Delete staff member
   */
  async deleteStaff(staffId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'staff', staffId));
      } catch (e) {
        console.warn("Firestore delete staff error:", e);
      }
    }

    const list = (await this.getStaff()).filter(s => s.id !== staffId);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
    return true;
  },

  /**
   * Get Admin portal user accounts
   */
  async getAdminUsers() {
    let list = [];
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'adminUsers'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore admin users read error:", e);
      }
    }

    if (list.length === 0) {
      try {
        list = JSON.parse(localStorage.getItem(ADMIN_USERS_STORAGE_KEY) || '[]');
      } catch (e) {
        list = [];
      }
    }

    return list;
  },

  /**
   * Save Admin user
   */
  async saveAdminUser(adminUser) {
    const id = adminUser.id || `user-${Date.now()}`;
    const payload = { ...adminUser, id, updatedAt: new Date().toISOString() };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'adminUsers', id), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore save admin user error:", e);
      }
    }

    const list = await this.getAdminUsers();
    const idx = list.findIndex(u => u.id === id);
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(list));
    return payload;
  },

  /**
   * Delete Admin user
   */
  async deleteAdminUser(userId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'adminUsers', userId));
      } catch (e) {
        console.warn("Firestore delete admin user error:", e);
      }
    }

    const list = (await this.getAdminUsers()).filter(u => u.id !== userId);
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(list));
    return true;
  }
};
