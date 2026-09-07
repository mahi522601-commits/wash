import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Calendar, Sparkles, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export const BookingCTA = () => {
  return (
    <section className="py-20 lg:py-24 bg-[#1F2937] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[#F97316]/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Pure Fabric Perfection?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
            Schedule Your Doorstep Pickup in 60 Seconds
          </h2>

          <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Experience gentle RO soft water washing, eco-friendly hydrocarbon dry cleaning, and custom 3D steam finishing delivered to your door.
          </p>

          <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
            <Link to="/book-pickup">
              <Button variant="primary" size="xl" icon={Calendar} className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-glow-orange border-none">
                Book Doorstep Pickup
              </Button>
            </Link>

            <Link to="/pricing">
              <Button variant="outline" size="xl" className="border-slate-600 text-white hover:bg-white/10 hover:border-white">
                View Price Calculator
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t border-slate-700/60 flex items-center justify-center gap-8 text-xs text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#F97316]" />
              <span>100% Quality & Fabric Guarantee</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-[#F97316]" />
              <span>Express 24-Hr Turnaround Available</span>
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};
