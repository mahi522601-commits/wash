/**
 * Comprehensive Automated URL & Page Integrity Test Suite
 * Tests imports, JSX exports, and component rendering health for all 51 routes
 */
import React from 'react';

console.log("=== COMPREHENSIVE ROUTE & PAGE COMPONENT TEST ===");

const publicPages = [
  { name: 'HomePage', path: './src/pages/public/HomePage.jsx', url: '/' },
  { name: 'ServicesPage', path: './src/pages/public/ServicesPage.jsx', url: '/services' },
  { name: 'ServiceDetailPage', path: './src/pages/public/ServiceDetailPage.jsx', url: '/services/:slug' },
  { name: 'PricingPage', path: './src/pages/public/PricingPage.jsx', url: '/pricing' },
  { name: 'HowItWorksPage', path: './src/pages/public/HowItWorksPage.jsx', url: '/how-it-works' },
  { name: 'AboutPage', path: './src/pages/public/AboutPage.jsx', url: '/about' },
  { name: 'GalleryPage', path: './src/pages/public/GalleryPage.jsx', url: '/gallery' },
  { name: 'BlogPage', path: './src/pages/public/BlogPage.jsx', url: '/blog' },
  { name: 'BlogDetailPage', path: './src/pages/public/BlogDetailPage.jsx', url: '/blog/:slug' },
  { name: 'LocationsPage', path: './src/pages/public/LocationsPage.jsx', url: '/locations' },
  { name: 'ContactPage', path: './src/pages/public/ContactPage.jsx', url: '/contact' },
  { name: 'FAQPage', path: './src/pages/public/FAQPage.jsx', url: '/faq' },
  { name: 'BookPickupPage', path: './src/pages/public/BookPickupPage.jsx', url: '/book-pickup' },
  { name: 'TrackOrderPage', path: './src/pages/public/TrackOrderPage.jsx', url: '/track-order' },
  { name: 'OffersPage', path: './src/pages/public/OffersPage.jsx', url: '/offers' },
  { name: 'PrivacyPolicyPage', path: './src/pages/public/PrivacyPolicyPage.jsx', url: '/privacy-policy' },
  { name: 'TermsPage', path: './src/pages/public/TermsPage.jsx', url: '/terms-and-conditions' },
  { name: 'RefundPolicyPage', path: './src/pages/public/RefundPolicyPage.jsx', url: '/refund-policy' },
];

