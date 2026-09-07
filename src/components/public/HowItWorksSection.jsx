import React, { useState, useEffect, useRef } from 'react';
import { cmsService } from '../../services/cmsService';
import { 
  Truck, 
  Search, 
  Droplets, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  PackageCheck,
  Flame,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Zap,
  Check
} from 'lucide-react';

const ENRICHED_DEFAULT_STEPS = [
  {
    stepNumber: '01',
    title: 'Doorstep Pickup',
    shortLabel: 'Doorstep Pickup',
    tag: 'Instant Logistics',
    summary: 'Dedicated executive arrives at your booked slot with tamper-evident breathable garment carriers and generates an instant digital custody receipt.',
    highlights: ['Instant 60s Booking', 'Tamper-Evident Bags', 'Live Barcode Custody'],
    stageIcon: Truck
  },
  {
    stepNumber: '02',
    title: 'Optical Inspection',
    shortLabel: 'Fiber Inspection',
    tag: 'Optical Diagnostics',
    summary: 'Garments undergo 98+ CRI daylight spectrum inspection to analyze fabric tension, hidden micro-stains, and map care instructions to automated machine cycles.',
    highlights: ['98+ CRI Daylight Scan', 'Ultrasonic Pre-Spotting', 'Zero Fiber Abrasion'],
    stageIcon: Search
  },
  {
    stepNumber: '03',
    title: 'Precision Cleaning',
    shortLabel: 'RO & Hydrocarbon',
    tag: 'Purification Drum',
    summary: 'Cleaned in dedicated single-client isolated drums with pure 100% RO demineralized soft water and German eco-friendly hydrocarbon solutions.',
    highlights: ['Single-Client Batch Only', '0-TDS Pure RO Soft Water', 'German Eco Solvents'],
    stageIcon: Droplets
  },
  {
    stepNumber: '04',
    title: '3D Steam Finishing',
    shortLabel: '3D Steam Press',
    tag: 'Tension Form',
    summary: 'European tension form mannequins and precision vacuum tables use micro-filtered 140°C steam to eliminate deep wrinkles without scorch marks.',
    highlights: ['Tension Form Pressing', '140°C Micro-Filtered Steam', 'Zero Heat Scorch Marks'],
    stageIcon: Flame
  },
  {
    stepNumber: '05',
    title: '10-Point Quality Control',
    shortLabel: '10-Point QC',
    tag: 'Master Audit',
    summary: 'Senior master technicians perform an exhaustive 10-point checklist auditing seams, buttons, stain clearance, and fragrance before granting dual sign-off.',
    highlights: ['Dual Master Sign-Off', '10-Point Audit Checklist', '99.98% Accuracy Level'],
    stageIcon: ShieldCheck
  },
  {
    stepNumber: '06',
    title: 'Sealed Express Delivery',
    shortLabel: 'Sealed Express',
    tag: 'Doorstep Return',
    summary: 'Garments are enclosed in antiseptic sealed moisture-shielded packaging with luxury shoulder-support hangers and delivered right to your door.',
    highlights: ['Antiseptic Sealed Cover', 'Luxury Garment Hangers', 'Live GPS Delivery'],
    stageIcon: PackageCheck
  }
];

