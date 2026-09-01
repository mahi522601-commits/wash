import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export const TermsPage = () => {
  const { settings } = useSettings();
  const businessName = settings?.general?.businessName || 'Tech Wash Laundry Services';

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-luxury space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight border-b border-slate-100 pb-4">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">1. Garment Care & Inspection</h3>
          <p>
            All garments undergo an initial high-CRI inspection upon arrival at our processing hub. Pre-existing tears, loose buttons, severe color bleeding tendencies, or fabric wear will be documented on your digital receipt.
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">2. Turnaround & Delivery</h3>
          <p>
            Standard turnaround time is 48 hours from successful pickup. Express turnaround is 24 hours. While we make every attempt to meet selected time slots, delays resulting from severe weather or traffic will be proactively communicated.
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">3. Custody & Liability</h3>
          <p>
            {businessName} follows strict manufacturer care labels. In the unlikely event of damage or loss directly attributable to our process, compensation is handled transparently as detailed in our Refund & Guarantee Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
