import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { serviceService } from '../../services/serviceService';
import { settingsService } from '../../services/settingsService';
import { useSettings } from '../../context/SettingsContext';

// Visual Components
import { HeroSlider } from '../../components/public/HeroSlider';
import { StatsSection } from '../../components/public/StatsSection';
import { ServicesShowcase } from '../../components/public/ServicesShowcase';
import { HowItWorksSection } from '../../components/public/HowItWorksSection';
import { VideoShowcase } from '../../components/public/VideoShowcase';
import { LocationsSection } from '../../components/public/LocationsSection';
import { TestimonialsSection } from '../../components/public/TestimonialsSection';
import { GallerySection } from '../../components/public/GallerySection';
import { BlogSection } from '../../components/public/BlogSection';
import { FAQSection } from '../../components/public/FAQSection';
import { BookingCTA } from '../../components/public/BookingCTA';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL, BUSINESS_INFO, SEO_AREAS, SEO_SERVICES } from '../../data/seoData';

export const HomePage = () => {
  const { settings } = useSettings();

  const [heroSlides, setHeroSlides] = useState([]);
  const [services, setServices] = useState(() => serviceService.getDefaultServices());
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [slides, srvList, locList] = await Promise.all([
          cmsService.getItems('heroSlides', { filterActive: true }),
          serviceService.getServices({ publishedOnly: true }),
          settingsService.getLocations(),
        ]);
        setHeroSlides(slides);
        if (Array.isArray(srvList) && srvList.length > 0) setServices(srvList);
        setLocations(locList);
      } catch (e) {
        console.warn("Home data load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const website = settings?.website || {};

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${BASE_URL}/#faq`,
    mainEntity: [
          {
            '@type': 'Question',
            name: 'Which is the best laundry service in Manikonda, Hyderabad?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tech Wash is rated the #1 best laundry and dry cleaning service in Manikonda, Hyderabad. We use 100% demineralized 0 PPM RO soft water, single-customer isolated wash drums, certified European eco-hydrocarbon dry cleaning with zero PERC, and provide daily doorstep pickup and delivery across all societies in Manikonda (500089).',
            },
          },
          {
            '@type': 'Question',
            name: 'Do you offer doorstep laundry pickup and delivery in Manikonda?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, Tech Wash provides daily doorstep laundry pickup and delivery from 8:00 AM to 9:00 PM throughout Manikonda, including Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, Puppalaguda, and Alkapoor Township. You can schedule a pickup online in 60 seconds.',
            },
          },
          {
            '@type': 'Question',
            name: 'What are laundry and dry cleaning charges in Manikonda at Tech Wash?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tech Wash offers transparent, budget-friendly rates: Steam Ironing starts at ₹12/item, Wash & Fold is ₹100/kg, Wash & Steam Iron is ₹130/kg, and Premium Eco Dry Cleaning starts at just ₹40/item.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do you ensure hygienic washing for each customer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'At Tech Wash, we guarantee 100% isolated single-customer washing machines. Your clothes are never mixed with anyone else’s garments, washed exclusively in demineralized RO soft water with German bio-enzyme detergents.',
            },
          },
        ],
      };

  return (
    <>
      <SEOHead
        title="Best Laundry Service in Manikonda, Hyderabad - Flat 20% Off | Tech Wash"
        description="Rated #1 Best Laundry Service in Manikonda, Hyderabad. Flat 20% Off + Free Doorstep Pickup & Delivery in Manikonda across Puppalaguda, OU Colony, Secretariat Colony, Lanco Hills & Alkapoor. 100% RO soft-water wash, 3D steam ironing & eco dry cleaning."
        canonicalUrl={BASE_URL}
        keywords="best laundry service in manikonda, best laundry in manikonda, laundry service in manikonda, best dry cleaners in manikonda, laundry services manikonda hyderabad, dry cleaning in manikonda, steam ironing manikonda, laundry pickup delivery manikonda, laundry shop near manikonda, dry cleaners near me manikonda"
        structuredData={structuredData}
      />
      <div className="space-y-0 overflow-hidden">
      
      {/* 1. HERO SECTION — Asymmetric Organic Masked Composition & Integrated 4-Stat Cards */}
      <HeroSlider slides={heroSlides} />

      {/* 2. PHOTO-FIRST EDITORIAL SERVICES SHOWCASE */}
      <ServicesShowcase services={services} />

      {/* 4. LARGE EDITORIAL TYPOGRAPHY STATEMENT */}
      <section className="py-20 lg:py-24 bg-[#1F2937] text-white relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[#F97316]/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>The Tech Wash Philosophy</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tighter text-white leading-[1.05] uppercase">
            YOUR CLOTHES. <br />
            <span className="text-[#F97316]">OUR CRAFT.</span>
          </h2>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            We reject harsh standard chemicals and abrasive mass-washing. Every weave receives individual fiber analysis, RO demineralized care, and tension form steam press.
          </p>
        </div>
      </section>

      {/* 5. 6-STAGE ILLUMINATED PROCESS TIMELINE */}
      <HowItWorksSection />

      {/* 7. YOUTUBE VIDEO SHOWCASE */}
      {website.showVideoShowcase !== false && (
        <VideoShowcase />
      )}

      {/* 8. MASONRY BEFORE/AFTER TRANSFORMATION GALLERY */}
      {website.showGallerySection !== false && (
        <GallerySection />
      )}

      {/* 9. LUXURY TESTIMONIALS SLIDER */}
      {website.showTestimonials !== false && (
        <TestimonialsSection />
      )}

      {/* 10. STORE LOCATIONS (Zero fabricated data) */}
      {website.showStoreLocations !== false && (
        <LocationsSection locations={locations} />
      )}

      {/* 11. FAQ ACCORDION SECTION */}
      {website.showFaqSection !== false && (
        <FAQSection />
      )}

      {/* 12. FINAL LUXURY BOOKING CTA */}
      <BookingCTA />

      {/* 13. MANIKONDA #1 LOCAL AUTHORITY & TRUST SPOTLIGHT SECTION (Positioned Above Footer) */}
      <section className="py-20 bg-gradient-to-b from-white via-brand-50/40 to-white relative overflow-hidden border-t border-brand-100/80" id="manikonda-laundry-hub">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          
          {/* Header & Local Authority Badge */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Rated #1 Garment Care in Manikonda & Hyderabad</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Best Laundry Service in <span className="text-brand-600">Manikonda, Hyderabad</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Trusted by 10,000+ residents across Secretariat Colony, OU Colony, Lanco Hills Road, Puppalaguda, and Alkapoor Township for zero-chemical-odor dry cleaning, 0 PPM RO soft-water washing, and crisp 3D steam finishing.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                <span className="text-amber-500 font-bold">★ 4.9 / 5</span>
                <span className="text-slate-500 font-normal">• 318+ Verified Google Reviews in Manikonda</span>
              </div>

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Express Doorstep Pickup Active Across 500089</span>
              </div>

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-700 shadow-2xs">
                <span>🏷️ Flat 20% Off on First Order</span>
              </div>
            </div>
          </div>

          {/* 4 Core Pillars for Manikonda Dominance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-brand-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-bold">
                🚿
              </div>
              <h3 className="font-bold text-slate-900 text-base">0 PPM RO Soft Water</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manikonda's borewell hard water degrades fabric fibers and causes whites to turn yellow. We wash 100% in pure demineralized 0 PPM RO water.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                🔒
              </div>
              <h3 className="font-bold text-slate-900 text-base">100% Isolated Drums</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero mixing of clothes. Every single order is processed in its own dedicated, sanitised machine drum with hypoallergenic bio-enzymes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
                🌿
              </div>
              <h3 className="font-bold text-slate-900 text-base">Eco Hydrocarbon Care</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Certified European hydrocarbon solvents for suits, silks, lehengas & couture wear. Zero toxic PERC chemicals, zero odor, maximum fabric life.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-brand-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <h3 className="font-bold text-slate-900 text-base">Doorstep Pickup 8AM-9PM</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Schedule pickup online in 60 seconds. Our executive arrives at your doorstep in Manikonda with electronic scales. Standard 48h / Express 24h.
              </p>
            </div>
          </div>

          {/* Transparent Manikonda Pricing & Direct Booking Matrix */}
          <div className="p-8 rounded-3xl bg-white border border-brand-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Manikonda Laundry & Dry Cleaning Rates
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  100% transparent rates across all Manikonda pincodes (500089). Free pickup on orders ₹299+.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 font-bold text-xs">
                <span>⚡ 24H Express Delivery Available</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link to="/book-pickup?service=ironing&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Steam Ironing</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹12 <span className="text-xs font-normal text-slate-400">/ item</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Ironing</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=wash-and-fold&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Wash & Fold</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹90 <span className="text-xs font-normal text-slate-400">/ Kg</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Wash & Fold</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=wash-and-iron&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Wash & Steam Iron</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹130 <span className="text-xs font-normal text-slate-400">/ Kg</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Wash & Iron</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=dry-cleaning&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Eco Dry Cleaning</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹40 <span className="text-xs font-normal text-slate-400">/ item</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Dry Cleaning</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=saree-rolling&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Saree Rolling & Polish</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹150 <span className="text-xs font-normal text-slate-400">/ saree</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Saree Rolling</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=shoe-washing&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Shoe & Sneaker Laundry</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">₹350 <span className="text-xs font-normal text-slate-400">/ pair</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Shoe Laundry</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=curtain-washing&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Curtain Cleaning</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">From ₹60 <span className="text-xs font-normal text-slate-400">/ panel</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Curtains</span> →
                </div>
              </Link>

              <Link to="/book-pickup?service=carpet-washing&locality=Manikonda" className="p-4 rounded-2xl bg-slate-50 hover:bg-brand-50 border border-slate-200/80 hover:border-brand-300 transition-all group block">
                <div className="text-xs font-semibold text-slate-500">Carpet Shampooing</div>
                <div className="text-lg font-black text-brand-600 font-display mt-0.5">₹45 <span className="text-xs font-normal text-slate-400">/ sq. ft.</span></div>
                <div className="text-[10px] text-slate-400 mt-1 group-hover:text-brand-600 font-bold flex items-center gap-1">
                  <span>Book Carpets</span> →
                </div>
              </Link>
            </div>
          </div>

          {/* Manikonda Communities & Gated Societies Serviced */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-1">
                  Daily Doorstep Pickup Fleet Coverage • Pincode 500089
                </div>
                <h3 className="text-xl font-bold text-white font-display">
                  Serving All Major Manikonda Communities Daily
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/book-pickup?locality=Manikonda"
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Schedule Pickup
                </Link>
                <Link
                  to="/areas/manikonda"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>View Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'Lanco Hills Road & Towers',
                'Trillium Apartments Manikonda',
                'Ambience Courtyard Manikonda',
                'Secretariat Colony',
                'OU Colony Shaikpet',
                'Puppalaguda Main Road',
                'Alkapoor Township',
                'Shirdi Sai Nagar',
                'Chitrapuri Colony',
                'Dollar Hills',
                'Golden Pride',
                'Diamond Hills',
                'Shaikpet Main Rd',
                'Sri Ram Nagar Colony',
              ].map((society, sIdx) => (
                <span
                  key={sIdx}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs text-slate-300 font-medium hover:border-brand-500 hover:text-white transition-all cursor-default"
                >
                  📍 {society}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
    </>
  );
};
