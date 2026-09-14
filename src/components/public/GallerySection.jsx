import React, { useState, useEffect, useRef } from 'react';
import { cmsService } from '../../services/cmsService';
import { 
  Sparkles, 
  Eye, 
  ArrowUpRight, 
  X, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2, 
  Maximize2, 
  Layers,
  ChevronLeft,
  ChevronRight,
  SplitSquareHorizontal
} from 'lucide-react';

const DEFAULT_TRANSFORMATIONS = [
  {
    id: 'g-1',
    title: 'Bridal Kanjeevaram Silk Saree Roll Polish',
    category: 'Silk & Sarees',
    badge: '24k Zari Restoration',
    beforeImageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
    problem: 'Tarnished gold zari weave & deep oil storage creases',
    solution: 'Pure hydrocarbon eco bath & zero-heat starch roll polish',
    technology: '100% Demineralized RO Rinse',
  },
  {
    id: 'g-2',
    title: 'Italian Wool 2-Piece Tuxedo & Blazer',
    category: 'Suits & Blazers',
    badge: '3D Form Steam Finish',
    beforeImageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1000&q=80',
    problem: 'Sweat ring oxidization & flattened chest canvas',
    solution: 'pH-neutral ultrasonic spot lift + Sankosha 3D tension press',
    technology: 'Zero Shine / Seam Burn',
  },
  {
    id: 'g-3',
    title: 'Designer Suede & Mesh Luxury Sneakers',
    category: 'Footwear & Bags',
    badge: 'Ozone Sanitized',
    beforeImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
    problem: 'Yellowed oxidized soles & deep suede dirt stains',
    solution: 'Hand foam extraction, sole un-yellowing & ozone deodorization',
    technology: 'Anti-Microbial Shield',
  },
  {
    id: 'g-4',
    title: 'Pure Pashmina & Cashmere Shawl Revival',
    category: 'Couture & Woollens',
    badge: 'Microfiber De-Pilling',
    beforeImageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1000&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1000&q=80',
    problem: 'Surface pilling, fiber tangles & stubborn wine mark',
    solution: 'German enzymatic bath & manual precision de-pilling',
    technology: '100% Cashmere Safe',
  }
];

export const GallerySection = ({ gallery = [] }) => {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxItem, setLightboxItem] = useState(null);

  useEffect(() => {
    if (gallery && gallery.length > 0) {
      setItems(gallery);
    } else {
      cmsService.getItems('gallery', { filterActive: true })
        .then((data) => {
          if (data && data.length > 0) {
            setItems(data);
          } else {
            setItems(DEFAULT_TRANSFORMATIONS);
          }
        })
        .catch(() => {
          setItems(DEFAULT_TRANSFORMATIONS);
        });
    }
  }, [gallery]);

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

  return (
    <section className="py-20 lg:py-28 bg-[#0B0A1C] text-white relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Craftsmanship Mastery</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white leading-tight">
              Before & After <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Transformations
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Drag the interactive comparison sliders on each frame below to witness the restorative precision of European hydrocarbon dry cleaning and 3D form finishing.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black border-transparent shadow-lg shadow-orange-950/50'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2-COLUMN LUXURY INTERACTIVE FRAMES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {filtered.map((item, idx) => (
            <InteractiveTransformationFrame
              key={item.id || idx}
              item={item}
              onOpenLightbox={() => setLightboxItem(item)}
            />
          ))}
        </div>

      </div>

      {/* FULLSCREEN 4K LIGHTBOX MODAL */}
      {lightboxItem && (
        <LightboxModal
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      )}

    </section>
  );
};

/**
 * Advanced Interactive Before & After Frame with Drag Slider & Mode Toggles
 */
