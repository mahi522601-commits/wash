import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Sparkles, 
  Calendar, 
  ShoppingBag, 
  MoreHorizontal,
  Compass,
  Layers,
  MapPin,
  HelpCircle,
  Tag,
  Gift,
  Image,
  ArrowRight,
  X
} from 'lucide-react';

export const MobileBottomNav = ({ onOpenAssistant }) => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close drawer on page change
  useEffect(() => {
    setMoreDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 5-BUTTON FIXED BOTTOM NAVIGATION BAR */}
      <nav
        className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-brand-200 shadow-2xl transition-transform duration-300 pb-safe ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="grid grid-cols-5 items-center justify-around px-2 py-1 relative">
          
          {/* Button 1: Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              pathname === '/' ? 'text-[#F97316]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          {/* Button 2: Services */}
          <Link
            to="/services"
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              pathname.startsWith('/services') ? 'text-[#F97316]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span>Services</span>
          </Link>

          {/* Button 3: MIDDLE ELEVATED CIRCULAR BOOK BUTTON */}
          <div className="relative flex justify-center -top-5">
            <Link
              to="/book-pickup"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(249,115,22,0.45)] border-4 border-white transform active:scale-95 hover:scale-105 transition-all"
              aria-label="Book Doorstep Pickup"
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">BOOK</span>
            </Link>
          </div>

          {/* Button 4: Track Orders */}
          <Link
            to="/track-order"
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              pathname === '/track-order' ? 'text-[#F97316]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span>Orders</span>
          </Link>

          {/* Button 5: More Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              moreDrawerOpen ? 'text-[#F97316]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>

        </div>
      </nav>

      {/* MORE ACTIONS BOTTOM SHEET DRAWER */}
      {moreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-[36px] p-5 sm:p-6 space-y-4 border-t border-brand-200 shadow-2xl max-h-[85vh] overflow-y-auto pb-safe animate-slide-up">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-display block">
                  Quick Navigation & Concierge
                </span>
                <span className="text-[10px] text-slate-500">
                  Explore rates, branches & concierge services
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════════
                PRIMARY HIGHLIGHTED CARDS: PRICING & STORE LOCATIONS
            ═════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-2.5">
              
              {/* HIGHLIGHTED CARD 1: PRICING */}
              <Link
                to="/pricing"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF7ED] via-[#FFEDD5] to-[#FFF7ED] border-2 border-[#F97316] shadow-sm flex items-center justify-between gap-3 group active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black font-display text-slate-900 uppercase tracking-tight">
                        Pricing
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EA580C] text-white text-[9px] font-black uppercase tracking-wider">
                        ⚡ Rate Card
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      Per-piece & per-kg transparent garment care rates
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-white text-[#F97316] flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </Link>

              {/* HIGHLIGHTED CARD 2: STORE LOCATIONS */}
              <Link
                to="/locations"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#ECFEFF] via-[#CFFAFE] to-[#ECFEFF] border-2 border-[#06B6D4] shadow-sm flex items-center justify-between gap-3 group active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#0891B2] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black font-display text-slate-900 uppercase tracking-tight">
                        Store Locations
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0891B2] text-white text-[9px] font-black uppercase tracking-wider">
                        📍 Near You
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      Jubilee Hills, Banjara Hills, Gachibowli & maps
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-white text-[#0891B2] flex items-center justify-center shrink-0 shadow-xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </div>
              </Link>

            </div>

            {/* ═════════════════════════════════════════════════════════
                SECONDARY 2x2 NAVIGATION TILES
            ═════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                to="/how-it-works"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate">6-Stage Process</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Eco Chemistry</div>
                </div>
              </Link>

              <Link
                to="/offers"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate">Special Offers</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Coupons & Deals</div>
                </div>
              </Link>

              <Link
                to="/gallery"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Image className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate">Transformations</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Before & After</div>
                </div>
              </Link>

              <Link
                to="/faq"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate">Help & FAQs</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Customer Care</div>
                </div>
              </Link>
            </div>

            {/* AI Concierge Trigger Button */}
            {onOpenAssistant && (
              <button
                type="button"
                onClick={() => {
                  setMoreDrawerOpen(false);
                  onOpenAssistant();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1F2937] to-[#111827] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg border border-orange-500/40 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#F97316] animate-spin" />
                <span>Open AI Concierge Assistant</span>
              </button>
            )}

          </div>
        </div>
      )}
    </>
  );
};

