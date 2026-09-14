/**
 * Worker / Delivery Rider Authentication & Session Service
 * Manages dedicated worker credentials, login sessions, on-duty states & offline caching
 */
import { staffService } from './staffService';

const WORKER_SESSION_KEY = 'techwash_worker_session';
const WORKER_DUTY_EVENT = 'techwash_worker_duty_changed';

export const workerAuthService = {
  /**
   * Log in worker with email and password
   */
  async login(email, password) {
    const staff = await staffService.verifyWorkerCredentials(email, password);
    
    const session = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role || 'Delivery Executive',
      hub: staff.hub || 'Central Hub',
      vehicleNumber: staff.vehicleNumber || '',
      dutyStatus: staff.dutyStatus || 'ON_DUTY',
      active: staff.active,
      loggedInAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(WORKER_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Worker session storage error:', e);
    }

    return session;
  },

  /**
   * Get currently logged-in worker session
   */
  getCurrentWorker() {
    try {
      const data = localStorage.getItem(WORKER_SESSION_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  /**
   * Check if worker is logged in
   */
  isAuthenticated() {
    const worker = this.getCurrentWorker();
    return Boolean(worker && worker.id && worker.email);
  },

  /**
   * Update duty status (ON_DUTY / OFF_DUTY)
   */
  async setDutyStatus(dutyStatus) {
    const current = this.getCurrentWorker();
    if (!current) return null;

    const nextDuty = dutyStatus === 'ON_DUTY' ? 'ON_DUTY' : 'OFF_DUTY';
    const updated = { ...current, dutyStatus: nextDuty };

    try {
      localStorage.setItem(WORKER_SESSION_KEY, JSON.stringify(updated));
      await staffService.updateDutyStatus(current.id, nextDuty);
    } catch (e) {
      console.warn('Failed to persist duty status:', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(WORKER_DUTY_EVENT, { detail: { dutyStatus: nextDuty } }));
    }

    return updated;
  },

  /**
   * Log out worker
   */
  logout() {
    try {
      localStorage.removeItem(WORKER_SESSION_KEY);
    } catch {}
  }
};
