import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { HowItWorksSection } from '../../components/public/HowItWorksSection';
import { 
  Sparkles, 
  Calendar
} from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';

export const HowItWorksPage = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'How It Works',
            item: `${BASE_URL}/how-it-works`,
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How Tech Wash Garment Care Works',
        description: '6-stage garment care process: Pickup, Optical Fiber Mapping, Demineralized RO Wash, Eco-Dry, 3D Tension Steam Press, and Sealed Delivery.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Doorstep Pickup',
            text: 'Schedule pickup online; our executive arrives with calibrated scales and tags.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Inspection & Spot Pre-treatment',
            text: 'Optical fiber identification and ultrasonic stain pre-spotting.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Demineralized RO Wash or Solvent Bath',
            text: 'Individualized single-customer drum wash in 0 PPM soft water or hydrocarbon solvent.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Moisture Controlled Drying',
            text: 'Anti-static sensor-controlled drying protecting textile elasticity.',
          },
          {
            '@type': 'HowToStep',
            position: 5,
            name: '3D Form Steam Ironing',
            text: 'Vacuum table and mannequin tension steam pressing.',
          },
          {
            '@type': 'HowToStep',
            position: 6,
            name: 'QC & Sealed Delivery',
            text: '10-point inspection and protective breathable wrap delivery.',
          },
        ],
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="How It Works — 6-Stage Garment Care Process | Tech Wash Hyderabad"
        description="Learn about Tech Wash's scientific 6-stage laundry and dry cleaning process: doorstep pickup, RO soft water washing, hydrocarbon eco-cleaning, and 3D steam finishing in Hyderabad."
        canonicalUrl={`${BASE_URL}/how-it-works`}
        keywords="how laundry works, dry cleaning process hyderabad, ro soft water laundry, steam pressing hyderabad"
        structuredData={structuredData}
      />
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
    </>
  );
};
