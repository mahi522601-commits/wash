import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useWorkerAuth } from '../../context/WorkerAuthContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/orderService';
import { playOrderPlacedSound, unlockAudioNotification } from '../../utils/audioNotification';

export const WorkerLayout = () => {
  const { currentWorker, isAuthenticated, loading } = useWorkerAuth();
  const { info } = useToast();

  // Unlock audio on initial mount for sound alerts
  useEffect(() => {
    unlockAudioNotification();
  }, []);

  // Listen for real-time task assignments dispatched by admin
  useEffect(() => {
    if (!currentWorker?.id) return;

    const handleNewTaskAssigned = (order) => {
      // 1. Play order received chime sound (/1.mp4)
      playOrderPlacedSound();

      // 2. Mobile vibration alert if supported
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([250, 100, 250, 100, 350]);
        }
      } catch (e) {}

      // 3. Display luxury toast notification
      const customer = order?.customerName || order?.customer?.name || 'Customer';
      const orderNum = order?.orderNumber || order?.id || 'New Task';
      const service = order?.service || order?.serviceName || 'Laundry Pickup';
      const address = order?.address || order?.customer?.address || 'Doorstep Pickup';

      info(
        '🚀 New Task Dispatched to You!',
        `${customer} scheduled ${service} (${orderNum}). Location: ${address}.`
      );

      // 4. Notify active worker dashboard to refresh list
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-worker-refresh-tasks', { detail: order }));
      }
    };

    const unsubscribe = orderService.subscribeToWorkerOrders(currentWorker.id, handleNewTaskAssigned);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentWorker?.id, info]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A091A] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/worker/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0E0C22] text-[#F8FAFC] font-sans antialiased selection:bg-cyan-500 selection:text-black">
      <Outlet />
    </div>
  );
};
