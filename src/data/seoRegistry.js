/**
 * Central SEO URL Registry for Techwash Laundry Services
 * Single source of truth for all indexable, canonical, sitemap, and metadata declarations.
 * 
 * Rules:
 * - Exactly one canonical URL per page.
 * - Preferred trailing-slash policy: NO trailing slash for subpaths, trailing slash for root domain.
 * - Explicit index/noindex declaration.
 * - Explicit sitemap eligibility.
 * - Explicit target search intent and primary keyword mapping.
 */

import { SEO_SERVICES, SEO_AREAS, BUSINESS_INFO, BASE_URL } from './seoData.js';

export { BASE_URL, BUSINESS_INFO };

/**
 * 1. Core Top-Level Website Pages
 */
export const CORE_REGISTRY_PAGES = [
  {
    path: '/',
    canonicalUrl: `${BASE_URL}/`,
    type: 'home',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Best laundry, dry cleaning & iron service in Manikonda & Hyderabad',
    title: '#1 Best Laundry, Dry Cleaning (Dry Wash) & Iron Service in Manikonda - Flat 20% Off | Techwash',
    metaDescription: 'Rated #1 Best Laundry, Dry Cleaning (Dry Wash) & Steam Iron Service in Manikonda (Near Me). Flat 20% Off + Free Doorstep Pickup in Puppalaguda, Secretariat Colony, OU Colony & Lanco Hills. 0 PPM RO water wash & eco dry cleaning.',
    h1: '#1 Best Laundry, Dry Cleaning (Dry Wash) & Iron Service in Manikonda',
    primaryKeyword: 'laundry in manikonda',
    priority: '1.0',
    changefreq: 'daily',
    publicationStatus: 'published',
  },
  {
    path: '/services',
    canonicalUrl: `${BASE_URL}/services`,
    type: 'service_hub',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Dry cleaning, laundry & steam iron services near me in Hyderabad',
    title: 'Dry Cleaning, Laundry & Steam Pressing Near Me in Hyderabad | Techwash',
    metaDescription: 'Looking for the best dry cleaning, laundry or steam ironing service near you? Techwash provides 0 PPM RO soft water wash, certified eco-friendly dry cleaning, and free doorstep pickup across Manikonda, Tolichowki & Hyderabad.',
    h1: 'Dry Cleaning, Laundry & Steam Pressing Services Near Me in Hyderabad',
    primaryKeyword: 'dry cleaning near me',
    priority: '0.9',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/areas',
    canonicalUrl: `${BASE_URL}/areas`,
    type: 'area_hub',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Laundry & dry cleaning service coverage areas in Hyderabad',
    title: 'Service Areas & Doorstep Laundry Coverage in Hyderabad | Techwash',
    metaDescription: 'Doorstep laundry, dry wash, and steam ironing service areas across Hyderabad. Daily pickup routes covering Manikonda (500089), Puppalaguda, Tolichowki, Shaikpet, Gachibowli, and Hitec City.',
    h1: 'Doorstep Laundry & Dry Cleaning Service Areas Across Hyderabad',
    primaryKeyword: 'laundry service areas hyderabad',
    priority: '0.9',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/areas/manikonda',
    canonicalUrl: `${BASE_URL}/areas/manikonda`,
    type: 'area_detail',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Best laundry, dry cleaning & iron service in Manikonda 500089',
    title: '#1 Best Laundry, Dry Cleaning & Iron Service in Manikonda (Flat 20% Off) | Techwash',
    metaDescription: 'Rated #1 Best Laundry, Eco Dry Cleaning (Dry Wash) & 3D Steam Ironing Service in Manikonda (500089). 0 PPM RO soft water wash, single-customer drums & free doorstep pickup in Puppalaguda, Secretariat Colony, OU Colony & Lanco Hills. Flat 20% Off!',
    h1: '#1 Best Laundry, Dry Cleaning (Dry Wash) & Iron Service in Manikonda',
    primaryKeyword: 'laundry in manikonda',
    priority: '1.0',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/pricing',
    canonicalUrl: `${BASE_URL}/pricing`,
    type: 'pricing',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Laundry and dry cleaning rates per kg and item price list in Manikonda',
    title: 'Transparent Laundry & Dry Cleaning Price List in Hyderabad | Techwash',
    metaDescription: 'Clear, upfront pricing for laundry, eco dry cleaning, steam ironing, shoe laundry, and saree rolling in Hyderabad. Wash & Fold from ₹100/kg, Steam Pressing from ₹12. Flat 20% Off first order.',
    h1: 'Transparent Laundry & Fabric Care Pricing in Hyderabad',
    primaryKeyword: 'laundry rates in hyderabad',
    priority: '0.9',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/how-it-works',
    canonicalUrl: `${BASE_URL}/how-it-works`,
    type: 'process',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Doorstep laundry process, 0 PPM RO soft water washing and delivery',
    title: 'How It Works: Doorstep Laundry & RO Soft Water Process | Techwash',
    metaDescription: 'Discover our 4-step doorstep laundry journey: 60-second online booking, calibrated doorstep weighing, 0 PPM RO soft water wash, single-customer isolated drums, and 24-48 hour sealed delivery.',
    h1: 'Our 4-Step Doorstep Laundry & Laboratory Care Process',
    primaryKeyword: 'how doorstep laundry works',
    priority: '0.8',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/locations',
    canonicalUrl: `${BASE_URL}/locations`,
    type: 'locations',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Physical laundry counters and drop-off points in Manikonda and Tolichowki',
    title: 'Techwash Store Locations & Walk-in Counters in Hyderabad | Techwash',
    metaDescription: 'Find Techwash physical store counters in Manikonda (Sri Ram Nagar Colony), Tolichowki / OU Colony (beside Dreamscape Hotel), and Ambience Courtyard. Open 8:00 AM to 9:00 PM all 7 days.',
    h1: 'Our Store Counters & Express Drop-off Locations in Hyderabad',
    primaryKeyword: 'laundry shop locations manikonda',
    priority: '0.8',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/offers',
    canonicalUrl: `${BASE_URL}/offers`,
    type: 'offers',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Laundry discounts, coupons, and first-order offers in Manikonda',
    title: 'Laundry & Dry Cleaning Offers: Flat 20% Off | Techwash Hyderabad',
    metaDescription: 'Explore the latest Techwash discounts: Flat 20% Off on your first order, seasonal bridal wear packages, and monthly wardrobe laundry subscription plans with free doorstep pickup.',
    h1: 'Exclusive Laundry Deals, Offers & Wardrobe Savings',
    primaryKeyword: 'laundry discounts manikonda',
    priority: '0.8',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/book-pickup',
    canonicalUrl: `${BASE_URL}/book-pickup`,
    type: 'conversion',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Schedule free doorstep laundry and dry cleaning pickup online',
    title: 'Schedule Free Doorstep Laundry Pickup in Manikonda & Hyderabad | Techwash',
    metaDescription: 'Book your doorstep laundry or dry cleaning pickup in under 60 seconds. Choose your preferred time slot between 8:00 AM and 9:00 PM. Instant WhatsApp confirmation & digital weigh receipts.',
    h1: 'Schedule Free Doorstep Laundry Pickup',
    primaryKeyword: 'book laundry pickup manikonda',
    priority: '0.9',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/track-order',
    canonicalUrl: `${BASE_URL}/track-order`,
    type: 'utility',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Live 10-stage order tracking and status lookup',
    title: 'Live Order Tracking & Status — Tech Wash Laundry Hyderabad',
    metaDescription: 'Track your laundry and dry cleaning order status in real time across 10 processing stages with Tech Wash Hyderabad.',
    h1: 'Live Garment Care & Order Status Tracker',
    primaryKeyword: 'track laundry order',
    priority: '0.8',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/blog',
    canonicalUrl: `${BASE_URL}/blog`,
    type: 'blog_hub',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Garment care, silk saree maintenance, and sneaker cleaning tips',
    title: 'Fabric Care Laboratory Blog: Tips, Guides & Textile Science | Techwash',
    metaDescription: 'Expert garment care guides from textile specialists: silk saree preservation, zero-shine steam pressing, hard water damage prevention, and white sneaker restoration.',
    h1: 'Fabric Care Laboratory Blog & Garment Care Guides',
    primaryKeyword: 'garment care tips hyderabad',
    priority: '0.8',
    changefreq: 'weekly',
    publicationStatus: 'published',
  },
  {
    path: '/about',
    canonicalUrl: `${BASE_URL}/about`,
    type: 'corporate',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'About Techwash Laundry history, technology, and quality commitment',
    title: 'About Techwash Laundry: Hyderabad’s Modern Fabric Care Laboratory',
    metaDescription: 'Learn about Techwash Laundry Services: our mission to replace abrasive chemicals with 0 PPM RO soft water and eco-friendly European hydrocarbon dry cleaning across Hyderabad.',
    h1: 'About Techwash: Precision Garment Care in Hyderabad',
    primaryKeyword: 'about techwash laundry',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/contact',
    canonicalUrl: `${BASE_URL}/contact`,
    type: 'contact',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Customer support hotline, store hours, and service email',
    title: 'Contact Techwash Laundry: Customer Support & Hotline | Hyderabad',
    metaDescription: 'Get in touch with Techwash Laundry. Call +91 63048 45567 or email care@techwashlaundry.com. Operating 8:00 AM to 9:00 PM all 7 days with dedicated customer concierge.',
    h1: 'Contact Our Garment Concierge & Support Team',
    primaryKeyword: 'techwash laundry phone number',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/faq',
    canonicalUrl: `${BASE_URL}/faq`,
    type: 'faq',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Frequently asked questions about pricing, turnaround, and water quality',
    title: 'Frequently Asked Questions: Doorstep Laundry & Dry Clean | Techwash',
    metaDescription: 'Clear answers to your laundry and dry cleaning questions: turn-around times, 0 PPM RO soft water benefits, single-customer drum hygiene, payment methods, and pickup slots.',
    h1: 'Frequently Asked Questions About Techwash Garment Care',
    primaryKeyword: 'laundry faqs manikonda',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/gallery',
    canonicalUrl: `${BASE_URL}/gallery`,
    type: 'media',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Behind the scenes photos of our garment care facility and equipment',
    title: 'Facility Tour & Quality Care Gallery | Techwash Hyderabad',
    metaDescription: 'Explore our processing lab: imported Italian tension form finishers, dedicated single-drum stainless washers, RO water filtration plant, and archival packaging stations.',
    h1: 'Inside Our Garment Care Facility: Laboratory Photo Tour',
    primaryKeyword: 'techwash laundry facility',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/privacy-policy',
    canonicalUrl: `${BASE_URL}/privacy-policy`,
    type: 'legal',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Privacy policy and personal data protection terms',
    title: 'Privacy Policy | Techwash Laundry Services Hyderabad',
    metaDescription: 'Our commitment to protecting your personal data, customer order records, and contact details in compliance with Indian IT privacy regulations.',
    h1: 'Privacy Policy',
    primaryKeyword: 'techwash privacy policy',
    priority: '0.3',
    changefreq: 'yearly',
    publicationStatus: 'published',
  },
  {
    path: '/terms-and-conditions',
    canonicalUrl: `${BASE_URL}/terms-and-conditions`,
    type: 'legal',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Terms of service, garment care liability, and service agreement',
    title: 'Terms & Conditions | Techwash Laundry Services Hyderabad',
    metaDescription: 'Terms of service, garment inspection standards, turnaround guidelines, and custody policies for Techwash Laundry Services.',
    h1: 'Terms & Conditions',
    primaryKeyword: 'techwash terms and conditions',
    priority: '0.3',
    changefreq: 'yearly',
    publicationStatus: 'published',
  },
  {
    path: '/refund-policy',
    canonicalUrl: `${BASE_URL}/refund-policy`,
    type: 'legal',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Refund, cancellation, and re-wash satisfaction guarantee policy',
    title: 'Refund & Satisfaction Policy | Techwash Laundry Hyderabad',
    metaDescription: 'Our 100% garment satisfaction commitment: complimentary re-wash within 24 hours and transparent refund policies for cancelled pickups.',
    h1: 'Refund & Re-Wash Satisfaction Policy',
    primaryKeyword: 'techwash refund policy',
    priority: '0.3',
    changefreq: 'yearly',
    publicationStatus: 'published',
  },
];

