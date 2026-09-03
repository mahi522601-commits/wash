/**
 * Real Firebase Authentication & Firestore Admin Authorization Service for Tech Wash
 * Connects directly to project: laundry-37abc
 * Enforces admin authorization via: admins/{uid} document verification
 */
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  DELIVERY_EXECUTIVE: 'delivery_executive',
};

export const AUTHORIZED_ADMIN_ROLES = [
  'superadmin',
  'super_admin',
  'admin',
  'manager'
];

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPERADMIN]: ['all'],
  'super_admin': ['all'],
  [USER_ROLES.ADMIN]: ['cms', 'orders', 'services', 'pricing', 'media', 'customers', 'locations', 'banners', 'seo', 'offers'],
  [USER_ROLES.MANAGER]: ['orders', 'customers', 'services', 'pricing', 'locations'],
  [USER_ROLES.STAFF]: ['orders_stage_update', 'qc_check'],
  [USER_ROLES.DELIVERY_EXECUTIVE]: ['pickup_delivery_only'],
};

export const authService = {
  /**
   * Log in user with Firebase Auth and verify Firestore admin document: admins/{uid}
   */
  async login(email, password) {
    if (!auth || !db) {
      throw new Error('Unable to connect to the authentication service. Please try again.');
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Verify admin document in Firestore: admins/{currentUser.uid}
      const adminSnap = await getDoc(doc(db, 'admins', user.uid));

      // 3. Document must exist
      if (!adminSnap.exists()) {
        await signOut(auth);
        throw new Error('You are not authorized to access the Admin Portal.');
      }

      const adminData = adminSnap.data() || {};

      // 4. Must be active: true
      if (adminData.active === false) {
        await signOut(auth);
        throw new Error('Your admin account is currently disabled.');
      }

      // 5. Must have authorized role
      const userRole = (adminData.role || '').toLowerCase();
      if (!AUTHORIZED_ADMIN_ROLES.includes(userRole)) {
        await signOut(auth);
        throw new Error('You do not have permission to access the Admin Portal.');
      }

      // 6. Return verified admin profile
      const adminProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || adminData.name || (user.email ? user.email.split('@')[0] : 'Admin'),
        role: adminData.role,
        active: true,
        token: await user.getIdToken(),
      };

      return adminProfile;
    } catch (err) {
      // Log raw error to development console for precise diagnostics
      console.error("Firebase Login Error:", err);

      // If error was already our custom authorization error, rethrow it
      if (
        err.message === 'You are not authorized to access the Admin Portal.' ||
        err.message === 'Your admin account is currently disabled.' ||
        err.message === 'You do not have permission to access the Admin Portal.'
      ) {
        throw err;
      }

      // Handle Firebase Auth error codes
      const errorCode = err.code || '';
      if (
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-email'
      ) {
        throw new Error('Incorrect email or password.');
      } else if (errorCode === 'auth/user-disabled') {
        throw new Error('Your admin account is currently disabled.');
      } else if (errorCode === 'auth/network-request-failed') {
        throw new Error('Unable to connect to the authentication service. Please try again.');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (errorCode === 'auth/api-key-not-valid' || errorCode === 'auth/invalid-api-key') {
        throw new Error('Authentication service configuration error (API Key).');
      }

      throw new Error(err.message || 'Incorrect email or password.');
    }
  },

  /**
   * Verify Firestore admin document for an existing Firebase User: admins/{uid}
   */
  async verifyAdminDocument(uid) {
    if (!db || !uid) return null;

    try {
      const adminSnap = await getDoc(doc(db, 'admins', uid));
      if (!adminSnap.exists()) return null;

      const adminData = adminSnap.data() || {};
      if (adminData.active === false) return null;

      const userRole = (adminData.role || '').toLowerCase();
      if (!AUTHORIZED_ADMIN_ROLES.includes(userRole)) return null;

      return adminData;
    } catch (e) {
      console.warn("Firestore admin authorization check failed:", e);
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
    const normalizedRole = userRole.toLowerCase();
    if (normalizedRole === 'superadmin' || normalizedRole === 'super_admin') return true;
    const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
    return permissions.includes(requiredScope) || permissions.includes('all');
  }
};
