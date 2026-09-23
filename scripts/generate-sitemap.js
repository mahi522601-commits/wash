/**
 * Automated Sitemap Generator for Tech Wash Laundry Services
 * Run via: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.techwashlaundry.com';

const CORE_PAGES = [
  { url: '', priority: '1.0', changefreq: 'daily' },
  { url: '/services', priority: '0.9', changefreq: 'weekly' },
  { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
  { url: '/areas', priority: '0.9', changefreq: 'weekly' },
  { url: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
  { url: '/locations', priority: '0.8', changefreq: 'weekly' },
  { url: '/offers', priority: '0.8', changefreq: 'weekly' },
  { url: '/book-pickup', priority: '0.9', changefreq: 'weekly' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/gallery', priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { url: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
];

const SERVICE_SLUGS = [
  'laundry-service',
  'dry-cleaning',
  'laundry-pickup-delivery',
  'ironing',
  'starch-and-iron',
  'wash-and-iron',
  'wash-and-fold',
  'saree-rolling',
  'shoe-washing',
  'curtain-washing',
  'carpet-washing',
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

function generateSitemapXml() {
  const currentDate = new Date().toISOString().split('T')[0];
  const urls = [];

  // 1. Core Pages
  CORE_PAGES.forEach((page) => {
    urls.push(`  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  });

  // 2. Service Pages
  SERVICE_SLUGS.forEach((slug) => {
    urls.push(`  <url>
    <loc>${BASE_URL}/services/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  });

  // 3. Area Pages
  AREA_SLUGS.forEach((slug) => {
    urls.push(`  <url>
    <loc>${BASE_URL}/areas/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
  });

  // 4. Area + Service Combination Pages (72 long-tail combinations)
  AREA_SLUGS.forEach((areaSlug) => {
    SERVICE_SLUGS.forEach((srvSlug) => {
      urls.push(`  <url>
    <loc>${BASE_URL}/areas/${areaSlug}/${srvSlug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`);
    });
  });

  // 5. Blog Detail Pages
  BLOG_SLUGS.forEach((slug) => {
    urls.push(`  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ Sitemap successfully generated with ${urls.length} URLs at: ${outputPath}`);
}

generateSitemapXml();
