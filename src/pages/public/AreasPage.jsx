import React from 'react';
import { Link } from 'react-router-dom';
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
  ShieldCheck,
  Truck,
  Droplets
} from 'lucide-react';

export const AreasPage = () => {
  const manikondaArea = SEO_AREAS.find((a) => a.slug === 'manikonda') || SEO_AREAS[0];

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
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Manikonda, Hyderabad, Telangana, India',
        },
      },
    ],
  };

  const cleanPhone = BUSINESS_INFO.telephone.replace(/\D/g, '');

  return (
    <>
      <SEOHead
        title="Laundry Services in Manikonda, Hyderabad | Techwash Laundry"
        description="Explore Techwash Laundry services in Manikonda, Hyderabad. Professional wash & iron, eco-friendly dry cleaning, steam pressing, shoe cleaning, and doorstep pickup across Manikonda."
        canonicalUrl={`${BASE_URL}/areas`}
        keywords="laundry service in Manikonda, laundry services in Manikonda, laundry near Manikonda, dry cleaning in Manikonda, wash and iron Manikonda"
        structuredData={structuredData}
      />

      <div className="py-16 sm:py-24 bg-brand-50 min-h-screen relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <BreadcrumbNav 
            items={[
              { name: 'Home', path: '/' },
              { name: 'Service Areas' }
            ]}
          />
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Manikonda Local SEO Hub</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Laundry Services in <br />
              <span className="text-[#F97316]">Manikonda, Hyderabad</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Techwash Laundry operates a dedicated local service network across Manikonda, Hyderabad. We provide 100% demineralized 0 PPM RO soft water washing, eco-friendly European hydrocarbon dry cleaning, and scheduled doorstep pickup across Secretariat Colony, OU Colony, Lanco Hills Road, and surrounding societies.
            </p>
          </div>

          {/* Quick Highlight Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Truck className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">Doorstep Pickup</div>
              <div className="text-xs text-slate-500 mt-1">8:00 AM – 9:00 PM Slots</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Clock className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">24-48 Hours</div>
              <div className="text-xs text-slate-500 mt-1">Standard & Express Turnaround</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <Droplets className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">0 PPM Soft Water</div>
              <div className="text-xs text-slate-500 mt-1">Fiber-Safe RO Wash</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-brand-200 shadow-sm text-center">
              <ShieldCheck className="w-6 h-6 text-[#F97316] mx-auto mb-2" />
              <div className="font-extrabold text-xl text-slate-900 font-display">Hydrocarbon 0% PERC</div>
              <div className="text-xs text-slate-500 mt-1">Non-Toxic Dry Cleaning</div>
            </div>
          </div>

          {/* Main Manikonda Area Hub Showcase Card */}
          <Card variant="luxury" className="p-8 sm:p-10 space-y-8 bg-white border border-brand-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Primary Location Hub • Pincode: 500089</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
                  Manikonda Local Service Directory
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-normal leading-relaxed">
                  Select any specialized service below for detailed pricing, treatment process, and doorstep pickup scheduling in Manikonda.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link to="/areas/manikonda">
                  <Button variant="primary" size="md" icon={ArrowRight}>
                    View Manikonda Hub
                  </Button>
                </Link>
                <Link to="/book-pickup?locality=Manikonda">
                  <Button variant="secondary" size="md" icon={Calendar}>
                    Book Pickup
                  </Button>
                </Link>
              </div>
            </div>

            {/* 11 Manikonda Service Gateways */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F97316]" />
                <span>Manikonda Service Cluster</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SEO_SERVICES.map((srv) => (
                  <Link
                    key={srv.slug}
                    to={`/areas/manikonda/${srv.slug}`}
                    className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 hover:border-[#F97316] hover:bg-white transition-all group flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="amber" size="sm">{srv.category}</Badge>
                      <span className="text-[11px] font-black text-[#F97316] font-display">{srv.pricingDisplay}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-display group-hover:text-[#F97316] transition-colors">
                        {srv.name} in Manikonda
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {srv.metaDescription}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#F97316]">
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Card>

          {/* Bottom Call to Action */}
          <div className="p-8 sm:p-12 rounded-[36px] bg-[#111827] border border-[#F97316]/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl text-white">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F97316]/15 border border-[#F97316]/40 text-[#F97316] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Doorstep Collection Across Manikonda</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black font-display tracking-tight">
                Ready for Professional Garment Care?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
                Schedule a 60-second pickup in Manikonda. Our executive arrives at your doorstep with electronic scales and delivers your clothes back fresh and crisp.
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
