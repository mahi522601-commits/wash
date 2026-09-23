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
  const primaryPhone = settings?.general?.primaryPhone || '+91 89777 69866';
  const supportEmail = settings?.general?.supportEmail || 'support@techwash.in';
  const hours = settings?.workingHours?.weekdays || '8:00 AM - 9:00 PM (Daily)';

  const quickLinks = [
    { label: 'All Services', path: '/services' },
    { label: 'Pricing & Calculator', path: '/pricing' },
    { label: '6-Stage Process', path: '/how-it-works' },
    { label: 'Service Areas', path: '/areas' },
    { label: 'Track Order Status', path: '/track-order' },
    { label: 'Book Doorstep Pickup', path: '/book-pickup' },
    { label: 'Store Branches', path: '/locations' },
    { label: 'Frequently Asked Questions', path: '/faq' },
  ];

  const serviceCategories = [
    { label: 'Dry Cleaning', path: '/services/dry-cleaning' },
    { label: 'Steam Ironing', path: '/services/ironing' },
    { label: 'Wash & Iron (Per-Kg)', path: '/services/wash-and-iron' },
    { label: 'Wash & Fold (Per-Kg)', path: '/services/wash-and-fold' },
    { label: 'Saree Rolling & Polishing', path: '/services/saree-rolling' },
    { label: 'Sneaker & Shoe Care', path: '/services/shoe-washing' },
    { label: 'Curtain & Carpet Care', path: '/services/curtain-washing' },
  ];

  return (
    <footer className="bg-[#1F2937] text-white relative overflow-hidden pt-16 pb-28 md:pb-16 border-t border-slate-700/60 shadow-2xl">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-14">
        
        {/* TOP: Call to Action Banner */}
        <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Doorstep White-Glove Care</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
              Ready for Pristine Garment Care?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
              Book a doorstep pickup in 60 seconds. Our executive arrives at your preferred time slot with digital tracking tags and zero hassle.
            </p>
          </div>

          <Link
            to="/book-pickup"
            className="px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-sm shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-105 transition-all shrink-0 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Schedule Doorstep Pickup</span>
          </Link>
        </div>

        {/* MIDDLE: 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pt-4">
          
          {/* Col 1: Brand & Identity (Col 4) */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1 shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:scale-105 transition-transform overflow-hidden">
                <img 
                  src="/techwashlogo.webp" 
                  alt="Tech Wash" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div>
                <span className="font-black font-display text-2xl tracking-tight text-white block leading-none">
                  TECH<span className="text-[#F97316]">WASH</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FED7AA]">
                  Laundry Services
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {tagline}. European hydro-clean chemistry, 100% demineralized RO soft water cycles, and guaranteed zero-color-bleed textile preservation.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-[#F97316] font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F97316]" />
                <span>10-Point QC Guarantee</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>45-Min Express Slots</span>
            </div>
          </div>

          {/* Col 2: Services (Col 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316] font-display">
              Care Offerings
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {serviceCategories.map((s, idx) => (
                <li key={idx}>
                  <Link to={s.path} className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 group">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#F97316]/70 group-hover:text-[#F97316] transition-colors" />
                    <span>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation (Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316] font-display">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {quickLinks.map((l, idx) => (
                <li key={idx}>
                  <Link to={l.path} className="hover:text-[#F97316] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Hub (Col 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316] font-display">
              Concierge Contact
            </h4>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[#F97316] shrink-0 border border-slate-700">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <a href={`tel:${primaryPhone.replace(/[^0-9]/g, '')}`} className="hover:text-[#F97316] font-bold text-sm text-white">
                  {primaryPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[#F97316] shrink-0 border border-slate-700">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <a href={`mailto:${supportEmail}`} className="hover:text-[#F97316]">
                  {supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[#F97316] shrink-0 border border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span>{hours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM: Massive Editorial Typography Statement & Copyright */}
        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-slate-700 uppercase select-none">
            CLEAN. CARE. CONFIDENCE.
          </div>

          <div className="flex items-center gap-6 flex-wrap text-[11px]">
            <span>© {new Date().getFullYear()} {businessName}. All rights reserved.</span>
            <Link to="/privacy-policy" className="hover:text-[#F97316]">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-[#F97316]">Terms</Link>
            <Link to="/refund-policy" className="hover:text-[#F97316]">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
