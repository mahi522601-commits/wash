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
  Clock,
  Check
} from 'lucide-react';

const ENRICHED_DEFAULT_STEPS = [
  {
    stepNumber: '01',
    title: 'Contactless Doorstep Pickup',
    phaseTag: 'Logistics & Custody',
    timeEstimate: 'Instant Slot • 60 Sec Booking',
    description: 'Our certified logistics specialist arrives at your designated time slot with tamper-evident breathable garment carriers, performing item count verification and digital barcode tracking.',
    bullets: [
      'Dedicated logistics executive arrives precisely at your booked slot',
      'Tamper-evident breathable sanitised garment carriers provided',
      'Instant digital custody receipt & item count generated on spot'
    ],
    technicalSpecs: [
      { label: 'Custody Protocol', value: '100% Barcode Tracked' },
      { label: 'Dispatch Speed', value: '< 60 Min Response' },
      { label: 'Carrier Grade', value: 'Sanitised Tamper-Evident' }
    ],
    stageIcon: Truck,
    highlight: 'GPS-Tracked Pickup',
    graphicType: 'pickup'
  },
  {
    stepNumber: '02',
    title: 'High-CRI Optical Inspection',
    phaseTag: 'Diagnostics & Spotting',
    timeEstimate: 'Stage 2 • Fiber Analysis',
    description: 'Every garment undergoes 98+ CRI daylight spectrum optical inspection to analyze fiber tension, hidden stains, cuff wear, and care-label specifications before processing.',
    bullets: [
      'High-intensity daylight optical scanner detects hidden micro-stains',
      'Targeted ultrasonic pre-spotting using German pH-neutral bio-solvents',
      'Individual care-label code mapping to automated machine cycles'
    ],
    technicalSpecs: [
      { label: 'Optical Spectrum', value: '98+ CRI Daylight' },
      { label: 'Spotting Agent', value: 'Bio-Enzymatic Spotter' },
      { label: 'Fabric Safety', value: 'Zero Fiber Abrasion' }
    ],
    stageIcon: Search,
    highlight: 'Targeted Pre-Spotting',
    graphicType: 'inspection'
  },
  {
    stepNumber: '03',
    title: 'Soft Water & Hydrocarbon Wash',
    phaseTag: 'Purification Cycle',
    timeEstimate: 'Stage 3 • Dedicated Drum',
    description: 'Garments are cleaned in dedicated single-client drums using pure 100% RO demineralized soft water and eco-friendly hydrocarbon solutions that preserve color brilliance.',
    bullets: [
      'Strict single-household batch isolation (your clothes are never mixed)',
      '100% Demineralized RO soft water cycle prevents mineral hardening',
      'Eco-friendly German hydrocarbon dry cleaning drum technology'
    ],
    technicalSpecs: [
      { label: 'Water Purity', value: '0-TDS Softened RO' },
      { label: 'Batch Isolation', value: 'Single Client Batch' },
      { label: 'Detergent Grade', value: 'Hypoallergenic Eco' }
    ],
    stageIcon: Droplets,
    highlight: 'Never Mixed With Others',
    graphicType: 'wash'
  },
  {
    stepNumber: '04',
    title: '3D Form Finishing & Steam Press',
    phaseTag: 'Thermodynamic Pressing',
    timeEstimate: 'Stage 4 • Tension Form',
    description: 'Garments are pressed on European tension form mannequins and precision vacuum tables using micro-filtered steam to eliminate creases without harsh scorching.',
    bullets: [
      'Tension form pressing preserves original garment drape & silhouette',
      'Micro-filtered steam removes 99.9% of bacteria and deep creases',
      'Zero heat scorch or shiny marks on delicate fabrics and woolens'
    ],
    technicalSpecs: [
      { label: 'Steam Temp', value: '140°C Micro-Vapor' },
      { label: 'Press Method', value: '3D Tension Form' },
      { label: 'Fabric Finish', value: 'Anti-Static Luster' }
    ],
    stageIcon: Flame,
    highlight: 'Zero Heat Scorch',
    graphicType: 'steam'
  },
  {
    stepNumber: '05',
    title: '10-Point Quality Control',
    phaseTag: 'Quality Assurance',
    timeEstimate: 'Stage 5 • Dual Sign-Off',
    description: 'Senior master technicians perform a comprehensive 10-point inspection covering button stability, seam tension, crispness, and complete stain removal.',
    bullets: [
      'Dual senior quality manager checklist and digital sign-off',
      'Complete stain removal and precision crease alignment audit',
      'Barcode reconciliation ensuring zero missing or misplaced garments'
    ],
    technicalSpecs: [
      { label: 'Inspection Protocol', value: '10-Point Checklist' },
      { label: 'Approval Level', value: 'Dual Master Sign-off' },
      { label: 'Accuracy Standard', value: '99.98% Zero Error' }
    ],
    stageIcon: ShieldCheck,
    highlight: 'Dual Master Sign-Off',
    graphicType: 'qc'
  },
  {
    stepNumber: '06',
    title: 'Antiseptic Sealed Express Delivery',
    phaseTag: 'Final Return',
    timeEstimate: 'Stage 6 • Doorstep Arrival',
    description: 'Garments are sealed in dust-proof, moisture-shielded packaging with luxury shoulder-support hangers and delivered right to your door on your schedule.',
    bullets: [
      'Antiseptic sealed protective packaging preserves freshness',
      'Custom luxury garment hangers & breathable suit covers provided',
      'Live GPS dispatch tracking with doorstep handover'
    ],
    technicalSpecs: [
      { label: 'Packaging', value: 'Anti-Dust Moisture Seal' },
      { label: 'Hanger Type', value: 'Luxury Ergonomic' },
      { label: 'Delivery Guarantee', value: 'On-Time Doorstep' }
    ],
    stageIcon: PackageCheck,
    highlight: 'Fresh & Tamper-Sealed',
    graphicType: 'delivery'
  }
];

