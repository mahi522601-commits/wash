import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { cmsService } from '../../services/cmsService';
import { WhatsAppLogo, PhoneCallLogo } from '../ui/BrandIcons';
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
          RIGHT SIDE: NEATLY STACKED FLOATING ACTION CONTROLS
          Stack Order (Bottom to Top):
          1. AI Chatbot Trigger (Bottom)
          2. WhatsApp Button
          3. Phone Call Button
      ───────────────────────────────────────────────────────── */}
      <div className="fixed right-4 sm:right-6 bottom-6 sm:bottom-8 z-40 flex flex-col items-end gap-3 pointer-events-auto no-print">
        
        {/* Direct Call Button (Top of Stack: Phone Dialer Green) */}
        <a
          href={`tel:${cleanPhone}`}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-luxury flex items-center justify-center hover:scale-110 transition-all duration-300 group border-2 border-white/80"
          title={`Call ${primaryPhone}`}
          aria-label="Call concierge"
        >
          <PhoneCallLogo className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white group-hover:rotate-12 transition-transform" />
        </a>

        {/* WhatsApp Button with Glow Ring (Middle of Stack: Official WhatsApp Green) */}
        <a
          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-luxury hover:scale-110 transition-all duration-300 flex items-center justify-center group border-2 border-white/80"
          title="Chat on WhatsApp Concierge"
          aria-label="Chat on WhatsApp"
        >
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
          <WhatsAppLogo className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white relative z-10" />
        </a>

        {/* AI Chatbot Trigger Button (Bottom of Stack: 54px mobile / 58px desktop) */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-[#1F2937] text-white border-2 border-[#F97316] shadow-[0_10px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_15px_35px_rgba(249,115,22,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          title="Open Tech Wash AI Concierge"
          aria-label="Open Tech Wash AI Concierge"
        >
          {/* Subtle Ambient Glow Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-orange-400/30 animate-pulse pointer-events-none" />
          
          <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Active Status Dot */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-[#F97316] border-2 border-white rounded-full shadow-sm z-20" />
        </button>

      </div>
    </>
  );
};
