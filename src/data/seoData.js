/**
 * Techwash Laundry Centralized SEO & Geo-Targeting Dataset
 * Single source of truth for Manikonda Local SEO, Service SEO, and Schema.org metadata
 * Optimized for Position #1 on Google for high-intent queries:
 * - "near me" (dry cleaning near me, iron service near me, laundry near me, etc.)
 * - "in Manikonda" (iron service in manikonda, dry wash service in manikonda, etc.)
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
    h1: '#1 Best Laundry, Dry Cleaning (Dry Wash) & Iron Service in Manikonda',
    title: '#1 Best Laundry, Dry Cleaning & Iron Service in Manikonda (Flat 20% Off) | Techwash',
    metaDescription: 'Rated #1 Best Laundry, Eco Dry Cleaning (Dry Wash) & 3D Steam Ironing Service in Manikonda (500089). 0 PPM RO soft water wash, single-customer drums & free doorstep pickup in Puppalaguda, Secretariat Colony, OU Colony & Lanco Hills. Flat 20% Off!',
    keywords: 'laundry in manikonda, iron service in manikonda, dry wash service in manikonda, best laundry in manikonda, best dry cleaners in manikonda, laundry service in manikonda, dry cleaning in manikonda, steam ironing in manikonda, press service in manikonda, laundry near manikonda, laundry pickup manikonda, dry cleaners near me manikonda, techwash laundry',
    pincodes: ['500089'],
    landmarks: [
      'Secretariat Colony',
      'OU Colony',
      'Lanco Hills Road',
      'Shirdi Sai Nagar',
      'Puppalaguda Main Road',
      'Alkapoor Township Corridor',
      'Shaikpet Main Road',
      'Sri Ram Nagar Colony',
      'Ambience Courtyard Corridor',
      'Chitrapuri Hills',
      'Prashant Hills Corridor',
      'Golden Pride & Jaihind Enclave',
      'Manikonda Gardens Rd',
    ],
    introText: 'Techwash Laundry is rated the #1 Best Laundry, Dry Cleaning, and Steam Ironing Service in Manikonda, Hyderabad. We provide professional laundry, certified eco-friendly European hydrocarbon dry cleaning (dry wash), weight-based wash & fold/iron, and 3D steam form pressing for residents across Manikonda. With 100% demineralized 0 PPM RO soft water and single-customer isolated wash drums, our dedicated doorstep fleet provides daily scheduled laundry pickup and delivery across Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, Puppalaguda, and Alkapoor Township.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Daily office wear shirts & trousers steam ironing and crease retention from ₹12',
      'Professional dry wash & eco dry cleaning for suits, silk sarees, and blazers',
      'Weight-based wash & fold / wash & iron for working professionals & families (from ₹100/kg)',
      'Traditional saree rolling & polishing for silk, pattu & banarasi sarees',
      'Living room curtains and heavy carpet deep extraction washing',
    ],
    nearbyAreas: [],
    faqs: [
      {
        question: 'Which is the best laundry, dry cleaning and iron service in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is recognized as the #1 best laundry, dry cleaning, and steam iron service in Manikonda (500089), Hyderabad with a 4.9/5 star rating. We use 100% demineralized 0 PPM RO soft water, guarantee single-customer isolated wash drums, use certified European hydrocarbon dry cleaning with zero PERC, and provide daily doorstep pickup and delivery across all societies in Manikonda.',
      },
      {
        question: 'Do you provide iron service and steam press in Manikonda with doorstep pickup?',
        answer: 'Yes! Techwash provides premium 3D mannequin steam pressing from ₹12/item with free doorstep pickup across Secretariat Colony, OU Colony, Lanco Hills, Puppalaguda, and Alkapoor. Vacuum cold-suction tables lock in razor-sharp creases with zero heat shine and zero scorch marks.',
      },
      {
        question: 'Do you provide dry wash service in Manikonda, Hyderabad?',
        answer: 'Yes, Techwash is the leading dry wash and eco dry cleaning service in Manikonda. We clean garments like suits, silk sarees, blazers, and lehengas without water using non-toxic European hydrocarbon fluids (zero PERC), followed by vertical steam tension finishing.',
      },
      {
        question: 'What are the laundry and dry wash rates in Manikonda?',
        answer: 'Steam ironing starts at ₹12/item, Wash & Fold is ₹100/kg, Wash & Iron is ₹130/kg, and Dry Wash / Dry Cleaning starts from ₹40/item. Flat 20% Off is available on your first order with free doorstep pickup.',
      },
      {
        question: 'How does laundry pickup and delivery in Manikonda work?',
        answer: 'You can schedule a pickup online in 60 seconds or call +91 63048 45567. Our executive arrives at your preferred time slot (8 AM – 9 PM) anywhere in Manikonda with calibrated electronic scales and delivers your clothes back fresh, crisp, and sealed within 24–48 hours.',
      },
      {
        question: 'Where can I find your physical store counter in Manikonda?',
        answer: 'You can visit our Main Branch counter on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda (opposite Sri Ram Nagar Colony gate), our Tolichowki / OU Colony branch beside Dreamscape Hotel, or our Ambience Courtyard counter. Open 8:00 AM to 9:00 PM all 7 days.',
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
  'dry-wash': 'dry-cleaning',
  'drywash': 'dry-cleaning',
  'iron-service': 'ironing-service',
  'press-service': 'ironing-service',
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
    category: 'Daily Laundry',
    pricingDisplay: 'From ₹100 / Kg',
    h1: '#1 Best Laundry Service Near Me in Manikonda, Hyderabad',
    manikondaH1: '#1 Best Laundry Service in Manikonda (500089)',
    nearMeTitle: '#1 Best Laundry Service Near Me in Manikonda (Flat 20% Off) | Techwash',
    manikondaTitle: '#1 Best Laundry Service in Manikonda, Hyderabad (500089) - Flat 20% Off | Techwash',
    metaDescription: 'Rated #1 Best Laundry Service in Manikonda (Near Me). 100% 0 PPM RO soft water wash, single-customer isolated drums, bio-detergents & free doorstep pickup in Manikonda (Puppalaguda, OU Colony, Lanco Hills). Flat 20% Off!',
    manikondaDescription: 'Looking for the best laundry service in Manikonda? Techwash provides 100% 0 PPM RO soft water care, isolated single-customer drums, bio-enzyme stain removal, and free doorstep pickup across Secretariat Colony, OU Colony, and Lanco Hills. Flat 20% Off!',
    primaryKeyword: 'laundry service in manikonda',
    secondaryKeywords: 'laundry near me, best laundry in manikonda, laundry service near me, clothes washing near me, best laundry service in manikonda, laundry services manikonda hyderabad, laundromat near me, laundry shop near me, kilo laundry near me, laundry by kg in manikonda, doorstep laundry near me, clothes washing service in manikonda',
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
      'laundry near Tolichowki',
      'online laundry service near me',
      'laundry by kg near me'
    ],
    processSummary: 'Demineralized 0 PPM RO soft water washing, single-customer isolated drum cycles, bio-enzyme stain removal, sensor moisture drying, and precision steam pressing.',
    rateCard: [
      { item: 'Wash & Fold (Everyday Clothes)', rate: '₹100 / Kg', details: '0 PPM soft water, bio-detergents, machine fold' },
      { item: 'Wash & Steam Iron (Office Shirts/Pants)', rate: '₹130 / Kg', details: 'Full drum wash + 3D mannequin steam finishing' },
      { item: 'Bedsheets & Pillow Covers (Wash & Fold)', rate: '₹100 / Kg', details: 'Hygienic single-customer wash and tumble dry' },
      { item: 'Kids School Uniforms (Wash & Iron)', rate: '₹130 / Kg', details: 'Stain pre-spotting and wrinkle-free steam press' },
    ],
    faqs: [
      {
        question: 'Which is the best laundry service near me in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is rated the #1 laundry service near you in Manikonda with 4.9/5 stars. We wash all garments in 100% demineralized 0 PPM RO soft water using dedicated single-customer drums (your clothes are never mixed with anyone else’s) and offer free doorstep pickup across Manikonda, Puppalaguda, and Shaikpet.',
      },
      {
        question: 'What are the laundry charges per kg in Manikonda?',
        answer: 'Our weight-based laundry starts at ₹100/kg for Wash & Fold, and ₹130/kg for Wash & Steam Iron. Clothes are weighed digitally at your doorstep. Flat 20% Off is available on your first order.',
      },
      {
        question: 'Why is 0 PPM RO soft water better for laundry?',
        answer: 'Hyderabad tap and borewell water contains harsh dissolved minerals that turn white clothes dull yellow and make fabric fibers brittle. Our 0 PPM RO soft water dissolves detergents completely, removes stubborn sweat salts, and keeps fabrics soft and bright.',
      },
      {
        question: 'Do you offer doorstep laundry pickup and delivery near me?',
        answer: 'Yes! We provide doorstep pickup from 8:00 AM to 9:00 PM all 7 days across Manikonda, Puppalaguda, Secretariat Colony, OU Colony, Lanco Hills, and Alkapoor Township with 24-48 hour return.',
      },
      {
        question: 'How do I book a laundry pickup with Techwash?',
        answer: 'You can book online via techwashlaundry.com/book-pickup or WhatsApp/call +91 63048 45567. Our executive will arrive at your scheduled time with digital scales.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best laundry service in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is recognized as the best laundry service in Manikonda (500089). We use 100% demineralized 0 PPM RO soft water, guarantee single-customer isolated wash drums, use hypoallergenic bio-detergents, and provide daily doorstep pickup across all Manikonda colonies.',
      },
      {
        question: 'What are the laundry rates in Manikonda (500089)?',
        answer: 'Wash & Fold is ₹100/kg, Wash & Iron is ₹130/kg, and Steam Ironing starts from ₹12/item. Free doorstep pickup is included for orders above ₹299 across Manikonda.',
      },
      {
        question: 'Do you cover Secretariat Colony, OU Colony, and Puppalaguda in Manikonda?',
        answer: 'Yes! Our pickup executives operate multiple daily collection routes throughout Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, Puppalaguda Main Road, and Alkapoor Township.',
      },
      {
        question: 'What is the turnaround time for laundry delivery in Manikonda?',
        answer: 'Standard turnaround is 48 hours for complete washing, drying, steam pressing, and quality inspection. Express 24-hour delivery is also available upon request in Manikonda.',
      },
      {
        question: 'Can I drop off clothes at your Manikonda branch counter?',
        answer: 'Yes! You can visit our Main Branch counter on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda (500089) open 8:00 AM to 9:00 PM all 7 days.',
      },
    ],
  },

  // 2. Core Intent: Wash & Iron
  {
    slug: 'wash-and-iron',
    name: 'Wash & Iron',
    category: 'Weight Based',
    pricingDisplay: 'Starts at ₹130 / Kg',
    h1: '#1 Best Wash & Iron Service Near Me in Manikonda, Hyderabad',
    manikondaH1: '#1 Best Wash and Iron Service in Manikonda (500089)',
    nearMeTitle: '#1 Best Wash and Iron Near Me in Manikonda (Flat 20% Off) | Techwash',
    manikondaTitle: '#1 Best Wash and Iron Service in Manikonda (500089) - Flat 20% Off | Techwash',
    metaDescription: 'Rated #1 Best Wash and Iron Near Me in Manikonda. 0 PPM RO soft water drum wash + 3D mannequin steam pressing with sharp crease retention. Free doorstep pickup across Manikonda & Puppalaguda. Flat 20% Off!',
    manikondaDescription: 'Need professional wash and iron in Manikonda? Techwash Laundry offers single-customer drum wash in 100% RO soft water and 3D tension steam form pressing with doorstep delivery across Manikonda, Puppalaguda, and Lanco Hills. Flat 20% Off!',
    primaryKeyword: 'wash and iron near me',
    secondaryKeywords: 'wash and iron service in manikonda, wash and steam iron near me, wash and iron in manikonda, wash and press near me, wash and press manikonda, clothes wash and iron near me, laundry wash and iron near me, wash iron service near me, per kg wash and iron manikonda, daily clothes wash and press near me',
    nearMeKeywords: [
      'wash and iron near me',
      'wash and steam iron near me',
      'clothes wash and iron near me',
      'wash and press near me',
      'laundry wash and iron near me',
      'wash iron service near me',
      'wash and iron Manikonda',
      'wash and iron Tolichowki',
      'wash & steam press near me'
    ],
    processSummary: 'Single-customer drum wash in 0 PPM soft water, bio-enzyme stain removal, followed by 3D tension mannequin steam form pressing.',
    rateCard: [
      { item: 'Formal Shirts & T-Shirts', rate: '₹130 / Kg', details: 'Single-customer wash + vacuum steam crease setting' },
      { item: 'Formal Trousers, Chinos & Jeans', rate: '₹130 / Kg', details: 'Sharp crease alignment, zero heat shine' },
      { item: 'Daily Kurtas & Pyjamas', rate: '₹130 / Kg', details: 'Gentle bio-wash with crisp steam press' },
      { item: 'Single & Double Bedsheets', rate: '₹130 / Kg', details: 'Deep soft wash + industrial flat iron pressing' },
    ],
    faqs: [
      {
        question: 'What is included in the wash and iron service?',
        answer: 'Our Wash & Iron service includes pre-spotting stains, drum washing in 100% 0 PPM RO soft water, low-temperature tumble drying, and professional 3D mannequin steam pressing with vacuum cold-suction crease locking.',
      },
      {
        question: 'What is the rate for wash and iron near me in Manikonda?',
        answer: 'Wash & Iron starts at ₹130 per kg. Garments are weighed digitally at your doorstep. Flat 20% Off is available for first-time customers.',
      },
      {
        question: 'Do you press clothes with hot metal iron or steam press?',
        answer: 'We use commercial Italian steam form press stations and vacuum suction tables. We never use flat hot irons that burn fibers or cause heat shine on trousers and dark garments.',
      },
      {
        question: 'How are the pressed clothes returned?',
        answer: 'Formal shirts and trousers are returned on hangers or precision hand-folded in dust-proof protective garment bags based on your preference.',
      },
      {
        question: 'Do you offer doorstep pickup for wash and iron in Manikonda?',
        answer: 'Yes, free doorstep pickup and delivery is available all 7 days from 8:00 AM to 9:00 PM across Manikonda, Puppalaguda, Secretariat Colony, and OU Colony.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best wash and iron service in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for wash and iron in Manikonda (500089). We wash in isolated single-customer drums with 0 PPM soft water and steam press each piece with zero scorch marks.',
      },
      {
        question: 'What are the wash and iron rates in Manikonda?',
        answer: 'Our wash and iron rate is ₹130/kg. Doorstep digital weighing ensures complete transparency, with instant WhatsApp receipts.',
      },
      {
        question: 'How fast can I get my wash and iron clothes delivered in Manikonda?',
        answer: 'Standard delivery is within 48 hours. Urgent express 24-hour return is available upon request across all Manikonda areas.',
      },
      {
        question: 'Is wash and iron safe for office shirts and linen trousers?',
        answer: 'Yes! Our high-pressure 140°C steam relaxes linen and cotton fibers without flattening fabric weave, keeping shirts crisp and comfortable to wear.',
      },
      {
        question: 'Where can I book wash and iron in Manikonda?',
        answer: 'Book online at techwashlaundry.com or call our Manikonda hotline at +91 63048 45567.',
      },
    ],
  },

  // 3. Core Intent: Dry Cleaning & Dry Wash
  {
    slug: 'dry-cleaning',
    name: 'Dry Cleaning & Dry Wash',
    category: 'Couture Care',
    pricingDisplay: 'Starts at ₹40 / item',
    h1: '#1 Best Dry Cleaning & Dry Wash Service in Manikonda, Hyderabad',
    manikondaH1: '#1 Best Dry Cleaning & Dry Wash Service in Manikonda (500089)',
    nearMeTitle: '#1 Best Dry Cleaning & Dry Wash Near Me in Manikonda (Flat 20% Off) | Techwash',
    manikondaTitle: '#1 Best Dry Cleaning & Dry Wash Service in Manikonda (500089) - Flat 20% Off | Techwash',
    metaDescription: 'Looking for top-rated dry cleaning or dry wash service in Manikonda? Techwash provides certified European hydrocarbon eco dry cleaning (zero PERC) for suits, silk sarees, blazers, and lehengas with free doorstep pickup across Manikonda & Hyderabad. Flat 20% Off!',
    manikondaDescription: 'Rated #1 Best Dry Cleaning & Dry Wash Service in Manikonda. Certified eco hydrocarbon dry cleaning with zero PERC for suits, pattu silk sarees, blazers, sherwanis, and lehengas with free doorstep pickup in Puppalaguda, Secretariat Colony & Manikonda. Flat 20% Off!',
    primaryKeyword: 'dry wash service in manikonda',
    secondaryKeywords: 'dry cleaning near me, dry cleaners near me, dry wash near me, best dry cleaners in manikonda, dry cleaning in manikonda, dry cleaners in manikonda, dry wash in manikonda, clothes dry wash near me, best dry cleaners near me, suit dry cleaning near me, saree dry cleaning near me, saree dry wash near me, blazer dry wash near me, lehenga dry cleaning manikonda, dry wash shop near me, dry clean near me',
    nearMeKeywords: [
      'dry cleaning near me',
      'dry wash near me',
      'dry cleaners near me',
      'best dry cleaning near me',
      'best dry cleaners near me',
      'dry cleaner near me',
      'dry wash service near me',
      'clothes dry wash near me',
      'suit dry cleaning near me',
      'saree dry cleaning near me',
      'saree dry wash near me',
      'eco friendly dry cleaning near me',
      'dry cleaning shop near me',
      'dry wash shop near me',
      'dry clean near me',
      'dry cleaning Manikonda',
      'dry wash Manikonda',
      'dry cleaners Tolichowki'
    ],
    processSummary: 'Ultrasonic stain pre-spotting, closed-loop non-toxic hydrocarbon solvent bath (zero PERC), 3D form tension steam finishing, and archival protective packaging.',
    rateCard: [
      { item: "Men's 2-Piece Suit / Tuxedo", rate: '₹250 - ₹350', details: 'European hydrocarbon dry wash, lapel shaping, hanger seal' },
      { item: 'Pure Silk / Pattu Saree (Dry Wash)', rate: '₹180 - ₹250', details: 'Zero water, zari protection, delicate luster preservation' },
      { item: 'Designer Blazer / Coat', rate: '₹200 - ₹300', details: 'Spot extraction, odorless hydrocarbon solvent bath' },
      { item: 'Bridal Lehenga / Heavy Anarkali', rate: '₹350 - ₹550', details: 'Embellishment care, sequin masking, steam finishing' },
      { item: 'Formal Shirts / Silk Tops (Dry Wash)', rate: '₹120 / item', details: 'Collar & cuff scrubbing, gentle dry cleaning' },
      { item: 'Sherwani & Indo-Western Kurta', rate: '₹350 - ₹500', details: 'Archival dry cleaning, gold thread preservation' },
    ],
    faqs: [
      {
        question: 'Which is the best dry cleaning and dry wash service near me in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for dry cleaning and dry wash in Manikonda (4.9 ★ from 318+ reviews). We use certified European closed-loop hydrocarbon eco dry cleaning that is 100% free of toxic PERC, completely safe for silk sarees, designer lehengas, wool suits, and blazers.',
      },
      {
        question: 'Do you provide dry wash service in Manikonda, Hyderabad?',
        answer: 'Yes! We provide complete dry wash service across Manikonda, Puppalaguda, Secretariat Colony, OU Colony, and Lanco Hills. Garments are cleaned without water using gentle eco-hydrocarbon solvents that protect zari, embroidery, and delicate fabrics.',
      },
      {
        question: 'What is the difference between dry wash and normal laundry?',
        answer: 'Dry wash (dry cleaning) cleans garments without using water. Instead, it uses specialized gentle fluid solvents to dissolve grease, food oils, and stains without causing silk shrinkage, wool deformation, or color fading. Normal laundry uses 0 PPM RO soft water for everyday washable fabrics.',
      },
      {
        question: 'What are your dry wash and dry cleaning charges in Manikonda?',
        answer: 'Dry cleaning starts at ₹40/item for smaller items, ₹120 for shirts/trousers, ₹180-₹250 for silk/pattu sarees, and ₹250-₹350 for two-piece suits and blazers. Flat 20% Off is available on your first booking.',
      },
      {
        question: 'Is your dry cleaning safe for heavy bridal wear, sherwanis, and pattu sarees?',
        answer: 'Absolutely. Our non-toxic hydrocarbon solvents do not dissolve glue, sequins, metallic zari threads, or delicate velvet and silk fibers, ensuring zero damage and zero chemical odors.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Do you provide dry wash service in Manikonda, Hyderabad?',
        answer: 'Yes! Techwash Laundry is the #1 provider of dry wash and eco dry cleaning service in Manikonda (500089). We pick up from your doorstep anywhere in Manikonda, clean in certified European hydrocarbon equipment, and deliver within 48 hours.',
      },
      {
        question: 'Which is the best dry cleaners in Manikonda for suits and blazers?',
        answer: 'Techwash Laundry is rated #1 in Manikonda for suit and blazer dry cleaning. We inspect lapels, hand-spot stains, clean with closed-loop eco solvents, and steam-finish on 3D form mannequins for pristine shoulder structure.',
      },
      {
        question: 'Where can I find a reliable dry wash shop in Manikonda?',
        answer: 'You can visit our store counter on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda (500089) or book a free doorstep pickup at techwashlaundry.com.',
      },
      {
        question: 'What is the turnaround time for dry cleaning in Manikonda?',
        answer: 'Standard turnaround for dry cleaning and dry wash is 48 hours. Express 24-hour delivery is also available for urgent events and weddings in Manikonda.',
      },
      {
        question: 'Do you provide saree dry cleaning and saree rolling in Manikonda?',
        answer: 'Yes, we specialize in pure pattu, Kanjeevaram, and Banarasi silk saree dry cleaning combined with wooden roller polishing and steam finishing.',
      },
    ],
  },

  // 4. Core Intent: Laundry Pickup & Delivery
  {
    slug: 'laundry-pickup-and-delivery',
    name: 'Laundry Pickup & Delivery',
    category: 'Doorstep Concierge',
    pricingDisplay: 'Free Pickup on Orders ₹299+',
    h1: '#1 Doorstep Laundry Pickup & Delivery Near Me in Manikonda',
    manikondaH1: '#1 Best Laundry Pickup & Delivery in Manikonda (500089)',
    nearMeTitle: '#1 Doorstep Laundry Pickup & Delivery in Manikonda (Near Me) | Techwash',
    manikondaTitle: '#1 Best Laundry Pickup & Delivery in Manikonda (500089) - Free Doorstep Service | Techwash',
    metaDescription: 'Free doorstep laundry pickup and delivery in Manikonda & Hyderabad. Convenient timed slots from 8 AM to 9 PM, digital doorstep weighing, and fast 24-48h return across Puppalaguda, OU Colony & Lanco Hills. Flat 20% Off!',
    manikondaDescription: 'Searching for laundry pickup and delivery in Manikonda? Techwash offers scheduled morning and evening slots, electronic weighing at your doorstep, and 24-48 hour return across all Manikonda gated communities. Flat 20% Off!',
    primaryKeyword: 'laundry pickup and delivery near me',
    secondaryKeywords: 'laundry pickup near me, laundry delivery near me, doorstep laundry near me, home pickup laundry near me, online laundry near me, laundry pickup manikonda, laundry delivery hyderabad, free laundry pickup manikonda, home delivery laundry in manikonda',
    nearMeKeywords: [
      'laundry pickup and delivery near me',
      'laundry pickup near me',
      'laundry delivery near me',
      'doorstep laundry near me',
      'home pickup laundry near me',
      'online laundry near me',
      'laundry pickup Manikonda',
      'laundry pickup Tolichowki',
      'free doorstep laundry pickup near me'
    ],
    processSummary: 'Slot-based doorstep pickup, electronic weighing with digital receipt, isolated hamper transport, laboratory cleaning, and sealed return delivery.',
    rateCard: [
      { item: 'Standard Doorstep Pickup (Orders ₹299+)', rate: 'FREE (₹0)', details: '8:00 AM – 9:00 PM slot choice across Manikonda' },
      { item: 'Doorstep Digital Weighing & Tagging', rate: 'FREE (₹0)', details: 'Electronic hanging scales with instant WhatsApp bill' },
      { item: 'Sealed Garment Packaging & Delivery', rate: 'FREE (₹0)', details: 'Moisture-proof dust-free protective return' },
      { item: 'Express 24-Hour Return Surcharge', rate: '₹50 flat', details: 'Fast turnaround priority dispatch within 24h' },
    ],
    faqs: [
      {
        question: 'How do I schedule a laundry pickup near me in Manikonda?',
        answer: 'Simply visit techwashlaundry.com/book-pickup, select your preferred date and time slot (8:00 AM – 9:00 PM), enter your Manikonda address, and our executive will arrive with calibrated digital scales.',
      },
      {
        question: 'Is doorstep laundry pickup free in Manikonda?',
        answer: 'Yes, doorstep pickup and delivery are completely free on orders above ₹299 across Manikonda, Puppalaguda, Secretariat Colony, and OU Colony.',
      },
      {
        question: 'How are my clothes weighed and billed during pickup?',
        answer: 'Our executive brings certified electronic digital hanging scales and weighs your laundry directly in front of you, generating an instant itemized bill sent to your WhatsApp.',
      },
      {
        question: 'What time slots are available for laundry pickup?',
        answer: 'We offer morning slots (8:00 AM – 1:00 PM) and evening slots (4:00 PM – 9:00 PM) all 7 days a week including Sundays.',
      },
      {
        question: 'What is the delivery turnaround time?',
        answer: 'Our standard delivery is within 48 hours. Express 24-hour delivery is also available upon request for urgent orders.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which areas in Manikonda do you cover for laundry pickup?',
        answer: 'We cover all residential societies in Manikonda (500089) including Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, Puppalaguda Main Road, Alkapoor Township, and Shaikpet.',
      },
      {
        question: 'Can I get same-day laundry pickup in Manikonda?',
        answer: 'Yes! Orders placed before 1:00 PM receive same-day pickup within 2 hours across Manikonda.',
      },
      {
        question: 'Do you provide delivery tracking updates?',
        answer: 'Yes, you receive real-time SMS and WhatsApp notifications when your clothes are picked up, being washed, steam-ironed, and out for delivery.',
      },
      {
        question: 'What payment modes are accepted on delivery in Manikonda?',
        answer: 'We accept UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery.',
      },
      {
        question: 'How do I contact customer support for my pickup?',
        answer: 'You can call or WhatsApp our Manikonda support team directly at +91 63048 45567.',
      },
    ],
  },

  // 5. Core Intent: Ironing Service & Steam Press
  {
    slug: 'ironing-service',
    name: 'Ironing Service & Steam Press',
    category: 'Finishing',
    pricingDisplay: 'Starts at ₹12 / item',
    h1: '#1 Best Iron Service & Steam Press in Manikonda, Hyderabad',
    manikondaH1: '#1 Best Iron Service & Steam Press in Manikonda (500089)',
    nearMeTitle: '#1 Best Iron Service & Steam Press Near Me in Manikonda (From ₹12) | Techwash',
    manikondaTitle: '#1 Best Iron Service & Steam Ironing in Manikonda (From ₹12) - Flat 20% Off | Techwash',
    metaDescription: 'Searching for the best iron service or steam press in Manikonda? Techwash offers 3D mannequin steam ironing from ₹12/item with vacuum cold-suction crease locking, zero shine, zero scorch & free doorstep pickup in Manikonda. Flat 20% Off!',
    manikondaDescription: 'Rated #1 Best Iron Service & Steam Press in Manikonda (500089). Professional 140°C micro-steam pressing for shirts, trousers, sarees, and suits from ₹12/item with free doorstep pickup across Puppalaguda, OU Colony & Secretariat Colony. Flat 20% Off!',
    primaryKeyword: 'iron service in manikonda',
    secondaryKeywords: 'ironing service in manikonda, press service in manikonda, steam iron near me, ironing service near me, cloth press near me, steam press near me, clothes ironing near me, online cloth iron service near me, ironing and laundry service manikonda, steam iron at home service, ironing services near my location, iron shop near me, clothes press near me, dhobi press near me, steam ironing in manikonda, best steam iron in manikonda',
    nearMeKeywords: [
      'iron service near me',
      'ironing service near me',
      'steam iron near me',
      'steam ironing near me',
      'cloth press near me',
      'steam press near me',
      'clothes ironing near me',
      'steam pressing near me',
      'ironing shop near me',
      'clothes press near me',
      'online cloth iron service near me',
      'steam iron Manikonda',
      'iron service in Manikonda',
      'ironing Tolichowki'
    ],
    processSummary: 'Temperature calibration, high-pressure 140°C micro-steam inflation, vacuum cold-suction crease locking, and hanger delivery.',
    rateCard: [
      { item: 'Office Shirts & Casual T-Shirts', rate: '₹12 / item', details: '140°C Italian micro-steam press, hanger or fold' },
      { item: 'Formal Trousers, Chinos & Jeans', rate: '₹14 / item', details: 'Vacuum suction crease locking, zero white shine' },
      { item: 'Daily Cotton Kurtas & Tops', rate: '₹20 / item', details: 'High-precision steam finishing, zero fabric burns' },
      { item: 'Silk Sarees / Heavy Designer Sarees', rate: '₹45 - ₹60', details: 'Low-heat steam tension finishing, zari safe' },
      { item: 'Blazers & Suit Jackets Pressing', rate: '₹60 - ₹80', details: '3D mannequin form inflation, shoulder restoration' },
      { item: 'Dhotis & Panchas Pressing', rate: '₹25 / item', details: 'Crisp crease alignment, traditional edge pressing' },
    ],
    faqs: [
      {
        question: 'Which is the best iron service near me in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is rated #1 for iron service and steam press in Manikonda with 4.9/5 stars. We use professional 140°C Italian steam generators and vacuum cold-suction tables to guarantee razor-sharp creases with zero heat shine and zero scorch marks on garments.',
      },
      {
        question: 'Do you provide online cloth iron service near me with home pickup?',
        answer: 'Yes! You can book an online cloth iron service in 60 seconds at techwashlaundry.com. Our executive provides doorstep pickup and delivery across Manikonda, Puppalaguda, Secretariat Colony, OU Colony, and Lanco Hills.',
      },
      {
        question: 'What is the price of steam iron service in Manikonda?',
        answer: 'Steam ironing starts at just ₹12 per item for shirts, t-shirts, and trousers, and ₹35-₹60 for sarees and suits. Flat 20% Off on your first order with free doorstep pickup.',
      },
      {
        question: 'What is the difference between normal dhobi iron and Techwash steam press?',
        answer: 'Local street dhobis use heavy charcoal irons that run at dangerously uneven temperatures, causing synthetic fiber burns and leaving shiny white patches on dark trousers. Techwash uses high-pressure micro-steam and vacuum suction that relaxes fabric wrinkles without touching hot metal directly to delicate fabrics.',
      },
      {
        question: 'Do you provide steam iron at home service or doorstep pickup in Manikonda?',
        answer: 'We provide convenient doorstep pickup and delivery across all societies in Manikonda. Your clothes are picked up, professionally steam-pressed in our clean, dust-free facility, hung on hangers or sealed in protective bags, and delivered back to your home within 24 to 48 hours.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best iron service in Manikonda, Hyderabad?',
        answer: 'Techwash Laundry is the #1 rated iron service and steam ironing provider in Manikonda (500089). We steam-press office wear, formal suits, and delicate silk sarees with 100% precision.',
      },
      {
        question: 'What is the iron rate per cloth in Manikonda?',
        answer: 'Daily shirts and trousers start at ₹12/item. Heavy garments like blazers, kurtas, and sarees are ₹35 to ₹60. Doorstep pickup is available all 7 days.',
      },
      {
        question: 'Can I get same-day urgent iron service in Manikonda?',
        answer: 'Yes! Express 24-hour turnaround is available for urgent office wear, meetings, and parties in Manikonda.',
      },
      {
        question: 'How do you prevent shine on black and dark formal trousers?',
        answer: 'We use Teflon shoe soleplates and vacuum cold-air suction tables that pull steam through the fabric instantly, setting crisp creases without crushing or glazing the fabric surface.',
      },
      {
        question: 'Where can I drop off clothes for steam press in Manikonda?',
        answer: 'Visit our branch on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda or our OU Colony branch beside Dreamscape Hotel.',
      },
    ],
  },

  // 6. Core Intent: Wash & Fold
  {
    slug: 'wash-and-fold',
    name: 'Wash & Fold',
    category: 'Weight Based',
    pricingDisplay: 'Starts at ₹100 / Kg',
    h1: '#1 Best Wash & Fold (Kilo Laundry) Near Me in Manikonda',
    manikondaH1: '#1 Best Wash and Fold Service in Manikonda (From ₹100/Kg)',
    nearMeTitle: '#1 Best Wash and Fold Near Me in Manikonda (From ₹100/Kg) | Techwash',
    manikondaTitle: '#1 Best Wash and Fold Service in Manikonda (From ₹100/Kg) | Techwash',
    metaDescription: 'Affordable wash and fold laundry near you in Manikonda & Hyderabad. RO soft water wash, hypoallergenic bio-detergents, and store-ready packaging from ₹100/kg with free doorstep pickup across Puppalaguda & Manikonda. Flat 20% Off!',
    manikondaDescription: 'Looking for wash and fold laundry in Manikonda? Techwash offers transparent per-kg weighing, 0 PPM RO soft water wash, single-customer isolated drums, and sealed moisture wraps from ₹100/kg with free doorstep pickup. Flat 20% Off!',
    primaryKeyword: 'wash and fold near me',
    secondaryKeywords: 'wash and fold in manikonda, wash and fold service in manikonda, kilo laundry near me, per kg laundry near me, kilo laundry manikonda, fold laundry near me, clothes wash and fold near me, wash and fold laundry near me, wash and fold service near me',
    nearMeKeywords: [
      'wash and fold near me',
      'wash and fold laundry near me',
      'wash and fold service near me',
      'fold laundry near me',
      'per kg laundry near me',
      'kilo laundry near me',
      'wash and fold Manikonda',
      'kilo laundry Manikonda',
      'clothes wash and fold near me'
    ],
    processSummary: 'Weighing, isolated drum wash with hypoallergenic bio-detergents in 0 PPM soft water, low-heat drying, and precision hand-folding in sealed moisture wraps.',
    rateCard: [
      { item: 'Everyday Casual Clothes (Mixed)', rate: '₹100 / Kg', details: '0 PPM RO soft water drum wash, sensor drying, fold' },
      { item: 'Gym Wear & Synthetic Athleisure', rate: '₹100 / Kg', details: 'Odor-neutralizing enzyme wash, low heat tumble' },
      { item: 'Bath Towels, Hand Towels & Napkins', rate: '₹100 / Kg', details: 'Fluffy demineralized soft wash, hygienic drying' },
      { item: 'Bedsheets, Duvet & Pillow Covers', rate: '₹100 / Kg', details: 'Deep wash, moisture-free sealing in fresh bundle' },
    ],
    faqs: [
      {
        question: 'What is wash and fold laundry service?',
        answer: 'Wash & Fold is an economical kilo-based laundry service for everyday items like t-shirts, shorts, track pants, nightwear, bedsheets, and towels. Garments are washed in 0 PPM soft water, tumble-dried, and neatly folded into ready-to-wear stacks.',
      },
      {
        question: 'What are the wash and fold rates near me in Manikonda?',
        answer: 'Wash & Fold starts at ₹100 per kg. Minimum pickup order is ₹299 for free doorstep service in Manikonda.',
      },
      {
        question: 'Are my clothes washed with other people’s clothes?',
        answer: 'Never. At Techwash, every customer’s laundry is washed exclusively in their own dedicated, sanitized drum cycle.',
      },
      {
        question: 'What kind of detergents do you use for wash and fold?',
        answer: 'We use gentle, hypoallergenic bio-detergents with natural enzymes that break down stains and odors without harsh bleaching agents or skin irritants.',
      },
      {
        question: 'How long does wash and fold service take?',
        answer: 'Standard delivery is 48 hours, with express 24-hour return available upon request.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best wash and fold service in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for wash & fold in Manikonda. Working professionals, IT employees, and families across Lanco Hills and Puppalaguda rely on us for hygienic per-kg laundry.',
      },
      {
        question: 'How does per kg laundry weighing work in Manikonda?',
        answer: 'Our executive brings certified electronic scales to your door and weighs your hamper in front of you. You receive a digital receipt on WhatsApp instantly.',
      },
      {
        question: 'Can I include bedsheets and towels in wash and fold?',
        answer: 'Yes! Bedsheets, pillow covers, bath towels, and gym clothes are all accepted under our standard per-kg wash and fold rates.',
      },
      {
        question: 'Do you deliver folded clothes in protective packaging?',
        answer: 'Yes, clothes are crisply hand-folded and sealed in moisture-proof, dust-free packaging so they can be placed straight into your wardrobe.',
      },
      {
        question: 'How can I schedule wash and fold pickup in Manikonda?',
        answer: 'Book in 60 seconds at techwashlaundry.com or call +91 63048 45567.',
      },
    ],
  },

  // 7. Core Intent: Starch & Iron
  {
    slug: 'starch-and-iron',
    name: 'Starch & Iron',
    category: 'Finishing',
    pricingDisplay: 'Starts at ₹25 / item',
    h1: '#1 Best Starch & Iron (Cotton Starching) in Manikonda',
    manikondaH1: '#1 Best Starch & Iron Service in Manikonda (From ₹25)',
    nearMeTitle: '#1 Best Starch and Iron Near Me in Manikonda (Traditional Starching) | Techwash',
    manikondaTitle: '#1 Best Starch & Iron Service in Manikonda (From ₹25) | Techwash',
    metaDescription: 'Traditional organic rice and corn starching with precision vacuum steam pressing for cotton shirts, dhotis, kurtas, and sarees in Manikonda & Hyderabad. From ₹25 with free doorstep pickup. Flat 20% Off!',
    manikondaDescription: 'Looking for authentic cotton starching and steam ironing in Manikonda? Techwash offers customizable stiffness (light, medium, heavy) for cotton shirts, dhotis, and sarees with free doorstep pickup in Puppalaguda & Manikonda. Flat 20% Off!',
    primaryKeyword: 'starch and iron near me',
    secondaryKeywords: 'starch and iron in manikonda, cotton starching near me, cotton starching in manikonda, starching service near me, saree starching near me, charak near me, charak and iron manikonda, shirt starching near me, stiff collar press near me, starch ironing near me',
    nearMeKeywords: [
      'starch and iron near me',
      'starching service near me',
      'cotton starching near me',
      'saree starching near me',
      'starch ironing near me',
      'crisp shirt starching near me',
      'charak near me',
      'charak and iron manikonda'
    ],
    processSummary: 'Customizable natural starch ratio formulation, gentle fiber infusion bath, high-pressure vacuum steam bed pressing, and crisp collar stiffening.',
    rateCard: [
      { item: 'Cotton Shirts (Light / Medium / Heavy Starch)', rate: '₹25 / item', details: 'Organic rice/corn starch infusion + vacuum steam press' },
      { item: 'Traditional Cotton Dhoti / Pancha', rate: '₹60 / item', details: 'Authentic South Indian charak starch & knife crease' },
      { item: 'Pure Cotton Saree Starching & Press', rate: '₹80 / item', details: 'Even starch misting, roll pressing, zero stiffness crack' },
      { item: 'Cotton Kurta & Pyjama Set', rate: '₹45 / set', details: 'Stiff collar shaping, placket stiffening, formal drape' },
    ],
    faqs: [
      {
        question: 'What is the starch and iron service?',
        answer: 'Starch & Iron infuses cotton and linen garments with natural organic rice and corn starch, followed by precision high-temperature steam pressing to achieve a crisp, stiff finish that resists wrinkles throughout the day.',
      },
      {
        question: 'Can I choose the stiffness level for my cotton shirts?',
        answer: 'Yes! You can choose between Light Starch (natural feel with crease resistance), Medium Starch (ideal for formal office shirts), or Heavy Starch (traditional stiff finish for dhotis, kurtas, and cotton sarees).',
      },
      {
        question: 'Does starching damage clothes over time?',
        answer: 'No. We use 100% organic food-grade starch that washes out cleanly in water without leaving yellow residues or weakening cotton yarn.',
      },
      {
        question: 'What is the price of starch and iron in Manikonda?',
        answer: 'Starch & Iron starts from ₹25 per item for cotton shirts, and ₹60-₹90 for traditional dhotis and sarees.',
      },
      {
        question: 'Do you offer pickup for starching in Manikonda?',
        answer: 'Yes, free doorstep pickup and delivery is available across Manikonda, Puppalaguda, and Tolichowki.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best cotton starching and iron service in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for cotton starching and iron in Manikonda (500089). We deliver perfectly stiff collars, sharp plackets, and crisp cuffs.',
      },
      {
        question: 'Do you do charak and starch for South Indian dhotis in Manikonda?',
        answer: 'Yes, we specialize in traditional South Indian cotton dhotis, panchas, and kurtas with custom starching and knife-edge pressing.',
      },
      {
        question: 'What is the turnaround time for starch and iron in Manikonda?',
        answer: 'Standard turnaround is 48 hours to ensure complete drying and proper starch setting.',
      },
      {
        question: 'How do I request heavy starch for my shirts?',
        answer: 'You can mention your starch preference (light, medium, heavy) when scheduling online or notify the pickup executive.',
      },
      {
        question: 'Where can I drop off clothes for starching in Manikonda?',
        answer: 'Drop off at our Manikonda branch counter on Shaikpet Main Rd, Sri Ram Nagar Colony (open 8 AM – 9 PM daily).',
      },
    ],
  },

  // 8. Core Intent: Saree Rolling & Polishing
  {
    slug: 'saree-rolling',
    name: 'Saree Rolling & Polishing',
    category: 'Traditional',
    pricingDisplay: 'From ₹120 / saree',
    h1: '#1 Best Saree Rolling & Polishing Near Me in Manikonda',
    manikondaH1: '#1 Best Saree Rolling & Polishing in Manikonda (500089)',
    nearMeTitle: '#1 Best Saree Rolling & Polishing in Manikonda (Near Me) | Techwash',
    manikondaTitle: '#1 Best Saree Rolling & Silk Saree Care in Manikonda (500089) | Techwash',
    metaDescription: 'Traditional wooden cylinder roller polishing, natural starching, and gentle steam finishing for silk, pattu, and banarasi sarees in Manikonda & Hyderabad. Free doorstep pickup across Puppalaguda & Lanco Hills. Flat 20% Off!',
    manikondaDescription: 'Searching for pattu saree rolling and polishing in Manikonda? Techwash provides authentic wooden cylinder roller finishing, natural starch misting, and zari protection for Kanjeevaram and Banarasi sarees with doorstep pickup. Flat 20% Off!',
    primaryKeyword: 'saree rolling near me',
    secondaryKeywords: 'saree rolling in manikonda, saree polishing near me, saree polishing in manikonda, pattu saree rolling near me, pattu saree rolling in manikonda, silk saree polishing near me, silk saree dry cleaning in manikonda, saree roll press near me, saree dry wash and rolling near me, zari saree polishing hyderabad, banarasi saree rolling manikonda',
    nearMeKeywords: [
      'saree rolling near me',
      'saree polishing near me',
      'saree rolling service near me',
      'pattu saree rolling near me',
      'silk saree care near me',
      'saree dry cleaning near me',
      'saree dry wash near me',
      'saree polishing Manikonda',
      'pattu saree rolling Manikonda'
    ],
    processSummary: 'Zari inspection, natural starch misting, smooth wooden cylinder roller pass, and wrinkle-free fold packaging.',
    rateCard: [
      { item: 'Pattu & Pure Silk Saree Roller Polishing', rate: '₹120 / saree', details: 'Wooden cylinder roller pass, natural luster restoration' },
      { item: 'Saree Dry Wash + Wooden Rolling Combo', rate: '₹250 / saree', details: 'Hydrocarbon dry wash + cylinder polishing + steam finish' },
      { item: 'Kanjeevaram / Dharmavaram Heavy Zari Polish', rate: '₹150 / saree', details: 'Gold/silver zari protection, zero-crush wooden press' },
      { item: 'Chiffon, Georgette & Organza Saree Polish', rate: '₹120 / saree', details: 'Gentle misting, wrinkle-free rolling without stretch' },
    ],
    faqs: [
      {
        question: 'What is saree rolling and polishing?',
        answer: 'Saree rolling is a traditional finishing process where delicate silk and pattu sarees are misted with natural starch and passed through motorized smooth wooden rollers. It removes deep wrinkles and restores natural silk luster without flattening the zari border.',
      },
      {
        question: 'Is saree rolling safe for expensive Kanjeevaram and Banarasi silk sarees?',
        answer: 'Yes! Unlike flat metal hot irons which crush and tarnish gold/silver zari threads, our wooden rollers apply uniform gentle pressure and low steam, preserving the delicate embroidery and fabric texture.',
      },
      {
        question: 'What is the price of saree rolling near me in Manikonda?',
        answer: 'Saree rolling starts at ₹120 per saree. Saree dry cleaning combined with rolling and polishing is available at package rates with Flat 20% Off.',
      },
      {
        question: 'Do you offer doorstep pickup for sarees in Manikonda?',
        answer: 'Yes, we provide safe doorstep pickup and delivery in moisture-sealed protective packaging across Manikonda, Puppalaguda, and Tolichowki.',
      },
      {
        question: 'How long does saree rolling take?',
        answer: 'Standard turnaround is 48 hours to allow the saree to dry naturally on rolling cylinders without artificial heat.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best saree rolling and polishing service in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for saree rolling in Manikonda (500089). Hundreds of families in Secretariat Colony and Lanco Hills trust us with their wedding silks and heirloom sarees.',
      },
      {
        question: 'Do you provide pattu saree rolling in Manikonda?',
        answer: 'Yes! We specialize in pure pattu, Dharmavaram, Gadwal, and Kanjeevaram silk saree rolling, polishing, and charak.',
      },
      {
        question: 'Can you remove stains from my silk saree before rolling?',
        answer: 'Yes, our dry cleaning experts pre-spot grease, oil, and sweat stains using non-toxic hydrocarbon solvents before the rolling and polishing stage.',
      },
      {
        question: 'How are sarees packaged after rolling?',
        answer: 'Rolled sarees are packed with acid-free tissue paper and sealed in dust-proof garment bags to prevent insect and moisture damage in your wardrobe.',
      },
      {
        question: 'Where can I book saree rolling in Manikonda?',
        answer: 'Book online at techwashlaundry.com or call +91 63048 45567.',
      },
    ],
  },

  // 9. Core Intent: Shoe Cleaning & Sneaker Spa
  {
    slug: 'shoe-cleaning',
    name: 'Shoe Cleaning & Sneaker Spa',
    category: 'Footwear',
    pricingDisplay: 'Starts at ₹350 / pair',
    h1: '#1 Best Shoe Cleaning & Sneaker Spa Near Me in Manikonda',
    manikondaH1: '#1 Best Shoe Cleaning & Sneaker Laundry in Manikonda (500089)',
    nearMeTitle: '#1 Best Shoe Cleaning & Sneaker Laundry in Manikonda (Near Me) | Techwash',
    manikondaTitle: '#1 Best Shoe Cleaning & Sneaker Spa in Manikonda (From ₹350) | Techwash',
    metaDescription: 'Professional sneaker laundry, midsole whitening, suede conditioning, and UV anti-bacterial sterilization in Manikonda & Hyderabad. From ₹350/pair with free doorstep pickup. Flat 20% Off!',
    manikondaDescription: 'Looking for sneaker cleaning and shoe laundry in Manikonda? Techwash offers deep hand-scrubbing, midsole de-yellowing, suede restoration, and UV sterilization with doorstep pickup across Manikonda. Flat 20% Off!',
    primaryKeyword: 'shoe cleaning near me',
    secondaryKeywords: 'shoe laundry in manikonda, sneaker cleaning near me, shoe laundry near me, shoe wash near me, shoe dry cleaning near me, shoe spa near me, leather shoe cleaning near me, sports shoe cleaning near me, sneaker spa manikonda, shoe cleaning service in manikonda',
    nearMeKeywords: [
      'shoe cleaning near me',
      'sneaker cleaning near me',
      'shoe laundry near me',
      'shoe wash near me',
      'shoe spa near me',
      'leather shoe cleaning near me',
      'sneaker laundry Hyderabad',
      'shoe cleaning Manikonda',
      'shoe laundry Manikonda'
    ],
    processSummary: 'Material inspection, soft-bristle hand scrubbing, ultrasonic sole stain lift, lace restoration, and UV anti-microbial sterilization.',
    rateCard: [
      { item: 'Running Shoes & Mesh Sports Sneakers', rate: '₹350 / pair', details: 'Deep foam scrub, insole sanitization, deodorizing' },
      { item: 'White Leather & Canvas Sneakers (Stan Smith/AF1)', rate: '₹400 / pair', details: 'Midsole whitening, lace soak, UV chamber sterilization' },
      { item: 'Suede & Nubuck Loafers Spa', rate: '₹500 / pair', details: 'Dry-sponge extraction, suede eraser, nap re-conditioning' },
      { item: 'Pure Leather Formal Boots & Oxford Shoes', rate: '₹550 / pair', details: 'Cream polish, edge dressing, conditioning, high shine' },
    ],
    faqs: [
      {
        question: 'What shoe types do you clean at Techwash Sneaker Spa?',
        answer: 'We clean sports shoes, running sneakers (Nike, Adidas, Puma, Asics), luxury designer footwear, canvas Converse/Vans, suede loafers, leather dress shoes, and boots.',
      },
      {
        question: 'How do you clean white sneakers and yellowed midsoles?',
        answer: 'We use specialized foam cleaners, soft-bristle horsehair brushes, and UV oxidation treatments to reverse sole yellowing without harming stitching or shoe glues.',
      },
      {
        question: 'Is shoe cleaning safe for suede and nubuck leather?',
        answer: 'Yes! Suede shoes are never submerged in water. We use dry-sponge soil extraction, suede erasers, and conditioning oils to restore the soft velvet nap.',
      },
      {
        question: 'What is the price of shoe laundry near me in Manikonda?',
        answer: 'Shoe cleaning starts from ₹350 per pair for standard sneakers, and ₹500-₹700 for premium leather, suede, and designer shoes.',
      },
      {
        question: 'Do you offer shoe pickup and delivery in Manikonda?',
        answer: 'Yes, we collect and return shoes in fresh dust-proof bags right at your doorstep across Manikonda and Hyderabad.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best sneaker laundry and shoe spa in Manikonda?',
        answer: 'Techwash Sneaker Spa is rated #1 in Manikonda. We combine meticulous hand-cleaning with UV anti-bacterial chamber treatment to kill 99.9% of odor-causing bacteria.',
      },
      {
        question: 'How long does shoe cleaning take in Manikonda?',
        answer: 'Standard turnaround is 48 to 72 hours to allow complete temperature-controlled natural dehumidification without sole warping.',
      },
      {
        question: 'Do you clean and replace shoe laces?',
        answer: 'Yes, shoe laces are soaked, hand-washed, and conditioned. Replacement laces are also available upon request.',
      },
      {
        question: 'Can you remove mud and grease stains from running shoes?',
        answer: 'Yes, our enzymatic spot-cleaners dissolve deep dirt, mud, and road grime from breathable mesh uppers.',
      },
      {
        question: 'Where can I drop off shoes in Manikonda?',
        answer: 'Drop off at our store on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda or book online for doorstep pickup.',
      },
    ],
  },

  // 10. Core Intent: Curtain Cleaning & Dry Wash
  {
    slug: 'curtain-cleaning',
    name: 'Curtain Cleaning & Dry Wash',
    category: 'Household',
    pricingDisplay: '₹30 / sq. ft.',
    h1: '#1 Best Curtain Cleaning & Dry Wash Near Me in Manikonda',
    manikondaH1: '#1 Best Curtain Cleaning & Dry Wash in Manikonda (500089)',
    nearMeTitle: '#1 Best Curtain Cleaning & Dry Wash in Manikonda (Near Me) | Techwash',
    manikondaTitle: '#1 Best Curtain Cleaning & Dry Wash in Manikonda (From ₹30/sqft) | Techwash',
    metaDescription: 'Deep curtain dust-mite extraction, demineralized soft wash, and vertical steam de-wrinkling for blackout and sheer drapes. From ₹30/sqft with free doorstep pickup in Manikonda & Hyderabad. Flat 20% Off!',
    manikondaDescription: 'Need curtain cleaning or curtain dry wash in Manikonda? Techwash removes dust, allergens, and odors from sheer, velvet, and blackout drapes with free doorstep pickup and re-hanging support in Manikonda. Flat 20% Off!',
    primaryKeyword: 'curtain cleaning near me',
    secondaryKeywords: 'curtain dry wash in manikonda, curtain cleaning in manikonda, curtain dry cleaning near me, curtain dry wash near me, curtain washing near me, drapery cleaning near me, curtain laundry near me, blinds cleaning near me, living room curtain wash manikonda',
    nearMeKeywords: [
      'curtain cleaning near me',
      'curtain dry cleaning near me',
      'curtain dry wash near me',
      'curtain washing near me',
      'curtain laundry near me',
      'drapery cleaning near me',
      'curtain cleaning Manikonda',
      'curtain dry wash Manikonda'
    ],
    processSummary: 'Dimension verification, ultrasonic dust-mite extraction, gentle fabric wash / dry wash, and vertical steam press for wrinkle-free hanging.',
    rateCard: [
      { item: 'Standard Cotton & Poly Drapes', rate: '₹30 / sq. ft.', details: 'Ultrasonic dust extraction, soft wash, vertical steam' },
      { item: 'Blackout Curtains (Thermal Backing Safe)', rate: '₹35 / sq. ft.', details: 'Delicate hydrocarbon cleaning, zero backing peel' },
      { item: 'Velvet & Heavy Embroidered Curtains', rate: '₹40 / sq. ft.', details: 'Zero-water dry cleaning, steam de-wrinkling' },
      { item: 'Living Room Sheer Curtains', rate: '₹25 / sq. ft.', details: 'Gentle demineralized soft wash, bright whitening' },
    ],
    faqs: [
      {
        question: 'How do you clean delicate and blackout curtains?',
        answer: 'Blackout and delicate sheer curtains are dry-cleaned with non-toxic hydrocarbon solvents to prevent rubber backing peeling or fabric shrinkage. Washable heavy cotton and polyester curtains are washed in 0 PPM soft water and vertically steam pressed.',
      },
      {
        question: 'Do you provide curtain dry wash in Manikonda?',
        answer: 'Yes! We provide full curtain dry wash and cleaning across Manikonda, Puppalaguda, and Shaikpet. We measure, deep-clean, steam press, and return curtains fresh and crease-free.',
      },
      {
        question: 'What is the price of curtain cleaning in Manikonda?',
        answer: 'Curtain cleaning is priced at ₹30 per square foot for standard fabrics and ₹40/sqft for velvet and heavy blackout drapes.',
      },
      {
        question: 'Do you offer doorstep pickup for heavy curtains?',
        answer: 'Yes, our team provides doorstep collection and delivery across all apartments and villas in Manikonda.',
      },
      {
        question: 'Does curtain cleaning eliminate dust mites and allergens?',
        answer: 'Yes, our high-power extraction and 140°C vertical steam finishing kills 99.9% of dust mites, mold spores, and trapped allergens.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best curtain cleaning service in Manikonda?',
        answer: 'Techwash Laundry is rated #1 for curtain cleaning and drapery dry wash in Manikonda (500089) with 4.9/5 stars.',
      },
      {
        question: 'How do you measure curtain dimensions for billing?',
        answer: 'Our executive measures height and width in square feet directly at your home during collection, providing an instant receipt.',
      },
      {
        question: 'What is the turnaround time for curtain cleaning in Manikonda?',
        answer: 'Standard turnaround is 48 to 72 hours for thorough extraction, delicate washing, and vertical steam press finishing.',
      },
      {
        question: 'Will curtain cleaning cause color fading or shrinkage?',
        answer: 'No. We test fabric dye stability and clean in soft demineralized water or hydrocarbon dry wash solvents, ensuring zero shrinkage.',
      },
      {
        question: 'How do I book curtain pickup in Manikonda?',
        answer: 'Call +91 63048 45567 or book online at techwashlaundry.com.',
      },
    ],
  },

  // 11. Core Intent: Carpet Cleaning & Rug Wash
  {
    slug: 'carpet-cleaning',
    name: 'Carpet Cleaning & Rug Wash',
    category: 'Household',
    pricingDisplay: '₹45 / sq. ft.',
    h1: '#1 Best Carpet Cleaning & Rug Shampooing Near Me in Manikonda',
    manikondaH1: '#1 Best Carpet Cleaning & Rug Wash in Manikonda (500089)',
    nearMeTitle: '#1 Best Carpet Cleaning & Rug Wash in Manikonda (Near Me) | Techwash',
    manikondaTitle: '#1 Best Carpet Cleaning & Rug Shampooing in Manikonda (From ₹45/sqft) | Techwash',
    metaDescription: 'Rotary shampoo extraction, allergen removal, and thermal dehumidification for living room rugs and carpets in Manikonda & Hyderabad. From ₹45/sqft with free doorstep pickup. Flat 20% Off!',
    manikondaDescription: 'Searching for carpet cleaning or carpet dry wash in Manikonda? Techwash removes deep soil, pet stains, and odors with rotary shampoo extraction and thermal drying. Free doorstep pickup in Puppalaguda & Manikonda. Flat 20% Off!',
    primaryKeyword: 'carpet cleaning near me',
    secondaryKeywords: 'carpet washing in manikonda, carpet cleaning in manikonda, carpet dry wash near me, carpet dry wash in manikonda, carpet washing near me, carpet dry cleaning near me, rug cleaning near me, carpet shampoo near me, deep carpet cleaning hyderabad',
    nearMeKeywords: [
      'carpet cleaning near me',
      'carpet washing near me',
      'rug cleaning near me',
      'carpet shampoo near me',
      'carpet cleaner near me',
      'carpet cleaning Manikonda',
      'carpet dry wash Manikonda',
      'carpet washing Hyderabad'
    ],
    processSummary: 'High-power dry vacuuming, rotary shampoo agitation, deep stain extraction, and anti-microbial thermal dehumidification.',
    rateCard: [
      { item: 'Living Room Area Rugs & Carpets', rate: '₹45 / sq. ft.', details: 'Rotary shampoo agitation, hot water extraction, dry' },
      { item: 'Shaggy & High-Pile Modern Rugs', rate: '₹55 / sq. ft.', details: 'Deep sand dislodgement, anti-microbial thermal drying' },
      { item: 'Hand-Knotted Woolen & Persian Silk Rugs', rate: '₹65 / sq. ft.', details: 'pH-neutral low-moisture foam wash, colorfast care' },
      { item: 'Door Mats & Hallway Runners', rate: '₹35 / sq. ft.', details: 'Heavy mud & grime extraction, deodorizing' },
    ],
    faqs: [
      {
        question: 'How do you wash and shampoo heavy rugs and carpets?',
        answer: 'We first use high-power vibratory vacuuming to dislodge trapped sand and dust, followed by rotary brush shampooing with bio-safe detergents, hot-water extraction, and thermal dehumidification drying.',
      },
      {
        question: 'Do you provide carpet dry wash in Manikonda?',
        answer: 'Yes! For delicate wool, silk, and Persian rugs, we use specialized low-moisture dry extraction foam that lifts grime without soaking backing adhesives.',
      },
      {
        question: 'What is the cost of carpet cleaning in Manikonda?',
        answer: 'Carpet cleaning is ₹45 per square foot. Free doorstep pickup and delivery across Manikonda and surrounding areas.',
      },
      {
        question: 'Can you remove pet stains and stubborn odors from carpets?',
        answer: 'Yes! We use enzymatic bio-treatments that neutralize urine uric acid crystals and bacteria, permanently eliminating odors rather than masking them.',
      },
      {
        question: 'How long does carpet cleaning and drying take?',
        answer: 'Turnaround is 48 to 72 hours to ensure 100% moisture-free drying in our thermal dehumidification facility before delivery.',
      },
    ],
    manikondaFaqs: [
      {
        question: 'Which is the best carpet cleaning service in Manikonda?',
        answer: 'Techwash Laundry is recognized as the #1 carpet cleaning and rug wash provider in Manikonda (500089).',
      },
      {
        question: 'Do you pick up heavy living room carpets in Manikonda?',
        answer: 'Yes, our pickup team collects rugs of any size directly from your doorstep across Manikonda, Puppalaguda, and Lanco Hills.',
      },
      {
        question: 'How do you calculate carpet cleaning cost in Manikonda?',
        answer: 'We measure length and width in square feet at your home and calculate transparently at ₹45/sqft with Flat 20% Off for first-time orders.',
      },
      {
        question: 'Will carpet colors bleed or fade during washing?',
        answer: 'No. Every carpet undergoes colorfastness testing, and temperature-controlled pH-neutral shampoos are used to protect rich fibers.',
      },
      {
        question: 'How to book carpet cleaning in Manikonda?',
        answer: 'Book online at techwashlaundry.com or call +91 63048 45567.',
      },
    ],
  },
];
