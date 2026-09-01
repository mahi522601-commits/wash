import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Droplets, 
  Leaf, 
  Award 
} from 'lucide-react';

export const QualityServicesSection = () => {
  const [qualityItems, setQualityItems] = useState([]);

  useEffect(() => {
    cmsService.getItems('qualityServices', { filterActive: true })
      .then((data) => {
        if (data && data.length > 0) {
          setQualityItems(data);
        } else {
          // Default luxury pillars if CMS is fresh
          setQualityItems([
            {
              id: 'q-1',
              title: 'Professional Cleaning Equipment',
              subtitle: 'Precision European machinery engineered for gentle fiber agitation.',
              image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
              bullets: [
                'Digitally controlled gentle wash cycles',
                'Fabric-sensitive temperature regulation',
                'Zero fiber stretching or shrinkage'
              ]
            },
            {
              id: 'q-2',
              title: 'Hygiene & Purity in Focus',
              subtitle: 'Dedicated single-client wash batches and sealed medical-grade packaging.',
              image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
              bullets: [
                'Never mixed with other customers clothes',
                'Demineralized RO soft water washing',
                'Antiseptic protective breathable packaging'
              ]
            },
            {
              id: 'q-3',
              title: 'Delicate & Couture Garment Handling',
              subtitle: 'Hand-inspected care calibrated for silk sarees, suits, and designer wear.',
              image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
              bullets: [
                'Ultrasonic pre-spotting inspection',
                'Preservation of gold zari and delicate embroidery',
                '3D ergonomic tension form steam press'
              ]
            }
          ]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-cyan-600" />
            <span>The Tech Wash Guarantee</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-navy-800 leading-tight">
            Impeccable Care. <br />
            <span className="text-gradient-purple">Every Single Time.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            We combine high-performance European machinery, demineralized soft water, and rigorous dual-QC workflows to deliver pristine garment preservation.
          </p>
        </div>

        {/* Alternating 50-70% Visual Area Cards */}
        <div className="space-y-16 lg:space-y-24">
          {qualityItems.map((item, idx) => {
            const isReversed = idx % 2 !== 0;

            return (
              <div
                key={item.id || idx}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                  isReversed ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* 1. Large Photography Block (50-70% visual area) */}
                <div className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-2 border-brand-200/80 bg-navy-950 aspect-[16/10] group">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute top-6 left-6 glass-card-dark px-3.5 py-1.5 rounded-2xl flex items-center gap-2 text-white text-xs font-bold shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Standard #{idx + 1}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Structured Editorial Details & Bullet Points */}
                <div className={`lg:col-span-5 space-y-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-widest block">
                      Quality Standard 0{idx + 1}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-display text-navy-800 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Bullet Checklist */}
                  {item.bullets && item.bullets.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {item.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-800">
                          <div className="w-5 h-5 rounded-full bg-brand-100 border border-brand-300 flex items-center justify-center text-brand-700 shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
