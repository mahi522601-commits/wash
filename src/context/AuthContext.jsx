import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { authService, USER_ROLES } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Real Firebase Auth listener with Firestore admin verification
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const adminData = await authService.verifyAdminDocument(firebaseUser.uid);
          if (adminData) {
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || adminData.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Admin'),
              role: adminData.role || 'superadmin',
              active: true,
            });
          } else {
            // Not an authorized admin in Firestore -> sign out
            await authService.logout();
            setCurrentUser(null);
          }
        } catch (e) {
          console.warn("Auth listener admin check failed:", e);
          await authService.logout();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const hasPermission = (scope) => {
    if (!currentUser) return false;
    return authService.hasPermission(currentUser.role, scope);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, hasPermission, USER_ROLES }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
