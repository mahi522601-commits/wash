/**
 * Automated Advanced Sitemap Generator for Techwash Laundry Services
 * Generates modular multi-part XML sitemaps (pages, services, areas, blog) + master sitemap index + TXT URL lists
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
        title: 'Techwash Laundry Services Logo',
        caption: 'Next-Gen Premium Garment Care Hyderabad',
      },
      {
        loc: `${BASE_URL}/techwash_hero_cutout.webp`,
        title: 'Techwash Eco-Friendly Hydrocarbon Laundry Lab',
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
    slug: 'laundry-pickup-and-delivery',
    title: 'Doorstep Laundry Pickup and Delivery in Hyderabad',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    caption: 'Express 24 to 48-hour doorstep pickup and delivery fleet',
  },
  {
    slug: 'ironing-service',
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
    slug: 'shoe-cleaning',
    title: 'Sneaker, Suede & Leather Shoe Care in Hyderabad',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Deep sole ultrasonic whitening, bacterial disinfection, and leather conditioning',
  },
  {
    slug: 'curtain-cleaning',
    title: 'Heavy Drape & Curtain Deep Extraction Washing in Hyderabad',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Dust mite extraction and tension steam de-wrinkling for residential curtains',
  },
  {
    slug: 'carpet-cleaning',
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

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrlEntry(fullUrl, priority, changefreq, currentDate, images = []) {
  let entry = `  <url>\n    <loc>${escapeXml(fullUrl)}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>`;
  if (images && images.length > 0) {
    images.forEach((img) => {
      entry += `\n    <image:image>\n      <image:loc>${escapeXml(img.loc)}</image:loc>\n      <image:title>${escapeXml(img.title)}</image:title>\n      <image:caption>${escapeXml(img.caption)}</image:caption>\n    </image:image>`;
    });
  }
  entry += `\n  </url>`;
  return entry;
}

function wrapUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;
}

function generateSitemaps() {
  const currentDate = new Date().toISOString().split('T')[0];
  const allUrls = [];

  // 1. Pages
  const pagesEntries = [];
  CORE_PAGES.forEach((page) => {
    const fullUrl = `${BASE_URL}${page.url}`;
    allUrls.push(fullUrl);
    pagesEntries.push(buildUrlEntry(fullUrl, page.priority, page.changefreq, currentDate, page.images));
  });

  // 2. Services
  const servicesEntries = [];
  SERVICE_ITEMS.forEach((srv) => {
    const fullUrl = `${BASE_URL}/services/${srv.slug}`;
    allUrls.push(fullUrl);
    const images = srv.image ? [{ loc: srv.image, title: srv.title, caption: srv.caption }] : [];
    servicesEntries.push(buildUrlEntry(fullUrl, '0.9', 'weekly', currentDate, images));
  });

  // 3. Areas (8 area hubs + 88 area/service pages = 96 local landing pages)
  const areasEntries = [];
  AREA_SLUGS.forEach((slug) => {
    const hubUrl = `${BASE_URL}/areas/${slug}`;
    allUrls.push(hubUrl);
    areasEntries.push(buildUrlEntry(hubUrl, '0.9', 'weekly', currentDate));
  });
  AREA_SLUGS.forEach((areaSlug) => {
    SERVICE_ITEMS.forEach((srv) => {
      const serviceAreaUrl = `${BASE_URL}/areas/${areaSlug}/${srv.slug}`;
      allUrls.push(serviceAreaUrl);
      areasEntries.push(buildUrlEntry(serviceAreaUrl, '0.85', 'weekly', currentDate));
    });
  });

  // 4. Blog
  const blogEntries = [];
  BLOG_SLUGS.forEach((slug) => {
    const blogUrl = `${BASE_URL}/blog/${slug}`;
    allUrls.push(blogUrl);
    blogEntries.push(buildUrlEntry(blogUrl, '0.7', 'monthly', currentDate));
  });

  // Write Sub-Sitemaps
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap-pages.xml'), wrapUrlSet(pagesEntries), 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap-services.xml'), wrapUrlSet(servicesEntries), 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap-areas.xml'), wrapUrlSet(areasEntries), 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap-blog.xml'), wrapUrlSet(blogEntries), 'utf8');

  // Master Unified XML Sitemap
  const masterEntries = [...pagesEntries, ...servicesEntries, ...areasEntries, ...blogEntries];
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.xml'), wrapUrlSet(masterEntries), 'utf8');

  // Master TXT Sitemap
  fs.writeFileSync(path.resolve(__dirname, '../public/sitemap.txt'), allUrls.join('\n'), 'utf8');

  console.log(`✅ Advanced Multi-Part Sitemaps successfully updated with ${allUrls.length} total URLs:`);
  console.log(`   - sitemap.xml (Master Unified: ${masterEntries.length} URLs)`);
  console.log(`   - sitemap-pages.xml (${pagesEntries.length} URLs)`);
  console.log(`   - sitemap-services.xml (${servicesEntries.length} URLs)`);
  console.log(`   - sitemap-areas.xml (${areasEntries.length} URLs)`);
  console.log(`   - sitemap-blog.xml (${blogEntries.length} URLs)`);
  console.log(`   - sitemap.txt (${allUrls.length} plain text URLs)`);
}

generateSitemaps();
