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
    id: 'srv-laundry',
    title: 'Laundry',
    slug: 'laundry',
    category: 'Laundry',
    pricingType: 'per kg',
    startingPrice: 79,
    shortDescription: '100% demineralized RO soft water washing with hypoallergenic bio-enzymes, zero fabric fade, and crisp fold packaging.',
    detailedDescription: 'Our signature Laundry service uses 100% demineralized Reverse Osmosis (RO) soft water combined with hypoallergenic, eco-certified bio-enzymes. Every batch is washed in dedicated, single-customer machines to guarantee absolute hygiene, color preservation, and fabric softness.',
    heroImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Inside Our RO Soft Water Laundry Facility',
    youtubeDescription: 'See how demineralized soft water and single-client batch washing keep your garments fresh and vibrant.',
    features: [
      '100% Demineralized RO soft water washing',
      'Single-customer batch washing (never mixed)',
      'Hypoallergenic eco bio-enzymes',
      'Low-heat tumble drying with anti-static conditioning',
      'Neatly folded & moisture-sealed delivery'
    ],
    benefits: [
      'Preserves fabric elasticity and natural softness',
      'Prevents graying, yellowing, and color bleed',
      'Gentle and safe for baby clothing and sensitive skin',
      'Extends the lifespan of daily essentials'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Batch Weighing & Tagging', bullets: ['Individual client barcode bag', 'Zero mix protocol'] },
      { stepNumber: '02', title: 'Demineralized RO Soft Wash', bullets: ['Filtered pure soft water', 'Eco bio-enzyme formulation'] },
      { stepNumber: '03', title: 'Low-Heat Anti-Static Tumble', bullets: ['Fabric relaxing cycle', 'Lint & dust extraction'] },
      { stepNumber: '04', title: 'Precision Fold & Seal', bullets: ['Store-ready packaging', 'Moisture-shield wrap'] }
    ],
    faqs: [
      { question: 'Do you mix my clothes with other customers?', answer: 'Never. Every single laundry load is processed individually in dedicated washers and dryers.' },
      { question: 'What detergents do you use?', answer: 'We use gentle, hypoallergenic, dermatologically-tested European bio-enzymes that are safe for both sensitive skin and delicate fabrics.' }
    ],
    status: 'published',
    featured: true,
    order: 1,
  },
  {
    id: 'srv-steam-iron',
    title: 'Steam Iron',
    slug: 'steam-iron',
    category: 'Steam Iron',
    pricingType: 'per piece',
    startingPrice: 29,
    shortDescription: '3D ergonomic tension form steam finishing preventing fabric scorch and maintaining pristine crease retention.',
    detailedDescription: 'Say goodbye to shiny scorch marks and pressed-in wrinkles. Our 3D tension steam pressing systems utilize vacuum suction tables and ergonomic form presses to reshape collars, lapels, pleats, and cuffs to pristine perfection.',
    heroImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: '3D Tension Steam Finishing Demonstration',
    youtubeDescription: 'Watch how Italian vacuum form presses deliver crisp collar alignment without heat damage.',
    features: [
      '3D Tension form steam pressing',
      'Zero heat scorch or shiny fabric marks',
      'Crisp collar & cuff shape retention',
      'Specialized pleat setting for formals & ethnics',
      'Custom hanger delivery with protective drape'
    ],
    benefits: [
      'Preserves textile elasticity and natural bounce',
      'Ensures sharp, crease-free professional look all day',
      'Protects buttons and delicate embellishments',
      'Fast doorstep turnaround'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Fabric Tension Grading', bullets: ['Temperature calibration', 'Fiber sensitivity check'] },
      { stepNumber: '02', title: '3D Form Steam Application', bullets: ['High-pressure micro steam', 'Vacuum suction cooling'] },
      { stepNumber: '03', title: 'Collar & Crease Alignment', bullets: ['Hand touch-up inspection', 'Wrinkle release check'] },
      { stepNumber: '04', title: 'Hanger Packing', bullets: ['Luxury garment hanger', 'Dust-shield cover'] }
    ],
    faqs: [
      { question: 'Will steam ironing damage delicate buttons or embroidery?', answer: 'No. Our equipment uses specialized Teflon shoes and steam diffusers to protect all buttons, sequins, and metallic embroidery.' },
      { question: 'How do you prevent shiny patches on dark formal wear?', answer: 'Our vacuum suction and diffused high-pressure steam reshape fibers without direct harsh plate heat, preventing any gloss or shine.' }
    ],
    status: 'published',
    featured: false,
    order: 2,
  },
  {
    id: 'srv-stains-remover',
    title: 'Stains Remover',
    slug: 'stains-remover',
    category: 'Stains Remover',
    pricingType: 'per piece',
    startingPrice: 99,
    shortDescription: 'Targeted ultrasonic bio-enzyme spot lifting for stubborn oil, ink, grease, wine, turmeric, and protein stains.',
    detailedDescription: 'Stubborn stains require scientific treatment, not harsh bleach. Our master spotters analyze fabric fiber composition and apply specialized bio-enzyme agents with ultrasonic cold-mist guns to dissolve ink, grease, turmeric, coffee, and wine stains without color loss.',
    heroImage: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Ultrasonic Precision Stain Removal Lab',
    youtubeDescription: 'Watch our fabric chemistry experts eliminate deep-set stains using cold bio-enzymes.',
    features: [
      'Targeted ultrasonic cold-mist stain guns',
      'Custom bio-enzyme spotting formulations',
      'Zero chlorine bleach or color-stripping agents',
      'Safe for silks, woolens, linens, and blended synthetics',
      'Pre & post optical inspection under spectrum light'
    ],
    benefits: [
      'Rescues your favorite stained clothes from being discarded',
      'Preserves fabric color vibrancy and fiber strength',
      'Removes tough Indian curry, grease, oil, and sweat stains',
      'Gentle and residue-free finish'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Spectrum Light Stain Mapping', bullets: ['Stain chemical origin test', 'Fiber safety check'] },
      { stepNumber: '02', title: 'Bio-Enzyme Application', bullets: ['Targeted micro-reagents', 'Cold emulsion dwell time'] },
      { stepNumber: '03', title: 'Ultrasonic Micro-Spotting', bullets: ['Vibrational stain breakdown', 'Zero friction or abrasive rubbing'] },
      { stepNumber: '04', title: 'Neutralizing Rinse & Dry', bullets: ['Pure demineralized rinse', 'Air-flow fiber conditioning'] }
    ],
    faqs: [
      { question: 'Can you remove old, set-in oil or turmeric stains?', answer: 'Yes. Our bio-enzymes are specifically calibrated for oil, grease, curry, and organic compounds, achieving high success rates even on aged stains.' },
      { question: 'Will stain removal cause color fading on colored shirts?', answer: 'No. We perform a color-fastness test prior to application and use zero chlorine bleach.' }
    ],
    status: 'published',
    featured: false,
    order: 3,
  },
  {
    id: 'srv-dry-cleaning',
    title: 'Dry Cleaning',
    slug: 'dry-cleaning',
    category: 'Dry Cleaning',
    pricingType: 'per piece',
    startingPrice: 149,
    shortDescription: 'Pure non-toxic hydrocarbon solvent cleansing for suits, silks, designer wear, and delicate couture fabrics.',
    detailedDescription: 'Our Dry Cleaning service utilizes European non-toxic hydrocarbon solvents instead of harsh standard PERC chemicals. Each weave is inspected for fiber integrity, pre-treated with ultrasonic micro-spotters, and finished on tension steam forms for unmatched drape, odorless cleanliness, and fabric longevity.',
    heroImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeTitle: 'Inside Our Eco-Friendly Hydrocarbon Dry Cleaning Lab',
    youtubeDescription: 'Watch our master fabric specialists handle delicate couture with zero fiber damage.',
    features: [
      '100% Non-toxic eco-hydrocarbon solvents',
      'Zero PERC chemical odor or fiber degradation',
      'Ultrasonic delicate pre-spotting',
      'Custom button & embroidery protection wraps',
      'Breathable sealed garment packaging'
    ],
    benefits: [
      'Protects expensive silk, wool, cashmere & designer fabrics',
      'Restores natural drape, feel, and vibrant colors',
      'Leaves clothes smelling completely fresh and chemical-free',
      'Substantially extends the lifespan of your wardrobe'
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
      { question: 'What is the standard turnaround time for dry cleaning?', answer: 'Standard turnaround is 48 hours. Express 24-hour delivery is also available on request.' }
    ],
    status: 'published',
    featured: true,
    order: 4,
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
      const validSlugs = ['laundry', 'steam-iron', 'stains-remover', 'dry-cleaning'];
      const isValid = cached.length === 4 && cached.every(s => validSlugs.includes(s.slug));
      const source = isValid ? cached : DEFAULT_SERVICES;
      if (!isValid && cached.length > 0) {
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
      }
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
    const slugAliases = {
      'ro-soft-water-laundry': 'laundry',
      'steam-ironing-and-form-press': 'steam-iron',
      'premium-dry-cleaning': 'dry-cleaning',
    };
    const normalizedSlug = slugAliases[slug] || slug;
    return services.find(s => s.slug === normalizedSlug || s.slug === slug || s.id === slug) || services[0] || null;
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
    const defaultCats = [
      { id: 'cat-1', name: 'Laundry', slug: 'laundry' },
      { id: 'cat-2', name: 'Steam Iron', slug: 'steam-iron' },
      { id: 'cat-3', name: 'Stains Remover', slug: 'stains-remover' },
      { id: 'cat-4', name: 'Dry Cleaning', slug: 'dry-cleaning' },
    ];

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
      const isValid = cached.length === 4 && cached.every(c => defaultCats.some(dc => dc.name === c.name));
      if (isValid) return cached;
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCats));
      return defaultCats;
    } catch (e) {
      return defaultCats;
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
