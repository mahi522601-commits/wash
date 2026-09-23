import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO_AREAS, SEO_SERVICES, BUSINESS_INFO, BASE_URL } from '../../data/seoData';
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  Droplets,
  Layers,
  ShoppingBag,
  Sparkle,
  Zap,
  Tag
} from 'lucide-react';
import { WhatsAppLogo } from '../../components/ui/BrandIcons';

export const AreaDetailPage = () => {
  const { areaSlug } = useParams();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const area = SEO_AREAS.find((a) => a.slug === areaSlug);

  if (!area) {
    return (
      <div className="py-24 bg-brand-50 min-h-screen text-center px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
          <MapPin className="w-12 h-12 text-[#F97316] mx-auto" />
          <h2 className="text-2xl font-black text-slate-900 font-display">Area Not Found</h2>
          <p className="text-sm text-slate-600">
            We couldn't find the requested service area. Please browse our active service corridors in Hyderabad.
          </p>
          <Link to="/areas">
            <Button variant="primary" size="md">
              View All Service Areas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Schema.org Structured Data
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
          {
            '@type': 'ListItem',
            position: 3,
            name: area.name,
            item: `${BASE_URL}/areas/${area.slug}`,
          },
        ],
      },
      {
        '@type': 'DryCleaningOrLaundry',
        '@id': `${BASE_URL}/areas/${area.slug}#localbusiness`,
        name: `${BUSINESS_INFO.name} - ${area.name}`,
        telephone: BUSINESS_INFO.telephone,
        url: `${BASE_URL}/areas/${area.slug}`,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: {
          ...BUSINESS_INFO.address,
          postalCode: area.pincodes[0] || BUSINESS_INFO.address.postalCode,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: `${area.name}, Hyderabad`,
        },
        openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
      },
      {
        '@type': 'FAQPage',
        mainEntity: area.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ],
  };

  // 3 Core Intent Gateways
  const coreIntents = [
    {
      slug: 'laundry-service',
      title: `Laundry Service in ${area.name}`,
      tag: 'Wash & Fold / Wash & Iron',
      desc: `Demineralized 0 PPM RO softened wash and steam ironing for daily clothes & office wear in ${area.name}.`,
      rate: 'From ₹100 / Kg',
      emoji: '🧺',
    },
    {
      slug: 'dry-cleaning',
      title: `Dry Cleaning in ${area.name}`,
      tag: 'Suits, Silks & Couture',
      desc: `Certified non-toxic European hydrocarbon solvent care with zero harsh chemicals for suits and sarees in ${area.name}.`,
      rate: 'Starts at ₹40 / Item',
      emoji: '🧥',
    },
    {
      slug: 'laundry-pickup-delivery',
      title: `Laundry Pickup & Delivery in ${area.name}`,
      tag: 'Doorstep Convenience',
      desc: `Scheduled doorstep collection & sealed 24-48h delivery with electronic weighing across all ${area.name} societies.`,
      rate: 'Free on Orders ₹299+',
      emoji: '🚚',
    },
  ];

  // Specific Granular Care Services
  const specializedServices = SEO_SERVICES.filter(
    (s) => !['laundry-service', 'dry-cleaning', 'laundry-pickup-delivery'].includes(s.slug)
  );

  // Resolved Nearby Areas
  const nearbyAreaObjects = area.nearbyAreas
    .map((slug) => SEO_AREAS.find((a) => a.slug === slug))
    .filter(Boolean);

  const cleanPhone = BUSINESS_INFO.telephone.replace(/\D/g, '');

  return (
    <>
      <SEOHead
        title={area.title}
        description={area.metaDescription}
        canonicalUrl={`${BASE_URL}/areas/${area.slug}`}
        keywords={area.keywords}
        structuredData={structuredData}
      />

      <div className="py-10 sm:py-16 bg-brand-50 min-h-screen relative overflow-hidden">
        {/* Ambient Lighting Glows */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#F97316]">Home</Link>
            <span>/</span>
            <Link to="/areas" className="hover:text-[#F97316]">Service Areas</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">{area.name}</span>
          </nav>

          {/* 1. HERO SECTION */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Pincode: {area.pincodes.join(', ')} • Hyderabad</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Doorstep Fleet Active in {area.name}</span>
              </div>
            </div>

            <div className="space-y-4 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
                {area.h1}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                {area.introText}
              </p>
            </div>

            {/* Trust Metric Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-[#F97316] shrink-0" />
                <div className="text-xs text-slate-700 font-bold">0 PPM RO Soft Water</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-slate-700 font-bold">Non-Toxic Hydrocarbon</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#F97316] shrink-0" />
                <div className="text-xs text-slate-700 font-bold">{area.turnaround}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="text-xs text-slate-700 font-bold">Pickup: {area.pickupHours}</div>
              </div>
            </div>

            {/* Primary Action Row */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link to={`/book-pickup?locality=${encodeURIComponent(area.name)}`}>
                <Button variant="primary" size="lg" icon={Calendar}>
                  Book Pickup in {area.name}
                </Button>
              </Link>
              <a href={`tel:${cleanPhone}`}>
                <Button variant="secondary" size="lg" icon={Phone}>
                  Call {BUSINESS_INFO.telephone}
                </Button>
              </a>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello Tech Wash, I want to book laundry pickup in ${area.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <WhatsAppLogo className="w-4 h-4 fill-current text-white" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>

          {/* 2. CORE SEARCH INTENT GATEWAY CARDS */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                High-Intent Garment Care
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
                Explore Core Services in {area.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coreIntents.map((intent) => (
                <Card
                  key={intent.slug}
                  variant="luxury"
                  className="p-7 flex flex-col justify-between group hover:border-[#F97316]/50 transition-all space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl p-2.5 rounded-2xl bg-white border border-slate-100 shadow-xs">
                        {intent.emoji}
                      </span>
                      <Badge variant="royal" size="sm">{intent.tag}</Badge>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 font-display group-hover:text-[#F97316] transition-colors">
                      {intent.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {intent.desc}
                    </p>

                    <div className="text-xs font-black text-[#F97316] font-display">
                      {intent.rate}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/areas/${area.slug}/${intent.slug}`}
                      className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
                    >
                      <span>Explore & Rates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link to={`/book-pickup?locality=${encodeURIComponent(area.name)}`}>
                      <Button variant="primary" size="sm">
                        Book
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 3. ALL SPECIALIZED CARE SERVICES */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                  Full Service Menu
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                  Specialized Fabric Care Options in {area.name}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md font-normal">
                Every service features pure softened water, non-toxic bio-enzymes, and single-customer drum hygiene.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {specializedServices.map((srv) => (
                <Card
                  key={srv.slug}
                  variant="luxury"
                  className="p-5 flex flex-col justify-between group hover:border-[#F97316]/50 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="amber" size="sm">{srv.category}</Badge>
                      <span className="text-[11px] font-black text-[#F97316] font-display">{srv.pricingDisplay}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#F97316] transition-colors">
                      {srv.name} in {area.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                      {srv.processSummary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/areas/${area.slug}/${srv.slug}`}
                      className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 4. WHY CUSTOMERS CHOOSE TECH WASH (6 FACTUAL PILLARS) */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Engineering Garment Longevity
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Why Residents in {area.name} Trust Tech Wash
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Droplets className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">0 PPM Demineralized Water</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Unlike municipal tap water, our soft water eliminates stiff chalky salt build-up and preserves fiber elasticity.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Non-Toxic European Solvents</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Certified 0% PERC dry cleaning chemistry with zero pungent fumes, safe for sensitive skin and infant wear.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Layers className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Strict Zero-Mixing Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Your wardrobe is never combined with other households. Every customer load receives its own sanitized drum.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Sparkles className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">3D Tension Steam Pressing</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Form-fitted mannequin steam tables align collars and lapels without manual iron scorch marks or shiny fabric burns.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Tag className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Electronic Doorstep Scales</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Per-kg laundry batches are weighed directly at your doorstep with transparent electronic records on your digital bill.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Truck className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Live 10-Stage Tracking</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Receive automatic WhatsApp updates at every stage from pickup to inspection, wash, steam finish, and dispatch.</p>
              </div>
            </div>
          </div>

          {/* 5. 4-STEP DOORSTEP PROCESS */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Seamless Experience
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                How Doorstep Laundry Works in {area.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3 relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  01
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Schedule Online</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Book a 60-second doorstep pickup slot between 8:00 AM and 9:00 PM on our website.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3 relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  02
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Doorstep Collection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Our rider arrives at your doorstep in {area.name} with electronic scales and barcode tracking tags.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3 relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  03
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Laboratory Care</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Garments undergo optical spot removal, RO wash or eco-dry cleaning, and 3D steam press.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3 relative">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  04
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Sealed Return</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Your wardrobe is delivered back in breathable moisture-resistant wraps within 24 to 48 hours.</p>
              </div>
            </div>
          </div>

          {/* 6. LOCAL LANDMARKS & SOCIETIES SERVED */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              Major Societies & Landmarks Served in {area.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tech Wash operates active daily doorstep pickup and express drop routes across the following prominent communities and roads in {area.name}:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              {area.landmarks.map((landmark, idx) => (
                <div 
                  key={idx}
                  className="bg-brand-50/60 p-3.5 rounded-2xl border border-brand-100 shadow-xs text-center flex flex-col items-center justify-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-[#F97316]" />
                  <span className="text-xs font-bold text-slate-800 leading-tight">{landmark}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. NEARBY AREAS WE SERVE (GEOGRAPHIC RELATIONSHIP DISCOVERY) */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Geographic Service Corridors
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Nearby Areas We Serve Around {area.name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tech Wash serves customers in {area.name} and selected nearby neighborhoods across West Hyderabad. Explore our surrounding service areas to find laundry and dry cleaning options available near your home:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {nearbyAreaObjects.map((nearby) => (
                <div
                  key={nearby.slug}
                  className="p-5 rounded-2xl bg-brand-50/50 border border-brand-100 flex flex-col justify-between space-y-3 group hover:border-[#F97316]/50 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#F97316] text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pincode: {nearby.pincodes.join(', ')}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base font-display group-hover:text-[#F97316] transition-colors">
                      {nearby.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {nearby.introText}
                    </p>
                  </div>

                  <Link
                    to={`/areas/${nearby.slug}`}
                    className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all pt-2 border-t border-slate-200/60"
                  >
                    <span>View {nearby.name} Services</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 8. GARMENTS & FABRICS TREATED */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
              Garments & Fabrics Handled in {area.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {area.commonNeeds.map((need, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
                  <CheckCircle2 className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{need}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 9. LOCATION-SPECIFIC & NEARBY FAQs */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                {area.name} Laundry & Dry Cleaning FAQs
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {area.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base font-display hover:text-[#F97316] transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-[#F97316] shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 10. FINAL CONVERSION CTA BANNER */}
          <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Doorstep Collection Across {area.name}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                Ready for Fresh, Pristine Clothes in {area.name}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                Schedule a 60-second pickup. Our executive arrives with calibrated scales and delivers your garments back fresh and sealed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link to={`/book-pickup?locality=${encodeURIComponent(area.name)}`}>
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Pickup
                </Button>
              </Link>
              <a href={`tel:${cleanPhone}`}>
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
