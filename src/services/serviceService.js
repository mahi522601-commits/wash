/**
 * Tech Wash Centralized Dynamic Services Engine (Firebase Firestore Single Source of Truth)
 * Maps all 8 specialized services directly with Firestore collection `services`
 */
import { db, isFirebaseConfigured } from './firebase.js';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { slugify } from '../utils/formatters.js';

const SERVICES_STORAGE_KEY = 'techwash_services_catalog_v3';
const CATEGORIES_STORAGE_KEY = 'techwash_service_categories_v3';

export const DEFAULT_SERVICES = [
  {
    id: 'srv-dry-cleaning',
    title: 'Dry Cleaning',
    name: 'Dry Cleaning',
    slug: 'dry-cleaning',
    category: 'Apparel Care',
    pricingType: 'per_item',
    startingPrice: 40,
    startingPriceDisplay: 'Starts at ₹40',
    emoji: '🧺',
    icon: '🧺',
    shortDescription: 'Pure non-toxic hydrocarbon solvent cleansing for suits, silks, designer wear, and delicate couture fabrics.',
    detailedDescription: 'Our Dry Cleaning service utilizes European non-toxic hydrocarbon solvents instead of harsh PERC chemicals. Each weave is inspected for fiber integrity, pre-treated with ultrasonic micro-spotters, and finished on tension steam forms for unmatched drape, odorless cleanliness, and fabric longevity.',
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
      { stepNumber: '04', title: '3D Form Finishing', bullets: ['Tension steam press', 'Zero lapel shine'] }
    ],
    faqs: [
      { question: 'What makes hydrocarbon dry cleaning different from regular dry cleaning?', answer: 'Traditional dry cleaners use PERC (Perchloroethylene), which is harsh and degrades fibers over time. We use pure European hydrocarbon solvents that are gentle on fabrics, safe for the skin, and completely odorless.' },
      { question: 'What is the standard turnaround time for dry cleaning?', answer: 'Standard turnaround is 48 hours. Express 24-hour delivery is also available on request.' }
    ],
    status: 'published',
    active: true,
    featured: true,
    displayOrder: 1,
    order: 1,
  },
  {
    id: 'srv-ironing',
    title: 'Ironing',
    name: 'Ironing',
    slug: 'ironing',
    category: 'Finishing',
    pricingType: 'per_item',
    startingPrice: 12,
    startingPriceDisplay: 'Starts at ₹12',
    emoji: '👔',
    icon: '👔',
    shortDescription: '3D mannequin form pressing and vacuum table crease retention with zero shine or heat scorch.',
    detailedDescription: 'Say goodbye to shiny scorch marks and pressed-in wrinkles. Our 3D tension steam pressing systems utilize vacuum suction tables and ergonomic form presses to reshape collars, lapels, pleats, and cuffs to pristine perfection.',
    heroImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=600&q=80',
    features: [
      '3D Tension form steam pressing',
      'Zero heat scorch or shiny fabric marks',
      'Crisp collar & cuff shape retention',
      'Specialized pleat setting for formals & ethnics'
    ],
    benefits: [
      'Preserves textile elasticity and natural bounce',
      'Ensures sharp, crease-free professional look all day',
      'Protects buttons and delicate embellishments'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Fabric Tension Grading', bullets: ['Temperature calibration', 'Fiber sensitivity check'] },
      { stepNumber: '02', title: '3D Form Steam Application', bullets: ['High-pressure micro steam', 'Vacuum suction cooling'] },
      { stepNumber: '03', title: 'Collar & Crease Alignment', bullets: ['Hand touch-up inspection', 'Wrinkle release check'] }
    ],
    status: 'published',
    active: true,
    featured: true,
    displayOrder: 2,
    order: 2,
  },
  {
    id: 'srv-wash-and-iron',
    title: 'Wash & Iron',
    name: 'Wash & Iron',
    slug: 'wash-and-iron',
    category: 'Weight Based',
    pricingType: 'per_kg',
    startingPrice: 130,
    startingPriceDisplay: 'Starts at ₹130 / Kg',
    emoji: '🫧',
    icon: '🫧',
    shortDescription: '100% demineralized RO softened water wash with bio-detergents followed by crisp steam iron pressing.',
    detailedDescription: 'Our signature Wash & Iron service combines 100% demineralized Reverse Osmosis softened water and bio-detergents with single-customer batch washing, followed by 3D tension steam pressing.',
    heroImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
    features: [
      '100% Demineralized RO soft water washing',
      'Single-customer isolated wash drums',
      'Bio-enzyme hypoallergenic formula',
      '3D tension form steam pressing finish'
    ],
    benefits: [
      'Preserves fabric color and softness',
      'Hygienic and safe for baby clothing',
      'Ready to wear directly from the pack'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Batch Weighing & Tagging', bullets: ['Single customer drum isolation', 'Weight verification'] },
      { stepNumber: '02', title: 'RO Soft Water Wash', bullets: ['Filtered demineralized water', 'Bio-enzyme agents'] },
      { stepNumber: '03', title: 'Steam Form Press', bullets: ['Crisp collar pressing', 'Crease retention'] }
    ],
    status: 'published',
    active: true,
    featured: true,
    displayOrder: 3,
    order: 3,
  },
  {
    id: 'srv-wash-and-fold',
    title: 'Wash & Fold',
    name: 'Wash & Fold',
    slug: 'wash-and-fold',
    category: 'Weight Based',
    pricingType: 'per_kg',
    startingPrice: 100,
    startingPriceDisplay: 'Starts at ₹100 / Kg',
    emoji: '👕',
    icon: '👕',
    shortDescription: 'Freshly washed with RO soft water, moisture-controlled drying, and neat hand-folding.',
    detailedDescription: 'Daily laundry made effortless. Isolated drum wash in pure RO soft water, low-heat tumble drying, and store-style precision folding sealed in moisture-barrier packs.',
    heroImage: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
    features: [
      'RO soft water batch washing',
      'Low-heat anti-static drying',
      'Precision store-ready folding',
      'Moisture-shield delivery wrap'
    ],
    benefits: [
      'Fast, reliable daily laundry solution',
      'Gentle on daily cottons, casuals, and linens',
      'Saves hours of weekend laundry effort'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Weighing & Sorting', bullets: ['Color classification', 'Dedicated drum batch'] },
      { stepNumber: '02', title: 'Hygienic Soft Wash', bullets: ['Eco bio-detergent', 'Fabric relaxing rinse'] },
      { stepNumber: '03', title: 'Precision Hand Fold', bullets: ['Store-style folding', 'Moisture-barrier seal'] }
    ],
    status: 'published',
    active: true,
    featured: true,
    displayOrder: 4,
    order: 4,
  },
  {
    id: 'srv-saree-rolling',
    title: 'Saree Rolling',
    name: 'Saree Rolling',
    slug: 'saree-rolling',
    category: 'Traditional',
    pricingType: 'custom',
    startingPrice: null,
    startingPriceDisplay: 'Price to be confirmed',
    emoji: '🥻',
    icon: '🥻',
    shortDescription: 'Careful traditional starching, gentle polishing, and wooden roller finishing for silk and pattu sarees.',
    detailedDescription: 'Preserve the rich sheen and crisp drape of your heirloom pattu, banarasi, and silk sarees with our specialized wooden roller polishing and starching techniques.',
    heroImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    features: [
      'Traditional wooden cylinder rolling',
      'Natural starching & fiber polishing',
      'Zari & gold border protection',
      'Wrinkle-free drape retention'
    ],
    benefits: [
      'Protects expensive bridal & festival silk sarees',
      'Restores authentic handloom luster',
      'Zero heat damage or fabric weakening'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Zari & Fabric Inspection', bullets: ['Weave integrity check', 'Starch balance planning'] },
      { stepNumber: '02', title: 'Gentle Starch & Steam', bullets: ['Even starch misting', 'Controlled tension'] },
      { stepNumber: '03', title: 'Wooden Roller Finishing', bullets: ['Polishing cylinder pass', 'Wrinkle elimination'] }
    ],
    status: 'published',
    active: true,
    featured: false,
    displayOrder: 5,
    order: 5,
  },
  {
    id: 'srv-curtain-washing',
    title: 'Curtain Washing',
    name: 'Curtain Washing',
    slug: 'curtain-washing',
    category: 'Household',
    pricingType: 'per_sqft',
    startingPrice: 30,
    startingPriceDisplay: '₹30 / sq. ft.',
    emoji: '🪟',
    icon: '🪟',
    shortDescription: 'Deep dust extraction, gentle washing, and wrinkle-free steam hanging for all curtain sizes.',
    detailedDescription: 'Curtains trap dust mites, allergens, and airborne pollutants. Our ultrasonic extraction and demineralized soft wash restore fresh air and vibrancy to blackout drapes, sheers, and heavy jacquard curtains.',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    features: [
      'Deep dust-mite ultrasonic extraction',
      'Gentle wash for sheers & blackouts',
      'Wrinkle-free steam hanging finish',
      'Dimensional area based transparent pricing'
    ],
    benefits: [
      'Improves indoor home air quality',
      'Removes deep fabric odors and grime',
      'Ready to hang without wrinkling'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Dimension Verification', bullets: ['Sq. ft. measurement', 'Fabric classification'] },
      { stepNumber: '02', title: 'Dust Extraction & Wash', bullets: ['High-vacuum dust lift', 'Demineralized soft wash'] },
      { stepNumber: '03', title: 'Vertical Steam Press', bullets: ['Crease-free steaming', 'Sealed drape packaging'] }
    ],
    status: 'published',
    active: true,
    featured: false,
    displayOrder: 6,
    order: 6,
  },
  {
    id: 'srv-shoe-washing',
    title: 'Shoe Washing',
    name: 'Shoe Washing',
    slug: 'shoe-washing',
    category: 'Footwear',
    pricingType: 'per_pair',
    startingPrice: 350,
    startingPriceDisplay: '₹350 / pair',
    emoji: '👟',
    icon: '👟',
    shortDescription: 'Hand-scrubbed midsole whitening, antiseptic deodorization, and suede/leather restoration.',
    detailedDescription: 'Give your favorite sneakers, running shoes, and formal leathers a brand-new revival. Multi-step hand scrubbing, ultrasonic sole whitening, and anti-microbial UV sterilization.',
    heroImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
    features: [
      'Hand-crafted midsole whitening',
      'Upper mesh, suede & leather deep scrub',
      'Antiseptic & anti-fungal deodorization',
      'Lace cleaning & reshaping'
    ],
    benefits: [
      'Restores sneaker and formal shoe look',
      'Eliminates bacterial odors permanently',
      'Maintains leather texture and longevity'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Inspection & Dry Dusting', bullets: ['Material grading', 'Deep sole dirt lift'] },
      { stepNumber: '02', title: 'Hand Shampooing', bullets: ['Soft-bristle brush scrub', 'Foam stain lift'] },
      { stepNumber: '03', title: 'UV Sterilization & Pack', bullets: ['Bacterial neutralization', 'Shape retaining pack'] }
    ],
    status: 'published',
    active: true,
    featured: false,
    displayOrder: 7,
    order: 7,
  },
  {
    id: 'srv-carpet-washing',
    title: 'Carpet Washing',
    name: 'Carpet Washing',
    slug: 'carpet-washing',
    category: 'Household',
    pricingType: 'per_sqft',
    startingPrice: 45,
    startingPriceDisplay: '₹45 / sq. ft.',
    emoji: '🧶',
    icon: '🧶',
    shortDescription: 'Deep foam & dust-mite extraction, rotary shampoo cleaning, and anti-microbial drying for rugs.',
    detailedDescription: 'Commercial-grade deep extraction rotary shampoo washing for living room carpets, wool rugs, and entry mats to remove deep-seated stains, allergens, and pet odors.',
    heroImage: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    features: [
      'High-power rotary shampoo extraction',
      'Deep dust-mite & allergen removal',
      'Anti-microbial quick-drying room cycle',
      'Stain protection fiber conditioning'
    ],
    benefits: [
      'Rejuvenates carpet fiber texture & colors',
      'Removes tough stains and trapped allergens',
      'Fresh and completely odor-free home'
    ],
    processSteps: [
      { stepNumber: '01', title: 'Vacuum & Area Sizing', bullets: ['Length × Width measurement', 'Pre-inspection'] },
      { stepNumber: '02', title: 'Rotary Shampoo Clean', bullets: ['Deep fiber agitation', 'Water extraction'] },
      { stepNumber: '03', title: 'Thermal Dehumidification', bullets: ['Moisture extraction', 'Anti-static conditioning'] }
    ],
    status: 'published',
    active: true,
    featured: false,
    displayOrder: 8,
    order: 8,
  }
];

