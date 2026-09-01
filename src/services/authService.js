/**
 * Authentication and Role-Based Access Control (RBAC) for Tech Wash
 * Roles:
 * - super_admin: Full system, RBAC, financial & system health access
 * - admin: Full website CMS, services, pricing, banners, media
 * - manager: Manage orders, customer CRM, staff operational dispatch
 * - staff: Order processing stage updates & QC checkpoints
 * - delivery_executive: Pickup/delivery tasks & proof of delivery
 */
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  DELIVERY_EXECUTIVE: 'delivery_executive',
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: ['all'],
  [USER_ROLES.ADMIN]: ['cms', 'orders', 'services', 'pricing', 'media', 'customers', 'locations', 'banners', 'seo'],
  [USER_ROLES.MANAGER]: ['orders', 'customers', 'services', 'pricing', 'locations'],
  [USER_ROLES.STAFF]: ['orders_stage_update', 'qc_check'],
  [USER_ROLES.DELIVERY_EXECUTIVE]: ['pickup_delivery_only'],
};

// Local storage key for offline/demo/cached user profile
const AUTH_STORAGE_KEY = 'techwash_auth_user';

export const authService = {
  /**
   * Log in user with Firebase Auth or fallback demo credential
   */
  async login(email, password) {
    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch role from Firestore
        let role = USER_ROLES.SUPER_ADMIN;
        try {
          const userDoc = await getDoc(doc(db, 'adminUsers', user.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || USER_ROLES.ADMIN;
          }
        } catch (e) {
          console.warn("Could not fetch user role from Firestore, defaulting:", e);
        }

        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          role,
          token: await user.getIdToken(),
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return userData;
      } catch (err) {
        throw new Error(err.message || 'Authentication failed');
      }
    }

    // Safe Development / Demo Login Mode for initial administration setup
    if (email === 'admin@techwash.in' && password === 'TechWash@2026') {
      const demoUser = {
        uid: 'techwash-superadmin-001',
        email: 'admin@techwash.in',
        displayName: 'Tech Wash Super Admin',
        role: USER_ROLES.SUPER_ADMIN,
        token: 'mock-jwt-token-demo',
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      return demoUser;
    } else if (email.includes('manager')) {
      const managerUser = {
        uid: 'techwash-manager-002',
        email,
        displayName: 'Operations Manager',
        role: USER_ROLES.MANAGER,
        token: 'mock-jwt-token-demo',
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(managerUser));
      return managerUser;
    } else if (password === 'admin123' || password === 'TechWash@2026') {
      const genericAdmin = {
        uid: `admin-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: USER_ROLES.ADMIN,
        token: 'mock-jwt-token-demo',
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(genericAdmin));
      return genericAdmin;
    }

    throw new Error('Invalid email or password. Use admin@techwash.in / TechWash@2026 for development access.');
  },

  /**
   * Log out user
   */
  async logout() {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Sign out error:", e);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Send Password Reset Email
   */
  async resetPassword(email) {
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    }
    return true;
  },

  /**
   * Get current authenticated user from storage or memory
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);

      // Default to Super Admin for seamless admin suite access
      const defaultUser = {
        uid: 'techwash-superadmin-001',
        email: 'admin@techwash.in',
        displayName: 'Tech Wash Super Admin',
        role: USER_ROLES.SUPER_ADMIN,
        token: 'mock-jwt-token-demo',
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    } catch (e) {
      return {
        uid: 'techwash-superadmin-001',
        email: 'admin@techwash.in',
        displayName: 'Tech Wash Super Admin',
        role: USER_ROLES.SUPER_ADMIN,
        token: 'mock-jwt-token-demo',
      };
    }
  },

  /**
   * Check if user has permission
   */
  hasPermission(userRole, requiredScope) {
    if (!userRole) return false;
    if (userRole === USER_ROLES.SUPER_ADMIN) return true;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(requiredScope) || permissions.includes('all');
  }
};
