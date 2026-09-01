import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { 
  Truck, 
  Search, 
  Droplets, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

const DEFAULT_PROCESS_STEPS = [
  {
    stepNumber: '01',
    title: 'Doorstep Pickup',
    bullets: [
      'Schedule online in under 60 seconds',
      'Dedicated logistics executive arrives at your slot',
      'Digital tag & custody receipt generated'
    ]
  },
  {
    stepNumber: '02',
    title: 'Optical Inspection',
    bullets: [
      'Fabric sensitivity & fiber analysis',
      'Optical pre-spotting inspection for stubborn stains',
      'Care label instructions mapped to machine cycles'
    ]
  },
  {
    stepNumber: '03',
    title: 'Precision Cleaning',
    bullets: [
      'Single-client batch isolation (never mixed)',
      '100% Demineralized RO soft water cycle',
      'Eco-friendly non-toxic hydrocarbon solvents'
    ]
  },
  {
    stepNumber: '04',
    title: '3D Steam Finishing',
    bullets: [
      'Tension form pressing preserving drape & silhouette',
      'Zero heat scorch or fabric shine marks',
      'Anti-static and wrinkle-free finishing'
    ]
  },
  {
    stepNumber: '05',
    title: '10-Point Quality Control',
    bullets: [
      'Dual master technician sign-off',
      'Stain removal & crease alignment verification',
      'Barcode tracking & order verification'
    ]
  },
  {
    stepNumber: '06',
    title: 'Sealed Express Delivery',
    bullets: [
      'Antiseptic sealed protective packaging',
      'Custom luxury garment hangers & suit covers',
      'Doorstep delivery with digital live tracking'
    ]
  }
];

export const HowItWorksSection = () => {
  const [steps, setSteps] = useState(DEFAULT_PROCESS_STEPS);

  useEffect(() => {
    cmsService.getItems('processSteps')
      .then((data) => {
        if (data && data.length > 0) {
          setSteps(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-navy-900 text-white relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/30 border border-brand-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Garment Care Journey</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
            6-Stage Precision <br />
            <span className="text-gradient-cyan">Processing Roadmap</span>
          </h2>
          <p className="text-sm sm:text-base text-brand-100/80 font-normal max-w-xl mx-auto leading-relaxed">
            Every garment entrusted to Tech Wash passes through a strictly monitored multi-stage custodial workflow.
          </p>
        </div>

        {/* 6-STAGE TIMELINE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => (
            <div
              key={step.id || idx}
              className="relative p-7 sm:p-8 rounded-[36px] bg-navy-800/90 border border-brand-500/30 shadow-2xl hover:border-cyan-400/60 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Step Number & Glowing Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl sm:text-4xl font-black font-display text-cyan-400">
                    {step.stepNumber || `0${idx + 1}`}
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-brand-600/40 border border-brand-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Step Title */}
                <h3 className="text-xl font-bold font-display text-white group-hover:text-cyan-300 transition-colors">
                  {step.title}
                </h3>

                {/* Structured Bullet Points */}
                <ul className="space-y-2.5 pt-2 border-t border-brand-700/60">
                  {step.bullets?.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-xs text-brand-100/80 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Subtle Node Indicator */}
              <div className="pt-6 mt-4 border-t border-brand-700/40 flex items-center justify-between text-[11px] text-brand-300 font-mono">
                <span>Stage {idx + 1} of {steps.length}</span>
                <span className="text-cyan-400">Verified Protocol</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
