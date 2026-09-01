import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  X,
  ExternalLink
} from 'lucide-react';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { currentUser, hasPermission } = useAuth();

  const sections = [
    {
      title: 'CORE',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Analytics & BI', path: '/admin/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'OPERATIONS & BUSINESS',
      items: [
        { name: 'Orders Management', path: '/admin/orders', icon: ShoppingBag, badge: 'Live' },
        { name: 'Customer CRM', path: '/admin/customers', icon: Users },
        { name: 'Store Locations', path: '/admin/locations', icon: MapPin },
        { name: 'Payments & QR', path: '/admin/payments', icon: CreditCard },
        { name: 'Operations Staff', path: '/admin/staff', icon: UserCheck },
      ]
    },
    {
      title: 'CMS & CONTENT',
      items: [
        { name: 'Services CMS', path: '/admin/services', icon: Sparkles },
        { name: 'Quality Standards', path: '/admin/quality-services', icon: Award },
        { name: 'Process Roadmap', path: '/admin/process', icon: Layers },
        { name: 'Pricing Master', path: '/admin/pricing', icon: DollarSign },
        { name: 'Media Library', path: '/admin/media', icon: ImageIcon },
        { name: 'Hero Slides', path: '/admin/hero-slides', icon: Film },
        { name: 'General Banners', path: '/admin/banners', icon: Flag },
        { name: 'Festival Banners', path: '/admin/festival-banners', icon: PartyPopper },
        { name: 'Offers & Popup CMS', path: '/admin/offers', icon: Tag, badge: '1:1' },
        { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
        { name: 'Why Choose Us', path: '/admin/why-choose-us', icon: Award },
        { name: 'Testimonials', path: '/admin/testimonials', icon: MessageSquareQuote },
        { name: 'Photo Gallery', path: '/admin/gallery', icon: Layers },
        { name: 'Blog & Guides', path: '/admin/blog', icon: BookOpen },
      ]
    },
    {
      title: 'WEBSITE CONFIG & CONCIERGE',
      items: [
        { name: 'AI Chatbot', path: '/admin/chatbot', icon: Sparkles, badge: 'AI' },
        { name: 'Floating Actions', path: '/admin/floating-actions', icon: Sliders },
        { name: 'Service Area & Zones', path: '/admin/settings/service-area', icon: MapPin, badge: 'GPS' },
        { name: 'Contact Details', path: '/admin/contacts', icon: Phone },
        { name: 'FAQs Management', path: '/admin/faq', icon: HelpCircle },
        { name: 'SEO & Meta Tags', path: '/admin/seo', icon: Search },
      ]
    },
    {
      title: 'SYSTEM & SECURITY',
      items: [
        { name: 'Invoice & Receipt CMS', path: '/admin/settings/receipt', icon: FileText, badge: 'A4' },
        { name: 'Global Settings', path: '/admin/settings', icon: Sliders },
        { name: 'Admin Users & RBAC', path: '/admin/admin-users', icon: ShieldAlert },
        { name: 'Activity Audit Log', path: '/admin/activity-log', icon: History },
        { name: 'System Health', path: '/admin/system-health', icon: Activity },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 via-cyan-500 to-royal-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
              TW
            </div>
            <div>
              <span className="font-bold font-display text-white tracking-tight text-base">
                TECH WASH
              </span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-cyan-400 -mt-1">
                Admin SaaS Suite
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin">
          {sections.map((sec, sIdx) => (
            <div key={sIdx}>
              <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2 font-display">
                {sec.title}
              </p>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                          isActive
                            ? 'bg-gradient-to-r from-brand-600 to-royal-700 text-white shadow-md shadow-brand-600/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Shortcut to Public Site */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Website</span>
            </span>
            <span className="text-[10px] text-slate-400">↗</span>
          </Link>
        </div>

      </aside>
    </>
  );
};
