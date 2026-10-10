import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderService, TIME_SLOTS, normalizePeriod } from '../../services/orderService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { 
  Menu, 
  Search, 
  Plus, 
  Bell, 
  ShoppingBag, 
  CreditCard, 
  Sparkles, 
  Tag, 
  Flag, 
  Megaphone, 
  LogOut, 
  User, 
  Check, 
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  Truck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { 
  testOrderPlacedSound, 
  isAudioNotificationEnabled, 
  setAudioNotificationEnabled 
} from '../../utils/audioNotification';

export const AdminHeader = ({ onMenuToggle, onOpenSearch }) => {
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const quickAddRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Live Task Schedule & Notification State
  const [taskMetrics, setTaskMetrics] = useState({
    todayDeliveries: [],
    tomorrowDeliveries: [],
    todayPickups: [],
    overdueDeliveries: [],
  });
  const [recentLiveOrders, setRecentLiveOrders] = useState([]);
  const [dismissedNotifKeys, setDismissedNotifKeys] = useState(new Set());

  const loadHeaderTasks = async () => {
    try {
      const ords = await orderService.getOrders({ limitCount: 200 });
      const metrics = orderService.getTaskScheduleMetrics(ords);
      setTaskMetrics(metrics);
      setRecentLiveOrders(ords.slice(0, 5));
    } catch (e) {
      console.warn("Failed to load header task notifications:", e);
    }
  };

  useEffect(() => {
    loadHeaderTasks();
    const unsub = orderService.subscribeToNewOrders(loadHeaderTasks);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setQuickAddOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format breadcrumb title
  const currentPathSegment = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const formattedTitle = currentPathSegment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // Dynamic Live Task Notifications
  const dynamicNotifications = [];

  // 1. Overdue Deliveries Alert
  if (taskMetrics.overdueDeliveries?.length > 0) {
    dynamicNotifications.push({
      id: 'task-overdue',
      title: `⚠️ ${taskMetrics.overdueDeliveries.length} Overdue Deliveries!`,
      desc: `Scheduled delivery date passed for ${taskMetrics.overdueDeliveries.length} order(s). Please review and dispatch.`,
      time: 'Urgent Action',
      icon: AlertTriangle,
      iconColor: 'text-rose-400 bg-rose-500/20',
      badge: 'URGENT',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      path: '/admin/tasks?tab=overdue_deliveries',
      read: dismissedNotifKeys.has('task-overdue'),
    });
  }

  // 2. Today's Deliveries Alert
  if (taskMetrics.todayDeliveries?.length > 0) {
    const morn = taskMetrics.todayDeliveriesMorning?.length || 0;
    const aft = taskMetrics.todayDeliveriesAfternoon?.length || 0;
    const eve = taskMetrics.todayDeliveriesEvening?.length || 0;
    dynamicNotifications.push({
      id: 'task-today-deliv',
      title: `🚚 ${taskMetrics.todayDeliveries.length} Deliveries Scheduled Today`,
      desc: `🌅 Morning: ${morn} • ☀️ Afternoon: ${aft} • 🌙 Evening: ${eve}. Keep riders assigned.`,
      time: 'Today',
      icon: Truck,
      iconColor: 'text-emerald-400 bg-emerald-500/20',
      badge: 'TODAY',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      path: '/admin/tasks?tab=today_deliveries',
      read: dismissedNotifKeys.has('task-today-deliv'),
    });
  }

  // 3. Tomorrow's Deliveries & WhatsApp Reminder Alert
  if (taskMetrics.tomorrowDeliveries?.length > 0) {
    dynamicNotifications.push({
      id: 'task-tomorrow-remind',
      title: `📲 ${taskMetrics.tomorrowDeliveries.length} Upcoming Deliveries Tomorrow`,
      desc: `Dispatch 1-Click WhatsApp delivery slot reminders to customers.`,
      time: 'Tomorrow',
      icon: Calendar,
      iconColor: 'text-cyan-400 bg-cyan-500/20',
      badge: 'REMINDER',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      path: '/admin/tasks?tab=tomorrow_deliveries',
      read: dismissedNotifKeys.has('task-tomorrow-remind'),
      actionBtn: {
        label: 'Send Reminders',
        path: '/admin/tasks?tab=tomorrow_deliveries',
      }
    });
  }

  // 4. Today's Pickups Alert
  if (taskMetrics.todayPickups?.length > 0) {
    dynamicNotifications.push({
      id: 'task-today-pick',
      title: `📦 ${taskMetrics.todayPickups.length} Doorstep Pickups Today`,
      desc: `Customer laundry pickups scheduled across service zones.`,
      time: 'Today',
      icon: Clock,
      iconColor: 'text-amber-400 bg-amber-500/20',
      badge: 'PICKUP',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      path: '/admin/tasks?tab=today_pickups',
      read: dismissedNotifKeys.has('task-today-pick'),
    });
  }

  // 5. Recent Live Customer Orders
  recentLiveOrders.slice(0, 3).forEach((ord, idx) => {
    const isWalkIn = ord.isWalkIn || ord.orderSource === 'OFFLINE_POS';
    dynamicNotifications.push({
      id: `ord-${ord.id || idx}`,
      title: `Order #${ord.orderNumber || ord.id?.substring(0, 8)} • ${ord.customerName || 'Customer'}`,
      desc: `${isWalkIn ? '🏪 Shop POS' : '🌐 Online Pickup'} • ${ord.serviceName || ord.service || 'Laundry'} • ₹${ord.finalPrice || ord.totalAmount || 0}`,
      time: ord.createdAt ? new Date(ord.createdAt?.toDate ? ord.createdAt.toDate() : ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
      icon: ShoppingBag,
      iconColor: 'text-purple-400 bg-purple-500/20',
      badge: isWalkIn ? 'POS' : 'ONLINE',
      badgeColor: isWalkIn ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      path: '/admin/orders',
      read: dismissedNotifKeys.has(`ord-${ord.id || idx}`),
    });
  });

  const unreadCount = dynamicNotifications.filter(n => !n.read).length;
  const markAllAsRead = () => {
    const allKeys = new Set(dynamicNotifications.map(n => n.id));
    setDismissedNotifKeys(allKeys);
  };

  const todayTaskCount = (taskMetrics.todayDeliveries?.length || 0) + (taskMetrics.todayPickups?.length || 0);

  // Sound notification state & live chime pulse
  const [soundEnabled, setSoundEnabled] = useState(() => isAudioNotificationEnabled());
  const [isChiming, setIsChiming] = useState(false);

  useEffect(() => {
    const handleSoundPlayed = () => {
      setIsChiming(true);
      setTimeout(() => setIsChiming(false), 3500);
    };
    window.addEventListener('techwash-sound-played', handleSoundPlayed);
    return () => window.removeEventListener('techwash-sound-played', handleSoundPlayed);
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioNotificationEnabled(next);
  };

  const handleTestChime = (e) => {
    e.stopPropagation();
    testOrderPlacedSound();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="h-16 bg-[#0E0C22] text-white border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      
      {/* 1. LEFT: MOBILE TOGGLE + BREADCRUMB */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 lg:hidden shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-white/20 shrink-0 lg:hidden overflow-hidden">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span className="text-[11px] font-bold text-[#FED7AA] hidden sm:inline">Command Center</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <h1 className="text-xs sm:text-sm font-black font-display text-white tracking-tight truncate">
            {formattedTitle}
          </h1>
        </div>
      </div>

      {/* 2. CENTER: GLOBAL COMMAND SEARCH TRIGGER (Ctrl + K) */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
            <span>Search modules, orders, CRM, services...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-mono text-purple-300 border border-white/10">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* 3. RIGHT ACTIONS: TODAY'S TASKS + QUICK ADD + NOTIFICATIONS + USER PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 md:hidden"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Dedicated "Internal Storage" Status Button */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('techwash-open-storage-manager'))}
          className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Open Internal Device Storage Telemetry (TechWashPOS IndexedDB)"
        >
          <div className="relative flex items-center justify-center">
            <HardDrive className="w-3.5 h-3.5 text-orange-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="hidden xl:inline text-[11px]">Internal DB</span>
        </button>

        {/* Dedicated "Today's Tasks" Header Button with Live Badge */}
        <Link
          to="/admin/tasks"
          className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all"
          title="Open Today's Deliveries, Pickups & Reminders Hub"
        >
          <Truck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Today's Tasks</span>
          {todayTaskCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-mono font-black">
              {todayTaskCount}
            </span>
          )}
        </Link>

        {/* Quick Add Dropdown */}
        <div className="relative" ref={quickAddRef}>
          <button
            type="button"
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/50 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {quickAddOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#161333] border border-purple-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-scale-up">
              <div className="px-3 py-1.5 text-[10px] font-bold text-purple-300/80 uppercase">
                Fast Create Actions
              </div>
              <div className="space-y-0.5 pt-1">
                <Link
                  to="/admin/orders"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Create Manual Order</span>
                </Link>

                <Link
                  to="/admin/services"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Add New Service</span>
                </Link>

                <Link
                  to="/admin/offers"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Create Promo Offer</span>
                </Link>

                <Link
                  to="/admin/banners"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  <Flag className="w-4 h-4 text-pink-400" />
                  <span>Upload Banner Ad</span>
                </Link>

                <Link
                  to="/admin/announcements"
                  onClick={() => setQuickAddOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium transition-colors"
                >
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <span>Post Announcement</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Drawer Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isChiming 
                ? 'bg-purple-600 text-white border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.6)] animate-pulse' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
            }`}
            title="Notifications & Tasks"
          >
            <Bell className={`w-4 h-4 ${isChiming ? 'animate-bounce text-cyan-300' : ''}`} />
            {isChiming && (
              <span className="absolute -top-1 -left-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
              </span>
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00F0FF] text-[#0F0D24] text-[9px] font-black flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161333] border border-purple-500/30 rounded-3xl shadow-2xl p-4 z-50 text-xs animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Notifications & Tasks</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-black">
                      {unreadCount} pending
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-purple-300 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Order Chime Sound Settings Bar */}
              <div className="my-2.5 p-2 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-medium">
                    {soundEnabled ? 'Chime Sound On' : 'Chime Muted'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleTestChime}
                  className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-[10px] font-bold text-cyan-300 border border-purple-400/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Test notification chime (/1.mp4)"
                >
                  <span>🔊 Test Chime</span>
                </button>
              </div>

              {/* Dynamic Live Notification & Tasks Feed */}
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto py-1 space-y-1">
                {dynamicNotifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No active task notifications right now.
                  </div>
                ) : (
                  dynamicNotifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.id}
                        to={n.path}
                        onClick={() => setNotificationsOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-2xl transition-colors ${
                          n.read ? 'text-slate-400 hover:bg-white/5' : 'text-slate-200 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.iconColor || 'bg-purple-500/20 text-cyan-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-bold text-white text-xs leading-tight truncate">
                              {n.title}
                            </div>
                            {n.badge && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black border ${n.badgeColor}`}>
                                {n.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            {n.desc}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-purple-300/70">
                            <span>{n.time}</span>
                            <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                              Open ➔
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                <Link
                  to="/admin/tasks"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <span>📋 Today's Tasks Hub</span>
                </Link>
                <Link
                  to="/admin/orders"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  All Orders →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white font-black text-xs shadow-sm">
              {(currentUser?.displayName || currentUser?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block text-left leading-none">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">
                {currentUser?.displayName || currentUser?.name || 'Tech Wash Admin'}
              </div>
              <div className="text-[9px] font-bold text-[#F97316] uppercase mt-0.5 tracking-wider">
                {(currentUser?.role || 'admin').toUpperCase()}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#161333] border border-purple-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-scale-up">
              <div className="p-2.5 border-b border-white/10">
                <div className="font-bold text-white truncate">
                  {currentUser?.displayName || currentUser?.name || 'Tech Wash Admin'}
                </div>
                <div className="text-[10px] text-purple-300 truncate font-mono">
                  {currentUser?.email || ''}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Global Settings</span>
                </Link>
                <Link
                  to="/"
                  target="_blank"
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Customer Site</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-medium transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
