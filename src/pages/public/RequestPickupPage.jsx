import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DoorstepPickupModal } from '../../components/public/DoorstepPickupModal';
import { DEFAULT_SERVICES } from '../../services/serviceService';
import { Truck, ShieldCheck, Clock, MapPin, Sparkles, ArrowLeft, Phone } from 'lucide-react';

export const RequestPickupPage = () => {
  const [searchParams] = useSearchParams();
  const serviceSlug = searchParams.get('service');
  const matchedService = DEFAULT_SERVICES.find(s => s.slug === serviceSlug) || null;

  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link 
          to="/services" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services Catalog</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <Truck className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Doorstep Pickup Service</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900">
              Schedule Your Free Laundry Pickup
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our pickup executive will visit your address, securely tag your garments, and bring them to our central cleaning hub.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 mx-auto transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Open Pickup Request Form</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Flexible Time Slots</span>
                <span className="text-slate-500">Morning, afternoon, or evening pickup at your convenience.</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Doorstep Collection</span>
                <span className="text-slate-500">Free within 15 km from Tolichowki hub (₹49 for 15+ km).</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Garment Protection</span>
                <span className="text-slate-500">Individual barcodes & zero color-bleed guarantee.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DoorstepPickupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialService={matchedService}
      />
    </div>
  );
};
