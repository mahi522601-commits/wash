import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const FAQSection = ({ faqs = [] }) => {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultFaqs = faqs.length > 0 ? faqs : [
    {
      q: 'How does Tech Wash doorstep pickup and delivery work?',
      a: 'Simply select your service and choose a convenient 1-hour slot on our website or WhatsApp. Our certified executive arrives at your doorstep with heavy-duty laundry bags, tallies the items, issues a digital receipt, and delivers them back fresh, steam-pressed, and hung within 24–48 hours.',
      category: 'Pickup & Delivery',
    },
    {
      q: 'What makes Tech Wash Dry Cleaning different from traditional dry cleaners?',
      a: 'We use gentle, eco-friendly European hydrocarbon solvents instead of toxic PERC. This ensures zero chemical odor, protects metallic zari / embellishments, preserves natural fiber moisture, and guarantees zero color bleeding.',
      category: 'Dry Cleaning',
    },
    {
      q: 'Is RO soft water really used for washing?',
      a: 'Yes, 100%. Hard tap water containing calcium and magnesium causes fabrics to stiffen, fade, and degrade rapidly. Our in-house soft water filtration plants soften water down to <10 PPM hardness for supreme softness.',
      category: 'Fabric Care',
    },
    {
      q: 'Do you offer an Express 24-Hour delivery turnaround?',
      a: 'Yes! During checkout you can select the 24-Hour Express option. Our express processing units prioritize your garments for same-day wash, steam press, and dispatch.',
      category: 'Turnaround & Express',
    },
    {
      q: 'How can I track my laundry in real-time?',
      a: 'Enter your 6-digit Order ID (e.g. TW-102948) on our /track-order page. You will see live 10-stage milestone updates from Pickup, Inspection, Ultrasonic Stain Treatment, Steam Finishing, Quality Check, to Out for Delivery.',
      category: 'Tracking & Orders',
    },
  ];

  const filtered = defaultFaqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Everything you need to know about our garment care technology, pricing, and express delivery.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filtered.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-brand-300 bg-brand-50/30 shadow-luxury'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base select-none"
                >
                  <span className="font-display">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