export const HowItWorksSection = () => {
  const [steps, setSteps] = useState(ENRICHED_DEFAULT_STEPS);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  const STEP_DURATION = 4500; // 4.5 seconds per step

  useEffect(() => {
    cmsService.getItems('processSteps')
      .then((data) => {
        if (data && data.length > 0) {
          const merged = ENRICHED_DEFAULT_STEPS.map((defStep, i) => {
            const cmsStep = data[i];
            if (!cmsStep) return defStep;
            return {
              ...defStep,
              title: cmsStep.title || defStep.title,
              summary: (cmsStep.bullets && cmsStep.bullets[0]) || defStep.summary,
              highlights: cmsStep.bullets || defStep.highlights,
              stepNumber: cmsStep.stepNumber || defStep.stepNumber
            };
          });
          setSteps(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalTime = 45;
    const progressStep = (intervalTime / STEP_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStepIndex((current) => (current + 1) % steps.length);
          return 0;
        }
        return prev + progressStep;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, steps.length, activeStepIndex]);

  const handleSelectStep = (idx) => {
    setActiveStepIndex(idx);
    setProgress(0);
  };

  const handleNext = () => {
    setActiveStepIndex((prev) => (prev + 1) % steps.length);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveStepIndex((prev) => (prev - 1 + steps.length) % steps.length);
    setProgress(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const activeStep = steps[activeStepIndex] || steps[0];
  const ActiveIcon = activeStep.stageIcon || CheckCircle2;

  // Percentage along the horizontal flow river
  const flowProgressPercent = ((activeStepIndex + (isPlaying ? progress / 100 : 0)) / (steps.length - 1)) * 100;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#FFF7ED] via-white to-[#FFF7ED] text-slate-900 relative overflow-hidden">
      
      {/* Ambient background soft light glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#FED7AA]/35 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Compact Header with Flow Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-orange-200/50 pb-5">
          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#FED7AA] text-[#F97316] text-[11px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
              <span>Scientific Custodial Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-[#1F2937]">
              6-Stage Precision <span className="text-[#F97316]">Processing Flow</span>
            </h2>
          </div>

          {/* Interactive Flow Scrubber & Controls */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-[#FED7AA] px-3 py-1.5 rounded-full shadow-sm">
            <button
              onClick={handlePrev}
              aria-label="Previous Stage"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-[#F97316] hover:bg-orange-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause Flow' : 'Play Flow'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] text-xs font-bold text-[#F97316] hover:bg-[#F97316] hover:text-white transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span className="text-[11px]">Pause Flow</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-[11px]">Auto Flow</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              aria-label="Next Stage"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-[#F97316] hover:bg-orange-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* DESKTOP/TABLET: CONTINUOUS LUMINOUS FLOW STREAM (BOX-FREE)  */}
        {/* ========================================================== */}
        <div className="hidden md:block relative py-6">
          
          {/* Continuous Curved Wave Stream SVG */}
          <div className="absolute top-[52px] left-[5%] right-[5%] h-12 pointer-events-none z-0">
            <svg 
              className="w-full h-full overflow-visible" 
              viewBox="0 0 1000 48" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="flowTrackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#FDBA74" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FED7AA" stopOpacity="0.6" />
                </linearGradient>

                <linearGradient id="activeFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>
              </defs>

              {/* Background Luminous Base Track */}
              <path
                d="M 0,24 C 100,6 200,42 300,24 C 400,6 500,42 600,24 C 700,6 800,42 900,24 C 950,15 1000,24 1000,24"
                stroke="url(#flowTrackGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Animated Flow Energy Particles */}
              <path
                d="M 0,24 C 100,6 200,42 300,24 C 400,6 500,42 600,24 C 700,6 800,42 900,24 C 950,15 1000,24 1000,24"
                stroke="#F97316"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                className="animate-flow-dashes opacity-80"
              />
            </svg>
          </div>

          {/* 6 Frameless Floating Milestone Node Orbs */}
          <div className="grid grid-cols-6 gap-2 relative z-10">
            {steps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              const isCompleted = idx < activeStepIndex;
              const StepIcon = step.stageIcon || CheckCircle2;

              // Alternating subtle vertical wave offsets for realistic flow rhythm
              const yOffsetClass = idx % 2 === 0 ? '-translate-y-2' : 'translate-y-2';

              return (
                <button
                  key={step.stepNumber || idx}
                  onClick={() => handleSelectStep(idx)}
                  className={`group relative flex flex-col items-center text-center p-2 transition-all duration-300 focus:outline-none ${yOffsetClass}`}
                >
                  {/* Floating Glass Orb Node */}
                  <div className="relative mb-3">
                    
                    {/* Concentric Glow Halo for Active Orb */}
                    {isActive && (
                      <div className="absolute -inset-2.5 rounded-full bg-[#F97316]/20 blur-md animate-pulse-ring pointer-events-none" />
                    )}

                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
                        isActive
                          ? 'bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white shadow-glow-orange scale-110 ring-4 ring-orange-200'
                          : isCompleted
                          ? 'bg-orange-100/90 text-[#F97316] border-2 border-orange-300 hover:scale-105'
                          : 'bg-white/90 backdrop-blur-sm text-slate-400 border border-slate-200 hover:border-orange-300 hover:text-[#F97316] hover:scale-105'
                      }`}
                    >
                      <StepIcon className={`w-6 h-6 transition-transform ${isActive ? 'animate-bounce' : 'group-hover:scale-110'}`} />
                    </div>

                    {/* Stage Number Floating Pip */}
                    <span
                      className={`absolute -top-1 -right-1 text-[10px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
                        isActive
                          ? 'bg-[#1F2937] text-white border-white'
                          : isCompleted
                          ? 'bg-[#F97316] text-white border-orange-200'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {step.stepNumber}
                    </span>

                    {/* Active Circular Progress Arc */}
                    {isActive && (
                      <svg className="absolute -inset-1 w-16 h-16 pointer-events-none rotate-[-90deg]">
                        <circle
                          cx="32"
                          cy="32"
                          r="30"
                          fill="transparent"
                          stroke="#F97316"
                          strokeWidth="2.5"
                          strokeDasharray="188.4"
                          strokeDashoffset={188.4 - (188.4 * progress) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-75"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Stage Name & Tag */}
                  <div className="space-y-0.5">
                    <span className={`text-xs font-black font-display block transition-colors leading-tight ${
                      isActive ? 'text-[#F97316]' : 'text-slate-800 group-hover:text-[#F97316]'
                    }`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {step.tag}
                    </span>
                  </div>

                  {/* Tiny Active Flow Pointer Dot */}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-2 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* ========================================================== */}
        {/* MOBILE: STREAMLINED VERTICAL RIVER FLOW (BOX-FREE)         */}
        {/* ========================================================== */}
        <div className="md:hidden relative pl-6 space-y-4">
          
          {/* Vertical Continuous Flow Stream Line */}
          <div className="absolute top-4 bottom-4 left-5 w-0.5 bg-orange-200 pointer-events-none">
            <div 
              className="w-full bg-[#F97316] transition-all duration-300"
              style={{
                height: `${((activeStepIndex + 1) / steps.length) * 100}%`
              }}
            />
          </div>

          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isCompleted = idx < activeStepIndex;
            const StepIcon = step.stageIcon || CheckCircle2;

            return (
              <button
                key={step.stepNumber || idx}
                onClick={() => handleSelectStep(idx)}
                className={`w-full flex items-center gap-3.5 text-left p-2 rounded-2xl transition-all ${
                  isActive ? 'bg-orange-500/10' : 'hover:bg-orange-50/50'
                }`}
              >
                {/* Node Orb */}
                <div className="relative shrink-0 z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#F97316] text-white shadow-glow-orange ring-2 ring-orange-200 scale-110'
                        : isCompleted
                        ? 'bg-orange-100 text-[#F97316] border border-orange-300'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-full bg-slate-800 text-white">
                    {step.stepNumber}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-display ${isActive ? 'text-[#F97316]' : 'text-slate-800'}`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {step.tag}
                    </span>
                  </div>
                  {isActive && (
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                      {step.summary}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ========================================================== */}
        {/* SLEEK FRAMELESS LIVE STREAM INSIGHT STRIP (SPACE-EFFICIENT) */}
        {/* ========================================================== */}
        <div className="relative bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-transparent rounded-2xl p-4 sm:p-5 border border-orange-200/80 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Live Insight Content */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
                <span className="text-[11px] font-black text-[#F97316] uppercase tracking-wider">
                  Live Stage {activeStep.stepNumber} of 06 Protocol:
                </span>
                <strong className="text-xs sm:text-sm font-bold text-slate-900">
                  {activeStep.title}
                </strong>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {activeStep.summary}
              </p>
            </div>

            {/* Inline Glowing Benefit Chips (Frameless pills) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {activeStep.highlights.map((hl, hIdx) => (
                <div 
                  key={hIdx} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#FED7AA] text-[11px] font-bold text-slate-700 shadow-sm"
                >
                  <Check className="w-3 h-3 text-[#F97316]" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};


