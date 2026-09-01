import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Heart
} from 'lucide-react';

export const Footer = () => {
  const { settings } = useSettings();

  const businessName = settings?.general?.businessName || 'Tech Wash Laundry Services';
  const tagline = settings?.general?.tagline || 'Next-Generation Premium Garment Care';
  const primaryPhone = settings?.general?.primaryPhone || '+91 98765 43210';
  const supportEmail = settings?.general?.supportEmail || 'support@techwash.in';
  const hours = settings?.workingHours?.weekdays || '8:00 AM - 9:00 PM (Daily)';

  const quickLinks = [
    { label: 'All Services', path: '/services' },
    { label: 'Pricing & Calculator', path: '/pricing' },
    { label: '6-Stage Process', path: '/how-it-works' },
    { label: 'Track Order Status', path: '/track-order' },
    { label: 'Book Doorstep Pickup', path: '/book-pickup' },
    { label: 'Store Branches', path: '/locations' },
    { label: 'Frequently Asked Questions', path: '/faq' },
  ];

  const serviceCategories = [
    { label: 'Premium Dry Cleaning', path: '/services/premium-dry-cleaning' },
    { label: 'Steam Ironing & Form Press', path: '/services/steam-ironing-and-form-press' },
    { label: 'RO Soft Water Laundry', path: '/services/ro-soft-water-laundry' },
    { label: 'Saree Rolling & Polish', path: '/services/saree-rolling-and-polish' },
    { label: 'Designer Footwear & Leather Spa', path: '/services/shoe-spa-and-leather-care' },
  ];

  return (
    <footer className="bg-[#151336] text-white relative overflow-hidden pt-16 pb-28 md:pb-16 border-t border-[#3B0764]/60 shadow-2xl">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6D28D9]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#06B6D4]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">
        
        {/* TOP: Call to Action Banner */}
        <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-r from-[#241E5E] via-[#3B0764] to-[#1E1B4B] border border-[#6D28D9]/40 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-[#22D3EE] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Doorstep White-Glove Care</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
              Ready for Pristine Garment Care?
            </h3>
            <p className="text-xs sm:text-sm text-[#DDD6FE] max-w-xl font-normal leading-relaxed">
              Book a doorstep pickup in 60 seconds. Our executive arrives at your preferred time slot with digital tracking tags and zero hassle.
            </p>
          </div>

          <Link
            to="/book-pickup"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] text-[#0C0A24] font-extrabold text-sm shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:scale-105 transition-all shrink-0 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-[#0C0A24]" />
            <span>Schedule Doorstep Pickup</span>
          </Link>
        </div>

        {/* MIDDLE: 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pt-4">
          
          {/* Col 1: Brand & Identity (Col 4) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D28D9] via-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_20px_rgba(109,40,217,0.5)] group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 fill-current text-cyan-200" />
              </div>
              <div>
                <span className="font-black font-display text-2xl tracking-tight text-white block leading-none">
                  TECH<span className="text-[#22D3EE]">WASH</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A78BFA]">
                  Laundry Services
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#C4B5FD] leading-relaxed font-normal">
              {tagline}. European hydro-clean chemistry, 100% demineralized RO soft water cycles, and guaranteed zero-color-bleed textile preservation.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-[#22D3EE] font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
                <span>10-Point QC Guarantee</span>
              </span>
              <span className="text-[#6D28D9]">•</span>
              <span>45-Min Express Slots</span>
            </div>
          </div>

          {/* Col 2: Services (Col 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] font-display">
              Care Offerings
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DDD6FE]">
              {serviceCategories.map((s, idx) => (
                <li key={idx}>
                  <Link to={s.path} className="hover:text-[#22D3EE] transition-colors flex items-center gap-1.5 group">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#8B5CF6] group-hover:text-[#22D3EE] transition-colors" />
                    <span>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation (Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] font-display">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DDD6FE]">
              {quickLinks.map((l, idx) => (
                <li key={idx}>
                  <Link to={l.path} className="hover:text-[#22D3EE] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Hub (Col 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] font-display">
              Concierge Contact
            </h4>
            <div className="space-y-3 text-xs text-[#DDD6FE]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#241E5E] flex items-center justify-center text-[#22D3EE] shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <a href={`tel:${primaryPhone.replace(/[^0-9]/g, '')}`} className="hover:text-white font-bold text-sm text-white">
                  {primaryPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#241E5E] flex items-center justify-center text-[#22D3EE] shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <a href={`mailto:${supportEmail}`} className="hover:text-white">
                  {supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#241E5E] flex items-center justify-center text-[#22D3EE] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>{hours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM: Massive Editorial Typography Statement & Copyright */}
        <div className="pt-10 border-t border-[#241E5E] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A78BFA]">
          <div className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-[#3B0764] uppercase select-none">
            CLEAN. CARE. CONFIDENCE.
          </div>

          <div className="flex items-center gap-6 flex-wrap text-[11px]">
            <span>© {new Date().getFullYear()} {businessName}. All rights reserved.</span>
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-white">Terms</Link>
            <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
