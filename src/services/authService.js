/**
 * Real Firebase Authentication & Firestore Admin Authorization Service for Tech Wash
 * Connects directly to project: laundry-37abc
 * Enforces admin authorization via: users/{uid} document verification (role: admin)
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
   * Log in user with Firebase Auth and verify Firestore admin document: users/{uid}
   */
  async login(email, password) {
    if (!auth || !db) {
      throw new Error('Unable to connect to the authentication service. Please check Firebase configuration.');
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Verify admin document in Firestore: users/{currentUser.uid}
      let userDocSnap;
      try {
        userDocSnap = await getDoc(doc(db, 'users', user.uid));
      } catch (firestoreErr) {
        console.error("Firestore read error for UID:", user.uid, firestoreErr);
        await signOut(auth);
        const code = firestoreErr?.code || '';
        if (code === 'permission-denied') {
          throw new Error('Firestore Permission Denied: Your Firebase Firestore Security Rules are blocking reads. Please publish the Firestore Security Rules in Firebase Console.');
        }
        if (code === 'unavailable' || code === 'deadline-exceeded') {
          throw new Error('Firestore Database is currently unreachable. Please check your network or Firestore region status.');
        }
        throw new Error(`Firestore Error (${code || 'read-failed'}): Unable to read users/${user.uid}. Please check Firestore rules in Firebase Console.`);
      }

      // 3. Document must exist in 'users' collection
      if (!userDocSnap.exists()) {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }

      const userData = userDocSnap.data() || {};

      // 4. Must be active (if active flag is set)
      if (userData.active === false) {
        await signOut(auth);
        throw new Error('Your admin account is currently disabled.');
      }

      // 5. Must have role === 'admin'
      const userRole = (userData.role || '').toLowerCase().trim();
      if (userRole !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }

      // 6. Return verified admin profile
      const adminProfile = {
        uid: user.uid,
        email: user.email,
        displayName: userData.name || user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
        name: userData.name || 'Tech Wash Admin',
        role: userData.role || 'admin',
        active: true,
        token: await user.getIdToken(),
      };

      return adminProfile;
    } catch (err) {
      // Log raw error to development console for precise diagnostics
      console.error("Firebase Login Error:", err);

      // If error was already our custom authorization error, rethrow it
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
        throw new Error('Email/Password provider is disabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.');
      } else if (errorCode === 'auth/network-request-failed') {
        throw new Error('Network connection error. Unable to reach Firebase authentication servers.');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (errorCode === 'auth/api-key-not-valid' || errorCode === 'auth/invalid-api-key') {
        throw new Error('Firebase API Key is invalid. Please update VITE_FIREBASE_API_KEY in your .env file with the valid Web API Key from Firebase Console (Project Settings > General).');
      }

      throw new Error(err.message || 'Incorrect email or password.');
    }
  },

  /**
   * Verify Firestore admin document for an existing Firebase User: users/{uid}
   */
  async verifyAdminDocument(uid) {
    if (!db || !uid) return null;

    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) return null;

      const userData = userSnap.data() || {};
      if (userData.active === false) return null;

      const userRole = (userData.role || '').toLowerCase().trim();
      if (userRole !== 'admin') return null;

      return userData;
    } catch (e) {
      console.warn("Firestore user admin authorization check failed:", e);
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
