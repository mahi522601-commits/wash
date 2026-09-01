import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { cmsService } from '../../services/cmsService';
import { 
  MessageCircle, 
  Phone, 
  Sparkles, 
  Star 
} from 'lucide-react';

export const FloatingActionHub = ({ onOpenAssistant }) => {
  const { settings } = useSettings();
  const [floatingConfig, setFloatingConfig] = useState(null);

  useEffect(() => {
    cmsService.getItems('floatingActions')
      .then((data) => {
        if (data && data.length > 0) {
          setFloatingConfig(data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const whatsappNumber = settings?.general?.whatsappNumber || '+91 98765 43210';
  const whatsappMsg = settings?.general?.whatsappDefaultMessage || 'Hi Tech Wash, I would like to inquire about laundry & dry cleaning pickup!';
  const primaryPhone = settings?.general?.primaryPhone || '+91 98765 43210';
  const googleReviewUrl = settings?.social?.googleBusiness || 'https://maps.google.com';

  const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
  const cleanPhone = primaryPhone.replace(/[^0-9]/g, '');

  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          1. LEFT SIDE: GOOGLE REVIEW BUTTON
      ───────────────────────────────────────────────────────── */}
      {googleReviewUrl && (
        <div className="fixed left-4 sm:left-6 bottom-[85px] sm:bottom-[90px] z-40 flex items-center pointer-events-auto no-print">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 border border-brand-200 shadow-luxury hover:shadow-xl hover:border-amber-300 hover:scale-105 transition-all duration-300 text-xs font-bold"
            title="Review us on Google"
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] text-slate-700 font-bold hidden sm:inline">Review Us</span>
          </a>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          2. RIGHT SIDE: STACKED FLOATING CONTROLS
          Stack Order (Bottom to Top):
          1. AI Chatbot Trigger (Bottom: 85px mobile / 90px desktop)
          2. WhatsApp Button (Bottom: 150px mobile / 160px desktop)
          3. Phone Call Button (Bottom: 212px mobile / 228px desktop)
      ───────────────────────────────────────────────────────── */}
      <div className="fixed right-4 sm:right-6 bottom-[85px] sm:bottom-[90px] z-40 flex flex-col items-end gap-3 pointer-events-auto no-print">
        
        {/* Direct Call Button (Top of Stack) */}
        <a
          href={`tel:${cleanPhone}`}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-md text-brand-700 border border-brand-200 shadow-luxury flex items-center justify-center hover:bg-brand-50 hover:scale-110 transition-all duration-300 group"
          title={`Call ${primaryPhone}`}
          aria-label="Call concierge"
        >
          <Phone className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform text-[#6D28D9]" />
        </a>

        {/* WhatsApp Button with Glow Ring (Middle of Stack) */}
        <a
          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-12 h-12 sm:w-13 sm:h-13 p-3 rounded-full bg-emerald-500 text-white shadow-luxury hover:bg-emerald-600 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          title="Chat on WhatsApp Concierge"
          aria-label="Chat on WhatsApp"
        >
          <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current relative z-10" />
        </a>

        {/* AI Chatbot Trigger Button (Bottom of Stack: 54px mobile / 58px desktop) */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-gradient-to-tr from-[#1E1B4B] via-[#151336] to-[#6D28D9] text-white border-2 border-[#06B6D4]/50 shadow-[0_10px_30px_rgba(109,40,217,0.4)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          title="Open Tech Wash AI Concierge"
          aria-label="Open Tech Wash AI Concierge"
        >
          {/* Subtle Ambient Glow Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-cyan-400/30 animate-pulse pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center">
            <Sparkles className="w-6 h-6 text-cyan-300 group-hover:rotate-12 transition-transform" />
          </div>

          {/* Active Status Dot */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-sm z-20" />
        </button>

      </div>
    </>
  );
};
