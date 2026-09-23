import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';
import { offerService } from '../../services/offerService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tag, Sparkles, Calendar, Copy, CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';

export const OffersPage = () => {
  const { success } = useToast();
  const [festivalBanners, setFestivalBanners] = useState([]);
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    cmsService.getItems('festivalBanners', { filterActive: true })
      .then(setFestivalBanners)
      .catch(() => {});

    offerService.getActiveOffers()
      .then(setOffers)
      .catch(() => {});
  }, []);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Coupon Copied!', `Code ${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Offers',
            item: `${BASE_URL}/offers`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Special Laundry Offers & Promo Discounts | Tech Wash Hyderabad"
        description="Save on dry cleaning, steam ironing, and wash & fold with Tech Wash exclusive discounts and seasonal coupons in Hyderabad."
        canonicalUrl={`${BASE_URL}/offers`}
        keywords="laundry offers hyderabad, dry cleaning coupon code, techwash discount"
        structuredData={structuredData}
      />
      <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Tag className="w-3.5 h-3.5" />
            <span>Exclusive Savings & Promos</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Special Offers & Promotional Discounts
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Apply active promo codes during checkout or book doorstep pickup directly with automatic discounts.
          </p>
        </div>

        {/* Festival Banners from CMS */}
        {festivalBanners.length > 0 && (
          <div className="space-y-6">
            {festivalBanners.map((banner) => (
              <div key={banner.id} className="rounded-3xl overflow-hidden shadow-luxury border border-slate-200 bg-slate-900">
                <img
                  src={banner.desktopImage || banner.imageUrl}
                  alt={banner.title || 'Festival Offer'}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((c) => (
            <Card key={c.code} variant="luxury" className="p-7 flex flex-col justify-between group border-dashed border-2 border-brand-200">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge variant="emerald" size="md">{c.discountValue}</Badge>
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{c.validTill}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 font-display mb-2">
                  {c.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {c.shortDescription}
                </p>

                <div className="text-[11px] text-slate-500 font-medium">
                  Min order value: <strong className="text-slate-800">{c.minOrder}</strong>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard(c.code)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-xs font-mono font-bold text-slate-800 transition-colors border border-slate-200"
                >
                  {copiedCode === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{c.code}</span>
                </button>

                <Link to={`/book-pickup?coupon=${c.code}${c.associatedServiceSlug ? `&service=${c.associatedServiceSlug}` : ''}`}>
                  <Button variant="primary" size="sm" className="gap-1">
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </div>
    </>
  );
};
