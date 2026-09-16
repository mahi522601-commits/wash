import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const DYNAMIC_CARE_STAGES = [
  "Calibrating 100% RO soft water demineralizers...",
  "Pre-spotting with European eco-enzymes...",
  "Purifying single-batch hydrocarbon chambers...",
  "Activating 3D tension steam form finishers...",
  "Finalizing laser quality inspection...",
  "Loading Tech Wash premium experience...",
];

/**
 * Advanced Tech Wash Logo Loading Animation
 * Features multi-orbit energy tracks, specular sheen sweep, sonar water ripples,
 * ascending micro-bubbles, and ambient neon aura.
 */
export const AdvancedLogoLoader = ({
  size = 'lg',
  text = 'Loading Tech Wash...',
  subtext = 'Next-Gen Premium Garment Care',
  fullScreen = false,
  dark = false,
  showProgress = true,
  showDynamicStages = false,
  className = '',
}) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(15);

  // Dynamic status text rotation
  useEffect(() => {
    if (!showDynamicStages) return;
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % DYNAMIC_CARE_STAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [showDynamicStages]);

  // Simulated progress easing (15% -> 98%)
  useEffect(() => {
    if (!showProgress) return;
    const progressTimer = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 96) return 96;
        const jump = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + jump, 96);
      });
    }, 350);
    return () => clearInterval(progressTimer);
  }, [showProgress]);

  // Size configuration
  const sizeMap = {
    sm: {
      outerSize: 'w-20 h-20',
      logoSize: 'w-10 h-10',
      logoImg: 'w-8 h-8',
      fontSize: 'text-xs',
      subFontSize: 'text-[10px]',
      padding: 'p-3',
    },
    md: {
      outerSize: 'w-28 h-28',
      logoSize: 'w-16 h-16',
      logoImg: 'w-12 h-12',
      fontSize: 'text-sm',
      subFontSize: 'text-xs',
      padding: 'p-5',
    },
    lg: {
      outerSize: 'w-40 h-40',
      logoSize: 'w-24 h-24',
      logoImg: 'w-18 h-18',
      fontSize: 'text-base',
      subFontSize: 'text-xs',
      padding: 'p-8',
    },
    xl: {
      outerSize: 'w-52 h-52',
      logoSize: 'w-32 h-32',
      logoImg: 'w-24 h-24',
      fontSize: 'text-lg',
      subFontSize: 'text-sm',
      padding: 'p-10',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.lg;

  const content = (
    <div className={`flex flex-col items-center justify-center select-none text-center ${currentSize.padding} ${className}`}>
      
      {/* ─────────────────────────────────────────────────────────
          ANIMATED LOGO & ORBITAL SHIELD SYSTEM
      ───────────────────────────────────────────────────────── */}
      <div className={`relative ${currentSize.outerSize} flex items-center justify-center`}>
        
        {/* Layer 1: Ambient Pulsing Radial Aura Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F97316]/30 via-amber-500/20 to-purple-600/30 blur-2xl animate-pulse-glow-multi pointer-events-none" />

        {/* Layer 2: Sonar Demineralized Water Ripple Rings */}
        <div className="absolute inset-1 rounded-full border border-[#F97316]/30 animate-ping [animation-duration:3s] pointer-events-none opacity-40" />
        <div className="absolute -inset-2 rounded-full border border-purple-500/20 animate-pulse-ring pointer-events-none" />

        {/* Layer 3: Outer Continuous Orbit Ring (Clockwise) */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#F97316]/40 animate-orbit-spin-slow">
          {/* Orbiting Satellite Energy Spark 1 */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-[#F97316] to-amber-300 shadow-[0_0_12px_#F97316] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          {/* Orbiting Satellite Energy Spark 2 */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_#A855F7]" />
        </div>

        {/* Layer 4: Inner Counter-Rotating Gradient Ring (Counter-Clockwise) */}
        <div className="absolute inset-2.5 rounded-full border-2 border-t-[#F97316] border-r-transparent border-b-purple-500 border-l-transparent animate-orbit-spin-reverse opacity-80" />

        {/* Layer 5: Ascending Micro-Bubbles */}
        <div className="absolute -bottom-2 left-3 w-3 h-3 rounded-full bg-white/70 border border-orange-200/80 shadow-xs animate-bubble-rise-1 pointer-events-none" />
        <div className="absolute -bottom-3 right-4 w-2.5 h-2.5 rounded-full bg-orange-200/70 border border-orange-300/80 shadow-xs animate-bubble-rise-2 pointer-events-none" />
        <div className="absolute -bottom-1 left-1/2 w-2 h-2 rounded-full bg-cyan-200/70 border border-cyan-300/80 shadow-xs animate-bubble-rise-3 pointer-events-none" />

        {/* Layer 6: Central Core Glassmorphic Badge with Tech Wash Logo */}
        <div className={`relative ${currentSize.logoSize} rounded-3xl bg-gradient-to-b ${
          dark 
            ? 'from-slate-900/90 via-slate-950/95 to-slate-900/90 border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.6)]' 
            : 'from-white/95 via-orange-50/90 to-white/95 border-[#FED7AA] shadow-[0_15px_35px_rgba(249,115,22,0.25)]'
        } backdrop-blur-xl border-2 flex items-center justify-center overflow-hidden animate-logo-breathe group`}>
          
          {/* Specular Light Sweep Sheen */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shine-sweep pointer-events-none" />

          {/* Glowing Radial Core Underlay */}
          <div className="absolute inset-0 bg-radial-gradient from-[#F97316]/20 via-transparent to-transparent opacity-70" />

          {/* Tech Wash Official Logo Asset */}
          <img
            src="/techwashlogo.webp"
            alt="Tech Wash"
            className={`${currentSize.logoImg} object-contain filter drop-shadow-md z-10 transition-transform duration-500`}
            loading="eager"
            onError={(e) => {
              // Fallback if image fails to render
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-icon')) {
                const fallback = document.createElement('span');
                fallback.className = 'fallback-icon text-2xl font-black text-[#F97316]';
                fallback.innerText = 'TW';
                parent.appendChild(fallback);
              }
            }}
          />

          {/* Sparkle Pin on Logo Shoulder */}
          <div className="absolute top-1.5 right-1.5 z-20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          TYPOGRAPHY & INTERACTIVE PROGRESS BAR
      ───────────────────────────────────────────────────────── */}
      <div className="mt-5 space-y-2 max-w-xs sm:max-w-sm">
        
        {/* Main Status Label with Shimmer */}
        <div className="flex items-center justify-center gap-1.5">
          <span className={`${currentSize.fontSize} font-black font-display tracking-tight bg-gradient-to-r from-[#EA580C] via-[#F97316] to-purple-600 bg-clip-text text-transparent animate-shimmer-text`}>
            {showDynamicStages ? DYNAMIC_CARE_STAGES[stageIndex] : text}
          </span>
        </div>

        {/* Subtitle / Guarantee Tagline */}
        {subtext && (
          <p className={`${currentSize.subFontSize} ${dark ? 'text-slate-400' : 'text-slate-500'} font-medium tracking-wide`}>
            {subtext}
          </p>
        )}

        {/* Animated High-Tech Gradient Progress Bar */}
        {showProgress && (
          <div className="pt-2 space-y-1.5">
            <div className={`w-44 sm:w-56 h-1.5 mx-auto rounded-full ${dark ? 'bg-slate-800' : 'bg-orange-100'} overflow-hidden relative p-[1px]`}>
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#EA580C] via-[#F97316] to-amber-400 transition-all duration-300 relative"
                style={{ width: `${simulatedProgress}%` }}
              >
                {/* Moving Light Glint */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shine-sweep" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>INITIALIZING LAB</span>
              <span className="font-bold text-[#F97316]">{simulatedProgress}%</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        dark 
          ? 'bg-[#0B0A1C]/90 text-white' 
          : 'bg-white/85 text-slate-900'
      } backdrop-blur-2xl animate-fade-in`}>
        {content}
      </div>
    );
  }

  return content;
};
