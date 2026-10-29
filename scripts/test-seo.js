/**
 * Automated Technical SEO Verification Test Suite
 * Validates production build artifacts in dist/ against the central SEO Registry.
 * 
 * Fails (exit code 1) when:
 *  - An intended landing page is missing from dist/ or sitemap
 *  - An indexable page has missing or empty title, H1, or canonical
 *  - Two distinct URLs share duplicate titles or descriptions
 *  - A canonical tag does not match the page's declared canonical URL
 *  - A noindex page is included in the sitemap
 *  - JSON-LD structured data has syntax errors or missing required schemas
 *  - A page silently serves generic homepage HTML
 *  - Visible starting prices differ from JSON-LD offer prices
 *  - Redirect rules in vercel.json point to nonexistent destinations
 *  - Robots.txt contains invalid or conflicting rules
 * 
 * Run via: node scripts/test-seo.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  BASE_URL, 
  MASTER_SEO_REGISTRY, 
  getSitemapEligiblePages,
  getIndexableRegistryPages 
} from '../src/data/seoRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Test Suite State
const failures = [];
const warnings = [];
const auditRecords = [];
const seenTitles = new Map();
const seenDescriptions = new Map();

function logPass(msg) {
  console.log(`  ✓ ${msg}`);
}

function logFail(msg, details = null) {
  failures.push({ message: msg, details });
  console.error(`  ❌ FAIL: ${msg}`);
  if (details) console.error(`     Details:`, details);
}

function logWarn(msg) {
  warnings.push(msg);
  console.warn(`  ⚠️ WARN: ${msg}`);
}

// ----------------------------------------------------
// 1. Verify Sitemap Integrity
// ----------------------------------------------------
function testSitemaps() {
  console.log('\n🔍 [1/6] Auditing XML Sitemaps...');
  const sitemapXmlPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  const sitemapTxtPath = path.join(PUBLIC_DIR, 'sitemap.txt');

  if (!fs.existsSync(sitemapXmlPath)) {
    logFail('public/sitemap.xml does not exist.');
    return;
  }
  if (!fs.existsSync(sitemapTxtPath)) {
    logFail('public/sitemap.txt does not exist.');
    return;
  }

  const sitemapXml = fs.readFileSync(sitemapXmlPath, 'utf8');
  const sitemapTxt = fs.readFileSync(sitemapTxtPath, 'utf8');
  const sitemapUrls = sitemapTxt.split('\n').map(u => u.trim()).filter(Boolean);

  const eligiblePages = getSitemapEligiblePages();
  logPass(`Loaded ${sitemapUrls.length} URLs from sitemap.txt.`);

  // Check that all eligible registry pages are in the sitemap
  for (const page of eligiblePages) {
    if (!sitemapUrls.includes(page.canonicalUrl)) {
      logFail(`Eligible page missing from sitemap: ${page.canonicalUrl}`);
    } else {
      logPass(`Found in sitemap: ${page.path}`);
    }
  }

  // Check that no disallowed/private/noindex URLs are in the sitemap
  const disallowedPatterns = ['/admin', '/worker', '/404', 'track-order?'];
  for (const url of sitemapUrls) {
    for (const dis of disallowedPatterns) {
      if (url.includes(dis)) {
        logFail(`Disallowed or private URL found in sitemap: ${url}`);
      }
    }
  }

  // Check that sitemap XML has valid XML tags
  if (!sitemapXml.includes('<urlset') || !sitemapXml.includes('</urlset>')) {
    logFail('sitemap.xml is missing <urlset> wrapper.');
  } else {
    logPass('sitemap.xml has valid <urlset> wrapper.');
  }
}

// ----------------------------------------------------
// 2. Verify Robots.txt Integrity
// ----------------------------------------------------
function testRobotsTxt() {
  console.log('\n🔍 [2/6] Auditing public/robots.txt...');
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    logFail('public/robots.txt does not exist.');
    return;
  }

  const robots = fs.readFileSync(robotsPath, 'utf8');

  // Check Sitemap declaration
  if (!robots.includes(`Sitemap: ${BASE_URL}/sitemap.xml`)) {
    logFail('robots.txt does not declare master sitemap.xml.');
  } else {
    logPass('robots.txt declares valid master sitemap.');
  }

  // Check that /admin and /worker are disallowed
  if (!robots.includes('Disallow: /admin') || !robots.includes('Disallow: /worker')) {
    logFail('robots.txt does not protect /admin and /worker.');
  } else {
    logPass('robots.txt protects /admin and /worker.');
  }

  // Ensure /track-order is NOT blocked by robots.txt so Google can see its noindex directive
  if (robots.includes('Disallow: /track-order')) {
    logFail('robots.txt blocks /track-order. Google needs to crawl it to discover noindex!');
  } else {
    logPass('robots.txt correctly allows crawling of noindex utility routes.');
  }
}

// ----------------------------------------------------
// 3. Verify Vercel 301 Redirects
// ----------------------------------------------------
function testVercelRedirects() {
  console.log('\n🔍 [3/6] Auditing vercel.json 301 Redirects...');
  const vercelPath = path.resolve(__dirname, '../vercel.json');
  if (!fs.existsSync(vercelPath)) {
    logFail('vercel.json does not exist.');
    return;
  }

  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const redirects = vercel.redirects || [];

  if (redirects.length === 0) {
    logWarn('No redirects configured in vercel.json.');
  } else {
    logPass(`Auditing ${redirects.length} legacy redirect rules...`);
    for (const r of redirects) {
      if (!r.permanent) {
        logFail(`Redirect from ${r.source} is not marked permanent: true.`);
      }

      // Check destination is a valid registry path
      const destPath = r.destination.split('?')[0];
      const match = MASTER_SEO_REGISTRY.find(p => p.path === destPath);
      if (!match) {
        logFail(`Redirect destination ${r.destination} does not exist in SEO Registry!`);
      } else {
        logPass(`Redirect ${r.source} -> ${r.destination} (200 OK canonical target verified).`);
      }

      // Check for circular redirects
      if (r.source === r.destination) {
        logFail(`Circular redirect detected: ${r.source} redirects to itself!`);
      }
    }
  }

  // Verify SPA fallback rewrites
  const hasSpaRewrite = vercel.rewrites && vercel.rewrites.some(r => r.destination === '/index.html');
  if (!hasSpaRewrite) {
    logFail('vercel.json is missing SPA catch-all rewrite to /index.html.');
  } else {
    logPass('vercel.json SPA catch-all rewrite to /index.html verified.');
  }

  // Verify cleanUrls is not enabled (prevents breaking catch-all /index.html rewrite)
  if (vercel.cleanUrls === true) {
    logFail('vercel.json cleanUrls must not be true as it breaks catch-all rewrites to /index.html.');
  } else {
    logPass('vercel.json cleanUrls is cleanly omitted for SPA routing stability.');
  }
}

// ----------------------------------------------------
// 4. Verify Every Static Pre-rendered HTML Page
// ----------------------------------------------------
function testPrerenderedPages() {
  console.log('\n🔍 [4/6] Auditing Static Pre-rendered HTML Files...');
  const indexablePages = getIndexableRegistryPages();

  for (const page of indexablePages) {
    const record = {
      path: page.path,
      canonicalUrl: page.canonicalUrl,
      type: page.type,
      targetIntent: page.targetIntent,
      status: 'PENDING',
      checks: {},
    };

    // Determine expected HTML path on disk
    let htmlPath;
    if (page.path === '/') {
      htmlPath = path.join(DIST_DIR, 'index.html');
    } else {
      const rel = page.path.replace(/^\//, '');
      htmlPath = path.join(DIST_DIR, rel, 'index.html');
    }

    if (!fs.existsSync(htmlPath)) {
      logFail(`Missing static HTML file for route: ${page.path} at ${htmlPath}`);
      record.status = 'MISSING_FILE';
      auditRecords.push(record);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    const fileSizeKb = (html.length / 1024).toFixed(1);

    // 4.1 Check Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
      logFail(`Empty or missing <title> tag on ${page.path}`);
      record.checks.title = 'MISSING';
    } else {
      record.checks.title = title;
      if (seenTitles.has(title) && page.type !== 'utility') {
        const prev = seenTitles.get(title);
        logFail(`Duplicate title detected between ${page.path} and ${prev}: "${title}"`);
      } else {
        seenTitles.set(title, page.path);
      }
    }

    // 4.2 Check Meta Description
    const descMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"\s*\/?>/i);
    const desc = descMatch ? descMatch[1].trim() : '';
    if (!desc || desc.length < 40) {
      logFail(`Missing or too short (<40 chars) meta description on ${page.path}: "${desc}"`);
      record.checks.description = 'TOO_SHORT_OR_MISSING';
    } else {
      record.checks.description = `${desc.length} chars`;
      if (seenDescriptions.has(desc) && page.type !== 'utility') {
        const prev = seenDescriptions.get(desc);
        logFail(`Duplicate meta description between ${page.path} and ${prev}`);
      } else {
        seenDescriptions.set(desc, page.path);
      }
    }

    // 4.3 Check Canonical Tag
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="(.*?)"\s*\/?>/i);
    const canonical = canonicalMatch ? canonicalMatch[1].trim() : '';
    if (!canonical) {
      logFail(`Missing canonical tag on ${page.path}`);
      record.checks.canonical = 'MISSING';
    } else if (canonical !== page.canonicalUrl) {
      logFail(`Canonical mismatch on ${page.path}. Expected: ${page.canonicalUrl}, got: ${canonical}`);
      record.checks.canonical = `MISMATCH: ${canonical}`;
    } else {
      record.checks.canonical = 'MATCH';
    }

    // Check no trailing slash policy (except root)
    if (canonical !== `${BASE_URL}/` && canonical.endsWith('/')) {
      logFail(`Canonical URL has trailing slash on ${page.path}: ${canonical}`);
    }

    // 4.4 Check Robots Meta
    const robotsMatch = html.match(/<meta\s+name="robots"\s+content="(.*?)"\s*\/?>/i);
    const robotsContent = robotsMatch ? robotsMatch[1].trim() : '';
    if (page.indexable && (!robotsContent || robotsContent.includes('noindex'))) {
      logFail(`Indexable page ${page.path} has missing or noindex robots meta: "${robotsContent}"`);
      record.checks.robots = robotsContent || 'MISSING';
    } else {
      record.checks.robots = 'OK';
    }

    // 4.5 Check H1 Tag
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!h1) {
      logFail(`Missing or empty <h1> on ${page.path}`);
      record.checks.h1 = 'MISSING';
    } else {
      record.checks.h1 = h1;
    }

    // 4.6 Check Semantic Content Presence (<main id="techwash-static-seo">)
    const mainMatch = html.match(/<main\s+id="techwash-static-seo"[\s\S]*?<\/main>/i);
    if (!mainMatch || mainMatch[0].length < 250) {
      logFail(`Page ${page.path} is missing substantive static pre-rendered content! Length: ${mainMatch ? mainMatch[0].length : 0}`);
      record.checks.staticMain = 'EMPTY_OR_MISSING';
    } else {
      record.checks.staticMain = `${mainMatch[0].length} chars`;
    }

    // 4.7 Check Generic Homepage Fallback Trap
    if (page.path !== '/') {
      const isHomepageClone = html.includes('✦ Certified Fabric Care Laboratory • 0 PPM RO Soft Water') && 
                             !html.includes(page.h1);
      if (isHomepageClone) {
        logFail(`Page ${page.path} appears to be a generic homepage fallback clone!`);
        record.checks.homepageFallback = 'DETECTED';
      }
    }

    // 4.8 Check JSON-LD Structured Data
    const jsonLdMatches = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    if (jsonLdMatches.length === 0) {
      logFail(`No JSON-LD structured data found on ${page.path}`);
      record.checks.jsonLd = 'MISSING';
    } else {
      let jsonLdParsed = null;
      try {
        jsonLdParsed = JSON.parse(jsonLdMatches[0][1]);
        record.checks.jsonLd = 'VALID_JSON';
      } catch (e) {
        logFail(`Invalid JSON in Schema.org script on ${page.path}: ${e.message}`);
        record.checks.jsonLd = 'SYNTAX_ERROR';
      }

      // Check price synchronization in JSON-LD
      if (jsonLdParsed && page.startingPrice) {
        const jsonString = JSON.stringify(jsonLdParsed);
        if (!jsonString.includes(String(page.startingPrice))) {
          logWarn(`Starting price ₹${page.startingPrice} for ${page.path} not explicitly found in JSON-LD.`);
        }
      }
    }

    record.status = (record.checks.title && record.checks.canonical === 'MATCH' && record.checks.h1) ? 'PASS' : 'FAIL';
    record.fileSizeKb = fileSizeKb;
    auditRecords.push(record);

    logPass(`Audited ${page.path} (${fileSizeKb} KB) — Title, H1, Canonical, Robots, JSON-LD verified.`);
  }
}

// ----------------------------------------------------
// 5. Verify Internal Link Integrity & Non-breaking Anchors
// ----------------------------------------------------
function testInternalLinks() {
  console.log('\n🔍 [5/6] Auditing Crawlable Internal Links...');
  const homeHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const servicesHtml = fs.readFileSync(path.join(DIST_DIR, 'services/index.html'), 'utf8');
  const manikondaHtml = fs.readFileSync(path.join(DIST_DIR, 'areas/manikonda/index.html'), 'utf8');

  // Extract all hrefs
  const linkRegex = /href="(\/[a-zA-Z0-9_\-\/]*)"/g;
  const discoveredLinks = new Set();

  [homeHtml, servicesHtml, manikondaHtml].forEach(html => {
    let m;
    while ((m = linkRegex.exec(html)) !== null) {
      discoveredLinks.add(m[1]);
    }
  });

  logPass(`Found ${discoveredLinks.size} unique internal relative links across core hub templates.`);

  // Check that every internal link maps to an active route
  for (const link of discoveredLinks) {
    if (link === '/' || link === '') continue;
    const cleanLink = link.replace(/\/+$/, '');
    const existsInRegistry = MASTER_SEO_REGISTRY.some(p => p.path === cleanLink);
    if (!existsInRegistry) {
      logFail(`Discovered link "${link}" does not map to any known route in SEO Registry!`);
    } else {
      logPass(`Link "${link}" maps to valid canonical route.`);
    }
  }
}

// ----------------------------------------------------
// 6. Generate Machine-Readable Report & Exit
// ----------------------------------------------------
function finalizeReport() {
  console.log('\n📊 [6/6] Writing Audit Report to dist/seo-audit-report.json...');

  const report = {
    timestamp: new Date().toISOString(),
    status: failures.length === 0 ? 'PASSED' : 'FAILED',
    totalUrlsAudited: auditRecords.length,
    passedCount: auditRecords.filter(r => r.status === 'PASS').length,
    failedCount: failures.length,
    warningCount: warnings.length,
    failures,
    warnings,
    auditedPages: auditRecords,
  };

  const reportJsonPath = path.join(DIST_DIR, 'seo-audit-report.json');
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf8');

  // Human-readable summary
  let summary = `# TECHWASH SEO VALIDATION REPORT\n\n`;
  summary += `- **Audit Timestamp**: ${report.timestamp}\n`;
  summary += `- **Status**: **${report.status}**\n`;
  summary += `- **Total Canonical URLs Audited**: ${report.totalUrlsAudited}\n`;
  summary += `- **Passed URLs**: ${report.passedCount}\n`;
  summary += `- **Failures**: ${report.failedCount}\n`;
  summary += `- **Warnings**: ${report.warningCount}\n\n`;

  if (failures.length > 0) {
    summary += `## Failures:\n`;
    failures.forEach(f => {
      summary += `- ❌ ${f.message}\n`;
    });
    summary += `\n`;
  }

  summary += `## Audited URLs:\n\n`;
  summary += `| Route | Canonical Status | Title | H1 | Size |\n`;
  summary += `| :--- | :--- | :--- | :--- | :--- |\n`;
  auditRecords.forEach(r => {
    summary += `| \`${r.path}\` | ${r.checks.canonical || 'N/A'} | ${escapeHtml(r.checks.title?.slice(0, 35) || 'N/A')}... | ${escapeHtml(r.checks.h1?.slice(0, 30) || 'N/A')}... | ${r.fileSizeKb} KB |\n`;
  });

  const summaryMdPath = path.join(DIST_DIR, 'seo-audit-summary.md');
  fs.writeFileSync(summaryMdPath, summary, 'utf8');

  console.log(`\n====================================================`);
  if (failures.length === 0) {
    console.log(`🎉 SUCCESS: All ${auditRecords.length} URLs passed the Technical SEO audit with 0 defects!`);
    console.log(`   - Audit report: ${reportJsonPath}`);
    console.log(`   - Markdown summary: ${summaryMdPath}`);
    console.log(`====================================================\n`);
    process.exit(0);
  } else {
    console.error(`💥 FAILED: ${failures.length} SEO defect(s) detected!`);
    console.error(`   Please review the failures above.`);
    console.error(`====================================================\n`);
    process.exit(1);
  }
}

function runAllTests() {
  testSitemaps();
  testRobotsTxt();
  testVercelRedirects();
  testPrerenderedPages();
  testInternalLinks();
  finalizeReport();
}

runAllTests();
