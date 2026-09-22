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
      badge: '✦ PREMIUM LAUNDRY & DRY CLEANING',
      subtitle: 'Advanced cleaning technology, premium detergents, and expert care for fabrics you love.',
      ctaPrimaryText: 'Book Pickup Now',
      ctaPrimaryUrl: '/book-pickup',
      ctaSecondaryText: 'Explore Services',
      ctaSecondaryUrl: '/services',
      desktopImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1400&q=85',
    }
  ];

  const currentSlide = activeSlides[0];

  return (
    <div className="relative bg-gradient-to-b from-[#FFF7ED] via-[#FFF7ED]/80 to-white text-[#1F2937] pt-32 sm:pt-36 lg:pt-40 pb-16 lg:pb-24 border-b border-[#FED7AA]/60 overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────
          1. SUBTLE AMBIENT ATMOSPHERIC GLOWS (No Stray Circles)
      ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-[90px]" />
        <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-[#FED7AA]/30 rounded-full blur-[80px]" />
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. MAIN 2-COLUMN HERO CONTAINER
      ───────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 space-y-16 lg:space-y-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ─────────────────────────────────────────────────────
              LEFT COLUMN: EDITORIAL TYPOGRAPHY & CTAs (Cols 1-6)
          ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            
            {/* Eyebrow Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FED7AA] text-[#F97316] text-xs font-bold uppercase tracking-wider shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 fill-current text-[#F97316]" />
              <span>{currentSlide.badge || '✦ PREMIUM LAUNDRY & DRY CLEANING'}</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-black font-display tracking-tight text-[#1F2937] leading-[1.1]">
              {currentSlide.title || 'Laundry Care,'} <br />
              <span className="text-[#F97316]">
                {currentSlide.highlightedWord || 'Reimagined.'}
              </span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed font-normal">
              {currentSlide.subtitle || 'Advanced cleaning technology, premium detergents, and expert care for fabrics you love.'}
            </p>

            {/* Dual Balanced CTAs + Connect With Us */}
            <div className="pt-2 flex items-center gap-3 sm:gap-4 flex-wrap">
              <Link to={currentSlide.ctaPrimaryUrl || '/book-pickup'}>
                <button
                  type="button"
                  className="px-7 sm:px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-white" />
                  <span>{currentSlide.ctaPrimaryText || 'Book Pickup Now'}</span>
                </button>
              </Link>

              <Link to={currentSlide.ctaSecondaryUrl || '/services'}>
                <button
                  type="button"
                  className="px-6 sm:px-7 py-4 rounded-full bg-white hover:bg-[#FFF7ED] text-[#1F2937] border-2 border-[#FED7AA] hover:border-[#F97316] hover:text-[#F97316] font-bold text-sm sm:text-base flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group shadow-sm cursor-pointer"
                >
                  <span>{currentSlide.ctaSecondaryText || 'Explore Services'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <a 
                href="https://wa.me/918977769866?text=Hello%20Tech%20Wash%2C%20I%20would%20like%20to%20connect%20with%20your%20fabric%20care%20specialist."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-6 py-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300 hover:border-emerald-500 font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
                title="Direct WhatsApp & Specialist Support"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Connect With Us</span>
              </a>
            </div>

            {/* Trust Badges Row */}
            <div className="pt-6 border-t border-[#FED7AA]/60 grid grid-cols-3 gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-[#FED7AA] flex items-center justify-center text-[#F97316] shrink-0 font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1F2937] text-xs leading-tight">10-Point QC</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Dual Inspection</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-[#FED7AA] flex items-center justify-center text-[#F97316] shrink-0 font-bold shadow-xs">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1F2937] text-xs leading-tight">RO Soft Water</div>
                  <div className="text-[10px] text-slate-500 leading-tight">Gentle on Fibers</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-[#FED7AA] flex items-center justify-center text-[#F97316] shrink-0 font-bold shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-[#1F2937] text-xs leading-tight">Express Pickup</div>
                  <div className="text-[10px] text-slate-500 leading-tight">45-Min Slots</div>
                </div>
              </div>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              RIGHT COLUMN: SEAMLESS CUT-OUT VISUAL & ANIMATED ORBIT CIRCLE (Cols 7-12)
          ───────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Animated High-Tech Glowing Energy Orbit Circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Outer Orbit Track */}
              <div className="w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] lg:w-[540px] lg:h-[540px] rounded-full border-2 border-dashed border-[#F97316]/30 animate-orbit-spin-slow flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_#F97316] -top-2 absolute" />
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#38BDF8] -bottom-1.5 absolute" />
              </div>

              {/* Inner Counter-Rotating Orbit Track */}
              <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[430px] lg:h-[430px] rounded-full border border-dashed border-[#FED7AA]/60 animate-orbit-spin-reverse flex items-center justify-center" />

              {/* Soft Ambient Radial Backlight Glow */}
              <div className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-gradient-to-tr from-[#FED7AA]/60 via-[#F97316]/20 to-transparent rounded-full blur-3xl scale-95" />
            </div>

            {/* Seamless Cut-Out Composition */}
            <div className="relative w-full max-w-lg lg:max-w-none flex items-center justify-center z-10">
              <img
                src="/techwash_hero_cutout.webp"
                onError={(e) => {
                  e.target.src = '/techwashh.webp';
                }}
                alt="Tech Wash Happy Family with Clean Laundry"
                className="w-full h-auto max-h-[440px] sm:max-h-[500px] lg:max-h-[560px] object-contain select-none filter drop-shadow-[0_20px_35px_rgba(249,115,22,0.18)] drop-shadow-[0_10px_20px_rgba(31,41,55,0.08)] transition-transform duration-700 hover:scale-[1.02]"
              />

              {/* Floating Badge 1: Top-Right Rating */}
              <div className="absolute top-2 sm:top-4 right-0 sm:right-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#FED7AA] text-[#1F2937] shadow-lg flex items-center gap-2 text-xs font-bold animate-float-slow">
                <div className="flex text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>4.9/5 Rating</span>
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• 10k+ Orders</span>
              </div>

              {/* Floating Badge 2: Bottom-Left Advanced Fabric Spa (Replaced Eco Friendly) */}
              <div className="absolute bottom-2 sm:bottom-4 left-0 sm:left-2 p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md text-[#1F2937] shadow-xl border border-[#FED7AA] flex items-center gap-2.5 sm:gap-3 animate-float">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0 border border-[#FED7AA]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F97316] text-[#F97316]" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black font-display text-[#1F2937] leading-none">
                    Next-Gen Fabric Spa
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#F97316] mt-1 leading-none">
                    Demineralized RO Soft Water
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────
            3. FOUR BALANCED STAT CARDS (Updated with 9+ Years & 10k+ Customers)
        ───────────────────────────────────────────────────────── */}
        <div className="pt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#FED7AA] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1F2937] font-display tracking-tight leading-none">
                  9+ Years
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  Experience & Trust
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#FED7AA] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1F2937] font-display tracking-tight leading-none">
                  10k+
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  Happy Customers
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#FED7AA] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1F2937] font-display tracking-tight leading-none">
                  45 Min
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  Express Pickup
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#FED7AA] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Star className="w-6 h-6 fill-[#F97316]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#1F2937] font-display tracking-tight leading-none">
                  5-Star
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  Top Rated Care
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
