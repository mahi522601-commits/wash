import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Sparkles, X, ChevronDown, Check } from 'lucide-react';

export const EMOJI_DICTIONARY = [
  // ── LAUNDRY & CLOTHING ──
  { emoji: '🧺', name: 'Laundry Basket', tags: ['laundry', 'dry clean', 'basket', 'wash', 'clothes'], category: 'Laundry' },
  { emoji: '👔', name: 'Shirt & Tie', tags: ['shirt', 'formal', 'tie', 'iron', 'steam', 'press', 'men'], category: 'Laundry' },
  { emoji: '👕', name: 'T-Shirt / Polo', tags: ['tshirt', 'polo', 'fold', 'casual', 'men', 'top'], category: 'Laundry' },
  { emoji: '👖', name: 'Jeans / Pants', tags: ['jeans', 'pant', 'trouser', 'denim', 'bottoms'], category: 'Laundry' },
  { emoji: '🩳', name: 'Shorts & Pyjamas', tags: ['shorts', 'trackpant', 'pyjama', 'lounge'], category: 'Laundry' },
  { emoji: '👗', name: 'Dress / Skirt', tags: ['dress', 'gown', 'frock', 'women', 'skirt'], category: 'Laundry' },
  { emoji: '🥻', name: 'Saree & Ethnic', tags: ['saree', 'ethnic', 'silk', 'traditional', 'dhoti', 'pattu'], category: 'Laundry' },
  { emoji: '🧥', name: 'Jacket & Coat', tags: ['jacket', 'coat', 'blazer', 'sherwani', 'leather', 'outerwear'], category: 'Laundry' },
  { emoji: '🥼', name: 'Apron & Lab Coat', tags: ['apron', 'lab', 'white', 'workwear', 'chef'], category: 'Laundry' },
  { emoji: '🦺', name: 'Waist Coat / Vest', tags: ['vest', 'waistcoat', 'formal'], category: 'Laundry' },
  { emoji: '🧣', name: 'Scarf & Kanduva', tags: ['scarf', 'kanduva', 'angavastram', 'shawl', 'duppata'], category: 'Laundry' },
  
  // ── FOOTWEAR & BAGS ──
  { emoji: '👟', name: 'Sneaker', tags: ['sneaker', 'shoe', 'casual', 'footwear', 'cleaning'], category: 'Footwear & Bags' },
  { emoji: '🏃', name: 'Sports Shoe', tags: ['sports', 'running', 'athletic', 'shoe'], category: 'Footwear & Bags' },
  { emoji: '👞', name: 'Formal Shoe', tags: ['formal', 'leather', 'shoe', 'oxford'], category: 'Footwear & Bags' },
  { emoji: '🥾', name: 'Boots & Suede', tags: ['boots', 'suede', 'loafers', 'shoe', 'leather'], category: 'Footwear & Bags' },
  { emoji: '🎒', name: 'Backpack', tags: ['backpack', 'school', 'college', 'bag'], category: 'Footwear & Bags' },
  { emoji: '👜', name: 'Handbag', tags: ['handbag', 'purse', 'leather', 'luxury', 'designer', 'bag'], category: 'Footwear & Bags' },
  { emoji: '🧳', name: 'Travel Trolley', tags: ['luggage', 'suitcase', 'travel', 'duffel', 'bag'], category: 'Footwear & Bags' },
  
  // ── HOUSEHOLD & LINENS ──
  { emoji: '🪟', name: 'Curtain Drapes', tags: ['curtain', 'window', 'drape', 'panel', 'home'], category: 'Household' },
  { emoji: '🧶', name: 'Carpet & Rug', tags: ['carpet', 'rug', 'wool', 'mat', 'floor'], category: 'Household' },
  { emoji: '🛏️', name: 'Single Bedsheet', tags: ['bedsheet', 'single', 'bed', 'linen'], category: 'Household' },
  { emoji: '🛌', name: 'King Bedsheet', tags: ['double', 'king', 'quilt', 'blanket', 'duvet'], category: 'Household' },
  { emoji: '🛋️', name: 'Pillow Cover', tags: ['pillow', 'cushion', 'sofa', 'cover', 'razai'], category: 'Household' },
  { emoji: '🍽️', name: 'Table Cloth', tags: ['tablecloth', 'linen', 'dining'], category: 'Household' },
  { emoji: '🧖', name: 'Bath Towel', tags: ['towel', 'bath', 'napkin', 'hygiene'], category: 'Household' },
  { emoji: '🧸', name: 'Soft Toys', tags: ['toy', 'soft toy', 'teddy', 'kids'], category: 'Household' },
  { emoji: '👶', name: 'Kids Wear', tags: ['baby', 'kids', 'child', 'infant'], category: 'Household' },

  // ── QUALITY & SPECIAL CARE ──
  { emoji: '✨', name: 'Sparkles', tags: ['sparkle', 'shine', 'starch', 'clean', 'premium', 'special'], category: 'Care & Quality' },
  { emoji: '🌟', name: 'Gold Star', tags: ['star', 'quality', 'vip', 'luxury', 'rating'], category: 'Care & Quality' },
  { emoji: '🫧', name: 'RO Wash Bubbles', tags: ['bubbles', 'wash', 'water', 'ro', 'softened'], category: 'Care & Quality' },
  { emoji: '🌾', name: 'Organic Starch', tags: ['starch', 'organic', 'cotton', 'corn', 'rice'], category: 'Care & Quality' },
  { emoji: '🧼', name: 'Stain Lift Soap', tags: ['soap', 'stain', 'scrub', 'wash', 'deep'], category: 'Care & Quality' },
  { emoji: '👑', name: 'Pattu / Luxury Silk', tags: ['crown', 'pattu', 'luxury', 'bridal', 'premium'], category: 'Care & Quality' },
  { emoji: '💎', name: 'Deluxe Shield', tags: ['diamond', 'vip', 'deluxe', 'premium'], category: 'Care & Quality' },
  { emoji: '🛡️', name: 'Sanitization Shield', tags: ['shield', 'protect', 'sanitization', 'anti-microbial'], category: 'Care & Quality' },
  { emoji: '🪡', name: 'Tailoring & Stitch', tags: ['alteration', 'zip', 'stitch', 'repair', 'needle'], category: 'Care & Quality' },
  { emoji: '🎁', name: 'Luxury Packing', tags: ['gift', 'box', 'package', 'hanger'], category: 'Care & Quality' },
  { emoji: '⚡', name: 'Express Speed', tags: ['express', 'fast', 'custom', 'special', 'quick'], category: 'Care & Quality' },
  { emoji: '🔥', name: 'Hot Deal / Stiff Press', tags: ['hot', 'trending', 'press', 'heat'], category: 'Care & Quality' },
  { emoji: '🎯', name: 'Precision Care', tags: ['target', 'precise', 'focus', 'crease'], category: 'Care & Quality' },
  { emoji: '🏷️', name: 'Special Tariff Tag', tags: ['tag', 'rate', 'price', 'discount', 'label'], category: 'Care & Quality' },
];

