/**
 * Automated Advanced Sitemap Generator for Techwash Laundry Services
 * Generates modular multi-part XML sitemaps (pages, services, areas, blog) + master sitemap index + TXT URL lists
 * Focuses exclusively on Manikonda local SEO cluster for area routes.
 * Run via: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.techwashlaundry.com';

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
    title: 'Laundry Service Near Me in Manikonda & Hyderabad | Techwash',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Best laundry service near me with 100% Demineralized 0 PPM RO soft water batch washing and free doorstep pickup',
  },
  {
    slug: 'dry-cleaning',
    title: 'Dry Cleaning Near Me - Eco-Friendly Hydrocarbon Dry Cleaners | Techwash',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Top-rated dry cleaning near me with European non-toxic hydrocarbon solvents, zero PERC, and free doorstep delivery',
  },
  {
    slug: 'laundry-pickup-and-delivery',
    title: 'Laundry Pickup and Delivery Near Me in Manikonda & Hyderabad | Techwash',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    caption: 'Doorstep laundry pickup and delivery near me with express 24 to 48-hour delivery fleet',
  },
  {
    slug: 'ironing-service',
    title: 'Steam Ironing Near Me - 3D Form Tension Pressing | Techwash',
    image: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80',
    caption: 'Steam ironing near me with vacuum table crease retention and zero heat shine',
  },
  {
    slug: 'starch-and-iron',
    title: 'Starch and Iron Near Me - Traditional Cotton Starching | Techwash',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Starch and iron service near me with natural organic rice and corn starching treatment',
  },
  {
    slug: 'wash-and-iron',
    title: 'Wash and Iron Near Me - Weight-Based Laundry in Hyderabad | Techwash',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    caption: 'Wash and iron near me with isolated single-customer wash drum and crisp 3D steam finishing',
  },
  {
    slug: 'wash-and-fold',
    title: 'Wash and Fold Near Me - Daily Per-Kg Laundry | Techwash',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Wash and fold near me with hygienic RO soft water washing and store-ready packaging',
  },
  {
    slug: 'saree-rolling',
    title: 'Saree Rolling Near Me - Pure Silk & Pattu Saree Polishing | Techwash',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    caption: 'Saree rolling and polishing near me with zero-pressure wooden cylinder roller care',
  },
  {
    slug: 'shoe-cleaning',
    title: 'Shoe Cleaning Near Me - Sneaker Laundry & Spa | Techwash',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    caption: 'Shoe cleaning and sneaker laundry near me with midsole whitening, UV disinfection, and suede care',
  },
  {
    slug: 'curtain-cleaning',
    title: 'Curtain Cleaning Near Me - Deep Drapes Washing & Dry Clean | Techwash',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Curtain cleaning near me with dust mite extraction and vertical steam de-wrinkling',
  },
  {
    slug: 'carpet-cleaning',
    title: 'Carpet Cleaning Near Me - Deep Rug Shampoo & Wash | Techwash',
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
    caption: 'Carpet cleaning and rug shampoo near me with rotary extraction washing and thermal moisture removal',
  },
];

const AREA_SLUGS = [
  'manikonda',
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

  // 3. Areas (1 Manikonda area hub + 11 Manikonda service pages = 12 local landing pages)
  const areasEntries = [];
  AREA_SLUGS.forEach((slug) => {
    const hubUrl = `${BASE_URL}/areas/${slug}`;
    allUrls.push(hubUrl);
    areasEntries.push(buildUrlEntry(hubUrl, '1.0', 'weekly', currentDate));
  });
  AREA_SLUGS.forEach((areaSlug) => {
    SERVICE_ITEMS.forEach((srv) => {
      const serviceAreaUrl = `${BASE_URL}/areas/${areaSlug}/${srv.slug}`;
      allUrls.push(serviceAreaUrl);
      // Determine priority based on Manikonda SEO priority specification
      let priority = '0.85';
      if (srv.slug === 'laundry-service') priority = '1.0';
      else if (srv.slug === 'wash-and-iron') priority = '0.95';
      else if (srv.slug === 'dry-cleaning') priority = '0.95';
      else if (srv.slug === 'laundry-pickup-and-delivery') priority = '0.90';
      else if (srv.slug === 'ironing-service') priority = '0.88';
      else if (srv.slug === 'wash-and-fold') priority = '0.88';

      areasEntries.push(buildUrlEntry(serviceAreaUrl, priority, 'weekly', currentDate));
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
  console.log(`   - sitemap-areas.xml (${areasEntries.length} Manikonda URLs)`);
  console.log(`   - sitemap-blog.xml (${blogEntries.length} URLs)`);
  console.log(`   - sitemap.txt (${allUrls.length} plain text URLs)`);
}

generateSitemaps();
