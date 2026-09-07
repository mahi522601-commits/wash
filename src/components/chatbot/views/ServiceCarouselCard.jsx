import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export const ServiceCarouselCard = ({ services = [], onSelectService, onBookService }) => {
  return (
    <div className="space-y-2 py-1 animate-fade-in">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
        <span>Care Menu ({services.length} Specialized Services)</span>
        <span className="text-[10px] text-brand-600 font-normal">Swipe horizontally →</span>
      </div>

      {/* Horizontal Scrollable Carousel Container */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory px-0.5">
        {services.map((srv) => (
          <div
            key={srv.id || srv.slug}
            className="w-[200px] sm:w-[220px] bg-white rounded-2xl border border-brand-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden shrink-0 snap-start group"
          >
            {/* 4:3 Aspect Image */}
            <div className="relative h-24 bg-slate-100 overflow-hidden">
              <img
                src={srv.heroImage || srv.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80'}
                alt={srv.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1E1B4B]/80 backdrop-blur-md text-white text-[9px] font-bold">
                {srv.category || 'Garment Care'}
              </div>
            </div>

            {/* Service Details Body */}
            <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h5 className="text-xs font-bold text-[#1F2937] line-clamp-1 group-hover:text-[#F97316] transition-colors">
                  {srv.title}
                </h5>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {srv.shortDescription}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 block">Starting:</span>
                  <span className="text-xs font-black font-mono text-[#F97316]">
                    {srv.startingPrice ? formatCurrency(srv.startingPrice) : 'Quote'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelectService(srv)}
                    className="px-2 py-1 rounded-lg bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#F97316] text-[10px] font-bold transition-colors"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookService(srv)}
                    className="p-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors"
                    title="Book this service"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
