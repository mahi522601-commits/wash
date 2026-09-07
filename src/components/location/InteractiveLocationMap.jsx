import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Maximize2 } from 'lucide-react';

// Custom SVG Branded Pin Icon for Tech Wash
const createBrandedPinIcon = () => {
  return L.divIcon({
    className: 'custom-techwash-pin',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 44px; height: 44px; background: rgba(6, 182, 212, 0.4); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 34px; height: 34px; background: linear-gradient(135deg, #6D28D9, #06B6D4); border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 15px rgba(109, 40, 217, 0.6); display: flex; align-items: center; justify-content: center; color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

export const InteractiveLocationMap = ({
  latitude,
  longitude,
  zoom = 16,
  draggable = true,
  onPositionChange,
  onLocateMe,
  className = 'h-64 sm:h-80 w-full',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = latitude || 17.385044; // Default Hyderabad coordinates
    const initialLng = longitude || 78.486671;

    // Initialize Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add OpenStreetMap High-Resolution Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add Branded Draggable Marker
      const pinIcon = createBrandedPinIcon();
      const marker = L.marker([initialLat, initialLng], {
        icon: pinIcon,
        draggable: draggable,
      }).addTo(map);

      if (draggable) {
        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          if (onPositionChange) {
            onPositionChange(newPos.lat, newPos.lng);
          }
        });
      }

      // Tap on Map to Move Marker
      if (draggable) {
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          if (onPositionChange) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
          }
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      // Update coordinates if changed externally
      if (latitude && longitude) {
        mapInstanceRef.current.setView([latitude, longitude], zoom, { animate: true });
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, draggable]);

  return (
    <div className="relative rounded-[32px] overflow-hidden border-2 border-brand-200/80 shadow-luxury bg-slate-100 group">
      
      {/* Map Container */}
      <div ref={mapContainerRef} className={`${className} z-0`} />

      {/* Floating Drag Hint Pill */}
      {draggable && (
        <div className="absolute top-4 left-4 z-10 glass-card px-3.5 py-1.5 rounded-full text-[11px] font-bold text-slate-800 shadow-md border border-brand-200 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span>📍 Drag pin to exact doorstep</span>
        </div>
      )}

      {/* Floating "Locate Me" Button */}
      {onLocateMe && (
        <button
          type="button"
          onClick={onLocateMe}
          className="absolute top-4 right-4 z-10 p-3 rounded-2xl bg-white text-brand-700 shadow-lg border border-brand-200 hover:bg-brand-50 hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
          title="Recenter to GPS location"
        >
          <Navigation className="w-4 h-4 text-cyan-600 fill-current" />
          <span className="hidden sm:inline">Locate Me</span>
        </button>
      )}

      {/* Floating Google Maps Directions Button */}
      {latitude && longitude && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 shadow-md border border-slate-200 hover:border-[#F97316] transition-all flex items-center gap-1.5 text-[11px] font-bold group/btn"
          title="Open directions in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-[#F97316] group-hover/btn:scale-110 transition-transform" />
          <span>Google Maps Directions ↗</span>
        </a>
      )}

    </div>
  );
};
