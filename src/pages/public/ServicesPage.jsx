import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Search,
  ArrowUpRight,
  Droplets,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp,
  Truck,
  Shield,
  Star,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL, BUSINESS_INFO, SEO_SERVICES, BUSINESS_BRANCHES, SEO_AREAS } from '../../data/seoData';

const SERVICES_FAQS = [
  {
    question: 'Which is the best dry cleaning and laundry service near me in Hyderabad?',
    answer: 'Techwash Laundry is rated #1 for dry cleaning and laundry in Hyderabad, serving Manikonda, Tolichowki, Shaikpet, Puppalaguda, Gachibowli, and Hitec City. We use 100% 0 PPM RO demineralized soft water, isolated single-customer wash drums, certified European eco-hydrocarbon solvents (zero PERC), and 3D tension steam finishing with free doorstep pickup.',
  },
  {
    question: 'Do you offer doorstep laundry pickup and delivery near me?',
    answer: 'Yes! We provide on-demand and scheduled doorstep pickup across Manikonda (500089), Tolichowki (500008), Shaikpet, Puppalaguda, Lanco Hills, Alkapoor Township, Gachibowli, Hitec City, and Jubilee Hills. Our executive arrives at your scheduled time with digital scales, providing an instant itemized bill.',
  },
  {
    question: 'How does per-kg wash & fold and wash & iron work?',
    answer: 'Wash & Fold starts at ₹100/kg, and Wash & Iron starts at ₹130/kg. Your garments are weighed transparently at your doorstep, washed exclusively in single-customer drums using hypoallergenic bio-detergents in 0 PPM soft water, dried with moisture sensors, and either precision hand-folded or steam-pressed on 3D form mannequins.',
  },
  {
    question: 'Is your dry cleaning safe for heavy silk sarees, sherwanis, and suits?',
    answer: 'Absolutely. We use certified European closed-loop hydrocarbon dry cleaning with zero perchloroethylene (PERC). This preserves gold and silver zari, intricate embroidery, delicate raw silks, and tailored suit wools without fiber stiffness or harsh chemical odors.',
  },
  {
    question: 'What is your turnaround time for laundry and dry cleaning near me?',
    answer: 'Our standard turnaround is 48 hours for complete washing, drying, steam pressing, and quality inspection. For urgent requirements, we provide express 24-hour turnaround across Manikonda, Tolichowki, and Hyderabad upon request.',
  },
  {
    question: 'Can I drop off my clothes in person at a store counter near me?',
    answer: 'Yes! You can visit any of our 3 physical branch counters: Branch 1 on Shaikpet Main Rd, Manikonda (opposite Sri Ram Nagar Colony); Branch 2 beside Dreamscape Hotel, OU Colony, Tolichowki; or Counter 3 beside Ambience Courtyard, Shaikpet. Open 8:00 AM to 9:00 PM all 7 days.',
  },
];

const LOCAL_AREAS_SERVED = [
  { name: 'Manikonda', pincode: '500089', tag: 'HQ & Main Plant', time: '60 Min Pickup' },
  { name: 'Tolichowki', pincode: '500008', tag: 'Branch 1 Counter', time: '60 Min Pickup' },
  { name: 'OU Colony', pincode: '500008', tag: 'Express Corridor', time: '60 Min Pickup' },
  { name: 'Shaikpet', pincode: '500089', tag: 'Ambience Counter', time: '45 Min Pickup' },
  { name: 'Puppalaguda', pincode: '500089', tag: 'Doorstep Fleet', time: '60 Min Pickup' },
  { name: 'Lanco Hills', pincode: '500089', tag: 'Residential Hub', time: '60 Min Pickup' },
  { name: 'Alkapoor Township', pincode: '500089', tag: 'Scheduled Route', time: '90 Min Pickup' },
  { name: 'Gachibowli', pincode: '500032', tag: 'Tech Hub Route', time: 'Same-Day Pickup' },
  { name: 'Hitec City', pincode: '500081', tag: 'Corporate Route', time: 'Same-Day Pickup' },
  { name: 'Jubilee Hills', pincode: '500033', tag: 'Couture Care', time: 'Same-Day Pickup' },
  { name: 'Narsingi & Kokapet', pincode: '500075', tag: 'High-Rise Route', time: 'Same-Day Pickup' },
];

