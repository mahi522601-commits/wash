/**
 * Tech Wash Centralized Firebase Authentication & Firestore Admin RBAC Service
 * Single source of truth for admin authentication & role-based access control.
 * Connects directly to project: laundry-37abc
 */
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
};

export const AUTHORIZED_ADMIN_ROLES = [
  'superadmin',
  'super_admin',
  'admin',
  'manager',
  'staff'
];

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPERADMIN]: ['all'],
  'super_admin': ['all'],
  [USER_ROLES.ADMIN]: ['cms', 'orders', 'bookings', 'services', 'pricing', 'media', 'customers', 'locations', 'banners', 'seo', 'offers', 'settings'],
  [USER_ROLES.MANAGER]: ['orders', 'bookings', 'customers', 'services', 'pricing', 'locations', 'offers'],
  [USER_ROLES.STAFF]: ['orders', 'bookings', 'orders_stage_update', 'weight_entry'],
};

export const authService = {
  /**
   * Check if a role string is an authorized admin role
   */
  isAuthorizedAdminRole(role) {
    if (!role) return false;
    const normalized = String(role).toLowerCase().trim();
    return AUTHORIZED_ADMIN_ROLES.includes(normalized);
  },

  /**
   * Log in user with Firebase Auth and verify Firestore admin document in: admins/{uid} (or users/{uid})
   */
  async login(email, password) {
    if (!auth || !db) {
      throw new Error('Unable to connect to Firebase Authentication. Please check your network and configuration.');
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Verify admin document in Firestore (admins/{uid} first, then users/{uid})
      let adminData = await this.verifyAdminDocument(user.uid);

      // 3. Document must exist and have active == true + valid admin role
      if (!adminData) {
        await signOut(auth);
        throw new Error('Access denied. Administrator privileges required.');
      }

      if (adminData.active === false) {
        await signOut(auth);
        throw new Error('Your admin account is currently disabled.');
      }

      const userRole = (adminData.role || '').toLowerCase().trim();
      if (!this.isAuthorizedAdminRole(userRole)) {
        await signOut(auth);
        throw new Error('Access denied. Insufficient administrative permissions.');
      }

      // 4. Return verified admin profile
      const adminProfile = {
        uid: user.uid,
        email: user.email,
        displayName: adminData.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
        name: adminData.name || 'Tech Wash Administrator',
        role: adminData.role || 'superadmin',
        active: true,
        token: await user.getIdToken(),
      };

      return adminProfile;
    } catch (err) {
      console.error("Firebase Admin Login Error:", err);

      // If already custom authorization error, rethrow
      if (
        err.message?.startsWith('Access denied') ||
        err.message?.startsWith('Firestore') ||
        err.message?.startsWith('Your admin account') ||
        err.message?.startsWith('Unable to connect')
      ) {
        throw err;
      }

      // Handle Firebase Auth error codes
      const errorCode = err.code || '';
      if (
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-credential'
      ) {
        throw new Error('Incorrect email or password.');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (errorCode === 'auth/user-disabled') {
        throw new Error('Your account has been disabled in Firebase Authentication.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        throw new Error('Email/Password sign-in is disabled in Firebase Console.');
      } else if (errorCode === 'auth/network-request-failed') {
        throw new Error('Network connection error. Unable to reach Firebase authentication servers.');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (errorCode === 'auth/api-key-not-valid' || errorCode === 'auth/invalid-api-key') {
        throw new Error('Firebase API Key is invalid. Please verify VITE_FIREBASE_API_KEY in your .env file.');
      }

      throw new Error(err.message || 'Incorrect email or password.');
    }
  },

  /**
   * Verify Firestore admin document for a Firebase User UID
   * Checks `admins/{uid}` first, and falls back to `users/{uid}`
   */
  async verifyAdminDocument(uid) {
    if (!db || !uid) return null;

    try {
      // 1. Check admins/{uid} (Primary admin collection)
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (adminSnap.exists()) {
        const data = adminSnap.data() || {};
        if (data.active !== false && this.isAuthorizedAdminRole(data.role)) {
          return { id: adminSnap.id, ...data };
        }
      }

      // 2. Check users/{uid} (Secondary fallback)
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const data = userSnap.data() || {};
        if (data.active !== false && this.isAuthorizedAdminRole(data.role)) {
          return { id: userSnap.id, ...data };
        }
      }

      return null;
    } catch (e) {
      console.warn("Firestore admin authorization check notice:", e?.message || e);
      return null;
    }
  },

  /**
   * Log out current user from Firebase Auth
   */
  async logout() {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Sign out error:", e);
      }
    }
  },

  /**
   * Send Password Reset Email via Firebase Auth
   */
  async resetPassword(email) {
    if (auth) {
      return await sendPasswordResetEmail(auth, email);
    }
    throw new Error('Authentication service unavailable.');
  },

  /**
   * Check if user role has required permission scope
   */
  hasPermission(userRole, requiredScope) {
    if (!userRole) return false;
    const normalizedRole = userRole.toLowerCase().trim();
    if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') return true;
    const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
    return permissions.includes(requiredScope) || permissions.includes('all');
  }
};
