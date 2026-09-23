import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Sparkles, ShieldCheck, Droplets, Award, Calendar, Users, HeartHandshake } from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL, BUSINESS_INFO } from '../../data/seoData';

export const AboutPage = () => {
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
            name: 'About Us',
            item: `${BASE_URL}/about`,
          },
        ],
      },
      {
        '@type': 'AboutPage',
        '@id': `${BASE_URL}/about#webpage`,
        url: `${BASE_URL}/about`,
        name: 'About Tech Wash Laundry Services',
        description: 'Learn about Tech Wash, Hyderabad’s premier garment care ecosystem specializing in European hydrocarbon dry cleaning and RO soft water washing.',
        mainEntity: {
          '@type': 'Organization',
          name: BUSINESS_INFO.name,
          url: BASE_URL,
          logo: BUSINESS_INFO.logo,
          telephone: BUSINESS_INFO.telephone,
          email: BUSINESS_INFO.email,
          address: BUSINESS_INFO.address,
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="About Us — Next-Gen Garment Care & Dry Cleaning | Tech Wash Hyderabad"
        description="Learn about Tech Wash Laundry Services in Hyderabad. Over 9+ years of experience and 10,000+ happy customers with zero-mixing RO soft water laundry and eco-safe dry cleaning."
        canonicalUrl={`${BASE_URL}/about`}
        keywords="about tech wash, laundry hyderabad story, eco friendly dry clean hyderabad, professional garment care"
        structuredData={structuredData}
      />
      <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Philosophy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            About Tech Wash Laundry Services
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Crafting India’s most technologically advanced, hygienic, and convenient garment care ecosystem.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5 text-sm sm:text-base text-slate-600 leading-relaxed">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              Elevating the Standard of Everyday Garment Care
            </h2>
            <p>
              Traditional laundry services in India have long relied on harsh municipal tap water, generic powders, and open-flame iron boxes that scorch natural fibers and cause colors to fade prematurely.
            </p>
            <p>
              <strong className="text-slate-900">Tech Wash</strong> was engineered to bridge this gap. We combine European enclosed dry-cleaning systems, in-house soft water filtration, bio-enzyme detergents, and intelligent doorstep dispatch to deliver a truly luxurious, zero-stress customer experience.
            </p>
            <p>
              From everyday office shirts to bridal silk lehengas and limited-edition sneakers, our certified garment specialists treat each piece with laboratory precision.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3] bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80"
                alt="Tech Wash facility"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          <Card variant="luxury" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Soft Water Science</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We soften wash water down to optimal mineral levels, ensuring detergents rinse clean without leaving stiff chalky residues.
            </p>
          </Card>

          <Card variant="luxury" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Zero Mixing Policy</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every customer load is processed in sanitized, independent wash drums to maintain 100% individual hygiene standards.
            </p>
          </Card>

          <Card variant="luxury" className="p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-display">Eco-Safe Chemistry</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We exclusively utilize eco-certified biodegradable solvents that are gentle on garments, skin, and the environment.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link to="/book-pickup">
            <Button variant="primary" size="lg" icon={Calendar}>
              Experience Tech Wash Today
            </Button>
          </Link>
        </div>

      </div>
    </div>
    </>
  );
};
