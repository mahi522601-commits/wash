import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { 
  Sparkles, 
  Menu, 
  X, 
  Phone, 
  Calendar, 
  ArrowRight, 
  ChevronDown, 
  MapPin, 
  Mail, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube 
} from 'lucide-react';

export const Navbar = () => {
  const { pathname } = useLocation();
  const { settings } = useSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services', hasDropdown: true },
    { label: 'Pricing', path: '/pricing' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Locations', path: '/locations' },
    { label: 'Track Order', path: '/track-order' },
  ];

  const primaryPhone = settings?.general?.primaryPhone || '775-329-3115';
  const supportEmail = settings?.general?.supportEmail || 'info@techwash.com';
  const businessAddress = settings?.general?.businessAddress || '657 Twin Lakes Drive, Reno, NV 89523';

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300 pointer-events-none no-print">
      
      {/* ─────────────────────────────────────────────────────────
          1. TOP CONTACT STRIP (Disappears on scroll)
      ───────────────────────────────────────────────────────── */}
      <div className={`transition-all duration-300 pointer-events-auto bg-[#1F2937] text-white border-b border-[#374151] text-[11px] py-1.5 px-4 sm:px-8 ${
        isScrolled ? 'opacity-0 -translate-y-full pointer-events-none hidden' : 'opacity-100 translate-y-0'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Address & Email */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-white/80">
              <MapPin className="w-3 h-3 text-[#F97316] shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">{businessAddress}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-white/80">
              <Mail className="w-3 h-3 text-[#F97316] shrink-0" />
              <span>{supportEmail}</span>
            </div>
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center gap-3 text-white/80">
            <span className="text-[10px] text-white/60 font-medium hidden sm:inline">Follow Us:</span>
            <div className="flex items-center gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F97316] transition-colors">
                <Facebook className="w-3 h-3" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F97316] transition-colors">
                <Instagram className="w-3 h-3" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F97316] transition-colors">
                <Linkedin className="w-3 h-3" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#F97316] transition-colors">
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. FLOATING WHITE PILL NAVBAR
      ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 mt-2 sm:mt-3">
        <div className={`pointer-events-auto max-w-7xl mx-auto py-2.5 px-4 sm:px-6 rounded-full bg-white text-[#1F2937] shadow-[0_10px_35px_rgba(31,41,55,0.08)] border border-[#FED7AA] transition-all duration-300 flex items-center justify-between gap-4 ${
          isScrolled ? 'shadow-[0_15px_40px_rgba(31,41,55,0.12)]' : ''
        }`}>
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform font-black">
              <Sparkles className="w-4 h-4 fill-current text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black font-display text-base sm:text-lg tracking-tight leading-none text-[#1F2937]">
                TECH <span className="text-[#F97316]">WASH</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#F97316] leading-none mt-0.5">
                LAUNDRY SERVICES
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <div key={link.path} className="relative">
                  <Link
                    to={link.path}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      isActive
                        ? 'text-[#F97316] bg-[#FFF7ED]'
                        : 'text-[#1F2937] hover:text-[#F97316] hover:bg-[#FFF7ED]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.hasDropdown && <ChevronDown className="w-3 h-3 text-[#1F2937]/40" />}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Right Call & Booking Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Phone Button */}
            <a
              href={`tel:${primaryPhone.replace(/[^0-9]/g, '')}`}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#1F2937] border border-[#FED7AA] text-xs font-bold transition-all"
              title={`Call ${primaryPhone}`}
            >
              <Phone className="w-3.5 h-3.5 text-[#F97316]" />
              <span>{primaryPhone}</span>
            </a>

            {/* Book Pickup Primary Button */}
            <Link to="/book-pickup">
              <button
                type="button"
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span>Book Pickup</span>
              </button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#1F2937] hover:bg-[#FFF7ED] lg:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. MOBILE DROPDOWN DRAWER
      ───────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto lg:hidden px-4 mt-2">
          <div className="max-w-md mx-auto rounded-3xl bg-white p-5 shadow-2xl border border-[#FED7AA] space-y-3 animate-fade-in text-xs">
            <div className="divide-y divide-[#E5E7EB]">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center justify-between py-2.5 font-bold text-[#1F2937] hover:text-[#F97316]"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#1F2937]/40" />
                </Link>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link to="/book-pickup" className="w-full">
                <button className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Doorstep Pickup</span>
                </button>
              </Link>
              <a href={`tel:${primaryPhone.replace(/[^0-9]/g, '')}`} className="w-full">
                <button className="w-full py-2 rounded-xl bg-[#FFF7ED] text-[#1F2937] border border-[#FED7AA] font-bold text-xs flex items-center justify-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Call Hotline: {primaryPhone}</span>
                </button>
              </a>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
