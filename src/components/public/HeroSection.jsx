import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Droplets,
  Calendar,
  Truck,
  Leaf,
  Users,
  Award,
  Star,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const HeroSection = ({ slides = [] }) => {
  const { settings } = useSettings();

  // Fallback initial slide if CMS is fresh
  const activeSlides = slides.length > 0 ? slides.filter(s => s.active !== false) : [
    {
      title: 'Laundry Care,',
      highlightedWord: 'Reimagined.',
      badge: '✨ PREMIUM LAUNDRY & DRY CLEANING',
      subtitle: 'Advanced cleaning technology, premium detergents, and expert care for fabrics you love.',
      ctaPrimaryText: 'Book Pickup Now',
      ctaPrimaryUrl: '/book-pickup',
      ctaSecondaryText: 'Explore Services',
      ctaSecondaryUrl: '/services',
      desktopImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1400&q=85',
      focalX: 50,
      focalY: 45,
    }
  ];

  const currentSlide = activeSlides[0];

  const businessAddress = settings?.general?.businessAddress || '657 Twin Lakes Drive, Reno, NV 89523';
  const supportEmail = settings?.general?.supportEmail || 'info@techwash.com';
  const primaryPhone = settings?.general?.primaryPhone || '775-329-3115';

  return (
    <div className="relative bg-gradient-to-br from-[#18153A] via-[#3B1578] to-[#5B21B6] text-white overflow-hidden pt-28 sm:pt-32 pb-0">
      
      {/* ─────────────────────────────────────────────────────────
          1. BACKGROUND AMBIENT GLOWS & BUBBLES
      ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform">
        {/* Soft radial atmospheric glows */}
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-[#6D28D9]/25 rounded-full blur-[60px]" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#06B6D4]/15 rounded-full blur-[60px]" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#7C3AED]/20 rounded-full blur-[60px]" />

        {/* Ambient floating bubbles / light discs */}
        <div className="absolute top-44 left-12 w-6 h-6 rounded-full bg-white/10 border border-white/20" />
        <div className="absolute top-72 left-8 w-8 h-8 rounded-full bg-white/10 border border-white/20" />
        <div className="absolute top-96 left-28 w-4 h-4 rounded-full bg-cyan-400/25" />
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. MAIN HERO CONTAINER (LEFT TEXT + RIGHT CUT-OUT IMAGE)
      ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center min-h-[580px] lg:min-h-[640px]">
          
          {/* ─────────────────────────────────────────────────────
              LEFT COLUMN: EDITORIAL TYPOGRAPHY & CTAs (Cols 1-6)
          ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left z-20 pt-4 lg:pt-0">
            
            {/* Eyebrow Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/25 border border-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{currentSlide.badge || '✨ PREMIUM LAUNDRY & DRY CLEANING'}</span>
            </div>

            {/* Massive Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black font-display tracking-tight text-white leading-[1.02] drop-shadow-sm">
              Laundry Care, <br />
              <span className="text-[#00F0FF] drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                {currentSlide.highlightedWord || 'Reimagined.'}
              </span>
            </h1>

            {/* Concise Supporting Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-purple-100/90 max-w-lg font-normal leading-relaxed">
              {currentSlide.subtitle || 'Advanced cleaning technology, premium detergents, and expert care for fabrics you love.'}
            </p>

            {/* Dual CTAs */}
            <div className="pt-1 flex items-center gap-3 sm:gap-4 flex-wrap">
              <Link to={currentSlide.ctaPrimaryUrl || '/book-pickup'}>
                <button
                  type="button"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-[#1E1B4B] font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:shadow-[0_15px_35px_rgba(255,255,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group"
                >
                  <Calendar className="w-4 h-4 text-[#6D28D9]" />
                  <span>{currentSlide.ctaPrimaryText || 'Book Pickup Now'}</span>
                </button>
              </Link>

              <Link to={currentSlide.ctaSecondaryUrl || '/services'}>
                <button
                  type="button"
                  className="px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/40 font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group"
                >
                  <span>{currentSlide.ctaSecondaryText || 'Explore Services'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* 3 Compact Trust Metrics */}
            <div className="pt-6 sm:pt-8 flex items-center gap-4 sm:gap-6 text-xs text-purple-200/90 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">10-Point QC</div>
                  <div className="text-[10px] text-purple-200">Dual Inspection</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">RO Soft Water</div>
                  <div className="text-[10px] text-purple-200">Gentle on Fabrics</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Express Pickup</div>
                  <div className="text-[10px] text-purple-200">45-Min Slots</div>
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              RIGHT COLUMN: ORGANIC CUT-OUT IMAGE & FLOWING SEPARATOR (Cols 7-12)
          ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 relative w-full h-[400px] sm:h-[500px] lg:h-[620px] flex items-center justify-center lg:justify-end">
            
            {/* SVG DEFINITION FOR ORGANIC S-CURVE CLIP-PATH */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="hero-organic-mask" clipPathUnits="objectBoundingBox">
                  <path d="M 0.28,0 
                           C 0.05,0.22 -0.05,0.48 0.18,0.72 
                           C 0.32,0.86 0.45,0.96 0.65,1 
                           L 1,1 
                           L 1,0 
                           Z" />
                </clipPath>
              </defs>
            </svg>

            {/* ORGANIC CUT-OUT CONTAINER */}
            <div className="relative w-full h-full max-w-[580px] lg:max-w-none flex items-center justify-center">
              
              {/* Layer 1: The Cropped Image with Organic Mask */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden shadow-2xl"
                style={{
                  clipPath: 'url(#hero-organic-mask)',
                  WebkitClipPath: 'url(#hero-organic-mask)'
                }}
              >
                <img
                  src={currentSlide.desktopImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1400&q=85'}
                  alt="Tech Wash High-Tech Modern Laundry Lab"
                  className="w-full h-full object-cover object-center scale-105 hover:scale-110 transition-transform duration-1000 ease-out"
                />
              </div>

              {/* Layer 2: Thick Organic White Flowing Separator Ribbon SVG */}
              <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
              >
                {/* Flowing White Separator Path with Soft Shadow */}
                <path
                  d="M 28,0 
                     C 5,22 -5,48 18,72 
                     C 32,86 45,96 65,100"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="filter drop-shadow-[-6px_0px_12px_rgba(0,0,0,0.35)]"
                />
              </svg>

              {/* Layer 3: Floating Product Badge (100% Eco Hydro-Clean) */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 z-20 p-3.5 sm:p-4 rounded-2xl bg-white text-slate-900 shadow-[0_15px_35px_rgba(0,0,0,0.25)] border border-slate-100 flex items-center gap-3 animate-float pointer-events-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black font-display text-[#1E1B4B] leading-none">
                    100%
                  </div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5 leading-none">
                    Eco Hydro-Clean
                  </div>
                </div>
              </div>

              {/* Layer 4: Right-Side Organic Purple Crescent Swoosh */}
              <div className="hidden lg:block absolute -right-8 inset-y-0 w-32 bg-gradient-to-l from-[#5B21B6] via-[#6D28D9]/80 to-transparent pointer-events-none rounded-l-full" />

            </div>

          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. HERO BOTTOM ORGANIC WHITE WAVE TRANSITION
      ───────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden leading-none z-10 -mt-6 sm:-mt-10 lg:-mt-14">
        <svg 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-24 lg:h-28 text-white preserve-3d"
        >
          <path 
            d="M 0,40 C 320,120 720,0 1440,60 L 1440,120 L 0,120 Z" 
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. FOUR CLEAN WHITE STAT CARDS (Below Wave)
      ───────────────────────────────────────────────────────── */}
      <div className="relative z-20 bg-white pb-12 pt-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            
            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4 group">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-purple-50 text-[#6D28D9] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#6D28D9] group-hover:text-white transition-all shadow-sm">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                  2500+
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Happy Customers
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4 group">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-cyan-50 text-[#06B6D4] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#06B6D4] group-hover:text-white transition-all shadow-sm">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                  10+
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Service Categories
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4 group">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-purple-50 text-[#6D28D9] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#6D28D9] group-hover:text-white transition-all shadow-sm">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                  45 Min
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Express Pickup
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4 group">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
                  5 Star
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Service Rated
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
