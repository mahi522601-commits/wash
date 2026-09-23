import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { YouTubeEmbed } from '../../components/ui/YouTubeEmbed';
import { formatCurrency } from '../../utils/formatters';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  HelpCircle, 
  Droplets, 
  Flame, 
  Truck,
  ChevronDown,
  ChevronUp,
  Layers,
  Clock,
  ArrowRight,
  Zap,
  Tag,
  Eye,
  Microscope,
  Check,
  Award,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Shield,
  ThumbsUp,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL, BUSINESS_INFO, SEO_AREAS } from '../../data/seoData';

const DEFAULT_PROCESS_STEPS = [
  {
    stepNumber: '01',
    title: 'Microscopic Fiber Inspection & Optical Pre-Spotting',
    shortName: 'Inspection & Pre-Spotting',
    icon: '🔬',
    duration: '15 Mins',
    equipment: 'Ultrasonic Micro-Spotter & Daylight LED Table',
    description: 'Every weave is meticulously analyzed under high-CRI white LED daylight lamps to detect fiber composition, dye stability, and invisible protein or oil stains before washing.',
    bullets: [
      'Microscopic fiber sensitivity & color-bleed inspection',
      'Ultrasonic chemical-free localized spot dissolution',
      'Protective masking on delicate designer hardware & 24k gold zari'
    ],
    chemistry: 'Targeted bio-enzyme botanical agents calibrated to stain pH'
  },
  {
    stepNumber: '02',
    title: 'Pure Hydrocarbon Eco-Solvent Cleansing Bath',
    shortName: 'Eco-Solvent Bath',
    icon: '💧',
    duration: '35 Mins',
    equipment: 'Closed-Loop European Hydrocarbon System',
    description: 'We reject toxic PERC chemicals. Garments are gently cleansed in a temperature-calibrated bath of pure European hydrocarbon solvents and mineral-free RO demineralized water.',
    bullets: [
      '100% Non-toxic eco-hydrocarbon solvents (Zero chemical odor)',
      '0 PPM Demineralized RO soft water preserving textile natural oils',
      'Anti-microbial ozone chamber neutralizing bacteria and allergen particles'
    ],
    chemistry: 'Hydrocarbon solvent extraction • 0% PERC • Hypoallergenic'
  },
  {
    stepNumber: '03',
    title: '3D Tension Steam Form Finishing & Crease Alignment',
    shortName: '3D Steam Form Press',
    icon: '♨️',
    duration: '20 Mins',
    equipment: 'Ergonomic 3D Tension Mannequin & Vacuum Table',
    description: 'Rather than using abrasive flat irons that leave shiny scorch marks, garments are inflated on computerized tension steam mannequins to restore factory drape and silhouette.',
    bullets: [
      'Computerized tension steam press reshaping collars, shoulders & lapels',
      'Instant vacuum cooling suction locking in crisp razor-sharp creases',
      'Zero heat burns, shine marks, or compressed seam impressions'
    ],
    chemistry: '140°C Micro-vapor steam press • Cold-suction crease setting'
  },
  {
    stepNumber: '04',
    title: '10-Point Certified QC & Archival Packaging',
    shortName: '10-Point QC & Packaging',
    icon: '🛡️',
    duration: '10 Mins',
    equipment: '360° Inspection Chamber & Archival Garment Seal',
    description: 'A master quality controller verifies all seams, zippers, and fabric feel against our 10-point checklist before sealing in breathable archival garment covers with natural cedar aroma.',
    bullets: [
      'Master supervisor 10-point checklist under daylight illumination',
      'Breathable sealed garment packaging with cedar aroma infusion',
      'Digital barcode scan triggering instant WhatsApp & SMS dispatch notification'
    ],
    chemistry: 'Natural cedar wood anti-moth infusion • Dust-proof sealed wrap'
  }
];

