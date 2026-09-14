import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { YouTubeEmbed } from '../../components/ui/YouTubeEmbed';
import { formatCurrency } from '../../utils/formatters';
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
  Eye
} from 'lucide-react';

export const ServiceDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

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

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-semibold">Loading service details & process roadmap...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-24 max-w-xl mx-auto text-center px-4">
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
    : '/ piece';

  const defaultProcessSteps = [
    {
      stepNumber: '01',
      title: 'Fiber Inspection & Optical Pre-Spotting',
      bullets: [
        'Detailed microscopic weave sensitivity & color-bleed check',
        'Ultrasonic chemical-free pre-spotting on localized blemishes',
        'Custom button and embroidery hardware protection wraps'
      ]
    },
    {
      stepNumber: '02',
      title: 'Solvent Bath & Bio-Enzyme Cleansing',
      bullets: [
        'Pure non-toxic hydrocarbon eco-solvent bath (Zero PERC chemicals)',
        'Demineralized RO soft water cycle preserving natural textile elasticity',
        'Anti-microbial sanitization neutralizing odor & allergens'
      ]
    },
    {
      stepNumber: '03',
      title: '3D Tension Steam Form Finishing',
      bullets: [
        'Computerized tension mannequin form press for suits & ethnics',
        'Vacuum cooling suction preventing shine marks or fabric scorch',
        'Collar, lapel, cuff, and pleat alignment to retail showroom standards'
      ]
    },
    {
      stepNumber: '04',
      title: '10-Point QC Check & Archival Packaging',
      bullets: [
        'Master supervisor 10-point checklist inspection under white daylight LED',
        'Breathable archival garment packaging with cedar aroma infusion',
        'Digital custody barcode scanned for live doorstep tracking'
      ]
    }
  ];

  const processSteps = service.processSteps && service.processSteps.length > 0
    ? service.processSteps
    : defaultProcessSteps;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* ─────────────────────────────────────────────────────────
          1. HERO PRODUCT SECTION: WITH GRID IMAGE ON RIGHT SIDE
      ───────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0F172A] text-white py-12 sm:py-20 lg:py-24 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F97316]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Breadcrumb Navigation */}
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Services</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: TITLE, HIGHLIGHTS, PRICE & DIRECT CTAS */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span>{service.category || 'Specialized Fabric Care'}</span>
              </div>

              {/* Service Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
                {service.title || service.name}
              </h1>

              {/* Short Summary Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {service.shortDescription || 'Experience certified master fabric care with optical fiber inspection, zero-PERC hydrocarbon solvents, and computerized tension steam finishing.'}
              </p>

              {/* 3 Value Highlight Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-slate-200">
                  <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-semibold">Pure RO Water Rinse</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-slate-200">
                  <Flame className="w-4 h-4 text-[#F97316] shrink-0" />
                  <span className="font-semibold">3D Steam Finishing</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">100% Eco Solvents</span>
                </div>
              </div>

              {/* Price Callout & Action Buttons */}
              <div className="pt-4 flex items-center gap-4 flex-wrap">
                <div className="bg-slate-900/90 border border-[#F97316]/40 rounded-2xl px-5 py-3 shadow-xl backdrop-blur-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Starting Tariff
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black font-display text-white">
                      {service.startingPrice ? formatCurrency(service.startingPrice) : 'Custom Quote'}
                    </span>
                    <span className="text-xs text-orange-400 font-bold">
                      {pricingUnit}
                    </span>
                  </div>
                </div>

                <Link to={`/book-pickup?service=${service.slug}`}>
                  <Button variant="primary" size="lg" icon={Calendar} className="shadow-luxury">
                    Book Pickup Now
                  </Button>
                </Link>

                <a 
                  href="#process"
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>View Process Steps</span>
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: HIGH-DEFINITION SERVICE IMAGE IN LUXURY FRAME */}
            <div className="lg:col-span-5">
              <div className="relative group rounded-[32px] overflow-hidden bg-slate-900 border-2 border-[#F97316]/40 shadow-[0_20px_60px_-15px_rgba(249,115,22,0.3)] transform hover:scale-[1.02] transition-all duration-500">
                
                {/* Photo Aspect Ratio Box */}
                <div className="relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden">
                  <img
                    src={service.heroImage || service.mobileImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1000&q=80'}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-extrabold text-slate-900 shadow-md">
                      {service.category || 'Specialized Service'}
                    </span>
                  </div>

                  {/* Top Right Live Process Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Master Care</span>
                  </div>

                  {/* Bottom Caption Pill */}
                  <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                        Verified Process
                      </span>
                      <h4 className="text-sm font-bold text-white font-display">
                        {service.title}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400">
                        48h Standard
                      </span>
                      <span className="text-[10px] text-slate-400 block">24h Express Avail.</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          2. DETAILED CONTENT BODY + PROCESS ROADMAP + STICKY SIDEBAR
      ───────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* MAIN COLUMN (8 COLS) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. About the Service Overview */}
            {service.detailedDescription && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>The Science of Fabric Care</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                  About {service.title}
                </h2>
                <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                  {service.detailedDescription}
                </div>
              </div>
            )}

            {/* 2. Structured Step-by-Step Process Roadmap */}
            <div id="process" className="space-y-6 scroll-mt-24">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-orange-800 text-xs font-black uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Certified Multi-Stage Protocol</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
                  What is the <span className="text-[#F97316]">Process?</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Every garment undergoes our certified 4-stage inspection, non-toxic eco-solvent cleanse, and 3D computerized tension steam press before dispatch.
                </p>
              </div>

              {/* Visual Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {processSteps.map((step, idx) => {
                  const stepNum = step.stepNumber || `0${idx + 1}`;
                  return (
                    <div
                      key={idx}
                      className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <span className="text-3xl sm:text-4xl font-black text-slate-200 font-display group-hover:text-[#F97316]/30 transition-colors">
                            {stepNum}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center font-extrabold text-xs border border-orange-200 shadow-2xs">
                            #{idx + 1}
                          </div>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 font-display group-hover:text-[#F97316] transition-colors">
                          {step.title}
                        </h3>

                        {step.bullets && step.bullets.length > 0 && (
                          <ul className="space-y-2 mt-2">
                            {step.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-snug">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#F97316]">
                        <span>Stage {stepNum} Certified Quality</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Features & What's Included */}
            {service.features && service.features.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                  What's Included in This Care Package
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

            {/* 4. YouTube Demonstration Video (If Configured) */}
            {service.youtubeUrl && (
              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Video Demonstration
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    {service.youtubeTitle || `${service.title} Live Demonstration`}
                  </h3>
                </div>
                <div className="rounded-3xl overflow-hidden shadow-luxury border border-slate-200">
                  <YouTubeEmbed url={service.youtubeUrl} title={service.youtubeTitle} />
                </div>
                {service.youtubeDescription && (
                  <p className="text-xs text-slate-500 mt-2">{service.youtubeDescription}</p>
                )}
              </div>
            )}

            {/* 5. Service-Specific FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <div className="space-y-6 pt-4">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    Clear Answers
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
              STICKY RIGHT BOOKING CARD & RELATED SERVICES (4 COLS)
          ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              {/* Main Booking Card */}
              <Card variant="luxury" className="p-6 sm:p-7 space-y-5 bg-white border-2 border-orange-200/80 shadow-luxury rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center text-xl font-black border border-orange-200 shrink-0">
                    {service.emoji || '🧺'}
                  </div>
                  <div>
                    <Badge variant="brand" size="sm">Doorstep Fleet</Badge>
                    <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                      Book {service.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Tariff:</span>
                    <strong className="text-slate-900">
                      {service.startingPrice ? `${formatCurrency(service.startingPrice)} ${pricingUnit}` : 'Custom Quote'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Turnaround:</span>
                    <strong className="text-slate-900">48 Hours</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>24h Express Delivery:</span>
                    <strong className="text-emerald-700 font-extrabold">Available at Checkout</strong>
                  </div>
                </div>

                <Link to={`/book-pickup?service=${service.slug}`} className="block">
                  <Button variant="primary" size="lg" className="w-full shadow-luxury" icon={Calendar}>
                    Book Pickup Now
                  </Button>
                </Link>

                <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No prepayment required • Pay upon delivery</span>
                </div>
              </Card>

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                    Other Specialized Services
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
  );
};
