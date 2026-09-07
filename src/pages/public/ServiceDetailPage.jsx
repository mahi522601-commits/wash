import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { YouTubeEmbed } from '../../components/ui/YouTubeEmbed';
import { ProcessSteps } from '../../components/ui/ProcessSteps';
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
  ChevronUp
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
          // Load related
          serviceService.getServices({ publishedOnly: true })
            .then((all) => setRelatedServices(all.filter(s => s.id !== data.id).slice(0, 3)));
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading service details...</p>
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

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* 1. Hero Section for Product Page */}
      <section className="relative bg-slate-950 text-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={service.heroImage || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1600&q=80'}
            alt={service.title}
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Services</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <Badge variant="royal" size="lg">
                {service.category || 'Specialized Fabric Care'}
              </Badge>

              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
                {service.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {service.shortDescription}
              </p>

              {/* Price Callout & Action */}
              <div className="pt-4 flex items-center gap-6 flex-wrap">
                <div className="bg-slate-900/80 border border-[#F97316]/30 rounded-2xl px-5 py-3 backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Starting Rate ({service.pricingType || 'per piece'})
                  </span>
                  <span className="text-3xl font-black font-display text-[#F97316]">
                    {service.startingPrice ? formatCurrency(service.startingPrice) : 'Custom Quote'}
                  </span>
                </div>

                <Link to={`/book-pickup?service=${service.slug}`}>
                  <Button variant="primary" size="lg" icon={Calendar}>
                    Book This Service
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Guarantees Card */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-luxury space-y-4 backdrop-blur-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F97316] font-display">
                  Tech Wash Care Standards
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <Droplets className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                    <span>Pure softened RO water processing protecting delicate fibers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Flame className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                    <span>Micro-temperature 3D tension steam pressing</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>10-Point quality check with tamper-proof packaging</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <span>Doorstep pickup with live digital item custody receipt</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Detailed Service Overview & Features */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* Overview text */}
            {service.detailedDescription && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 font-display mb-4">
                  About {service.title}
                </h2>
                <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm">
                  {service.detailedDescription}
                </div>
              </div>
            )}

            {/* Features & Benefits List */}
            {service.features && service.features.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-4">
                  What's Included in This Service
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5 hover:border-brand-300 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. YouTube Embed Video (Requirement #13) */}
            {service.youtubeUrl && (
              <div className="pt-4">
                <h3 className="text-xl font-bold text-slate-900 font-display mb-4">
                  {service.youtubeTitle || `${service.title} Live Demonstration`}
                </h3>
                <YouTubeEmbed url={service.youtubeUrl} title={service.youtubeTitle} />
                {service.youtubeDescription && (
                  <p className="text-xs text-slate-500 mt-2">{service.youtubeDescription}</p>
                )}
              </div>
            )}

            {/* 4. Structured Step-by-Step Process Roadmap (Requirement #14, #15, #65) */}
            {service.processSteps && service.processSteps.length > 0 && (
              <div className="pt-6">
                <ProcessSteps
                  steps={service.processSteps}
                  title={`How We Handle Your ${service.title}`}
                  subtitle="Every item passes through distinct certified quality stages before final dispatch."
                />
              </div>
            )}

            {/* 5. Service-specific FAQs */}
            {service.faqs && service.faqs.length > 0 && (
              <div className="pt-6">
                <h3 className="text-2xl font-bold text-slate-900 font-display mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {service.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all ${
                          isOpen ? 'border-brand-300 bg-brand-50/20 shadow-sm' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base select-none"
                        >
                          <span className="font-display">{faq.question || faq.q}</span>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3">
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

          {/* Right Sticky Booking Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              <Card variant="luxury" className="p-7 space-y-6 bg-white border border-brand-200/80 shadow-luxury">
                <div>
                  <Badge variant="brand" size="sm">Doorstep Convenience</Badge>
                  <h3 className="text-xl font-bold text-slate-900 font-display mt-2">
                    Schedule Pickup for {service.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your items, preferred time slot, and delivery preference in under 60 seconds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Pricing Model:</span>
                    <span className="font-bold text-slate-900">{service.pricingType || 'per piece'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Turnaround:</span>
                    <span className="font-bold text-slate-900">48 Hours</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Express Turnaround:</span>
                    <span className="font-bold text-emerald-700">24 Hours (Available)</span>
                  </div>
                </div>

                <Link to={`/book-pickup?service=${service.slug}`} className="block">
                  <Button variant="primary" size="lg" className="w-full" icon={Calendar}>
                    Book Pickup Now
                  </Button>
                </Link>

                <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>No prepayment required. Pay after delivery.</span>
                </div>
              </Card>

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <Card variant="default" className="p-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-display mb-4">
                    Other Services You May Like
                  </h4>
                  <div className="space-y-3">
                    {relatedServices.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/services/${rel.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <img
                          src={rel.heroImage || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=200&q=80'}
                          alt={rel.title}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-600">
                            {rel.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {rel.startingPrice ? `${formatCurrency(rel.startingPrice)}` : 'Custom Quote'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