export const ServiceDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Interactive Stage Simulator State
  const [activeStage, setActiveStage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Sticky interactive estimator state
  const [estimateQty, setEstimateQty] = useState(2);
  const [isExpress, setIsExpress] = useState(false);

  useEffect(() => {
    setLoading(true);
    serviceService.getServiceBySlug(slug)
      .then((data) => {
        setService(data);
        if (data) {
          serviceService.getServices({ publishedOnly: true })
            .then((all) => setRelatedServices(all.filter(s => s.id !== data.id).slice(0, 3)));
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Auto-play stage simulator timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % DEFAULT_PROCESS_STEPS.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 p-4">
        <AdvancedLogoLoader
          size="lg"
          text="Calibrating Garment Care Process..."
          subtext="Loading European Eco-Solvent & 3D Steam Specifications"
          showDynamicStages={true}
        />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-28 max-w-xl mx-auto text-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#F97316] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Service Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">The requested service could not be located or has been archived.</p>
        <Link to="/services">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Back to All Services
          </Button>
        </Link>
      </div>
    );
  }

  const pricingUnit = service.pricingType === 'per_kg' ? '/ kg' 
    : service.pricingType === 'per_sqft' ? '/ sq.ft' 
    : service.pricingType === 'per_pair' ? '/ pair' 
    : '/ item';

  const rawSteps = service.processSteps && service.processSteps.length > 0
    ? service.processSteps
    : DEFAULT_PROCESS_STEPS;

  const currentStageData = DEFAULT_PROCESS_STEPS[activeStage] || DEFAULT_PROCESS_STEPS[0];

  const basePrice = service.startingPrice || 40;
  const expressSurcharge = isExpress ? 50 : 0;
  const estimatedTotal = (basePrice * estimateQty) + expressSurcharge;

  // Calculate ETA dates
  const now = new Date();
  const deliveryHours = isExpress ? 24 : 48;
  const etaDate = new Date(now.getTime() + deliveryHours * 60 * 60 * 1000);
  const formattedEta = etaDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const serviceTitle = service.title || service.name || 'Service';
  const pageMetaTitle = `${serviceTitle} Services in Hyderabad | Tech Wash`;
  const pageMetaDesc = service.shortDescription || `${serviceTitle} in Hyderabad with 100% demineralized RO soft water and eco-friendly solvents. Doorstep pickup across Manikonda, Puppalaguda, Khajaguda & Hyderabad.`;

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
            name: 'Services',
            item: `${BASE_URL}/services`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: serviceTitle,
            item: `${BASE_URL}/services/${service.slug}`,
          },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${BASE_URL}/services/${service.slug}#service`,
        name: serviceTitle,
        serviceType: service.category || 'Garment Care',
        description: pageMetaDesc,
        provider: {
          '@type': 'DryCleaningOrLaundry',
          name: BUSINESS_INFO.name,
          telephone: BUSINESS_INFO.telephone,
          url: BASE_URL,
          address: BUSINESS_INFO.address,
        },
        areaServed: SEO_AREAS.map((a) => ({
          '@type': 'AdministrativeArea',
          name: `${a.name}, Hyderabad`,
        })),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: service.startingPrice || 40,
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: service.startingPrice || 40,
            priceCurrency: 'INR',
            unitText: pricingUnit,
          },
          availability: 'https://schema.org/InStock',
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title={pageMetaTitle}
        description={pageMetaDesc}
        canonicalUrl={`${BASE_URL}/services/${service.slug}`}
        keywords={`${serviceTitle.toLowerCase()} hyderabad, dry cleaning hyderabad, steam ironing manikonda, laundry pickup hyderabad`}
        structuredData={structuredData}
      />
      <div className="bg-slate-50 min-h-screen pb-24">
      
      {/* ─────────────────────────────────────────────────────────
          1. ULTRA-LUXURY HERO HEADER WITH LIVE STATUS & IMAGE
      ───────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#1E293B] text-white py-12 sm:py-16 lg:py-20 overflow-hidden border-b border-slate-800">
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#F97316]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Top Breadcrumb & Live Fleet Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Services Catalog</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Doorstep Fleet Active in Hyderabad • Slots Open</span>
            </div>
          </div>

          {/* Main Hero Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* LEFT COLUMN: HERO INFORMATION & ACTIONS */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-400/40 text-orange-300 text-xs font-extrabold uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span>{service.category || 'Specialized Fabric Care'}</span>
              </div>

              {/* Service Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.08]">
                {service.title || service.name}
              </h1>

              {/* Short Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {service.shortDescription || 'Certified master garment care engineered with optical fiber mapping, eco-friendly closed-loop hydrocarbon solvents, and 3D computerized tension steam press.'}
              </p>

              {/* 3 Metric Value Pillars */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-lg sm:text-xl font-black text-orange-400">99.8%</div>
                  <div className="text-[11px] text-slate-300 font-medium">Stain Release</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-lg sm:text-xl font-black text-cyan-400">0 PPM</div>
                  <div className="text-[11px] text-slate-300 font-medium">RO Soft Water</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="text-lg sm:text-xl font-black text-emerald-400">0% PERC</div>
                  <div className="text-[11px] text-slate-300 font-medium">Zero Toxins</div>
                </div>
              </div>

              {/* Price Callout & Action Buttons */}
              <div className="pt-4 flex items-center gap-4 flex-wrap">
                <div className="bg-slate-900/90 border border-[#F97316]/50 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Transparent Tariff
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-display text-white">
                      {service.startingPrice ? formatCurrency(service.startingPrice) : 'Custom Quote'}
                    </span>
                    <span className="text-xs text-orange-400 font-extrabold">
                      {pricingUnit}
                    </span>
                  </div>
                </div>

                <Link to={`/book-pickup?service=${service.slug}`}>
                  <Button variant="primary" size="lg" icon={Calendar} className="shadow-[0_10px_35px_rgba(249,115,22,0.4)] hover:shadow-[0_15px_45px_rgba(249,115,22,0.6)]">
                    Book Doorstep Pickup
                  </Button>
                </Link>

                <a 
                  href="#interactive-process"
                  className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Explore Process Simulator</span>
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: HIGH-DEFINITION MATCHING IMAGE CARD */}
            <div className="lg:col-span-5">
              <div className="relative group rounded-[36px] overflow-hidden bg-slate-900 border-2 border-[#F97316]/50 shadow-[0_25px_70px_-15px_rgba(249,115,22,0.35)] transition-all duration-700 hover:shadow-[0_35px_90px_-15px_rgba(249,115,22,0.5)]">
                
                {/* Image Container with Dynamic Scale */}
                <div className="relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden">
                  <img
                    src={service.heroImage || service.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1000&q=80'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-extrabold text-slate-900 shadow-lg">
                      {service.category || 'Specialized Service'}
                    </span>
                  </div>

                  {/* Top Right Live Certification Pill */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                    <span>Certified Care</span>
                  </div>

                  {/* Bottom Image Control Box */}
                  <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/15 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-orange-400 tracking-wider block">
                        Multi-Stage Care
                      </span>
                      <h4 className="text-sm font-bold text-white font-display">
                        {service.title}
                      </h4>
                    </div>

                    <a
                      href="#interactive-process"
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F97316] to-amber-500 text-white font-black text-xs flex items-center gap-1 hover:scale-105 transition-transform"
                    >
                      <span>4 Stages</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          2. INTERACTIVE STAGE SIMULATOR (ADVANCED ANIMATED ROADMAP)
      ───────────────────────────────────────────────────────── */}
      <section id="interactive-process" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-20">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300/60 text-xs font-black uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Interactive Process Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900">
            What is the <span className="text-[#F97316]">Process?</span>
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Click through our 4 certified stages or let the simulator guide you through our chemical-free fabric restoration journey.
          </p>
        </div>

        {/* STAGE SELECTOR TABS WITH ANIMATED PROGRESS BAR */}
        <div className="space-y-4">
          
          {/* 4 Interactive Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEFAULT_PROCESS_STEPS.map((st, idx) => {
              const isActive = activeStage === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveStage(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                    isActive
                      ? 'bg-slate-900 text-white border-orange-500 shadow-xl scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xl">{st.icon}</span>
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#F97316] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      STAGE {st.stepNumber}
                    </span>
                  </div>

                  <span className={`text-xs font-bold font-display line-clamp-1 ${
                    isActive ? 'text-white' : 'text-slate-900 group-hover:text-[#F97316]'
                  }`}>
                    {st.shortName}
                  </span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Simulator Playback Controls */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-semibold">
              <span>Viewing Stage {activeStage + 1} of 4</span>
              <span className="text-slate-300">•</span>
              <span className="text-orange-600 font-bold">{currentStageData.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveStage((prev) => (prev - 1 + 4) % 4);
                  setIsAutoPlaying(false);
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-all shadow-xs"
                title="Previous Stage"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-all shadow-xs"
                title={isAutoPlaying ? "Pause Auto-Simulator" : "Play Auto-Simulator"}
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current text-orange-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStage((prev) => (prev + 1) % 4);
                  setIsAutoPlaying(false);
                }}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-all shadow-xs"
                title="Next Stage"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE STAGE SPOTLIGHT CARD (ANIMATED) */}
        <div 
          key={activeStage}
          className="bg-white rounded-[36px] p-6 sm:p-10 border-2 border-orange-200/80 shadow-luxury animate-fade-in relative overflow-hidden space-y-6"
        >
          {/* Top Stage Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F97316] to-amber-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                {currentStageData.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#F97316] font-black text-[10px] tracking-wider uppercase">
                    STAGE {currentStageData.stepNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Duration: ~{currentStageData.duration}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
                  {currentStageData.title}
                </h3>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equipment Used</span>
              <strong className="text-xs text-slate-800 font-display block mt-0.5">{currentStageData.equipment}</strong>
            </div>
          </div>

          {/* Description & Detailed Bullets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                {currentStageData.description}
              </p>

              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Mandatory Execution Checklist
                </span>
                {currentStageData.bullets.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Chemistry & Protocol Specs</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {currentStageData.chemistry}
                </p>
                <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Zero-Shrinkage Guarantee</span>
                  <span className="text-emerald-400 font-bold">100% Verified</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Handled exclusively by senior certified fabric specialists with 5+ years experience.
                </span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────
          3. SCIENCE COMPARISON MATRIX + STICKY ESTIMATOR SIDEBAR
      ───────────────────────────────────────────────────────── */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* MAIN COLUMN (8 COLS) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Detailed Description */}
            {service.detailedDescription && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Fabric Care Philosophy</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                  About {service.title}
                </h3>
                <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                  {service.detailedDescription}
                </div>
              </div>
            )}

            {/* Eco Care vs Traditional Dry Cleaning Table */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>The Tech Wash Advantage</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Traditional Laundry vs. Tech Wash Care
              </h3>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-2 text-xs sm:text-sm font-display font-black border-b border-slate-200">
                  <div className="p-4 bg-slate-100 text-slate-600">Traditional Cleaners</div>
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
                    <span>Tech Wash Master Care</span>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 p-4 gap-4">
                    <div className="text-slate-500">❌ Toxic PERC chemicals leaving strong odors</div>
                    <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>100% Odorless European Eco Hydrocarbon</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 gap-4">
                    <div className="text-slate-500">❌ Hard municipal tap water with harsh minerals</div>
                    <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>0 PPM Demineralized RO softened water</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 gap-4">
                    <div className="text-slate-500">❌ Abrasive hot plate ironing creating shiny lapels</div>
                    <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>3D Mannequin form tension steam pressing</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 gap-4">
                    <div className="text-slate-500">❌ No digital tracking or custody receipts</div>
                    <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Live 10-stage WhatsApp & web order tracker</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Benefits List */}
            {service.features && service.features.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  What's Included in This Service
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3.5 hover:border-orange-300 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Video Demonstration */}
            {service.youtubeUrl && (
              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Laboratory Demonstration
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    {service.youtubeTitle || `${service.title} Live Demonstration`}
                  </h3>
                </div>
                <div className="rounded-3xl overflow-hidden shadow-luxury border border-slate-200">
                  <YouTubeEmbed url={service.youtubeUrl} title={service.youtubeTitle} />
                </div>
              </div>
            )}

            {/* Service-Specific FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <div className="space-y-6 pt-4">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Helpful Information
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display mt-1">
                    Frequently Asked Questions
                  </h3>
                </div>

                <div className="space-y-3">
                  {service.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all ${
                          isOpen ? 'border-orange-300 bg-orange-50/20 shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base select-none"
                        >
                          <span className="font-display">{faq.question || faq.q}</span>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOpen ? 'bg-[#F97316] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed">
                            {faq.answer || faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ─────────────────────────────────────────────────────────
              STICKY RIGHT COLUMN: INSTANT ESTIMATOR & BOOKING CARD
          ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Interactive Estimator & Booking Card */}
              <div className="p-6 sm:p-7 space-y-6 bg-white border-2 border-orange-200/90 shadow-luxury rounded-[32px]">
                
                {/* Header with Emoji */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                    {service.emoji || '🧺'}
                  </div>
                  <div>
                    <Badge variant="brand" size="sm">Instant Estimate</Badge>
                    <h4 className="text-base font-bold text-slate-900 font-display mt-0.5">
                      {service.title}
                    </h4>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Estimated Quantity / Units:</span>
                    <span className="text-orange-600 font-extrabold">{estimateQty} {pricingUnit.replace('/', '')}s</span>
                  </div>
                  <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEstimateQty(Math.max(1, estimateQty - 1))}
                      className="w-10 h-10 rounded-xl bg-white text-slate-800 font-black border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-lg active:scale-95 transition-transform"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-mono font-black text-lg text-slate-900">
                      {estimateQty}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEstimateQty(estimateQty + 1)}
                      className="w-10 h-10 rounded-xl bg-white text-slate-800 font-black border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-lg active:scale-95 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Turnaround Speed Toggle */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Select Turnaround Speed:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsExpress(false)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        !isExpress
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] font-bold">Standard</div>
                      <div className="text-[10px] text-slate-400">48 Hours</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExpress(true)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isExpress
                          ? 'bg-[#F97316] text-white border-[#F97316] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] font-bold">⚡ Express</div>
                      <div className="text-[10px] text-orange-200">24 Hours (+₹50)</div>
                    </button>
                  </div>
                </div>

                {/* Estimated Delivery Forecast */}
                <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Estimated Ready Date:</span>
                    <strong className="text-slate-900">{formattedEta}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Doorstep Pickup Fleet:</span>
                    <span className="text-emerald-700 font-bold">Free above ₹299</span>
                  </div>
                </div>

                {/* Total Calculated Estimate */}
                <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Estimated Cost
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-display text-slate-900">
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">+5% GST</span>
                </div>

                {/* Direct Action Button */}
                <Link to={`/book-pickup?service=${service.slug}`} className="block">
                  <Button variant="primary" size="lg" className="w-full shadow-luxury" icon={Calendar}>
                    Book Pickup with this Care
                  </Button>
                </Link>

                <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No upfront payment • Pay post delivery</span>
                </div>
              </div>

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                    Other Specialized Masteries
                  </h4>
                  <div className="space-y-3">
                    {relatedServices.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/services/${rel.slug}`}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-orange-50/60 border border-transparent hover:border-orange-200 transition-all group"
                      >
                        <img
                          src={rel.heroImage || rel.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=200&q=80'}
                          alt={rel.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#F97316] transition-colors">
                            {rel.title || rel.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {rel.startingPrice ? `From ${formatCurrency(rel.startingPrice)}` : 'Custom Quote'}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

    </div>
    </>
  );
};
