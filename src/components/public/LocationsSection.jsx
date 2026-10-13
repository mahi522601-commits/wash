import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MapPin, Phone, MessageSquare, Clock, Navigation, Star, Copy, Check, ExternalLink } from 'lucide-react';

const REVIEW_TEMPLATES = [
  'Best laundry service in Manikonda! My clothes always come back fresh, perfectly steam pressed, and handled with care.',
  'Good laundry, good service in Manikonda. Curtains washing, dry cleaning and doorstep pickup & delivery are super prompt!',
  'Quick, prompt and reliable laundry service in Manikonda on Shaikpet Main Rd. Best dry cleaners in Manikonda!',
];

export const LocationsSection = ({ locations = [] }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!locations || locations.length === 0) {
    return null;
  }

  const googleMapsReviewUrl = 'https://www.google.com/maps/search/?api=1&query=Tech+Wash+Laundry+Services+Shaikpet+Main+Rd+Sri+Ram+Nagar+Colony+Manikonda+Hyderabad+500089';

  const handleCopyReview = (text, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 3000);
    }
  };

  return (
    <section className="py-20 bg-white relative" id="manikonda-store-map">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Manikonda & Shaikpet Store Locations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            Visit Our Manikonda Hub or Book Doorstep Pickup
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Tech Wash Laundry — Best Laundry Service in Manikonda: Premium Laundry, Dry Cleaning, Curtains Washing & Steam Ironing, Picked Up & Delivered across Manikonda, Telangana 500089.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((loc) => {
            const rawPhone = loc.phone || '+91 63048 45567';
            const rawWhatsapp = loc.whatsapp || rawPhone;
            const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');

            return (
              <Card
                key={loc.id}
                variant="luxury"
                className="overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {loc.storeImage && (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <img
                        src={loc.storeImage}
                        alt={loc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {loc.isMain && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="royal" size="sm">
                            Main Store & Processing Hub
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 font-display">
                        {loc.name}
                      </h3>
                      {loc.isMain && !loc.storeImage && (
                        <Badge variant="royal" size="sm">Main Hub</Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mb-4 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </p>

                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                        <span>{loc.timings || '8:00 AM - 9:00 PM (All Days)'}</span>
                      </div>
                      {loc.weeklyHolidays && (
                        <div className="text-[11px] text-slate-500 pl-6">
                          Holidays: {loc.weeklyHolidays}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 flex items-center gap-2 flex-wrap">
                  <a
                    href={loc.googleMapsUrl || (loc.latitude && loc.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.address ? `${loc.name}, ${loc.address}` : loc.name)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                    title={`Get directions to ${loc.name} on Google Maps`}
                  >
                    <Button variant="outline" size="sm" className="w-full" icon={Navigation}>
                      Directions
                    </Button>
                  </a>

                  <a href={`tel:${rawPhone}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full" icon={Phone}>
                      Call
                    </Button>
                  </a>

                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello Tech Wash ${loc.name}, I would like to enquire about laundry pickup.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50" icon={MessageSquare}>
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>

        {/* GOOGLE MAPS LOCAL PACK EMBED & 5-STAR REVIEW BOOSTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-slate-50 rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          {/* Embedded Google Map for Manikonda Main Hub */}
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 min-h-[320px] bg-slate-100 relative">
            <iframe
              title="Tech Wash Laundry Services - Best Laundry Service in Manikonda, Hyderabad"
              src="https://www.google.com/maps?q=Shaikpet+Main+Rd,+Sri+Ram+Nagar+Colony,+Manikonda,+Hyderabad,+Telangana+500089&output=embed"
              className="w-full h-full min-h-[320px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Google Places Local Pack Authority & 1-Tap Review Assistant */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>4.9 ★ Rated Laundry Service in Manikonda</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                Tech Wash Laundry Services — Manikonda
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Address:</strong> Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089 (Near Zilla Parishad High School, Lanco Hills Road &amp; OU Colony) • <strong>Phone:</strong> +91 63048 45567
              </p>

              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tap to copy a quick review &amp; rate us on Google Maps:
                </p>
                {REVIEW_TEMPLATES.map((tpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleCopyReview(tpl, idx)}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-brand-400 cursor-pointer transition-all flex items-start justify-between gap-2 group"
                  >
                    <p className="text-xs text-slate-700 italic leading-snug">"{tpl}"</p>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 group-hover:bg-brand-50 text-[10px] font-bold text-slate-700 group-hover:text-brand-700">
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={googleMapsReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <Star className="w-4 h-4 fill-white" />
                <span>Rate 5★ on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

