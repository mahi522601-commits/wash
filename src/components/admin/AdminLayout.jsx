import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/orderService';
import { playOrderPlacedSound, unlockAudioNotification } from '../../utils/audioNotification';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminCommandPalette } from './AdminCommandPalette';
import { AdvancedLogoLoader } from '../common/AdvancedLogoLoader';

const SIDEBAR_COLLAPSED_KEY = 'techwash_admin_sidebar_collapsed';

export const AdminLayout = () => {
  const { currentUser, loading } = useAuth();
  const { info } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

  // Pre-unlock audio on mount
  useEffect(() => {
    unlockAudioNotification();
  }, []);

  // Listen for real-time new customer orders across all channels & play notification sound (/1.mp4)
  useEffect(() => {
    const handleNewOrder = (order) => {
      const customer = order?.customerName || order?.customer?.name || 'Customer';
      const serviceName = order?.serviceName || order?.service || 'Laundry Service';
      const orderNum = order?.orderNumber || order?.id || 'New Order';
      const amount = order?.totalAmount || order?.priceSnapshot?.finalTotal;

      // Play enhanced notification chime (/1.mp4) with gain booster & system notification
      playOrderPlacedSound(false, {
        title: `🚨 New Order #${orderNum} Received!`,
        message: `${customer} placed an order for ${serviceName}${amount ? ` (₹${amount})` : ''}.`
      });

      info(
        '🔔 New Order Received!',
        `${customer} scheduled ${serviceName} (${orderNum})${amount ? ` • ₹${amount}` : ''}.`
      );
    };

    const unsubscribe = orderService.subscribeToNewOrders(handleNewOrder);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [info]);

  // Global Ctrl + K / Cmd + K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(nextState));
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A1C] flex items-center justify-center text-white p-4">
        <AdvancedLogoLoader
          size="lg"
          text="Initializing Command Center..."
          subtext="Authenticating Admin SaaS Workspace"
          dark={true}
          showDynamicStages={true}
        />
      </div>
    );
  }

  // Protected Admin Routes check: must be authenticated and have valid admin role (superadmin, admin, manager, staff)
  if (!currentUser || !authService.isAuthorizedAdminRole(currentUser.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-[#171717] flex font-sans antialiased selection:bg-purple-500 selection:text-white">
      
      {/* 1. COLLAPSIBLE NAVIGATION SIDEBAR */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        
        {/* Top Command Bar */}
        <AdminHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setSearchPaletteOpen(true)}
        />

        {/* Content Workspace Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* 3. GLOBAL COMMAND SEARCH PALETTE (Ctrl + K) */}
      <AdminCommandPalette
        isOpen={searchPaletteOpen}
        onClose={() => setSearchPaletteOpen(false)}
      />

    </div>
  );
};
