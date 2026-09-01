/**
 * Dynamic Services & Process Engine for Tech Wash
 * Fully CMS-driven with tabbed editor capabilities:
 * - Basic Info & SEO slug
 * - Dynamic Pricing & Units (per piece, per kg, starting at)
 * - Structured 6-Stage Process Steps (individual step title + dynamic bullet points)
 * - YouTube Video Player embed & validation
 * - Dynamic Features & Benefits
 * - Service Specific FAQs
 * - Draft / Published status
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { slugify } from '../utils/formatters.js';

const SERVICES_STORAGE_KEY = 'techwash_services_catalog';
const CATEGORIES_STORAGE_KEY = 'techwash_service_categories';

export const DEFAULT_SERVICES = [
  {
    id: 'srv-1',
    title: 'Premium Dry Cleaning',
    slug: 'premium-dry-cleaning',
    category: 'Dry Cleaning',
    pricingType: 'per piece',
    startingPrice: 129,
    shortDescription: 'Gentle hydrocarbon solvent cleansing specifically calibrated for silks, suits, and delicate designer couture.',
    detailedDescription: 'Our Premium Dry Cleaning utilizes pure, non-toxic hydrocarbon solvents instead of harsh standard PERC chemicals. Each weave is inspected for fiber integrity, pre-treated with ultrasonic micro-spotters, and finished on tension steam forms for unmatched drape and freshness.',
    heroImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Inside Our Eco-Friendly Hydrocarbon Dry Cleaning Lab',
    youtubeDescription: 'Watch our master fabric specialists handle delicate designer couture with zero fiber damage.',
    features: [
      '100% Non-toxic eco-hydrocarbon solvents',
      'Zero PERC chemical odor or fiber degradation',
      'Gentle ultrasonic stain pre-spotting',
      'Custom button & embroidery protection wraps',
      'Breathable antiseptic garment cover'
    ],
    benefits: [
      'Protects expensive silk, wool & cashmere fibers',
      'Restores vibrant colors without fading',
      'Leaves clothes smelling fresh and chemical-free',
      'Extends the lifespan of your wardrobe'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Optical Fiber Inspection', bullets: ['Stain mapping', 'Care label decoding', 'Hardware protection'] },
      { stepNumber: '02', title: 'Ultrasonic Pre-Spotting', bullets: ['Bio-enzyme spot removal', 'No mechanical scrubbing'] },
      { stepNumber: '03', title: 'Hydrocarbon Bath', bullets: ['Controlled solvent cycle', 'Gentle drum agitation'] },
      { stepNumber: '04', title: '3D Form Finishing', bullets: ['Tension steam press', 'Zero lapel shine'] },
      { stepNumber: '05', title: 'Dual QC Sign-off', bullets: ['Master inspector check', 'Barcode tracking tag'] },
      { stepNumber: '06', title: 'Sealed Express Delivery', bullets: ['Custom luxury hanger', 'Breathable sealed packaging'] }
    ],
    faqs: [
      { question: 'What makes hydrocarbon dry cleaning different from regular dry cleaning?', answer: 'Traditional dry cleaners use PERC (Perchloroethylene), which is harsh and degrades fibers over time. We use pure European hydrocarbon solvents that are gentle on fabrics, safe for the skin, and completely odorless.' },
      { question: 'What is the standard turnaround time?', answer: 'Standard turnaround is 48 hours. Express 24-hour delivery is also available on request.' }
    ],
    status: 'published',
    featured: true,
    order: 1,
  },
  {
    id: 'srv-2',
    title: 'Steam Ironing & Form Press',
    slug: 'steam-ironing-and-form-press',
    category: 'Steam Ironing',
    pricingType: 'per piece',
    startingPrice: 29,
    shortDescription: '3D tension form steam finishing preventing fabric scorch and maintaining pristine crease retention.',
    detailedDescription: 'Say goodbye to shiny scorch marks and pressed-in wrinkles. Our 3D tension steam pressing systems utilize vacuum suction tables and ergonomic form presses to reshape collars, lapels, and pleats to perfection.',
    heroImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: '3D Tension Steam Finishing Demonstration',
    youtubeDescription: 'See how our Italian vacuum form presses deliver crisp collar alignment without heat damage.',
    features: [
      '3D Tension form pressing',
      'Zero heat scorch or shiny fabric marks',
      'Crisp collar & cuff shape retention',
      'Specialized pleat setting for dresses & trousers',
      'Delivered on custom wooden/wire luxury hangers'
    ],
    benefits: [
      'Preserves textile elasticity and bounce',
      'Ensures crisp professional appearance all day',
      'Fast doorstep turnaround'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Fabric Tension Grading', bullets: ['Temperature calibration', 'Fiber sensitivity check'] },
      { stepNumber: '02', title: '3D Form Steam Application', bullets: ['Gentle high-pressure steam', 'Vacuum cooling cycle'] },
      { stepNumber: '03', title: 'Crease & Collar Alignment', bullets: ['Hand touch-up inspection', 'Wrinkle release verification'] },
      { stepNumber: '04', title: 'Hanger Packing', bullets: ['Custom garment clips', 'Protective dust drape'] }
    ],
    faqs: [
      { question: 'Will steam ironing damage delicate buttons or embroidery?', answer: 'No. Our equipment uses specialized Teflon shoes and steam diffusers to protect all buttons, sequins, and metallic embroidery.' }
    ],
    status: 'published',
    featured: true,
    order: 2,
  },
  {
    id: 'srv-3',
    title: 'RO Soft Water Laundry',
    slug: 'ro-soft-water-laundry',
    category: 'Laundry',
    pricingType: 'per kg',
    startingPrice: 79,
    shortDescription: '100% demineralized RO water washing preserving textile softness and zero chemical color fade.',
    detailedDescription: 'Hard tap water deposits minerals into your clothes, making them stiff, faded, and scratchy. Tech Wash washes 100% of daily laundry in multi-stage demineralized Reverse Osmosis (RO) soft water combined with hypoallergenic bio-detergents.',
    heroImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Why Soft Water Makes All The Difference',
    youtubeDescription: 'A deep dive into our industrial RO filtration plant and single-customer batch washing.',
    features: [
      '100% Demineralized RO soft water washing',
      'Single customer batch washing (never mixed)',
      'Hypoallergenic eco bio-enzymes',
      'Anti-static soft dryer conditioning',
      'Neatly folded or hanger delivered'
    ],
    benefits: [
      'Maintains original fabric softness and breathability',
      'Eliminates color fading and graying',
      'Safe for baby clothes and sensitive skin'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Customer Batch Weighing', bullets: ['Individual bag tagging', 'Zero mixing protocol'] },
      { stepNumber: '02', title: 'Demineralized RO Wash', bullets: ['Pure soft water cycle', 'Hypoallergenic detergent'] },
      { stepNumber: '03', title: 'Low-Heat Tumble Conditioning', bullets: ['Fabric relaxing cycle', 'Anti-static softening'] },
      { stepNumber: '04', title: 'Crisp Fold & Pack', bullets: ['Store-ready folding', 'Moisture-sealed bundles'] }
    ],
    faqs: [
      { question: 'Do you mix my clothes with other customers clothes?', answer: 'Never. We strictly follow a single-client wash batch policy. Your clothes are processed in dedicated machines from start to finish.' }
    ],
    status: 'published',
    featured: true,
    order: 3,
  },
  {
    id: 'srv-4',
    title: 'Saree Rolling & Polish',
    slug: 'saree-rolling-and-polish',
    category: 'Couture',
    pricingType: 'per piece',
    startingPrice: 199,
    shortDescription: 'Traditional roll-press and gold zari brightening preserving the natural luster of bridal and heritage sarees.',
    detailedDescription: 'Handloom Kanjeevarams, Banarasis, and Chiffons require specialized roll-press calibration. Our master saree craftsmen polish and calender delicate weaves to restore their natural sheen without flattening gold zari work.',
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Traditional Handloom Saree Polishing & Care',
    youtubeDescription: 'Restoring the sheen of heirloom bridal sarees with specialized wooden rollers.',
    features: [
      'Authentic roller calendar press',
      'Gold & silver zari luster brightening',
      'Gentle natural gum/starch conditioning',
      'Acid-free tissue paper layered folding',
      'Specialized saree preservation hanger pack'
    ],
    benefits: [
      'Removes stubborn fold creases safely',
      'Restores the crisp fall and natural sheen',
      'Prevents zari tarnishing and fiber breakage'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Zari & Fabric Inspection', bullets: ['Tear check', 'Stain identification'] },
      { stepNumber: '02', title: 'Conditioning Mist', bullets: ['Natural luster treatment', 'Starch calibration'] },
      { stepNumber: '03', title: 'Tension Roller Press', bullets: ['Smooth wooden roller calender', 'Zero crease marks'] },
      { stepNumber: '04', title: 'Archival Folding', bullets: ['Acid-free tissue paper wrap', 'Breathable storage bag'] }
    ],
    faqs: [
      { question: 'Is roll polish safe for delicate georgette and chiffon sarees?', answer: 'Yes. We adjust the roller tension and temperature specifically for chiffon, organza, and tissue silk.' }
    ],
    status: 'published',
    featured: false,
    order: 4,
  },
  {
    id: 'srv-5',
    title: 'Designer Footwear & Leather Spa',
    slug: 'shoe-spa-and-leather-care',
    category: 'Footwear',
    pricingType: 'per pair',
    startingPrice: 249,
    shortDescription: 'Deep ultrasonic and microbial cleaning for designer sneakers, suede boots, and leather accessories.',
    detailedDescription: 'Treat your luxury sneakers, suede boots, and leather shoes to an exhaustive medical-grade spa. We deep clean midsoles, condition leather uppers, brush suede nap, and deodorize using medical ozone chambers.',
    heroImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Designer Sneaker Deep Ultrasonic Restoration',
    youtubeDescription: 'Watch our shoe care specialists restore stained white soles and revitalise delicate suede.',
    features: [
      'Ultrasonic midsole stain lifting',
      'Delicate suede brush & color revival',
      'Leather deep conditioning with natural waxes',
      'Medical ozone anti-bacterial deodorization',
      'Water & stain repellent nano protective coating'
    ],
    benefits: [
      'Restores footwear to showroom condition',
      'Eliminates 99.9% of odor-causing bacteria',
      'Protects leather from cracking and moisture damage'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Material Evaluation', bullets: ['Sole & upper analysis', 'Lace & insole extraction'] },
      { stepNumber: '02', title: 'Ultrasonic Foaming Clean', bullets: ['Midsole grime removal', 'Deep fiber cleanse'] },
      { stepNumber: '03', title: 'Conditioning & Buffing', bullets: ['Suede nap revival', 'Leather beeswax polish'] },
      { stepNumber: '04', title: 'Ozone Deodorization', bullets: ['Medical chamber sanitization', 'Nano shield coat'] }
    ],
    faqs: [
      { question: 'Do you clean both sneakers and formal leather shoes?', answer: 'Yes. We cater to designer sneakers (Yeezy, Jordan, Gucci), formal leather oxfords, suede loafers, and boots.' }
    ],
    status: 'published',
    featured: false,
    order: 5,
  },
  {
    id: 'srv-6',
    title: 'Curtain & Home Furnishing Spa',
    slug: 'curtain-and-upholstery-care',
    category: 'Home Care',
    pricingType: 'per panel',
    startingPrice: 149,
    shortDescription: 'Deep dust extraction, pleat retention steaming, and anti-allergen sanitization for draperies & curtains.',
    detailedDescription: 'Draperies and curtains trap immense amounts of dust mites and urban pollutants. Our specialized process extracts deep seated dust, gently dry cleans or soft washes the panels, and vertical steam presses them to restore crisp header pleats.',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Curtain & Upholstery Deep Cleaning Care',
    youtubeDescription: 'Step-by-step drapery sanitization and high-pressure vertical pleat steaming.',
    features: [
      'Deep high-velocity dust extraction',
      'Zero shrinkage hydro-cleaning cycle',
      'Vertical pleat retention steam pressing',
      'Anti-allergen and dust mite sanitization',
      'Free pickup and re-hanging consultation'
    ],
    benefits: [
      'Eliminates indoor dust and allergens',
      'Restores vibrant room ambiance',
      'Prevents fabric fiber sun rot'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Panel Dimension Measurement', bullets: ['Fabric composition check', 'Lining inspection'] },
      { stepNumber: '02', title: 'Dust Extraction', bullets: ['High-vacuum allergen removal'] },
      { stepNumber: '03', title: 'Gentle Wash / Cleanse', bullets: ['Non-shrink formulation'] },
      { stepNumber: '04', title: 'Vertical Pleat Steaming', bullets: ['Original drop and pleat retention'] }
    ],
    faqs: [
      { question: 'Will my curtains shrink after cleaning?', answer: 'No. We measure all panels prior to treatment and utilize non-shrink hydrocarbon or controlled low-temperature cycles.' }
    ],
    status: 'published',
    featured: false,
    order: 6,
  },
  {
    id: 'srv-7',
    title: 'Bridal & Heritage Lehenga Preservation',
    slug: 'bridal-lehenga-preservation',
    category: 'Couture',
    pricingType: 'per outfit',
    startingPrice: 599,
    shortDescription: 'Master hand-cleaning for heavily embroidered bridal lehengas, sherwanis, and heirloom wedding attire.',
    detailedDescription: 'Your wedding attire holds lifetime memories. Our master couture team inspects every bead, crystal, and zari stitch, using targeted micro-solvents that preserve delicate embellishments without discoloration.',
    heroImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Bridal Couture Preservation Protocol',
    youtubeDescription: 'Hand-spotting intricate Swarovski crystals and gold zari work on heavy bridal lehengas.',
    features: [
      'Individual crystal & stone netting protection',
      'Bio-solvent stain lifting for makeup & food spills',
      '3D Air-flow gentle drying',
      'Archival acid-free luxury storage box packaging',
      'Insured custody throughout transit'
    ],
    benefits: [
      'Preserves heirloom wedding attire for generations',
      'Prevents metal oxidation and yellowing',
      'Ready for safe long-term wardrobe storage'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Master Embroiderer Inspection', bullets: ['Loose stone tagging', 'Stain zoning'] },
      { stepNumber: '02', title: 'Targeted Micro-Spotting', bullets: ['Hand spotting with non-bleaching solvents'] },
      { stepNumber: '03', title: 'Gentle Hydro Extraction', bullets: ['Zero friction agitation'] },
      { stepNumber: '04', title: 'Archival Box Packaging', bullets: ['Acid-free tissue buffering', 'Luxury window box'] }
    ],
    faqs: [
      { question: 'How is heavy bridal wear packed after dry cleaning?', answer: 'We package bridal wear in custom archival acid-free boxes layered with protective tissue paper to prevent oxidation and moisture buildup.' }
    ],
    status: 'published',
    featured: false,
    order: 7,
  },
  {
    id: 'srv-8',
    title: 'Leather & Suede Jacket Care',
    slug: 'leather-jacket-restoration',
    category: 'Leather Care',
    pricingType: 'per piece',
    startingPrice: 499,
    shortDescription: 'Deep moisture replenishment, natural dye revitalization, and water-resistant conditioning for pure leather.',
    detailedDescription: 'Real leather and suede jackets require essential oil replenishment to avoid drying, cracking, or color loss. We gently cleanse the hide, restore rich natural pigments, and condition with organic botanical waxes.',
    heroImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Pure Leather Jacket Restoration & Wax Conditioning',
    youtubeDescription: 'Step-by-step restoration of supple leather texture and water-resistant coating.',
    features: [
      'Gentle soil extraction without drying oils',
      'Natural pigment revitalization',
      'Deep organic wax & oil conditioning',
      'Suede nap re-texturing',
      'Water & stain resistant shield finish'
    ],
    benefits: [
      'Restores buttery soft leather suppleness',
      'Prevents leather peel, stiffness, and cracking',
      'Guarantees years of additional wardrobe life'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Leather Grading', bullets: ['Hide type analysis', 'Lining check'] },
      { stepNumber: '02', title: 'Surface Cleansing', bullets: ['Gentle solvent sponge extraction'] },
      { stepNumber: '03', title: 'Conditioning Oil Treatment', bullets: ['Deep moisture massage', 'Buffing'] },
      { stepNumber: '04', title: 'Weather Shield Coat', bullets: ['Hydrophobic nano protection'] }
    ],
    faqs: [
      { question: 'Can you fix stiff or dried-out leather jackets?', answer: 'Yes. Our conditioning treatment deeply penetrates the leather pores to restore flexibility, softness, and rich color.' }
    ],
    status: 'published',
    featured: false,
    order: 8,
  }
];

export const serviceService = {
  /**
   * Fetch all services (Optionally filter only published for public portal)
   */
  async getServices({ publishedOnly = false } = {}) {
    if (isFirebaseConfigured && db) {
      try {
        let q = collection(db, 'services');
        if (publishedOnly) {
          q = query(collection(db, 'services'), where('status', '==', 'published'));
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          return list.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      } catch (e) {
        console.warn("Firestore services read error, reading local cache:", e);
      }
    }

    try {
      const cached = JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY) || '[]');
      const source = cached.length > 0 ? cached : DEFAULT_SERVICES;
      const filtered = publishedOnly ? source.filter(s => s.status === 'published') : source;
      return filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  },

  /**
   * Get single service by Slug or ID
   */
  async getServiceBySlug(slug) {
    const services = await this.getServices({ publishedOnly: false });
    return services.find(s => s.slug === slug || s.id === slug) || null;
  },

  /**
   * Create or Update Service
   */
  async saveService(serviceData) {
    const serviceId = serviceData.id || `srv-${Date.now()}`;
    const slug = serviceData.slug || slugify(serviceData.title);
    
    const payload = {
      ...serviceData,
      id: serviceId,
      slug,
      title: serviceData.title || 'Untitled Service',
      shortDescription: serviceData.shortDescription || '',
      detailedDescription: serviceData.detailedDescription || '',
      category: serviceData.category || 'General Care',
      pricingType: serviceData.pricingType || 'per piece',
      startingPrice: Number(serviceData.startingPrice || 0),
      heroImage: serviceData.heroImage || '',
      mobileImage: serviceData.mobileImage || serviceData.heroImage || '',
      galleryImages: serviceData.galleryImages || [],
      youtubeUrl: serviceData.youtubeUrl || '',
      youtubeTitle: serviceData.youtubeTitle || '',
      youtubeDescription: serviceData.youtubeDescription || '',
      features: serviceData.features || [],
      benefits: serviceData.benefits || [],
      processSteps: serviceData.processSteps || [],
      faqs: serviceData.faqs || [],
      status: serviceData.status || 'published', // 'draft' | 'published' | 'archived'
      featured: !!serviceData.featured,
      order: Number(serviceData.order || 0),
      seoTitle: serviceData.seoTitle || `${serviceData.title} | Tech Wash`,
      seoDescription: serviceData.seoDescription || serviceData.shortDescription || '',
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'services', serviceId), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore service save error:", e);
      }
    }

    const cached = await this.getServices({ publishedOnly: false });
    const idx = cached.findIndex(s => s.id === serviceId);
    if (idx >= 0) {
      cached[idx] = payload;
    } else {
      cached.push(payload);
    }
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(cached));
    return payload;
  },

  /**
   * Delete Service
   */
  async deleteService(serviceId) {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
      } catch (e) {
        console.warn("Firestore delete service error:", e);
      }
    }

    const cached = (await this.getServices({ publishedOnly: false })).filter(s => s.id !== serviceId);
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(cached));
    return true;
  },

  /**
   * Fetch categories
   */
  async getCategories() {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'serviceCategories'));
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        console.warn("Firestore categories read error:", e);
      }
    }

    try {
      const cached = JSON.parse(localStorage.getItem(CATEGORIES_STORAGE_KEY) || '[]');
      if (cached.length > 0) return cached;
      const cats = Array.from(new Set(DEFAULT_SERVICES.map(s => s.category))).map((c, i) => ({
        id: `cat-${i+1}`,
        name: c,
        slug: slugify(c)
      }));
      return cats;
    } catch (e) {
      return [];
    }
  },

  /**
   * Save Categories
   */
  async saveCategory(catData) {
    const catId = catData.id || `cat-${Date.now()}`;
    const payload = { ...catData, id: catId, slug: slugify(catData.name) };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'serviceCategories', catId), payload, { merge: true });
      } catch (e) {
        console.warn("Firestore save category error:", e);
      }
    }

    const list = await this.getCategories();
    const idx = list.findIndex(c => c.id === catId);
    if (idx >= 0) list[idx] = payload;
    else list.push(payload);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(list));
    return payload;
  }
};
