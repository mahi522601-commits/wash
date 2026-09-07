import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { offerService } from '../../services/offerService';
import { useToast } from '../../context/ToastContext';
import { 
  Sparkles, 
  Tag, 
  Copy, 
  Check, 
  ArrowRight, 
  X, 
  Clock 
} from 'lucide-react';

export const FirstVisitOfferModal = () => {
  const navigate = useNavigate();
  const { success } = useToast();

  const [offer, setOffer] = useState(null);
  const [popupConfig, setPopupConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initPopup = async () => {
      const config = await offerService.getPopupConfig();
      setPopupConfig(config);

      if (!config.enabled) return;

      // Check session or daily cooldown
      const sessionKey = 'techwash_popup_shown_session';
      const dayKey = `techwash_popup_shown_${new Date().toISOString().split('T')[0]}`;

      let alreadyShown = false;
      if (config.cooldown === 'session' && sessionStorage.getItem(sessionKey)) {
        alreadyShown = true;
      } else if (config.cooldown === 'daily' && localStorage.getItem(dayKey)) {
        alreadyShown = true;
      }

      if (alreadyShown) return;

      const featuredOffer = await offerService.getFeaturedPopupOffer();
      if (!featuredOffer) return;

      setOffer(featuredOffer);

      // Trigger after ~1 second delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        offerService.trackImpression(featuredOffer.code);
        sessionStorage.setItem(sessionKey, 'true');
        localStorage.setItem(dayKey, 'true');
      }, config.delayMs || 1000);

      return () => clearTimeout(timer);
    };

    initPopup();
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !offer) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (offer?.code) {
      offerService.trackClose(offer.code);
    }
  };

  const handleCopyCode = () => {
    if (!offer?.code) return;
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    offerService.trackCopy(offer.code);
    success('Promo Code Copied!', `Applied ${offer.code} to your clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookNow = () => {
    handleClose();
    if (offer?.code) {
      offerService.trackBooking(offer.code);
    }
    const serviceParam = offer.associatedServiceSlug ? `&service=${offer.associatedServiceSlug}` : '';
    navigate(`/book-pickup?coupon=${offer.code}${serviceParam}`);
  };

  return (
    /* SUBTLE BACKDROP (rgba(15, 10, 40, 0.4)) — Website behind remains visible */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
      aria-label="First Order Special Offer"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      
      {/* ─────────────────────────────────────────────────────────
          1:1 TRUE SQUARE CAMPAIGN CARD (420px × 420px)
      ───────────────────────────────────────────────────────── */}
      <div
        className="relative w-[calc(100vw-32px)] max-w-[390px] sm:max-w-[420px] aspect-square rounded-[36px] bg-[#1F2937] text-white p-5 sm:p-7 shadow-[0_25px_80px_-15px_rgba(31,41,55,0.6)] border border-[#FED7AA]/40 flex flex-col justify-between overflow-hidden animate-scale-up"
      >
        
        {/* Ambient Decorative Light Rings */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-[#F97316]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#F97316]/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. TOP BAR (BADGE + CLOSE BUTTON) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#F97316] fill-current animate-pulse" />
            <span>{offer.badgeText || '✦ LIMITED OFFER'}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/15"
            aria-label="Close offer popup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 2. CENTER CONTENT (TITLE + BIG DISCOUNT + SHORT BENEFIT) */}
        <div className="relative z-10 text-center space-y-1 sm:space-y-1.5 my-auto">
          <span className="text-[11px] sm:text-xs font-bold text-[#FED7AA] uppercase tracking-widest block">
            {offer.title || 'FIRST ORDER SPECIAL'}
          </span>

          <div className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[#F97316] drop-shadow-[0_0_20px_rgba(249,115,22,0.4)] leading-none py-0.5">
            {offer.discountValue || '20% OFF'}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-300 max-w-[260px] mx-auto leading-tight font-normal">
            {offer.shortDescription || 'Premium garment care for your first booking.'}
          </p>

          {/* Promo Code Copy Box */}
          <div className="pt-1.5 max-w-[240px] mx-auto">
            <div className="p-1.5 sm:p-2 rounded-2xl bg-black/40 border border-dashed border-[#FED7AA]/50 backdrop-blur-md flex items-center justify-between gap-2 shadow-inner">
              <span className="font-mono font-black text-xs sm:text-sm text-white tracking-widest pl-2">
                {offer.code}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                className={`py-1 px-3 rounded-xl font-bold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#F97316] hover:bg-[#EA580C] text-white active:scale-95'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>

            <span className="text-[9px] text-slate-400 block mt-1">
              {offer.validTill || 'Valid on first order'} • Min. order {offer.minOrder}
            </span>
          </div>
        </div>

        {/* 3. BOTTOM ACTIONS (BOOK NOW + VIEW ALL OFFERS) */}
        <div className="relative z-10 space-y-1.5 text-center">
          <button
            type="button"
            onClick={handleBookNow}
            className="w-full py-2.5 sm:py-3 px-5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(249,115,22,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span>BOOK NOW</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>

          <Link
            to="/offers"
            onClick={handleClose}
            className="inline-block text-[10px] sm:text-[11px] text-[#FED7AA] hover:text-white font-semibold underline underline-offset-2 transition-colors"
          >
            View all offers →
          </Link>
        </div>

      </div>

    </div>
  );
};
