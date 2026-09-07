import React from 'react';
import { MessageCircle, Phone, Mail, Sparkles, ArrowRight } from 'lucide-react';

export const ContactSupportCard = ({ contacts = {} }) => {
  const phone = contacts.phone || '+91 98765 43210';
  const whatsapp = contacts.whatsapp || '+91 98765 43210';
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in text-xs">
      
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-[#F97316] flex items-center justify-center text-white">
          <Sparkles className="w-3.5 h-3.5 fill-current text-white" />
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
          className="p-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>WhatsApp Care</span>
        </a>

        <a
          href={`tel:${cleanPhone}`}
          className="p-2.5 rounded-xl bg-[#1F2937] hover:bg-[#F97316] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Hotline</span>
        </a>
      </div>

    </div>
  );
};
