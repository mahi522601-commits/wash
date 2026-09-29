/**
 * Tech Wash Centralized Official Pricing Configuration
 * Authoritative pricing dictionary, weight estimation matrices, and dimensional calculators.
 * Synchronizes with Firestore `settings/pricing` if configured, with exact default fallbacks.
 */
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const INITIAL_PRICING_CONFIG = {
  // 1. Service Catalog Metadata
  services: [
    {
      id: 'dry-cleaning',
      slug: 'dry-cleaning',
      name: 'Dry Cleaning',
      icon: '🧺',
      emoji: '🧺',
      tagline: 'Professional care for your clothes',
      description: 'Single-batch hydrocarbon solvent cleaning for delicate apparel, suits, sarees, and couture.',
      startingPriceDisplay: 'Starts at ₹40',
      pricingType: 'ITEMIZED', // Men, Women & Common items with per-piece rates
    },
    {
      id: 'ironing',
      slug: 'ironing',
      name: 'Ironing',
      icon: '👔',
      emoji: '👔',
      tagline: 'Freshly pressed and ready to wear',
      description: '3D mannequin form pressing and vacuum table crease retention with zero shine or heat scorch.',
      startingPriceDisplay: 'Starts at ₹12',
      pricingType: 'ITEMIZED', // Men & Women with per-piece rates
    },
    {
      id: 'starch-and-iron',
      slug: 'starch-and-iron',
      name: 'Starch & Iron',
      icon: '✨',
      emoji: '✨',
      tagline: 'Crisp stiff starching & steam finish',
      description: 'Traditional organic starching treatment with high-precision steam form pressing for crisp cottons & sarees.',
      startingPriceDisplay: 'Starts at ₹25',
      pricingType: 'ITEMIZED',
    },
    {
      id: 'wash-and-iron',
      slug: 'wash-and-iron',
      name: 'Wash & Iron',
      icon: '🫧',
      emoji: '🫧',
      tagline: 'Washed, dried and neatly ironed',
      description: '100% RO softened water wash with bio-detergents followed by crisp steam iron pressing.',
      startingPriceDisplay: 'Starts at ₹130 / Kg',
      pricingType: 'PER_KG',
      baseRates: {
        men: 130,
        women: 160,
      },
      additionalPreservedRates: {
        men: [130, 180, 200],
        women: [160, 200, 250],
      }
    },
    {
      id: 'wash-and-fold',
      slug: 'wash-and-fold',
      name: 'Wash & Fold',
      icon: '👕',
      emoji: '👕',
      tagline: 'Freshly washed and neatly folded',
      description: 'Isolated drum laundry cycle, moisture-controlled drying, and precision hand-folding.',
      startingPriceDisplay: 'Starts at ₹100 / Kg',
      pricingType: 'PER_KG',
      baseRates: {
        men: 100,
        women: 130,
      },
      additionalPreservedRates: {
        men: [100, 120, 180],
        women: [130, 150],
      }
    },
    {
      id: 'saree-rolling',
      slug: 'saree-rolling',
      name: 'Saree Rolling',
      icon: '🥻',
      emoji: '🥻',
      tagline: 'Careful saree rolling service',
      description: 'Traditional starching, gentle polishing, and wooden roller finishing for silk and pattu sarees.',
      startingPriceDisplay: 'Price to be confirmed',
      pricingType: 'UNPRICED', // No price provided in sheet. Show "To be confirmed"
      rate: null,
    },
    {
      id: 'curtain-washing',
      slug: 'curtain-washing',
      name: 'Curtain Service',
      icon: '🪟',
      emoji: '🪟',
      tagline: 'Deep cleaning & care for curtains',
      description: 'Comprehensive curtain care: Dry Cleaning, Wash & Iron, Steam Ironing, and Wash & Fold for all curtains.',
      startingPriceDisplay: 'Starts at ₹60',
      pricingType: 'ITEMIZED',
      unit: 'piece',
      subServices: [
        { id: 'curtain-dc', key: 'dryCleaning', name: 'Curtain Dry Cleaning', price: 200, emoji: '🧺' },
        { id: 'curtain-wi', key: 'washAndIron', name: 'Curtain Wash & Iron', price: 150, emoji: '🫧' },
        { id: 'curtain-ir', key: 'iron', name: 'Curtain Iron', price: 60, emoji: '✨' },
        { id: 'curtain-wf', key: 'washAndFold', name: 'Curtain Wash & Fold', price: 100, emoji: '👕' },
      ]
    },
    {
      id: 'shoe-washing',
      slug: 'shoe-washing',
      name: 'Shoe Washing',
      icon: '👟',
      emoji: '👟',
      tagline: 'Clean your shoes with care',
      description: 'Hand-scrubbed midsole whitening, antiseptic deodorization, and suede/leather restoration.',
      startingPriceDisplay: '₹350 / pair',
      pricingType: 'PER_PAIR',
      unit: 'pair',
      ratePerPair: 350,
    },
    {
      id: 'carpet-washing',
      slug: 'carpet-washing',
      name: 'Carpet Washing',
      icon: '🧶',
      emoji: '🧶',
      tagline: 'Deep cleaning for carpets',
      description: 'Rotary shampoo cleaning, high-power water extraction, and anti-microbial drying for rugs.',
      startingPriceDisplay: '₹45 / sq. ft.',
      pricingType: 'DIMENSIONAL_AREA',
      unit: 'sq. ft.',
      ratePerSqFt: 45,
    },
  ],

  // 2. Item Catalogs with Granular Categories for Clean Browsing
  dryCleaning: {
    men: [
      { id: 'dc-m-1', name: 'Shirt', price: 90, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'dc-m-2', name: 'Shirt with Starch', price: 100, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'dc-m-3', name: 'T Shirt', price: 90, emoji: '👕', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'dc-m-20', name: 'Silk Shirt', price: 90, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'dc-m-4', name: 'Jeans', price: 90, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-5', name: 'Trouser/Pant', price: 90, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-6', name: 'Trouser with Starch', price: 100, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-7', name: 'Shorts', price: 60, emoji: '🩳', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-8', name: 'Trackpant', price: 90, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-9', name: 'Pyjama', price: 90, emoji: '🩳', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'dc-m-10', name: 'Kurta', price: 120, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-11', name: 'Kurta Medium', price: 150, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-12', name: 'Kurta Long/Worked', price: 180, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-13', name: 'Sherwani Bandala', price: 250, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-14', name: 'Jacket - Leather/Heavy', price: 300, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-15', name: 'Jacket - Normal', price: 200, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-16', name: 'Pullover/Sweater', price: 120, emoji: '🧶', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-17', name: 'Blazer', price: 250, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-18', name: 'Waist Coat', price: 90, emoji: '🦺', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-19', name: 'Tie', price: 40, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'dc-m-21', name: 'Silk Dhoti', price: 140, emoji: '🥻', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-22', name: 'Silk Kanduva', price: 100, emoji: '🧣', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-23', name: 'Lungi', price: 80, emoji: '🩲', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'dc-m-24', name: 'Shalu', price: 100, emoji: '🧣', gender: 'men', category: 'Men', subCategory: 'traditional' },
    ],
    women: [
      { id: 'dc-w-1', name: 'Normal Top', price: 120, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'dc-w-2', name: 'Medium Top', price: 140, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'dc-w-3', name: 'Long Top', price: 180, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'dc-w-4', name: 'Worked Top', price: 220, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'dc-w-5', name: 'Slack Pant', price: 80, emoji: '👖', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'dc-w-20', name: 'Lehanga Bottom', price: 200, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'dc-w-21', name: 'Petty Coat', price: 50, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'dc-w-6', name: 'Duppata Short', price: 50, emoji: '🧣', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-7', name: 'Duppata long', price: 70, emoji: '🧣', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-8', name: 'Duppata Worked', price: 100, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-15', name: 'Saree', price: 220, emoji: '🥻', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-16', name: 'Saree Worked', price: 250, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-17', name: 'Saree Blouse', price: 60, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-18', name: 'Saree Blouse Worked', price: 70, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'dc-w-19', name: 'Pattu Saree Original >10K', price: 900, emoji: '👑', gender: 'women', category: 'Women', subCategory: 'traditional', startingNote: 'Starts at ₹900' },
      { id: 'dc-w-13', name: 'Skirt', price: 100, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'dresses' },
      { id: 'dc-w-14', name: 'Pullover/Sweater', price: 100, emoji: '🧶', gender: 'women', category: 'Women', subCategory: 'jackets' },
      { id: 'dc-w-22', name: 'Nighties', price: 90, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'dresses' },
      { id: 'dc-w-9', name: 'Kids Dress', price: 60, emoji: '👗', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'dc-w-10', name: 'Kids Shirt', price: 70, emoji: '👕', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'dc-w-11', name: 'Kids Pant', price: 70, emoji: '👖', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'dc-w-12', name: 'Kids Dhothi/Pyjama', price: 90, emoji: '🥻', gender: 'kids', category: 'Kids', subCategory: 'kids' },
    ],
    common: [
      { id: 'dc-c-1', name: 'Shoe', price: 300, emoji: '👟', gender: 'common', category: 'Footwear', subCategory: 'shoes' },
      { id: 'dc-c-2', name: 'School/College Bag', price: 150, emoji: '🎒', gender: 'common', category: 'Bags', subCategory: 'bags' },
      { id: 'dc-c-6', name: 'Leather Bags', price: 250, emoji: '👜', gender: 'common', category: 'Bags', subCategory: 'bags', rangeNote: '₹250 to ₹400' },
      { id: 'dc-c-3', name: 'Toys - Small', price: 100, emoji: '🧸', gender: 'common', category: 'Toys', subCategory: 'kids' },
      { id: 'dc-c-4', name: 'Toys - Medium', price: 150, emoji: '🧸', gender: 'common', category: 'Toys', subCategory: 'kids' },
      { id: 'dc-c-5', name: 'Toys - Large', price: 200, emoji: '🧸', gender: 'common', category: 'Toys', subCategory: 'kids' },
      { id: 'dc-c-7', name: 'Gowns', price: 80, emoji: '👗', gender: 'women', category: 'Couture', subCategory: 'dresses' },
    ]
  },

  ironing: {
    men: [
      { id: 'ir-m-1', name: 'Shirt', price: 17, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'ir-m-2', name: 'T Shirt', price: 17, emoji: '👕', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'ir-m-16', name: 'Silk Shirt', price: 17, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'ir-m-3', name: 'Jeans', price: 17, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'ir-m-4', name: 'Cotton Trouser', price: 17, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'ir-m-5', name: 'Shorts', price: 17, emoji: '🩳', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'ir-m-6', name: 'Trackpant', price: 17, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'ir-m-7', name: 'Pyjama', price: 17, emoji: '🩳', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'ir-m-8', name: 'Kurta', price: 20, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-9', name: 'Kurta Medium', price: 25, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-10', name: 'Kurta Long/Worked', price: 30, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-11', name: 'Sherwani Bandala', price: 60, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-12', name: 'Pullover/Sweater', price: 17, emoji: '🧶', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-13', name: 'Blazer', price: 50, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-14', name: 'Waist Coat', price: 20, emoji: '🦺', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-15', name: 'Tie', price: 15, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-17', name: 'Silk Dhoti', price: 25, emoji: '🥻', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-18', name: 'Lungi', price: 25, emoji: '🩲', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-19', name: 'Kandava', price: 20, emoji: '🧣', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'ir-m-20', name: 'Men Jacket', price: 20, emoji: '🧥', gender: 'men', category: 'Men', subCategory: 'jackets' },
      { id: 'ir-m-27', name: 'Aprons White', price: 20, emoji: '🥼', gender: 'men', category: 'Workwear', subCategory: 'jackets' },
      { id: 'ir-m-21', name: 'Single Bedsheet', price: 30, emoji: '🛏️', gender: 'common', category: 'Household', subCategory: 'household' },
      { id: 'ir-m-22', name: 'King Bedsheet', price: 35, emoji: '🛏️', gender: 'common', category: 'Household', subCategory: 'household' },
      { id: 'ir-m-24', name: 'Curtain Steam Iron', price: 60, emoji: '🪟', gender: 'common', category: 'Curtains', subCategory: 'household' },
      { id: 'ir-m-28', name: 'Gowns', price: 17, emoji: '👗', gender: 'women', category: 'Couture', subCategory: 'dresses' },
    ],
    women: [
      { id: 'ir-w-1', name: 'Normal Top', price: 25, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'ir-w-2', name: 'Medium Top', price: 30, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'ir-w-3', name: 'Long Top', price: 40, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'ir-w-4', name: 'Worked Top', price: 40, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'ir-w-5', name: 'Slack Pant', price: 17, emoji: '👖', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'ir-w-6', name: 'Bottom Trouser', price: 17, emoji: '👖', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'ir-w-7', name: 'Bottom Worked', price: 25, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'ir-w-21', name: 'Lehanga Bottom', price: 50, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'ir-w-22', name: 'Petty Coat', price: 17, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'bottoms' },
      { id: 'ir-w-8', name: 'Duppata Short', price: 20, emoji: '🧣', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-9', name: 'Duppata long', price: 20, emoji: '🧣', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-10', name: 'Duppata Worked', price: 20, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-17', name: 'Saree', price: 60, emoji: '🥻', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-18', name: 'Saree Worked', price: 60, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-19', name: 'Saree Blouse', price: 15, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-20', name: 'Saree Blouse Worked', price: 15, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'ir-w-15', name: 'Skirt', price: 20, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'dresses' },
      { id: 'ir-w-16', name: 'Pullover/Sweater', price: 20, emoji: '🧶', gender: 'women', category: 'Women', subCategory: 'jackets' },
      { id: 'ir-w-23', name: 'Nighties', price: 30, emoji: '👗', gender: 'women', category: 'Women', subCategory: 'dresses' },
      { id: 'ir-w-11', name: 'Kids Dress', price: 15, emoji: '👗', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'ir-w-12', name: 'Kids Shirt', price: 12, emoji: '👕', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'ir-w-13', name: 'Kids Pant', price: 12, emoji: '👖', gender: 'kids', category: 'Kids', subCategory: 'kids' },
      { id: 'ir-w-14', name: 'Kids Dhothi/Pyjama', price: 15, emoji: '🥻', gender: 'kids', category: 'Kids', subCategory: 'kids' },
    ]
  },

  'starch-and-iron': {
    men: [
      { id: 'si-m-1', name: 'Cotton Shirt (Starch & Iron)', price: 30, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'si-m-2', name: 'Khadi / Linen Shirt', price: 35, emoji: '👔', gender: 'men', category: 'Men', subCategory: 'tops' },
      { id: 'si-m-3', name: 'Cotton Kurta (Starch & Iron)', price: 45, emoji: '👘', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'si-m-4', name: 'Cotton Dhoti / Lungi', price: 40, emoji: '🥻', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'si-m-5', name: 'Cotton Trouser / Pant', price: 30, emoji: '👖', gender: 'men', category: 'Men', subCategory: 'bottoms' },
      { id: 'si-m-6', name: 'Kanduva / Angavastram', price: 30, emoji: '🧣', gender: 'men', category: 'Men', subCategory: 'traditional' },
      { id: 'si-m-7', name: 'Chef / White Apron Starch', price: 35, emoji: '🥼', gender: 'men', category: 'Workwear', subCategory: 'jackets' },
    ],
    women: [
      { id: 'si-w-1', name: 'Cotton Saree (Starch & Iron)', price: 80, emoji: '🥻', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'si-w-2', name: 'Silk Cotton Saree', price: 90, emoji: '✨', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'si-w-3', name: 'Cotton Dupatta / Chunni', price: 30, emoji: '🧣', gender: 'women', category: 'Women', subCategory: 'traditional' },
      { id: 'si-w-4', name: 'Cotton Kurti / Top Starch', price: 40, emoji: '👚', gender: 'women', category: 'Women', subCategory: 'tops' },
      { id: 'si-w-5', name: 'Cotton Salwar / Pyjama', price: 30, emoji: '👖', gender: 'women', category: 'Women', subCategory: 'bottoms' },
    ],
    common: [
      { id: 'si-c-1', name: 'Cotton Table Cloth (Starch)', price: 50, emoji: '🍽️', gender: 'common', category: 'Household', subCategory: 'household' },
      { id: 'si-c-2', name: 'Cotton Single Bedsheet', price: 50, emoji: '🛏️', gender: 'common', category: 'Household', subCategory: 'household' },
      { id: 'si-c-3', name: 'Cotton Double Bedsheet', price: 70, emoji: '🛏️', gender: 'common', category: 'Household', subCategory: 'household' },
    ]
  },

  // 3. Supplied Weight Standards for Per-KG Estimation
  weightStandards: {
    men: [
      { id: 'wt-m-1', name: 'Shirt', weightKg: 0.3, weightGrams: 300, emoji: '👔', gender: 'men', defaultCategory: 'Men' },
      { id: 'wt-m-2', name: 'Trouser', weightKg: 0.5, weightGrams: 500, emoji: '👖', gender: 'men', defaultCategory: 'Men' },
      { id: 'wt-m-3', name: 'Jeans', weightKg: 0.8, weightGrams: 800, emoji: '👖', gender: 'men', defaultCategory: 'Men' },
      { id: 'wt-m-4', name: 'T-Shirt', weightKg: 0.2, weightGrams: 200, emoji: '👕', gender: 'men', defaultCategory: 'Men' },
      { id: 'wt-m-5', name: 'Kurta / Ethnic', weightKg: null, weightGrams: null, emoji: '👘', gender: 'men', unconfirmed: true },
      { id: 'wt-m-6', name: 'Shorts / Trackpant', weightKg: null, weightGrams: null, emoji: '🩳', gender: 'men', unconfirmed: true },
    ],
    women: [
      { id: 'wt-w-1', name: 'Normal Top', weightKg: 0.35, weightGrams: 350, emoji: '👚', gender: 'women', defaultCategory: 'Women' },
      { id: 'wt-w-2', name: 'Medium Top', weightKg: 0.6, weightGrams: 600, emoji: '👚', gender: 'women', defaultCategory: 'Women' },
      { id: 'wt-w-3', name: 'Bottoms / Leggings', weightKg: 0.25, weightGrams: 250, emoji: '👖', gender: 'women', defaultCategory: 'Women' },
      { id: 'wt-w-4', name: 'T-Shirt', weightKg: 0.2, weightGrams: 200, emoji: '👕', gender: 'women', defaultCategory: 'Women' },
      { id: 'wt-w-5', name: 'Saree / Dress', weightKg: null, weightGrams: null, emoji: '🥻', gender: 'women', unconfirmed: true },
      { id: 'wt-w-6', name: 'Nighty / Gown', weightKg: null, weightGrams: null, emoji: '👗', gender: 'women', unconfirmed: true },
    ]
  },

  // 4. Special and Per-Unit Services
  curtains: {
    dryCleaning: 200,
    washAndIron: 150,
    iron: 60,
    washAndFold: 100,
    unit: 'panel',
    subServices: [
      { id: 'curtain-dc', key: 'dryCleaning', name: 'Curtain Dry Cleaning', price: 200, emoji: '🧺', desc: 'Single-batch delicate solvent cleaning for blackout, silk & jacquard curtains' },
      { id: 'curtain-wi', key: 'washAndIron', name: 'Curtain Wash & Iron', price: 150, emoji: '🫧', desc: 'Demineralized RO wash with vertical tension steam hanging press' },
      { id: 'curtain-ir', key: 'iron', name: 'Curtain Iron', price: 60, emoji: '✨', desc: 'Precision steam ironing & deep wrinkle removal' },
      { id: 'curtain-wf', key: 'washAndFold', name: 'Curtain Wash & Fold', price: 100, emoji: '👕', desc: 'Isolated drum wash, moisture control drying & neat fold' },
    ]
  },

  shoes: {
    ratePerPair: 350,
    unit: 'pair',
  },

  carpets: {
    ratePerSqFt: 45,
    unit: 'sq. ft.',
    defaultPresets: [
      { label: 'Entry Mat (3ft × 4ft)', length: 4, width: 3 },
      { label: 'Medium Rug (6ft × 4ft)', length: 6, width: 4 },
      { label: 'Living Room Carpet (8ft × 6ft)', length: 8, width: 6 },
      { label: 'Large Room Rug (10ft × 8ft)', length: 10, width: 8 },
    ]
  },

  sareeRolling: {
    rate: 150,
    unit: 'saree',
    status: 'AVAILABLE',
    displayMessage: '₹150 / saree',
  },

  // 5. Custom Services & Dynamic Sub-Services created in Admin
  customServices: [],
};

