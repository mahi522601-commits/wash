/**
 * Automated Advanced Sitemap Generator for Techwash Laundry Services
 * Single source of truth: src/data/seoRegistry.js
 * Generates modular multi-part XML sitemaps (pages, services, areas, blog) + master sitemap + TXT URL lists
 * Excludes all noindex, private, duplicate, and redirect URLs.
 * Run via: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  BASE_URL, 
  MASTER_SEO_REGISTRY, 
  getSitemapEligiblePages 
} from '../src/data/seoRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

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
      if (img && img.loc) {
        entry += `\n    <image:image>\n      <image:loc>${escapeXml(img.loc)}</image:loc>\n      <image:title>${escapeXml(img.title || '')}</image:title>\n      <image:caption>${escapeXml(img.caption || '')}</image:caption>\n    </image:image>`;
      }
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

export function generateSitemaps() {
  const currentDate = new Date().toISOString().split('T')[0];
  const eligiblePages = getSitemapEligiblePages();
  const allUrls = [];

  const pagesEntries = [];
  const servicesEntries = [];
  const areasEntries = [];
  const blogEntries = [];

  for (const page of eligiblePages) {
    allUrls.push(page.canonicalUrl);

    let images = [];
    if (page.path === '/') {
      images = [
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
      ];
    }

    const xmlEntry = buildUrlEntry(
      page.canonicalUrl,
      page.priority || '0.8',
      page.changefreq || 'weekly',
      currentDate,
      images
    );

    if (page.type === 'service_detail') {
      servicesEntries.push(xmlEntry);
    } else if (page.type === 'area_service_detail' || page.path === '/areas/manikonda') {
      areasEntries.push(xmlEntry);
    } else if (page.type === 'blog_post') {
      blogEntries.push(xmlEntry);
    } else {
      pagesEntries.push(xmlEntry);
    }
  }

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // 1. Write Sub-Sitemaps
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-pages.xml'), wrapUrlSet(pagesEntries), 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-services.xml'), wrapUrlSet(servicesEntries), 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-areas.xml'), wrapUrlSet(areasEntries), 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-blog.xml'), wrapUrlSet(blogEntries), 'utf8');

  // 2. Master Unified XML Sitemap
  const masterEntries = [...pagesEntries, ...servicesEntries, ...areasEntries, ...blogEntries];
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), wrapUrlSet(masterEntries), 'utf8');

  // 3. Master Plain-Text Sitemap
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.txt'), allUrls.join('\n'), 'utf8');

  console.log(`✅ Advanced Multi-Part Sitemaps successfully updated with ${allUrls.length} total URLs:`);
  console.log(`   - sitemap.xml (Master Unified: ${masterEntries.length} URLs)`);
  console.log(`   - sitemap-pages.xml (${pagesEntries.length} URLs)`);
  console.log(`   - sitemap-services.xml (${servicesEntries.length} URLs)`);
  console.log(`   - sitemap-areas.xml (${areasEntries.length} Manikonda URLs)`);
  console.log(`   - sitemap-blog.xml (${blogEntries.length} URLs)`);
  console.log(`   - sitemap.txt (${allUrls.length} plain text URLs)`);

  return {
    total: allUrls.length,
    pages: pagesEntries.length,
    services: servicesEntries.length,
    areas: areasEntries.length,
    blog: blogEntries.length,
  };
}

generateSitemaps();
