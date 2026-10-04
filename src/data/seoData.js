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
    h1: 'Laundry Services in Manikonda, Hyderabad',
    title: 'Laundry Services in Manikonda, Hyderabad | Techwash Laundry',
    metaDescription: 'Professional wash and iron, dry cleaning, laundry, and garment care services in Manikonda, Hyderabad. Techwash Laundry offers convenient garment cleaning and ironing with pickup and delivery options.',
    keywords: 'laundry service in Manikonda, laundry services in Manikonda, laundry near Manikonda, laundry service Manikonda Hyderabad, laundry shop near Manikonda, laundry pickup Manikonda, laundry delivery Manikonda',
    pincodes: ['500089'],
    landmarks: [
      'Secretariat Colony',
      'OU Colony',
      'Lanco Hills Road',
      'Shirdi Sai Nagar',
      'Puppalaguda Main Road',
      'Alkapoor Township Corridor',
    ],
    introText: 'Techwash Laundry provides professional laundry, eco-friendly hydrocarbon dry cleaning, weight-based wash & iron, and steam pressing for residents in Manikonda, Hyderabad. With 100% demineralized 0 PPM RO soft water and single-customer isolated wash drums, our dedicated doorstep fleet provides daily scheduled laundry pickup and delivery across Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, and surrounding residential societies in Manikonda.',
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