const PRICING_STORAGE_KEY = 'techwash_pricing_config_v2';
const PRICING_BROADCAST_CHANNEL = 'techwash_pricing_channel';

/**
 * Builds the dynamic Walk-In Services list based on current pricingConfig + any custom services
 */
export const buildWalkInServicesFromPricing = (config = INITIAL_PRICING_CONFIG, extraServices = []) => {
  const cfg = config || INITIAL_PRICING_CONFIG;
  const foldRate = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.men) || 100;
  const foldWomenRate = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.women) || 130;
  const ironRate = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.men) || 130;
  const ironWomenRate = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.women) || 160;
  const shoeRate = Number(cfg.shoes?.ratePerPair) || 350;
  const sareeRate = Number(cfg.sareeRolling?.rate) || 150;
  const curtainDCRate = Number(cfg.curtains?.dryCleaning) || 200;

  // Calculate lowest dry clean starting price
  const dcItems = [...(cfg.dryCleaning?.men || []), ...(cfg.dryCleaning?.women || []), ...(cfg.dryCleaning?.common || [])];
  const dcPrices = dcItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const dcMin = dcPrices.length > 0 ? Math.min(...dcPrices) : 40;

  // Calculate lowest steam iron price
  const irItems = [...(cfg.ironing?.men || []), ...(cfg.ironing?.women || [])];
  const irPrices = irItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const irMin = irPrices.length > 0 ? Math.min(...irPrices) : 12;

  // Calculate lowest starch price
  const starchList = cfg['starch-and-iron'] || cfg.starchAndIron || {};
  const starchItems = [...(starchList.men || []), ...(starchList.women || []), ...(starchList.common || [])];
  const starchPrices = starchItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const starchMin = starchPrices.length > 0 ? Math.min(...starchPrices) : 25;

  const baseServices = [
    { id: 'srv-dry-cleaning', name: 'Premium Dry Cleaning', emoji: '🧺', defaultPrice: 90, startingPrice: dcMin },
    { id: 'srv-wash-and-fold', name: 'Wash & Fold', emoji: '👕', defaultPrice: foldRate, perKg: true, menPrice: foldRate, womenPrice: foldWomenRate },
    { id: 'srv-wash-and-iron', name: 'Wash & Steam Iron', emoji: '🫧', defaultPrice: ironRate, perKg: true, menPrice: ironRate, womenPrice: ironWomenRate },
    { id: 'srv-steam-ironing', name: 'Steam Ironing Only', emoji: '👔', defaultPrice: irMin || 25, startingPrice: irMin },
    { id: 'srv-saree-spa', name: 'Sarees & Ethnic Care', emoji: '🥻', defaultPrice: sareeRate || 60, startingPrice: sareeRate || 60 },
    { id: 'srv-shoe-spa', name: 'Shoe & Sneaker Care', emoji: '👟', defaultPrice: shoeRate, startingPrice: shoeRate },
    { id: 'srv-curtain-spa', name: 'Curtain Service', emoji: '🪟', defaultPrice: curtainDCRate, startingPrice: Math.min(curtainDCRate, Number(cfg.curtains?.iron) || 60) },
    { id: 'srv-starch-and-iron', name: 'Starch & Finishing', emoji: '✨', defaultPrice: starchMin || 45, startingPrice: starchMin },
    { id: 'srv-carpet-washing', name: 'Carpet & Rug Wash', emoji: '🧶', defaultPrice: Number(cfg.carpets?.ratePerSqFt || 45), startingPrice: Number(cfg.carpets?.ratePerSqFt || 45) },
  ];

  // Merge custom services stored in pricingConfig or passed from serviceService
  const customList = Array.isArray(cfg.customServices) ? cfg.customServices : [];
  const dynamicExtras = Array.isArray(extraServices) ? extraServices : [];

  const standardIds = new Set(baseServices.map(s => s.id));
  const mergedCustom = [...customList, ...dynamicExtras].filter(s => {
    if (!s || !s.id) return false;
    const cleanId = (s.id || '').replace(/^srv-/, '');
    const standardClean = ['dry-cleaning', 'ironing', 'starch-and-iron', 'wash-and-iron', 'wash-and-fold', 'saree-rolling', 'curtain-washing', 'shoe-washing', 'carpet-washing'];
    return !standardIds.has(s.id) && !standardClean.includes(cleanId);
  });

  const formattedCustom = mergedCustom.map(cs => ({
    id: cs.id.startsWith('srv-') ? cs.id : `srv-${cs.id}`,
    name: cs.title || cs.name || 'Custom Service',
    emoji: cs.emoji || cs.icon || '✨',
    defaultPrice: Number(cs.startingPrice || cs.defaultPrice || cs.price || 99),
    startingPrice: Number(cs.startingPrice || cs.defaultPrice || cs.price || 99),
    pricingType: cs.pricingType || 'per_item',
    perKg: cs.pricingType === 'per_kg' || cs.pricingType === 'PER_KG',
    subServices: cs.subServices || [],
    isCustom: true,
  }));

  return [...baseServices, ...formattedCustom];
};

