/**
 * Automated Advanced Sitemap Generator for Tech Wash Laundry Services
 * Generates both XML (with Google Image SEO extensions) and TXT URL lists
 * Run via: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://techwashlaundry.com';

const CORE_PAGES = [
  { 
    url: '', 
    priority: '1.0', 
    changefreq: 'daily',
    images: [
      {
        loc: `${BASE_URL}/techwashlogo.webp`,
        title: 'Tech Wash Laundry Services Logo',
        caption: 'Next-Gen Premium Garment Care Hyderabad',
      },
      {
        loc: `${BASE_URL}/techwash_hero_cutout.webp`,
        title: 'Tech Wash Eco-Friendly Hydrocarbon Laundry Lab',
        caption: 'Certified 0 PPM RO Water Soft Wash and Express Doorstep Delivery Hyderabad',
      },
    ]
  },
  { url: '/services', priority: '0.9', changefreq: 'weekly' },
  { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { url: '/areas', priority: '0.9', changefreq: 'weekly' },
  { url: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
  { url: '/locations', priority: '0.8', changefreq: 'weekly' },
  { url: '/offers', priority: '0.8', changefreq: 'weekly' },
  { url: '/book-pickup', priority: '0.9', changefreq: 'weekly' },
  { url: '/track-order', priority: '0.8', changefreq: 'weekly' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/gallery', priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { url: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

const SERVICE_ITEMS = [
  {
    slug: 'laundry-service',
    title: 'Professional Laundry Service in Hyderabad',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: '100% Demineralized 0 PPM RO soft water batch laundry washing',
  },
  {
    slug: 'dry-cleaning',
    title: 'Eco-Friendly Hydrocarbon Dry Cleaning in Hyderabad',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Pure European non-toxic hydrocarbon solvent dry cleaning with zero PERC',
  },
  {
    slug: 'laundry-pickup-delivery',
    title: 'Doorstep Laundry Pickup and Delivery in Hyderabad',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    caption: 'Express 24 to 48-hour doorstep pickup and delivery fleet',
  },
  {
    slug: 'ironing',
    title: '3D Form Tension Steam Pressing in Hyderabad',
    image: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80',
    caption: 'Zero heat shine steam form pressing with vacuum table crease retention',
  },
  {
    slug: 'starch-and-iron',
    title: 'Custom Starch & Steam Iron in Hyderabad',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Pure organic rice and corn starching treatment for crisp cotton shirts and sarees',
  },
  {
    slug: 'wash-and-iron',
    title: 'Weight-Based Wash & Steam Iron in Hyderabad',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    caption: 'Isolated single-customer wash drum followed by crisp steam form finishing',
  },
  {
    slug: 'wash-and-fold',
    title: 'Weight-Based Wash & Fold Daily Laundry in Hyderabad',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Hygienic RO soft water washing with moisture-barrier store-ready folding',
  },
  {
    slug: 'saree-rolling',
    title: 'Pure Silk & Zari Saree Rolling & Polishing in Hyderabad',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Zero-pressure calendar roller pressing preserving zari weave integrity',
  },
  {
    slug: 'shoe-washing',
    title: 'Sneaker, Suede & Leather Shoe Care in Hyderabad',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Deep sole ultrasonic whitening, bacterial disinfection, and leather conditioning',
  },
  {
    slug: 'curtain-washing',
    title: 'Heavy Drape & Curtain Deep Extraction Washing in Hyderabad',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Dust mite extraction and tension steam de-wrinkling for residential curtains',
  },
  {
    slug: 'carpet-washing',
    title: 'Deep Carpet & Rug Hydro-Extraction Cleaning in Hyderabad',
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
    caption: 'High-power dual extraction washing restoring carpet softness and pile bounce',
  },
];

const AREA_SLUGS = [
  'manikonda',
  'puppalaguda',
  'khajaguda',
  'lanco-hills',
  'shaikpet',
  'narsingi',
  'alkapur-township',
  'nanakramguda',
];

const BLOG_SLUGS = [
  'why-hard-water-destroys-delicate-fabrics',
  'the-complete-guide-to-silk-and-zari-dry-cleaning',
  'how-to-keep-white-sneakers-pristine',
];

function generateSitemaps() {
  const currentDate = new Date().toISOString().split('T')[0];
  const xmlEntries = [];
  const rawUrls = [];

  const addUrl = (fullUrl, priority, changefreq, images = []) => {
    rawUrls.push(fullUrl);
    let entry = `  <url>\n    <loc>${fullUrl}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>`;
    if (images && images.length > 0) {
      images.forEach((img) => {
        entry += `\n    <image:image>\n      <image:loc>${img.loc}</image:loc>\n      <image:title>${img.title}</image:title>\n      <image:caption>${img.caption}</image:caption>\n    </image:image>`;
      });
    }
    entry += `\n  </url>`;
    xmlEntries.push(entry);
  };

  // 1. Core Pages (17 pages including /track-order)
  CORE_PAGES.forEach((page) => {
    addUrl(`${BASE_URL}${page.url}`, page.priority, page.changefreq, page.images);
  });

  // 2. Service Pages (11 core services with image schemas)
  SERVICE_ITEMS.forEach((srv) => {
    const images = srv.image ? [{ loc: srv.image, title: srv.title, caption: srv.caption }] : [];
    addUrl(`${BASE_URL}/services/${srv.slug}`, '0.9', 'weekly', images);
  });

  // 3. Area Hub Pages (8 core areas)
  AREA_SLUGS.forEach((slug) => {
    addUrl(`${BASE_URL}/areas/${slug}`, '0.9', 'weekly');
  });

  // 4. Area + Service Combination Pages (88 geo-targeted landing pages)
  AREA_SLUGS.forEach((areaSlug) => {
    SERVICE_ITEMS.forEach((srv) => {
      addUrl(`${BASE_URL}/areas/${areaSlug}/${srv.slug}`, '0.85', 'weekly');
    });
  });

  // 5. Blog Detail Pages (3 editorial guides)
  BLOG_SLUGS.forEach((slug) => {
    addUrl(`${BASE_URL}/blog/${slug}`, '0.7', 'monthly');
  });

  // Write XML Sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlEntries.join('\n')}
</urlset>`;

  const xmlOutputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(xmlOutputPath, xml, 'utf8');

  // Write TXT Sitemap (for URL inspection & batch submit tools)
  const txtOutputPath = path.resolve(__dirname, '../public/sitemap.txt');
  fs.writeFileSync(txtOutputPath, rawUrls.join('\n'), 'utf8');

  console.log(`✅ Advanced Sitemap successfully updated with ${rawUrls.length} URLs:`);
  console.log(`   XML: ${xmlOutputPath}`);
  console.log(`   TXT: ${txtOutputPath}`);
}

generateSitemaps();
