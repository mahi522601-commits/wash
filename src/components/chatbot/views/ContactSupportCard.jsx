import React from 'react';
import { WhatsAppLogo, PhoneCallLogo } from '../../ui/BrandIcons';
import { Mail, Sparkles, ArrowRight } from 'lucide-react';

export const ContactSupportCard = ({ contacts = {} }) => {
  const phone = contacts.phone || '+91 63048 45567';
  const whatsapp = contacts.whatsapp || '+91 63048 45567';
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in text-xs">
      
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center border border-[#FED7AA] overflow-hidden">
          <img 
            src="/techwashlogo.webp" 
            alt="Tech Wash" 
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1F2937]">Tech Wash Fabric Concierge</h4>
          <span className="text-[10px] text-slate-400">Direct human assistance & consultations</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-snug">
        Need bespoke stain advice, bulk commercial pricing, or immediate schedule adjustments? Connect with us directly:
      </p>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hi Tech Wash, I would like to speak with a fabric care specialist.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
        >
          <WhatsAppLogo className="w-4 h-4 fill-current text-white" />
          <span>WhatsApp Care</span>
        </a>

        <a
          href={`tel:${cleanPhone}`}
          className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
        >
          <PhoneCallLogo className="w-4 h-4 fill-current text-white" />
          <span>Call Hotline</span>
        </a>
      </div>

    </div>
  );
};
