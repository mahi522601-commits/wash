import React from 'react';
import { YouTubeEmbed } from '../ui/YouTubeEmbed';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const VideoShowcase = ({ videoUrl = '', title = '', description = '' }) => {
  const defaultUrl = videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Safe fallback if no URL configured
  const displayTitle = title || 'Inside Tech Wash: German Technology Garment Care';
  const displayDescription = description || 'Take a behind-the-scenes look at our automated hydrocarbon cleaning drums, RO soft water plant, and 3D tension steam mannequins.';

  if (!videoUrl && !title) return null;

  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Technology in Action</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
              {displayTitle}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {displayDescription}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Enclosed hydrocarbon solvent recovery (zero chemical vapor leakage)</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>Microprocessor temperature-regulated steam tables for woolens & silks</span>
              </div>
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>100% UV-C sterilization for footwear and outerwear</span>
              </div>
            </div>
          </div>

          {/* Right Video Embed */}
          <div className="lg:col-span-7">
            <YouTubeEmbed url={defaultUrl} title={displayTitle} />
          </div>

        </div>

      </div>
    </section>
  );
};
