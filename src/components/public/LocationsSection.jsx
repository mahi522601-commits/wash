import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MapPin, Phone, MessageSquare, Clock, Navigation, ArrowRight } from 'lucide-react';

export const LocationsSection = ({ locations = [] }) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Store & Hub Locations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            Visit or Book Doorstep Pickup
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Drop off your garments at our premium lounges or schedule a doorstep pickup directly to your home.
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

      </div>
    </section>
  );
};
