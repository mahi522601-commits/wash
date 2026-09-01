import React from 'react';
import { ShieldCheck, Sparkles, Clock, Droplets, Award, ThumbsUp } from 'lucide-react';

export const StatsSection = () => {
  const stats = [
    {
      icon: Droplets,
      value: '100% RO',
      label: 'Soft Water Washing',
      description: 'Zero mineral scaling on delicate yarns',
    },
    {
      icon: ShieldCheck,
      value: '10-Stage',
      label: 'Garment Inspection',
      description: 'Pre-spotting to 3D form steam finish',
    },
    {
      icon: Clock,
      value: '45 Mins',
      label: 'Doorstep Pickup',
      description: 'Swift doorstep executive dispatch',
    },
    {
      icon: Award,
      value: '99.8%',
      label: 'Fabric Safety Rate',
      description: 'Certified bio-enzyme hydrocarbon solvents',
    },
  ];

  return (
    <section className="relative z-10 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-luxury hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                {stat.label}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
