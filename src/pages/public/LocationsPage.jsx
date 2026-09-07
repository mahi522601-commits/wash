import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Phone, MessageSquare, Clock, Navigation, Sparkles, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getLocations()
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Store Network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Our Store & Processing Hubs
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Visit our state-of-the-art garment care lounges or schedule an express doorstep pickup from anywhere in the city.
          </p>
        </div>

        {locations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
            <MapPin className="w-10 h-10 text-brand-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 font-display">Doorstep Service Available Everywhere</h3>
            <p className="text-xs text-slate-500">
              We operate an active doorstep pickup fleet. Book online and our executive will arrive at your home.
            </p>
            <Link to="/book-pickup">
              <Button variant="primary" size="md" icon={Calendar}>
                Book Doorstep Pickup
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {locations.map((loc) => {
              const rawPhone = loc.phone || '+91 98765 43210';
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
                            <Badge variant="royal" size="sm">Main Hub</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-xl font-bold text-slate-900 font-display">
                          {loc.name}
                        </h3>
                        {loc.isMain && !loc.storeImage && (
                          <Badge variant="royal" size="sm">Main Hub</Badge>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mb-5 flex items-start gap-2.5 leading-relaxed">
                        <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                        <span>{loc.address}</span>
                      </p>

                      <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>{loc.timings || '8:00 AM - 9:00 PM (All Days)'}</span>
                        </div>
                        {loc.weeklyHolidays && (
                          <div className="text-[11px] text-slate-500 pl-6">
                            Weekly Off: {loc.weeklyHolidays}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

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
                      href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello Tech Wash ${loc.name}, I want to enquire about laundry pickup.`)}`}
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
        )}

      </div>
    </div>
  );
};
