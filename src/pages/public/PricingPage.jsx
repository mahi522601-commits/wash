import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { serviceService, DEFAULT_SERVICES } from '../../services/serviceService';
import { pricingService, INITIAL_PRICING_CONFIG } from '../../services/pricingConfig';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  ShieldCheck,
  Scale,
  CheckCircle2,
  Tag,
  ArrowRight,
  X,
  Zap,
  Truck,
  Layers,
  HeartHandshake
} from 'lucide-react';

export const PricingPage = () => {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      serviceService.getServices({ publishedOnly: true }),
      pricingService.getPricingConfig(),
    ])
      .then(([srvList, prcCfg]) => {
        if (srvList && srvList.length > 0) setServices(srvList);
        if (prcCfg) setPricingConfig(prcCfg);
      })
      .catch((err) => console.warn("Pricing data fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Tariffs', emoji: '✨' },
    { id: 'dry-cleaning', label: 'Dry Cleaning', emoji: '🧺' },
    { id: 'ironing', label: 'Steam Iron', emoji: '👔' },
    { id: 'per-kg', label: 'Per-Kg Laundry', emoji: '🫧' },
    { id: 'traditional', label: 'Sarees & Ethnic', emoji: '🥻' },
    { id: 'household', label: 'Home & Curtains', emoji: '🏠' },
    { id: 'footwear', label: 'Shoes & Bags', emoji: '👟' },
  ];

  // Helper to find service by slug or id
  const getService = (slugOrId) => {
    return services.find(s => s.slug === slugOrId || s.id === slugOrId) || 
           DEFAULT_SERVICES.find(s => s.slug === slugOrId || s.id === slugOrId) || 
           services[0];
  };

  // Curated Traditional & Ethnic Wear Tariffs
  const ethnicItems = [
    { name: 'Pattu Saree Original (>10K)', service: 'Dry Clean & Polish', desc: 'Hydrocarbon zero-chemical wash, gold zari shield', price: 900, emoji: '👑', tag: 'Luxury Silk' },
    { name: 'Silk Saree (Kanchipuram / Banarasi)', service: 'Dry Clean', desc: 'Ultrasonic spot lift, natural sheen retention', price: 220, emoji: '🥻', tag: 'Handloom' },
    { name: 'Saree with Heavy Embroidery', service: 'Dry Clean', desc: 'Stone, pearl & bead hand-protection wrapping', price: 250, emoji: '✨', tag: 'Embroidered' },
    { name: 'Saree Rolling & Polishing', service: 'Wooden Roller', desc: 'Traditional wooden roller starching & luster revive', price: 150, emoji: '🥻', tag: 'Finishing' },
    { name: 'Saree Steam Ironing Only', service: 'Steam Press', desc: 'Pleat alignment and crease-free finish', price: 60, emoji: '🥻', tag: 'Steam Press' },
    { name: 'Designer Saree Blouse', service: 'Dry Clean', desc: 'Padding & embellishment safe cleanse', price: 70, emoji: '👚', tag: 'Designer' },
    { name: 'Silk Dhoti / Kanduva', service: 'Dry Clean', desc: 'Crisp handloom fold with traditional borders', price: 140, emoji: '🧣', tag: 'Traditional' },
    { name: 'Sherwani / Bandgala Suit', service: 'Dry Clean', desc: 'Structured shoulder support & brocade care', price: 250, emoji: '🧥', tag: 'Occasion' },
    { name: 'Men Kurta (Silk / Worked)', service: 'Dry Clean', desc: 'Gentle spot lift and tension steam press', price: 150, emoji: '👘', tag: 'Ethnic' },
    { name: 'Bridal Lehanga Set (Bottom)', service: 'Dry Clean', desc: 'Multi-layer flare preservation & netting care', price: 200, emoji: '👗', tag: 'Bridal' },
  ];

  // Curated Footwear & Bags Tariffs
  const footwearItems = [
    { name: 'Sneakers & Casual Shoes', desc: 'Midsole foam whitening, lace wash & UV sterilize', price: 350, unit: 'pair', emoji: '👟', tag: 'Sneaker Lab' },
    { name: 'Sports & Running Shoes', desc: 'Deep mesh scrubbing, odor removal & anti-microbial dry', price: 350, unit: 'pair', emoji: '🏃', tag: 'Athletic' },
    { name: 'Formal Leather Shoes', desc: 'Hand foam shampoo, rich cream nourish & shine buff', price: 350, unit: 'pair', emoji: '👞', tag: 'Leather Care' },
    { name: 'Suede Boots & Loafers', desc: 'Specialized suede nap brush, stain lift & rain protection', price: 350, unit: 'pair', emoji: '🥾', tag: 'Suede Care' },
    { name: 'School & College Backpack', desc: 'Deep foam shampoo, zipper lubrication & sanitization', price: 150, unit: 'piece', emoji: '🎒', tag: 'Bags' },
    { name: 'Designer / Leather Handbag', desc: 'Supple leather conditioning, hardware polishing & shape revival', price: 250, unit: 'piece', emoji: '👜', tag: 'Luxury Bags' },
  ];

  // Curated Home & Curtains Tariffs
  const householdItems = [
    { name: 'Curtains (Sheers / Blackouts / Drapes)', method: 'Width (ft) × Height (ft) × ₹30', price: 30, unit: 'per sq. ft.', emoji: '🪟', tag: 'Curtains' },
    { name: 'Living Room Carpets & Wool Rugs', method: 'Length (ft) × Width (ft) × ₹45', price: 45, unit: 'per sq. ft.', emoji: '🧶', tag: 'Carpets' },
    { name: 'Single Blanket / Comforter', method: 'Per-piece anti-mite thermal wash', price: 200, unit: 'per piece', emoji: '🛋️', tag: 'Blankets' },
    { name: 'Double / Heavy Quilt (Razai)', method: 'Per-piece deep hygiene & fluffing', price: 300, unit: 'per piece', emoji: '🛋️', tag: 'Quilts' },
    { name: 'Single Bedsheet (Steam Press)', method: 'Per-piece precision steam iron', price: 30, unit: 'per piece', emoji: '🛏️', tag: 'Bedding' },
    { name: 'King / Double Bedsheet (Steam Press)', method: 'Per-piece precision steam iron', price: 35, unit: 'per piece', emoji: '🛏️', tag: 'Bedding' },
    { name: 'Pillow Cover (Steam Press)', method: 'Per-piece precision steam iron', price: 15, unit: 'per piece', emoji: '🛋️', tag: 'Bedding' },
    { name: 'Half Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 100, unit: 'per piece', emoji: '🪟', tag: 'Curtains' },
    { name: 'Medium Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 150, unit: 'per piece', emoji: '🪟', tag: 'Curtains' },
    { name: 'Full Long Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 300, unit: 'per piece', emoji: '🪟', tag: 'Curtains' },
  ];

  return (
    <div className="py-6 sm:py-14 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        
        {/* ─────────────────────────────────────────────────────────
            PAGE HEADER: Clean & Trustworthy
        ───────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Transparent Garment Care Tariffs</span>
          </div>

          <h1 className="text-2xl sm:text-5xl font-black text-slate-900 font-display tracking-tight leading-tight">
            Simple, Honest & <span className="text-[#F97316]">Clear Pricing</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl mx-auto">
            Zero hidden charges. European hydrocarbon dry cleaning, 100% RO softened water wash, and precision 3D tension steam press.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <Link to="/book-pickup">
              <Button variant="primary" size="md" className="rounded-full shadow-lg text-xs sm:text-sm font-bold px-6 py-2.5">
                <Calendar className="w-4 h-4 mr-2" />
                Book Doorstep Pickup ➔
              </Button>
            </Link>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            QUICK RATE SUMMARY TILES
        ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">🧺</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Dry Clean</div>
            <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">From ₹40</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">👔</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Steam Iron</div>
            <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">From ₹12</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">👕</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Wash & Fold</div>
            <div className="text-xs sm:text-sm font-black text-[#F97316] font-mono mt-0.5">₹100 / Kg</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">🫧</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Wash & Iron</div>
            <div className="text-xs sm:text-sm font-black text-[#F97316] font-mono mt-0.5">₹130 / Kg</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">👟</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Shoe Cleaning</div>
            <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">₹350 / pair</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <span className="text-xl">🪟</span>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Curtains</div>
            <div className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5">₹30 / sq.ft.</div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            FILTER BAR: Category Tabs & Real-Time Search Bar
        ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          
          {/* Horizontally Scrollable Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full pb-1 scrollbar-none snap-x">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-[#1F2937] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span className="text-sm">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input with Instant Clear */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by garment (e.g. Saree, Shirt, Shoes, Blazer, Blanket, Jeans)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl sm:rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316] font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            MAIN CONTENT: PRICE LISTS BY CATEGORY
        ───────────────────────────────────────────────────────── */}
        <div className="space-y-8 sm:space-y-12">
          
          {/* ═════════════════════════════════════════════════════════
              SECTION 1: DRY CLEANING
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'dry-cleaning') && (
            <div className="space-y-3 sm:space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center text-xl shrink-0">
                    🧺
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Dry Cleaning Per-Piece Tariff
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      European Hydrocarbon Solvent • Zero PERC • 3D Tension Steam Finishing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-xs font-bold">
                    Starts at ₹40
                  </span>
                  <Link to="/book-pickup?service=dry-cleaning">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Dry Cleaning ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Price Table / Cards */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                {/* 1. MOBILE LIST CARDS (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {[
                    ...(pricingConfig.dryCleaning?.men || []),
                    ...(pricingConfig.dryCleaning?.women || []),
                    ...(pricingConfig.dryCleaning?.common || []),
                  ]
                    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
                    .map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-orange-50/20 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            {item.emoji || '👔'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-bold text-slate-600">
                                {item.category || item.gender || 'Apparel'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.startingNote || item.rangeNote || 'Hydrocarbon solvent cleanse & 3D press'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-[#F97316] block">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">per piece</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Garment / Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Care Specification</th>
                        <th className="py-3 px-4 text-right">Standard Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {[
                        ...(pricingConfig.dryCleaning?.men || []),
                        ...(pricingConfig.dryCleaning?.women || []),
                        ...(pricingConfig.dryCleaning?.common || []),
                      ]
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-[#FFF7ED]/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="text-base">{item.emoji || '👔'}</span>
                              <span>{item.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {item.category || item.gender || 'Apparel'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {item.startingNote || item.rangeNote || 'Hydrocarbon solvent cleanse & 3D mannequin press'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#F97316]">
                              {formatCurrency(item.price)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              SECTION 2: STEAM IRONING
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'ironing') && (
            <div className="space-y-3 sm:space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
                    👔
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Steam Ironing Per-Piece Tariff
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      3D Form Pressing • Vacuum Table Crease Retention • Zero Shine Marks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    Starts at ₹12
                  </span>
                  <Link to="/book-pickup?service=ironing">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Ironing ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Price Table / Cards */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                {/* 1. MOBILE LIST CARDS (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {[
                    ...(pricingConfig.ironing?.men || []),
                    ...(pricingConfig.ironing?.women || []),
                  ]
                    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
                    .map((item) => (
                      <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-orange-50/20 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            {item.emoji || '👔'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[9px] font-bold text-slate-600">
                                {item.category || item.gender || 'Apparel'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              3D tension steam press & collar setting
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-[#F97316] block">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">per piece</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Garment / Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Finishing Treatment</th>
                        <th className="py-3 px-4 text-right">Standard Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {[
                        ...(pricingConfig.ironing?.men || []),
                        ...(pricingConfig.ironing?.women || []),
                      ]
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-[#FFF7ED]/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="text-base">{item.emoji || '👔'}</span>
                              <span>{item.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {item.category || item.gender || 'Apparel'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              3D tension steam press & sharp collar crease retention
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#F97316]">
                              {formatCurrency(item.price)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              SECTION 3: PER-KG LAUNDRY (WASH & FOLD / WASH & IRON)
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'per-kg') && (
            <div className="space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0">
                    🫧
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Per-Kg Everyday Laundry Rates
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      100% RO Soft Water • Single Customer Isolated Drums • Electronic Scale Weighed at Doorstep
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/book-pickup?service=wash-and-iron">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Per-Kg Laundry ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Per-Kg Rate Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Wash & Fold */}
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase">
                        👕 Wash & Fold
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 font-display mt-1.5">
                        RO Wash + Moisture Barrier Fold
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black font-mono text-[#F97316] block">₹100 / Kg</span>
                      <span className="text-[10px] text-slate-400">Men's clothes</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Single-drum isolated wash with imported eco-detergents, moisture-safe tumble dry, and neat store-ready hand-folding.
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600">Women's delicate wear:</span>
                    <span className="font-mono font-bold text-slate-900">₹130 / Kg</span>
                  </div>
                </div>

                {/* Wash & Iron */}
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border-2 border-[#FED7AA] shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF7ED] text-[#EA580C] text-[10px] font-black uppercase border border-[#FED7AA]">
                        🫧 Wash & Iron
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 font-display mt-1.5">
                        RO Wash + 3D Steam Press
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black font-mono text-[#F97316] block">₹130 / Kg</span>
                      <span className="text-[10px] text-slate-400">Men's clothes</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Full laundry cycle in softened RO water followed by precision steam iron press on tension vacuum tables. Ready to wear.
                  </p>

                  <div className="p-2.5 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600">Women's delicate wear:</span>
                    <span className="font-mono font-bold text-[#EA580C]">₹160 / Kg</span>
                  </div>
                </div>

              </div>

              {/* Weight Benchmark Reference */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">Average Garment Weight & Price Guide</h4>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Calculated by electronic doorstep scale</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4">Garment</th>
                        <th className="py-2.5 px-3 sm:px-4">Category</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right">Avg Weight</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right">Est. Wash & Iron</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right">Est. Wash & Fold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {[
                        { name: 'Shirt', cat: "Men's", weight: '~300 g', wi: '₹39', wf: '₹30', emoji: '👔' },
                        { name: 'Trouser / Chino', cat: "Men's", weight: '~500 g', wi: '₹65', wf: '₹50', emoji: '👖' },
                        { name: 'Jeans (Denim)', cat: "Men's", weight: '~700 g', wi: '₹91', wf: '₹70', emoji: '👖' },
                        { name: 'T-Shirt', cat: "Men's", weight: '~200 g', wi: '₹26', wf: '₹20', emoji: '👕' },
                        { name: 'Daily Saree', cat: "Women's", weight: '~400 g', wi: '₹64', wf: '₹52', emoji: '🥻' },
                        { name: 'Kurti / Top', cat: "Women's", weight: '~250 g', wi: '₹40', wf: '₹32', emoji: '👚' },
                        { name: 'Bedsheet (Single)', cat: "Household", weight: '~600 g', wi: '₹78', wf: '₹60', emoji: '🛏️' },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{row.emoji}</span>
                            <span className="truncate">{row.name}</span>
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-slate-500 text-[11px]">{row.cat}</td>
                          <td className="py-2.5 px-3 sm:px-4 text-right font-mono text-slate-700 text-[11px]">{row.weight}</td>
                          <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-[#F97316] text-[11px]">{row.wi}</td>
                          <td className="py-2.5 px-3 sm:px-4 text-right font-mono font-bold text-slate-800 text-[11px]">{row.wf}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              SECTION 4: SAREES & ETHNIC WEAR
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'traditional') && (
            <div className="space-y-3 sm:space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0">
                    🥻
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Sarees, Dhotis & Traditional Wear
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Traditional Wooden Roller Starch Polish • Pure Zari Gold Protection • Heritage Handlooms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
                    Zari & Silk Safe
                  </span>
                  <Link to="/book-pickup?service=saree-rolling">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Saree Care ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Price Table / Cards */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                {/* 1. MOBILE LIST CARDS */}
                <div className="md:hidden divide-y divide-slate-100">
                  {ethnicItems
                    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.service.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-orange-50/20 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            {item.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{item.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[9px] font-bold text-purple-700">
                                {item.tag}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-[#F97316] block">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">{item.service}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Garment / Weave</th>
                        <th className="py-3 px-4">Treatment Type</th>
                        <th className="py-3 px-4">Care Highlights</th>
                        <th className="py-3 px-4 text-right">Standard Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {ethnicItems
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.service.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FFF7ED]/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="text-base">{item.emoji}</span>
                              <span>{item.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-bold text-purple-700">
                                {item.service}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">{item.desc}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#F97316]">
                              {formatCurrency(item.price)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              SECTION 5: FOOTWEAR & BAG CARE
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'footwear') && (
            <div className="space-y-3 sm:space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0">
                    👟
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Footwear & Bag Restoration
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Midsole Whitening • Suede Revitalization • Anti-Microbial UV Sterilization
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    ₹350 / pair
                  </span>
                  <Link to="/book-pickup?service=shoe-washing">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Shoe Care ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Price Table / Cards */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                {/* 1. MOBILE LIST CARDS */}
                <div className="md:hidden divide-y divide-slate-100">
                  {footwearItems
                    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((row, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-orange-50/20 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            {row.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 text-xs truncate block">{row.name}</span>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{row.desc}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-[#F97316] block">
                            {formatCurrency(row.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">/ {row.unit}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Item & Material</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Restoration Process</th>
                        <th className="py-3 px-4 text-right">Standard Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {footwearItems
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FFF7ED]/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span>{row.emoji}</span>
                              <span>{row.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {row.tag}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">{row.desc}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#F97316]">
                              {formatCurrency(row.price)} <span className="text-[10px] text-slate-400 font-normal">/ {row.unit}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════
              SECTION 6: HOME FURNISHINGS & CURTAINS
          ═════════════════════════════════════════════════════════ */}
          {(selectedCategory === 'ALL' || selectedCategory === 'household') && (
            <div className="space-y-3 sm:space-y-4">
              
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center text-xl shrink-0">
                    🪟
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
                      Home Furnishings, Curtains & Carpets
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Allergen Extraction • Wrinkle-Free Steam Hang • Rotary Shampoo Rug Cleansing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
                    Area & Piece Tariffs
                  </span>
                  <Link to="/book-pickup?service=curtain-washing">
                    <Button variant="primary" size="sm" className="rounded-full text-xs font-bold px-4 py-1.5">
                      Book Home Care ➔
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Price Table / Cards */}
              <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-xs">
                {/* 1. MOBILE LIST CARDS */}
                <div className="md:hidden divide-y divide-slate-100">
                  {householdItems
                    .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.method.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((row, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-orange-50/20 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            {row.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 text-xs truncate block">{row.name}</span>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{row.method}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-[#F97316] block">
                            {formatCurrency(row.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">{row.unit}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* 2. DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Furnishing Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Calculation Method</th>
                        <th className="py-3 px-4 text-right">Standard Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {householdItems
                        .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.method.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-[#FFF7ED]/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span>{row.emoji}</span>
                              <span>{row.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {row.tag}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">{row.method}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-sm text-[#F97316]">
                              {formatCurrency(row.price)} <span className="text-[10px] text-slate-400 font-normal">{row.unit}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </div>

        {/* ─────────────────────────────────────────────────────────
            SERVICE PROMISES & TRUST SIGNALS
        ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">Zero Color Bleed Guarantee</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Individual customer isolated wash drums with color-catcher sensors.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">Free Doorstep Pickup</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complimentary pickup & delivery across all Hyderabad hubs on orders above ₹499.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-display">24-48 Hr Express Speed</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Need urgent turnaround? Fast express lab processing is always available.
              </p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            BOTTOM CALL TO ACTION BANNER
        ───────────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-10 border border-slate-700 text-center space-y-4 shadow-xl">
          <h2 className="text-xl sm:text-3xl font-black font-display text-white">
            Ready for Fresh, Pristine Garments?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Book your doorstep pickup in 60 seconds. Our executive will arrive with calibrated electronic scales and secure protective hampers.
          </p>
          <div className="pt-2">
            <Link to="/book-pickup">
              <Button variant="primary" size="lg" className="rounded-full text-xs sm:text-sm font-black px-8 py-3.5 shadow-2xl">
                <Calendar className="w-4 h-4 mr-2" />
                Book Your Doorstep Pickup Now ➔
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

