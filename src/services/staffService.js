/**
 * Staff Directory & Admin Users Management Service
 * Manages operational personnel, delivery executives, and role authorizations
 * All staff credentials and passwords are saved and retrieved securely via Firebase Firestore
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

const STAFF_STORAGE_KEY = 'techwash_staff_directory';
const ADMIN_USERS_STORAGE_KEY = 'techwash_admin_users_list';

export const staffService = {
  /**
   * Generate a secure random password for worker onboarding
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
   * Get staff members from Firebase Firestore (Operations, Delivery Riders, QC Inspectors)
   */
  async getStaff() {
    let list = [];

    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Cache in local storage for offline resiliency
          try {
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
          } catch (e) {}
          return list;
        }
      } catch (e) {
        console.warn("Firestore staff read error:", e);
      }
    }

    // Fallback to locally cached records if offline
    try {
      const stored = localStorage.getItem(STAFF_STORAGE_KEY);
      if (stored) {
        list = JSON.parse(stored);
      }
    } catch (e) {
      list = [];
    }

    return list;
  },

  /**
   * Save / Update staff member with email & password directly into Firebase Firestore
   */
  async saveStaff(staffMember) {
    const id = staffMember.id || `staff-${Date.now()}`;
    const normalizedEmail = (staffMember.email || '').trim().toLowerCase();
    
    const payload = {
      ...staffMember,
      id,
      email: normalizedEmail,
      dutyStatus: staffMember.dutyStatus || 'ON_DUTY',
      active: staffMember.active !== false,
      updatedAt: new Date().toISOString(),
      createdAt: staffMember.createdAt || new Date().toISOString()
    };

    // 1. Save directly to Firebase Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'staff', id), payload, { merge: true });
      } catch (e) {
        console.error("Firebase Firestore staff save error:", e);
        throw new Error(`Failed to save worker in Firebase: ${e.message}`);
      }
    }

    // 2. Update local storage cache
    try {
      const list = await this.getStaff();
      const idx = list.findIndex(s => s.id === id);
      if (idx >= 0) list[idx] = payload;
      else list.push(payload);
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    return payload;
  },

  /**
   * Verify worker login credentials directly against Firebase Firestore
   */
  async verifyWorkerCredentials(email, password) {
    if (!email || !password) {
      throw new Error('Please provide both worker email and password.');
    }
    const targetEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    let staff = null;

    // 1. Query Firebase Firestore for real-time validation
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'staff'), where('email', '==', targetEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docItem = snap.docs[0];
          staff = { id: docItem.id, ...docItem.data() };
        }
      } catch (e) {
        console.warn("Firestore worker query error, falling back to local list:", e);
      }
    }

    // Fallback: search fetched / cached staff list
    if (!staff) {
      const staffList = await this.getStaff();
      staff = staffList.find(
        s => s.email && s.email.trim().toLowerCase() === targetEmail
      );
    }

    if (!staff) {
      throw new Error('Worker account not found with this email. Please ask your Admin to create your account.');
    }

    if (staff.active === false) {
      throw new Error('This worker account is currently deactivated. Please contact your administrator.');
    }

    // Compare password stored in Firebase
    if (staff.password !== inputPassword) {
      throw new Error('Incorrect password. Please verify your credentials with your administrator.');
    }

    return staff;
  },

  /**
   * Update duty status for a staff member (ON_DUTY / OFF_DUTY) in Firebase Firestore
   */
  async updateDutyStatus(staffId, dutyStatus) {
    const nextStatus = dutyStatus === 'ON_DUTY' ? 'ON_DUTY' : 'OFF_DUTY';
    const updateData = {
      dutyStatus: nextStatus,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'staff', staffId), updateData, { merge: true });
      } catch (e) {
        console.warn("Firestore update duty status error:", e);
      }
    }

    const staffList = await this.getStaff();
    const idx = staffList.findIndex(s => s.id === staffId);
    if (idx >= 0) {
      staffList[idx] = { ...staffList[idx], ...updateData };
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
      return staffList[idx];
    }
    return null;
  },

  /**
   * Delete staff member from Firebase Firestore
   */
  async deleteStaff(staffId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'staff', staffId));
      } catch (e) {
        console.error("Firestore delete staff error:", e);
        throw new Error(`Failed to delete worker from Firebase: ${e.message}`);
      }
    }

    const list = (await this.getStaff()).filter(s => s.id !== staffId);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(list));
    return true;
  },

  /**
   * Get Admin portal user accounts from Firebase Firestore
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
   * Save Admin user to Firebase Firestore
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
   * Delete Admin user from Firebase Firestore
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
