import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Sparkles, 
  DollarSign, 
  Tag, 
  Image as ImageIcon, 
  Film, 
  Megaphone, 
  MapPin, 
  CreditCard, 
  BookOpen, 
  MessageSquareQuote, 
  HelpCircle, 
  Sliders, 
  FileText, 
  ShieldAlert, 
  Activity, 
  ArrowRight, 
  X,
  Plus
} from 'lucide-react';

const SEARCHABLE_ITEMS = [
  // Core & Operations
  { title: 'Dashboard & Command Center', category: 'Navigation', path: '/admin/dashboard', icon: LayoutDashboard, keywords: 'home stats overview kpi' },
  { title: 'Analytics & BI Intelligence', category: 'Intelligence', path: '/admin/analytics', icon: Activity, keywords: 'revenue sales conversion charts telemetry' },
  { title: 'Orders Management', category: 'Operations', path: '/admin/orders', icon: ShoppingBag, keywords: 'bookings pickups deliveries stages' },
  { title: 'Customer CRM', category: 'Operations', path: '/admin/customers', icon: Users, keywords: 'clients spending profiles vip history' },
  { title: 'Store Locations & Hubs', category: 'Operations', path: '/admin/locations', icon: MapPin, keywords: 'branches address geo coordinates' },
  { title: 'Payments & QR Code', category: 'Operations', path: '/admin/payments', icon: CreditCard, keywords: 'upi gateway transactions razorpay rayzon' },
  { title: 'Operations Staff & Riders', category: 'Operations', path: '/admin/staff', icon: Users, keywords: 'delivery boys riders managers' },
  
  // Catalog & Offers
  { title: 'Services Catalog CMS', category: 'Catalog', path: '/admin/services', icon: Sparkles, keywords: 'dry cleaning laundry shoe care steam press' },
  { title: 'Pricing Master Engine', category: 'Catalog', path: '/admin/pricing', icon: DollarSign, keywords: 'rates apparel rates items' },
  { title: 'Offers & 1:1 Popup Campaign Manager', category: 'Marketing', path: '/admin/offers', icon: Tag, keywords: 'discounts promo codes coupons first order popup' },
  { title: 'Blog & Garment Care Guides', category: 'Content', path: '/admin/blog', icon: BookOpen, keywords: 'articles silk wool stain removal' },
];

export const AdminCommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = query.trim() === '' 
    ? SEARCHABLE_ITEMS.slice(0, 8)
    : SEARCHABLE_ITEMS.filter((item) => {
        const text = `${item.title} ${item.category} ${item.keywords}`.toLowerCase();
        return text.includes(query.toLowerCase());
      });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-28 px-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-[#0F0D24] text-white rounded-3xl border border-purple-500/30 shadow-[0_25px_80px_-15px_rgba(109,40,217,0.6)] overflow-hidden animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, orders, services, settings, offers... (Ctrl+K)"
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-purple-300 border border-white/10">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <span>No matching command or module found for "{query}"</span>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.path + item.title}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#6D28D9]/50 via-[#3B1578]/50 to-transparent text-white border border-purple-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#00F0FF] text-[#0F0D24]' : 'bg-white/10 text-purple-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-0.5">
                        {item.category} • {item.path}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="hidden sm:inline">Jump</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 px-5">
          <div className="flex items-center gap-4">
            <span><strong className="text-slate-200">↑ ↓</strong> Navigate</span>
            <span><strong className="text-slate-200">↵</strong> Select</span>
            <span><strong className="text-slate-200">ESC</strong> Close</span>
          </div>
          <span className="text-cyan-400 font-bold text-[10px] tracking-wider uppercase">
            Tech Wash Command Suite
          </span>
        </div>
      </div>
    </div>
  );
};
