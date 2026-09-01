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
  Droplets
} from 'lucide-react';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceService.getServices({ publishedOnly: true })
      .then((data) => setServices(data))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(services.map(s => s.category || 'General Care')))];

  const filtered = services.filter((s) => {
    const matchesCategory = selectedCategory === 'ALL' || (s.category || 'General Care') === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.shortDescription && s.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-16 sm:py-24 bg-brand-50 min-h-screen relative overflow-hidden">
      
      {/* Background Lighting */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-brand-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Complete Garment Menu</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-navy-800 font-display tracking-tight leading-tight">
            Specialized Care <br />
            <span className="text-gradient-purple">Services Catalog</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Every garment is unique. Our certified fabric technicians provide customized treatment using RO soft water, bio-enzymes, and eco-safe hydrocarbon dry cleaning.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
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
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services, fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-brand-50 border border-brand-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
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
                {/* Visual Image Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-navy-950">
                  <img
                    src={service.heroImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'}
                    alt={service.title}
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
                  <div className="absolute bottom-4 left-4 glass-card-dark px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white">
                    <span className="text-[10px] uppercase font-bold text-cyan-300">From</span>
                    <span className="text-base font-black font-display text-white">
                      {service.startingPrice ? formatCurrency(service.startingPrice) : 'Custom'}
                    </span>
                    <span className="text-[10px] text-brand-200">{service.pricingType || 'per piece'}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display text-navy-800 group-hover:text-brand-600 transition-colors">
                      {service.title}
                    </h3>
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

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      to={`/services/${service.slug}`}
                      className="text-xs font-bold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1 group/link"
                    >
                      <span>Explore Process</span>
                      <ArrowRight className="w-3.5 h-3.5 group-link-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link to={`/book-pickup?service=${service.slug}`}>
                      <Button variant="primary" size="sm" icon={Calendar} className="text-xs rounded-full">
                        Book Pickup
                      </Button>
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
