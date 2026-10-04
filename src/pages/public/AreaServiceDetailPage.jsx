import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { SEO_AREAS, SEO_SERVICES, BUSINESS_INFO, BASE_URL, LEGACY_SLUG_MAP } from '../../data/seoData';
import { SEOHead } from '../../components/seo/SEOHead';
import { BreadcrumbNav } from '../../components/public/BreadcrumbNav';
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
  ArrowLeft,
  Tag
} from 'lucide-react';
import { WhatsAppLogo } from '../../components/ui/BrandIcons';

export const AreaServiceDetailPage = () => {
  const { areaSlug, serviceSlug } = useParams();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // 1. Check legacy slug 301 migration
  if (serviceSlug && LEGACY_SLUG_MAP[serviceSlug]) {
    return <Navigate to={`/areas/${areaSlug}/${LEGACY_SLUG_MAP[serviceSlug]}`} replace />;
  }

  // 2. Enforce Manikonda ONLY local cluster
  const area = SEO_AREAS.find((a) => a.slug === areaSlug && a.slug === 'manikonda');
  const service = SEO_SERVICES.find((s) => s.slug === serviceSlug);

  if (!area || !service) {
    return (
      <>
        <SEOHead 
          title="Page Not Found | Techwash Laundry" 
          description="The requested service or area page was not found." 
          noindex={true} 
        />
        <div className="py-24 bg-brand-50 min-h-screen text-center px-4">
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
            <MapPin className="w-12 h-12 text-[#F97316] mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 font-display">Service Not Found</h2>
            <p className="text-sm text-slate-600">
              We couldn't locate this service under Manikonda. Please browse our active Manikonda service hub.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/areas/manikonda">
                <Button variant="primary" size="sm">Manikonda Hub</Button>
              </Link>
              <Link to="/services">
                <Button variant="secondary" size="sm">View All Services</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Exact titles, H1s, and meta descriptions as per SEO Keyword Map & Rules
  const pageTitle = service.title;
  const pageH1 = service.h1;
  const pageDescription = service.metaDescription;
  const canonicalUrl = `${BASE_URL}/areas/manikonda/${service.slug}`;
  const pageKeywords = `${service.primaryKeyword}${service.secondaryKeywords ? `, ${service.secondaryKeywords}` : ''}`;

  // Localized FAQ list targeting intent
  const serviceAreaFaqs = [
    {
      question: `How does Techwash Laundry ${service.name.toLowerCase()} work in Manikonda?`,
      answer: `Our ${service.name.toLowerCase()} in Manikonda starts at ${service.pricingDisplay}. You schedule a pickup online or via WhatsApp, our rider collects your garments at your Manikonda doorstep, processes them using 0 PPM soft water or European hydrocarbon dry cleaning, and delivers them back fresh and sealed.`,
    },
    {
      question: `Is doorstep pickup available in Manikonda for ${service.name.toLowerCase()}?`,
      answer: `Yes, Techwash Laundry operates daily scheduled doorstep pickup across all apartments, gated communities, and colonies in Manikonda between 8:00 AM and 9:00 PM.`,
    },
    {
      question: `What garments are suitable for ${service.name.toLowerCase()} in Manikonda?`,
      answer: `We handle daily office wear, shirts, trousers, formal suits, blazers, delicate silk sarees, traditional dresses, shoes, curtains, and heavy living room carpets.`,
    },
    {
      question: `What is the delivery turnaround time for ${service.name.toLowerCase()} in Manikonda?`,
      answer: `Standard turnaround is 48 hours. Express 24-hour delivery is also available for urgent requirements across Manikonda upon request.`,
    },
    {
      question: `How can I schedule a ${service.name.toLowerCase()} pickup in Manikonda?`,
      answer: `You can schedule a pickup in 60 seconds on our website or call/WhatsApp us directly at ${BUSINESS_INFO.telephone}.`,
    },
  ];

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
            name: 'Areas',
            item: `${BASE_URL}/areas`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Manikonda',
            item: `${BASE_URL}/areas/manikonda`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: service.name,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: `${service.name} in Manikonda`,
        serviceType: service.name,
        category: service.category,
        description: pageDescription,
        provider: {
          '@type': 'LocalBusiness',
          '@id': `${BASE_URL}/#organization`,
          name: BUSINESS_INFO.name,
          telephone: BUSINESS_INFO.telephone,
          url: BASE_URL,
          address: {
            ...BUSINESS_INFO.address,
            postalCode: '500089',
          },
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Manikonda, Hyderabad, Telangana, India',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          description: service.pricingDisplay,
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: serviceAreaFaqs.map((f) => ({
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

  // Cross links to other Manikonda services
  const otherServicesInManikonda = SEO_SERVICES.filter((s) => s.slug !== service.slug);
  const cleanPhone = BUSINESS_INFO.telephone.replace(/\D/g, '');

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        keywords={pageKeywords}
        structuredData={structuredData}
      />

      <div className="py-10 sm:py-16 bg-brand-50 min-h-screen relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav 
            items={[
              { name: 'Home', path: '/' },
              { name: 'Areas', path: '/areas' },
              { name: 'Manikonda', path: '/areas/manikonda' },
              { name: service.name }
            ]}
          />

          {/* 1. HERO SECTION */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Manikonda, Hyderabad • Pincode: 500089</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="amber" size="sm">{service.category}</Badge>
                <Badge variant="royal" size="sm">Active Doorstep Route</Badge>
              </div>
            </div>

            <div className="space-y-4 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
                {pageH1}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                {service.metaDescription} Our specialized pickup fleet covers Manikonda daily with 24-48 hour delivery turnaround and protective garment packaging.
              </p>
            </div>

            {/* Price & Turnaround Metric Bar */}
            <div className="p-5 rounded-2xl bg-brand-50 border border-brand-200/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 block font-semibold">Transparent Pricing:</span>
                <span className="text-2xl sm:text-3xl font-black text-[#F97316] font-display">
                  {service.pricingDisplay}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F97316]" />
                  <span>Pickup Slots: <strong className="text-slate-900">8:00 AM – 9:00 PM (All 7 Days)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Turnaround: <strong className="text-slate-900">Standard 48h • 24h Express Available</strong></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link to={`/book-pickup?locality=Manikonda&service=${encodeURIComponent(service.slug)}`}>
                <Button variant="primary" size="lg" icon={Calendar}>
                  Book {service.name} in Manikonda
                </Button>
              </Link>
              <a href={`tel:${cleanPhone}`}>
                <Button variant="secondary" size="lg" icon={Phone}>
                  Call {BUSINESS_INFO.telephone}
                </Button>
              </a>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello Techwash Laundry, I want to book ${service.name} in Manikonda.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <WhatsAppLogo className="w-4 h-4 fill-current text-white" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* 2. TREATMENT PROTOCOL & PROCESS */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Laboratory Grade Quality Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Our {service.name} Process
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {service.processSummary} Every garment processed for Manikonda residents undergoes optical pre-inspection, fabric identification, individualized single-customer wash or dry clean cycles, and final 10-point quality control before being dispatched.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2.5">
                <Sparkles className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">1. Fabric Inspection & Spotting</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Optical daylight fiber mapping and bio-enzyme stain dissolution targeting oil, tannin, and protein marks.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2.5">
                <ShieldCheck className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">2. Specialized Washing / Cleaning</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Demineralized 0 PPM RO softened wash or pure European hydrocarbon solvent bath in single-customer drums.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2.5">
                <CheckCircle2 className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">3. 3D Pressing & Wrap</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Mannequin tension steam finishing, collar alignment, and breathable moisture-resistant packaging.</p>
              </div>
            </div>
          </div>

          {/* 3. 4-STEP DOORSTEP ROADMAP */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Simple & Convenient
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                How It Works in Manikonda
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-2">
                <div className="text-[#F97316] font-display font-black text-lg">01</div>
                <h3 className="font-bold text-slate-900 text-base font-display">Book Online</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Choose a time slot between 8:00 AM and 9:00 PM for pickup in Manikonda.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-2">
                <div className="text-[#F97316] font-display font-black text-lg">02</div>
                <h3 className="font-bold text-slate-900 text-base font-display">Doorstep Pickup</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Our rider arrives with electronic weighing scales and digital barcode tag logging.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-2">
                <div className="text-[#F97316] font-display font-black text-lg">03</div>
                <h3 className="font-bold text-slate-900 text-base font-display">Laboratory Care</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Processed with 0 PPM soft water or closed-loop eco-solvents with zero mixing.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-2">
                <div className="text-[#F97316] font-display font-black text-lg">04</div>
                <h3 className="font-bold text-slate-900 text-base font-display">Sealed Return</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Delivered crisp, wrapped, and protected within 24 to 48 hours.</p>
              </div>
            </div>
          </div>

          {/* 4. MANIKONDA SOCIETIES & CORRIDORS SERVED */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              Doorstep {service.name} Coverage in Manikonda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We provide scheduled doorstep collection and return delivery for {service.name.toLowerCase()} across all prominent colonies and apartment complexes in Manikonda:
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {area.landmarks.map((landmark, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-brand-50 text-slate-800 text-xs font-semibold border border-brand-200 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{landmark}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 5. FAQS */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                {service.name} in Manikonda — FAQs
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {serviceAreaFaqs.map((faq, idx) => {
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
                        <ChevronUp className="w-5 h-5 text-[#F97316]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
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

          {/* 6. OTHER SERVICES IN MANIKONDA (INTERNAL LINKING CLUSTER) */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Other Fabric Care Options in Manikonda
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/areas/manikonda"
                className="px-3.5 py-1.5 rounded-full bg-[#FFF7ED] text-[#F97316] text-xs font-bold border border-[#F97316]/40 transition-all flex items-center gap-1.5"
              >
                <MapPin className="w-3 h-3 text-[#F97316]" />
                <span>Manikonda Area Hub</span>
              </Link>
              {otherServicesInManikonda.map((s) => (
                <Link
                  key={s.slug}
                  to={`/areas/manikonda/${s.slug}`}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-[#FFF7ED] hover:text-[#F97316] hover:border-[#F97316]/40 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#F97316]" />
                  <span>{s.name} in Manikonda</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 7. FINAL CONVERSION CTA */}
          <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                Order {service.name} in Manikonda
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                Experience precision care, transparent digital billing, and prompt doorstep delivery across Manikonda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link to={`/book-pickup?locality=Manikonda&service=${encodeURIComponent(service.slug)}`}>
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Pickup
                </Button>
              </Link>
              <Link to="/areas/manikonda">
                <Button variant="secondary" size="lg" icon={ArrowLeft}>
                  Manikonda Hub
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
