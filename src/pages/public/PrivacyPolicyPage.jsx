import React from 'react';
import { useSettings } from '../../context/SettingsContext';

export const PrivacyPolicyPage = () => {
  const { settings } = useSettings();
  const businessName = settings?.general?.businessName || 'Tech Wash Laundry Services';

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-luxury space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight border-b border-slate-100 pb-4">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">1. Information We Collect</h3>
          <p>
            At {businessName}, we collect customer contact information (such as your name, mobile phone number, email address, and doorstep pickup address) solely for the purpose of scheduling pickups, executing hygienic garment care, delivery coordination, and issuing digital order receipts.
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">2. How Your Data Is Protected</h3>
          <p>
            We do not sell, rent, or trade your personal information. Payment transactions are securely processed through encrypted PCI-DSS compliant payment gateways. We never store credit card numbers or UPI PINs on our servers.
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">3. Communications & Order Updates</h3>
          <p>
            You may receive automated SMS or WhatsApp updates regarding your 10-stage order progress (e.g. pickup confirmation, out-for-delivery alert, and invoice delivery).
          </p>

          <h3 className="text-lg font-bold text-slate-900 font-display pt-2">4. Contacting Our Data Concierge</h3>
          <p>
            If you have questions regarding our privacy practices, please contact support at{' '}
            <strong className="text-slate-900">{settings?.general?.supportEmail || 'support@techwash.in'}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
