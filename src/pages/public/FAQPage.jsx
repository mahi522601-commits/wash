import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { FAQSection } from '../../components/public/FAQSection';
import { Sparkles, HelpCircle } from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';

export const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    cmsService.getItems('faqs', { filterActive: true })
      .then(setFaqs)
      .catch(() => {});
  }, []);

  const defaultFaqs = [
    {
      question: 'What is the turnaround time for laundry and dry cleaning?',
      answer: 'Standard delivery is 48 hours. Express 24-hour service is available for urgent laundry and steam ironing.',
    },
    {
      question: 'Do you use softened water for washing?',
      answer: 'Yes, 100% of our wash cycles use demineralized 0 PPM RO soft water combined with enzyme-rich bio-detergents.',
    },
    {
      question: 'Is there a minimum order amount for free doorstep pickup?',
      answer: 'Doorstep pickup is available across West Hyderabad with free delivery on orders above ₹299.',
    },
    {
      question: 'How do I pay for my laundry order?',
      answer: 'You can pay online via UPI, Google Pay, PhonePe, credit/debit cards, net banking, or cash upon delivery.',
    },
  ];

  const activeFaqList = faqs && faqs.length > 0 ? faqs : defaultFaqs;

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
            name: 'FAQs',
            item: `${BASE_URL}/faq`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: activeFaqList.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Frequently Asked Questions — Laundry & Dry Cleaning | Tech Wash Hyderabad"
        description="Got questions about Tech Wash? Find answers about turnaround times, RO soft water washing, eco-friendly hydrocarbon dry cleaning, pricing, and doorstep pickup in Hyderabad."
        canonicalUrl={`${BASE_URL}/faq`}
        keywords="laundry faqs hyderabad, dry cleaning questions, doorstep laundry pickup timing"
        structuredData={structuredData}
      />
      <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQSection faqs={faqs} />
        </div>
      </div>
    </>
  );
};
