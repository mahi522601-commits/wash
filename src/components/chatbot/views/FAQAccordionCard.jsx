import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export const FAQAccordionCard = ({ faqs = [] }) => {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-2.5 animate-fade-in text-xs">
      
      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
        <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1F2937]">Frequently Asked Questions</h4>
          <span className="text-[10px] text-slate-400">Tap to expand answer</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full p-2.5 text-left bg-slate-50 hover:bg-brand-50/50 flex items-center justify-between gap-2 font-bold text-[11px] text-slate-800 transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-2.5 bg-white text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 animate-slide-down">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
