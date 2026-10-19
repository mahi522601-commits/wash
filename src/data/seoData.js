/**
 * Techwash Laundry Centralized SEO & Geo-Targeting Dataset
 * Single source of truth for Manikonda Local SEO, Service SEO, and Schema.org metadata
 */

export const BASE_URL = 'https://www.techwashlaundry.com';

export const BUSINESS_INFO = {
  name: 'Techwash Laundry Services',
  legalName: 'Techwash Laundry Services',
  alternateName: 'Techwash Laundry',
  url: BASE_URL,
  logo: `${BASE_URL}/techwashlogo.webp`,
  image: `${BASE_URL}/techwashlogo.webp`,
  telephone: '+91 63048 45567',
  email: 'support@techwashlaundry.com',
  priceRange: '₹12 - ₹350',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Google Pay, PhonePe, Paytm, Net Banking',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: '500089',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 17.4005,
    longitude: 78.3895,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '21:00',
    },
  ],
  sameAs: [
    'https://instagram.com/techwashlaundry',
    'https://facebook.com/techwashlaundry',
    'https://youtube.com',
  ],
};

/**
 * Manikonda Local SEO Focus Area
 * Primary target for local SEO cluster implementation
 */
export const SEO_AREAS = [
  {
    slug: 'manikonda',
    name: 'Manikonda',
    h1: 'Best Laundry Service in Manikonda, Hyderabad',
    title: 'Best Laundry Service in Manikonda, Hyderabad - Flat 20% Off | Techwash Laundry',
    metaDescription: 'Rated #1 Best Laundry Service in Manikonda, Hyderabad. Flat 20% Off + Free Doorstep Pickup & Delivery in Manikonda across Puppalaguda, OU Colony, Secretariat Colony, Lanco Hills & Alkapoor. 100% RO soft-water wash, 3D steam ironing & eco dry cleaning.',
    keywords: 'best laundry service in Manikonda, laundry service in Manikonda, best laundry in Manikonda, laundry services in Manikonda, best dry cleaners in Manikonda, dry cleaning Manikonda, laundry near Manikonda, laundry shop near Manikonda, laundry pickup Manikonda, laundry delivery Manikonda, dry cleaners near me Manikonda',
    pincodes: ['500089'],
    landmarks: [
      'Secretariat Colony',
      'OU Colony',
      'Lanco Hills Road',
      'Shirdi Sai Nagar',
      'Puppalaguda Main Road',
      'Alkapoor Township Corridor',
    ],
    introText: 'Techwash Laundry is rated the #1 Best Laundry Service in Manikonda, Hyderabad. We provide professional laundry, certified eco-friendly European hydrocarbon dry cleaning, weight-based wash & iron, and 3D steam pressing for residents across Manikonda. With 100% demineralized 0 PPM RO soft water and single-customer isolated wash drums, our dedicated doorstep fleet provides daily scheduled laundry pickup and delivery across Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, Puppalaguda, and surrounding residential societies in Manikonda.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Daily office wear shirts & trousers steam ironing and crease retention',
      'Weight-based wash & fold / wash & iron for working professionals & families',
      'Eco-friendly hydrocarbon dry cleaning for formal suits, blazers & dresses',
      'Traditional saree rolling & polishing for silk, pattu & banarasi sarees',
      'Living room curtains and heavy carpet deep extraction washing',
    ],
    nearbyAreas: [],
    faqs: [
      {
        question: 'Which is the best laundry service in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is recognized as the best laundry service in Manikonda, Hyderabad. We use 100% demineralized 0 PPM RO soft water, guarantee single-customer isolated wash drums, use certified European hydrocarbon dry cleaning with zero PERC, and provide daily doorstep pickup and delivery across all societies in Manikonda (500089).',
      },
      {
        question: 'Does Techwash Laundry provide service in Manikonda?',
        answer: 'Yes, Techwash Laundry provides full laundry services in Manikonda including weight-based wash & fold (from ₹100/kg), wash & iron (from ₹130/kg), steam ironing (from ₹12), and premium dry cleaning (from ₹40).',
      },
      {
        question: 'How does laundry pickup and delivery in Manikonda work?',
        answer: 'You can schedule a pickup online in 60 seconds. Our executive arrives at your preferred time slot (8 AM – 9 PM) anywhere in Manikonda with calibrated electronic scales and delivers your clothes back fresh, crisp, and sealed within 24–48 hours.',
      },
      {
        question: 'Where can I find reliable dry cleaning in Manikonda?',
        answer: 'Techwash Laundry provides certified non-toxic European hydrocarbon dry cleaning in Manikonda with zero PERC, preserving suit fabrics, delicate silks, and designer wear without harsh chemical odors.',
      },
      {
        question: 'Is Techwash Laundry available near Secretariat Colony & OU Colony in Manikonda?',
        answer: 'Yes, our pickup fleet operates daily throughout Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, and adjacent Manikonda corridors.',
      },
      {
        question: 'What is the turnaround time for laundry delivery in Manikonda?',
        answer: 'Standard turnaround for regular laundry and dry cleaning is 48 hours. Express 24-hour delivery is also available for urgent orders in Manikonda upon request.',
      },
    ],
  },
];

