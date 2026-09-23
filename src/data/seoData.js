/**
 * Tech Wash Centralized SEO & Geo-Targeting Dataset
 * Single source of truth for Hyderabad Local SEO, Service SEO, and Schema.org metadata
 */

export const BASE_URL = 'https://www.techwashlaundry.com';

export const BUSINESS_INFO = {
  name: 'Tech Wash Laundry Services',
  legalName: 'Tech Wash Laundry Services',
  alternateName: 'Tech Wash',
  url: BASE_URL,
  logo: `${BASE_URL}/techwashlogo.webp`,
  image: `${BASE_URL}/techwashlogo.webp`,
  telephone: '+91 89777 69866',
  email: 'support@techwash.in',
  priceRange: '₹12 - ₹350',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Debit Card, UPI, Google Pay, PhonePe, Paytm, Net Banking',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Road No. 36, CBI Colony, Jubilee Hills',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    postalCode: '500033',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 17.4319,
    longitude: 78.4073,
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
 * 8 Priority Hyderabad Local SEO Focus Areas
 * With geographically accurate nearby relationships, landmarks, and unique localized content
 */
export const SEO_AREAS = [
  {
    slug: 'manikonda',
    name: 'Manikonda',
    h1: 'Laundry & Dry Cleaning Services in Manikonda, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Manikonda | Tech Wash',
    metaDescription: 'Professional laundry service and dry cleaning in Manikonda, Hyderabad. 0 PPM RO soft water wash, non-toxic hydrocarbon dry cleaning, and scheduled doorstep pickup across Manikonda.',
    keywords: 'laundry service in manikonda, best laundry in manikonda, laundry near manikonda, dry cleaning in manikonda, laundry pickup and delivery manikonda, dry cleaners manikonda hyderabad',
    pincodes: ['500089'],
    landmarks: [
      'Lanco Hills Road',
      'Puppalaguda Main Road',
      'Secretariat Colony',
      'OU Colony',
      'Shirdi Sai Nagar',
      'Alkapoor Township connectivity',
    ],
    introText: 'Tech Wash delivers professional laundry, eco-friendly hydrocarbon dry cleaning, and steam ironing services for residents and professionals in Manikonda, Hyderabad. With 100% demineralized RO soft water and isolated single-customer wash drums, our dedicated doorstep fleet provides daily scheduled laundry pickup and delivery across Secretariat Colony, OU Colony, Lanco Hills Road, and surrounding societies.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Turnaround Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Daily office wear shirts & trousers steam ironing and crease retention',
      'Weight-based wash & fold / wash & iron for working professionals & families',
      'Eco-friendly hydrocarbon dry cleaning for formal suits, blazers & dresses',
      'Traditional saree rolling & polishing for silk, pattu & banarasi sarees',
      'Living room curtains and heavy carpet deep extraction washing',
    ],
    nearbyAreas: ['puppalaguda', 'alkapur-township', 'khajaguda', 'lanco-hills', 'shaikpet', 'narsingi'],
    faqs: [
      {
        question: 'Does Tech Wash provide laundry service in Manikonda?',
        answer: 'Yes, Tech Wash provides full laundry services in Manikonda including weight-based wash & fold (₹100/kg), wash & iron (₹130/kg), steam ironing (from ₹12), and premium dry cleaning (from ₹40).',
      },
      {
        question: 'How does laundry pickup and delivery in Manikonda work?',
        answer: 'You can schedule a pickup online in 60 seconds. Our executive arrives at your preferred time slot (8 AM – 9 PM) anywhere in Manikonda with calibrated electronic scales and delivers your clothes back fresh, crisp, and sealed within 24–48 hours.',
      },
      {
        question: 'Where can I find reliable dry cleaning in Manikonda?',
        answer: 'Tech Wash provides certified non-toxic European hydrocarbon dry cleaning in Manikonda with zero PERC, preserving suit fabrics, delicate silks, and designer wear without harsh chemical odors.',
      },
      {
        question: 'Is Tech Wash available near Manikonda landmarks like Secretariat Colony & OU Colony?',
        answer: 'Yes, our pickup fleet operates daily throughout Secretariat Colony, OU Colony, Lanco Hills Road, Shirdi Sai Nagar, and adjacent Puppalaguda corridors.',
      },
      {
        question: 'Which nearby areas around Manikonda are served?',
        answer: 'In addition to Manikonda, Tech Wash serves nearby Puppalaguda, Alkapur Township, Lanco Hills, Khajaguda, Shaikpet, and Narsingi.',
      },
    ],
  },
  {
    slug: 'puppalaguda',
    name: 'Puppalaguda / Puppalguda',
    h1: 'Laundry & Dry Cleaning Services in Puppalaguda, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Puppalaguda | Tech Wash',
    metaDescription: 'Top-rated laundry service and dry cleaning in Puppalaguda (Puppalguda), Hyderabad. Demineralized RO soft wash, suit dry cleaning, and doorstep pickup for gated communities.',
    keywords: 'laundry service in puppalaguda, best laundry in puppalguda, laundry near puppalaguda, dry cleaning in puppalaguda, laundry pickup and delivery puppalaguda, dry cleaners golden mile road',
    pincodes: ['500089'],
    landmarks: [
      'Golden Mile Road',
      'Puppalaguda–Narsingi Link Road',
      'Aparna Zenon',
      'Rajapushpa Atria',
      'Western Express corridor',
    ],
    introText: 'Tech Wash provides premium garment care, per-kg laundry, and couture dry cleaning across Puppalaguda (also written Puppalguda), Hyderabad. Serving premier high-rise communities along Golden Mile Road and Puppalaguda Main Road with slot-based doorstep pickup and transparent digital billing.',
    turnaround: 'Standard 48-Hour Turnaround • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Gated community doorstep laundry pickup and scheduled delivery',
      'Executive blazers, suits, and designer wear hydrocarbon dry cleaning',
      'Demineralized RO water wash and steam pressing for sensitive fabrics',
      'Bed linen, duvet, and curtain deep sanitization',
      'Sneaker sole whitening and leather shoe restoration',
    ],
    nearbyAreas: ['manikonda', 'narsingi', 'khajaguda', 'alkapur-township', 'nanakramguda'],
    faqs: [
      {
        question: 'Do you offer laundry pickup in Puppalaguda gated communities?',
        answer: 'Yes, Tech Wash regularly services major gated communities and apartment complexes across Puppalaguda and Golden Mile Road with slot-based doorstep pickup.',
      },
      {
        question: 'Is dry cleaning in Puppalaguda chemical-free?',
        answer: 'We use 100% non-toxic European hydrocarbon eco-solvents with zero PERC, ensuring no harsh chemical smells or fabric degradation.',
      },
      {
        question: 'What are the charges for laundry in Puppalaguda?',
        answer: 'Our rates start at ₹12 for steam ironing, ₹40 for dry cleaning, and ₹100/kg for wash & fold laundry.',
      },
      {
        question: 'Does Tech Wash serve areas near Puppalaguda?',
        answer: 'Yes, our fleet covers neighboring Narsingi, Manikonda, Khajaguda, Alkapur Township, and the Financial District.',
      },
    ],
  },
  {
    slug: 'khajaguda',
    name: 'Khajaguda',
    h1: 'Laundry & Dry Cleaning Services in Khajaguda, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Khajaguda | Tech Wash',
    metaDescription: 'Dependable laundry service and dry cleaning in Khajaguda, Hyderabad. Located near Gachibowli and IT corridors with 24-hr express doorstep collection.',
    keywords: 'laundry service in khajaguda, best laundry in khajaguda, laundry near khajaguda, dry cleaning in khajaguda, laundry pickup and delivery khajaguda, dry cleaners khajaguda junction',
    pincodes: ['500075', '500104'],
    landmarks: [
      'Khajaguda Junction',
      'Dargah Road',
      'Oakridge & DPS corridor',
      'Knowledge City periphery',
      'Khajaguda Hills Road',
    ],
    introText: 'Tech Wash serves working professionals, IT executives, and families in Khajaguda, Hyderabad. Conveniently connected to Gachibowli, Raidurg, and Knowledge City with scheduled doorstep laundry pickup, 0 PPM soft water washing, and 3D steam finishing.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Daily corporate office wear washing and steam ironing',
      'Blazers, suits, and overcoats dry cleaning',
      'Weekend family laundry bag per-kg wash and fold',
      'Sports shoes and sneaker deep cleaning',
    ],
    nearbyAreas: ['manikonda', 'nanakramguda', 'puppalaguda', 'lanco-hills', 'shaikpet'],
    faqs: [
      {
        question: 'Can I get express 24-hour laundry pickup in Khajaguda?',
        answer: 'Yes, Tech Wash provides 24-hour express turnaround for laundry and dry cleaning in Khajaguda upon request.',
      },
      {
        question: 'Do you clean bulky items like blankets and curtains in Khajaguda?',
        answer: 'Yes, we provide specialized deep dust extraction and wash for heavy blankets, comforters, and curtains.',
      },
      {
        question: 'Is laundry pickup available near Khajaguda Junction and Dargah Road?',
        answer: 'Yes, our riders cover Khajaguda Junction, Dargah Road, Oakridge school area, and Khajaguda Hills daily.',
      },
    ],
  },
  {
    slug: 'lanco-hills',
    name: 'Lanco Hills',
    h1: 'Laundry & Dry Cleaning Services in Lanco Hills, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Lanco Hills | Tech Wash',
    metaDescription: 'White-glove laundry service, couture dry cleaning, and steam pressing in Lanco Hills, Manikonda, Hyderabad. Doorstep pickup at residential towers & villas.',
    keywords: 'laundry service in lanco hills, best laundry in lanco hills, laundry near lanco hills, dry cleaning in lanco hills, laundry pickup and delivery lanco hills, dry cleaners lanco hills towers',
    pincodes: ['500089'],
    landmarks: [
      'Lanco Hills Residential Towers',
      'Lanco Hills Mega Mall area',
      'Manikonda Peak Ridge',
      'Lanco Hills Clubhouse corridor',
    ],
    introText: 'Tech Wash delivers luxury garment care and couture dry cleaning directly to the Lanco Hills mega-township in Manikonda, Hyderabad. We provide scheduled doorstep collection right from your apartment tower with digital weighing and protective breathable garment wraps.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Designer couture, bridal wear, and silk saree dry cleaning',
      '3D tension form steam pressing for crisp suits and formal wear',
      'Luxury shoe restoration and suede cleaning',
      'Scheduled weekly family laundry subscription',
    ],
    nearbyAreas: ['manikonda', 'puppalaguda', 'alkapur-township', 'khajaguda', 'shaikpet'],
    faqs: [
      {
        question: 'Do you provide doorstep pickup directly at Lanco Hills apartment towers?',
        answer: 'Yes, our pickup executives collect garments directly from your apartment doorstep in Lanco Hills towers with transparent digital scales.',
      },
      {
        question: 'Can you handle delicate silk and designer garments?',
        answer: 'Absolutely. We specialize in delicate couture, silk saree rolling, and hydrocarbon dry cleaning with zero color fading or fabric stress.',
      },
    ],
  },
  {
    slug: 'shaikpet',
    name: 'Shaikpet',
    h1: 'Laundry & Dry Cleaning Services in Shaikpet, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Shaikpet | Tech Wash',
    metaDescription: 'High-quality laundry service, dry cleaning & steam ironing in Shaikpet, Hyderabad. Demineralized RO water wash, saree care & doorstep delivery.',
    keywords: 'laundry service in shaikpet, best laundry in shaikpet, laundry near shaikpet, dry cleaning in shaikpet, laundry pickup and delivery shaikpet, dry cleaners tolichowki shaikpet',
    pincodes: ['500008'],
    landmarks: [
      'Tolichowki–Shaikpet Flyover',
      'International School Road',
      'Aditya Empress Towers area',
      'Galaxy Theatre Junction',
      'Shaikpet Nala corridor',
    ],
    introText: 'Tech Wash provides dependable laundry and dry cleaning services for families and professionals in Shaikpet, Hyderabad. From everyday clothes to heavy wedding ethnics, sherwanis, and traditional sarees, we ensure gentle fiber preservation with fast doorstep turnaround.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Traditional ethnic wear, sherwanis, and lehengas dry cleaning',
      'Cotton shirts and sarees starching and steam ironing',
      'Household laundry per-kg wash and iron packages',
      'Curtain, carpet, and bedsheet deep washing',
    ],
    nearbyAreas: ['manikonda', 'khajaguda', 'lanco-hills'],
    faqs: [
      {
        question: 'Do you offer laundry pickup service in Shaikpet and Aditya Empress area?',
        answer: 'Yes, Tech Wash provides daily doorstep pickup and delivery throughout Shaikpet, Aditya Empress Towers, and neighboring corridors.',
      },
      {
        question: 'What is your procedure for ethnic garments and lehengas in Shaikpet?',
        answer: 'We inspect embellishments, protect delicate buttons and zari, pre-spot stains with bio-enzymes, and clean with non-toxic hydrocarbon solvents.',
      },
    ],
  },
  {
    slug: 'narsingi',
    name: 'Narsingi',
    h1: 'Laundry & Dry Cleaning Services in Narsingi, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Narsingi | Tech Wash',
    metaDescription: 'Professional laundry service and dry cleaning in Narsingi, Hyderabad. RO soft water wash, steam ironing, and doorstep pickup for My Home Avatar and gated communities.',
    keywords: 'laundry service in narsingi, best laundry in narsingi, laundry near narsingi, dry cleaning in narsingi, laundry pickup and delivery narsingi, dry cleaners my home avatar',
    pincodes: ['500075'],
    landmarks: [
      'Narsingi Junction',
      'ORR Exit 18',
      'My Home Avatar corridor',
      'PBEL City Link Road',
      'Puppalaguda–Narsingi Main Road',
    ],
    introText: 'Tech Wash delivers full-spectrum garment care, per-kg laundry, and eco-safe dry cleaning across Narsingi, Hyderabad. We actively serve major gated communities near ORR Exit 18 and Puppalaguda road with reliable doorstep service and 100% demineralized RO soft water.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Weight-based wash & fold / wash & iron for families in gated communities',
      'Formal suits and blazers dry cleaning',
      'Starch & iron for crisp cotton formals and dhotis',
      'Kids clothing hygienic RO soft water wash',
      'Living room curtains and carpet washing',
    ],
    nearbyAreas: ['puppalaguda', 'manikonda', 'alkapur-township', 'nanakramguda'],
    faqs: [
      {
        question: 'Does Tech Wash provide laundry service to My Home Avatar and Narsingi societies?',
        answer: 'Yes, Tech Wash has daily scheduled pickup and delivery routes covering My Home Avatar, PBEL City link road, and all major societies in Narsingi.',
      },
      {
        question: 'How is per-kg laundry weighed in Narsingi?',
        answer: 'Our executive weighs your laundry batch at your doorstep with transparent electronic scales, recorded directly on your digital receipt.',
      },
    ],
  },
  {
    slug: 'alkapur-township',
    name: 'Alkapur Township',
    h1: 'Laundry & Dry Cleaning Services in Alkapur Township, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Alkapur Township | Tech Wash',
    metaDescription: 'Trusted laundry service, dry cleaning & steam pressing in Alkapur Township (Alkapoor), Manikonda, Hyderabad. Hygienic RO wash & doorstep pickup.',
    keywords: 'laundry service in alkapur township, best laundry in alkapur township, laundry near alkapur township, dry cleaning in alkapur township, laundry pickup and delivery alkapur township, dry cleaners alkapoor',
    pincodes: ['500089'],
    landmarks: [
      'Alkapur Road No. 1 to 35',
      'Neknampur Lake Periphery',
      'Puppalaguda Extension',
      'Alkapoor Commercial Hub',
    ],
    introText: 'Tech Wash is the trusted garment care partner for residents of Alkapur Township (Alkapoor Township), Manikonda, Hyderabad. We provide regular doorstep laundry pickup across all roads from Road No. 1 through Road No. 35 with isolated drum wash and non-toxic dry cleaning.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Family laundry wash and fold bundles',
      'Steam ironing and crease retention for office shirts',
      'Silk saree rolling, polishing, and starching',
      'Curtain, sofa cover, and bedspread washing',
    ],
    nearbyAreas: ['manikonda', 'puppalaguda', 'lanco-hills', 'narsingi'],
    faqs: [
      {
        question: 'Is doorstep pickup free in Alkapur Township?',
        answer: 'Yes, doorstep pickup is available throughout Alkapur Township with free delivery on orders above ₹299.',
      },
      {
        question: 'Do you offer starching for cotton clothes in Alkapur Township?',
        answer: 'Yes, we provide specialized Starch & Iron service with customized stiffness levels for cotton shirts, kurtas, and sarees.',
      },
    ],
  },
  {
    slug: 'nanakramguda',
    name: 'Nanakramguda',
    h1: 'Laundry & Dry Cleaning Services in Nanakramguda, Hyderabad',
    title: 'Laundry Service & Dry Cleaning in Nanakramguda Financial District | Tech Wash',
    metaDescription: 'Premier laundry service, suit dry cleaning, and 24-hr express garment care in Nanakramguda, Financial District, Hyderabad. Doorstep collection at residential towers.',
    keywords: 'laundry service in nanakramguda, best laundry in nanakramguda, laundry near nanakramguda, dry cleaning in nanakramguda, laundry pickup and delivery nanakramguda, financial district laundry',
    pincodes: ['500032', '500075'],
    landmarks: [
      'Financial District Hub',
      'WaveRock & IT Sez corridor',
      'Golf Edge Towers',
      'US Consulate Area',
      'ISB Road & Q-City area',
    ],
    introText: 'Tech Wash delivers fast, technology-driven laundry and executive dry cleaning to Nanakramguda and the Financial District in Hyderabad. Designed for busy tech professionals seeking high-standard garment care with minimal turnaround time and live WhatsApp tracking.',
    turnaround: 'Standard 48-Hour Delivery • 24-Hour Express Available',
    pickupHours: '8:00 AM – 9:00 PM (All 7 Days)',
    commonNeeds: [
      'Executive suit, blazer, and formal shirt dry cleaning',
      'Fast 24-hour turnaround for business travel wardrobes',
      'Per-kg wash & fold laundry for working bachelors and couples',
      'Sneaker cleaning and leather shoe care',
    ],
    nearbyAreas: ['khajaguda', 'puppalaguda', 'narsingi'],
    faqs: [
      {
        question: 'Do you provide express 24-hour dry cleaning in Nanakramguda Financial District?',
        answer: 'Yes, we offer express 24-hour turnaround for corporate executives and residents in Nanakramguda upon request.',
      },
      {
        question: 'How do I track my order status in Nanakramguda?',
        answer: 'You can track all 10 milestones of your laundry live on our website or via automated WhatsApp status updates.',
      },
    ],
  },
];

