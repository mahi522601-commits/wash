import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';
import { calculateOrderTotal } from '../../services/pricingEngine';
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
  Trash2,
  ArrowRight
} from 'lucide-react';

export const PricingPage = () => {
  const [pricingItems, setPricingItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [basket, setBasket] = useState([]);
  const [isExpress, setIsExpress] = useState(false);
  const navigate = useNavigate();

  // Baseline item catalog if CMS items haven't been configured yet
  const defaultItems = [
    { id: 'p1', name: 'Men Shirt / T-Shirt', category: 'Men', washAndIron: 49, dryClean: 129, steamIron: 29 },
    { id: 'p2', name: 'Trousers / Jeans / Chinos', category: 'Men', washAndIron: 59, dryClean: 139, steamIron: 35 },
    { id: 'p3', name: 'Suit 2-Piece (Blazer + Trouser)', category: 'Men', washAndIron: null, dryClean: 399, steamIron: 149 },
    { id: 'p4', name: 'Kurta / Pyjama', category: 'Men', washAndIron: 69, dryClean: 169, steamIron: 39 },
    { id: 'p5', name: 'Silk Saree / Heavy Zari', category: 'Women', washAndIron: null, dryClean: 299, steamIron: 99 },
    { id: 'p6', name: 'Bridal Lehenga (3-Piece)', category: 'Women', washAndIron: null, dryClean: 999, steamIron: 299 },
    { id: 'p7', name: 'Dress / Gown', category: 'Women', washAndIron: 89, dryClean: 249, steamIron: 69 },
    { id: 'p8', name: 'Salwar Kameez / Dupatta', category: 'Women', washAndIron: 79, dryClean: 189, steamIron: 49 },
    { id: 'p9', name: 'Bed Sheet (Double) & Pillow Covers', category: 'Household', washAndIron: 129, dryClean: 229, steamIron: 59 },
    { id: 'p10', name: 'Blanket / Heavy Quilt (Double)', category: 'Household', washAndIron: 249, dryClean: 399, steamIron: null },
    { id: 'p11', name: 'Curtains (Per Panel)', category: 'Household', washAndIron: 99, dryClean: 199, steamIron: 59 },
    { id: 'p12', name: 'Leather / Suede Sneakers', category: 'Footwear', washAndIron: null, dryClean: 349, steamIron: null },
  ];

  useEffect(() => {
    cmsService.getItems('pricingItems')
      .then((items) => {
        if (items && items.length > 0) setPricingItems(items);
        else setPricingItems(defaultItems);
      })
      .catch(() => setPricingItems(defaultItems));
  }, []);

  const categories = ['ALL', 'Men', 'Women', 'Household', 'Footwear'];

  const filtered = pricingItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToBasket = (item, serviceType, price) => {
    if (!price) return;
    const basketItemId = `${item.id}-${serviceType}`;
    setBasket((prev) => {
      const existing = prev.find((b) => b.basketItemId === basketItemId);
      if (existing) {
        return prev.map((b) => (b.basketItemId === basketItemId ? { ...b, quantity: b.quantity + 1 } : b));
      }
      return [
        ...prev,
        {
          basketItemId,
          id: item.id,
          name: `${item.name} (${serviceType})`,
          unitPrice: price,
          quantity: 1,
          category: item.category,
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

  const calculation = calculateOrderTotal({
    items: basket,
    isExpress,
  });

  const handleProceedToBooking = () => {
    // Save estimate basket to sessionStorage for checkout prefill
    sessionStorage.setItem('techwash_prefilled_items', JSON.stringify(basket));
    sessionStorage.setItem('techwash_is_express', JSON.stringify(isExpress));
    navigate('/book-pickup');
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Rate Card & Price Calculator
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            No hidden fees. Add items to estimate your total and proceed directly to doorstep pickup.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Rate Card Table Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Pricing List Cards */}
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 font-display">
                        {item.name}
                      </h4>
                      <Badge variant="slate" size="sm">{item.category}</Badge>
                    </div>
                  </div>

                  {/* Rate Options */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.washAndIron && (
                      <button
                        onClick={() => addToBasket(item, 'Wash & Iron', item.washAndIron)}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-semibold border border-brand-200/60 transition-colors flex items-center gap-1.5"
                      >
                        <span>Wash & Iron: {formatCurrency(item.washAndIron)}</span>
                        <Plus className="w-3 h-3 text-brand-600" />
                      </button>
                    )}

                    {item.dryClean && (
                      <button
                        onClick={() => addToBasket(item, 'Dry Clean', item.dryClean)}
                        className="px-3 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-900 text-xs font-semibold border border-brand-300/60 transition-colors flex items-center gap-1.5"
                      >
                        <span>Dry Clean: {formatCurrency(item.dryClean)}</span>
                        <Plus className="w-3 h-3 text-brand-700" />
                      </button>
                    )}

                    {item.steamIron && (
                      <button
                        onClick={() => addToBasket(item, 'Steam Iron', item.steamIron)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <span>Steam Iron: {formatCurrency(item.steamIron)}</span>
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Live Estimate Basket */}
          <div className="lg:col-span-4 sticky top-24">
            <Card variant="luxury" className="p-6 bg-white border border-brand-200 shadow-luxury space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Estimate Basket
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {basket.length} items
                </span>
              </div>

              {basket.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Click any service button (+ Wash & Iron, + Dry Clean) on the left to add items to your live estimate.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {basket.map((b) => (
                    <div key={b.basketItemId} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-50">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{b.name}</div>
                        <div className="text-slate-400">{formatCurrency(b.unitPrice)} each</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(b.basketItemId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold">{b.quantity}</span>
                        <button
                          onClick={() => updateQuantity(b.basketItemId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-bold text-slate-900 shrink-0 w-14 text-right">
                        {formatCurrency(b.unitPrice * b.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Express Toggle */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">Express 24-Hr Turnaround</div>
                  <div className="text-slate-400 text-[11px]">Priority processing & dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                />
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(calculation.itemsSubtotal)}</span>
                </div>
                {isExpress && (
                  <div className="flex justify-between text-brand-600">
                    <span>Express Priority Fee:</span>
                    <span>+{formatCurrency(calculation.expressFee)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Doorstep Pickup & Delivery:</span>
                  <span className={calculation.deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {calculation.deliveryFee === 0 ? 'FREE' : formatCurrency(calculation.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(calculation.taxAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span className="font-display">Estimated Total:</span>
                  <span className="text-xl font-black text-brand-600 font-display">
                    {formatCurrency(calculation.finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon={Calendar}
                onClick={handleProceedToBooking}
              >
                Proceed to Book Pickup
              </Button>

              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Exact item counts verified upon doorstep pickup</span>
              </p>

            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};
