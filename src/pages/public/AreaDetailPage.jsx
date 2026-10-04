import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO_AREAS, SEO_SERVICES, BUSINESS_INFO, BASE_URL } from '../../data/seoData';
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
  Layers,
  Tag
} from 'lucide-react';
import { WhatsAppLogo } from '../../components/ui/BrandIcons';

export const AreaDetailPage = () => {
  const { areaSlug } = useParams();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Validate that area belongs to SEO_AREAS (Manikonda ONLY)
  const area = SEO_AREAS.find((a) => a.slug === areaSlug);

  if (!area) {
    return (
      <>
        <SEOHead 
          title="Area Not Found | Techwash Laundry" 
          description="The requested service area was not found." 
          noindex={true} 
        />
        <div className="py-24 bg-brand-50 min-h-screen text-center px-4">
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
            <MapPin className="w-12 h-12 text-[#F97316] mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 font-display">Area Not Found</h2>
            <p className="text-sm text-slate-600">
              We couldn't find the requested service area. Please visit our Manikonda local SEO hub.
            </p>
            <Link to="/areas/manikonda">
              <Button variant="primary" size="md">
                View Manikonda Services
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const pageTitle = `Laundry Services in Manikonda, Hyderabad | Techwash Laundry`;
  const pageH1 = `Laundry Services in Manikonda, Hyderabad`;
  const pageDescription = `Professional wash and iron, dry cleaning, laundry, and garment care services in Manikonda, Hyderabad. Techwash Laundry offers convenient garment cleaning and ironing with pickup and delivery options.`;
  const canonicalUrl = `${BASE_URL}/areas/manikonda`;

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
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${canonicalUrl}#localbusiness`,
        name: `${BUSINESS_INFO.name} - Manikonda Hub`,
        telephone: BUSINESS_INFO.telephone,
        url: canonicalUrl,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: {
          ...BUSINESS_INFO.address,
          postalCode: '500089',
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Manikonda, Hyderabad, Telangana, India',
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

  const cleanPhone = BUSINESS_INFO.telephone.replace(/\D/g, '');

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={canonicalUrl}
        keywords={area.keywords}
        structuredData={structuredData}
      />

      <div className="py-10 sm:py-16 bg-brand-50 min-h-screen relative overflow-hidden">
        {/* Ambient Lighting Glows */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav 
            items={[
              { name: 'Home', path: '/' },
              { name: 'Areas', path: '/areas' },
              { name: 'Manikonda' }
            ]}
          />

          {/* 1. HERO SECTION */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Pincode: 500089 • Manikonda, Hyderabad</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Doorstep Fleet Active in Manikonda</span>
              </div>
            </div>

            <div className="space-y-4 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
                {pageH1}
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
              <Link to="/book-pickup?locality=Manikonda">
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Pickup in Manikonda
                </Button>
              </Link>
              <a href={`tel:${cleanPhone}`}>
                <Button variant="secondary" size="lg" icon={Phone}>
                  Call {BUSINESS_INFO.telephone}
                </Button>
              </a>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hello Techwash Laundry, I want to book laundry pickup in Manikonda.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <WhatsAppLogo className="w-4 h-4 fill-current text-white" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>

          {/* 2. LAUNDRY SERVICES AVAILABLE IN MANIKONDA (11 Service Links) */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                  Complete Service Directory
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
                  Laundry Services Available in Manikonda
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md font-normal">
                Click any service below to view detailed garment care procedures, pricing, and scheduling for Manikonda residents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SEO_SERVICES.map((srv) => (
                <Card
                  key={srv.slug}
                  variant="luxury"
                  className="p-6 flex flex-col justify-between group hover:border-[#F97316]/50 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="amber" size="sm">{srv.category}</Badge>
                      <span className="text-xs font-black text-[#F97316] font-display">{srv.pricingDisplay}</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 font-display group-hover:text-[#F97316] transition-colors">
                      {srv.name} in Manikonda
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {srv.metaDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/areas/manikonda/${srv.slug}`}
                      className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
                    >
                      <span>Explore {srv.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link to={`/book-pickup?locality=Manikonda&service=${encodeURIComponent(srv.slug)}`}>
                      <Button variant="primary" size="sm">
                        Book
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 3. HOW TECHWASH LAUNDRY WORKS */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Seamless Step-by-Step Flow
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                How Techwash Laundry Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  01
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Schedule Pickup</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Select a convenient 8:00 AM – 9:00 PM time slot on our website or via WhatsApp.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  02
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Doorstep Collection</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Our pickup executive arrives at your doorstep in Manikonda with calibrated electronic scales and digital tagging.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  03
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Laboratory Care</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Clothes undergo 0 PPM soft water washing or eco-friendly hydrocarbon dry cleaning with zero mixing.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-brand-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-[#F97316] font-display font-black text-lg flex items-center justify-center border border-brand-200">
                  04
                </div>
                <h3 className="font-bold text-slate-900 text-base font-display">Fresh Return</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Your garments are returned crisp, steam-pressed, and packed in protective wraps within 24 to 48 hours.</p>
              </div>
            </div>
          </div>

          {/* 4. LAUNDRY PICKUP & DELIVERY IN MANIKONDA */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Reliable Doorstep Coverage
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Laundry Pickup & Delivery in Manikonda
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Techwash Laundry operates a structured daily doorstep collection and return delivery service throughout Manikonda. Whether you reside in high-rise apartments, gated communities, or independent houses, our executives carry calibrated electronic scales for transparent per-kg digital billing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2">
                <Clock className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Daily Timed Slots</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Choose pickup slots between 8:00 AM and 9:00 PM, 7 days a week.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2">
                <Tag className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Doorstep Electronic Scales</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Per-kg weight recorded instantly on electronic scales with digital receipt confirmation.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-2">
                <Truck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Free Delivery Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Complimentary doorstep delivery on all orders above ₹299 across Manikonda.</p>
              </div>
            </div>
          </div>

          {/* 5. WHY CHOOSE TECHWASH LAUNDRY */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-sm space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Garment Longevity Standards
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Why Choose Techwash Laundry
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Droplets className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">0 PPM Demineralized RO Water</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Eliminates tap water salt deposits, preventing fabric stiffness and color fading.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Non-Toxic Hydrocarbon Solvents</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Certified 0% PERC eco-friendly dry cleaning safe for delicate silks and suits.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Layers className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Strict Zero-Mixing Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Every customer load receives an isolated drum cycle for complete hygiene.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Sparkles className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">3D Tension Steam Pressing</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Mannequin form steam tables align lapels and collars without manual iron shine.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Tag className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Transparent Digital Receipts</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Itemized digital bills sent instantly via WhatsApp upon doorstep collection.</p>
              </div>

              <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-100 space-y-2">
                <Truck className="w-6 h-6 text-[#F97316]" />
                <h3 className="font-bold text-slate-900 text-sm font-display">Live Order Status</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Automated status updates from pickup to laboratory washing, pressing, and drop.</p>
              </div>
            </div>
          </div>

          {/* 6. SERVICE AREAS AROUND MANIKONDA */}
          <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-sm space-y-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
              Service Areas Around Manikonda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Techwash Laundry active doorstep pickup routes cover all major residential colonies, apartment complexes, and commercial corridors across Manikonda:
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

          {/* 7. FREQUENTLY ASKED QUESTIONS */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                Manikonda Laundry FAQs
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

          {/* 8. CONTACT / SCHEDULE PICKUP CTA */}
          <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Schedule Pickup in Manikonda</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
                Contact & Schedule Doorstep Laundry Pickup
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                Book online in 60 seconds or reach out directly to our Manikonda doorstep dispatch team.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link to="/book-pickup?locality=Manikonda">
                <Button variant="primary" size="lg" icon={Calendar}>
                  Schedule Pickup
                </Button>
              </Link>
              <a href={`tel:${cleanPhone}`}>
                <Button variant="secondary" size="lg" icon={Phone}>
                  Call {BUSINESS_INFO.telephone}
                </Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
