import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_SERVICES } from '../../services/serviceService';
import { formatCurrency } from '../../utils/formatters';
import { 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const ServicesShowcase = ({ services = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const displayServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  const categories = ['All', ...Array.from(new Set(displayServices.map(s => s.category || 'General Care').filter(Boolean)))];

  const filtered = selectedCategory === 'All' 
    ? displayServices 
    : displayServices.filter(s => (s.category || 'General Care') === selectedCategory);

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      
      {/* Subtle Ambient Background Highlights */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-brand-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10 sm:space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Tailored Textile Solutions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
              Specialized Care for <br />
              <span className="text-[#F97316]">Every Fabric Type</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              From delicate bridal silks and structured suits to daily wardrobe laundry and sneaker restoration, explore our specialized care masteries.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-[#F97316] border border-slate-200/90 shadow-2xs hover:border-[#F97316]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* BALANCED, HIGH-PRECISION UNIFORM RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
          {filtered.map((service, idx) => {
            const pricingUnit = service.pricingType === 'per_kg' ? '/ kg' 
              : service.pricingType === 'per_sqft' ? '/ sq.ft' 
              : service.pricingType === 'per_pair' ? '/ pair' 
              : '/ item';

            return (
              <Link
                key={service.id || idx}
                to={`/services/${service.slug}`}
                className="group flex flex-col justify-between bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1.5"
              >
                <div>
                  {/* 1. PHOTOGRAPHY BANNER CONTAINER */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-900">
                    <img
                      src={service.heroImage || service.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'}
                      alt={service.title || service.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Category Pill Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-extrabold text-slate-900 shadow-xs">
                        {service.category || 'Apparel Care'}
                      </span>
                    </div>

                    {/* Floating Action Arrow */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-md transform group-hover:rotate-45 group-hover:bg-[#F97316] group-hover:text-white transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>

                    {/* Starting Rate Badge */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-1 text-white shadow-sm">
                      {service.startingPrice ? (
                        <>
                          <span className="text-[10px] uppercase font-bold text-orange-400">From</span>
                          <span className="text-xs sm:text-sm font-black text-white">
                            {formatCurrency(service.startingPrice)}
                          </span>
                          <span className="text-[10px] text-slate-300 font-medium">
                            {pricingUnit}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-300">Rates upon request</span>
                      )}
                    </div>
                  </div>

                  {/* 2. CARD BODY & CONTENT */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      {service.emoji && (
                        <span className="text-lg shrink-0">{service.emoji}</span>
                      )}
                      <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 group-hover:text-[#F97316] transition-colors line-clamp-1">
                        {service.title || service.name}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {service.shortDescription || 'Gentle eco-friendly care and 3D steam finishing for immaculate freshness.'}
                    </p>

                    {/* Micro Features / Highlights */}
                    {service.features && service.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {service.features.slice(0, 2).map((feat, fIdx) => (
                          <span 
                            key={fIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-semibold text-slate-600 border border-slate-100"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span className="line-clamp-1">{feat}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. CARD FOOTER */}
                <div className="px-5 sm:px-6 pb-5 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#F97316]">
                    <span className="text-slate-500 font-medium">48h Doorstep Service</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

        {/* Bottom Explorer CTA */}
        <div className="text-center pt-4">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-xl hover:bg-[#F97316] transform hover:-translate-y-0.5 transition-all"
          >
            <span>View Full Service Catalog & Rates</span>
            <ArrowUpRight className="w-4 h-4 text-orange-300" />
          </Link>
        </div>

      </div>
    </section>
  );
};
