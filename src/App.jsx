import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { WorkerAuthProvider } from './context/WorkerAuthContext';

// Helper for named export lazy loading
const lazyNamed = (importFn, name) => lazy(async () => {
  const m = await importFn();
  return { default: m[name] };
});

// Public Layout Components
import { Navbar } from './components/public/Navbar';
import { Footer } from './components/public/Footer';
import { MobileBottomNav } from './components/public/MobileBottomNav';
import { FloatingActionHub } from './components/public/FloatingActionHub';
import { FloatingOffersWidget } from './components/public/FloatingOffersWidget';
import { FirstVisitOfferModal } from './components/public/FirstVisitOfferModal';
import { ChatbotDrawer } from './components/public/ChatbotDrawer';
import { FloatingAppInstallBar } from './components/common/FloatingAppInstallBar';

// Critical Direct Route (Instant Homepage Paint)
import { HomePage } from './pages/public/HomePage';

// Lazy Public Pages (Code-split for lightning performance)
const ServicesPage = lazyNamed(() => import('./pages/public/ServicesPage'), 'ServicesPage');
const ServiceDetailPage = lazyNamed(() => import('./pages/public/ServiceDetailPage'), 'ServiceDetailPage');
const PricingPage = lazyNamed(() => import('./pages/public/PricingPage'), 'PricingPage');
const HowItWorksPage = lazyNamed(() => import('./pages/public/HowItWorksPage'), 'HowItWorksPage');
const AboutPage = lazyNamed(() => import('./pages/public/AboutPage'), 'AboutPage');
const GalleryPage = lazyNamed(() => import('./pages/public/GalleryPage'), 'GalleryPage');
const BlogPage = lazyNamed(() => import('./pages/public/BlogPage'), 'BlogPage');
const BlogDetailPage = lazyNamed(() => import('./pages/public/BlogDetailPage'), 'BlogDetailPage');
const LocationsPage = lazyNamed(() => import('./pages/public/LocationsPage'), 'LocationsPage');
const ContactPage = lazyNamed(() => import('./pages/public/ContactPage'), 'ContactPage');
const FAQPage = lazyNamed(() => import('./pages/public/FAQPage'), 'FAQPage');
const BookPickupPage = lazyNamed(() => import('./pages/public/BookPickupPage'), 'BookPickupPage');
const TrackOrderPage = lazyNamed(() => import('./pages/public/TrackOrderPage'), 'TrackOrderPage');
const OffersPage = lazyNamed(() => import('./pages/public/OffersPage'), 'OffersPage');
const PrivacyPolicyPage = lazyNamed(() => import('./pages/public/PrivacyPolicyPage'), 'PrivacyPolicyPage');
const TermsPage = lazyNamed(() => import('./pages/public/TermsPage'), 'TermsPage');
const RefundPolicyPage = lazyNamed(() => import('./pages/public/RefundPolicyPage'), 'RefundPolicyPage');
const AreasPage = lazyNamed(() => import('./pages/public/AreasPage'), 'AreasPage');
const AreaDetailPage = lazyNamed(() => import('./pages/public/AreaDetailPage'), 'AreaDetailPage');
const AreaServiceDetailPage = lazyNamed(() => import('./pages/public/AreaServiceDetailPage'), 'AreaServiceDetailPage');
const NotFoundPage = lazyNamed(() => import('./pages/public/NotFoundPage'), 'NotFoundPage');