/**
 * Builds the dynamic 10-tier Weight Band cards for Wash & Fold and Wash & Steam Iron
 */
export const buildWeightBandsFromPricing = (config = INITIAL_PRICING_CONFIG) => {
  const cfg = config || INITIAL_PRICING_CONFIG;
  const foldRate = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.men) || 100;
  const ironRate = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.men) || 130;

  const weights = [
    { wt: 1.5, foldDesc: 'Light Load (~5 pcs)', ironDesc: 'Light Press (~4 pcs)' },
    { wt: 2.0, foldDesc: 'Daily Load (~7 pcs)', ironDesc: 'Daily Press (~6 pcs)' },
    { wt: 3.0, foldDesc: 'Standard (~10 pcs)', ironDesc: 'Standard (~9 pcs)' },
    { wt: 4.0, foldDesc: 'Regular (~14 pcs)', ironDesc: 'Regular (~12 pcs)' },
    { wt: 5.0, foldDesc: 'Medium (~18 pcs)', ironDesc: 'Executive (~16 pcs)' },
    { wt: 6.0, foldDesc: 'Family (~22 pcs)', ironDesc: 'Family Steam (~20 pcs)' },
    { wt: 8.0, foldDesc: 'Heavy Load', ironDesc: 'Heavy Wardrobe' },
    { wt: 10.0, foldDesc: 'Bulk Wash', ironDesc: 'Bulk Steam Iron' },
    { wt: 12.0, foldDesc: 'Mega Batch', ironDesc: 'Mega Steam Batch' },
    { wt: 15.0, foldDesc: 'Commercial', ironDesc: 'Commercial Steam' },
  ];

  const foldBands = weights.map(w => ({
    wt: w.wt,
    label: `${w.wt.toFixed(1)} Kg`,
    price: Math.round(w.wt * foldRate),
    desc: w.foldDesc,
  }));

  const ironBands = weights.map(w => ({
    wt: w.wt,
    label: `${w.wt.toFixed(1)} Kg`,
    price: Math.round(w.wt * ironRate),
    desc: w.ironDesc,
  }));

  return { foldBands, ironBands, foldRate, ironRate };
};