export const HowItWorksSection = () => {
  const [steps, setSteps] = useState(ENRICHED_DEFAULT_STEPS);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  const STEP_DURATION = 5000; // 5 seconds per step

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
              bullets: cmsStep.bullets || defStep.bullets,
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

    const intervalTime = 50;
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

  return (
    <section className="py-20 lg:py-28 bg-[#FFF7ED] text-slate-900 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#FED7AA]/40 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#FED7AA]/35 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FED7AA] text-[#F97316] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-[#F97316] animate-pulse" />
            <span>The Garment Care Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-[#1F2937] leading-tight">
            6-Stage Precision <br />
            <span className="text-[#F97316] relative inline-block">
              Processing Roadmap
              <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F97316] via-[#FB923C] to-transparent rounded-full opacity-60"></span>
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Experience our automated, science-backed garment lifecycle. Watch how your clothes flow through each strict custodial checkpoint.
          </p>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE FLOW PIPELINE / CONNECTOR TRACK              */}
        {/* ======================================================== */}
        <div className="relative bg-white/90 backdrop-blur-md border border-[#FED7AA] rounded-3xl p-4 sm:p-6 shadow-luxury">
          
          {/* Top Control Bar: Status & Play/Pause */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-orange-100/80 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-[#FED7AA] text-xs font-bold text-[#F97316]">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
                <span>Live Custody Flow</span>
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Stage {activeStepIndex + 1} of {steps.length}: <strong className="text-slate-800">{activeStep.title}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous Stage"
                className="w-8 h-8 rounded-full bg-white border border-[#FED7AA] flex items-center justify-center text-slate-600 hover:text-[#F97316] hover:border-[#F97316] transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause Flow' : 'Play Flow'}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-xs font-bold text-[#F97316] hover:bg-[#F97316] hover:text-white transition-all shadow-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Flow</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Auto Flow</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                aria-label="Next Stage"
                className="w-8 h-8 rounded-full bg-white border border-[#FED7AA] flex items-center justify-center text-slate-600 hover:text-[#F97316] hover:border-[#F97316] transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Connected Flow Roadmap Track */}
          <div className="relative pt-3 pb-4">
            
            {/* Background Animated SVG Flow Line (Desktop/Tablet) */}
            <div className="hidden md:block absolute top-[44px] left-[6%] right-[6%] h-2 pointer-events-none -translate-y-1/2 z-0">
              {/* Static Background Track */}
              <div className="w-full h-1.5 bg-orange-100 rounded-full" />
              
              {/* Animated Glowing Active Progress Segment */}
              <div 
                className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-[#F97316] to-[#FB923C] rounded-full transition-all duration-500 shadow-glow-orange"
                style={{
                  width: `${((activeStepIndex + (isPlaying ? progress / 100 : 0)) / (steps.length - 1)) * 100}%`
                }}
              />

              {/* Animated Dashed Energy Flow */}
              <svg className="absolute -top-1 left-0 w-full h-4 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                <line 
                  x1="0%" 
                  y1="50%" 
                  x2="100%" 
                  y2="50%" 
                  stroke="#F97316" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  className="animate-flow-dashes opacity-70" 
                />
              </svg>
            </div>

            {/* 6 Flow Milestone Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 relative z-10">
              {steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isCompleted = idx < activeStepIndex;
                const StepIcon = step.stageIcon || CheckCircle2;

                return (
                  <button
                    key={step.stepNumber || idx}
                    onClick={() => handleSelectStep(idx)}
                    className={`group relative flex flex-col items-center text-center p-3 rounded-2xl transition-all duration-300 focus:outline-none ${
                      isActive 
                        ? 'bg-orange-500/10 border-2 border-[#F97316] shadow-lg scale-105' 
                        : 'bg-white/70 border border-[#FED7AA] hover:bg-orange-50/60 hover:border-[#F97316]/50'
                    }`}
                  >
                    {/* Node Avatar & Indicator */}
                    <div className="relative mb-2">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-[#F97316] text-white shadow-glow-orange scale-110'
                            : isCompleted
                            ? 'bg-orange-100 text-[#F97316] border border-[#FED7AA]'
                            : 'bg-white text-slate-400 border border-slate-200 group-hover:text-[#F97316] group-hover:border-[#FED7AA]'
                        }`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>

                      {/* Step Number Floating Badge */}
                      <span
                        className={`absolute -top-1.5 -right-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full border shadow-sm ${
                          isActive
                            ? 'bg-[#1F2937] text-white border-white'
                            : isCompleted
                            ? 'bg-[#F97316] text-white border-orange-200'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                      >
                        {step.stepNumber || `0${idx + 1}`}
                      </span>

                      {/* Active Ripple Animation */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#F97316] animate-pulse-ring pointer-events-none" />
                      )}
                    </div>

                    {/* Step Title Label */}
                    <span className={`text-xs font-bold font-display line-clamp-1 transition-colors ${
                      isActive ? 'text-[#F97316]' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}
                    </span>

                    {/* Tag / Status */}
                    <span className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                      {step.phaseTag || `Stage ${idx + 1}`}
                    </span>

                    {/* Active Bottom Progress Bar for this Node */}
                    {isActive && (
                      <div className="w-full mt-2 h-1 bg-orange-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#F97316] transition-all duration-75"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* ACTIVE STAGE SPOTLIGHT CARD (LIVE FLOW SIMULATION)        */}
        {/* ======================================================== */}
        <div className="relative rounded-[36px] bg-white border-2 border-[#FED7AA] p-6 sm:p-10 shadow-luxury overflow-hidden">
          
          {/* Subtle Stage Background Watermark */}
          <div className="absolute top-4 right-8 text-8xl sm:text-9xl font-black text-orange-500/5 select-none pointer-events-none font-display">
            {activeStep.stepNumber}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Column: Stage Details & Technical Specs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Header Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-extrabold tracking-wider uppercase shadow-sm">
                  Stage {activeStep.stepNumber} of 06
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-50 border border-[#FED7AA] text-[#F97316] text-xs font-bold">
                  {activeStep.phaseTag}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{activeStep.timeEstimate}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-4xl font-extrabold font-display text-[#1F2937] tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-glow-orange">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <span>{activeStep.title}</span>
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {activeStep.description}
                </p>
              </div>

              {/* Interactive Bullet Points with Glowing Checkmarks */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Precision Protocol Steps:
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeStep.bullets.map((bullet, bIdx) => (
                    <div 
                      key={bIdx}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFF7ED]/80 border border-[#FED7AA]/70 hover:border-[#F97316] transition-all group"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Bar */}
              {activeStep.technicalSpecs && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  {activeStep.technicalSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {spec.label}
                      </div>
                      <div className="text-xs font-bold text-[#1F2937] mt-0.5 truncate">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Right Column: Live Animated Flow Graphic Simulator (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#FFF7ED] to-white border-2 border-[#FED7AA] p-6 shadow-xl relative overflow-hidden flex flex-col items-center text-center space-y-5">
                
                {/* Visual Simulation Graphic Component */}
                <div className="w-full h-52 rounded-2xl bg-white border border-[#FED7AA] relative overflow-hidden flex items-center justify-center shadow-inner">
                  
                  {/* Ambient background glow inside graphic */}
                  <div className="absolute inset-0 bg-radial-purple-glow opacity-80 pointer-events-none" />

                  {/* Stage 1: Pickup Animation Graphic */}
                  {activeStep.graphicType === 'pickup' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* GPS Radar rings */}
                      <div className="absolute w-32 h-32 rounded-full border-2 border-orange-300/40 animate-ping" />
                      <div className="absolute w-24 h-24 rounded-full border border-orange-400/50 animate-pulse" />
                      
                      {/* Moving Vehicle */}
                      <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-glow-orange animate-bounce">
                        <Truck className="w-8 h-8" />
                      </div>

                      {/* Road with flowing dashes */}
                      <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-[#F97316] animate-flow-energy" />
                      </div>
                      <span className="absolute bottom-7 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        Live GPS Custody Dispatch
                      </span>
                    </div>
                  )}

                  {/* Stage 2: Optical Inspection Animation Graphic */}
                  {activeStep.graphicType === 'inspection' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* Garment / Scanner Target Frame */}
                      <div className="w-28 h-36 rounded-2xl border-2 border-dashed border-orange-400/60 bg-orange-50/30 relative flex flex-col items-center justify-center">
                        <Search className="w-10 h-10 text-[#F97316] animate-pulse" />
                        
                        {/* Moving Laser Scan Beam */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F97316] to-transparent shadow-glow-orange animate-scan-beam" />
                        
                        {/* Target Crosshairs */}
                        <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-[#F97316]" />
                        <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-[#F97316]" />
                        <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-[#F97316]" />
                        <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-[#F97316]" />
                      </div>
                      <span className="absolute bottom-3 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        98+ CRI Optical Scan Active
                      </span>
                    </div>
                  )}

                  {/* Stage 3: Wash Drum Animation Graphic */}
                  {activeStep.graphicType === 'wash' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* Washing Machine Drum */}
                      <div className="w-32 h-32 rounded-full border-4 border-[#FED7AA] bg-orange-50/50 relative flex items-center justify-center shadow-inner overflow-hidden">
                        {/* Rotating drum spokes */}
                        <div className="absolute inset-2 border-2 border-dashed border-[#F97316]/50 rounded-full animate-drum-spin" />
                        
                        {/* Rising Water Bubbles */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Droplets className="w-10 h-10 text-[#F97316] animate-water-ripple" />
                        </div>

                        {/* Liquid Wave Base */}
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-orange-400/20 rounded-b-full animate-water-ripple" />
                      </div>
                      <span className="absolute bottom-3 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        0-TDS RO Soft Water Drum
                      </span>
                    </div>
                  )}

                  {/* Stage 4: 3D Steam Finishing Graphic */}
                  {activeStep.graphicType === 'steam' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* 3D Mannequin Form Frame */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-14 h-20 rounded-t-3xl bg-[#FFF7ED] border-2 border-[#F97316] flex items-center justify-center shadow-md">
                          <Flame className="w-6 h-6 text-[#F97316]" />
                        </div>
                        
                        {/* Rising Steam Vapors */}
                        <div className="absolute -top-3 left-1 w-2.5 h-2.5 rounded-full bg-orange-300/80 animate-steam-rise" />
                        <div className="absolute -top-6 left-5 w-3.5 h-3.5 rounded-full bg-orange-400/70 animate-steam-rise" style={{ animationDelay: '0.4s' }} />
                        <div className="absolute -top-4 right-1 w-3 h-3 rounded-full bg-orange-300/80 animate-steam-rise" style={{ animationDelay: '0.8s' }} />
                      </div>
                      <span className="absolute bottom-3 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        140°C Micro-Steam Press
                      </span>
                    </div>
                  )}

                  {/* Stage 5: 10-Point QC Graphic */}
                  {activeStep.graphicType === 'qc' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* Hologram Shield */}
                      <div className="w-24 h-28 rounded-3xl bg-[#FFF7ED] border-2 border-[#F97316] flex flex-col items-center justify-center shadow-glow-orange relative">
                        <ShieldCheck className="w-10 h-10 text-[#F97316] mb-1" />
                        <span className="text-[10px] font-black text-[#1F2937]">10 / 10 QC</span>
                        
                        {/* Orbiting Verified Ring */}
                        <div className="absolute inset-0 rounded-3xl border border-dashed border-[#F97316] animate-spin" style={{ animationDuration: '10s' }} />
                      </div>
                      <span className="absolute bottom-3 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        Dual Master Sign-Off Approved
                      </span>
                    </div>
                  )}

                  {/* Stage 6: Sealed Delivery Graphic */}
                  {activeStep.graphicType === 'delivery' && (
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                      {/* Sealed Luxury Package Frame */}
                      <div className="w-24 h-28 rounded-2xl bg-white border-2 border-[#F97316] flex flex-col items-center justify-center shadow-lg relative">
                        <PackageCheck className="w-10 h-10 text-[#F97316] mb-1" />
                        <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">
                          Tamper-Proof
                        </div>
                      </div>
                      <span className="absolute bottom-3 text-[10px] font-bold text-[#F97316] uppercase tracking-wider">
                        Antiseptic Packaged & Dispatched
                      </span>
                    </div>
                  )}

                </div>

                {/* Bottom Quick Metric Card */}
                <div className="w-full p-3 rounded-2xl bg-white border border-[#FED7AA] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#F97316]" />
                    <span className="text-xs font-bold text-slate-800">
                      {activeStep.highlight}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    Active
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* 6-STAGE SEQUENTIAL OVERVIEW CARDS (CLICKABLE / HOVERABLE) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const isCurrent = idx === activeStepIndex;
            const CardIcon = step.stageIcon || CheckCircle2;

            return (
              <div
                key={step.stepNumber || idx}
                onClick={() => handleSelectStep(idx)}
                className={`relative p-6 sm:p-7 rounded-[32px] cursor-pointer transition-all duration-300 flex flex-col justify-between group ${
                  isCurrent
                    ? 'bg-white border-2 border-[#F97316] shadow-luxury-hover scale-[1.02]'
                    : 'bg-white/90 border border-[#FED7AA] hover:border-[#F97316]/70 hover:shadow-luxury hover:-translate-y-1'
                }`}
              >
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl sm:text-4xl font-black font-display transition-colors ${
                      isCurrent ? 'text-[#F97316]' : 'text-slate-300 group-hover:text-[#F97316]'
                    }`}>
                      {step.stepNumber || `0${idx + 1}`}
                    </span>
                    
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#F97316] text-white shadow-glow-orange scale-110'
                        : 'bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] group-hover:scale-110'
                    }`}>
                      <CardIcon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg sm:text-xl font-bold font-display transition-colors ${
                    isCurrent ? 'text-[#F97316]' : 'text-[#1F2937] group-hover:text-[#F97316]'
                  }`}>
                    {step.title}
                  </h3>

                  {/* Structured Bullets */}
                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {step.bullets?.slice(0, 2).map((bullet, bIdx) => (
                      <li key={bIdx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Footer Node */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    Stage {idx + 1} of {steps.length}
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${
                    isCurrent ? 'text-[#F97316]' : 'text-slate-400 group-hover:text-[#F97316]'
                  }`}>
                    {isCurrent ? 'Viewing Flow' : 'Inspect Stage'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

