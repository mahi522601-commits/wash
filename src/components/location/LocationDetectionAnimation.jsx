import React from 'react';
import { Sparkles, MapPin, Navigation } from 'lucide-react';

export const LocationDetectionAnimation = ({ status = 'detecting', statusText }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6 animate-fade-in">
      
      {/* Concentric Radar Pulse Container */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        
        {/* Outer Expanding Wave 1 */}
        <div className="absolute inset-0 rounded-full bg-[#6D28D9]/15 animate-ping [animation-duration:3s]" />

        {/* Outer Expanding Wave 2 */}
        <div className="absolute inset-3 rounded-full bg-[#06B6D4]/20 animate-pulse [animation-duration:2s]" />

        {/* Middle Glowing Ring */}
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-[#6D28D9]/50 animate-spin [animation-duration:8s]" />

        {/* Inner Radar Disc */}
        <div className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-[#1E1B4B] via-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_35px_rgba(6,182,212,0.6)] z-10">
          <Navigation className="w-8 h-8 text-cyan-200 animate-bounce" />
        </div>

      </div>

      {/* Dynamic Status Text */}
      <div className="space-y-2 max-w-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#6D28D9]/30 text-[#6D28D9] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>High-Precision Satellite GPS</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight">
          {status === 'found' ? 'Location Detected!' : 'Detecting Your Doorstep Coordinates...'}
        </h3>

        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          {statusText || 'Accessing device satellite sensors to pinpoint your exact building and road for seamless pickup.'}
        </p>
      </div>

    </div>
  );
};