/**
 * Builds the persona rate band presets (Men, Women, Linens, Silk)
 */
export const buildPersonaRateBandsFromPricing = (config = INITIAL_PRICING_CONFIG) => {
  const cfg = config || INITIAL_PRICING_CONFIG;
  const foldMen = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.men) || 100;
  const foldWomen = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.women) || 130;
  const ironMen = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.men) || 130;
  const ironWomen = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.women) || 160;

  return {
    foldPriceBands: [
      { label: "Men's Regular", price: foldMen, desc: 'T-Shirts, Jeans, Shorts, Daily Wear' },
      { label: "Women's / Delicate", price: foldWomen, desc: 'Kurtis, Tops, Dresses, Delicate Wear' },
      { label: "Home Linens", price: Math.round(foldMen * 1.2), desc: 'Bedsheets, Towels, Pillow Covers' },
      { label: 'Premium Fabric', price: Math.round(foldMen * 1.5), desc: 'Khadi, Linen, Silk-blend, Heavy loads' },
    ],
    ironPriceBands: [
      { label: "Men's Standard", price: ironMen, desc: 'Formals, Trousers, Polos + Steam Iron' },
      { label: "Women's / Work", price: ironWomen, desc: 'Kurtas, Salwars, Tops + Steam Iron' },
      { label: "Heavy Linens", price: Math.round(ironMen * 1.38), desc: 'Duvets, Heavy Curtains + Steam Iron' },
      { label: 'Silk / Form Press', price: Math.round(ironMen * 1.54), desc: 'Silk, Chiffon, Formal Blazers Press' },
    ]
  };
};

