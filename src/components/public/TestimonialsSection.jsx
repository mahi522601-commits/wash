import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cmsService } from '../../services/cmsService';
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Heart,
  MapPin,
  Pause,
  Play
} from 'lucide-react';

const DEFAULT_REVIEWS = [
  {
    id: 't-1',
    customerName: 'Ananya Deshmukh',
    location: 'Banjara Hills, Hyderabad',
    serviceUsed: 'Pure Silk Saree Care & Roll Polish',
    rating: 5,
    review: 'Tech Wash handled my wedding Kanjeevaram sarees with unbelievable care. The natural gold zari shine was restored without any harsh chemical scent. The 45-minute doorstep pickup was seamless!',
    verified: true,
    initials: 'AD',
    color: 'from-amber-500 to-orange-600',
    tags: ['Bridal Couture', '45m Pickup']
  },
  {
    id: 't-2',
    customerName: 'Rohit Kulkarni',
    location: 'Hitec City, Hyderabad',
    serviceUsed: 'Italian Woolen Suit Dry Cleaning',
    rating: 5,
    review: 'As an executive wearing suits daily, finding a dry cleaner that uses hydrocarbon solvents instead of damaging PERC was a game changer. The 3D tension steam press leaves zero shine marks.',
    verified: true,
    initials: 'RK',
    color: 'from-blue-600 to-indigo-700',
    tags: ['Hydrocarbon Eco', '3D Steam Press']
  },
  {
    id: 't-3',
    customerName: 'Meera Nambiar',
    location: 'Gachibowli, Hyderabad',
    serviceUsed: 'Designer Footwear & Suede Spa',
    rating: 5,
    review: 'My limited edition white sneakers looked brand new after the ultrasonic spa treatment. Live 10-stage order tracking kept me updated every step of the way. Highly recommended!',
    verified: true,
    initials: 'MN',
    color: 'from-emerald-500 to-teal-700',
    tags: ['Shoe Spa', 'Live Tracking']
  },
  {
    id: 't-4',
    customerName: 'Dr. Arvind Rao',
    location: 'Jubilee Hills, Hyderabad',
    serviceUsed: 'Pure Linen Shirts & Steam Press',
    rating: 5,
    review: 'The RO softened water wash makes a noticeable difference to delicate linen fabrics. Clothes feel soft against the skin and stay fresh all week without any residue.',
    verified: true,
    initials: 'AR',
    color: 'from-purple-600 to-pink-600',
    tags: ['RO Soft Water', 'Zero Odor']
  },
  {
    id: 't-5',
    customerName: 'Sneha Reddy',
    location: 'Madhapur, Hyderabad',
    serviceUsed: 'Heavy Bridal Lehenga & Zari Preservation',
    rating: 5,
    review: 'Preserved my heavy hand-embroidered sangeet lehenga in their archival garment bag. Superb attention to detail, transparent pricing, and courteous delivery executives.',
    verified: true,
    initials: 'SR',
    color: 'from-rose-500 to-red-600',
    tags: ['Zari Care', 'Doorstep Fleet']
  }
];

const AUTO_PLAY_INTERVAL = 5000; // 5 seconds per slide

