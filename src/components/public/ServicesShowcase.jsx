import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { 
  ArrowUpRight, 
  Sparkles, 
  Droplets, 
  Clock, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

export const ServicesShowcase = ({ services = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fallback initial services if CMS is fresh
  const sampleServices = services.length > 0 ? services : [
    {
      id: 'srv-1',
      title: 'Premium Dry Cleaning',
      slug: 'premium-dry-cleaning',
      category: 'Dry Cleaning',
      startingPrice: 129,
      pricingType: 'per piece',
      shortDescription: 'Gentle hydrocarbon solvent cleansing specifically calibrated for silks, suits, and delicate designer couture.',
      heroImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
      featured: true,
    },
    {
      id: 'srv-2',
      title: 'Steam Ironing & Form Press',
      slug: 'steam-ironing-and-form-press',
      category: 'Steam Ironing',
      startingPrice: 29,
      pricingType: 'per piece',
      shortDescription: '3D tension form steam finishing preventing fabric scorch and maintaining pristine crease retention.',
      heroImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'srv-3',
      title: 'RO Soft Water Laundry',
      slug: 'ro-soft-water-laundry',
      category: 'Laundry',
      startingPrice: 79,
      pricingType: 'per kg',
      shortDescription: '100% demineralized RO water washing preserving textile softness and zero chemical color fade.',
      heroImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'srv-4',
      title: 'Saree Rolling & Polish',
      slug: 'saree-rolling-and-polish',
      category: 'Couture',
      startingPrice: 199,
      pricingType: 'per piece',
      shortDescription: 'Traditional roll-press and gold zari brightening preserving the natural luster of bridal and heritage sarees.',
      heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'srv-5',
      title: 'Shoe Spa & Leather Care',
      slug: 'shoe-spa-and-leather-care',
      category: 'Footwear',
      startingPrice: 249,
      pricingType: 'per pair',
      shortDescription: 'Deep ultrasonic and microbial cleaning for designer sneakers, suede boots, and leather accessories.',
      heroImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    }
  ];

  const categories = ['All', ...new Set(sampleServices.map(s => s.category).filter(Boolean))];

  const filtered = selectedCategory === 'All' 
    ? sampleServices 
    : sampleServices.filter(s => s.category === selectedCategory);

  return (
    <section className="py-20 lg:py-28 bg-brand-50 relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header with Editorial Asymmetry */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-brand-200/80">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Tailored Textile Solutions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-800 leading-tight">
              Specialized Care for <br />
              <span className="text-brand-500">Every Fabric Type</span>
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-brand-700 border border-brand-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* PHOTO-FIRST EDITORIAL ASYMMETRIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((service, idx) => {
            const isFeatured = idx === 0 || service.featured;

            return (
              <Link
                key={service.id || idx}
                to={`/services/${service.slug}`}
                className={`group flex flex-col justify-between bg-white rounded-[36px] overflow-hidden border border-brand-200/80 shadow-luxury hover:shadow-luxury-hover transition-all duration-500 transform hover:-translate-y-1.5 ${
                  isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* 1. LARGE HIGH-RESOLUTION CROPPED PHOTOGRAPHY (60%+ Visual Area) */}
                <div className={`relative w-full overflow-hidden bg-navy-900 ${
                  isFeatured ? 'h-72 sm:h-80' : 'h-64 sm:h-72'
                }`}>
                  <img
                    src={service.heroImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-navy-800 shadow-sm">
                      {service.category}
                    </span>
                  </div>

                  {/* Floating Action Arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-navy-900 flex items-center justify-center shadow-lg transform group-hover:rotate-45 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>

                  {/* Starting Rate Badge */}
                  <div className="absolute bottom-4 left-4 glass-card-dark px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white">
                    <span className="text-[10px] uppercase font-bold text-brand-300">From</span>
                    <span className="text-sm font-black font-display">
                      {formatCurrency(service.startingPrice)}
                    </span>
                    <span className="text-[10px] text-brand-200">{service.pricingType}</span>
                  </div>
                </div>

                {/* 2. EDITORIAL SERVICE DETAILS */}
                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold font-display text-navy-800 group-hover:text-brand-600 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Micro Benefit Points */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-700">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-brand-600" />
                      <span>Fabric-Safe Cleaning</span>
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      Explore Service →
                    </span>
                  </div>
                </div>

              </Link>
            );
          })}
        </div>

        {/* Bottom Explorer CTA */}
        <div className="text-center pt-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-navy-800 text-white font-bold text-sm shadow-xl hover:bg-brand-600 transform hover:-translate-y-0.5 transition-all"
          >
            <span>View Full Service Catalog & Rates</span>
            <ArrowUpRight className="w-4 h-4 text-brand-400" />
          </Link>
        </div>

      </div>
    </section>
  );
};
