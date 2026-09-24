import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Image as ImageIcon, 
  Film, 
  Flag, 
  PartyPopper, 
  Megaphone, 
  Award, 
  MessageSquareQuote, 
  BookOpen, 
  MapPin, 
  CreditCard, 
  UserCheck, 
  Phone, 
  HelpCircle, 
  Search, 
  Sliders, 
  ShieldAlert, 
  History, 
  Activity,
  FileText,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ExternalLink,
  ShieldCheck,
  Bike,
  Store,
  AlertCircle,
  Wallet
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'techwash_admin_sidebar_collapsed';

export const AdminSidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { currentUser, logout, hasPermission } = useAuth();
  const { pathname } = useLocation();

  const sections = [
    {
      title: 'CORE & INTELLIGENCE',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Analytics & BI', path: '/admin/analytics', icon: BarChart3, badge: 'Insights' },
        { name: 'Financial Reports & PDFs', path: '/admin/reports', icon: FileText, badge: '30-Day PDF', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
        { name: 'Business Settings', path: '/admin/settings', icon: Sliders, badge: 'Phone & WA', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
      ]
    },
    {
      title: 'OPERATIONS & LOGISTICS',
      items: [
        { name: 'Orders Management', path: '/admin/orders', icon: ShoppingBag, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
        { name: 'POS Billing Machines', path: '/billing', icon: Store, badge: '3 Counters', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
        { name: 'Balance Due Tracker', path: '/admin/balances', icon: AlertCircle, badge: 'Due', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
        { name: 'Customer CRM', path: '/admin/customers', icon: Users },
        { name: 'Store Locations', path: '/admin/locations', icon: MapPin },
        { name: 'Payments & QR', path: '/admin/payments', icon: CreditCard },
        { name: 'Operations Staff', path: '/admin/staff', icon: UserCheck },
        { name: 'Worker / Rider Portal', path: '/worker/login', icon: Bike, badge: 'Fleet', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
      ]
    },
    {
      title: 'CATALOG & OFFERS',
      items: [
        { name: 'Services CMS', path: '/admin/services', icon: Sparkles },
        { name: 'Pricing Master', path: '/admin/pricing', icon: DollarSign },
        { name: 'Offers & Campaigns', path: '/admin/offers', icon: Tag, badge: '1:1', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
        { name: 'Before & After Gallery', path: '/admin/gallery', icon: ImageIcon, badge: 'HD', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
        { name: 'Blog & Guides', path: '/admin/blog', icon: BookOpen },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0B0A1C] text-slate-300 border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* 1. SIDEBAR BRAND HEADER */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-[#080716] shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-0.5 shadow-lg shadow-black/40 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
              <img 
                src="/techwashlogo.webp" 
                alt="Tech Wash" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate animate-fade-in">
                <span className="font-black font-display text-sm tracking-tight text-white leading-none">
                  TECH <span className="text-[#F97316]">WASH</span>
                </span>
                <span className="text-[9px] font-black tracking-widest text-[#FED7AA] uppercase mt-0.5">
                  COMMAND CENTER
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white items-center justify-center transition-colors border border-white/10"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. NAVIGATION GROUPS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {sections.map((section, idx) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 text-[10px] font-black tracking-widest text-purple-300/60 uppercase">
                  {section.title}
                </div>
              ) : (
                <div className="h-px bg-white/10 my-2 mx-2" />
              )}

              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== '/admin/dashboard' && pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive: active }) => {
                        const isCurrent = active || isActive;
                        return `relative group flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-[#6D28D9] to-[#4C1D95] text-white shadow-lg shadow-purple-950/60 border border-purple-400/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        } ${isCollapsed ? 'justify-center' : ''}`;
                      }}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {({ isActive: active }) => {
                        const isCurrent = active || isActive;
                        return (
                          <>
                            {/* Cyan Accent Indicator */}
                            {isCurrent && (
                              <span className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                            )}

                            <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isCurrent ? 'text-[#00F0FF]' : 'text-slate-400 group-hover:text-purple-300'
                            }`} />

                            {!isCollapsed && (
                              <div className="flex-1 flex items-center justify-between truncate">
                                <span className="truncate">{item.name}</span>
                                {item.badge && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${
                                    item.badgeColor || 'bg-white/10 text-purple-200 border-white/10'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Floating tooltip when collapsed */}
                            {isCollapsed && (
                              <div className="fixed left-20 ml-2 px-3 py-1.5 bg-[#1E1B4B] text-white text-xs font-bold rounded-xl shadow-2xl border border-purple-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                {item.name}
                              </div>
                            )}
                          </>
                        );
                      }}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. BOTTOM PROFILE & SYSTEM STATUS CARD */}
        <div className="p-3 border-t border-white/10 bg-[#080716] shrink-0">
          {!isCollapsed ? (
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <span>{(currentUser?.displayName || currentUser?.email || 'A')[0].toUpperCase()}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B0A1C] rounded-full" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser?.displayName || currentUser?.name || 'Tech Wash Admin'}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-medium truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400 inline shrink-0" />
                    <span>Live Command Access</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">
                <span>{(currentUser?.displayName || currentUser?.email || 'A')[0].toUpperCase()}</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B0A1C] rounded-full" />
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
