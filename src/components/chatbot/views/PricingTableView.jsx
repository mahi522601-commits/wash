import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { QUICK_ITEMS_CATALOG } from '../../../services/chatbotService';
import { DollarSign, ArrowRight, Plus, Sparkles } from 'lucide-react';

export const PricingTableView = ({ onStartBookingWithItem }) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Apparel', 'Couture', 'Ethnic', 'Household', 'Footwear'];

  const filteredItems = selectedCategory === 'ALL'
    ? QUICK_ITEMS_CATALOG
    : QUICK_ITEMS_CATALOG.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in text-xs">
      
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1F2937]">Standard Garment Rate Card</h4>
            <span className="text-[10px] text-slate-400">Includes RO soft wash & 3D steam press</span>
          </div>
        </div>
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
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-brand-50/50 hover:border-brand-300 transition-colors"
          >
            <div>
              <div className="font-bold text-slate-900 text-xs">{item.name}</div>
              <span className="text-[10px] text-slate-400">{item.category} Care</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-[#F97316]">
                {formatCurrency(item.unitPrice)}
              </span>
              <button
                type="button"
                onClick={() => onStartBookingWithItem(item)}
                className="px-2 py-1 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Book</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