export const TestimonialsSection = ({ testimonials = [] }) => {
  const [reviews, setReviews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Load reviews from CMS or fallback
  useEffect(() => {
    if (testimonials.length > 0) {
      setReviews(testimonials);
    } else {
      cmsService.getItems('testimonials', { filterActive: true })
        .then((data) => {
          if (data && data.length > 0) {
            setReviews(data);
          } else {
            setReviews(DEFAULT_REVIEWS);
          }
        })
        .catch(() => setReviews(DEFAULT_REVIEWS));
    }
  }, [testimonials]);

  const total = reviews.length;

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % (total || 1));
  }, [total]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + (total || 1)) % (total || 1));
  }, [total]);

  // Smooth Auto-Play timer with pause on hover/touch
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, AUTO_PLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, total, handleNext, activeIndex]);

  // Touch Swipe Handlers for natural mobile gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (reviews.length === 0) return null;

  const current = reviews[activeIndex] || reviews[0];

  return (
    <section 
      className="py-14 sm:py-20 lg:py-24 bg-gradient-to-b from-[#FFFDF9] via-white to-[#FDF8F3] relative overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Animated Atmosphere Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-orange-200/25 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-brand-200/20 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 relative z-10">
        
        {/* 1. COMPACT ANIMATED SECTION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-orange-100/80">
          <div className="space-y-2 max-w-xl">
            {/* Luminous Animated Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/10 border border-orange-300/40 text-orange-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316] animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-extrabold text-orange-900">4.9/5 Rating</span>
              <span className="text-orange-400">•</span>
              <span>500+ Discerning Patrons</span>
            </div>

            {/* Glowing Advanced Heading */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900 leading-[1.15]">
              Trusted by Discerning <br />
              <span className="bg-gradient-to-r from-[#F97316] via-amber-500 to-[#EA580C] bg-clip-text text-transparent">
                Garment Owners
              </span>
            </h2>
          </div>

          {/* Controls: Prev / Pause / Next & Progress Counter */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
            <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>0{activeIndex + 1}</span>
              <span className="text-slate-300">/</span>
              <span>0{total}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center hover:bg-[#F97316] hover:text-white hover:border-[#F97316] shadow-xs active:scale-95 transition-all"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 text-slate-500 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 shadow-xs active:scale-95 transition-all"
                title={isPaused ? "Resume auto-slide" : "Pause auto-slide"}
                aria-label={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleNext}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center hover:bg-[#F97316] hover:text-white hover:border-[#F97316] shadow-xs active:scale-95 transition-all"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. ADVANCED ANIMATED SPOTLIGHT TESTIMONIAL CARD */}
        <div 
          className="relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Active Spotlight Card */}
          <div 
            key={current.id || activeIndex}
            className="relative bg-white rounded-3xl sm:rounded-[36px] p-5 sm:p-8 lg:p-10 border border-orange-200/80 shadow-luxury hover:shadow-2xl transition-all duration-500 overflow-hidden space-y-5 animate-fade-in"
          >
            {/* Top Auto-Play Animated Progress Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-100 overflow-hidden">
              <div 
                key={`bar-${activeIndex}-${isPaused}`}
                className={`h-full bg-gradient-to-r from-orange-500 to-amber-500 origin-left ${
                  !isPaused ? 'animate-[linear_progress_5s_linear_infinite]' : 'w-full opacity-40'
                }`}
                style={{
                  animation: !isPaused ? `progressBar ${AUTO_PLAY_INTERVAL}ms linear` : 'none',
                  width: isPaused ? '100%' : undefined
                }}
              />
            </div>

            {/* Floating Watermark Quote Icon */}
            <Quote className="w-16 h-16 sm:w-24 sm:h-24 text-orange-500/10 absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-none" />

            {/* Top Metadata Row: Stars + Service Tag + Verified Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: current.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-current filter drop-shadow-xs" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800 ml-1">5.0 Star Experience</span>
              </div>

              <div className="flex items-center gap-2">
                {current.verified !== false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Order</span>
                  </span>
                )}
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-[#F97316] text-[10px] sm:text-xs font-bold border border-orange-200">
                  <Sparkles className="w-3 h-3" />
                  <span>{current.serviceUsed}</span>
                </span>
              </div>
            </div>

            {/* Quote Review Text */}
            <div className="relative z-10">
              <p className="text-base sm:text-xl lg:text-2xl font-serif text-slate-800 italic leading-relaxed tracking-wide">
                "{current.review}"
              </p>
            </div>

            {/* Service tag for mobile view */}
            <div className="sm:hidden relative z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F97316] text-[10px] font-bold border border-orange-200">
                <Sparkles className="w-3 h-3" />
                <span>{current.serviceUsed}</span>
              </span>
            </div>

            {/* Customer Author Footer */}
            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                {/* Avatar Initial Pill with Luxury Gradient */}
                <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr ${
                  current.color || 'from-[#F97316] to-amber-500'
                } text-white font-extrabold text-sm sm:text-base flex items-center justify-center shadow-md border-2 border-white shrink-0`}>
                  {current.initials || current.customerName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'TW'}
                </div>

                <div>
                  <h3 className="font-bold font-display text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                    {current.customerName}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-medium">
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span>{current.location || 'Hyderabad'}</span>
                  </div>
                </div>
              </div>

              {/* Tag Badges */}
              {current.tags && current.tags.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5">
                  {current.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Swipe Hint on Mobile */}
          <div className="sm:hidden text-center mt-2.5 text-[10px] font-medium text-slate-400">
            Swipe left/right to browse reviews • Tap to pause
          </div>
        </div>

        {/* 3. INTERACTIVE THUMBNAIL DOTS & TICKER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          
          {/* Clickable Animated Dots */}
          <div className="flex items-center gap-2">
            {reviews.map((r, idx) => (
              <button
                key={r.id || idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-300 rounded-full h-2.5 ${
                  activeIndex === idx
                    ? 'w-8 bg-gradient-to-r from-[#F97316] to-amber-500 shadow-xs'
                    : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Mini Trust Guarantee Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">100% Genuine Google & Doorstep Verified Reviews</span>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes progressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  );
};
