/**
 * Tech Wash Centralized Official Pricing Configuration
 * Authoritative pricing dictionary, weight estimation matrices, and dimensional calculators.
 * Synchronizes with Firestore `settings/pricing` if configured, with exact default fallbacks.
 */
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
      name: 'Curtain Washing',
      icon: '🪟',
      emoji: '🪟',
      tagline: 'Deep cleaning for curtains',
      description: 'Deep dust extraction, gentle washing, and wrinkle-free steam hanging for all curtain sizes.',
      startingPriceDisplay: '₹30 / sq. ft.',
      pricingType: 'DIMENSIONAL_AREA',
      unit: 'sq. ft.',
      ratePerSqFt: 30,
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
      { id: 'ir-m-23', name: 'Pillow Cover', price: 15, emoji: '🛋️', gender: 'common', category: 'Household', subCategory: 'household' },
      { id: 'ir-m-24', name: 'Curtains Half', price: 100, emoji: '🪟', gender: 'common', category: 'Curtains', subCategory: 'household' },
      { id: 'ir-m-25', name: 'Curtains Medium', price: 150, emoji: '🪟', gender: 'common', category: 'Curtains', subCategory: 'household' },
      { id: 'ir-m-26', name: 'Curtains Full', price: 300, emoji: '🪟', gender: 'common', category: 'Curtains', subCategory: 'household' },
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

  // 4. Dimensional and Per-Unit Services
  curtains: {
    ratePerSqFt: 30,
    unit: 'sq. ft.',
    defaultPresets: [
      { label: 'Small Window (3ft × 5ft)', width: 3, height: 5 },
      { label: 'Standard Window (4ft × 6ft)', width: 4, height: 6 },
      { label: 'Large Window (6ft × 7ft)', width: 6, height: 7 },
      { label: 'Balcony Door (9ft × 6ft)', width: 9, height: 6 },
      { label: 'Full Wall (10ft × 9ft)', width: 10, height: 9 },
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
    rate: null, // Unpriced / Price to be confirmed
    status: 'TO_BE_CONFIRMED',
    displayMessage: 'Price to be confirmed at pickup',
  }
};

const PRICING_STORAGE_KEY = 'techwash_pricing_config_v2';

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
          return {
            ...INITIAL_PRICING_CONFIG,
            ...remoteData,
          };
        }
      } catch (e) {
        console.warn("Firestore pricing config fetch failed:", e);
      }
    }

    try {
      const cached = localStorage.getItem(PRICING_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    return INITIAL_PRICING_CONFIG;
  },

  /**
   * Updates pricing configuration in Firestore & local storage (Admin access)
   */
  async updatePricingConfig(newConfig) {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'pricing'), newConfig, { merge: true });
      } catch (e) {
        console.warn("Firestore pricing update failed:", e);
      }
    }
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(newConfig));
    return newConfig;
  }
};
