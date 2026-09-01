import React from 'react';
import { Sparkles, Calendar, Layers, DollarSign, Search, ArrowRight } from 'lucide-react';

export const ConciergeWelcomeCard = ({ onSelectAction }) => {
  const options = [
    {
      id: 'book',
      icon: Calendar,
      title: 'Book Doorstep Pickup',
      subtitle: 'Schedule certified executive collection',
      actionValue: 'Book a Doorstep Pickup',
      highlight: true,
    },
    {
      id: 'services',
      icon: Layers,
      title: 'Explore Fabric Care',
      subtitle: 'Dry clean, steam press, saree spa',
      actionValue: 'Explore Cleaning Services',
    },
    {
      id: 'pricing',
      icon: DollarSign,
      title: 'Check Rate Card',
      subtitle: 'Transparent prices per piece & kg',
      actionValue: 'Calculate Garment Pricing',
    },
    {
      id: 'tracking',
      icon: Search,
      title: 'Track Active Order',
      subtitle: '10-stage live milestone progress',
      actionValue: 'Track Order Status',
    },
  ];

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3 animate-fade-in">
      
      {/* Greeting Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-3.5 h-3.5 fill-current text-cyan-200" />
        </div>
        <div>
          <h4 className="text-xs font-bold font-display text-[#1E1B4B]">
            Welcome to Tech Wash Concierge
          </h4>
          <p className="text-[10px] text-slate-500">
            How can I assist your wardrobe today?
          </p>
        </div>
      </div>

      {/* Structured Action Cards */}
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectAction(opt.actionValue)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] group ${
                opt.highlight
                  ? 'bg-gradient-to-r from-[#F5F3FF] to-white border-[#6D28D9]/40 hover:border-[#6D28D9] shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  opt.highlight ? 'bg-[#6D28D9] text-white' : 'bg-white text-[#6D28D9] border border-slate-200'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1E1B4B] group-hover:text-[#6D28D9] transition-colors truncate">
                    {opt.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {opt.subtitle}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#6D28D9] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

    </div>
  );
};
