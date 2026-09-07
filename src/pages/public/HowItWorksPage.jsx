import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { HowItWorksSection } from '../../components/public/HowItWorksSection';
import { 
  Sparkles, 
  Calendar
} from 'lucide-react';

export const HowItWorksPage = () => {

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Science of Garment Care</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            How Tech Wash Works
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Discover the scientific precision behind every load. From doorstep collection to computerized moisture control and European steam finishing.
          </p>
        </div>

        {/* 6-Stage Flow Animation Roadmap */}
        <HowItWorksSection />

        {/* Hygiene Standards Card */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl space-y-6">
            <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Our Hygiene & Quality Promise
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We never mix garments between different customers. Every household order is washed in dedicated sanitised drums using pure RO softened water to preserve fabric luster and prevent germ cross-contamination.
            </p>
            <div className="pt-4">
              <Link to="/book-pickup">
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Your First Pickup
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
