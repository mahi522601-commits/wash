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

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Services', path: '/services', icon: Layers },
    // Middle elevated BOOK button handled separately
    { label: 'Orders', path: '/track-order', icon: ShoppingBag },
  ];

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
              pathname === '/' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          {/* Button 2: Services */}
          <Link
            to="/services"
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              pathname.startsWith('/services') ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span>Services</span>
          </Link>

          {/* Button 3: MIDDLE ELEVATED CIRCULAR BOOK BUTTON */}
          <div className="relative flex justify-center -top-5">
            <Link
              to="/book-pickup"
              className="w-14 h-14 rounded-full bg-[#F97316] text-white flex flex-col items-center justify-center shadow-glow-orange border-4 border-white transform active:scale-95 hover:scale-105 transition-all"
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
              pathname === '/track-order' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span>Orders</span>
          </Link>

          {/* Button 5: More Drawer Trigger */}
          <button
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-colors ${
              moreDrawerOpen ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>

        </div>
      </nav>

      {/* MORE ACTIONS BOTTOM SHEET DRAWER */}
      {moreDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 space-y-4 border-t border-brand-200 shadow-2xl max-h-[80vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold uppercase tracking-wider text-navy-800 font-display">
                Quick Navigation & Concierge
              </span>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/pricing"
                className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col gap-1 text-xs font-bold text-slate-800"
              >
                <Compass className="w-4 h-4 text-brand-600" />
                <span>Rate Card & Rates</span>
              </Link>

              <Link
                to="/how-it-works"
                className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col gap-1 text-xs font-bold text-slate-800"
              >
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                <span>6-Stage Process</span>
              </Link>

              <Link
                to="/locations"
                className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col gap-1 text-xs font-bold text-slate-800"
              >
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Store Branches</span>
              </Link>

              <Link
                to="/faq"
                className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col gap-1 text-xs font-bold text-slate-800"
              >
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span>Help & FAQs</span>
              </Link>
            </div>

            {onOpenAssistant && (
              <button
                onClick={() => {
                  setMoreDrawerOpen(false);
                  onOpenAssistant();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Open AI Concierge Assistant</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
