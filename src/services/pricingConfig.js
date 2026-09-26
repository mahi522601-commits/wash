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
  }
};

const PRICING_STORAGE_KEY = 'techwash_pricing_config_v2';
const PRICING_BROADCAST_CHANNEL = 'techwash_pricing_channel';

/**
 * Builds the dynamic 8 Walk-In Services list based on current pricingConfig
 */
export const buildWalkInServicesFromPricing = (config = INITIAL_PRICING_CONFIG) => {
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

  return [
    { id: 'srv-dry-cleaning', name: 'Premium Dry Cleaning', emoji: '👔', defaultPrice: 90, startingPrice: dcMin },
    { id: 'srv-wash-and-fold', name: 'Wash & Fold', emoji: '🧺', defaultPrice: foldRate, perKg: true, menPrice: foldRate, womenPrice: foldWomenRate },
    { id: 'srv-wash-and-iron', name: 'Wash & Steam Iron', emoji: '🫧', defaultPrice: ironRate, perKg: true, menPrice: ironRate, womenPrice: ironWomenRate },
    { id: 'srv-steam-ironing', name: 'Steam Ironing Only', emoji: '✨', defaultPrice: irMin || 25 },
    { id: 'srv-saree-spa', name: 'Sarees & Ethnic Spa', emoji: '🥻', defaultPrice: sareeRate || 60 },
    { id: 'srv-shoe-spa', name: 'Shoe & Sneaker Spa', emoji: '👟', defaultPrice: shoeRate },
    { id: 'srv-curtain-spa', name: 'Curtain Service', emoji: '🪟', defaultPrice: curtainDCRate },
    { id: 'srv-starch-and-iron', name: 'Starch & Finishing', emoji: '🌾', defaultPrice: starchMin || 45 },
  ];
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
export const buildMasterCatalogFromPricing = (config = INITIAL_PRICING_CONFIG) => {
  const cfg = config || INITIAL_PRICING_CONFIG;
  const items = [];

  // 1. Men's Dry Cleaning & Care
  const dcMen = cfg.dryCleaning?.men || [];
  dcMen.forEach(it => {
    items.push({
      id: it.id || `m-dc-${it.name}`,
      name: it.name,
      price: Number(it.price) || 90,
      emoji: it.emoji || '👔',
      categoryKey: 'MEN',
      categoryName: it.subCategory === 'bottoms' ? "Men's Bottoms" : it.subCategory === 'jackets' ? "Suits & Outerwear" : it.subCategory === 'traditional' ? "Ethnic" : "Men's Tops",
    });
  });

  // 2. Women's Wear
  const dcWomen = cfg.dryCleaning?.women || [];
  dcWomen.forEach(it => {
    if (it.gender === 'kids' || it.category === 'Kids') return;
    items.push({
      id: it.id || `w-dc-${it.name}`,
      name: it.name,
      price: Number(it.price) || 120,
      emoji: it.emoji || '👗',
      categoryKey: 'WOMEN',
      categoryName: it.subCategory === 'traditional' ? "Sarees & Ethnic" : it.subCategory === 'bottoms' ? "Women's Bottoms" : it.subCategory === 'dresses' ? "Dresses" : "Women's Tops",
    });
  });

  // 3. Steam Ironing
  const irMen = cfg.ironing?.men || [];
  const irWomen = cfg.ironing?.women || [];
  [...irMen, ...irWomen].forEach(it => {
    items.push({
      id: `ir-${it.id || it.name}`,
      name: `${it.name} (Steam Iron)`,
      price: Number(it.price) || 25,
      emoji: it.emoji || '✨',
      categoryKey: 'STEAM_IRONING',
      categoryName: "Steam Press",
    });
  });

  // 4. Kids Wear
  const kidsItems = dcWomen.filter(it => it.gender === 'kids' || it.category === 'Kids');
  if (kidsItems.length > 0) {
    kidsItems.forEach(it => {
      items.push({
        id: `k-${it.id}`,
        name: it.name,
        price: Number(it.price) || 60,
        emoji: it.emoji || '👶',
        categoryKey: 'KIDS',
        categoryName: "Kids",
      });
    });
  } else {
    items.push(
      { id: 'k-1', name: 'Kids Frock / Dress', price: 60, emoji: '👗', categoryKey: 'KIDS', categoryName: "Kids" },
      { id: 'k-2', name: 'Kids Shirt', price: 70, emoji: '👕', categoryKey: 'KIDS', categoryName: "Kids" },
      { id: 'k-3', name: 'Kids Pant / Shorts', price: 70, emoji: '👖', categoryKey: 'KIDS', categoryName: "Kids" },
      { id: 'k-4', name: 'Kids Dhoti / Pyjama', price: 90, emoji: '🥻', categoryKey: 'KIDS', categoryName: "Kids" },
      { id: 'k-5', name: 'Soft Toys - Small', price: 100, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" },
      { id: 'k-6', name: 'Soft Toys - Medium', price: 150, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" },
      { id: 'k-7', name: 'Soft Toys - Large Giant', price: 200, emoji: '🧸', categoryKey: 'KIDS', categoryName: "Toys" }
    );
  }

  // 5. Sarees & Ethnic Spa
  const sareeRate = Number(cfg.sareeRolling?.rate) || 150;
  items.push(
    { id: 'e-1', name: 'Pattu Saree Original (>10K Hydrocarbon)', price: cfg.dryCleaning?.women?.find(i => i.name.includes('Pattu'))?.price || 900, emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Luxury Silk" },
    { id: 'e-2', name: 'Silk Saree (Kanchipuram / Banarasi / Pattu)', price: cfg.dryCleaning?.women?.find(i => i.name.toLowerCase() === 'saree')?.price || 220, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Silk Sarees" },
    { id: 'e-3', name: 'Saree with Heavy Zari / Stone Embroidery', price: cfg.dryCleaning?.women?.find(i => i.name.includes('Worked'))?.price || 250, emoji: '✨', categoryKey: 'SAREES_ETHNIC', categoryName: "Designer Sarees" },
    { id: 'e-4', name: 'Saree Rolling & Polishing', price: sareeRate, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Saree Rolling" },
    { id: 'e-5', name: 'Saree Steam Ironing Only', price: cfg.ironing?.women?.find(i => i.name.toLowerCase() === 'saree')?.price || 60, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Steam Press" },
    { id: 'e-6', name: 'Cotton Saree Starch & Steam Iron', price: (cfg['starch-and-iron'] || cfg.starchAndIron)?.women?.find(i => i.name.includes('Saree'))?.price || 80, emoji: '🌾', categoryKey: 'SAREES_ETHNIC', categoryName: "Starch & Iron" },
    { id: 'e-7', name: 'Designer Saree Blouse (Padded/Worked)', price: cfg.dryCleaning?.women?.find(i => i.name.includes('Blouse'))?.price || 70, emoji: '👚', categoryKey: 'SAREES_ETHNIC', categoryName: "Blouses" },
    { id: 'e-8', name: 'Silk Dhoti & Kanduva Set', price: 240, emoji: '🥻', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic" },
    { id: 'e-9', name: 'Sherwani / Brocade Bandgala', price: cfg.dryCleaning?.men?.find(i => i.name.includes('Sherwani'))?.price || 250, emoji: '🧥', categoryKey: 'SAREES_ETHNIC', categoryName: "Occasion" },
    { id: 'e-10', name: 'Men Silk / Heavy Kurta', price: cfg.dryCleaning?.men?.find(i => i.name.includes('Kurta'))?.price || 180, emoji: '👘', categoryKey: 'SAREES_ETHNIC', categoryName: "Men Ethnic" },
    { id: 'e-11', name: 'Bridal Lehanga Set (Heavy Zari)', price: 550, emoji: '👑', categoryKey: 'SAREES_ETHNIC', categoryName: "Bridal" }
  );

  // 6. Household & Linens
  const curtainDc = Number(cfg.curtains?.dryCleaning) || 200;
  const curtainWi = Number(cfg.curtains?.washAndIron) || 150;
  const curtainIr = Number(cfg.curtains?.iron) || 60;
  const curtainWf = Number(cfg.curtains?.washAndFold) || 100;
  const carpetRate = Number(cfg.carpets?.ratePerSqFt) || 45;

  items.push(
    { id: 'h-1', name: 'Single Bedsheet', price: 150, emoji: '🛏️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
    { id: 'h-2', name: 'Double / King Bedsheet + 2 Pillow Covers', price: 220, emoji: '🛌', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
    { id: 'h-3', name: 'Pillow Cover (Pair)', price: 40, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Bedding" },
    { id: 'h-4', name: 'Single Blanket / Dohar / Comforter', price: 200, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Blankets" },
    { id: 'h-5', name: 'Double Heavy Quilt / Razai', price: 350, emoji: '🛋️', categoryKey: 'HOUSEHOLD', categoryName: "Quilts" },
    { id: 'h-6', name: 'Cotton Table Cloth', price: 80, emoji: '🍽️', categoryKey: 'HOUSEHOLD', categoryName: "Linens" },
    { id: 'c-dc', name: 'Curtain Dry Cleaning', price: curtainDc, emoji: '🧺', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Dry Cleaning" },
    { id: 'c-wi', name: 'Curtain Wash & Iron', price: curtainWi, emoji: '🫧', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Wash and Iron" },
    { id: 'c-ir', name: 'Curtain Iron', price: curtainIr, emoji: '✨', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Iron" },
    { id: 'c-wf', name: 'Curtain Wash & Fold', price: curtainWf, emoji: '👕', categoryKey: 'HOUSEHOLD', categoryName: "Curtains", serviceName: "Curtain Service", subServiceName: "Wash and Fold" },
    { id: 'h-11', name: 'Living Room Carpet / Wool Rug Spa', price: carpetRate * 10, emoji: '🧶', categoryKey: 'HOUSEHOLD', categoryName: "Carpets" }
  );

  // 7. Footwear & Bags
  const shoeRate = Number(cfg.shoes?.ratePerPair) || 350;
  items.push(
    { id: 'f-1', name: 'Sneakers & Casual Shoes Spa', price: shoeRate, emoji: '👟', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
    { id: 'f-2', name: 'Sports & Running Shoes Spa', price: shoeRate, emoji: '🏃', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
    { id: 'f-3', name: 'Formal Leather Shoes Nourish & Shine', price: shoeRate, emoji: '👞', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
    { id: 'f-4', name: 'Suede Boots & Loafers Restoration', price: shoeRate + 49, emoji: '🥾', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Shoes" },
    { id: 'f-5', name: 'School / College Backpack Spa', price: 150, emoji: '🎒', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" },
    { id: 'f-6', name: 'Leather / Designer Handbag Conditioning', price: 250, emoji: '👜', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" },
    { id: 'f-7', name: 'Travel Duffel / Trolley Bag Cleanse', price: 299, emoji: '🧳', categoryKey: 'FOOTWEAR_BAGS', categoryName: "Bags" }
  );

  // 8. Starch & Finishing
  const starchObj = cfg['starch-and-iron'] || cfg.starchAndIron || {};
  const starchMen = starchObj.men || [];
  const starchWomen = starchObj.women || [];
  const starchCommon = starchObj.common || [];
  [...starchMen, ...starchWomen, ...starchCommon].forEach(it => {
    items.push({
      id: `s-${it.id || it.name}`,
      name: it.name,
      price: Number(it.price) || 45,
      emoji: it.emoji || '🌾',
      categoryKey: 'STARCH_FINISHING',
      categoryName: "Starch",
    });
  });

  // 9. Extra Services & Custom Charges
  items.push(
    { id: 'ex-1', name: 'Urgent Heavy Stain Removal Treatment', price: 100, emoji: '🧼', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" },
    { id: 'ex-2', name: 'Gold/Silver Zari Polishing & Shield', price: 150, emoji: '✨', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" },
    { id: 'ex-3', name: 'Zip Replacement & Minor Tailoring Alteration', price: 80, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration" },
    { id: 'ex-4', name: 'Button Stitch & Hemming Repair', price: 40, emoji: '🪡', categoryKey: 'EXTRA_SERVICES', categoryName: "Alteration" },
    { id: 'ex-5', name: 'Luxury Gift Box Packaging & Hanger', price: 50, emoji: '🎁', categoryKey: 'EXTRA_SERVICES', categoryName: "Packing" },
    { id: 'ex-6', name: 'Antiseptic Fabric Sanitization Surcharge', price: 40, emoji: '🛡️', categoryKey: 'EXTRA_SERVICES', categoryName: "Special Care" }
  );

  return items;
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
          const merged = {
            ...INITIAL_PRICING_CONFIG,
            ...remoteData,
          };
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
        return JSON.parse(cached);
      }
    } catch (e) {}

    return INITIAL_PRICING_CONFIG;
  },

  /**
   * Updates pricing configuration in Firestore & local storage (Admin access)
   * and broadcasts real-time updates across all open tabs and windows.
   */
  async updatePricingConfig(newConfig) {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'settings', 'pricing'), newConfig, { merge: true });
      } catch (e) {
        console.warn("Firestore pricing update failed:", e);
      }
    }
    try {
      localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {}

    // 1. Dispatch custom DOM event
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techwash-pricing-updated', { detail: newConfig }));
      }
    } catch (e) {}

    // 2. Broadcast via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(PRICING_BROADCAST_CHANNEL);
        bc.postMessage(newConfig);
        bc.close();
      }
    } catch (e) {}

    return newConfig;
  },

  /**
   * Subscribes to real-time pricing changes across Firestore, BroadcastChannel, and Custom Events
   */
  subscribeToPricing(callback) {
    if (typeof callback !== 'function') return () => {};

    // Custom window event listener
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