/**
 * 11 Genuine Techwash Services & Core Intent Mappings
 */
export const LEGACY_SLUG_MAP = {
  'laundry-pickup-delivery': 'laundry-pickup-and-delivery',
  'ironing': 'ironing-service',
  'shoe-washing': 'shoe-cleaning',
  'curtain-washing': 'curtain-cleaning',
  'carpet-washing': 'carpet-cleaning',
};

export const BUSINESS_BRANCHES = [
  {
    id: 'counter-1',
    code: 'TW-POS-01',
    name: 'Techwash Laundry Main Branch (Manikonda / Shaikpet)',
    address: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089',
    locality: 'Manikonda',
    postalCode: '500089',
    telephone: '+91 63048 45567',
    geo: { latitude: 17.4005, longitude: 78.3895 },
  },
  {
    id: 'counter-2',
    code: 'TW-POS-02',
    name: 'Techwash Laundry Services Branch 1 (Tolichowki / OU Colony)',
    address: 'Beside Dreamscape hotel, Ward No 8, Block No 1, Tolichowki, OU Colony, Shaikpet, Hyderabad, Telangana 500008',
    locality: 'Tolichowki',
    postalCode: '500008',
    telephone: '+91 90008 13444',
    geo: { latitude: 17.4018, longitude: 78.4078 },
  },
  {
    id: 'counter-3',
    code: 'TW-POS-03',
    name: 'Techwash Pick Up Point (Ambience Courtyard)',
    address: 'Beside Ambience Courtyard, Shaikpet, Hyderabad, Telangana 500089',
    locality: 'Ambience Courtyard',
    postalCode: '500089',
    telephone: '+91 98667 40179',
    geo: { latitude: 17.4035, longitude: 78.3962 },
  },
];

