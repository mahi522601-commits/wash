import React, { useState } from 'react';
import { locationService } from '../../services/locationService';
import { InteractiveLocationMap } from './InteractiveLocationMap';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export const OrderMapCard = ({
  location,
  customerName,
  title = 'Pickup Location',
  className = '',
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  if (!location) {
    return (
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
        No location snapshot recorded for this order.
      </div>
    );
  }

  const lat = location.latitude || 17.385044;
  const lng = location.longitude || 78.486671;
  const googleMapsUrl = locationService.getGoogleMapsUrl(lat, lng);
  const googleDirectionsUrl = locationService.getGoogleMapsDirectionsUrl(lat, lng);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(location.formattedAddress || '');
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className={`p-6 sm:p-7 rounded-[32px] bg-white border border-brand-200 shadow-luxury space-y-5 ${className}`}>
      
      {/* Header & Source Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#06B6D4] flex items-center justify-center text-white shadow-glow-purple">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-display text-navy-800 tracking-tight">
              {title}
            </h4>
            <div className="text-[11px] text-slate-400">
              {customerName ? `Doorstep of ${customerName}` : 'Confirmed Pickup Point'}
            </div>
          </div>
        </div>

        <Badge variant={location.locationSource === 'GPS' ? 'emerald' : 'royal'} size="sm">
          {location.locationSource === 'GPS' ? '🛰️ Live GPS Verified' : '📍 ' + (location.locationSource || 'Manual')}
        </Badge>
      </div>

      {/* Interactive Map Visualizer */}
      <InteractiveLocationMap
        latitude={lat}
        longitude={lng}
        zoom={16}
        draggable={false}
        className="h-48 sm:h-56 w-full"
      />

      {/* Formatted Address Box */}
      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/70 space-y-1.5 text-xs">
        <div className="font-bold text-navy-800 text-sm">
          {location.formattedAddress || `${location.street}, ${location.area}, ${location.city}`}
        </div>
        
        {location.landmark && (
          <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <span className="font-bold text-brand-700">Landmark:</span>
            <span>{location.landmark}</span>
          </div>
        )}
      </div>

      {/* Direct Google Maps Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ExternalLink}
            className="w-full justify-center text-xs font-bold shadow-glow-purple"
          >
            Open in Google Maps
          </Button>
        </a>

        <a
          href={googleDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={Navigation}
            className="w-full justify-center text-xs font-bold border-brand-300 text-brand-700 hover:bg-brand-50"
          >
            Get Live Directions
          </Button>
        </a>
      </div>

      {/* Collapsible Technical Metadata Details */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-navy-800 transition-colors py-1"
        >
          <span>Technical Coordinates & Accuracy</span>
          {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {detailsExpanded && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 animate-slide-down">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Coordinates:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-navy-800">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="p-1 rounded text-slate-500 hover:text-brand-600"
                  title="Copy Coordinates"
                >
                  {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {location.accuracy && (
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Accuracy:</span>
                <span className="font-semibold text-slate-800">±{location.accuracy} meters</span>
              </div>
            )}

            {location.locationCapturedAt && (
              <div className="flex justify-between">
                <span className="text-slate-500">Captured At:</span>
                <span className="font-medium text-slate-800">
                  {new Date(location.locationCapturedAt).toLocaleString()}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1"
              >
                {copiedAddress ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAddress ? 'Address Copied' : 'Copy Full Address'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
