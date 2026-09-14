import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { serviceService, DEFAULT_SERVICES } from '../../services/serviceService';
import { pricingService, INITIAL_PRICING_CONFIG } from '../../services/pricingConfig';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Calendar, 
  ShieldCheck,
  Droplets,
  Scale,
  Check,
  Tag,
  Info,
  Layers,
  ArrowRight,
  Sparkle
} from 'lucide-react';

export const PricingPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [basket, setBasket] = useState([]);
  const [isExpress, setIsExpress] = useState(false);
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
    { id: 'ALL', label: 'All Services & Tariffs', emoji: '✨' },
    { id: 'dry-cleaning', label: 'Dry Cleaning', emoji: '🧺' },
    { id: 'ironing', label: 'Steam Ironing', emoji: '👔' },
    { id: 'per-kg', label: 'Per-Kg Laundry', emoji: '🫧' },
    { id: 'traditional', label: 'Sarees & Ethnic', emoji: '🥻' },
    { id: 'household', label: 'Home & Curtains', emoji: '🏠' },
    { id: 'footwear', label: 'Shoe & Bag Care', emoji: '👟' },
  ];

  // Helper to find service by slug or id
  const getService = (slugOrId) => {
    return services.find(s => s.slug === slugOrId || s.id === slugOrId) || 
           DEFAULT_SERVICES.find(s => s.slug === slugOrId || s.id === slugOrId) || 
           services[0];
  };

  // Add item to estimate basket
  const addToBasket = (name, serviceType, price, unit = '') => {
    if (price === null || price === undefined) return;
    const basketItemId = `${name}-${serviceType}`;
    setBasket((prev) => {
      const existing = prev.find((b) => b.basketItemId === basketItemId);
      if (existing) {
        return prev.map((b) => (b.basketItemId === basketItemId ? { ...b, quantity: b.quantity + 1 } : b));
      }
      return [
        ...prev,
        {
          basketItemId,
          id: `item-${Date.now()}`,
          name: `${name} (${serviceType})`,
          unitPrice: price,
          quantity: 1,
          unit,
        },
      ];
    });
  };

  const updateQuantity = (basketItemId, delta) => {
    setBasket((prev) =>
      prev
        .map((b) => {
          if (b.basketItemId === basketItemId) {
            const newQty = b.quantity + delta;
            return newQty > 0 ? { ...b, quantity: newQty } : null;
          }
          return b;
        })
        .filter(Boolean)
    );
  };

  // Live total calculation
  const itemsSubtotal = basket.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const expressFee = isExpress ? (itemsSubtotal > 0 ? 99 : 0) : 0;
  const deliveryFee = itemsSubtotal >= 499 || itemsSubtotal === 0 ? 0 : 49;
  const taxableBase = itemsSubtotal + expressFee;
  const taxAmount = Math.round(taxableBase * 0.05); // 5% GST
  const finalTotal = taxableBase + deliveryFee + taxAmount;

  const handleProceedToBooking = () => {
    navigate('/book-pickup');
  };

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#F97316] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Transparent Garment Care Tariff</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
            Official Pricing & <br />
            <span className="text-[#F97316]">Rate Card</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Zero hidden charges. Pure European hydrocarbon solvent care, RO demineralized soft water, and 3D tension steam press.
          </p>
        </div>

        {/* Filter Bar: Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#1F2937] text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items (e.g. Saree, Shirt, Shoes, Blazer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F97316] font-medium"
            />
          </div>
        </div>

        {/* Main Grid: Price Tables (8 Cols) & Live Estimate Basket (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Categorized Price Tables */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* ─────────────────────────────────────────────────────────
                SECTION 1: DRY CLEANING PRICE TABLE
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'dry-cleaning') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('dry-cleaning');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Dry Cleaning" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            🧺 {srv.title || 'Dry Cleaning'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            Starts at ₹40
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              European Hydrocarbon Dry Cleaning
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              100% PERC-free, non-toxic solvent cleansing with ultrasonic pre-spotting.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=dry-cleaning" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Dry Cleaning ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Dry Cleaning Table Card */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧺</span>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Dry Cleaning Per-Piece Rates</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Suits, Silks, Cottons & Couture</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Garment / Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Care Specification</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                          <th className="py-3 px-4 text-center">Estimate</th>
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
                            <tr key={item.id} className="hover:bg-[#FFF7ED]/40 transition-colors">
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
                                {item.startingNote || item.rangeNote || 'Hydrocarbon solvent cleanse & 3D press'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm text-[#F97316]">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToBasket(item.name, 'Dry Clean', item.price)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F97316] text-slate-700 hover:text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                SECTION 2: STEAM IRONING PRICE TABLE
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'ironing') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('ironing');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Steam Ironing" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            👔 {srv.title || 'Ironing'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            Starts at ₹12
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              3D Mannequin Tension Steam Ironing
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              Vacuum table crease retention with zero shine or heat scorch marks.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=ironing" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Ironing ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Ironing Table Card */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👔</span>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Steam Ironing Per-Piece Rates</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Crisp Collars & Sharp Creases</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Garment / Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Finishing Treatment</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                          <th className="py-3 px-4 text-center">Estimate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          ...(pricingConfig.ironing?.men || []),
                          ...(pricingConfig.ironing?.women || []),
                        ]
                          .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())))
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-[#FFF7ED]/40 transition-colors">
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
                                3D tension steam press & collar setting
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm text-[#F97316]">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToBasket(item.name, 'Steam Iron', item.price)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F97316] text-slate-700 hover:text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                SECTION 3: PER-KG WEIGHT LAUNDRY TABLES
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'per-kg') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('wash-and-iron');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Wash & Iron" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            🫧 Wash & Iron & Wash & Fold
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            Starts at ₹100 / Kg
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              100% RO Soft Water Laundry (Charged by Weight)
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              Single-customer batch washing with bio-enzymes, zero color-bleed & steam finish.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=wash-and-iron" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Per-Kg Pickup ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Per-Kg Rate Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="brand" size="sm">🫧 Wash & Iron</Badge>
                        <h4 className="text-base font-bold text-slate-900 font-display mt-1">
                          RO Wash + 3D Steam Press
                        </h4>
                      </div>
                      <span className="text-base font-black font-mono text-[#F97316]">₹130 / Kg</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Men's clothes @ ₹130/Kg • Women's delicate clothes @ ₹160/Kg. Ready to wear on hangers or crisp fold.
                    </p>
                    <button
                      type="button"
                      onClick={() => addToBasket("Wash & Iron (1 Kg Batch)", "Per-Kg", 130, "Kg")}
                      className="w-full py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 1 Kg to Estimate</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="slate" size="sm">👕 Wash & Fold</Badge>
                        <h4 className="text-base font-bold text-slate-900 font-display mt-1">
                          RO Wash + Precision Hand Fold
                        </h4>
                      </div>
                      <span className="text-base font-black font-mono text-[#F97316]">₹100 / Kg</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Men's clothes @ ₹100/Kg • Women's clothes @ ₹130/Kg. Moisture-shield store-ready sealed bundle.
                    </p>
                    <button
                      type="button"
                      onClick={() => addToBasket("Wash & Fold (1 Kg Batch)", "Per-Kg", 100, "Kg")}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add 1 Kg to Estimate</span>
                    </button>
                  </div>
                </div>

                {/* Weight Benchmark Matrix Table */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900 font-display">Average Garment Weight Benchmarks</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Actual weight calibrated at doorstep</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Garment Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Approx Weight</th>
                          <th className="py-3 px-4 text-right">Wash & Iron Cost</th>
                          <th className="py-3 px-4 text-right">Wash & Fold Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          { name: 'Shirt', cat: "Men's", weight: '~300 g', wi: '₹39', wf: '₹30', emoji: '👔' },
                          { name: 'Trouser / Chino', cat: "Men's", weight: '~500 g', wi: '₹65', wf: '₹50', emoji: '👖' },
                          { name: 'Jeans (Heavy Denim)', cat: "Men's", weight: '~700 g', wi: '₹91', wf: '₹70', emoji: '👖' },
                          { name: 'T-Shirt', cat: "Men's", weight: '~200 g', wi: '₹26', wf: '₹20', emoji: '👕' },
                          { name: 'Daily Saree', cat: "Women's", weight: '~400 g', wi: '₹64', wf: '₹52', emoji: '🥻' },
                          { name: 'Kurti / Top', cat: "Women's", weight: '~250 g', wi: '₹40', wf: '₹32', emoji: '👚' },
                          { name: 'Single Bedsheet', cat: "Household", weight: '~600 g', wi: '₹78', wf: '₹60', emoji: '🛏️' },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span>{row.emoji}</span>
                              <span>{row.name}</span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">{row.cat}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-700">{row.weight}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-[#F97316]">{row.wi}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{row.wf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                SECTION 4: SAREES & ETHNIC CARE TABLE
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'traditional') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('saree-rolling');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Saree Rolling & Ethnic Care" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            🥻 {srv.title || 'Saree Rolling & Ethnic Wear'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            Handloom & Bridal Specialists
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              Traditional Saree Rolling, Polishing & Couture Care
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              Gentle wooden cylinder roller pressing, zari protection & handloom starch revival.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=saree-rolling" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Saree Care ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Sarees & Ethnic Rate Table Card */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🥻</span>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Sarees, Dhotis & Traditional Wear Rates</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Zari & Silk Safe Treatments</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Garment / Weave</th>
                          <th className="py-3 px-4">Treatment Type</th>
                          <th className="py-3 px-4">Care Highlights</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                          <th className="py-3 px-4 text-center">Estimate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          { name: 'Pattu Saree Original (>10K)', service: 'Dry Clean & Polish', desc: 'Hydrocarbon zero-chemical wash, gold zari shield', price: 900, emoji: '👑' },
                          { name: 'Silk Saree (Kanchipuram / Banarasi)', service: 'Hydrocarbon Dry Clean', desc: 'Ultrasonic spot lift, natural sheen retention', price: 220, emoji: '🥻' },
                          { name: 'Saree with Heavy Embroidery / Work', service: 'Dry Clean & Steam', desc: 'Stone, pearl & bead hand-protection wrapping', price: 250, emoji: '✨' },
                          { name: 'Saree Rolling & Polishing', service: 'Wooden Roller Finish', desc: 'Traditional wooden roller starching & luster revive', price: 150, emoji: '🥻' },
                          { name: 'Saree Steam Ironing Only', service: '3D Steam Press', desc: 'Pleat alignment and crease-free finish', price: 60, emoji: '🥻' },
                          { name: 'Designer Saree Blouse (Worked)', service: 'Dry Clean', desc: 'Padding & embellishment safe cleanse', price: 70, emoji: '👚' },
                          { name: 'Silk Dhoti / Kanduva', service: 'Dry Clean & Starch', desc: 'Crisp handloom fold with traditional borders', price: 140, emoji: '🧣' },
                          { name: 'Sherwani / Bandgala Suit', service: 'Dry Clean & 3D Form', desc: 'Structured shoulder support & brocade care', price: 250, emoji: '🧥' },
                          { name: 'Men Kurta (Worked / Silk)', service: 'Dry Clean', desc: 'Gentle spot lift and tension steam press', price: 150, emoji: '👘' },
                          { name: 'Bridal Lehanga Set (Bottom)', service: 'Dry Clean & Fluff', desc: 'Multi-layer flare preservation & netting care', price: 200, emoji: '👗' },
                        ]
                          .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.service.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#FFF7ED]/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-base">{item.emoji}</span>
                                <span>{item.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-[10px] font-bold text-brand-800">
                                  {item.service}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">{item.desc}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm text-[#F97316]">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToBasket(item.name, item.service, item.price)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F97316] text-slate-700 hover:text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                SECTION 5: FOOTWEAR & BAG CARE TABLE
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'footwear') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('shoe-washing');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Shoe Washing" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            👟 {srv.title || 'Shoe Washing'}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            ₹350 / pair
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              Handcrafted Sneaker & Footwear Restoration
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              Midsole whitening, suede revitalization, and anti-microbial UV sterilization.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=shoe-washing" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Shoe Care ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Shoe & Bags Table Card */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👟</span>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Footwear & Bags Tariff</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Sneakers, Formals, Boots & Leather Bags</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Item & Material</th>
                          <th className="py-3 px-4">Restoration Process</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                          <th className="py-3 px-4 text-center">Estimate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          { name: 'Sneakers & Casual Shoes', desc: 'Midsole foam whitening, lace wash & UV sterilize', price: 350, unit: 'pair', emoji: '👟' },
                          { name: 'Sports & Running Shoes', desc: 'Deep mesh scrubbing, odor removal & anti-microbial dry', price: 350, unit: 'pair', emoji: '🏃' },
                          { name: 'Formal Leather Shoes', desc: 'Hand foam shampoo, rich cream nourish & shine buff', price: 350, unit: 'pair', emoji: '👞' },
                          { name: 'Suede Boots & Loafers', desc: 'Specialized suede nap brush, stain lift & rain protection', price: 350, unit: 'pair', emoji: '🥾' },
                          { name: 'School & College Backpack', desc: 'Deep foam shampoo, zipper lubrication & sanitization', price: 150, unit: 'piece', emoji: '🎒' },
                          { name: 'Designer / Leather Handbag', desc: 'Supple leather conditioning, hardware polishing & shape revival', price: 250, unit: 'piece', emoji: '👜' },
                        ]
                          .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                <span>{row.emoji}</span>
                                <span>{row.name}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">{row.desc}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#F97316]">
                                {formatCurrency(row.price)} <span className="text-[10px] text-slate-400 font-normal">/ {row.unit}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToBasket(row.name, 'Shoe/Bag Care', row.price, row.unit)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F97316] text-slate-700 hover:text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                SECTION 6: HOME FURNISHINGS & CURTAINS
            ───────────────────────────────────────────────────────── */}
            {(selectedCategory === 'ALL' || selectedCategory === 'household') && (
              <div className="space-y-4">
                
                {/* Visual Service Photo Banner */}
                {(() => {
                  const srv = getService('curtain-washing');
                  return (
                    <div className="relative rounded-3xl overflow-hidden border border-brand-200 shadow-luxury group bg-slate-900 text-white">
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img 
                          src={srv.heroImage || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'} 
                          alt="Curtain Washing" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-black text-slate-900 shadow">
                            🪟 Curtains & Carpets
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#F97316] text-white text-xs font-bold shadow">
                            Dimensional Area Rates
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black font-display text-white">
                              Ultrasonic Curtains & Rotary Carpet Cleaning
                            </h3>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-1 mt-0.5">
                              Deep allergen dust extraction, demineralized soft wash & wrinkle-free steam hanging.
                            </p>
                          </div>

                          <Link to="/book-pickup?service=curtain-washing" className="shrink-0">
                            <Button variant="primary" size="sm" icon={Calendar} className="rounded-full text-xs">
                              Book Curtain Wash ➔
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Home Furnishings Table Card */}
                <Card variant="luxury" className="overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🪟</span>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Home & Furnishings Rates</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Calculated by sq. ft. or per piece</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Furnishing Item</th>
                          <th className="py-3 px-4">Calculation Method</th>
                          <th className="py-3 px-4 text-right">Rate</th>
                          <th className="py-3 px-4 text-center">Estimate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {[
                          { name: 'Curtains (Sheers / Blackouts / Drapes)', method: 'Width (ft) × Height (ft) × ₹30', price: 30, unit: 'per sq. ft.', emoji: '🪟' },
                          { name: 'Living Room Carpets & Wool Rugs', method: 'Length (ft) × Width (ft) × ₹45', price: 45, unit: 'per sq. ft.', emoji: '🧶' },
                          { name: 'Single Blanket / Comforter', method: 'Per-piece anti-mite thermal wash', price: 200, unit: 'per piece', emoji: '🛋️' },
                          { name: 'Double / Heavy Quilt (Razai)', method: 'Per-piece deep hygiene & fluffing', price: 300, unit: 'per piece', emoji: '🛋️' },
                          { name: 'Single Bedsheet (Steam Press)', method: 'Per-piece precision steam iron', price: 30, unit: 'per piece', emoji: '🛏️' },
                          { name: 'King / Double Bedsheet (Steam Press)', method: 'Per-piece precision steam iron', price: 35, unit: 'per piece', emoji: '🛏️' },
                          { name: 'Pillow Cover (Steam Press)', method: 'Per-piece precision steam iron', price: 15, unit: 'per piece', emoji: '🛋️' },
                          { name: 'Half Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 100, unit: 'per piece', emoji: '🪟' },
                          { name: 'Medium Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 150, unit: 'per piece', emoji: '🪟' },
                          { name: 'Full Long Curtain Steam Press', method: 'Per-piece vertical tension steam', price: 300, unit: 'per piece', emoji: '🪟' },
                        ]
                          .filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.method.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                <span>{row.emoji}</span>
                                <span>{row.name}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">{row.method}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#F97316]">
                                {formatCurrency(row.price)} <span className="text-[10px] text-slate-400 font-normal">{row.unit}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => addToBasket(row.name, 'Home Care', row.price, row.unit)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#F97316] text-slate-700 hover:text-white font-bold text-[10px] transition-all inline-flex items-center gap-1 active:scale-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
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

          {/* Right: Sticky Live Price Calculator / Estimate Basket */}
          <div id="pricing-calculator-card" className="lg:col-span-4 sticky top-24 space-y-4">
            <Card variant="luxury" className="p-5 sm:p-6 bg-white border border-brand-200 shadow-luxury space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#F97316] flex items-center justify-center border border-[#FED7AA]">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 font-display">
                      Estimate Calculator
                    </h3>
                    <span className="text-[10px] text-slate-400">Live order quotation</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {basket.reduce((acc, i) => acc + i.quantity, 0)} {basket.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {basket.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                  <p>Click <strong>+ Add</strong> on any garment row to estimate your total and proceed directly to booking.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {basket.map((b) => (
                    <div key={b.basketItemId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{b.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{formatCurrency(b.unitPrice)} each</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 bg-white rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(b.basketItemId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{b.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(b.basketItemId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#F97316] hover:bg-orange-50 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono font-bold text-slate-900 shrink-0 w-16 text-right text-xs">
                        {formatCurrency(b.unitPrice * b.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Express 24-Hr Toggle */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">⚡ 24-Hour Express Speed</div>
                  <div className="text-slate-400 text-[10px]">Priority lab processing & dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 text-[#F97316] rounded border-slate-300 focus:ring-[#F97316]"
                />
              </div>

              {/* Financial Calculation Summary */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(itemsSubtotal)}</span>
                </div>
                {isExpress && (
                  <div className="flex justify-between text-[#F97316]">
                    <span>Express Priority (+24h):</span>
                    <span>+{formatCurrency(expressFee)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Doorstep Pickup & Delivery:</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span className="font-display">Estimated Total:</span>
                  <span className="text-xl font-black text-[#F97316] font-display">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold rounded-2xl shadow-luxury"
                icon={Calendar}
                onClick={handleProceedToBooking}
              >
                Proceed to Book Pickup →
              </Button>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Doorstep Verification:</strong> Exact weights & item counts are verified by our executive right at your doorstep.
                </span>
              </div>

            </Card>
          </div>

        </div>

        {/* Floating Mobile Estimate Quick Bar (Visible only on mobile/tablet when items in basket) */}
        {basket.length > 0 && (
          <div className="lg:hidden fixed bottom-16 sm:bottom-20 inset-x-3 sm:inset-x-6 z-30 animate-fade-in no-print">
            <div className="p-3 rounded-2xl bg-[#1F2937] text-white border-2 border-[#FED7AA] shadow-[0_15px_40px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('pricing-calculator-card')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center font-bold text-white shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {basket.reduce((acc, i) => acc + i.quantity, 0)} Items Added
                  </div>
                  <div className="text-[11px] font-mono font-black text-[#FED7AA]">
                    Est. {formatCurrency(finalTotal)}
                  </div>
                </div>
              </button>

              <Button
                variant="primary"
                size="sm"
                className="rounded-xl text-xs font-bold shrink-0"
                onClick={handleProceedToBooking}
              >
                Book Now →
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
