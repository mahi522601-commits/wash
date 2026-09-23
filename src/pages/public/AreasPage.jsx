import React from 'react';
import { Link } from 'react-router-dom';
import { SEO_AREAS, BUSINESS_INFO, BASE_URL } from '../../data/seoData';
import { SEOHead } from '../../components/seo/SEOHead';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Phone,
  ShieldCheck,
  Truck
} from 'lucide-react';

export const AreasPage = () => {
  // Generate ItemList & Breadcrumb Schema
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
            name: 'Service Areas',
            item: `${BASE_URL}/areas`,
          },
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${BASE_URL}/#localbusiness`,
        name: BUSINESS_INFO.name,
        telephone: BUSINESS_INFO.telephone,
        url: `${BASE_URL}/areas`,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: BUSINESS_INFO.address,
        areaServed: SEO_AREAS.map((a) => ({
          '@type': 'AdministrativeArea',
          name: a.name,
        })),
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Laundry & Dry Cleaning Service Areas in Hyderabad | Tech Wash"
        description="Explore Tech Wash laundry, dry cleaning, steam ironing, and shoe care service areas across Hyderabad. Free doorstep pickup in Manikonda, Puppalaguda, Khajaguda, Lanco Hills & more."
        canonicalUrl={`${BASE_URL}/areas`}
        keywords="laundry hyderabad service areas, dry cleaning manikonda, puppalaguda laundry pickup, khajaguda steam iron, lanco hills dry cleaner, narsingi wash and fold"
        structuredData={structuredData}
      />

      <div className="py-16 sm:py-24 bg-brand-50 min-h-screen relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Hyderabad Doorstep Service Network</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Laundry & Dry Cleaning <br />
              <span className="text-[#F97316]">Service Areas in Hyderabad</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              We provide prompt doorstep laundry pickup, 100% demineralized RO soft water washing, and eco-friendly European hydrocarbon dry cleaning across West Hyderabad's premier residential corridors and tech hubs.
            </p>
          </div>

          {/* Quick Highlight Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Truck className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">Daily Slots</div>
              <div className="text-xs text-slate-500 mt-1">8:00 AM – 9:00 PM Pickup</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Clock className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">24-48 Hours</div>
              <div className="text-xs text-slate-500 mt-1">Standard & Express Delivery</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Sparkles className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">0 PPM Soft Water</div>
              <div className="text-xs text-slate-500 mt-1">Fiber-safe RO Washing</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <ShieldCheck className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">Non-Toxic PERC 0%</div>
              <div className="text-xs text-slate-500 mt-1">Pure Hydrocarbon Dry Clean</div>
            </div>
          </div>

          {/* 8 Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {SEO_AREAS.map((area) => (
              <Card
                key={area.slug}
                variant="luxury"
                className="overflow-hidden flex flex-col justify-between group hover:border-[#F97316]/50 transition-all p-7 sm:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Pincode: {area.pincodes.join(', ')}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight group-hover:text-[#F97316] transition-colors">
                        {area.name}
                      </h2>
                    </div>
                    <Badge variant="royal" size="sm">Active Hub</Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {area.introText}
                  </p>

                  {/* Landmarks Tag Cloud */}
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-2">Key Landmarks & Societies:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {area.landmarks.map((landmark, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                        >
                          {landmark}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Core Intent Quick Links */}
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <Link
                      to={`/areas/${area.slug}/laundry-service`}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-medium border border-orange-200/60 transition-colors"
                    >
                      Laundry Service
                    </Link>
                    <Link
                      to={`/areas/${area.slug}/dry-cleaning`}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-medium border border-orange-200/60 transition-colors"
                    >
                      Dry Cleaning
                    </Link>
                    <Link
                      to={`/areas/${area.slug}/laundry-pickup-delivery`}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-medium border border-orange-200/60 transition-colors"
                    >
                      Pickup & Delivery
                    </Link>
                  </div>

                  {/* Highlights */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                      <span>{area.turnaround}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Doorstep Pickup: {area.pickupHours}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Link
                    to={`/areas/${area.slug}`}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F97316] hover:text-[#EA580C] transition-colors"
                  >
                    <span>View {area.name} Hub</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link to={`/book-pickup?locality=${encodeURIComponent(area.name)}`}>
                    <Button variant="primary" size="sm" icon={Calendar}>
                      Book Pickup
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Call to Action */}
          <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Need Laundry in Another Nearby Area?</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
                We Cover Your Neighborhood
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                Even if your specific lane is not listed above, our doorstep fleet covers surrounding areas in West Hyderabad with free scheduled pickups.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link to="/book-pickup">
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Pickup
                </Button>
              </Link>
              <a href={`tel:${BUSINESS_INFO.telephone.replace(/\D/g, '')}`}>
                <Button variant="secondary" size="lg" icon={Phone}>
                  Call Concierge
                </Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
