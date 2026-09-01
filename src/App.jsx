import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';

// Public Layout Components
import { Navbar } from './components/public/Navbar';
import { Footer } from './components/public/Footer';
import { MobileBottomNav } from './components/public/MobileBottomNav';
import { FloatingActionHub } from './components/public/FloatingActionHub';
import { FloatingOffersWidget } from './components/public/FloatingOffersWidget';
import { FirstVisitOfferModal } from './components/public/FirstVisitOfferModal';
import { ChatbotDrawer } from './components/public/ChatbotDrawer';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { PricingPage } from './pages/public/PricingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AboutPage } from './pages/public/AboutPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { BlogPage } from './pages/public/BlogPage';
import { BlogDetailPage } from './pages/public/BlogDetailPage';
import { LocationsPage } from './pages/public/LocationsPage';
import { ContactPage } from './pages/public/ContactPage';
import { FAQPage } from './pages/public/FAQPage';
import { BookPickupPage } from './pages/public/BookPickupPage';
import { TrackOrderPage } from './pages/public/TrackOrderPage';
import { OffersPage } from './pages/public/OffersPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { RefundPolicyPage } from './pages/public/RefundPolicyPage';

// Admin Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminHeroSlidesPage } from './pages/admin/AdminHeroSlidesPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminQualityServicesPage } from './pages/admin/AdminQualityServicesPage';
import { AdminProcessPage } from './pages/admin/AdminProcessPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminFestivalBannersPage } from './pages/admin/AdminFestivalBannersPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminWhyChooseUsPage } from './pages/admin/AdminWhyChooseUsPage';
import { AdminTestimonialsPage } from './pages/admin/AdminTestimonialsPage';
import { AdminGalleryPage } from './pages/admin/AdminGalleryPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminBlogPage } from './pages/admin/AdminBlogPage';
import { AdminLocationsPage } from './pages/admin/AdminLocationsPage';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminChatbotPage } from './pages/admin/AdminChatbotPage';
import { AdminFloatingActionsPage } from './pages/admin/AdminFloatingActionsPage';
import { AdminOffersPage } from './pages/admin/AdminOffersPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminFAQPage } from './pages/admin/AdminFAQPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminServiceAreaPage } from './pages/admin/AdminServiceAreaPage';
import { AdminReceiptSettingsPage } from './pages/admin/AdminReceiptSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminActivityLogPage } from './pages/admin/AdminActivityLogPage';
import { AdminSystemHealthPage } from './pages/admin/AdminSystemHealthPage';
import { AdminSEOPage } from './pages/admin/AdminSEOPage';

// Scroll to top helper with instant jump on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
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
      <main className={`flex-1 ${!isHomePage ? 'pt-24 sm:pt-28' : ''}`}>
        {children}
      </main>
      <Footer />
      
      {/* 5-Button Mobile Bottom Navigation */}
      <MobileBottomNav onOpenAssistant={() => setAssistantOpen(true)} />

      {/* Floating Action Hub (WhatsApp, Call, AI Assistant, Google Review) */}
      <FloatingActionHub onOpenAssistant={() => setAssistantOpen(true)} />

      {/* Premium Floating Special Offers Widget */}
      <FloatingOffersWidget />

      {/* Premium First-Visit 1:1 Square Campaign Offer Modal */}
      <FirstVisitOfferModal />

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
          <ScrollToTop />
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
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="quality-services" element={<AdminQualityServicesPage />} />
              <Route path="process" element={<AdminProcessPage />} />
              <Route path="pricing" element={<AdminPricingPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
              <Route path="festival-banners" element={<AdminFestivalBannersPage />} />
              <Route path="offers" element={<AdminOffersPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="why-choose-us" element={<AdminWhyChooseUsPage />} />
              <Route path="testimonials" element={<AdminTestimonialsPage />} />
              <Route path="gallery" element={<AdminGalleryPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="blog" element={<AdminBlogPage />} />
              <Route path="locations" element={<AdminLocationsPage />} />
              <Route path="contacts" element={<AdminContactsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="chatbot" element={<AdminChatbotPage />} />
              <Route path="floating-actions" element={<AdminFloatingActionsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
              <Route path="faq" element={<AdminFAQPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="settings/service-area" element={<AdminServiceAreaPage />} />
              <Route path="settings/receipt" element={<AdminReceiptSettingsPage />} />
              <Route path="admin-users" element={<AdminUsersPage />} />
              <Route path="activity-log" element={<AdminActivityLogPage />} />
              <Route path="system-health" element={<AdminSystemHealthPage />} />
              <Route path="seo" element={<AdminSEOPage />} />
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<PublicLayout><HomePage /></PublicLayout>} />

          </Routes>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