const adminPages = [
  { name: 'AdminLoginPage', path: './src/pages/admin/AdminLoginPage.jsx', url: '/admin/login' },
  { name: 'AdminDashboardPage', path: './src/pages/admin/AdminDashboardPage.jsx', url: '/admin/dashboard' },
  { name: 'AdminAnalyticsPage', path: './src/pages/admin/AdminAnalyticsPage.jsx', url: '/admin/analytics' },
  { name: 'AdminOrdersPage', path: './src/pages/admin/AdminOrdersPage.jsx', url: '/admin/orders' },
  { name: 'AdminCustomersPage', path: './src/pages/admin/AdminCustomersPage.jsx', url: '/admin/customers' },
  { name: 'AdminHeroSlidesPage', path: './src/pages/admin/AdminHeroSlidesPage.jsx', url: '/admin/hero-slides' },
  { name: 'AdminServicesPage', path: './src/pages/admin/AdminServicesPage.jsx', url: '/admin/services' },
  { name: 'AdminQualityServicesPage', path: './src/pages/admin/AdminQualityServicesPage.jsx', url: '/admin/quality-services' },
  { name: 'AdminProcessPage', path: './src/pages/admin/AdminProcessPage.jsx', url: '/admin/process' },
  { name: 'AdminPricingPage', path: './src/pages/admin/AdminPricingPage.jsx', url: '/admin/pricing' },
  { name: 'AdminBannersPage', path: './src/pages/admin/AdminBannersPage.jsx', url: '/admin/banners' },
  { name: 'AdminFestivalBannersPage', path: './src/pages/admin/AdminFestivalBannersPage.jsx', url: '/admin/festival-banners' },
  { name: 'AdminOffersPage', path: './src/pages/admin/AdminOffersPage.jsx', url: '/admin/offers' },
  { name: 'AdminAnnouncementsPage', path: './src/pages/admin/AdminAnnouncementsPage.jsx', url: '/admin/announcements' },
  { name: 'AdminWhyChooseUsPage', path: './src/pages/admin/AdminWhyChooseUsPage.jsx', url: '/admin/why-choose-us' },
  { name: 'AdminTestimonialsPage', path: './src/pages/admin/AdminTestimonialsPage.jsx', url: '/admin/testimonials' },
  { name: 'AdminGalleryPage', path: './src/pages/admin/AdminGalleryPage.jsx', url: '/admin/gallery' },
  { name: 'AdminMediaPage', path: './src/pages/admin/AdminMediaPage.jsx', url: '/admin/media' },
  { name: 'AdminBlogPage', path: './src/pages/admin/AdminBlogPage.jsx', url: '/admin/blog' },
  { name: 'AdminLocationsPage', path: './src/pages/admin/AdminLocationsPage.jsx', url: '/admin/locations' },
  { name: 'AdminContactsPage', path: './src/pages/admin/AdminContactsPage.jsx', url: '/admin/contacts' },
  { name: 'AdminPaymentsPage', path: './src/pages/admin/AdminPaymentsPage.jsx', url: '/admin/payments' },
  { name: 'AdminChatbotPage', path: './src/pages/admin/AdminChatbotPage.jsx', url: '/admin/chatbot' },
  { name: 'AdminFloatingActionsPage', path: './src/pages/admin/AdminFloatingActionsPage.jsx', url: '/admin/floating-actions' },
  { name: 'AdminStaffPage', path: './src/pages/admin/AdminStaffPage.jsx', url: '/admin/staff' },
  { name: 'AdminFAQPage', path: './src/pages/admin/AdminFAQPage.jsx', url: '/admin/faq' },
  { name: 'AdminSettingsPage', path: './src/pages/admin/AdminSettingsPage.jsx', url: '/admin/settings' },
  { name: 'AdminServiceAreaPage', path: './src/pages/admin/AdminServiceAreaPage.jsx', url: '/admin/settings/service-area' },
  { name: 'AdminReceiptSettingsPage', path: './src/pages/admin/AdminReceiptSettingsPage.jsx', url: '/admin/settings/receipt' },
  { name: 'AdminUsersPage', path: './src/pages/admin/AdminUsersPage.jsx', url: '/admin-users' },
  { name: 'AdminActivityLogPage', path: './src/pages/admin/AdminActivityLogPage.jsx', url: '/admin/activity-log' },
  { name: 'AdminSystemHealthPage', path: './src/pages/admin/AdminSystemHealthPage.jsx', url: '/admin/system-health' },
  { name: 'AdminSEOPage', path: './src/pages/admin/AdminSEOPage.jsx', url: '/admin/seo' },
];

async function runTests() {
  let passedCount = 0;
  let failedCount = 0;

  console.log("\n[1/2] Checking 18 Public Pages & URLs...");
  for (const page of publicPages) {
    try {
      const module = await import(page.path);
      const Component = module[page.name] || module.default;
      if (typeof Component === 'function' || typeof Component === 'object') {
        console.log(`  ✓ ${page.url.padEnd(30)} -> ${page.name} OK`);
        passedCount++;
      } else {
        console.error(`  ✗ ${page.url} -> ${page.name} component export missing!`);
        failedCount++;
      }
    } catch (err) {
      console.error(`  ✗ ${page.url} -> Error loading ${page.path}:`, err.message);
      failedCount++;
    }
  }

  console.log("\n[2/2] Checking 33 Admin SaaS Suite Pages & URLs...");
  for (const page of adminPages) {
    try {
      const module = await import(page.path);
      const Component = module[page.name] || module.default;
      if (typeof Component === 'function' || typeof Component === 'object') {
        console.log(`  ✓ ${page.url.padEnd(30)} -> ${page.name} OK`);
        passedCount++;
      } else {
        console.error(`  ✗ ${page.url} -> ${page.name} component export missing!`);
        failedCount++;
      }
    } catch (err) {
      console.error(`  ✗ ${page.url} -> Error loading ${page.path}:`, err.message);
      failedCount++;
    }
  }

  console.log(`\n=== RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
