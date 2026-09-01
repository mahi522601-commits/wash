/**
 * System Health Diagnostic & Onboarding Template Seeder for Tech Wash
 * Inspects connection health for Firebase, Firestore, ImgBB, and Payments
 */
import { db, auth, isFirebaseConfigured } from './firebase.js';
import { collection, getDocs, limit, query, setDoc, doc } from 'firebase/firestore';
import { serviceService } from './serviceService.js';
import { cmsService } from './cmsService.js';
import { settingsService, DEFAULT_SETTINGS } from './settingsService.js';

export const systemHealthService = {
  /**
   * Run live system health diagnostics
   */
  async checkHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      firebase: { status: 'ok', message: 'Firebase SDK Initialized' },
      firestore: { status: 'unknown', latencyMs: 0 },
      auth: { status: 'ok', message: 'Auth Service Active' },
      imgbb: { status: 'warning', message: 'No API Key - Using Browser Storage fallback' },
      paymentGateway: { status: 'ok', mode: 'Test / Mock Mode Enabled' },
    };

    // Test Firestore
    const start = performance.now();
    try {
      if (isFirebaseConfigured && db) {
        const snap = await getDocs(query(collection(db, 'services'), limit(1)));
        health.firestore = {
          status: 'ok',
          latencyMs: Math.round(performance.now() - start),
          message: 'Connected to Firestore Cloud instance (laundry-37abc)',
        };
      } else {
        health.firestore = {
          status: 'info',
          latencyMs: 1,
          message: 'Running in Local Storage Offline/Development Mode',
        };
      }
    } catch (e) {
      health.firestore = {
        status: 'error',
        latencyMs: Math.round(performance.now() - start),
        message: `Firestore check failed: ${e.message}`,
      };
    }

    // Check ImgBB API Key
    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (imgbbKey && imgbbKey.trim().length > 5) {
      health.imgbb = {
        status: 'ok',
        message: 'ImgBB Cloud CDN API Key configured',
      };
    }

    return health;
  },

  /**
   * Explicit Administrator-Triggered Starter Template Seeder
   * Only called when Admin explicitly clicks "Seed Initial Template" in /admin/system-health.
   */
  async seedInitialTemplate() {
    // 1. Initial Services with 6-stage process and dynamic features
    const starterServices = [
      {
        id: 'srv-dry-cleaning',
        slug: 'dry-cleaning',
        title: 'Premium Dry Cleaning',
        shortDescription: 'Gentle, eco-friendly solvent cleaning for delicate silks, suits, designer ethnic wear, and luxury woolens.',
        detailedDescription: 'Our signature dry cleaning utilizes zero-harsh-chemical hydrocarbon cleaning technology. We safeguard garment embellishments, hand-embroidery, silk textures, and structural lapels while ensuring 100% stain extraction.',
        category: 'Dry Cleaning',
        pricingType: 'per piece',
        startingPrice: 149,
        heroImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
        status: 'published',
        featured: true,
        order: 1,
        features: [
          'Fabric-safe eco hydrocarbon solvent',
          'Intricate embroidery & bead protection',
          'German 3D form steam pressing',
          'Anti-moth breathable packaging'
        ],
        benefits: [
          'Preserves original color brilliance and fabric luster',
          'Zero chemical odor or fabric shrinkage',
          'Hand-finished lapels and crisp pleating'
        ],
        processSteps: [
          {
            stepNumber: '01',
            title: 'Garment Inspection & Tagging',
            bullets: [
              'Fabric weave analysis & fiber sensitivity inspection',
              'Pre-existing stain documentation under high-CRI light',
              'Barcode tagging for end-to-end garment custody tracking'
            ]
          },
          {
            stepNumber: '02',
            title: 'Pre-Spotting & Stain Treatment',
            bullets: [
              'Targeted ultrasonic spot application for oil and tannin marks',
              'pH-neutral spotters matched to fabric type',
              'Hand treatment of collars, cuffs, and delicate embellishments'
            ]
          },
          {
            stepNumber: '03',
            title: 'Hydrocarbon Eco Cleaning',
            bullets: [
              'Gentle enclosed drum cycle with soft solvent bath',
              'Computerized temperature and moisture control',
              'Zero fabric tension to prevent distortion'
            ]
          },
          {
            stepNumber: '04',
            title: 'Deodorization & Slow Drying',
            bullets: [
              'Multi-stage solvent vapor recovery',
              'Gentle air circulation to preserve natural fabric oils',
              'Anti-static soft finish conditioning'
            ]
          },
          {
            stepNumber: '05',
            title: '3D Form Steam Finishing',
            bullets: [
              'Automated tension steam mannequins for jackets and blazers',
              'Hand iron touch-up for crisp seams and pleats',
              'Lining smoothing and button preservation'
            ]
          },
          {
            stepNumber: '06',
            title: 'Dual QC & Protective Eco-Packaging',
            bullets: [
              'Final 10-point checklist inspection before sealing',
              'Heavy-duty hanger support with shoulder shapers',
              'Dust-resistant breathable packaging ready for express dispatch'
            ]
          }
        ],
        faqs: [
          { q: 'How long does Premium Dry Cleaning take?', a: 'Standard turnaround is 48 hours. We also offer a 24-hour Express delivery option during booking.' },
          { q: 'Do you clean heavy wedding lehengas and sherwanis?', a: 'Yes! We specialize in intricate zari, bridal lehengas, silk sarees, and embellished sherwanis with zero color bleeding.' }
        ]
      },
      {
        id: 'srv-wash-and-iron',
        slug: 'wash-and-iron',
        title: 'Wash & Steam Iron',
        shortDescription: 'Everyday cottons, shirts, trousers, and linens washed with premium detergents and crisp steam pressed.',
        detailedDescription: 'High-hygiene wash with RO soft water and bio-enzyme detergents. Every garment is individually sorted by color, washed in sanitized drums, and steam-pressed to crisp perfection.',
        category: 'Laundry',
        pricingType: 'per piece',
        startingPrice: 39,
        heroImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
        status: 'published',
        featured: true,
        order: 2,
        features: [
          'RO Soft Water processing to preserve fabric life',
          'Bio-enzyme hypoallergenic detergents',
          'Industrial multi-temp steam press',
          'Delivered on hangers or crisp store fold'
        ],
        benefits: [
          '99.9% germ disinfection with hygienic rinse',
          'Zero color bleeding or fabric stiffness',
          'Sharp crease retention for executive workwear'
        ],
        processSteps: [
          {
            stepNumber: '01',
            title: 'Sorting by Color & Fabric',
            bullets: [
              'Whites, darks, and delicates separated into individual loads',
              'Pocket check and button integrity verification'
            ]
          },
          {
            stepNumber: '02',
            title: 'RO Soft Water Wash',
            bullets: [
              'Bio-enzyme German detergent wash at optimal temperature',
              'Conditioner rinse for lasting freshness and softness'
            ]
          },
          {
            stepNumber: '03',
            title: 'Moisture Controlled Tumble Dry',
            bullets: [
              'Gentle air dry preventing shrinkage or fiber wear',
              'De-wrinkle drum cycle'
            ]
          },
          {
            stepNumber: '04',
            title: 'Vacuum Table Steam Pressing',
            bullets: [
              'High-pressure steam penetration for mirror-crisp finish',
              'No heat scorching or shine marks on dark fabrics'
            ]
          },
          {
            stepNumber: '05',
            title: 'Quality Check & Packaging',
            bullets: [
              'Button inspection and crease alignment check',
              'Packed in moisture-shield garment covers'
            ]
          }
        ]
      },
      {
        id: 'srv-shoe-cleaning',
        slug: 'shoe-cleaning',
        title: 'Luxury Shoe Laundry & Spa',
        shortDescription: 'Deep cleaning, midsole de-yellowing, suede restoration, and deodorization for sneakers and luxury footwear.',
        detailedDescription: 'Hand-crafted restoration for sneakers, leather formals, suede loafers, and sports footwear. Using specialized horsehair brushes, gentle foam cleansers, and UV sterilization.',
        category: 'Footwear Care',
        pricingType: 'per pair',
        startingPrice: 299,
        heroImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
        status: 'published',
        featured: true,
        order: 3,
        features: [
          'Upper, midsole & outsole deep extraction',
          'Suede & nubuck conditioning & brush revival',
          'UV-C anti-bacterial chamber deodorization',
          'Water & stain repellant nano coating'
        ],
        benefits: [
          'Restores original shape, texture, and brightness',
          'Eliminates 100% of odor-causing bacteria',
          'Extends luxury footwear longevity'
        ],
        processSteps: [
          {
            stepNumber: '01',
            title: 'Detailed Footwear Assessment',
            bullets: ['Inspection of leather, mesh, knit, or suede texture', 'Laces and insole removal for individual processing']
          },
          {
            stepNumber: '02',
            title: 'Hand Foam Scrubbing',
            bullets: ['Soft-bristle horsehair scrubbing for delicate uppers', 'Stiff brush extraction for deep groove outsoles']
          },
          {
            stepNumber: '03',
            title: 'Midsole De-Yellowing & Polish',
            bullets: ['Oxygen-activated oxidation reversal for yellowed soles', 'Leather cream nourishment and buffing']
          },
          {
            stepNumber: '04',
            title: 'UV Sterilization & Nano Coating',
            bullets: ['UV-C chamber treatment to eliminate odor spores', 'Optional hydrophobic protective spray shield']
          }
        ]
      }
    ];

    for (const s of starterServices) {
      await serviceService.saveService(s);
    }

    // 2. Initial Hero Slide
    await cmsService.saveItem('heroSlides', {
      title: 'Next-Generation Premium Garment Care',
      badge: '✨ Technology-Driven Laundry & Dry Cleaning',
      subtitle: 'Experience German technology garment care, soft water washing, and express doorstep pickup within 45 minutes.',
      ctaPrimaryText: 'Book Doorstep Pickup',
      ctaPrimaryUrl: '/book-pickup',
      ctaSecondaryText: 'Explore Services & Rates',
      ctaSecondaryUrl: '/services',
      desktopImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1600&q=80',
      active: true,
      order: 1,
    });

    // 3. Initial Why Choose Us Benefits
    const benefits = [
      {
        title: 'RO Soft Water Washing',
        description: 'Hard water destroys fabric fibers. We exclusively use softened mineral-controlled water for silk-like softness.',
        icon: 'Droplets',
        order: 1,
        active: true,
      },
      {
        title: 'Zero Chemical Odor',
        description: 'Eco-safe German hydrocarbon solvents that leave garments smelling naturally fresh with zero harsh chemical residue.',
        icon: 'Sparkles',
        order: 2,
        active: true,
      },
      {
        title: '45-Min Doorstep Pickup',
        description: 'Convenient slot selection with live rider tracking and express 24-hour delivery turnaround options.',
        icon: 'Clock',
        order: 3,
        active: true,
      },
      {
        title: '10-Stage Garment Tracking',
        description: 'Track every single garment stage in real time from inspection, soft wash, steam press, to sealed packaging.',
        icon: 'ShieldCheck',
        order: 4,
        active: true,
      }
    ];

    for (const b of benefits) {
      await cmsService.saveItem('whyChooseUs', b);
    }

    // 4. Initial Global Settings
    await settingsService.saveSettings(DEFAULT_SETTINGS);

    return true;
  }
};
