import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/seo/SEOHead';
import { Button } from '../../components/ui/Button';
import { BASE_URL, BUSINESS_INFO } from '../../data/seoData';
import { MapPin, Phone, Calendar, ArrowRight, Home, Sparkles } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <>
      <SEOHead
        title="Page Not Found (404) | Techwash Laundry Services"
        description="The requested page could not be found. Looking for premium laundry, dry cleaning, or steam ironing in Manikonda, Hyderabad? Explore our full service menu."
        canonicalUrl={`${BASE_URL}/404`}
        noindex={true}
      />

      <div className="py-20 sm:py-28 bg-slate-50 min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>404 Error • Page Not Found</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
              Looking for Garment Care?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              The page you are looking for might have been moved, renamed, or doesn't exist. Our doorstep laundry and eco dry cleaning fleet is active across Manikonda and Hyderabad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link to="/services" className="w-full">
              <Button variant="primary" size="md" icon={Sparkles} className="w-full justify-center">
                Explore Services
              </Button>
            </Link>
            <Link to="/book-pickup" className="w-full">
              <Button variant="secondary" size="md" icon={Calendar} className="w-full justify-center">
                Book Doorstep Pickup
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>•</span>
            <Link to="/areas/manikonda" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>Manikonda Hub</span>
            </Link>
            <span>•</span>
            <a href="tel:6304845567" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline: +91 63048 45567</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
