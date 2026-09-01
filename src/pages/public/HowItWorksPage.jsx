import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProcessSteps } from '../../components/ui/ProcessSteps';
import { 
  Sparkles, 
  Calendar, 
  Truck, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  Package, 
  Home,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const HowItWorksPage = () => {
  const processRoadmap = [
    {
      stepNumber: '01',
      title: 'Digital Slot Scheduling',
      bullets: [
        'Select your garment services, preferred 1-hour time window, and express delivery preference',
        'Receive instant SMS/WhatsApp booking confirmation with pickup executive tracking'
      ]
    },
    {
      stepNumber: '02',
      title: 'Doorstep Pickup & Tagging',
      bullets: [
        'Certified executive arrives with sanitised tamper-evident garment bags',
        'Individual barcode tagging for 100% custody guarantee and item count receipt'
      ]
    },
    {
      stepNumber: '03',
      title: 'Fabric Classification & Spotting',
      bullets: [
        'High-CRI optical inspection to detect unseen stains and fiber weaknesses',
        'Targeted ultrasonic pre-spotting using German pH-calibrated bio-solvents'
      ]
    },
    {
      stepNumber: '04',
      title: 'Soft Water & Hydrocarbon Cleaning',
      bullets: [
        'RO mineral-free soft water wash with hypoallergenic bio-enzyme detergents',
        'Closed-loop hydrocarbon dry cleaning drum cycles for couture and silk sarees'
      ]
    },
    {
      stepNumber: '05',
      title: '3D Form Finishing & Steam Press',
      bullets: [
        'Tension mannequins eliminate wrinkles on blazers, suits, and jackets',
        'Vacuum table hand ironing for sharp crease retention without shine marks'
      ]
    },
    {
      stepNumber: '06',
      title: 'Final 10-Point QC & Sealed Delivery',
      bullets: [
        'Dual quality manager checklist sign-off before sealing',
        'Delivered on shoulder-support hangers or premium breathable storage covers'
      ]
    }
  ];

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

        {/* Process Roadmap */}
        <ProcessSteps
          steps={processRoadmap}
          title="End-to-End Precision Care Journey"
          subtitle="Explore the 6 key milestones your garments pass through."
        />

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