/**
 * Builds the complete Master Catalog items for POS and Admin Walk-in Orders with live prices
 */
export const buildMasterCatalogFromPricing = (config = INITIAL_PRICING_CONFIG, extraServices = []) => {
  const cfg = config || INITIAL_PRICING_CONFIG;
  const items = [];

  const parsePrice = (val, fallback = 0) => {
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    return fallback;
  };

  // 1. Men's Dry Cleaning & Care
  const dcMen = cfg.dryCleaning?.men || [];
  dcMen.forEach(it => {
    items.push({
      id: it.id || `m-dc-${it.name}`,
      name: it.name,
      price: parsePrice(it.price, 90),
      emoji: it.emoji || '👔',
      categoryKey: 'MEN',
      categoryName: it.subCategory === 'bottoms' ? "Men's Bottoms" : it.subCategory === 'jackets' ? "Suits & Outerwear" : it.subCategory === 'traditional' ? "Ethnic" : "Men's Tops",
      serviceId: 'srv-dry-cleaning',
      serviceName: 'Premium Dry Cleaning',
      subServiceName: it.name,
    });
  });

  // 2. Women's Wear
  const dcWomen = cfg.dryCleaning?.women || [];
  dcWomen.forEach(it => {
    if (it.gender === 'kids' || it.category === 'Kids') return;
    items.push({
      id: it.id || `w-dc-${it.name}`,
      name: it.name,
      price: parsePrice(it.price, 120),
      emoji: it.emoji || '👗',
      categoryKey: 'WOMEN',
      categoryName: it.subCategory === 'traditional' ? "Sarees & Ethnic" : it.subCategory === 'bottoms' ? "Women's Bottoms" : it.subCategory === 'dresses' ? "Dresses" : "Women's Tops",
      serviceId: 'srv-dry-cleaning',
      serviceName: 'Premium Dry Cleaning',
      subServiceName: it.name,
    });
  });

  // 3. Common Dry Cleaning & Linens
  const dcCommon = cfg.dryCleaning?.common || [];
  dcCommon.forEach(it => {
    const isFootwearOrBag = it.category === 'Footwear' || it.category === 'Bags' || it.subCategory === 'shoes' || it.subCategory === 'bags';
    const isKids = it.subCategory === 'kids' || it.category === 'Toys';
    items.push({
      id: it.id || `c-dc-${it.name}`,
      name: it.name,
      price: parsePrice(it.price, 100),
      emoji: it.emoji || (isFootwearOrBag ? '👜' : isKids ? '🧸' : '🛋️'),
      categoryKey: isFootwearOrBag ? 'FOOTWEAR_BAGS' : isKids ? 'KIDS' : 'HOUSEHOLD',
      categoryName: it.category || "Common & Linens",
      serviceId: 'srv-dry-cleaning',
      serviceName: 'Premium Dry Cleaning',
      subServiceName: it.name,
    });
  });

  // 4. Steam Ironing
  const irMen = cfg.ironing?.men || [];
  const irWomen = cfg.ironing?.women || [];
  [...irMen, ...irWomen].forEach(it => {
    items.push({
      id: `ir-${it.id || it.name}`,
      name: `${it.name} (Steam Iron)`,
      price: parsePrice(it.price, 25),
      emoji: it.emoji || '✨',
      categoryKey: 'STEAM_IRONING',
      categoryName: "Steam Press",
      serviceId: 'srv-steam-ironing',
      serviceName: 'Steam Ironing Only',
      subServiceName: `${it.name} Steam Iron`,
    });
  });

  // 5. Kids Wear & Toys
  const kidsItems = dcWomen.filter(it => it.gender === 'kids' || it.category === 'Kids');
  kidsItems.forEach(it => {
    items.push({
      id: `k-${it.id}`,
      name: it.name,
      price: parsePrice(it.price, 60),
      emoji: it.emoji || '👶',
      categoryKey: 'KIDS',
      categoryName: "Kids",
      serviceId: 'srv-dry-cleaning',
      serviceName: 'Premium Dry Cleaning',
      subServiceName: it.name,
    });
  });

  // 6. Sarees & Ethnic Care
  const sareeRate = parsePrice(cfg.sareeRolling?.rate, 150);
  items.push(
    { id: 'e-1', name: 'Pattu Saree Original (>10K Hydrocarbon)', price: parsePrice(cfg.dryCleaning?.women?.find(i => i.name.includes('Pattu'))?.price, 900), emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Luxury Silk", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Pattu Saree Care' },
    { id: 'e-2', name: 'Silk Saree (Kanchipuram / Banarasi / Pattu)', price: parsePrice(cfg.dryCleaning?.women?.find(i => i.name.toLowerCase() === 'saree')?.price, 220), emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Silk Sarees", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Silk Saree Care' },
    { id: 'e-3', name: 'Saree with Heavy Zari / Stone Embroidery', price: parsePrice(cfg.dryCleaning?.women?.find(i => i.name.includes('Worked'))?.price, 250), emoji: '✨', categoryKey: 'SAREES_ETHNIC', categoryName: "Designer Sarees", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Zari / Worked Saree Care' },
    { id: 'e-4', name: 'Saree Rolling & Polishing', price: sareeRate, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Saree Rolling", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Saree Rolling & Polish' },
    { id: 'e-5', name: 'Saree Steam Ironing Only', price: parsePrice(cfg.ironing?.women?.find(i => i.name.toLowerCase() === 'saree')?.price, 60), emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Steam Press", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Saree Steam Iron' },
    { id: 'e-6', name: 'Cotton Saree Starch & Steam Iron', price: parsePrice((cfg['starch-and-iron'] || cfg.starchAndIron)?.women?.find(i => i.name.includes('Saree'))?.price, 80), emoji: '🌾', categoryKey: 'SAREES_ETHNIC', categoryName: "Starch & Iron", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Saree Starch & Iron' },
    { id: 'e-7', name: 'Designer Saree Blouse (Padded/Worked)', price: parsePrice(cfg.dryCleaning?.women?.find(i => i.name.includes('Blouse'))?.price, 70), emoji: '👚', categoryKey: 'SAREES_ETHNIC', categoryName: "Blouses", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Blouse Care' },
    { id: 'e-8', name: 'Silk Dhoti & Kanduva Set', price: 240, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Silk Dhoti Set' },
    { id: 'e-9', name: 'Sherwani / Brocade Bandgala', price: parsePrice(cfg.dryCleaning?.men?.find(i => i.name.includes('Sherwani'))?.price, 250), emoji: '🧥', categoryKey: 'SAREES_ETHNIC', categoryName: "Occasion", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Sherwani Care' },
    { id: 'e-10', name: 'Men Silk / Heavy Kurta', price: parsePrice(cfg.dryCleaning?.men?.find(i => i.name.includes('Kurta'))?.price, 180), emoji: '👘', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Silk Kurta Care' },
    { id: 'e-11', name: 'Bridal Lehanga Set (Heavy Zari)', price: 550, emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Bridal", serviceId: 'srv-saree-spa', serviceName: 'Sarees & Ethnic Care', subServiceName: 'Bridal Lehanga Care' }
  );

  // 7. Curtains 4 Sub-Services & Household Linens
  const curtainDc = parsePrice(cfg.curtains?.dryCleaning, 200);
  const curtainWi = parsePrice(cfg.curtains?.washAndIron, 150);
  const curtainIr = parsePrice(cfg.curtains?.iron, 60);
  const curtainWf = parsePrice(cfg.curtains?.washAndFold, 100);
  const carpetRate = parsePrice(cfg.carpets?.ratePerSqFt, 45);

  items.push(
    { id: 'c-dc', name: 'Curtain Dry Cleaning', price: curtainDc, emoji: '🧺', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceId: 'srv-curtain-spa', serviceName: "Curtain Service", subServiceName: "Curtain Dry Cleaning" },
    { id: 'c-wi', name: 'Curtain Wash & Iron', price: curtainWi, emoji: '🫧', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceId: 'srv-curtain-spa', serviceName: "Curtain Service", subServiceName: "Curtain Wash & Iron" },
    { id: 'c-ir', name: 'Curtain Iron (Steam Press)', price: curtainIr, emoji: '✨', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceId: 'srv-curtain-spa', serviceName: "Curtain Service", subServiceName: "Curtain Iron" },
    { id: 'c-wf', name: 'Curtain Wash & Fold', price: curtainWf, emoji: '👕', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceId: 'srv-curtain-spa', serviceName: "Curtain Service", subServiceName: "Curtain Wash & Fold" },
    { id: 'h-1', name: 'Single Bedsheet', price: 150, emoji: '🛏️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-2', name: 'Double / King Bedsheet + 2 Pillow Covers', price: 220, emoji: '🛌', categoryKey: 'HOUSEHOLD', categoryName: "Bedding", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-3', name: 'Pillow Cover (Pair)', price: 40, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-4', name: 'Single Blanket / Dohar / Comforter', price: 200, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Blankets", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-5', name: 'Double Heavy Quilt / Razai', price: 350, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Quilts", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-6', name: 'Cotton Table Cloth', price: 80, emoji: '🍽️', categoryKey: 'HOUSEHOLD', categoryName: "Linens", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" },
    { id: 'h-11', name: 'Living Room Carpet / Wool Rug Wash', price: carpetRate * 10, emoji: '🧶', categoryKey: 'HOUSEHOLD', categoryName: "Carpets", serviceId: 'srv-dry-cleaning', serviceName: "Premium Dry Cleaning" }
  );

  // 8. Footwear & Bags
  const shoeRate = parsePrice(cfg.shoes?.ratePerPair, 350);
  items.push(
    { id: 'f-1', name: 'Sneakers & Casual Shoes Cleaning', price: shoeRate, emoji: '👟', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Sneakers Cleaning' },
    { id: 'f-2', name: 'Sports & Running Shoes Cleaning', price: shoeRate, emoji: '🏃', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Sports Shoes Cleaning' },
    { id: 'f-3', name: 'Formal Leather Shoes Nourish & Shine', price: shoeRate, emoji: '👞', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Formal Leather Shoes' },
    { id: 'f-4', name: 'Suede Boots & Loafers Restoration', price: shoeRate + 49, emoji: '🥾', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Suede Boots' },
    { id: 'f-5', name: 'School / College Backpack Cleaning', price: 150, emoji: '🎒', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Backpack Cleaning' },
    { id: 'f-6', name: 'Leather / Designer Handbag Conditioning', price: 250, emoji: '👜', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Handbag Care' },
    { id: 'f-7', name: 'Travel Duffel / Trolley Bag Cleanse', price: 299, emoji: '🧳', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags", serviceId: 'srv-shoe-spa', serviceName: 'Shoe & Sneaker Care', subServiceName: 'Travel Bag Cleaning' }
  );

  // 9. Starch & Finishing
  const starchObj = cfg['starch-and-iron'] || cfg.starchAndIron || {};
  const starchMen = starchObj.men || [];
  const starchWomen = starchObj.women || [];
  const starchCommon = starchObj.common || [];
  [...starchMen, ...starchWomen, ...starchCommon].forEach(it => {
    items.push({
      id: `s-${it.id || it.name}`,
      name: it.name,
      price: parsePrice(it.price, 45),
      emoji: it.emoji || '🌾',
      categoryKey: 'STARCH_FINISHING',
      categoryName: "Starch",
      serviceId: 'srv-starch-and-iron',
      serviceName: 'Starch & Finishing',
      subServiceName: it.name,
    });
  });

  // 10. Extra Services & Custom Charges
  items.push(
    { id: 'ex-1', name: 'Urgent Heavy Stain Removal Treatment', price: 100, emoji: '🧼', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care", serviceId: 'srv-dry-cleaning', serviceName: 'Special Care' },
    { id: 'ex-2', name: 'Gold/Silver Zari Polishing & Shield', price: 150, emoji: '✨', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care", serviceId: 'srv-saree-spa', serviceName: 'Special Care' },
    { id: 'ex-3', name: 'Zip Replacement & Minor Tailoring Alteration', price: 80, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration", serviceId: 'srv-dry-cleaning', serviceName: 'Alteration' },
    { id: 'ex-4', name: 'Button Stitch & Hemming Repair', price: 40, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration", serviceId: 'srv-dry-cleaning', serviceName: 'Alteration' },
    { id: 'ex-5', name: 'Luxury Gift Box Packaging & Hanger', price: 50, emoji: '🎁', categoryKey: 'EXTRA_SERVICES', categoryName: "Packing", serviceId: 'srv-dry-cleaning', serviceName: 'Packaging' },
    { id: 'ex-6', name: 'Antiseptic Fabric Sanitization Surcharge', price: 40, emoji: '🛡️', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care", serviceId: 'srv-wash-and-iron', serviceName: 'Sanitization' }
  );

  // 11. Dynamic Custom Services & Sub-Services (e.g. "Gopi" or any custom service)
  const customList = Array.isArray(cfg.customServices) ? cfg.customServices : [];
  const dynamicExtras = Array.isArray(extraServices) ? extraServices : [];
  const allCustom = [...customList, ...dynamicExtras];

  const processedCustomIds = new Set();
  allCustom.forEach(cs => {
    if (!cs || !cs.id || processedCustomIds.has(cs.id)) return;
    processedCustomIds.add(cs.id);

    const srvId = cs.id.startsWith('srv-') ? cs.id : `srv-${cs.id}`;
    const srvName = cs.title || cs.name || 'Custom Service';
    const srvEmoji = cs.emoji || cs.icon || '✨';
    const srvCategory = cs.category || srvName;

    if (Array.isArray(cs.subServices) && cs.subServices.length > 0) {
      cs.subServices.forEach((sub, sIdx) => {
        items.push({
          id: sub.id || `${srvId}-sub-${sIdx}`,
          name: `${srvName} — ${sub.name}`,
          price: parsePrice(sub.price, cs.startingPrice || 99),
          emoji: sub.emoji || srvEmoji,
          categoryKey: 'CUSTOM_SERVICES',
          categoryName: srvCategory,
          serviceId: srvId,
          serviceName: srvName,
          subServiceName: sub.name,
        });
      });
    } else {
      items.push({
        id: `${srvId}-item`,
        name: srvName,
        price: parsePrice(cs.startingPrice || cs.defaultPrice || cs.price, 99),
        emoji: srvEmoji,
        categoryKey: 'CUSTOM_SERVICES',
        categoryName: srvCategory,
        serviceId: srvId,
        serviceName: srvName,
        subServiceName: srvName,
      });
    }
  });

  // 12. Dynamic Custom Items added to config
  const customItems = Array.isArray(cfg.customItems) ? cfg.customItems : [];
  customItems.forEach(ci => {
    items.push({
      id: ci.id || `ci-${Date.now()}-${ci.name}`,
      name: ci.name,
      price: parsePrice(ci.price, 99),
      emoji: ci.emoji || '⚡',
      categoryKey: ci.categoryKey || 'CUSTOM_SERVICES',
      categoryName: ci.categoryName || ci.category || 'Custom Service',
      serviceId: ci.serviceId || 'srv-custom',
      serviceName: ci.serviceName || 'Custom Service',
      subServiceName: ci.subServiceName || ci.name,
    });
  });

  return items;
};



/**
 * Synchronizes and recalculates starting prices inside config.services
 */
export const recalculateServicesInConfig = (config) => {
  if (!config) return config;
  const cfg = { ...config };

  // Lowest dry cleaning
  const dcItems = [...(cfg.dryCleaning?.men || []), ...(cfg.dryCleaning?.women || []), ...(cfg.dryCleaning?.common || [])];
  const dcPrices = dcItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const dcMin = dcPrices.length > 0 ? Math.min(...dcPrices) : 40;

  // Lowest steam iron
  const irItems = [...(cfg.ironing?.men || []), ...(cfg.ironing?.women || [])];
  const irPrices = irItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const irMin = irPrices.length > 0 ? Math.min(...irPrices) : 12;

  // Lowest starch and iron
  const starchList = cfg['starch-and-iron'] || cfg.starchAndIron || {};
  const starchItems = [...(starchList.men || []), ...(starchList.women || []), ...(starchList.common || [])];
  const starchPrices = starchItems.map(i => Number(i.price)).filter(p => !isNaN(p) && p > 0);
  const starchMin = starchPrices.length > 0 ? Math.min(...starchPrices) : 25;

  // Wash and Fold / Wash and Iron per-kg rates
  const foldRate = Number(cfg.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.men) || 100;
  const ironRate = Number(cfg.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.men) || 130;

  // Curtains lowest
  const curtainDCRate = Number(cfg.curtains?.dryCleaning) || 200;
  const curtainWIRate = Number(cfg.curtains?.washAndIron) || 150;
  const curtainIRRate = Number(cfg.curtains?.iron) || 60;
  const curtainWFRate = Number(cfg.curtains?.washAndFold) || 100;
  const curtainMin = Math.min(curtainDCRate, curtainWIRate, curtainIRRate, curtainWFRate);

  // Shoes, Carpets, Saree rolling
  const shoeRate = Number(cfg.shoes?.ratePerPair) || 350;
  const carpetRate = Number(cfg.carpets?.ratePerSqFt) || 45;
  const sareeRate = Number(cfg.sareeRolling?.rate) || 150;

  if (Array.isArray(cfg.services)) {
    cfg.services = cfg.services.map(srv => {
      const cleanId = (srv.id || '').replace(/^srv-/, '');
      if (cleanId === 'dry-cleaning') {
        return { ...srv, startingPrice: dcMin, startingPriceDisplay: `Starts at ₹${dcMin}` };
      }
      if (cleanId === 'ironing') {
        return { ...srv, startingPrice: irMin, startingPriceDisplay: `Starts at ₹${irMin}` };
      }
      if (cleanId === 'starch-and-iron') {
        return { ...srv, startingPrice: starchMin, startingPriceDisplay: `Starts at ₹${starchMin}` };
      }
      if (cleanId === 'wash-and-fold') {
        return { ...srv, startingPrice: foldRate, startingPriceDisplay: `Starts at ₹${foldRate} / Kg` };
      }
      if (cleanId === 'wash-and-iron') {
        return { ...srv, startingPrice: ironRate, startingPriceDisplay: `Starts at ₹${ironRate} / Kg` };
      }
      if (cleanId === 'saree-rolling') {
        return {
          ...srv,
          rate: sareeRate,
          startingPrice: sareeRate,
          startingPriceDisplay: sareeRate ? `Starts at ₹${sareeRate}` : 'Price to be confirmed',
        };
      }
      if (cleanId === 'curtain-washing') {
        return {
          ...srv,
          startingPrice: curtainMin,
          startingPriceDisplay: `Starts at ₹${curtainMin}`,
          subServices: [
            { id: 'curtain-dc', key: 'dryCleaning', name: 'Curtain Dry Cleaning', price: curtainDCRate, emoji: '🧺' },
            { id: 'curtain-wi', key: 'washAndIron', name: 'Curtain Wash & Iron', price: curtainWIRate, emoji: '🫧' },
            { id: 'curtain-ir', key: 'iron', name: 'Curtain Iron', price: curtainIRRate, emoji: '✨' },
            { id: 'curtain-wf', key: 'washAndFold', name: 'Curtain Wash & Fold', price: curtainWFRate, emoji: '👕' },
          ]
        };
      }
      if (cleanId === 'shoe-washing') {
        return { ...srv, startingPrice: shoeRate, startingPriceDisplay: `₹${shoeRate} / pair`, ratePerPair: shoeRate };
      }
      if (cleanId === 'carpet-washing') {
        return { ...srv, startingPrice: carpetRate, startingPriceDisplay: `₹${carpetRate} / sq. ft.`, ratePerSqFt: carpetRate };
      }
      return srv;
    });
  }

  cfg.customServices = Array.isArray(cfg.customServices) ? cfg.customServices : [];
  cfg.customItems = Array.isArray(cfg.customItems) ? cfg.customItems : [];

  return cfg;
};

export const pricingService = {
  /**
   * Retrieves active pricing configuration with Firestore sync
   */
  async getPricingConfig() {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pricing'));
        if (snap.exists()) {
          const remoteData = snap.data();
          const merged = recalculateServicesInConfig({
            ...INITIAL_PRICING_CONFIG,
            ...remoteData,
          });
          try {
            localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        }
      } catch (e) {
        console.warn("Firestore pricing config fetch failed:", e);
      }
    }

    try {
      const cached = localStorage.getItem(PRICING_STORAGE_KEY);
      if (cached) {
        return recalculateServicesInConfig(JSON.parse(cached));
      }
    } catch (e) {}

    return recalculateServicesInConfig(INITIAL_PRICING_CONFIG);
  },

  /**
   * Updates pricing configuration in Firestore & local storage (Admin access)
   * and broadcasts real-time updates across all open tabs, windows, and remote devices.
   */
  async updatePricingConfig(newConfig) {
    const calibratedConfig = recalculateServicesInConfig(newConfig);

    if (isFirebaseConfigured && db) {
      try {
        // Overwrite full document without merge: true so deleted items/categories/sub-services are permanently purged
        await setDoc(doc(db, 'settings', 'pricing'), calibratedConfig);
      } catch (e) {
        console.warn("Firestore pricing update failed:", e);
      }
    }
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(calibratedConfig));
    } catch (e) {}

    // 1. Dispatch custom DOM event
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-pricing-updated', { detail: calibratedConfig }));
      }
    } catch (e) {}

    // 2. Broadcast via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(PRICING_BROADCAST_CHANNEL);
        bc.postMessage(calibratedConfig);
        bc.close();
      }
    } catch (e) {}

    return calibratedConfig;
  },

  /**
   * Subscribes to real-time pricing changes across Firestore onSnapshot, BroadcastChannel, and Custom Events
   */
  subscribeToPricing(callback) {
    if (typeof callback !== 'function') return () => {};

    let unsubscribeFirestore = null;

    // Attach Firestore real-time listener for multi-device instant sync
    if (isFirebaseConfigured && db) {
      try {
        unsubscribeFirestore = onSnapshot(doc(db, 'settings', 'pricing'), (snap) => {
          if (snap.exists()) {
            const remoteData = snap.data();
            const merged = recalculateServicesInConfig({
              ...INITIAL_PRICING_CONFIG,
              ...remoteData,
            });
            try {
              localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
            callback(merged);
          }
        }, (err) => {
          console.warn("Firestore real-time pricing subscription error:", err);
        });
      } catch (e) {
        console.warn("Failed to attach Firestore real-time listener:", e);
      }
    }

    // Custom window event listener (for immediate same-window UI updates)
    const handleCustomEvent = (e) => {
      if (e.detail) callback(e.detail);
      else pricingService.getPricingConfig().then(callback);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('techwash-pricing-updated', handleCustomEvent);
    }

    // Storage event for cross-window sync
    const handleStorageEvent = (e) => {
      if (e.key === PRICING_STORAGE_KEY && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    // BroadcastChannel listener
    let channel = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(PRICING_BROADCAST_CHANNEL);
        channel.onmessage = (event) => {
          if (event.data) callback(event.data);
        };
      }
    } catch (err) {}

    return () => {
      if (unsubscribeFirestore) {
        try { unsubscribeFirestore(); } catch (e) {}
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('techwash-pricing-updated', handleCustomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
    };
  }
};