// Lazy Admin Layout & Pages (Isolates heavy SaaS & charting code)
const AdminLayout = lazyNamed(() => import('./components/admin/AdminLayout'), 'AdminLayout');
const AdminLoginPage = lazyNamed(() => import('./pages/admin/AdminLoginPage'), 'AdminLoginPage');
const AdminDashboardPage = lazyNamed(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminAnalyticsPage = lazyNamed(() => import('./pages/admin/AdminAnalyticsPage'), 'AdminAnalyticsPage');
const AdminOrdersPage = lazyNamed(() => import('./pages/admin/AdminOrdersPage'), 'AdminOrdersPage');
const AdminCustomersPage = lazyNamed(() => import('./pages/admin/AdminCustomersPage'), 'AdminCustomersPage');
const AdminServicesPage = lazyNamed(() => import('./pages/admin/AdminServicesPage'), 'AdminServicesPage');
const AdminPricingPage = lazyNamed(() => import('./pages/admin/AdminPricingPage'), 'AdminPricingPage');
const AdminOffersPage = lazyNamed(() => import('./pages/admin/AdminOffersPage'), 'AdminOffersPage');
const AdminGalleryPage = lazyNamed(() => import('./pages/admin/AdminGalleryPage'), 'AdminGalleryPage');
const AdminBlogPage = lazyNamed(() => import('./pages/admin/AdminBlogPage'), 'AdminBlogPage');
const AdminLocationsPage = lazyNamed(() => import('./pages/admin/AdminLocationsPage'), 'AdminLocationsPage');
const AdminPaymentsPage = lazyNamed(() => import('./pages/admin/AdminPaymentsPage'), 'AdminPaymentsPage');
const AdminStaffPage = lazyNamed(() => import('./pages/admin/AdminStaffPage'), 'AdminStaffPage');
const AdminAttendancePage = lazyNamed(() => import('./pages/admin/AdminAttendancePage'), 'AdminAttendancePage');
const AdminBalanceDuePage = lazyNamed(() => import('./pages/admin/AdminBalanceDuePage'), 'AdminBalanceDuePage');
const AdminTasksPage = lazyNamed(() => import('./pages/admin/AdminTasksPage'), 'AdminTasksPage');
const AdminReportsPage = lazyNamed(() => import('./pages/admin/AdminReportsPage'), 'AdminReportsPage');
const AdminExpensesPage = lazyNamed(() => import('./pages/admin/AdminExpensesPage'), 'AdminExpensesPage');
const AdminSettingsPage = lazyNamed(() => import('./pages/admin/AdminSettingsPage'), 'AdminSettingsPage');

// Lazy Worker & Delivery Executive Portal
const WorkerLoginPage = lazyNamed(() => import('./pages/worker/WorkerLoginPage'), 'WorkerLoginPage');
const WorkerLayout = lazyNamed(() => import('./components/worker/WorkerLayout'), 'WorkerLayout');
const WorkerDashboardPage = lazyNamed(() => import('./pages/worker/WorkerDashboardPage'), 'WorkerDashboardPage');

// Lazy In-Store POS Billing Machines
const BillingHubPage = lazyNamed(() => import('./pages/billing/BillingHubPage'), 'BillingHubPage');
const BillingMachinePage = lazyNamed(() => import('./pages/billing/BillingMachinePage'), 'BillingMachinePage');

// Scroll to top helper with instant jump on route or query parameter change
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);
  return null;
};

