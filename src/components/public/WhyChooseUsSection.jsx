import React from 'react';
import { Card } from '../ui/Card';
import { 
  Droplets, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Award, 
  Truck, 
  Layers, 
  HeartHandshake 
} from 'lucide-react';

const ICON_MAP = {
  Droplets,
  Sparkles,
  Clock,
  ShieldCheck,
  Award,
  Truck,
  Layers,
  HeartHandshake,
};

export const WhyChooseUsSection = ({ benefits = [] }) => {
  const displayBenefits = benefits.length > 0 ? benefits.filter(b => b.active !== false) : [
    {
      title: 'RO Soft Water Cleaning',
      description: 'Hard water causes fabric brittleness and discoloration. Our water softening plants guarantee silk-grade softness.',
      icon: 'Droplets',
    },
    {
      title: 'Zero Chemical Odor',
      description: 'Eco-safe European hydrocarbon solvents that extract 100% stains while preserving fiber aroma and color vibrancy.',
      icon: 'Sparkles',
    },
    {
      title: '45-Min Doorstep Pickup',
      description: 'Choose your preferred 1-hour slot with real-time executive dispatch and express 24-hr turnaround options.',
      icon: 'Clock',
    },
    {
      title: '10-Stage Garment Tracking',
      description: 'Live real-time transparency for every garment through inspection, stain-spotting, steam pressing, to sealed eco-pack.',
      icon: 'ShieldCheck',
    }
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Tech Wash Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            Engineered for Fabric Longevity
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            We combined scientific garment care processes with seamless doorstep technology to redefine laundry in India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBenefits.map((benefit, idx) => {
            const Icon = ICON_MAP[benefit.icon] || Sparkles;
            return (
              <Card
                key={benefit.id || idx}
                variant="luxury"
                className="p-7 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5 group-hover:bg-gradient-to-r group-hover:from-brand-600 group-hover:to-royal-700 group-hover:text-white transition-all shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1">
                  <span>Standard Guarantee</span>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};