/**
 * 11 Genuine Tech Wash Services & Core Intent Mappings
 */
export const SEO_SERVICES = [
  // 1. Core Intent: General Laundry Service
  {
    slug: 'laundry-service',
    name: 'Laundry Service',
    h1: 'Professional Laundry Service in Hyderabad',
    title: 'Laundry Service in Hyderabad | Tech Wash',
    metaDescription: 'Professional laundry service in Hyderabad. 100% demineralized 0 PPM RO soft water washing, isolated single-customer drums, and fast scheduled doorstep pickup.',
    pricingDisplay: 'From ₹100 / Kg',
    category: 'Daily Laundry',
    processSummary: 'Demineralized 0 PPM RO soft water washing, single-customer isolated drum cycles, bio-enzyme stain removal, sensor moisture drying, and precision steam pressing.',
  },
  // 2. Core Intent: Dry Cleaning
  {
    slug: 'dry-cleaning',
    name: 'Dry Cleaning',
    h1: 'Eco-Friendly Hydrocarbon Dry Cleaning in Hyderabad',
    title: 'Premium Dry Cleaning Services in Hyderabad | Tech Wash',
    metaDescription: 'Certified 100% non-toxic European hydrocarbon dry cleaning in Hyderabad. Gentle on suits, silks, designer couture, and delicate fabrics with doorstep pickup.',
    pricingDisplay: 'Starts at ₹40 / item',
    category: 'Couture Care',
    processSummary: 'Ultrasonic stain pre-spotting, closed-loop hydrocarbon solvent bath, 3D form tension steam finishing, and archival protective packaging.',
  },
  // 3. Core Intent: Laundry Pickup & Delivery
  {
    slug: 'laundry-pickup-delivery',
    name: 'Laundry Pickup & Delivery',
    h1: 'Doorstep Laundry Pickup and Delivery in Hyderabad',
    title: 'Doorstep Laundry Pickup & Delivery in Hyderabad | Tech Wash',
    metaDescription: 'Convenient doorstep laundry pickup and delivery in Hyderabad. Timed slots from 8 AM to 9 PM, transparent electronic weighing, and 24-48h turnaround.',
    pricingDisplay: 'Free Pickup on Orders ₹299+',
    category: 'Doorstep Concierge',
    processSummary: 'Slot-based doorstep pickup, electronic weighing with digital receipt, isolated hamper transport, laboratory cleaning, and sealed return delivery.',
  },
  // 4. Steam Ironing
  {
    slug: 'ironing',
    name: 'Steam Ironing',
    h1: 'Professional 3D Form Steam Ironing in Hyderabad',
    title: 'Steam Ironing & Form Pressing in Hyderabad | Tech Wash',
    metaDescription: '3D mannequin form steam pressing in Hyderabad with vacuum table crease retention. Zero scorch, zero shine, and crisp collar alignment.',
    pricingDisplay: 'Starts at ₹12 / item',
    category: 'Finishing',
    processSummary: 'Temperature calibration, high-pressure 140°C micro-steam inflation, vacuum cold-suction crease locking, and hanger delivery.',
  },
  // 5. Starch & Iron
  {
    slug: 'starch-and-iron',
    name: 'Starch & Iron',
    h1: 'Traditional Starch & Steam Ironing in Hyderabad',
    title: 'Starch & Iron Service in Hyderabad | Tech Wash',
    metaDescription: 'Traditional natural rice and corn starching with vacuum form steam pressing for cotton shirts, sarees, dhotis, and ethnic wear in Hyderabad.',
    pricingDisplay: 'Starts at ₹25 / item',
    category: 'Finishing',
    processSummary: 'Customizable starch ratio formulation, gentle fiber infusion bath, high-pressure vacuum steam bed pressing, and crisp collar stiffening.',
  },
  // 6. Wash & Iron (Per Kg)
  {
    slug: 'wash-and-iron',
    name: 'Wash & Iron',
    h1: 'RO Soft Water Wash & Iron Laundry in Hyderabad',
    title: 'Wash & Iron Laundry Service (Per Kg) in Hyderabad | Tech Wash',
    metaDescription: '100% demineralized 0 PPM RO soft water washing with bio-enzymes followed by 3D tension steam press. Single-customer isolated wash drums.',
    pricingDisplay: 'Starts at ₹130 / Kg',
    category: 'Weight Based',
    processSummary: 'Batch weighing, single-customer drum wash in 0 PPM soft water, bio-enzyme stain removal, and steam form pressing.',
  },
  // 7. Wash & Fold (Per Kg)
  {
    slug: 'wash-and-fold',
    name: 'Wash & Fold',
    h1: 'Hygienic Wash & Fold Daily Laundry in Hyderabad',
    title: 'Wash & Fold Laundry (Per Kg) in Hyderabad | Tech Wash',
    metaDescription: 'Affordable daily laundry per kg in Hyderabad. Demineralized RO soft water batch wash, anti-static tumble dry, and store-style precision folding.',
    pricingDisplay: 'Starts at ₹100 / Kg',
    category: 'Weight Based',
    processSummary: 'Weighing, isolated drum wash with hypoallergenic bio-detergents, low-heat drying, and precision hand-folding in sealed moisture wraps.',
  },
  // 8. Saree Rolling & Traditional Care
  {
    slug: 'saree-rolling',
    name: 'Saree Rolling & Traditional Care',
    h1: 'Saree Rolling, Polishing & Traditional Care in Hyderabad',
    title: 'Saree Rolling & Polishing in Hyderabad | Tech Wash',
    metaDescription: 'Expert wooden roller saree polishing, starching, and gentle steam treatment for silk, pattu, and banarasi sarees in Hyderabad.',
    pricingDisplay: 'Custom Quote',
    category: 'Traditional',
    processSummary: 'Zari inspection, natural starch misting, smooth wooden cylinder roller pass, and wrinkle-free fold packaging.',
  },
  // 9. Shoe Washing & Sneaker Care
  {
    slug: 'shoe-washing',
    name: 'Shoe Washing & Sneaker Care',
    h1: 'Sneaker & Shoe Deep Cleaning in Hyderabad',
    title: 'Shoe Cleaning & Sneaker Laundry in Hyderabad | Tech Wash',
    metaDescription: 'Hand-scrubbed sneaker cleaning, midsole whitening, and anti-bacterial UV sterilization for sports shoes and formal leathers in Hyderabad.',
    pricingDisplay: 'Starts at ₹350 / pair',
    category: 'Footwear',
    processSummary: 'Material inspection, soft-bristle hand scrubbing, ultrasonic sole stain lift, lace restoration, and UV anti-microbial sterilization.',
  },
  // 10. Curtain Washing
  {
    slug: 'curtain-washing',
    name: 'Curtain Washing',
    h1: 'Deep Curtain & Drape Washing in Hyderabad',
    title: 'Curtain Washing & Drape Cleaning in Hyderabad | Tech Wash',
    metaDescription: 'Ultrasonic dust-mite extraction, demineralized soft wash, and vertical steam hanging for blackout drapes and sheer curtains in Hyderabad.',
    pricingDisplay: '₹30 / sq. ft.',
    category: 'Household',
    processSummary: 'Dimension verification, ultrasonic dust-mite extraction, gentle fabric wash, and vertical steam press for wrinkle-free hanging.',
  },
  // 11. Carpet Washing
  {
    slug: 'carpet-washing',
    name: 'Carpet Washing',
    h1: 'Deep Carpet & Rug Cleaning in Hyderabad',
    title: 'Carpet Cleaning & Rug Washing in Hyderabad | Tech Wash',
    metaDescription: 'Commercial-grade rotary shampoo extraction and allergen removal for living room carpets and wool rugs in Hyderabad.',
    pricingDisplay: '₹45 / sq. ft.',
    category: 'Household',
    processSummary: 'High-power dry vacuuming, rotary shampoo agitation, deep stain extraction, and anti-microbial thermal dehumidification.',
  },
];
