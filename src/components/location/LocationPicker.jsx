import React, { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
import { LocationDetectionAnimation } from './LocationDetectionAnimation';
import { InteractiveLocationMap } from './InteractiveLocationMap';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Sparkles, 
  MapPin, 
  Navigation, 
  Search, 
  Check, 
  Edit3, 
  ArrowRight, 
  AlertCircle, 
  Home, 
  Briefcase, 
  RotateCcw,
  ShieldCheck,
  Building,
  CheckCircle2,
  X
} from 'lucide-react';

export const LocationPicker = ({
  initialLocation,
  onLocationConfirmed,
  onCancel,
}) => {
  // Mode: 'CHOOSER' | 'GPS_DETECTING' | 'MAP_CONFIRM' | 'MANUAL_FORM' | 'SAVED_LIST'
  const [mode, setMode] = useState(initialLocation ? 'MAP_CONFIRM' : 'CHOOSER');
  
  // Geolocation & Coordinates State
  const [coordinates, setCoordinates] = useState({
    latitude: initialLocation?.latitude || 17.385044,
    longitude: initialLocation?.longitude || 78.486671,
    accuracy: initialLocation?.accuracy || null,
  });

  // Granular Address Details State
  const [addressDetails, setAddressDetails] = useState({
    formattedAddress: initialLocation?.formattedAddress || '',
    houseNumber: initialLocation?.houseNumber || '',
    street: initialLocation?.street || '',
    area: initialLocation?.area || '',
    locality: initialLocation?.locality || '',
    landmark: initialLocation?.landmark || '',
    city: initialLocation?.city || 'Hyderabad',
    state: initialLocation?.state || 'Telangana',
    postalCode: initialLocation?.postalCode || '',
    country: initialLocation?.country || 'India',
    locationSource: initialLocation?.locationSource || 'MANUAL',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [serviceAreaStatus, setServiceAreaStatus] = useState({ isAvailable: true });

  useEffect(() => {
    setSavedAddresses(locationService.getSavedAddresses());
  }, []);

  // 1. TRIGGER LIVE GPS DETECTION FLOW
  const handleUseCurrentLocation = async () => {
    setGpsError(null);
    setMode('GPS_DETECTING');

    try {
      // Step 1: Query device GPS
      const pos = await locationService.getCurrentPosition();
      setCoordinates({
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      });

      // Step 2: Reverse Geocode coordinates
      setIsGeocoding(true);
      const geo = await locationService.reverseGeocode(pos.latitude, pos.longitude);
      
      const newAddress = {
        formattedAddress: geo.formattedAddress,
        houseNumber: geo.houseNumber,
        street: geo.street,
        area: geo.area || geo.locality,
        locality: geo.locality,
        landmark: '',
        city: geo.city,
        state: geo.state,
        postalCode: geo.postalCode,
        country: geo.country,
        locationSource: 'GPS',
      };

      setAddressDetails(newAddress);

      // Step 3: Check service area eligibility
      const areaCheck = await locationService.checkServiceArea({
        latitude: pos.latitude,
        longitude: pos.longitude,
        city: geo.city,
        postalCode: geo.postalCode,
      });
      setServiceAreaStatus(areaCheck);

      // Brief animation pause then transition to Map Confirm
      setTimeout(() => {
        setIsGeocoding(false);
        setMode('MAP_CONFIRM');
      }, 700);

    } catch (err) {
      console.warn("GPS detection failed:", err);
      setGpsError(err.message || 'Unable to access your location. Please enter address manually.');
      setMode('CHOOSER');
    }
  };

  // 2. HANDLE MAP PIN DRAGGED / RE-CENTERED
  const handlePositionChanged = async (newLat, newLng) => {
    setCoordinates((prev) => ({ ...prev, latitude: newLat, longitude: newLng }));
    setIsGeocoding(true);

    try {
      const geo = await locationService.reverseGeocode(newLat, newLng);
      setAddressDetails((prev) => ({
        ...prev,
        formattedAddress: geo.formattedAddress,
        street: geo.street || prev.street,
        area: geo.area || geo.locality || prev.area,
        city: geo.city || prev.city,
        state: geo.state || prev.state,
        postalCode: geo.postalCode || prev.postalCode,
        locationSource: 'MAP_ADJUSTED',
      }));

      const areaCheck = await locationService.checkServiceArea({
        latitude: newLat,
        longitude: newLng,
        city: geo.city,
        postalCode: geo.postalCode,
      });
      setServiceAreaStatus(areaCheck);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // 3. SEARCH ADDRESS PLACES AUTOCOMPLETE
  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (val.trim().length >= 3) {
      setIsSearching(true);
      const results = await locationService.searchAddresses(val);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (result) => {
    setCoordinates({
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: null,
    });
    setAddressDetails({
      formattedAddress: result.displayName,
      houseNumber: '',
      street: result.street || '',
      area: result.area || '',
      locality: result.area || '',
      landmark: '',
      city: result.city || 'Hyderabad',
      state: result.state || 'Telangana',
      postalCode: result.postalCode || '',
      country: 'India',
      locationSource: 'MANUAL_SEARCH',
    });
    setSearchQuery('');
    setSearchResults([]);
    setMode('MAP_CONFIRM');
  };

  // 4. CONFIRM & EMIT LOCATION SNAPSHOT
  const handleConfirmLocation = () => {
    // Validate required fields
    if (!addressDetails.street && !addressDetails.area && !addressDetails.formattedAddress) {
      alert('Please enter your building/street or select your location on the map.');
      return;
    }

    const fullFormatted = [
      addressDetails.houseNumber,
      addressDetails.street,
      addressDetails.area,
      addressDetails.landmark ? `(Near ${addressDetails.landmark})` : '',
      addressDetails.city,
      addressDetails.state,
      addressDetails.postalCode,
    ].filter(Boolean).join(', ');

    const snapshot = {
      formattedAddress: fullFormatted || addressDetails.formattedAddress,
      houseNumber: addressDetails.houseNumber,
      street: addressDetails.street,
      area: addressDetails.area,
      locality: addressDetails.locality,
      landmark: addressDetails.landmark,
      city: addressDetails.city,
      state: addressDetails.state,
      postalCode: addressDetails.postalCode,
      country: addressDetails.country,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: coordinates.accuracy,
      locationSource: addressDetails.locationSource || 'GPS',
      locationCapturedAt: new Date().toISOString(),
    };

    // Save to local address history
    locationService.saveAddress(snapshot);

    if (onLocationConfirmed) {
      onLocationConfirmed(snapshot);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────
          MODE 1: DUAL LOCATION METHOD CHOOSER (GPS vs MANUAL)
      ───────────────────────────────────────────────────────── */}
      {mode === 'CHOOSER' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold font-display text-navy-800 flex items-center justify-center sm:justify-start gap-2">
              <MapPin className="w-5 h-5 text-brand-600" />
              <span>Where should we pick up your clothes?</span>
            </h3>
            <p className="text-xs text-slate-500">
              Use your device GPS for instant doorstep detection or enter your address manually.
            </p>
          </div>

          {/* GPS Error Alert */}
          {gpsError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{gpsError}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Please proceed by searching or typing your address below.</p>
              </div>
            </div>
          )}

          {/* DUAL METHOD ACTION CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Primary Action 1: Live GPS Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="p-6 rounded-[28px] bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white border-2 border-brand-500/40 shadow-luxury hover:shadow-luxury-hover hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center text-white shadow-glow-cyan group-hover:scale-110 transition-transform">
                  <Navigation className="w-6 h-6 text-cyan-200 animate-pulse" />
                </div>
                <Badge variant="cyan" size="sm">Recommended</Badge>
              </div>

              <div>
                <h4 className="text-base font-black font-display text-white tracking-tight flex items-center gap-1.5">
                  <span>Use My Current Location</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-xs text-brand-100/80 mt-1">
                  Automatically pin your doorstep using high-precision device satellite GPS.
                </p>
              </div>
            </button>

            {/* Primary Action 2: Manual Search / Form Entry */}
            <button
              type="button"
              onClick={() => setMode('MANUAL_FORM')}
              className="p-6 rounded-[28px] bg-white text-slate-900 border-2 border-brand-200 shadow-sm hover:border-brand-500 hover:shadow-luxury hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <Search className="w-6 h-6" />
                </div>
                <Badge variant="slate" size="sm">Manual</Badge>
              </div>

              <div>
                <h4 className="text-base font-black font-display text-navy-800 tracking-tight flex items-center gap-1.5">
                  <span>Enter Address Manually</span>
                  <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Type your apartment, road, locality, and landmark directly into form fields.
                </p>
              </div>
            </button>

          </div>

          {/* Quick Place Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Or search by area, road, or building (e.g. Jubilee Hills Road 36)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-brand-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm font-medium"
              />
            </div>

            {/* Place Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full inset-x-0 mt-2 rounded-2xl bg-white border border-brand-200 shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 animate-slide-down">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full p-3.5 text-left hover:bg-brand-50 flex items-start gap-3 transition-colors text-xs"
                  >
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">{res.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{res.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Addresses Quick Access */}
          {savedAddresses.length > 0 && (
            <div className="pt-2 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
                Previously Saved Addresses
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAddresses.slice(0, 2).map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      setAddressDetails(addr);
                      setCoordinates({ latitude: addr.latitude, longitude: addr.longitude, accuracy: null });
                      setMode('MAP_CONFIRM');
                    }}
                    className="p-4 rounded-2xl bg-white border border-brand-200 hover:border-brand-500 text-left transition-all flex items-start gap-3 shadow-sm hover:shadow-md"
                  >
                    <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-navy-800 truncate">{addr.street || addr.area || 'Saved Location'}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{addr.formattedAddress}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODE 2: LIVE GPS DETECTION RADAR ANIMATION
      ───────────────────────────────────────────────────────── */}
      {mode === 'GPS_DETECTING' && (
        <LocationDetectionAnimation status={isGeocoding ? 'found' : 'detecting'} />
      )}

      {/* ─────────────────────────────────────────────────────────
          MODE 3: INTERACTIVE MAP PREVIEW & CONFIRMATION SHEET
      ───────────────────────────────────────────────────────── */}
      {mode === 'MAP_CONFIRM' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Bar with Re-detect & Switch Method */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 font-display">
                Step 3 • Pickup Doorstep
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-display text-navy-800">
                Confirm Pickup Location
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setMode('CHOOSER')}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Change Method</span>
            </button>
          </div>

          {/* Service Area Availability Notice */}
          {!serviceAreaStatus.isAvailable && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{serviceAreaStatus.message}</span>
            </div>
          )}

          {/* Interactive Leaflet Map with Draggable Marker & "Locate Me" */}
          <InteractiveLocationMap
            latitude={coordinates.latitude}
            longitude={coordinates.longitude}
            zoom={16}
            draggable={true}
            onPositionChange={handlePositionChanged}
            onLocateMe={handleUseCurrentLocation}
          />

          {/* Detected Address Details Card / Bottom Sheet */}
          <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-brand-200/80 shadow-luxury space-y-5">
            
            {/* Header Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy-800">
                    {addressDetails.locationSource === 'GPS' ? 'GPS Detected Doorstep' : 'Pinned Location'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Lat: {coordinates.latitude?.toFixed(5)}, Lng: {coordinates.longitude?.toFixed(5)}
                    {coordinates.accuracy ? ` (±${coordinates.accuracy}m)` : ''}
                  </div>
                </div>
              </div>

              <Badge variant="emerald" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Coordinates Locked
              </Badge>
            </div>

            {/* Resolved Readable Address Summary */}
            <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/70 space-y-1">
              <div className="text-xs font-semibold text-slate-800 leading-relaxed">
                {addressDetails.formattedAddress || 'Location selected on map'}
              </div>
            </div>

            {/* Granular Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="House / Flat / Building No. *"
                required
                placeholder="e.g. Flat 304, Green Heights"
                value={addressDetails.houseNumber}
                onChange={(e) => setAddressDetails({ ...addressDetails, houseNumber: e.target.value })}
              />

              <Input
                label="Street / Road / Lane *"
                required
                placeholder="e.g. Road No. 12"
                value={addressDetails.street}
                onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Area / Locality *"
                placeholder="e.g. Jubilee Hills"
                value={addressDetails.area}
                onChange={(e) => setAddressDetails({ ...addressDetails, area: e.target.value })}
              />

              <Input
                label="City *"
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
              />

              <Input
                label="PIN Code"
                placeholder="e.g. 500033"
                value={addressDetails.postalCode}
                onChange={(e) => setAddressDetails({ ...addressDetails, postalCode: e.target.value })}
              />
            </div>

            <Input
              label="Prominent Landmark (Optional)"
              placeholder="e.g. Opposite Blue Fox Restaurant / Near Metro Pillar 114"
              value={addressDetails.landmark}
              onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
            />

            {/* Confirm Location Action */}
            <div className="pt-3 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setMode('CHOOSER')}
              >
                Back
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                icon={Check}
                onClick={handleConfirmLocation}
                disabled={!serviceAreaStatus.isAvailable}
                className="shadow-glow-purple px-8"
              >
                Confirm Pickup Location
              </Button>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          MODE 4: PURE MANUAL ADDRESS FORM ENTRY
      ───────────────────────────────────────────────────────── */}
      {mode === 'MANUAL_FORM' && (
        <div className="space-y-6 animate-fade-in p-6 sm:p-8 bg-white rounded-[32px] border border-brand-200 shadow-luxury">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-display text-navy-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-600" />
                <span>Enter Pickup Address Details</span>
              </h3>
              <p className="text-xs text-slate-500">
                Please fill in your complete address for executive doorstep collection.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMode('CHOOSER')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              ← Back
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="House / Flat / Building Name *"
                required
                placeholder="e.g. Villa 14, Palm Meadows"
                value={addressDetails.houseNumber}
                onChange={(e) => setAddressDetails({ ...addressDetails, houseNumber: e.target.value })}
              />

              <Input
                label="Street / Road / Lane *"
                required
                placeholder="e.g. Main Avenue, Phase 2"
                value={addressDetails.street}
                onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Area / Locality *"
                required
                placeholder="e.g. Madhapur"
                value={addressDetails.area}
                onChange={(e) => setAddressDetails({ ...addressDetails, area: e.target.value })}
              />

              <Input
                label="City *"
                required
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })}
              />

              <Input
                label="PIN Code *"
                required
                placeholder="e.g. 500081"
                value={addressDetails.postalCode}
                onChange={(e) => setAddressDetails({ ...addressDetails, postalCode: e.target.value })}
              />
            </div>

            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Near Community Hall"
              value={addressDetails.landmark}
              onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={Navigation}
              onClick={handleUseCurrentLocation}
            >
              Use GPS Instead
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              icon={Check}
              onClick={handleConfirmLocation}
            >
              Save & Use This Address
            </Button>
          </div>

        </div>
      )}

    </div>
  );
};
