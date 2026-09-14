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

export const HomePage = () => {
  const { settings } = useSettings();

  const [heroSlides, setHeroSlides] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [slides, srvList, locList] = await Promise.all([
          cmsService.getItems('heroSlides', { filterActive: true }),
          serviceService.getServices({ publishedOnly: true }),
          settingsService.getLocations(),
        ]);
        setHeroSlides(slides);
        setServices(srvList);
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

  return (
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

    </div>
  );
};