export const ServicesPage = () => {
  const [services, setServices] = useState(() => serviceService.getDefaultServices());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  useEffect(() => {
    serviceService.getServices({ publishedOnly: true })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setServices(data);
      })
      .finally(() => setLoading(false));

    const handleServicesUpdate = () => {
      serviceService.getServices({ publishedOnly: true })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setServices(data);
        });
    };

    window.addEventListener('techwash-services-updated', handleServicesUpdate);
    return () => window.removeEventListener('techwash-services-updated', handleServicesUpdate);
  }, []);

  const categories = ['ALL', ...Array.from(new Set(services.map(s => s.category || 'General Care')))];

  const cleanSearchQuery = (query) => {
    return (query || '')
      .toLowerCase()
      .replace(/\b(near\s+me|nearby|in\s+hyderabad|in\s+manikonda|near|service|services|best)\b/gi, '')
      .trim();
  };

  const filtered = services.filter((s) => {
    const matchesCategory = selectedCategory === 'ALL' || (s.category || 'General Care') === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;

    const raw = searchQuery.toLowerCase().trim();
    const clean = cleanSearchQuery(searchQuery);
    const searchTarget = clean || raw;

    const searchableFields = [
      s.title,
      s.name,
      s.category,
      s.slug,
      s.shortDescription,
      s.detailedDescription,
      ...(s.features || []),
    ].filter(Boolean).map(f => String(f).toLowerCase());

    return searchableFields.some(field => 
      field.includes(raw) || 
      field.includes(searchTarget) || 
      searchTarget.includes(field) ||
      raw.includes(field)
    );
  });

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
            name: 'Services Near Me',
            item: `${BASE_URL}/services`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: SEO_SERVICES.map((s, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: `${s.name} Near Me`,
          url: `${BASE_URL}/services/${s.slug}`,
          description: s.metaDescription,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: SERVICES_FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'DryCleaningOrLaundry',
        '@id': `${BASE_URL}/#localbusiness`,
        name: BUSINESS_INFO.name,
        telephone: BUSINESS_INFO.telephone,
        url: BASE_URL,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: BUSINESS_INFO.address,
        geo: BUSINESS_INFO.geo,
        openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
        department: BUSINESS_BRANCHES.map(branch => ({
          '@type': 'DryCleaningOrLaundry',
          name: branch.name,
          telephone: branch.telephone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: branch.address,
            addressLocality: branch.locality,
            addressRegion: 'Telangana',
            postalCode: branch.postalCode,
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: branch.geo.latitude,
            longitude: branch.geo.longitude,
          },
        })),
      },
    ],
  };

  const QUICK_SEARCH_PILLS = [
    { label: '🧺 Dry Cleaning Near Me', query: 'dry cleaning near me' },
    { label: '🫧 Wash & Iron Near Me', query: 'wash and iron near me' },
    { label: '👕 Wash & Fold Near Me', query: 'wash and fold near me' },
    { label: '♨️ Steam Iron Near Me', query: 'ironing near me' },
    { label: '👟 Shoe Cleaning Near Me', query: 'shoe cleaning near me' },
    { label: '👗 Saree Rolling Near Me', query: 'saree rolling near me' },
    { label: '🛋️ Curtain Cleaning Near Me', query: 'curtain cleaning near me' },
    { label: '🧶 Carpet Cleaning Near Me', query: 'carpet cleaning near me' },
  ];

  return (
    <>
      <SEOHead
        title="Dry Cleaning, Laundry & Steam Pressing Near Me in Hyderabad | Techwash"
        description="Looking for the best dry cleaning, laundry or steam ironing service near you? Techwash provides 0 PPM RO soft water wash, certified eco-friendly dry cleaning, and free doorstep pickup across Manikonda, Tolichowki & Hyderabad."
        canonicalUrl={`${BASE_URL}/services`}
        keywords="dry cleaning near me, laundry near me, laundry service near me, steam iron near me, shoe cleaning near me, clothes washing near me, best dry cleaners near me, dry cleaning services hyderabad, steam ironing manikonda"
        structuredData={structuredData}
      />
      <div className="py-16 sm:py-24 bg-brand-50 min-h-screen relative overflow-hidden">
      
      {/* Background Lighting */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF7ED] border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Complete Garment Care Menu Near You</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
            Specialized Care <br />
            <span className="text-[#F97316]">Services Near Me</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Every garment is unique. Our certified fabric technicians provide customized treatment using 0 PPM RO soft water, bio-enzymes, ultrasonic stain removal, and eco-safe hydrocarbon dry cleaning. Free doorstep pickup & drop in Manikonda, Tolichowki & Hyderabad.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-brand-200 shadow-sm">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-navy-800 text-white shadow-md'
                      : 'bg-brand-50 text-slate-600 hover:text-brand-700 border border-brand-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder='Search "dry cleaning near me", fabrics...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-brand-50 border border-brand-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Near Me Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Popular:
            </span>
            {QUICK_SEARCH_PILLS.map((pill) => {
              const isActive = searchQuery.toLowerCase() === pill.query.toLowerCase();
              return (
                <button
                  key={pill.query}
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery(isActive ? '' : pill.query);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#F97316] text-white shadow-sm ring-2 ring-orange-300'
                      : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-200 hover:border-orange-200'
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Services List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-[36px] bg-slate-200/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[36px] border border-brand-200 p-8 space-y-3">
            <h3 className="text-lg font-bold text-navy-800 font-display">No services matched your search</h3>
            <p className="text-xs text-slate-500">Try clearing your filters or search query.</p>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-full bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-[36px] overflow-hidden border border-brand-200/80 shadow-luxury hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-500 flex flex-col group justify-between"
              >
                {/* Visual Image Header - Links to Service Detail Page */}
                <Link to={`/services/${service.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-navy-950 cursor-pointer">
                  <img
                    src={service.heroImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'}
                    alt={`${service.title} near me`}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-navy-800 shadow">
                      {service.category || 'Garment Care'}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-4 left-4 glass-card-dark px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white shadow-lg">
                    {service.startingPrice ? (
                      <>
                        <span className="text-[10px] uppercase font-bold text-amber-300">Starts at</span>
                        <span className="text-base font-black font-display text-white">
                          {formatCurrency(service.startingPrice)}
                        </span>
                        {service.pricingType && (
                          <span className="text-[10px] text-brand-200">
                            {service.pricingType === 'per_kg' ? '/ kg' : service.pricingType === 'per_sqft' ? '/ sq.ft' : service.pricingType === 'per_pair' ? '/ pair' : ''}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-bold text-amber-300">Price to be confirmed</span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <Link to={`/services/${service.slug}`} className="block group/link">
                      <h2 className="text-xl font-bold font-display text-navy-800 group-hover/link:text-brand-600 transition-colors flex items-center justify-between">
                        <span>{service.title}</span>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity text-brand-600" />
                      </h2>
                    </Link>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {service.shortDescription}
                    </p>

                    {/* Features Checklist */}
                    {service.features && service.features.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        {service.features.slice(0, 3).map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Details & Rates + Book Pickup + Call Button */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/services/${service.slug}`}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center border border-slate-200"
                      >
                        <span>Details & Rates</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/book-pickup?service=${service.slug}`}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#EA580C] hover:to-orange-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Pickup</span>
                      </Link>
                    </div>
                    <a
                      href="tel:6304845567"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-center shadow-xs"
                      title="Call Techwash directly at 6304845567"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Call 6304845567</span>
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Why Techwash is #1 Rated Near You - Trust Section */}
        <div className="rounded-[40px] bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 text-white p-8 sm:p-12 shadow-2xl space-y-8 border border-white/10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Certified Fabric Laboratory Standard</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
              Why Techwash is the <span className="text-[#F97316]">#1 Rated Service Near You</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              We operate commercial-grade, eco-certified garment care laboratories right here in Manikonda & Tolichowki, setting the gold standard across Hyderabad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">0 PPM RO Demineralized Water</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hyderabad tap and borewell water has harsh minerals that turn clothes yellow and brittle. We use 100% demineralized 0 PPM RO soft water for spotless, soft fabrics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Isolated Single-Customer Drums</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero batch mixing. Every single order is washed separately in an isolated, sanitized drum cycle for guaranteed hygiene and 100% piece safety.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">European Eco Hydrocarbon Dry Clean</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero toxic PERC chemicals. Our closed-loop hydrocarbon solvent process leaves suits, gowns, and silk sarees perfectly clean with zero chemical smell.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">3D Mannequin Steam Pressing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                No flat iron shine marks or scorch burns. Form tension steam mannequins inflate garments to factory drape, locking razor-sharp creases with vacuum suction.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Doorstep Digital Weighing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Transparent calibrated digital scales at your doorstep. You see the exact weight and price before handing over clothes, with instant WhatsApp receipts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">24h Express & 48h Standard</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need urgent laundry or suit pressing for an event? Express 24-hour delivery is available across Manikonda, Tolichowki, and Gachibowli on request.
              </p>
            </div>
          </div>
        </div>

        {/* Local Areas Served Near Me */}
        <div className="bg-white rounded-[40px] p-8 sm:p-12 border border-brand-200/80 shadow-luxury space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Doorstep Pickup & Delivery Coverage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-800">
              Areas Served <span className="text-[#F97316]">Near You</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Our fleet operates daily scheduled routes (8:00 AM – 9:00 PM) across all residential societies and commercial towers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {LOCAL_AREAS_SERVED.map((area, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-brand-50/60 border border-brand-100 hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-xs sm:text-sm text-navy-900 group-hover:text-[#F97316] transition-colors">
                    {area.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">{area.pincode}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>{area.tag}</span>
                  <span className="font-semibold text-orange-600">{area.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link
              to="/book-pickup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F97316] to-amber-500 hover:from-[#EA580C] hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Free Doorstep Pickup Near You</span>
            </Link>
          </div>
        </div>

        {/* Store Branches & Google Maps Counters Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>3 Physical Branches & Drop-off Counters</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-800">
              Visit Our Store Counters <span className="text-[#F97316]">Near You</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Prefer dropping off clothes in person? Visit any of our retail counters in Manikonda, Tolichowki, or Ambience Courtyard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BUSINESS_BRANCHES.map((branch) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${branch.name} ${branch.address}`
              )}`;
              return (
                <div
                  key={branch.id}
                  className="bg-white rounded-3xl p-6 border border-brand-200/80 shadow-luxury hover:shadow-luxury-hover transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#F97316] text-[10px] font-black uppercase">
                        {branch.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>8 AM – 9 PM</span>
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-navy-800 font-display">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {branch.address}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`tel:${branch.telephone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#F97316] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>{branch.telephone}</span>
                      </a>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-brand-50 hover:bg-orange-50 text-[#F97316] hover:text-[#EA580C] text-xs font-bold border border-brand-200 hover:border-orange-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Get Directions on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-[40px] p-8 sm:p-12 border border-brand-200/80 shadow-luxury space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-navy-800">
              Services Near Me <span className="text-[#F97316]">FAQ</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything you need to know about doorstep pickup, pricing, dry cleaning safety, and turnaround times.
            </p>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-slate-100">
            {SERVICES_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-navy-900 hover:text-[#F97316] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#F97316] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed pr-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
    </>
  );
};
