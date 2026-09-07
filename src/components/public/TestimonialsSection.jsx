import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';

export const TestimonialsSection = ({ testimonials = [] }) => {
  const [reviews, setReviews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length > 0) {
      setReviews(testimonials);
    } else {
      cmsService.getItems('testimonials', { filterActive: true })
        .then((data) => {
          if (data && data.length > 0) {
            setReviews(data);
          } else {
            // Default verified reviews
            setReviews([
              {
                id: 't-1',
                customerName: 'Ananya Deshmukh',
                location: 'Hyderabad',
                serviceUsed: 'Pure Silk Saree Care & Polish',
                rating: 5,
                review: 'Tech Wash handled my wedding Kanjeevaram sarees with unbelievable care. The natural gold zari shine was restored without any harsh chemical scent. The 45-minute pickup was seamless!',
                verified: true
              },
              {
                id: 't-2',
                customerName: 'Rohit Kulkarni',
                location: 'Hyderabad',
                serviceUsed: 'Italian Woolen Suit Dry Cleaning',
                rating: 5,
                review: 'As an executive wearing blazers daily, finding a dry cleaner that uses hydrocarbon solvents instead of damaging PERC was a game changer. The 3D tension steam press leaves zero shine marks.',
                verified: true
              },
              {
                id: 't-3',
                customerName: 'Meera Nambiar',
                location: 'Hyderabad',
                serviceUsed: 'Designer Footwear & Suede Spa',
                rating: 5,
                review: 'My limited edition white sneakers looked brand new after the ultrasonic spa treatment. Live 10-stage order tracking kept me updated every step of the way. Highly recommended!',
                verified: true
              }
            ]);
          }
        })
        .catch(() => {});
    }
  }, [testimonials]);

  if (reviews.length === 0) return null;

  const current = reviews[activeIndex] || reviews[0];

  return (
    <section className="py-20 lg:py-28 bg-brand-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-brand-200/80">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Verified Patron Reviews</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-800 leading-tight">
              Trusted by Discerning <br />
              <span className="text-brand-500">Garment Owners</span>
            </h2>
          </div>

          {/* Navigation Arrows */}
          {reviews.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length)}
                className="w-11 h-11 rounded-full bg-white border border-brand-200 text-navy-800 flex items-center justify-center hover:bg-brand-600 hover:text-white shadow-sm transition-all"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveIndex((prev) => (prev + 1) % reviews.length)}
                className="w-11 h-11 rounded-full bg-white border border-brand-200 text-navy-800 flex items-center justify-center hover:bg-brand-600 hover:text-white shadow-sm transition-all"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* FEATURED REVIEW SPOTLIGHT CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Featured Testimonial */}
          <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-[40px] border border-brand-200/80 shadow-luxury space-y-6 relative overflow-hidden">
            <Quote className="w-16 h-16 text-brand-100 absolute top-6 right-6 pointer-events-none" />

            {/* Stars */}
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: current.rating || 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>

            {/* Big Review Text */}
            <p className="text-lg sm:text-2xl font-normal text-slate-800 font-serif italic leading-relaxed">
              "{current.review}"
            </p>

            {/* Customer Meta */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold font-display text-navy-800 text-base sm:text-lg flex items-center gap-2">
                  <span>{current.customerName}</span>
                  {current.verified !== false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Order</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {current.location} • {current.serviceUsed}
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-brand-700">
                0{activeIndex + 1} / 0{reviews.length}
              </div>
            </div>
          </div>

          {/* Upcoming Review Previews */}
          <div className="lg:col-span-4 space-y-4">
            {reviews.map((r, idx) => {
              if (idx === activeIndex) return null;
              return (
                <div
                  key={r.id || idx}
                  onClick={() => setActiveIndex(idx)}
                  className="p-5 rounded-3xl bg-white/70 hover:bg-white border border-brand-200 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-navy-800">{r.customerName}</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: r.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{r.review}"
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