const CATEGORIES = ['All', 'Laundry', 'Footwear & Bags', 'Household', 'Care & Quality'];

export const EmojiPicker = ({ value, onChange, label = 'Emoji Icon' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const popoverRef = useRef(null);

  const selectedEmoji = value || '✨';

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredEmojis = useMemo(() => {
    return EMOJI_DICTIONARY.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.emoji.includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  const handleSelect = (emoji) => {
    onChange(emoji);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {label && <label className="block text-xs font-bold uppercase text-slate-600 mb-1">{label}</label>}

      {/* Emoji Trigger Button & Manual Text Input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2 text-xl font-bold transition-all shadow-2xs cursor-pointer group"
          title="Click to open interactive Emoji Picker"
        >
          <span>{selectedEmoji}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
        </button>

        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 👔 or ✨"
          className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 px-3 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-all whitespace-nowrap border border-brand-200"
        >
          🔍 Browse
        </button>
      </div>

      {/* Popover Picker Window */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-900 font-display">Select Emoji Icon</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search emoji (e.g. shirt, shoe, star, curtain, bag)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="max-h-56 overflow-y-auto pr-1">
            {filteredEmojis.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching emojis found for "{searchQuery}". Try searching shirt, shoe, star, bag, etc.
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                {filteredEmojis.map((item, idx) => {
                  const isSelected = selectedEmoji === item.emoji;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item.emoji)}
                      title={`${item.name} (${item.tags.join(', ')})`}
                      className={`p-2 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer hover:scale-125 ${
                        isSelected
                          ? 'bg-brand-100 border-2 border-brand-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
                      }`}
                    >
                      {item.emoji}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Selected: <strong className="text-slate-900 text-xs ml-1">{selectedEmoji}</strong></span>
            <span>Or type any emoji in the text field</span>
          </div>

        </div>
      )}
    </div>
  );
};
