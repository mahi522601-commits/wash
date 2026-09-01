/**
 * Staff Directory & Admin Users Management Service
 * Manages operational personnel, delivery executives, and role authorizations
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const STAFF_STORAGE_KEY = 'techwash_staff_directory';
const ADMIN_USERS_STORAGE_KEY = 'techwash_admin_users_list';

export const staffService = {
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
        list = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY) || '[]');
      } catch (e) {
        list = [];
      }
    }

    return list;
  },

  /**
   * Save / Update staff member
   */
  async saveStaff(staffMember) {
    const id = staffMember.id || `staff-${Date.now()}`;
    const payload = { ...staffMember, id, updatedAt: new Date().toISOString() };

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
