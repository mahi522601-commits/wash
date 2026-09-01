import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Clock, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export const ServiceDetailCard = ({ service, onBack, onBookService }) => {
  const [showVideo, setShowVideo] = useState(false);

  if (!service) return null;

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in text-xs">
      
      {/* Top Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Services Menu</span>
      </button>

      {/* Hero Image / Video Banner */}
      <div className="relative h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <img
          src={service.heroImage || service.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80'}
          alt={service.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/80 via-transparent to-transparent flex items-end p-2.5">
          <div>
            <span className="px-2 py-0.5 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold">
              {service.category}
            </span>
            <h4 className="text-sm font-black text-white mt-0.5">{service.title}</h4>
          </div>
        </div>

        {service.youtubeUrl && (
          <button
            type="button"
            onClick={() => setShowVideo(!showVideo)}
            className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"
          >
            <Play className="w-3 h-3 text-rose-600 fill-rose-600" />
            <span>Process Video</span>
          </button>
        )}
      </div>

      {/* Video Modal / Preview */}
      {showVideo && service.youtubeUrl && (
        <div className="p-2 rounded-xl bg-slate-900 text-white space-y-1.5 animate-slide-down">
          <div className="flex justify-between items-center text-[10px] text-slate-300">
            <span>Laboratory Process Preview</span>
            <button onClick={() => setShowVideo(false)} className="text-white hover:text-rose-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <a
            href={service.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 rounded-lg bg-white/10 hover:bg-white/20 text-center text-cyan-300 font-bold text-[11px] transition-colors"
          >
            ▶ Watch "{service.youtubeTitle || 'Inside Care Lab'}" on YouTube
          </a>
        </div>
      )}

      {/* Description */}
      <p className="text-[11px] text-slate-600 leading-relaxed">
        {service.detailedDescription || service.shortDescription}
      </p>

      {/* Structured Key Highlights */}
      <div className="p-2.5 rounded-xl bg-[#F5F3FF] border border-[#6D28D9]/20 space-y-1 text-[11px]">
        <div className="font-bold text-[#6D28D9] text-[10px] uppercase tracking-wider">
          Laboratory Standards
        </div>
        {(service.features?.length > 0 ? service.features.slice(0, 3) : [
          'Fabric-safe non-toxic solvent cleansing',
          '3D tension form finishing & steam press',
          'Dual optical & tactile QC inspection'
        ]).map((feat, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-slate-700">
            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{feat}</span>
          </div>
        ))}
      </div>

      {/* Price & Primary Booking CTA */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[9px] text-slate-400 block">Starting Rate:</span>
          <span className="text-sm font-black font-mono text-[#1E1B4B]">
            {formatCurrency(service.startingPrice || 129)}
          </span>
          <span className="text-[9px] text-slate-500 ml-1 font-medium">{service.pricingType || 'per piece'}</span>
        </div>

        <button
          type="button"
          onClick={() => onBookService(service)}
          className="py-2 px-4 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <span>Book {service.title}</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
        </button>
      </div>

    </div>
  );
};
