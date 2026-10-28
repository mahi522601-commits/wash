/**
 * Techwash Laundry Automated Pre-rendering Build Script
 * Generates static HTML files for all SEO routes in dist/
 * Guarantees Googlebot, Bingbot, and search crawlers receive 200 OK with:
 *  - Accurate canonical URLs (fixing canonical trap where everything mapped to homepage)
 *  - High-intent Page Titles & Meta Descriptions targeting "Near Me" & "in Manikonda"
 *  - Rich Schema.org Service, DryCleaningOrLaundry, ItemList, BreadcrumbList, and FAQPage JSON-LD
 *  - High-density crawlable semantic HTML with local areas, branches, and service rates
 * Run via: node scripts/prerender-seo-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  BASE_URL, 
  BUSINESS_INFO, 
  BUSINESS_BRANCHES, 
  SEO_AREAS, 
  SEO_SERVICES 
} from '../src/data/seoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const AGGREGATE_RATING = {
  '@type': 'AggregateRating',
  ratingValue: '4.9',
  reviewCount: '318',
  bestRating: '5',
  worstRating: '1',
};

const CUSTOMER_REVIEWS = [
  {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Rameshwar Rao' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    reviewBody: 'Best laundry service in Manikonda! Clothes always come back fresh, perfectly steam pressed, and handled with care. Their curtains washing and dry cleaning in Manikonda are top notch.'
  },
  {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Sneha Reddy' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    reviewBody: 'Quick, prompt and reliable laundry service in Manikonda near Lanco Hills Road and Shaikpet Main Rd. 0 PPM RO soft water wash keeps white shirts bright and fresh.'
  },
  {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Karthik Varma' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    reviewBody: 'Good laundry, good service, curtains washing is good and silk saree rolling & dry cleaning is the best in Manikonda and Puppalaguda.'
  }
];

const COMMON_FAQS = [
  {
    question: 'Which is the best dry cleaning and laundry service near me in Hyderabad?',
    answer: 'Techwash Laundry is rated #1 for dry cleaning and laundry in Hyderabad, serving Manikonda, Tolichowki, Shaikpet, Puppalaguda, Gachibowli, and Hitec City. We use 100% 0 PPM RO demineralized soft water, isolated single-customer wash drums, certified European eco-hydrocarbon solvents (zero PERC), and 3D tension steam finishing with free doorstep pickup.',
  },
  {
    question: 'Do you offer doorstep laundry pickup and delivery near me in Manikonda?',
    answer: 'Yes! We provide on-demand and scheduled doorstep pickup across Manikonda (500089), Tolichowki (500008), Shaikpet, Puppalaguda, Lanco Hills, Alkapoor Township, Gachibowli, Hitec City, and Jubilee Hills. Our executive arrives at your scheduled time with digital scales, providing an instant itemized bill.',
  },
  {
    question: 'How does per-kg wash & fold and wash & iron work?',
    answer: 'Wash & Fold starts at ₹100/kg, and Wash & Iron starts at ₹130/kg. Your garments are weighed transparently at your doorstep, washed exclusively in single-customer drums using hypoallergenic bio-detergents in 0 PPM soft water, dried with moisture sensors, and either precision hand-folded or steam-pressed on 3D form mannequins.',
  },
  {
    question: 'Is your dry cleaning safe for heavy silk sarees, sherwanis, and suits?',
    answer: 'Absolutely. We use certified European closed-loop hydrocarbon dry cleaning with zero perchloroethylene (PERC). This preserves gold and silver zari, intricate embroidery, delicate raw silks, and tailored suit wools without fiber stiffness or harsh chemical odors.',
  },
  {
    question: 'What is your turnaround time for laundry and dry cleaning in Manikonda?',
    answer: 'Our standard turnaround is 48 hours for complete washing, drying, steam pressing, and quality inspection. For urgent requirements, we provide express 24-hour turnaround across Manikonda, Tolichowki, and Hyderabad upon request.',
  },
  {
    question: 'Can I drop off my clothes in person at a store counter near me in Manikonda?',
    answer: 'Yes! You can visit any of our 3 physical branch counters: Branch 1 on Shaikpet Main Rd, Manikonda (opposite Sri Ram Nagar Colony); Branch 2 beside Dreamscape Hotel, OU Colony, Tolichowki; or Counter 3 beside Ambience Courtyard, Shaikpet. Open 8:00 AM to 9:00 PM all 7 days.',
  },
];

function generateBranchHtml() {
  return `
    <section style="margin-top: 36px; padding: 24px; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 16px;">
      <h3 style="font-size: 20px; font-weight: 800; color: #9A3412; margin: 0 0 16px 0;">
        📍 Store Branches & Drop-off Counters Near You (Open 8 AM – 9 PM)
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        ${BUSINESS_BRANCHES.map(b => `
          <div style="background: #FFFFFF; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px;">
            <div style="font-weight: 800; color: #1E293B; font-size: 15px; margin-bottom: 6px;">${escapeHtml(b.name)}</div>
            <div style="font-size: 13px; color: #64748B; margin-bottom: 10px;">${escapeHtml(b.address)}</div>
            <div style="font-size: 13px; margin-bottom: 8px;">
              <strong>Phone:</strong> <a href="tel:${b.telephone.replace(/\s+/g, '')}" style="color: #EA580C; font-weight: bold;">${b.telephone}</a>
            </div>
            <div style="font-size: 13px;">
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.address)}" target="_blank" rel="noopener noreferrer" style="color: #EA580C; font-weight: bold; text-decoration: underline;">
                Get Directions on Google Maps →
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function generateAreasServedHtml() {
  const areas = [
    { name: 'Manikonda', pin: '500089' },
    { name: 'Tolichowki', pin: '500008' },
    { name: 'OU Colony', pin: '500008' },
    { name: 'Shaikpet', pin: '500089' },
    { name: 'Puppalaguda', pin: '500089' },
    { name: 'Lanco Hills', pin: '500089' },
    { name: 'Alkapoor Township', pin: '500089' },
    { name: 'Gachibowli', pin: '500032' },
    { name: 'Hitec City', pin: '500081' },
    { name: 'Jubilee Hills', pin: '500033' },
    { name: 'Narsingi & Kokapet', pin: '500075' },
  ];

  return `
    <section style="margin-top: 36px;">
      <h3 style="font-size: 20px; font-weight: 800; color: #1E293B; margin-bottom: 12px;">
        🚚 Doorstep Pickup & Delivery Areas Near Me (60-90 Min Response)
      </h3>
      <p style="font-size: 14px; color: #64748B; margin-bottom: 14px;">
        Our mobile concierge fleet provides scheduled and express doorstep laundry collection across Hyderabad:
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${areas.map(a => `
          <span style="display: inline-block; padding: 6px 12px; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 999px; font-size: 13px; font-weight: 600; color: #334155;">
            ${escapeHtml(a.name)} (${a.pin})
          </span>
        `).join('')}
      </div>
    </section>
  `;
}

function generateRateCardHtml(rateCard, serviceName) {
  if (!rateCard || rateCard.length === 0) return '';
  return `
    <section style="margin-top: 32px; margin-bottom: 32px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
        <h3 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0;">
          Transparent Rate Card & Price List — ${escapeHtml(serviceName)}
        </h3>
        <span style="font-size: 13px; font-weight: 700; color: #047857; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 4px 10px; border-radius: 999px;">
          ✓ Flat 20% Off Applied on 1st Order • 0 Hidden Fees
        </span>
      </div>
      <div style="overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0; color: #475569;">
              <th style="padding: 12px 16px; font-weight: 800;">Garment / Item</th>
              <th style="padding: 12px 16px; font-weight: 800;">Standard Price</th>
              <th style="padding: 12px 16px; font-weight: 800;">Process & Care Specifications</th>
              <th style="padding: 12px 16px; font-weight: 800; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rateCard.map((item, idx) => `
              <tr style="border-bottom: 1px solid #F1F5F9; ${idx % 2 === 1 ? 'background: #FAFAFA;' : ''}">
                <td style="padding: 12px 16px; font-weight: 700; color: #1E293B;">
                  ${escapeHtml(item.item)}
                </td>
                <td style="padding: 12px 16px; font-weight: 800; color: #EA580C; white-space: nowrap;">
                  ${escapeHtml(item.rate)}
                </td>
                <td style="padding: 12px 16px; color: #64748B; font-size: 13px;">
                  ${escapeHtml(item.details)}
                </td>
                <td style="padding: 12px 16px; text-align: right;">
                  <a href="/book-pickup" style="display: inline-block; padding: 6px 12px; background: #FFF7ED; border: 1px solid #FDBA74; color: #EA580C; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 12px;">
                    Book Pickup →
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size: 12px; color: #64748B; margin-top: 8px; margin-bottom: 0;">
        💡 <em>Free doorstep pickup and delivery in Manikonda & Hyderabad for eligible orders. Digital electronic weigh receipt provided at pickup. Express 24-hour delivery option available.</em>
      </p>
    </section>
  `;
}

function generateManikondaLandmarksHtml(serviceName) {
  const colonies = [
    'Secretariat Colony',
    'OU Colony',
    'Lanco Hills Road',
    'Shirdi Sai Nagar',
    'Puppalaguda Main Road',
    'Alkapoor Township Corridor',
    'Ambience Courtyard Corridor',
    'Shaikpet Main Road',
    'Sri Ram Nagar Colony',
    'Chitrapuri Hills',
    'Prashant Hills Corridor',
    'Golden Pride & Jaihind Enclave',
    'Manikonda Gardens Rd'
  ];

  return `
    <section style="margin-top: 36px; padding: 24px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px;">
      <h3 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
        📍 Manikonda (500089) Colonies & Societies Covered for ${escapeHtml(serviceName)}
      </h3>
      <p style="font-size: 14px; color: #475569; margin-bottom: 14px;">
        Our dedicated Manikonda mobile fleet delivers daily doorstep pickup and delivery (8:00 AM – 9:00 PM) to all high-rises, gated communities, and colonies:
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${colonies.map(col => `
          <span style="display: inline-block; padding: 6px 12px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 999px; font-size: 13px; font-weight: 600; color: #334155;">
            ✓ ${escapeHtml(col)}
          </span>
        `).join('')}
      </div>
    </section>
  `;
}

function generateFaqHtml(faqs) {
  return `
    <section style="margin-top: 36px;">
      <h3 style="font-size: 20px; font-weight: 800; color: #1E293B; margin-bottom: 16px;">
        Frequently Asked Questions — Services Near Me & Manikonda
      </h3>
      <div style="font-size: 14px; color: #475569; line-height: 1.7;">
        ${faqs.map(f => `
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #E2E8F0;">
            <p style="font-weight: 800; color: #0F172A; margin: 0 0 6px 0;">Q: ${escapeHtml(f.question)}</p>
            <p style="margin: 0; color: #475569;">A: ${escapeHtml(f.answer)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function buildHtmlPage(baseTemplate, config) {
  let html = baseTemplate;

  // 1. Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);

  // 2. Replace Meta Description
  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, 
    `<meta name="description" content="${escapeAttr(config.description)}" />`);

  // 3. Replace Meta Keywords
  html = html.replace(/<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i, 
    `<meta name="keywords" content="${escapeAttr(config.keywords)}" />`);

  // 4. Replace Canonical URL
  html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, 
    `<link rel="canonical" href="${escapeAttr(config.canonicalUrl)}" />`);

  // 5. Replace Open Graph Tags
  html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, 
    `<meta property="og:title" content="${escapeAttr(config.title)}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, 
    `<meta property="og:description" content="${escapeAttr(config.description)}" />`);
  html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i, 
    `<meta property="og:url" content="${escapeAttr(config.canonicalUrl)}" />`);

  // 6. Replace Twitter Tags
  html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, 
    `<meta name="twitter:title" content="${escapeAttr(config.title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, 
    `<meta name="twitter:description" content="${escapeAttr(config.description)}" />`);

  // 7. Replace Schema.org JSON-LD (Replace the first static script tag)
  if (config.structuredData) {
    const jsonLdString = JSON.stringify(config.structuredData, null, 2);
    html = html.replace(
      /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">\n${jsonLdString}\n</script>`
    );
  }

  // 8. Replace semantic <main id="techwash-static-seo"> content inside #root
  if (config.mainHtml) {
    html = html.replace(
      /<main\s+id="techwash-static-seo"[\s\S]*?<\/main>/i,
      config.mainHtml
    );
  }

  return html;
}

function generateManikondaFaqsForService(service) {
  const sLower = service.name.toLowerCase();
  return [
    {
      question: `Which is the best ${sLower} in Manikonda, Hyderabad?`,
      answer: `Techwash Laundry is rated #1 for ${sLower} in Manikonda (500089) with a 4.9/5 star rating. We provide 100% demineralized 0 PPM RO soft water wash, single-customer isolated drums, certified European eco hydrocarbon dry cleaning (0% PERC), and 3D tension steam form pressing with daily doorstep pickup across all Manikonda communities.`,
    },
    {
      question: `What is the price of ${sLower} in Manikonda?`,
      answer: `Our ${sLower} in Manikonda starts at ${service.pricingDisplay}. Flat 20% Off is available on your first order with free doorstep pickup across Manikonda.`,
    },
    {
      question: `Do you offer free doorstep pickup in Manikonda for ${sLower}?`,
      answer: `Yes, our pickup fleet operates daily (8:00 AM – 9:00 PM) throughout Secretariat Colony, OU Colony, Lanco Hills Road, Puppalaguda, Shirdi Sai Nagar, and Alkapoor Township with standard 48-hour and express 24-hour turnaround.`,
    },
    {
      question: `Why is Techwash better than other laundries and dhobis in Manikonda for ${sLower}?`,
      answer: `Most local laundries in Manikonda wash in hard tap or borewell water, causing white clothes to turn yellow and fabric fibers to weaken. Techwash uses 100% demineralized 0 PPM RO soft water, never mixes your garments with other customers, uses botanical bio-enzymes, and presses with 3D steam form mannequins to prevent fabric shine or burn marks.`,
    },
    {
      question: `Where is your nearest store counter in Manikonda if I want to drop off clothes myself?`,
      answer: `You can visit our Main Branch counter on Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda (500089), or our OU Colony branch beside Dreamscape Hotel, Tolichowki (500008), or our Ambience Courtyard counter. Open 8:00 AM to 9:00 PM all 7 days.`,
    },
  ];
}

function prerenderAll() {
  console.log('====================================================');
  console.log('🚀 TECHWASH STATIC PRE-RENDERING ENGINE FOR SEO');
  console.log('====================================================\n');

  const baseTemplatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(baseTemplatePath)) {
    console.error('❌ dist/index.html not found. Run "vite build" first!');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf-8');
  let generatedCount = 0;

  // ----------------------------------------------------
  // 1. Pre-render Main Services Hub: /services
  // ----------------------------------------------------
  console.log('📁 Pre-rendering /services...');
  const servicesDir = path.join(DIST_DIR, 'services');
  fs.mkdirSync(servicesDir, { recursive: true });

  const servicesStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Services Near Me', item: `${BASE_URL}/services` },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: SEO_SERVICES.map((s, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: `${s.name} Near Me`,
          url: `${BASE_URL}/services/${s.slug}`,
          description: s.metaDescription,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: COMMON_FAQS.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'DryCleaningOrLaundry',
        '@id': `${BASE_URL}/services#localbusiness`,
        name: BUSINESS_INFO.name,
        telephone: BUSINESS_INFO.telephone,
        url: `${BASE_URL}/services`,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: BUSINESS_INFO.address,
        geo: BUSINESS_INFO.geo,
        hasMap: 'https://www.google.com/maps/search/?api=1&query=Tech+Wash+Laundry+Services+Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089',
        aggregateRating: AGGREGATE_RATING,
        review: CUSTOMER_REVIEWS,
        openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
        department: BUSINESS_BRANCHES.map(branch => ({
          '@type': 'DryCleaningOrLaundry',
          name: branch.name,
          telephone: branch.telephone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: branch.address,
            addressLocality: branch.locality,
            addressRegion: 'Telangana',
            postalCode: branch.postalCode,
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: branch.geo.latitude,
            longitude: branch.geo.longitude,
          },
        })),
      },
    ],
  };

  const servicesMainHtml = `
    <main id="techwash-static-seo" style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #1F2937; line-height: 1.6;">
      <header style="margin-bottom: 32px;">
        <p style="color: #EA580C; font-weight: 800; text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em; margin-bottom: 8px;">
          ✦ Certified Fabric Care Laboratory • 0 PPM RO Soft Water • Free Doorstep Pickup
        </p>
        <h1 style="font-size: 38px; line-height: 1.15; font-weight: 900; color: #111827; margin: 0 0 16px 0;">
          Dry Cleaning, Laundry & Steam Pressing Services Near Me in Hyderabad
        </h1>
        <p style="font-size: 18px; color: #4B5563; max-width: 900px; margin: 0 0 16px 0;">
          Looking for top-rated dry cleaners or laundry services near you? Techwash Laundry provides 100% demineralized 0 PPM RO soft-water washing, isolated single-customer machine drums, certified non-toxic European eco hydrocarbon dry cleaning, and 3D tension steam form pressing with daily scheduled and express doorstep pickup across Manikonda, Tolichowki, Shaikpet, Gachibowli, and Hyderabad.
        </p>
        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #9A3412;">
          <strong>Direct Booking Hotline:</strong> <a href="tel:+916304845567" style="color: #EA580C; font-weight: bold;">+91 63048 45567</a> |
          <strong>Operating Hours:</strong> 8:00 AM – 9:00 PM (All 7 Days) |
          <strong>Doorstep Fleet:</strong> 60-Minute Response in Manikonda & Tolichowki
        </div>
      </header>

      <section style="margin-bottom: 32px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 16px;">
          Full Garment Care Menu & Rates Near You
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
          <thead>
            <tr style="background: #F3F4F6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Service Name</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Starting Price</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Care Technology</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Explore Details</th>
            </tr>
          </thead>
          <tbody>
            ${SEO_SERVICES.map(s => `
              <tr>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">
                  <a href="/services/${s.slug}" style="color: #EA580C; font-weight: bold; text-decoration: none;">
                    ${escapeHtml(s.name)} Near Me
                  </a>
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: 700; color: #1E293B;">
                  ${escapeHtml(s.pricingDisplay)}
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; color: #4B5563;">
                  ${escapeHtml(s.processSummary)}
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">
                  <a href="/services/${s.slug}" style="display: inline-block; padding: 4px 10px; background: #EA580C; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                    View Rates →
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      ${generateAreasServedHtml()}
      ${generateBranchHtml()}
      ${generateFaqHtml(COMMON_FAQS)}
    </main>
  `;

  const servicesHtml = buildHtmlPage(baseTemplate, {
    title: 'Dry Cleaning, Laundry & Steam Pressing Near Me in Hyderabad | Techwash',
    description: 'Looking for the best dry cleaning, laundry or steam ironing service near you? Techwash provides 0 PPM RO soft water wash, certified eco-friendly dry cleaning, and free doorstep pickup across Manikonda, Tolichowki & Hyderabad.',
    keywords: 'dry cleaning near me, laundry near me, laundry service near me, steam iron near me, shoe cleaning near me, clothes washing near me, best dry cleaners near me, dry cleaning services hyderabad, steam ironing manikonda',
    canonicalUrl: `${BASE_URL}/services`,
    structuredData: servicesStructuredData,
    mainHtml: servicesMainHtml,
  });

  fs.writeFileSync(path.join(servicesDir, 'index.html'), servicesHtml, 'utf-8');
  generatedCount++;
  console.log('   ✅ dist/services/index.html generated.');

  // ----------------------------------------------------
  // 2. Pre-render 11 Individual Service Pages: /services/:slug (Near Me)
  // ----------------------------------------------------
  for (const s of SEO_SERVICES) {
    console.log(`📁 Pre-rendering /services/${s.slug}...`);
    const serviceSubDir = path.join(servicesDir, s.slug);
    fs.mkdirSync(serviceSubDir, { recursive: true });

    const serviceKeywords = [
      s.primaryKeyword,
      s.secondaryKeywords,
      ...(s.nearMeKeywords || []),
      `${s.name.toLowerCase()} near me`,
      `best ${s.name.toLowerCase()} near me`,
      `${s.name.toLowerCase()} manikonda`,
      `best ${s.name.toLowerCase()} in manikonda`,
      `${s.name.toLowerCase()} hyderabad`,
      `${s.name.toLowerCase()} 500089`,
      `${s.name.toLowerCase()} puppalaguda`,
      `${s.name.toLowerCase()} tolichowki`,
      `${s.name.toLowerCase()} shaikpet`,
      `${s.name.toLowerCase()} lanco hills`,
      'laundry near me',
      'dry cleaning near me'
    ].filter(Boolean).join(', ');

    const serviceFaqs = (s.faqs && s.faqs.length > 0) ? s.faqs : generateManikondaFaqsForService(s);

    const serviceStructuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Services', item: `${BASE_URL}/services` },
            { '@type': 'ListItem', position: 3, name: `${s.name} Near Me`, item: `${BASE_URL}/services/${s.slug}` },
          ],
        },
        {
          '@type': 'Service',
          '@id': `${BASE_URL}/services/${s.slug}#service`,
          name: `${s.name} Near Me & in Manikonda`,
          alternateName: [
            s.name,
            `Best ${s.name} Near Me`,
            `${s.name} in Manikonda`,
            `${s.name} in Hyderabad`,
            ...(s.nearMeKeywords?.slice(0, 5) || [])
          ],
          serviceType: `${s.name} - Local Doorstep Garment Care`,
          category: s.category || 'Garment Care',
          description: s.metaDescription,
          provider: {
            '@type': 'DryCleaningOrLaundry',
            name: BUSINESS_INFO.name,
            telephone: BUSINESS_INFO.telephone,
            url: BASE_URL,
            logo: BUSINESS_INFO.logo,
            image: BUSINESS_INFO.image,
            priceRange: BUSINESS_INFO.priceRange,
            address: BUSINESS_INFO.address,
            geo: BUSINESS_INFO.geo,
            hasMap: 'https://www.google.com/maps/search/?api=1&query=Tech+Wash+Laundry+Services+Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089',
            aggregateRating: AGGREGATE_RATING,
            review: CUSTOMER_REVIEWS,
            openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
            department: BUSINESS_BRANCHES.map(branch => ({
              '@type': 'DryCleaningOrLaundry',
              name: branch.name,
              telephone: branch.telephone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: branch.address,
                addressLocality: branch.locality,
                addressRegion: 'Telangana',
                postalCode: branch.postalCode,
                addressCountry: 'IN',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: branch.geo.latitude,
                longitude: branch.geo.longitude,
              },
            })),
          },
          areaServed: [
            ...SEO_AREAS.map(a => ({ '@type': 'AdministrativeArea', name: `${a.name}, Hyderabad` })),
            { '@type': 'AdministrativeArea', name: 'Tolichowki, Hyderabad' },
            { '@type': 'AdministrativeArea', name: 'Shaikpet, Hyderabad' },
            { '@type': 'AdministrativeArea', name: 'Puppalaguda, Hyderabad' },
            { '@type': 'AdministrativeArea', name: 'Gachibowli, Hyderabad' },
            { '@type': 'AdministrativeArea', name: 'Hitec City, Hyderabad' },
          ],
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: s.pricingDisplay?.match(/\d+/)?.[0] || '40',
            description: s.pricingDisplay,
            url: `${BASE_URL}/services/${s.slug}`,
            availability: 'https://schema.org/InStock',
          },
          hasOfferCatalog: (s.rateCard && s.rateCard.length > 0) ? {
            '@type': 'OfferCatalog',
            name: `${s.name} Rate Card & Price List`,
            itemListElement: s.rateCard.map((item, index) => ({
              '@type': 'Offer',
              position: index + 1,
              name: item.item,
              description: item.details,
              price: item.rate.match(/\d+/)?.[0] || '40',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: `${BASE_URL}/services/${s.slug}`,
            })),
          } : undefined,
        },
        {
          '@type': 'FAQPage',
          mainEntity: serviceFaqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        },
      ],
    };

    const serviceMainHtml = `
      <main id="techwash-static-seo" style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #1F2937; line-height: 1.6;">
        <nav style="font-size: 13px; color: #64748B; margin-bottom: 16px;">
          <a href="/" style="color: #64748B; text-decoration: none;">Home</a> &gt; 
          <a href="/services" style="color: #64748B; text-decoration: none;">Services</a> &gt; 
          <span style="color: #EA580C; font-weight: bold;">${escapeHtml(s.name)} Near Me</span>
        </nav>

        <header style="margin-bottom: 32px;">
          <p style="color: #EA580C; font-weight: 800; text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em; margin-bottom: 8px;">
            ✦ Rated #1 Fabric Care Near You • 0 PPM RO Soft Water • Flat 20% Off
          </p>
          <h1 style="font-size: 36px; line-height: 1.2; font-weight: 900; color: #111827; margin: 0 0 16px 0;">
            ${escapeHtml(s.h1 || `Best ${s.name} Near Me in Manikonda & Hyderabad`)}
          </h1>
          <p style="font-size: 18px; color: #4B5563; max-width: 900px; margin: 0 0 16px 0;">
            ${escapeHtml(s.metaDescription)}
          </p>
          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #9A3412; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
            <div>
              <strong>Pricing:</strong> <span style="font-size: 16px; font-weight: 800; color: #EA580C;">${escapeHtml(s.pricingDisplay)}</span> |
              <strong>Special Offer:</strong> <span style="font-weight: 800; color: #047857;">Flat 20% Off</span> |
              <strong>Turnaround:</strong> Standard 48 Hours (Express 24h Available) |
              <strong>Hotline:</strong> <a href="tel:+916304845567" style="color: #EA580C; font-weight: bold;">+91 63048 45567</a>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="/book-pickup?service=${s.slug}" style="display: inline-block; padding: 8px 16px; background: #EA580C; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
                Schedule Pickup Now →
              </a>
              <a href="https://wa.me/916304845567?text=${encodeURIComponent(`Hello Techwash, I want to book ${s.name} with Flat 20% Off.`)}" style="display: inline-block; padding: 8px 16px; background: #25D366; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
                WhatsApp Booking
              </a>
            </div>
          </div>
        </header>

        <section style="margin-bottom: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px;">
          <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
            How Our ${escapeHtml(s.name)} Works Near You
          </h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            ${escapeHtml(s.processSummary)}
          </p>
          <ul style="padding-left: 20px; font-size: 14px; color: #475569; margin: 0;">
            <li style="margin-bottom: 8px;">100% Demineralized 0 PPM RO soft water preventing fabric yellowing and stiffness.</li>
            <li style="margin-bottom: 8px;">Single-customer isolated wash drums — garments are never mixed with other orders.</li>
            <li style="margin-bottom: 8px;">Certified European non-toxic eco hydrocarbon dry cleaning with zero PERC chemical odors.</li>
            <li style="margin-bottom: 8px;">Precision 3D tension steam form pressing without flat iron scorch marks or heat shine.</li>
            <li style="margin-bottom: 8px;">Doorstep digital weighing with calibrated scales and instant WhatsApp receipts.</li>
          </ul>
        </section>

        ${generateRateCardHtml(s.rateCard, `${s.name} Near Me`)}

        <div style="margin: 28px 0; padding: 16px 20px; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; font-size: 14px; color: #9A3412;">
          📍 <strong>Looking for hyper-local doorstep service in Manikonda?</strong> Check out our dedicated <a href="/areas/manikonda/${s.slug}" style="color: #EA580C; font-weight: bold; text-decoration: underline;">${escapeHtml(s.name)} in Manikonda (500089)</a> page with scheduled daily pickup across Secretariat Colony, OU Colony, Lanco Hills, and Puppalaguda.
        </div>

        ${generateManikondaLandmarksHtml(s.name)}
        ${generateAreasServedHtml()}
        ${generateBranchHtml()}
        ${generateFaqHtml(serviceFaqs)}
      </main>
    `;

    const serviceHtml = buildHtmlPage(baseTemplate, {
      title: s.nearMeTitle || `#1 Best ${s.name} Near Me in Manikonda, Hyderabad (Flat 20% Off) | Techwash`,
      description: s.metaDescription,
      keywords: serviceKeywords,
      canonicalUrl: `${BASE_URL}/services/${s.slug}`,
      structuredData: serviceStructuredData,
      mainHtml: serviceMainHtml,
    });

    fs.writeFileSync(path.join(serviceSubDir, 'index.html'), serviceHtml, 'utf-8');
    generatedCount++;
    console.log(`   ✅ dist/services/${s.slug}/index.html generated.`);
  }

  // ----------------------------------------------------
  // 3. Pre-render Manikonda Area Hub: /areas/manikonda
  // ----------------------------------------------------
  console.log('📁 Pre-rendering /areas/manikonda...');
  const manikondaDir = path.join(DIST_DIR, 'areas/manikonda');
  fs.mkdirSync(manikondaDir, { recursive: true });

  const manikondaArea = SEO_AREAS[0];
  const manikondaKeywords = manikondaArea.keywords;

  const manikondaStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Areas', item: `${BASE_URL}/areas` },
          { '@type': 'ListItem', position: 3, name: 'Manikonda', item: `${BASE_URL}/areas/manikonda` },
        ],
      },
      {
        '@type': 'DryCleaningOrLaundry',
        '@id': `${BASE_URL}/areas/manikonda#localbusiness`,
        name: 'Techwash Laundry Services - Manikonda',
        telephone: BUSINESS_INFO.telephone,
        url: `${BASE_URL}/areas/manikonda`,
        logo: BUSINESS_INFO.logo,
        image: BUSINESS_INFO.image,
        priceRange: BUSINESS_INFO.priceRange,
        address: BUSINESS_INFO.address,
        geo: BUSINESS_INFO.geo,
        hasMap: 'https://www.google.com/maps/search/?api=1&query=Tech+Wash+Laundry+Services+Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089',
        aggregateRating: AGGREGATE_RATING,
        review: CUSTOMER_REVIEWS,
        openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
        department: BUSINESS_BRANCHES.map(branch => ({
          '@type': 'DryCleaningOrLaundry',
          name: branch.name,
          telephone: branch.telephone,
          address: {
            '@type': 'PostalAddress',
            streetAddress: branch.address,
            addressLocality: branch.locality,
            addressRegion: 'Telangana',
            postalCode: branch.postalCode,
            addressCountry: 'IN',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: branch.geo.latitude,
            longitude: branch.geo.longitude,
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: manikondaArea.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  const manikondaMainHtml = `
    <main id="techwash-static-seo" style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #1F2937; line-height: 1.6;">
      <header style="margin-bottom: 32px;">
        <p style="color: #EA580C; font-weight: 800; text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em; margin-bottom: 8px;">
          ✦ Rated #1 Best Laundry in Manikonda 500089 • Flat 20% Off • Free Doorstep Pickup
        </p>
        <h1 style="font-size: 38px; line-height: 1.15; font-weight: 900; color: #111827; margin: 0 0 16px 0;">
          Best Laundry Service in Manikonda, Hyderabad - Techwash
        </h1>
        <p style="font-size: 18px; color: #4B5563; max-width: 900px; margin: 0 0 16px 0;">
          ${escapeHtml(manikondaArea.introText)}
        </p>
        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #9A3412;">
          <strong>Manikonda Doorstep Hotline:</strong> <a href="tel:+916304845567" style="color: #EA580C; font-weight: bold;">+91 63048 45567</a> |
          <strong>Store Address:</strong> Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad 500089 |
          <strong>Hours:</strong> 8:00 AM – 9:00 PM (Daily)
        </div>
      </header>

      <section style="margin-bottom: 32px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 16px;">
          Manikonda Specialized Service Landing Pages & Rates
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
          <thead>
            <tr style="background: #F3F4F6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Manikonda Service</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Starting Rate</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Process Details</th>
              <th style="padding: 10px; border: 1px solid #E5E7EB;">Landing Page</th>
            </tr>
          </thead>
          <tbody>
            ${SEO_SERVICES.map(s => `
              <tr>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">
                  <a href="/areas/manikonda/${s.slug}" style="color: #EA580C; font-weight: bold; text-decoration: none;">
                    ${escapeHtml(s.name)} in Manikonda
                  </a>
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; font-weight: 700; color: #1E293B;">
                  ${escapeHtml(s.pricingDisplay)}
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB; color: #4B5563;">
                  ${escapeHtml(s.processSummary)}
                </td>
                <td style="padding: 10px; border: 1px solid #E5E7EB;">
                  <a href="/areas/manikonda/${s.slug}" style="display: inline-block; padding: 4px 10px; background: #EA580C; color: #FFFFFF; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                    View Page →
                  </a>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      ${generateManikondaLandmarksHtml('Manikonda Laundry Services')}
      ${generateBranchHtml()}
      ${generateFaqHtml(manikondaArea.faqs)}
    </main>
  `;

  const manikondaHtml = buildHtmlPage(baseTemplate, {
    title: '#1 Best Laundry & Dry Cleaners in Manikonda, Hyderabad (Flat 20% Off) | Techwash',
    description: manikondaArea.metaDescription,
    keywords: manikondaKeywords,
    canonicalUrl: `${BASE_URL}/areas/manikonda`,
    structuredData: manikondaStructuredData,
    mainHtml: manikondaMainHtml,
  });

  fs.writeFileSync(path.join(manikondaDir, 'index.html'), manikondaHtml, 'utf-8');
  generatedCount++;
  console.log('   ✅ dist/areas/manikonda/index.html generated.');

  // ----------------------------------------------------
  // 4. Pre-render 11 Manikonda Service Landing Pages: /areas/manikonda/:slug
  // ----------------------------------------------------
  for (const s of SEO_SERVICES) {
    console.log(`📁 Pre-rendering /areas/manikonda/${s.slug}...`);
    const areaServiceSubDir = path.join(manikondaDir, s.slug);
    fs.mkdirSync(areaServiceSubDir, { recursive: true });

    const title = s.manikondaTitle || `#1 Best ${s.name} in Manikonda, Hyderabad (500089) - Flat 20% Off | Techwash`;
    const description = s.manikondaDescription || `Looking for the best ${s.name.toLowerCase()} in Manikonda? Techwash Laundry provides 100% 0 PPM RO soft water care, certified eco hydrocarbon dry cleaning, and free doorstep pickup across Puppalaguda, Secretariat Colony, and Lanco Hills. Flat 20% Off on your first order.`;
    const canonicalUrl = `${BASE_URL}/areas/manikonda/${s.slug}`;
    const keywords = [
      s.primaryKeyword,
      s.secondaryKeywords,
      `${s.name.toLowerCase()} in manikonda`,
      `best ${s.name.toLowerCase()} in manikonda`,
      `${s.name.toLowerCase()} manikonda`,
      `${s.name.toLowerCase()} near me manikonda`,
      `dry cleaners near me manikonda`,
      `laundry near manikonda`,
      `${s.name.toLowerCase()} puppalaguda`,
      `${s.name.toLowerCase()} secretariat colony`,
      `${s.name.toLowerCase()} lanco hills`,
      `${s.name.toLowerCase()} alkapoor township`,
      `${s.name.toLowerCase()} shaikpet 500089`,
      ...(s.nearMeKeywords || [])
    ].filter(Boolean).join(', ');

    const manikondaServiceFaqs = (s.manikondaFaqs && s.manikondaFaqs.length > 0) ? s.manikondaFaqs : generateManikondaFaqsForService(s);

    const areaServiceStructuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Manikonda', item: `${BASE_URL}/areas/manikonda` },
            { '@type': 'ListItem', position: 3, name: `${s.name} in Manikonda`, item: canonicalUrl },
          ],
        },
        {
          '@type': 'Service',
          '@id': `${canonicalUrl}#service`,
          name: `Best ${s.name} in Manikonda`,
          alternateName: [
            `${s.name} in Manikonda`,
            `Best ${s.name} Near Me Manikonda`,
            `${s.name} Manikonda 500089`,
            `${s.name} Puppalaguda`,
            `${s.name} Lanco Hills`
          ],
          serviceType: `${s.name} in Manikonda (500089)`,
          category: s.category || 'Garment Care',
          description: description,
          aggregateRating: AGGREGATE_RATING,
          review: CUSTOMER_REVIEWS,
          provider: {
            '@type': 'DryCleaningOrLaundry',
            name: `${BUSINESS_INFO.name} - Manikonda`,
            telephone: BUSINESS_INFO.telephone,
            url: canonicalUrl,
            logo: BUSINESS_INFO.logo,
            image: BUSINESS_INFO.image,
            priceRange: BUSINESS_INFO.priceRange,
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda',
              addressLocality: 'Manikonda, Hyderabad',
              addressRegion: 'Telangana',
              postalCode: '500089',
              addressCountry: 'IN',
            },
            geo: BUSINESS_INFO.geo,
            hasMap: 'https://www.google.com/maps/search/?api=1&query=Tech+Wash+Laundry+Services+Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089',
            aggregateRating: AGGREGATE_RATING,
            review: CUSTOMER_REVIEWS,
            openingHoursSpecification: BUSINESS_INFO.openingHoursSpecification,
          },
          areaServed: [
            { '@type': 'AdministrativeArea', name: 'Manikonda, Hyderabad (500089)' },
            { '@type': 'AdministrativeArea', name: 'Puppalaguda, Hyderabad (500089)' },
            { '@type': 'AdministrativeArea', name: 'Secretariat Colony, Manikonda' },
            { '@type': 'AdministrativeArea', name: 'OU Colony, Manikonda' },
            { '@type': 'AdministrativeArea', name: 'Lanco Hills, Manikonda' },
            { '@type': 'AdministrativeArea', name: 'Alkapoor Township, Manikonda' },
            { '@type': 'AdministrativeArea', name: 'Shaikpet, Hyderabad (500089)' },
          ],
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: s.pricingDisplay?.match(/\d+/)?.[0] || '40',
            description: s.pricingDisplay,
            url: canonicalUrl,
            availability: 'https://schema.org/InStock',
          },
          hasOfferCatalog: (s.rateCard && s.rateCard.length > 0) ? {
            '@type': 'OfferCatalog',
            name: `${s.name} Rate Card in Manikonda`,
            itemListElement: s.rateCard.map((item, index) => ({
              '@type': 'Offer',
              position: index + 1,
              name: item.item,
              description: item.details,
              price: item.rate.match(/\d+/)?.[0] || '40',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            })),
          } : undefined,
        },
        {
          '@type': 'FAQPage',
          mainEntity: manikondaServiceFaqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        },
      ],
    };

    const areaServiceMainHtml = `
      <main id="techwash-static-seo" style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #1F2937; line-height: 1.6;">
        <nav style="font-size: 13px; color: #64748B; margin-bottom: 16px;">
          <a href="/" style="color: #64748B; text-decoration: none;">Home</a> &gt; 
          <a href="/areas/manikonda" style="color: #64748B; text-decoration: none;">Manikonda Hub</a> &gt; 
          <span style="color: #EA580C; font-weight: bold;">${escapeHtml(s.name)} in Manikonda</span>
        </nav>

        <header style="margin-bottom: 32px;">
          <p style="color: #EA580C; font-weight: 800; text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em; margin-bottom: 8px;">
            ✦ Rated #1 in Manikonda 500089 • 0 PPM RO Soft Water • Flat 20% Off
          </p>
          <h1 style="font-size: 36px; line-height: 1.2; font-weight: 900; color: #111827; margin: 0 0 16px 0;">
            ${escapeHtml(s.manikondaH1 || `Best ${s.name} in Manikonda, Hyderabad (Near Me)`)}
          </h1>
          <p style="font-size: 18px; color: #4B5563; max-width: 900px; margin: 0 0 16px 0;">
            ${escapeHtml(s.manikondaDescription || description)}
          </p>
          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 14px 18px; font-size: 14px; color: #9A3412; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
            <div>
              <strong>Manikonda Rate:</strong> <span style="font-size: 16px; font-weight: 800; color: #EA580C;">${escapeHtml(s.pricingDisplay)}</span> |
              <strong>Special Offer:</strong> <span style="font-weight: 800; color: #047857;">Flat 20% Off</span> |
              <strong>Pickup Hours:</strong> 8:00 AM – 9:00 PM (All 7 Days) |
              <strong>Hotline:</strong> <a href="tel:+916304845567" style="color: #EA580C; font-weight: bold;">+91 63048 45567</a>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="/book-pickup?locality=Manikonda&service=${s.slug}" style="display: inline-block; padding: 8px 16px; background: #EA580C; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
                Schedule Manikonda Pickup →
              </a>
              <a href="https://wa.me/916304845567?text=${encodeURIComponent(`Hello Techwash, I want to book ${s.name} in Manikonda with Flat 20% Off.`)}" style="display: inline-block; padding: 8px 16px; background: #25D366; color: #FFFFFF; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
                WhatsApp Booking
              </a>
            </div>
          </div>
        </header>

        <section style="margin-bottom: 32px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px;">
          <h2 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
            Why Techwash is Manikonda's #1 Rated ${escapeHtml(s.name)}
          </h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            ${escapeHtml(s.processSummary)}
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 14px; font-weight: bold; color: #EA580C; margin: 0 0 6px 0;">0 PPM RO Demineralized Water</h4>
              <p style="font-size: 12px; color: #64748B; margin: 0;">Preserves fabric elasticity, removes mineral stains, and keeps white shirts brilliant without hard water damage.</p>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 14px; font-weight: bold; color: #EA580C; margin: 0 0 6px 0;">Single-Customer Wash Drums</h4>
              <p style="font-size: 12px; color: #64748B; margin: 0;">100% individual sanitization. Your clothes are never mixed with other households, ensuring complete hygiene.</p>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 14px; font-weight: bold; color: #EA580C; margin: 0 0 6px 0;">European Eco Hydrocarbon Dry Clean</h4>
              <p style="font-size: 12px; color: #64748B; margin: 0;">Zero toxic PERC odors. Gentle on suits, pure silk sarees, and embellished bridal couture.</p>
            </div>
            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 14px; font-weight: bold; color: #EA580C; margin: 0 0 6px 0;">3D Mannequin Steam Finishing</h4>
              <p style="font-size: 12px; color: #64748B; margin: 0;">Tension form steam press with zero heat shine, zero scorch marks, and crisp vacuum table crease locking.</p>
            </div>
          </div>
        </section>

        ${generateRateCardHtml(s.rateCard, `${s.name} in Manikonda`)}

        <div style="margin: 28px 0; padding: 16px 20px; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; font-size: 14px; color: #9A3412;">
          🌐 <strong>Need doorstep laundry pickup in other Hyderabad areas?</strong> View our regional <a href="/services/${s.slug}" style="color: #EA580C; font-weight: bold; text-decoration: underline;">${escapeHtml(s.name)} Near Me</a> page covering Tolichowki, Shaikpet, Puppalaguda, Gachibowli, and Hitec City.
        </div>

        ${generateManikondaLandmarksHtml(s.name)}
        ${generateBranchHtml()}
        ${generateFaqHtml(manikondaServiceFaqs)}
      </main>
    `;

    const areaServiceHtml = buildHtmlPage(baseTemplate, {
      title,
      description,
      keywords,
      canonicalUrl,
      structuredData: areaServiceStructuredData,
      mainHtml: areaServiceMainHtml,
    });

    fs.writeFileSync(path.join(areaServiceSubDir, 'index.html'), areaServiceHtml, 'utf-8');
    generatedCount++;
    console.log(`   ✅ dist/areas/manikonda/${s.slug}/index.html generated.`);
  }

  console.log(`\n🎉 SUCCESS: Successfully pre-rendered ${generatedCount} static HTML SEO pages into dist/!`);
  console.log('   - /services/index.html');
  console.log('   - 11x /services/<slug>/index.html (Targeting "Near Me" search queries)');
  console.log('   - /areas/manikonda/index.html (Manikonda Hub)');
  console.log('   - 11x /areas/manikonda/<slug>/index.html (Targeting "in Manikonda" search queries)');
}

prerenderAll();