const InteractiveTransformationFrame = ({ item, onOpenLightbox }) => {
  const containerRef = useRef(null);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' | 'before' | 'after'

  const beforeImg = item.beforeImageUrl || item.imageUrl;
  const afterImg = item.imageUrl || item.afterImageUrl;
  const hasDualImages = Boolean(item.beforeImageUrl && item.imageUrl);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percentage = Math.round((offsetX / rect.width) * 100);
    setSliderPosition(percentage);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const onMove = (e) => handlePointerMove(e);
      const onUp = () => handlePointerUp();
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="p-4 sm:p-5 rounded-[36px] bg-gradient-to-b from-[#181534] via-[#100E26] to-[#0A091A] border border-orange-500/25 shadow-2xl space-y-4 relative group transition-all duration-300 hover:border-orange-500/50 hover:shadow-orange-950/30">
      
      {/* 1. TOP CONTROLS & CATEGORY PILL */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 text-xs font-bold border border-white/15 truncate">
            {item.category || 'Specialized Care'}
          </span>
          {item.badge && (
            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider hidden sm:inline shadow-xs">
              {item.badge}
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        {hasDualImages && (
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('before')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'before'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'slider'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Slider
            </button>
            <button
              type="button"
              onClick={() => setViewMode('after')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'after'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              After
            </button>
          </div>
        )}
      </div>

      {/* 2. CHOSEN DISPLAY FRAME WITH SLIDER */}
      <div
        ref={containerRef}
        onPointerDown={hasDualImages && viewMode === 'slider' ? handlePointerDown : undefined}
        className="aspect-[16/11] sm:aspect-[16/10] rounded-[26px] overflow-hidden relative select-none bg-black border border-white/15 cursor-ew-resize shadow-inner group/canvas"
      >
        
        {/* Full "After" Restored Photo (Base Layer) */}
        <img
          src={viewMode === 'before' ? beforeImg : afterImg}
          alt={item.title}
          className="w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Split Slider "Before" Photo (Clipped Layer) */}
        {hasDualImages && viewMode === 'slider' && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <img
              src={beforeImg}
              alt="Before Treatment"
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}

        {/* Live Overlay Badges */}
        <div className="absolute top-3.5 left-3.5 pointer-events-none flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Before Condition</span>
          </span>
        </div>

        <div className="absolute top-3.5 right-3.5 pointer-events-none flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>After Restoration</span>
          </span>
        </div>

        {/* Laser Separator Line & Interactive Knob */}
        {hasDualImages && viewMode === 'slider' && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            {/* Glowing Laser Vertical Line */}
            <div className="w-[2px] h-full bg-gradient-to-b from-orange-400 via-white to-amber-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />

            {/* Circular Handle Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-2xl shadow-orange-950 flex items-center justify-center cursor-grab active:cursor-grabbing">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-orange-400 font-bold text-xs gap-0.5">
                <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
                <ChevronRight className="w-3.5 h-3.5 -ml-1" />
              </div>
            </div>
          </div>
        )}

        {/* Slider Instruction Pill on Hover */}
        {hasDualImages && viewMode === 'slider' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-slate-300 pointer-events-none opacity-80 group-hover/canvas:opacity-100 transition-opacity flex items-center gap-1.5">
            <SplitSquareHorizontal className="w-3 h-3 text-orange-400" />
            <span>Drag slider to compare</span>
          </div>
        )}

        {/* Fullscreen Magnify Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox();
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center shadow-lg transition-all active:scale-95"
          title="Inspect in 4K Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-cyan-300" />
        </button>

      </div>

      {/* 3. CAPTION, PROBLEM/SOLUTION METRICS & TECHNOLOGIES */}
      <div className="space-y-3 px-1 pt-1">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-display text-white group-hover:text-orange-300 transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {item.description || item.solution || 'Complete fiber rejuvenation using specialized eco-solvents.'}
          </p>
        </div>

        {/* Problem vs Solution Specs Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <span>⚠️ Issue Addressed:</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {item.problem || 'Stains, fading & fabric stress'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Restoration Result:</span>
            </div>
            <div className="text-[11px] text-emerald-200 font-medium truncate">
              {item.technology || item.solution || '100% Weave & Color Restored'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

/**
 * 4K Fullscreen Lightbox Modal with Interactive Comparison
 */
const LightboxModal = ({ item, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDrag, setIsDrag] = useState(false);
  const [mode, setMode] = useState('slider'); // 'slider' | 'split' | 'before' | 'after'
  const containerRef = useRef(null);

  const beforeImg = item.beforeImageUrl || item.imageUrl;
  const afterImg = item.imageUrl || item.afterImageUrl;
  const hasDual = Boolean(item.beforeImageUrl && item.imageUrl);

  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    setSliderPos(Math.round((offsetX / rect.width) * 100));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-[#12102B] rounded-[36px] overflow-hidden border border-orange-500/30 shadow-2xl p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-3">
          <div>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
              {item.category} • 4K HD Inspection
            </span>
            <h3 className="text-base sm:text-xl font-black text-white font-display">
              {item.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {hasDual && (
              <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('slider')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    mode === 'slider' ? 'bg-orange-500 text-slate-950 shadow-xs' : 'text-slate-300'
                  }`}
                >
                  ⚡ Live Slider
                </button>
                <button
                  type="button"
                  onClick={() => setMode('split')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    mode === 'split' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image Canvas */}
        {hasDual && mode === 'split' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[65vh] overflow-hidden">
            <div className="relative rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center border border-white/10">
              <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 text-amber-300 text-xs font-bold z-10">
                BEFORE CONDITION
              </span>
              <img src={beforeImg} alt="Before" className="max-h-[60vh] w-full object-contain" />
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center border border-white/10">
              <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 text-xs font-bold z-10 border border-emerald-500/30">
                AFTER RESTORATION
              </span>
              <img src={afterImg} alt="After" className="max-h-[60vh] w-full object-contain" />
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            onPointerDown={(e) => {
              setIsDrag(true);
              handleMove(e);
            }}
            onPointerMove={(e) => {
              if (isDrag) handleMove(e);
            }}
            onPointerUp={() => setIsDrag(false)}
            className="relative rounded-2xl overflow-hidden max-h-[65vh] flex items-center justify-center bg-black border border-white/10 select-none cursor-ew-resize"
          >
            <img
              src={afterImg}
              alt={item.title}
              className="max-h-[65vh] w-auto object-contain pointer-events-none"
            />

            {hasDual && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              >
                <img
                  src={beforeImg}
                  alt="Before"
                  className="max-h-[65vh] w-auto object-contain"
                />
              </div>
            )}

            {hasDual && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-20"
                style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-[2px] h-full bg-gradient-to-b from-orange-400 via-white to-amber-400 shadow-[0_0_15px_rgba(249,115,22,1)]" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-2xl flex items-center justify-center">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-orange-400 font-bold">
                    ↔
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-white/5 rounded-2xl text-xs text-slate-300 flex items-center justify-between gap-4">
          <div>
            <strong>Restoration Summary:</strong> {item.description || item.solution || 'Treated with German eco-solvents and 3D form press.'}
          </div>
          <span className="text-emerald-400 font-bold shrink-0">✓ 100% Quality Verified</span>
        </div>

      </div>
    </div>
  );
};
