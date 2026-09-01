import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { analyticsService } from '../../services/analyticsService';
import { Phone, MessageSquare, Calendar } from 'lucide-react';

export const StickyBookingBar = () => {
  const { settings } = useSettings();
  const general = settings?.general || {};
  const phone = general.primaryPhone || '+91 98765 43210';
  const whatsapp = (general.whatsappNumber || phone).replace(/\D/g, '');
  const message = encodeURIComponent(general.whatsappDefaultMessage || 'Hello Tech Wash, I want to book a pickup.');

  const handlePhoneClick = () => {
    analyticsService.trackEvent('phone_click', { source: 'sticky_bar' });
  };

  const handleWhatsAppClick = () => {
    analyticsService.trackEvent('whatsapp_click', { source: 'sticky_bar' });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 py-2 shadow-2xl safe-bottom">
      <div className="flex items-center gap-2">
        <a
          href={`tel:${phone}`}
          onClick={handlePhoneClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200 active:scale-95 transition-transform"
        >
          <Phone className="w-4 h-4 text-brand-600" />
          <span>Call</span>
        </a>

        <a
          href={`https://wa.me/${whatsapp}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200 active:scale-95 transition-transform"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp</span>
        </a>

        <Link
          to="/book-pickup"
          className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-royal-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 active:scale-95 transition-transform"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Pickup</span>
        </Link>
      </div>
    </div>
  );
};

export const WhatsAppFloatingBtn = () => {
  const { settings } = useSettings();
  const website = settings?.website || {};
  const general = settings?.general || {};

  if (!website.floatingWhatsAppEnabled) return null;

  const rawNumber = general.whatsappNumber || general.primaryPhone || '+91 98765 43210';
  const whatsapp = rawNumber.replace(/\D/g, '');
  const message = encodeURIComponent(general.whatsappDefaultMessage || 'Hello Tech Wash, I would like to schedule a premium garment pickup.');

  const handleClick = () => {
    analyticsService.trackEvent('whatsapp_click', { source: 'floating_button' });
  };

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label="Chat on WhatsApp"
      className="fixed bottom-16 sm:bottom-6 right-5 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-luxury hover:scale-110 active:scale-95 transition-all duration-300 group border border-emerald-400/40"
    >
      <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
      <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-luxury whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
        Chat with Tech Wash
      </span>
    </a>
  );
};
