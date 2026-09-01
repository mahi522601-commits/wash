import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export const RefundPolicyPage = () => {
  const { settings } = useSettings();
  const businessName = settings?.general?.businessName || 'Tech Wash Laundry Services';

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-luxury space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight border-b border-slate-100 pb-4">
            Refund & Fabric Quality Guarantee
          </h1>
          <p className="text-xs text-slate-400">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">1. 100% Re-Clean Guarantee</h3>
          <p>
            If you are not completely delighted with the finish, stain extraction, or steam pressing of any garment, notify us within 24 hours of delivery. We will gladly collect and re-process the item free of charge.
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">2. Refunds on Pre-Paid Orders</h3>
          <p>
            If an order is cancelled prior to pickup execution, a 100% refund is initiated immediately to your original payment method (processed within 3–5 working days via UPI/Bank transfer).
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">3. Dispute Resolution</h3>
          <p>
            For any billing questions or concerns, reach our executive support desk at{' '}
            <strong className="text-slate-900">{settings?.general?.supportEmail || 'support@techwash.in'}</strong> or via our WhatsApp Concierge.
          </p>
        </div>
      </div>
    </div>
  );
};