/**
 * 2. Educational & Informational Blog Articles
 */
export const BLOG_REGISTRY_ARTICLES = [
  {
    path: '/blog/why-hard-water-destroys-delicate-fabrics',
    canonicalUrl: `${BASE_URL}/blog/why-hard-water-destroys-delicate-fabrics`,
    type: 'blog_post',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'Why borewell hard water causes fabric fading and fabric stiffness in Hyderabad',
    title: 'Why Hard Water Destroys Delicate Fabrics (And How RO Water Saves Them) | Techwash',
    metaDescription: 'Learn why borewell minerals in Hyderabad turn white clothes yellow and make cotton fibers brittle, and how 0 PPM RO soft water preserves fabric life.',
    h1: 'Why Hard Water Destroys Delicate Fabrics (And How RO Water Saves Them)',
    primaryKeyword: 'hard water damage to clothes hyderabad',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/blog/the-complete-guide-to-silk-and-zari-dry-cleaning',
    canonicalUrl: `${BASE_URL}/blog/the-complete-guide-to-silk-and-zari-dry-cleaning`,
    type: 'blog_post',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'How to clean bridal silk sarees, pattu borders, and metallic zari safely',
    title: 'The Complete Guide to Silk Saree & Zari Dry Cleaning | Techwash',
    metaDescription: 'Master dry cleaner insights on caring for bridal Kanjeevaram silk sarees, avoiding PERC solvent damage, and preserving antique gold zari luster.',
    h1: 'The Essential Guide to Caring for Bridal Silk Sarees and Wedding Sherwanis',
    primaryKeyword: 'silk saree dry cleaning guide',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
  {
    path: '/blog/how-to-keep-white-sneakers-pristine',
    canonicalUrl: `${BASE_URL}/blog/how-to-keep-white-sneakers-pristine`,
    type: 'blog_post',
    indexable: true,
    sitemapEligible: true,
    targetIntent: 'How to reverse sneaker sole yellowing and protect white leather shoes',
    title: 'Sneaker Cleaning 101: Midsole De-Yellowing and Suede Protection | Techwash',
    metaDescription: 'Step-by-step science of restoring yellowed sneaker midsoles, safely cleaning suede loafers, and applying hydrophobic nano coatings without glue damage.',
    h1: 'Sneaker Cleaning 101: Midsole De-Yellowing and Suede Protection',
    primaryKeyword: 'how to clean white sneakers hyderabad',
    priority: '0.7',
    changefreq: 'monthly',
    publicationStatus: 'published',
  },
];

/**
 * 3. 11 Regional Service Detail Pages (/services/:slug)
 * Target: "Near Me" & Hyderabad Regional High-Intent Search Queries
 */
export const SERVICE_REGISTRY_PAGES = SEO_SERVICES.map((s) => ({
  path: `/services/${s.slug}`,
  canonicalUrl: `${BASE_URL}/services/${s.slug}`,
  type: 'service_detail',
  serviceSlug: s.slug,
  serviceName: s.name,
  category: s.category,
  indexable: true,
  sitemapEligible: true,
  targetIntent: `${s.name} near me in Hyderabad`,
  title: s.nearMeTitle || `#1 Best ${s.name} Near Me in Manikonda, Hyderabad (Flat 20% Off) | Techwash`,
  metaDescription: s.metaDescription,
  h1: s.h1 || `#1 Best ${s.name} Near Me in Manikonda, Hyderabad`,
  primaryKeyword: `${s.name.toLowerCase()} near me`,
  startingPrice: s.rateCard?.[0]?.rate?.match(/\d+/)?.[0] || '40',
  pricingDisplay: s.pricingDisplay,
  rateCard: s.rateCard,
  faqs: s.faqs,
  priority: '0.9',
  changefreq: 'weekly',
  publicationStatus: 'published',
}));

/**
 * 4. 11 Hyper-Local Manikonda Landing Pages (/areas/manikonda/:slug)
 * Target: "in Manikonda (500089)" Hyper-Local Search Queries
 */
export const AREA_SERVICE_REGISTRY_PAGES = SEO_SERVICES.map((s) => {
  const isPriorityLead = ['laundry-service', 'wash-and-iron', 'dry-cleaning'].includes(s.slug);
  return {
    path: `/areas/manikonda/${s.slug}`,
    canonicalUrl: `${BASE_URL}/areas/manikonda/${s.slug}`,
    type: 'area_service_detail',
    serviceSlug: s.slug,
    areaSlug: 'manikonda',
    serviceName: s.name,
    category: s.category,
    indexable: true,
    sitemapEligible: true,
    targetIntent: `${s.name} in Manikonda 500089`,
    title: s.manikondaTitle || `#1 Best ${s.name} in Manikonda, Hyderabad (500089) - Flat 20% Off | Techwash`,
    metaDescription: s.manikondaDescription || s.metaDescription,
    h1: s.manikondaH1 || `#1 Best ${s.name} in Manikonda, Hyderabad (Near Me)`,
    primaryKeyword: `${s.name.toLowerCase()} in manikonda`,
    startingPrice: s.rateCard?.[0]?.rate?.match(/\d+/)?.[0] || '40',
    pricingDisplay: s.pricingDisplay,
    rateCard: s.rateCard,
    faqs: s.manikondaFaqs || s.faqs,
    priority: isPriorityLead ? '1.0' : '0.88',
    changefreq: 'weekly',
    publicationStatus: 'published',
  };
});

/**
 * 5. Utility, Private, and Dynamic Routes (Must be NOINDEX and Excluded from Sitemap)
 */
export const UTILITY_REGISTRY_PAGES = [
  {
    path: '/admin',
    canonicalUrl: `${BASE_URL}/admin`,
    type: 'private',
    indexable: false,
    sitemapEligible: false,
    title: 'Admin Portal | Techwash Laundry',
  },
  {
    path: '/worker',
    canonicalUrl: `${BASE_URL}/worker`,
    type: 'private',
    indexable: false,
    sitemapEligible: false,
    title: 'Worker Portal | Techwash Laundry',
  },
  {
    path: '/404',
    canonicalUrl: `${BASE_URL}/404`,
    type: 'error',
    indexable: false,
    sitemapEligible: false,
    title: 'Page Not Found | Techwash Laundry',
  },
];

/**
 * Master Consolidated Registry
 */
export const MASTER_SEO_REGISTRY = [
  ...CORE_REGISTRY_PAGES,
  ...BLOG_REGISTRY_ARTICLES,
  ...SERVICE_REGISTRY_PAGES,
  ...AREA_SERVICE_REGISTRY_PAGES,
];

/**
 * Registry Helper Lookups
 */
export const getIndexableRegistryPages = () => MASTER_SEO_REGISTRY.filter((p) => p.indexable);
export const getSitemapEligiblePages = () => MASTER_SEO_REGISTRY.filter((p) => p.sitemapEligible && p.indexable);

export const getRegistryEntryByPath = (pathname) => {
  if (!pathname) return null;
  const clean = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  return MASTER_SEO_REGISTRY.find((p) => p.path === clean) || null;
};
