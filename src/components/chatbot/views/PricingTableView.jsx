import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { QUICK_ITEMS_CATALOG } from '../../../services/chatbotService';
import { DollarSign, Search, Plus, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingTableView = ({ onStartBookingWithItem }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['ALL', 'Men', 'Women', 'Per-Kg', 'Household', 'Footwear'];

  const filteredItems = QUICK_ITEMS_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in text-xs">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1F2937]">Tech Wash Official Rate Card</h4>
            <span className="text-[10px] text-slate-400">RO Soft Water • Zero PERC • 3D Steam Press</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search items (e.g. Saree, Shirt, Shoes, Curtains)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F97316]"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Rate List */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-[11px]">
            No items matched "{searchQuery}". Try a different keyword.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-[#FFF7ED]/50 hover:border-[#FED7AA] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg shrink-0">{item.emoji || '🧺'}</span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-xs truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{item.desc || `${item.category} Care`}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-[#F97316] block">
                    {formatCurrency(item.unitPrice)}
                    {item.unit ? <span className="text-[9px] text-slate-400 font-sans font-normal"> {item.unit}</span> : ''}
                  </span>
                  {item.ironingPrice && (
                    <span className="text-[9px] text-slate-400 block">
                      Iron: {formatCurrency(item.ironingPrice)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStartBookingWithItem && onStartBookingWithItem(item)}
                  className="px-2.5 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>Book</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rate Disclaimer & Free Delivery Callout */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
          <Tag className="w-3 h-3" /> Free doorstep pickup above ₹499
        </span>
        <Link to="/pricing" className="text-[#F97316] font-bold hover:underline">
          Full Tariff Sheet →
        </Link>
      </div>

    </div>
  );
};