export const serviceService = {
  /**
   * Fetch all services from Firestore `services` collection
   * Guarantees all 8 official services are present and merges any missing default services into Firestore.
   */
  async getServices({ publishedOnly = false } = {}) {
    let list = [];
    let fetchedFromFirestore = false;

    if (isFirebaseConfigured && db) {
      try {
        const q = collection(db, 'services');
        const snap = await getDocs(q);
        if (!snap.empty) {
          list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          fetchedFromFirestore = true;
        }
      } catch (e) {
        console.warn("Firestore services read error, checking defaults & cache:", e?.message || e);
      }
    }

    // Merge missing default services so all 8 official services ALWAYS exist
    const existingIdsAndSlugs = new Set([
      ...list.map(s => s.id),
      ...list.map(s => s.slug),
    ].filter(Boolean));

    const missingDefaults = DEFAULT_SERVICES.filter(
      def => !existingIdsAndSlugs.has(def.id) && !existingIdsAndSlugs.has(def.slug)
    );

    if (missingDefaults.length > 0) {
      list = [...list, ...missingDefaults];
      // Seed missing services to Firestore in background
      if (isFirebaseConfigured && db) {
        Promise.all(
          missingDefaults.map(srv => setDoc(doc(db, 'services', srv.id), srv, { merge: true }))
        ).catch(err => console.warn("Background service seed error:", err));
      }
    }

    // Fallback if list is empty
    if (list.length === 0) {
      try {
        const cached = JSON.parse(localStorage.getItem(SERVICES_STORAGE_KEY) || '[]');
        list = (cached && Array.isArray(cached) && cached.length >= 8) ? cached : DEFAULT_SERVICES;
      } catch (e) {
        list = DEFAULT_SERVICES;
      }
    }

    // Always update localStorage cache with full catalog
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    // Filter published only if requested
    let result = list;
    if (publishedOnly) {
      result = list.filter(s => s.active !== false && s.status !== 'archived' && s.status !== 'draft');
      if (result.length === 0) {
        result = DEFAULT_SERVICES.filter(s => s.active !== false);
      }
    }

    return result.sort((a, b) => (Number(a.displayOrder || a.order || 0) - Number(b.displayOrder || b.order || 0)));
  },

  /**
   * Reset / Seed all 8 standard services into Firestore & cache
   */
  async seedAllDefaultServices() {
    if (isFirebaseConfigured && db) {
      try {
        await Promise.all(
          DEFAULT_SERVICES.map(srv => setDoc(doc(db, 'services', srv.id), srv, { merge: true }))
        );
      } catch (e) {
        console.warn("Error seeding services to Firestore:", e);
      }
    }
    try {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
    } catch (e) {}
    return DEFAULT_SERVICES;
  },

  /**
   * Get single service by Slug or ID
   */
  async getServiceBySlug(slug) {
    const services = await this.getServices({ publishedOnly: false });
    const slugAliases = {
      'ro-soft-water-laundry': 'wash-and-iron',
      'steam-ironing-and-form-press': 'ironing',
      'premium-dry-cleaning': 'dry-cleaning',
      'laundry': 'wash-and-iron',
      'steam-iron': 'ironing',
      'stains-remover': 'dry-cleaning'
    };
    const normalizedSlug = slugAliases[slug] || slug;
    return services.find(s => s.slug === normalizedSlug || s.slug === slug || s.id === slug) || services[0] || null;
  },

  /**
   * Create or Update Service in Firestore `services/{serviceId}`
   */
  async saveService(serviceData) {
    const serviceId = serviceData.id || `srv-${Date.now()}`;
    const slug = serviceData.slug || slugify(serviceData.title || serviceData.name || 'service');
    
    const payload = {
      ...serviceData,
      id: serviceId,
      slug,
      title: serviceData.title || serviceData.name || 'Untitled Service',
      name: serviceData.name || serviceData.title || 'Untitled Service',
      shortDescription: serviceData.shortDescription || '',
      detailedDescription: serviceData.detailedDescription || '',
      category: serviceData.category || 'Garment Care',
      pricingType: serviceData.pricingType || 'per_item',
      startingPrice: serviceData.startingPrice !== null ? Number(serviceData.startingPrice || 0) : null,
      startingPriceDisplay: serviceData.startingPriceDisplay || (serviceData.startingPrice ? `Starts at ₹${serviceData.startingPrice}` : 'Price to be confirmed'),
      emoji: serviceData.emoji || serviceData.icon || '🧺',
      icon: serviceData.icon || serviceData.emoji || '🧺',
      heroImage: serviceData.heroImage || '',
      mobileImage: serviceData.mobileImage || serviceData.heroImage || '',
      features: serviceData.features || [],
      benefits: serviceData.benefits || [],
      processSteps: serviceData.processSteps || [],
      faqs: serviceData.faqs || [],
      active: serviceData.active !== undefined ? !!serviceData.active : true,
      status: serviceData.status || 'published',
      featured: !!serviceData.featured,
      displayOrder: Number(serviceData.displayOrder || serviceData.order || 1),
      order: Number(serviceData.displayOrder || serviceData.order || 1),
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
    if (idx >= 0) cached[idx] = payload;
    else cached.push(payload);
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(cached));
    return payload;
  },

  /**
   * Toggle Active / Inactive Status of a Service
   */
  async toggleServiceActive(serviceId, active) {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'services', serviceId), { 
          active, 
          status: active ? 'published' : 'draft',
          updatedAt: new Date().toISOString() 
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore toggle service error:", e);
      }
    }

    const cached = await this.getServices({ publishedOnly: false });
    const item = cached.find(s => s.id === serviceId);
    if (item) {
      item.active = active;
      item.status = active ? 'published' : 'draft';
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(cached));
    }
    return true;
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
   * Fetch categories from Firestore `serviceCategories`
   */
  async getCategories() {
    const defaultCats = [
      { id: 'cat-1', name: 'Apparel Care', slug: 'apparel-care' },
      { id: 'cat-2', name: 'Finishing', slug: 'finishing' },
      { id: 'cat-3', name: 'Weight Based', slug: 'weight-based' },
      { id: 'cat-4', name: 'Traditional', slug: 'traditional' },
      { id: 'cat-5', name: 'Household', slug: 'household' },
      { id: 'cat-6', name: 'Footwear', slug: 'footwear' },
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
      if (cached && cached.length > 0) return cached;
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCats));
      return defaultCats;
    } catch (e) {
      return defaultCats;
    }
  }
};