export const SEO_SERVICES = [
  // 1. Core Intent: General Laundry Service
  {
    slug: 'laundry-service',
    name: 'Laundry Service',
    h1: 'Laundry Service in Manikonda, Hyderabad',
    title: 'Laundry Service in Manikonda, Hyderabad | Techwash Laundry',
    metaDescription: 'Professional laundry service in Manikonda, Hyderabad from Techwash Laundry. 0 PPM RO soft water washing, isolated single-customer drums, and fast doorstep pickup across Manikonda.',
    pricingDisplay: 'From ₹100 / Kg',
    category: 'Daily Laundry',
    primaryKeyword: 'laundry service in Manikonda',
    secondaryKeywords: 'laundry services in Manikonda, laundry near Manikonda, laundry service Manikonda Hyderabad, laundry shop near Manikonda, laundry pickup Manikonda, laundry delivery Manikonda',
    processSummary: 'Demineralized 0 PPM RO soft water washing, single-customer isolated drum cycles, bio-enzyme stain removal, sensor moisture drying, and precision steam pressing.',
  },
  // 2. Core Intent: Wash & Iron
  {
    slug: 'wash-and-iron',
    name: 'Wash & Iron',
    h1: 'Wash & Iron Service in Manikonda',
    title: 'Wash & Iron Service in Manikonda | Techwash Laundry',
    metaDescription: 'Professional wash and iron service in Manikonda, Hyderabad. Techwash Laundry offers convenient garment washing with 0 PPM RO soft water and 3D steam form pressing.',
    pricingDisplay: 'Starts at ₹130 / Kg',
    category: 'Weight Based',
    primaryKeyword: 'wash and iron service in Manikonda',
    secondaryKeywords: 'wash and iron near Manikonda, laundry wash and iron Manikonda, clothes washing and ironing Manikonda, wash iron laundry service Manikonda',
    processSummary: 'Single-customer drum wash in 0 PPM soft water, bio-enzyme stain removal, followed by 3D tension mannequin steam form pressing.',
  },
  // 3. Core Intent: Dry Cleaning
  {
    slug: 'dry-cleaning',
    name: 'Dry Cleaning',
    h1: 'Dry Cleaning Service in Manikonda',
    title: 'Dry Cleaning Service in Manikonda | Techwash Laundry',
    metaDescription: 'Professional dry cleaning service in Manikonda, Hyderabad. Certified non-toxic European hydrocarbon dry cleaning for formal suits, delicate silks, sarees, and formal wear.',
    pricingDisplay: 'Starts at ₹40 / item',
    category: 'Couture Care',
    primaryKeyword: 'dry cleaning in Manikonda',
    secondaryKeywords: 'dry cleaning service near Manikonda, dry cleaner Manikonda, dry cleaners near Manikonda',
    processSummary: 'Ultrasonic stain pre-spotting, closed-loop non-toxic hydrocarbon solvent bath, 3D form tension steam finishing, and archival protective packaging.',
  },
  // 4. Core Intent: Laundry Pickup & Delivery
  {
    slug: 'laundry-pickup-and-delivery',
    name: 'Laundry Pickup & Delivery',
    h1: 'Laundry Pickup & Delivery in Manikonda',
    title: 'Laundry Pickup & Delivery in Manikonda | Techwash Laundry',
    metaDescription: 'Convenient laundry pickup and delivery in Manikonda, Hyderabad. Flexible timed slots from 8 AM to 9 PM, transparent electronic doorstep weighing, and 24-48h return.',
    pricingDisplay: 'Free Pickup on Orders ₹299+',
    category: 'Doorstep Concierge',
    primaryKeyword: 'laundry pickup and delivery in Manikonda',
    secondaryKeywords: 'laundry pickup Manikonda, laundry delivery Manikonda, doorstep laundry Manikonda, laundry home pickup Manikonda',
    processSummary: 'Slot-based doorstep pickup, electronic weighing with digital receipt, isolated hamper transport, laboratory cleaning, and sealed return delivery.',
  },
  // 5. Ironing Service
  {
    slug: 'ironing-service',
    name: 'Ironing Service',
    h1: 'Ironing Service in Manikonda',
    title: 'Ironing Service in Manikonda | Techwash Laundry',
    metaDescription: 'Professional steam ironing service in Manikonda, Hyderabad. 3D mannequin form pressing with zero heat shine, zero scorch, and vacuum table crease retention.',
    pricingDisplay: 'Starts at ₹12 / item',
    category: 'Finishing',
    primaryKeyword: 'ironing service in Manikonda',
    secondaryKeywords: 'clothes ironing Manikonda, ironing near Manikonda, steam ironing Manikonda',
    processSummary: 'Temperature calibration, high-pressure 140°C micro-steam inflation, vacuum cold-suction crease locking, and hanger delivery.',
  },
  // 6. Wash & Fold
  {
    slug: 'wash-and-fold',
    name: 'Wash & Fold',
    h1: 'Wash & Fold Service in Manikonda',
    title: 'Wash & Fold Service in Manikonda | Techwash Laundry',
    metaDescription: 'Affordable wash and fold service in Manikonda, Hyderabad. Demineralized RO soft water batch wash, hypoallergenic bio-detergents, anti-static drying, and store-style folding.',
    pricingDisplay: 'Starts at ₹100 / Kg',
    category: 'Weight Based',
    primaryKeyword: 'wash and fold service in Manikonda',
    processSummary: 'Weighing, isolated drum wash with hypoallergenic bio-detergents, low-heat drying, and precision hand-folding in sealed moisture wraps.',
  },
  // 7. Starch & Iron
  {
    slug: 'starch-and-iron',
    name: 'Starch & Iron',
    h1: 'Starch & Iron Service in Manikonda',
    title: 'Starch & Iron Service in Manikonda | Techwash Laundry',
    metaDescription: 'Traditional natural starch and iron service in Manikonda, Hyderabad. Pure organic rice and corn starching with vacuum steam pressing for cotton shirts and sarees.',
    pricingDisplay: 'Starts at ₹25 / item',
    category: 'Finishing',
    primaryKeyword: 'starch and iron service in Manikonda',
    processSummary: 'Customizable starch ratio formulation, gentle fiber infusion bath, high-pressure vacuum steam bed pressing, and crisp collar stiffening.',
  },
  // 8. Saree Rolling
  {
    slug: 'saree-rolling',
    name: 'Saree Rolling',
    h1: 'Saree Rolling Service in Manikonda',
    title: 'Saree Rolling Service in Manikonda | Techwash Laundry',
    metaDescription: 'Professional saree rolling service in Manikonda, Hyderabad. Smooth wooden roller polishing, natural starching, and steam finishing for silk, pattu, and banarasi sarees.',
    pricingDisplay: 'Custom Quote',
    category: 'Traditional',
    primaryKeyword: 'saree rolling service in Manikonda',
    processSummary: 'Zari inspection, natural starch misting, smooth wooden cylinder roller pass, and wrinkle-free fold packaging.',
  },
  // 9. Shoe Cleaning
  {
    slug: 'shoe-cleaning',
    name: 'Shoe Cleaning',
    h1: 'Shoe Cleaning Service in Manikonda',
    title: 'Shoe Cleaning Service in Manikonda | Techwash Laundry',
    metaDescription: 'Professional shoe cleaning service in Manikonda, Hyderabad. Soft-bristle hand scrubbing, midsole whitening, suede conditioning, and UV anti-bacterial sterilization.',
    pricingDisplay: 'Starts at ₹350 / pair',
    category: 'Footwear',
    primaryKeyword: 'shoe cleaning service in Manikonda',
    processSummary: 'Material inspection, soft-bristle hand scrubbing, ultrasonic sole stain lift, lace restoration, and UV anti-microbial sterilization.',
  },
  // 10. Curtain Cleaning
  {
    slug: 'curtain-cleaning',
    name: 'Curtain Cleaning',
    h1: 'Curtain Cleaning Service in Manikonda',
    title: 'Curtain Cleaning Service in Manikonda | Techwash Laundry',
    metaDescription: 'Deep curtain cleaning service in Manikonda, Hyderabad. Dust-mite extraction, demineralized soft wash, and vertical steam de-wrinkling for blackout and sheer drapes.',
    pricingDisplay: '₹30 / sq. ft.',
    category: 'Household',
    primaryKeyword: 'curtain cleaning service in Manikonda',
    processSummary: 'Dimension verification, ultrasonic dust-mite extraction, gentle fabric wash, and vertical steam press for wrinkle-free hanging.',
  },
  // 11. Carpet Cleaning
  {
    slug: 'carpet-cleaning',
    name: 'Carpet Cleaning',
    h1: 'Carpet Cleaning Service in Manikonda',
    title: 'Carpet Cleaning Service in Manikonda | Techwash Laundry',
    metaDescription: 'Deep carpet cleaning service in Manikonda, Hyderabad. Rotary shampoo extraction, allergen removal, and thermal moisture removal for rugs and carpets.',
    pricingDisplay: '₹45 / sq. ft.',
    category: 'Household',
    primaryKeyword: 'carpet cleaning service in Manikonda',
    processSummary: 'High-power dry vacuuming, rotary shampoo agitation, deep stain extraction, and anti-microbial thermal dehumidification.',
  },
];