export const SEO_SERVICES = [
  // 1. Core Intent: General Laundry Service
  {
    slug: 'laundry-service',
    name: 'Laundry Service',
    h1: 'Best Laundry Service Near Me in Manikonda, Hyderabad',
    title: 'Laundry Service Near Me - Best Laundry in Manikonda & Hyderabad | Techwash',
    metaDescription: 'Looking for the best laundry service near you? Techwash Laundry offers 0 PPM RO soft water washing, isolated single-customer drums, and free doorstep pickup across Manikonda, Tolichowki & Hyderabad.',
    pricingDisplay: 'From ₹100 / Kg',
    category: 'Daily Laundry',
    primaryKeyword: 'laundry service near me',
    secondaryKeywords: 'laundry near me, best laundry near me, best laundry service in Manikonda, laundry services near me, clothes washing near me, laundromat near me, laundry shop near me, laundry pickup near me, laundry delivery near me, doorstep laundry near me',
    nearMeKeywords: [
      'laundry near me',
      'laundry service near me',
      'best laundry near me',
      'best laundry service near me',
      'clothes washing near me',
      'laundromat near me',
      'laundry shop near me',
      'doorstep laundry near me',
      'laundry pickup near me',
      'wash and fold near me',
      'laundry near Manikonda',
      'laundry near Tolichowki'
    ],
    processSummary: 'Demineralized 0 PPM RO soft water washing, single-customer isolated drum cycles, bio-enzyme stain removal, sensor moisture drying, and precision steam pressing.',
  },
  // 2. Core Intent: Wash & Iron
  {
    slug: 'wash-and-iron',
    name: 'Wash & Iron',
    h1: 'Best Wash & Iron Service Near Me in Manikonda, Hyderabad',
    title: 'Wash and Iron Near Me - Best Wash & Steam Iron in Manikonda | Techwash',
    metaDescription: 'Need wash and iron near you? Techwash Laundry offers single-customer drum wash in 100% RO soft water and 3D tension steam form pressing with doorstep delivery across Manikonda, Tolichowki & Hyderabad.',
    pricingDisplay: 'Starts at ₹130 / Kg',
    category: 'Weight Based',
    primaryKeyword: 'wash and iron near me',
    secondaryKeywords: 'wash and steam iron near me, wash and iron service in Manikonda, clothes wash and iron near me, laundry wash and iron near me, wash and press near me, clothes washing and ironing near me',
    nearMeKeywords: [
      'wash and iron near me',
      'wash and steam iron near me',
      'clothes wash and iron near me',
      'wash and press near me',
      'laundry wash and iron near me',
      'wash iron service near me',
      'wash and iron Manikonda',
      'wash and iron Tolichowki'
    ],
    processSummary: 'Single-customer drum wash in 0 PPM soft water, bio-enzyme stain removal, followed by 3D tension mannequin steam form pressing.',
  },
  // 3. Core Intent: Dry Cleaning
  {
    slug: 'dry-cleaning',
    name: 'Dry Cleaning',
    h1: 'Best Dry Cleaners Near Me in Manikonda, Hyderabad',
    title: 'Dry Cleaning Near Me - Best Dry Cleaners in Manikonda & Hyderabad | Techwash',
    metaDescription: 'Looking for top-rated dry cleaning near you? Techwash provides certified European hydrocarbon eco dry cleaning with zero PERC for suits, silks, sarees, and blazers with free doorstep pickup in Manikonda & Hyderabad.',
    pricingDisplay: 'Starts at ₹40 / item',
    category: 'Couture Care',
    primaryKeyword: 'dry cleaning near me',
    secondaryKeywords: 'dry cleaners near me, best dry cleaners near me, dry cleaner near me, dry cleaning service near me, best dry cleaners in Manikonda, dry cleaning in Manikonda, eco dry cleaners near me, suit dry cleaning near me, saree dry cleaning near me, dry clean near me',
    nearMeKeywords: [
      'dry cleaning near me',
      'dry cleaners near me',
      'best dry cleaning near me',
      'best dry cleaners near me',
      'dry cleaner near me',
      'dry cleaning service near me',
      'suit dry cleaning near me',
      'saree dry cleaning near me',
      'eco friendly dry cleaning near me',
      'dry cleaning shop near me',
      'dry clean near me',
      'dry cleaning Manikonda',
      'dry cleaners Tolichowki'
    ],
    processSummary: 'Ultrasonic stain pre-spotting, closed-loop non-toxic hydrocarbon solvent bath, 3D form tension steam finishing, and archival protective packaging.',
  },
  // 4. Core Intent: Laundry Pickup & Delivery
  {
    slug: 'laundry-pickup-and-delivery',
    name: 'Laundry Pickup & Delivery',
    h1: 'Doorstep Laundry Pickup and Delivery Near Me in Manikonda',
    title: 'Laundry Pickup & Delivery Near Me - Doorstep Service | Techwash',
    metaDescription: 'Looking for laundry pickup and delivery near you? Convenient timed slots from 8 AM to 9 PM, transparent digital doorstep weighing, and fast 24-48h return across Manikonda, Tolichowki & Hyderabad.',
    pricingDisplay: 'Free Pickup on Orders ₹299+',
    category: 'Doorstep Concierge',
    primaryKeyword: 'laundry pickup and delivery near me',
    secondaryKeywords: 'laundry pickup near me, laundry delivery near me, doorstep laundry near me, home pickup laundry near me, online laundry near me, laundry pickup Manikonda, laundry delivery Hyderabad',
    nearMeKeywords: [
      'laundry pickup and delivery near me',
      'laundry pickup near me',
      'laundry delivery near me',
      'doorstep laundry near me',
      'home pickup laundry near me',
      'online laundry near me',
      'laundry pickup Manikonda',
      'laundry pickup Tolichowki'
    ],
    processSummary: 'Slot-based doorstep pickup, electronic weighing with digital receipt, isolated hamper transport, laboratory cleaning, and sealed return delivery.',
  },
  // 5. Ironing Service
  {
    slug: 'ironing-service',
    name: 'Ironing Service',
    h1: 'Professional Steam Ironing Service Near Me in Manikonda',
    title: 'Steam Ironing Near Me - 3D Form Steam Press in Manikonda | Techwash',
    metaDescription: 'Searching for steam ironing near you? Professional 3D mannequin form pressing with zero heat shine, zero scorch, and vacuum table crease retention. From ₹12 with doorstep delivery in Manikonda & Hyderabad.',
    pricingDisplay: 'Starts at ₹12 / item',
    category: 'Finishing',
    primaryKeyword: 'steam iron near me',
    secondaryKeywords: 'ironing service near me, steam ironing near me, clothes ironing near me, ironing shop near me, steam pressing near me, best steam iron in Manikonda, clothes press near me',
    nearMeKeywords: [
      'ironing service near me',
      'steam iron near me',
      'steam ironing near me',
      'clothes ironing near me',
      'steam pressing near me',
      'ironing shop near me',
      'clothes press near me',
      'steam iron Manikonda',
      'ironing Tolichowki'
    ],
    processSummary: 'Temperature calibration, high-pressure 140°C micro-steam inflation, vacuum cold-suction crease locking, and hanger delivery.',
  },
  // 6. Wash & Fold
  {
    slug: 'wash-and-fold',
    name: 'Wash & Fold',
    h1: 'Wash & Fold Laundry Service Near Me in Manikonda',
    title: 'Wash and Fold Near Me - Weight-Based Laundry in Manikonda | Techwash',
    metaDescription: 'Affordable wash and fold laundry near you in Manikonda & Hyderabad. RO soft water wash, hypoallergenic bio-detergents, and store-ready packaging from ₹100/kg with free doorstep pickup.',
    pricingDisplay: 'Starts at ₹100 / Kg',
    category: 'Weight Based',
    primaryKeyword: 'wash and fold near me',
    secondaryKeywords: 'wash and fold laundry near me, wash and fold service near me, fold laundry near me, per kg laundry near me, kilo laundry near me, wash and fold service in Manikonda',
    nearMeKeywords: [
      'wash and fold near me',
      'wash and fold laundry near me',
      'wash and fold service near me',
      'fold laundry near me',
      'per kg laundry near me',
      'kilo laundry near me',
      'wash and fold Manikonda'
    ],
    processSummary: 'Weighing, isolated drum wash with hypoallergenic bio-detergents, low-heat drying, and precision hand-folding in sealed moisture wraps.',
  },
  // 7. Starch & Iron
  {
    slug: 'starch-and-iron',
    name: 'Starch & Iron',
    h1: 'Traditional Starch & Iron Service Near Me in Manikonda',
    title: 'Starch and Iron Near Me - Traditional Cotton Starching | Techwash',
    metaDescription: 'Looking for starch and iron near you? Natural organic rice and corn starching with precision vacuum steam pressing for cotton shirts, dhotis, and sarees in Manikonda & Hyderabad.',
    pricingDisplay: 'Starts at ₹25 / item',
    category: 'Finishing',
    primaryKeyword: 'starch and iron near me',
    secondaryKeywords: 'starching service near me, cotton starching near me, saree starching near me, starch and iron service in Manikonda, starch ironing near me',
    nearMeKeywords: [
      'starch and iron near me',
      'starching service near me',
      'cotton starching near me',
      'saree starching near me',
      'starch ironing near me',
      'crisp shirt starching near me'
    ],
    processSummary: 'Customizable starch ratio formulation, gentle fiber infusion bath, high-pressure vacuum steam bed pressing, and crisp collar stiffening.',
  },
  // 8. Saree Rolling
  {
    slug: 'saree-rolling',
    name: 'Saree Rolling',
    h1: 'Saree Rolling & Polishing Near Me in Manikonda, Hyderabad',
    title: 'Saree Rolling Near Me - Silk & Pattu Saree Polishing | Techwash',
    metaDescription: 'Looking for saree rolling near you? Traditional wooden cylinder roller polishing, natural starching, and gentle steam finishing for silk, pattu, and banarasi sarees in Manikonda & Hyderabad.',
    pricingDisplay: 'Custom Quote',
    category: 'Traditional',
    primaryKeyword: 'saree rolling near me',
    secondaryKeywords: 'saree polishing near me, saree dry cleaning near me, pattu saree rolling near me, silk saree polishing near me, saree rolling service in Manikonda, saree press near me',
    nearMeKeywords: [
      'saree rolling near me',
      'saree polishing near me',
      'saree rolling service near me',
      'pattu saree rolling near me',
      'silk saree care near me',
      'saree dry cleaning near me',
      'saree polishing Manikonda'
    ],
    processSummary: 'Zari inspection, natural starch misting, smooth wooden cylinder roller pass, and wrinkle-free fold packaging.',
  },
  // 9. Shoe Cleaning
  {
    slug: 'shoe-cleaning',
    name: 'Shoe Cleaning',
    h1: 'Shoe Cleaning & Sneaker Spa Near Me in Manikonda, Hyderabad',
    title: 'Shoe Cleaning Near Me - Sneaker Laundry & Spa in Manikonda | Techwash',
    metaDescription: 'Looking for shoe cleaning near you? Professional sneaker laundry, midsole whitening, suede conditioning, and UV anti-bacterial sterilization. Doorstep pickup across Hyderabad.',
    pricingDisplay: 'Starts at ₹350 / pair',
    category: 'Footwear',
    primaryKeyword: 'shoe cleaning near me',
    secondaryKeywords: 'sneaker cleaning near me, shoe laundry near me, shoe wash near me, shoe spa near me, leather shoe cleaning near me, shoe cleaning service in Manikonda, sneaker laundry near me',
    nearMeKeywords: [
      'shoe cleaning near me',
      'sneaker cleaning near me',
      'shoe laundry near me',
      'shoe wash near me',
      'shoe spa near me',
      'leather shoe cleaning near me',
      'sneaker laundry Hyderabad',
      'shoe cleaning Manikonda'
    ],
    processSummary: 'Material inspection, soft-bristle hand scrubbing, ultrasonic sole stain lift, lace restoration, and UV anti-microbial sterilization.',
  },
  // 10. Curtain Cleaning
  {
    slug: 'curtain-cleaning',
    name: 'Curtain Cleaning',
    h1: 'Curtain Cleaning & Dry Cleaning Near Me in Manikonda',
    title: 'Curtain Cleaning Near Me - Deep Drapes & Blind Care | Techwash',
    metaDescription: 'Need curtain cleaning near you? Dust-mite extraction, demineralized soft wash, and vertical steam de-wrinkling for blackout and sheer drapes. From ₹30/sqft with free doorstep pickup in Manikonda & Hyderabad.',
    pricingDisplay: '₹30 / sq. ft.',
    category: 'Household',
    primaryKeyword: 'curtain cleaning near me',
    secondaryKeywords: 'curtain dry cleaning near me, curtain washing near me, drapery cleaning near me, curtain laundry near me, curtain cleaning service in Manikonda, blinds cleaning near me',
    nearMeKeywords: [
      'curtain cleaning near me',
      'curtain dry cleaning near me',
      'curtain washing near me',
      'curtain laundry near me',
      'drapery cleaning near me',
      'curtain cleaning Manikonda'
    ],
    processSummary: 'Dimension verification, ultrasonic dust-mite extraction, gentle fabric wash, and vertical steam press for wrinkle-free hanging.',
  },
  // 11. Carpet Cleaning
  {
    slug: 'carpet-cleaning',
    name: 'Carpet Cleaning',
    h1: 'Carpet Cleaning & Rug Shampooing Near Me in Manikonda',
    title: 'Carpet Cleaning Near Me - Deep Rug Shampoo & Wash | Techwash',
    metaDescription: 'Searching for carpet cleaning near you? Rotary shampoo extraction, allergen removal, and thermal dehumidification for living room rugs and carpets in Manikonda & Hyderabad. Free doorstep pickup.',
    pricingDisplay: '₹45 / sq. ft.',
    category: 'Household',
    primaryKeyword: 'carpet cleaning near me',
    secondaryKeywords: 'carpet washing near me, rug cleaning near me, carpet shampoo near me, deep carpet cleaning near me, carpet cleaning service in Manikonda, carpet cleaner near me',
    nearMeKeywords: [
      'carpet cleaning near me',
      'carpet washing near me',
      'rug cleaning near me',
      'carpet shampoo near me',
      'carpet cleaner near me',
      'carpet cleaning Manikonda',
      'carpet washing Hyderabad'
    ],
    processSummary: 'High-power dry vacuuming, rotary shampoo agitation, deep stain extraction, and anti-microbial thermal dehumidification.',
  },
];