// Public Website Wrapper Layout
const PublicLayout = ({ children }) => {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { pathname } = useLocation();
  const isHomePage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${!isHomePage ? 'pt-24 sm:pt-28' : ''} pb-20 sm:pb-24 md:pb-0`}>
        {children}
      </main>
      <Footer />
      
      {/* 5-Button Mobile Bottom Navigation */}
      <MobileBottomNav onOpenAssistant={() => setAssistantOpen(true)} />

      {/* Floating Action Hub (WhatsApp, Call, AI Assistant, Google Review) */}
      <FloatingActionHub onOpenAssistant={() => setAssistantOpen(true)} />

      {/* Floating Promotional Offer Bar */}
      <FloatingOffersWidget />

      {/* First Visit Exclusive 20% Off Popup */}
      {pathname !== '/book-pickup' && <FirstVisitOfferModal />}

      {/* Floating PWA / .APK Mobile App Install Bar */}
      <FloatingAppInstallBar />

      {/* Conversational AI Assistant Concierge */}
      <ChatbotDrawer isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <WorkerAuthProvider>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-[#FFF7ED]/30" />}>
              <Routes>
              
              {/* PUBLIC WEBSITE ROUTES */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
              <Route path="/services/:slug" element={<PublicLayout><ServiceDetailPage /></PublicLayout>} />
              <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
              <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/gallery" element={<PublicLayout><GalleryPage /></PublicLayout>} />
              <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
              <Route path="/blog/:slug" element={<PublicLayout><BlogDetailPage /></PublicLayout>} />
              <Route path="/locations" element={<PublicLayout><LocationsPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FAQPage /></PublicLayout>} />
              <Route path="/book-pickup" element={<PublicLayout><BookPickupPage /></PublicLayout>} />
              <Route path="/track-order" element={<PublicLayout><TrackOrderPage /></PublicLayout>} />
              <Route path="/offers" element={<PublicLayout><OffersPage /></PublicLayout>} />
              <Route path="/areas" element={<PublicLayout><AreasPage /></PublicLayout>} />
              <Route path="/areas/:areaSlug" element={<PublicLayout><AreaDetailPage /></PublicLayout>} />
              <Route path="/areas/:areaSlug/:serviceSlug" element={<PublicLayout><AreaServiceDetailPage /></PublicLayout>} />
              {/* LEGACY 301 SLUG MIGRATION REDIRECTS */}
              <Route path="/laundry-pickup-delivery" element={<Navigate to="/services/laundry-pickup-and-delivery" replace />} />
              <Route path="/ironing" element={<Navigate to="/services/ironing-service" replace />} />
              <Route path="/shoe-washing" element={<Navigate to="/services/shoe-cleaning" replace />} />
              <Route path="/curtain-washing" element={<Navigate to="/services/curtain-cleaning" replace />} />
              <Route path="/carpet-washing" element={<Navigate to="/services/carpet-cleaning" replace />} />

              <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicyPage /></PublicLayout>} />
              <Route path="/terms-and-conditions" element={<PublicLayout><TermsPage /></PublicLayout>} />
              <Route path="/refund-policy" element={<PublicLayout><RefundPolicyPage /></PublicLayout>} />

              {/* ADMIN LOGIN */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* PROTECTED ADMIN SAAS SUITE */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="tasks" element={<AdminTasksPage />} />
                <Route path="schedule" element={<AdminTasksPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="pricing" element={<AdminPricingPage />} />
                <Route path="offers" element={<AdminOffersPage />} />
                <Route path="gallery" element={<AdminGalleryPage />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="locations" element={<AdminLocationsPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="balances" element={<AdminBalanceDuePage />} />
                <Route path="balance-due" element={<AdminBalanceDuePage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="reports/30-days" element={<AdminReportsPage />} />
                <Route path="reports/daily" element={<AdminReportsPage />} />
                <Route path="history" element={<AdminReportsPage />} />
                <Route path="settlements" element={<AdminReportsPage />} />
                <Route path="expenses" element={<AdminExpensesPage />} />
                <Route path="pnl" element={<AdminExpensesPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
                <Route path="employees" element={<AdminAttendancePage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* WORKER & DELIVERY EXECUTIVE PORTAL */}
              <Route path="/worker/login" element={<WorkerLoginPage />} />
              <Route path="/worker" element={<WorkerLayout />}>
                <Route index element={<WorkerDashboardPage />} />
                <Route path="dashboard" element={<WorkerDashboardPage />} />
              </Route>

              {/* STANDALONE POS BILLING TERMINAL SUITE */}
              <Route path="/billing" element={<BillingHubPage />} />
              <Route path="/pos" element={<BillingHubPage />} />
              <Route path="/billing/:terminalId" element={<BillingMachinePage />} />
              <Route path="/pos/:terminalId" element={<BillingMachinePage />} />

              {/* Catch-all Fallback */}
              <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />

            </Routes>
            </Suspense>
          </WorkerAuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
