import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { offerService } from '../../services/offerService';
import { useToast } from '../../context/ToastContext';
import { 
  Sparkles, 
  Tag, 
  Copy, 
  Check, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  Percent, 
  Gift 
} from 'lucide-react';

export const FloatingOffersWidget = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const popupRef = useRef(null);

  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showFirstVisitTeaser, setShowFirstVisitTeaser] = useState(false);

  // Load active offers from CMS
  useEffect(() => {
    offerService.getActiveOffers().then((list) => {
      if (list && list.length > 0) {
        setOffers(list);
      }
    });

    // Check first-visit teaser in session storage
    try {
      const hasSeenTeaser = sessionStorage.getItem('techwash_seen_offer_teaser');
      if (!hasSeenTeaser) {
        const timer = setTimeout(() => {
          setShowFirstVisitTeaser(true);
          sessionStorage.setItem('techwash_seen_offer_teaser', 'true');
          setTimeout(() => setShowFirstVisitTeaser(false), 4500);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  // Close popup when clicking outside (Without darkening or blurring the website)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        // If click is not inside popup or trigger button
        const trigger = document.getElementById('techwash-offers-floating-trigger');
        if (trigger && trigger.contains(event.target)) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (offers.length === 0) return null;

  const currentOffer = offers[currentIndex] || offers[0];

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Promo Code Copied!', `Applied ${code} to your clipboard.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleBookNow = (offer) => {
    setIsOpen(false);
    const serviceParam = offer.associatedServiceSlug ? `&service=${offer.associatedServiceSlug}` : '';
    navigate(`/book-pickup?coupon=${offer.code}${serviceParam}`);
  };

  const handleNextOffer = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const handlePrevOffer = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          1. FLOATING OFFERS TAB / TRIGGER (Right Mid-Viewport)
      ───────────────────────────────────────────────────────── */}
      <div
        id="techwash-offers-floating-trigger"
        className="fixed right-3 sm:right-6 top-[40%] sm:top-[42%] z-40 flex items-center pointer-events-auto no-print"
      >
        
        {/* First-Visit Expanding Teaser Pill */}
        {showFirstVisitTeaser && !isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="mr-2 p-2.5 rounded-2xl bg-[#1F2937] text-white border border-[#F97316]/50 shadow-2xl animate-fade-in flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4 text-[#F97316] animate-pulse" />
            <div className="text-[11px] leading-tight">
              <span className="font-black text-[#F97316] block">{currentOffer.discountValue}</span>
              <span className="text-slate-300 text-[10px]">{currentOffer.title}</span>
            </div>
          </div>
        )}

        {/* Floating Brand Tab */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-2.5 sm:px-3.5 sm:py-3 rounded-2xl sm:rounded-full bg-[#1F2937] text-white border-2 border-[#F97316] shadow-[0_10px_35px_rgba(249,115,22,0.35)] hover:shadow-[0_15px_45px_rgba(249,115,22,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 animate-nudge-periodic"
          title="View Exclusive Special Offers & Promo Codes"
          aria-label="View Special Offers"
        >
          {/* Ambient Glow Aura */}
          <span className="absolute -inset-1 rounded-2xl sm:rounded-full bg-orange-400/25 animate-pulse pointer-events-none" />

          {/* Active Promo Notification Dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F97316] border-2 border-[#1F2937] rounded-full shadow-sm animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F97316] border-2 border-[#1F2937] rounded-full shadow-sm" />

          <div className="w-7 h-7 rounded-xl bg-[#F97316] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:rotate-12 transition-transform">
            <Tag className="w-4 h-4 text-white fill-current" />
          </div>

          <div className="hidden sm:block text-left pr-1">
            <div className="text-xs font-black font-display tracking-wider text-white flex items-center gap-1 leading-none">
              <span>OFFERS</span>
              <Sparkles className="w-3 h-3 text-[#F97316]" />
            </div>
            <span className="text-[10px] font-bold text-[#F97316] leading-none block mt-1">
              Save More
            </span>
          </div>
        </button>

      </div>

      {/* ─────────────────────────────────────────────────────────
          2. EXPANDABLE OFFER POPUP (Compact Floating Card)
          NO full-screen overlay, NO backdrop blur, NO page lock
      ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={popupRef}
          className="fixed z-50 right-3 sm:right-6 top-[32%] sm:top-[35%] w-[calc(100%-24px)] sm:w-[360px] max-w-[380px] bg-white rounded-[28px] shadow-[0_25px_70px_-15px_rgba(31,41,55,0.3)] border-2 border-[#FED7AA] overflow-hidden animate-fade-in no-print"
          role="dialog"
          aria-label="Tech Wash Special Offers"
        >
          
          {/* Header Banner */}
          <div className="px-4 py-3 bg-[#1F2937] text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#F97316] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-current text-white" />
              </div>
              <span className="text-xs font-black font-display tracking-tight text-white uppercase">
                Special Offers & Promos
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
              aria-label="Close offers popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Offer Content Body */}
          <div className="p-5 space-y-4 bg-white text-xs">
            
            {/* Top Badges & Carousel Counter */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] text-[10px] font-black tracking-wider uppercase">
                {currentOffer.badgeText || '✨ LIMITED TIME'}
              </span>

              {offers.length > 1 && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400">
                  <span>{currentIndex + 1} of {offers.length}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={handlePrevOffer}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      aria-label="Previous offer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextOffer}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      aria-label="Next offer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Offer Title & Big Discount Headline */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                {currentOffer.title}
              </h3>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#F97316] mt-0.5">
                {currentOffer.discountValue}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                {currentOffer.shortDescription}
              </p>
            </div>

            {/* Meta Information Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
              <span className="font-semibold">Min. Order: <strong className="text-slate-900">{currentOffer.minOrder}</strong></span>
              <span className="flex items-center gap-1 text-[#F97316] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentOffer.validTill}</span>
              </span>
            </div>

            {/* Interactive Promo Code Box with Real Copy Button */}
            <div className="p-2.5 rounded-2xl bg-[#FFF7ED] border-2 border-dashed border-[#FED7AA] flex items-center justify-between gap-2">
              <div className="pl-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">
                  Coupon Code
                </span>
                <span className="font-mono font-black text-sm text-[#1F2937] tracking-wider mt-0.5 block leading-tight">
                  {currentOffer.code}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(currentOffer.code)}
                className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                  copiedCode === currentOffer.code
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#F97316] hover:bg-[#EA580C] text-white hover:scale-105 active:scale-95'
                }`}
              >
                {copiedCode === currentOffer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            {/* Primary CTA: Book Now */}
            <button
              type="button"
              onClick={() => handleBookNow(currentOffer)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Book With This Offer</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Footer Navigation Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                {offers.map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                      currentIndex === idx ? 'w-4 bg-[#F97316]' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              <Link
                to="/offers"
                onClick={() => setIsOpen(false)}
                className="font-bold text-[#F97316] hover:underline flex items-center gap-1"
              >
                <span>View All Offers ({offers.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

          </div>

        </div>
      )}
    </>
  );
};
