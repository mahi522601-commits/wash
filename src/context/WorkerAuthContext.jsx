import React, { createContext, useContext, useState, useEffect } from 'react';
import { workerAuthService } from '../services/workerAuthService';

const WorkerAuthContext = createContext(null);

export const WorkerAuthProvider = ({ children }) => {
  const [currentWorker, setCurrentWorker] = useState(() => workerAuthService.getCurrentWorker());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentWorker(workerAuthService.getCurrentWorker());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('techwash_worker_duty_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('techwash_worker_duty_changed', handleStorageChange);
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const session = await workerAuthService.login(email, password);
      setCurrentWorker(session);
      return session;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    workerAuthService.logout();
    setCurrentWorker(null);
  };

  const toggleDuty = async () => {
    if (!currentWorker) return;
    const nextStatus = currentWorker.dutyStatus === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY';
    const updated = await workerAuthService.setDutyStatus(nextStatus);
    if (updated) setCurrentWorker(updated);
  };

  const value = {
    currentWorker,
    isAuthenticated: Boolean(currentWorker && currentWorker.id),
    dutyStatus: currentWorker?.dutyStatus || 'ON_DUTY',
    isOnDuty: (currentWorker?.dutyStatus || 'ON_DUTY') === 'ON_DUTY',
    loading,
    login,
    logout,
    toggleDuty,
  };

  return (
    <WorkerAuthContext.Provider value={value}>
      {children}
    </WorkerAuthContext.Provider>
  );
};

export const useWorkerAuth = () => {
  const context = useContext(WorkerAuthContext);
  if (!context) {
    throw new Error('useWorkerAuth must be used within a WorkerAuthProvider');
  }
  return context;
};
