import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { FAQSection } from '../../components/public/FAQSection';
import { Sparkles, HelpCircle } from 'lucide-react';

export const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    cmsService.getItems('faqs', { filterActive: true })
      .then(setFaqs)
      .catch(() => {});
  }, []);

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQSection faqs={faqs} />
      </div>
    </div>
  );
};
