import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Clock
} from 'lucide-react';

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

  // Sample live notifications
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New Pickup Order #TW-892401', desc: '₹849 • 3x Pure Silk Sarees • Express', time: '5m ago', icon: ShoppingBag, read: false, path: '/admin/orders' },
    { id: 'n2', title: 'UPI QR Payment Verified', desc: '₹1,249 credited via PhonePe • Order #TW-891902', time: '22m ago', icon: CreditCard, read: false, path: '/admin/payments' },
    { id: 'n3', title: 'Scheduled Pickup Alert', desc: 'Doorstep pickup in Banjara Hills (Slot: 4:00 PM)', time: '1h ago', icon: Clock, read: true, path: '/admin/orders' },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
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
          <span className="text-[11px] font-bold text-purple-300/80 hidden sm:inline">Command Center</span>
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

      {/* 3. RIGHT ACTIONS: QUICK ADD + NOTIFICATIONS + USER PROFILE */}
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
            className="relative p-2 sm:p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
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
                  <span className="font-bold text-white text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-purple-300 hover:text-white font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto py-1">
                {notifications.map((n) => {
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
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-xs leading-tight truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          {n.desc}
                        </div>
                        <div className="text-[9px] text-purple-300/70 mt-1">
                          {n.time}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10 text-center">
                <Link
                  to="/admin/orders"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  View All Operations →
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
