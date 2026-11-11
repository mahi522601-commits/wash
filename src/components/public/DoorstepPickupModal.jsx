import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Loader2, 
  Navigation, 
  MessageSquare, 
  Package, 
  Scale, 
  Sparkles,
  Info
} from 'lucide-react';
import { DEFAULT_SERVICES } from '../../services/serviceService';
import { pickupRequestService } from '../../services/pickupRequestService';
import { locationService, calculateDeliveryFee } from '../../services/locationService';
import { formatCurrency } from '../../utils/formatters';

export const DoorstepPickupModal = ({ 
  isOpen, 
  onClose, 
  initialService = null 
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');

  // Address Fields
  const [houseNumber, setHouseNumber] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null); // { text, fee, isLongDistance }
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Pickup Details
  const [selectedServices, setSelectedServices] = useState([]);
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [numberOfBags, setNumberOfBags] = useState('');
  const [pickupDate, setPickupDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('Morning (08:00 AM - 12:00 PM)');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Initialize selected service
  useEffect(() => {
    if (initialService) {
      const match = DEFAULT_SERVICES.find(s => 
        s.slug === initialService.slug || 
        s.id === initialService.id || 
        s.title === initialService.title
      );
      if (match) {
        setSelectedServices([match]);
      } else {
        setSelectedServices([initialService]);
      }
    } else if (DEFAULT_SERVICES.length > 0 && selectedServices.length === 0) {
      setSelectedServices([DEFAULT_SERVICES[0]]);
    }
  }, [initialService, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmittedData(null);
    setSubmitError(null);
    onClose();
  };

  const handleToggleService = (srv) => {
    const exists = selectedServices.some(s => s.id === srv.id || s.slug === srv.slug);
    if (exists) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s.id !== srv.id && s.slug !== srv.slug));
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatus(null);
    try {
      const pos = await locationService.getCurrentPosition();
      if (pos && pos.coords) {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        const feeInfo = calculateDeliveryFee({ latitude, longitude });
        setLocationStatus({
          text: feeInfo.ruleDescription,
          fee: feeInfo.deliveryFee,
          isLongDistance: feeInfo.isLongDistance,
          distanceKm: feeInfo.distanceKm
        });
      }
    } catch (err) {
      setLocationStatus({
        error: true,
        text: 'Unable to access GPS location. Please ensure location permissions are granted.'
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!customerName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!houseNumber.trim() || !street.trim()) {
      setSubmitError('Please enter your complete address (House/Flat & Street/Area).');
      return;
    }
    if (selectedServices.length === 0) {
      setSubmitError('Please select at least one laundry service.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const reqPayload = {
        customerName: customerName.trim(),
        mobileNumber: cleanPhone,
        whatsappNumber: sameAsMobile ? cleanPhone : (whatsappNumber.replace(/\D/g, '').slice(-10) || cleanPhone),
        alternatePhone: alternatePhone.trim(),
        address: {
          houseNumber: houseNumber.trim(),
          street: street.trim(),
          landmark: landmark.trim(),
          city: city.trim() || 'Hyderabad',
          pincode: pincode.trim(),
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
          fullAddress: [
            houseNumber.trim(),
            street.trim(),
            landmark.trim(),
            city.trim() || 'Hyderabad',
            pincode.trim() ? `Pincode: ${pincode.trim()}` : null
          ].filter(Boolean).join(', ')
        },
        services: selectedServices.map(s => ({
          id: s.id,
          title: s.title || s.name,
          slug: s.slug,
          startingPrice: s.startingPrice || 0,
          pricingType: s.pricingType || 'per_item',
          emoji: s.emoji || '👔'
        })),
        estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : null,
        numberOfBags: numberOfBags ? parseInt(numberOfBags, 10) : null,
        pickupDate,
        pickupTimeSlot: timeSlot,
        specialInstructions: specialInstructions.trim()
      };

      const result = await pickupRequestService.createPickupRequest(reqPayload);
      setSubmittedData(result);
    } catch (err) {
      console.error('Pickup request error:', err);
      setSubmitError(err?.message || 'Failed to submit pickup request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getWhatsAppMessageUrl = () => {
    if (!submittedData) return '#';
    const text = encodeURIComponent(
      `Hello Tech Wash Laundry,\n\nI have submitted a Doorstep Pickup Request!\n\n📋 *Request ID:* ${submittedData.pickupRequestId}\n👤 *Customer:* ${submittedData.customerName}\n📱 *Phone:* ${submittedData.mobileNumber}\n📅 *Pickup Date:* ${submittedData.pickupDate} (${submittedData.pickupTimeSlot})\n📍 *Address:* ${submittedData.address?.fullAddress}\n🧺 *Services:* ${submittedData.serviceNames?.join(', ')}\n\nPlease confirm our pickup executive visit. Thank you!`
    );
    return `https://wa.me/919000813444?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Truck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold tracking-wider uppercase mb-1 border border-emerald-400/30">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Doorstep Pickup Service</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                Request Doorstep Laundry Pickup
              </h2>
            </div>
          </div>

          {/* Pickup Service Note */}
          <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-2.5 text-xs text-emerald-50">
            <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Doorstep Pickup</strong> – Our pickup executive will visit your location, safely collect your laundry, and bring it to our central hub for specialized cleaning.
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {submittedData ? (
            /* ───────────────────────────────────────────────────────────── */
            /* SUCCESS CONFIRMATION SCREEN                                   */
            /* ───────────────────────────────────────────────────────────── */
            <div className="py-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 font-display">
                  Pickup Request Submitted!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your doorstep pickup request has been received successfully. Our team will contact you shortly to coordinate collection.
                </p>
              </div>

              {/* Request Summary Card */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Request ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-sm">
                      {submittedData.pickupRequestId}
                    </span>
                    <button
                      onClick={() => handleCopyId(submittedData.pickupRequestId)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Name</span>
                    <span className="font-bold text-slate-800 text-sm">{submittedData.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Contact Number</span>
                    <span className="font-bold text-slate-800 text-sm">+91 {submittedData.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Pickup Date</span>
                    <span className="font-bold text-slate-800">{submittedData.pickupDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Time Window</span>
                    <span className="font-bold text-slate-800">{submittedData.pickupTimeSlot}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-400 block font-medium">Pickup Address</span>
                  <span className="font-medium text-slate-700 leading-snug">{submittedData.address?.fullAddress}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500">Initial Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                    Pending Confirmation
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={getWhatsAppMessageUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat with Us on WhatsApp</span>
                </a>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* PICKUP REQUEST FORM                                           */
            /* ───────────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. CUSTOMER INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>1. Customer Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-medium outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sameAsMobile"
                    checked={sameAsMobile}
                    onChange={(e) => setSameAsMobile(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="sameAsMobile" className="text-xs text-slate-600 select-none">
                    WhatsApp number is same as mobile number
                  </label>
                </div>

                {!sameAsMobile && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit WhatsApp number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone (Optional)</label>
                      <input
                        type="tel"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                        placeholder="Optional backup number"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PICKUP ADDRESS */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>2. Pickup Address</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-all disabled:opacity-50"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>Use GPS Location</span>
                      </>
                    )}
                  </button>
                </div>

                {locationStatus && (
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    locationStatus.error 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : locationStatus.isLongDistance
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{locationStatus.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      House / Flat / Building No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. Flat 402, Royal Residency"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Street / Area / Colony <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Shaikpet / Tolichowki / Manikonda"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Olive Hospital"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Hyderabad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="500008"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SELECT LAUNDRY SERVICES */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>3. Select Laundry Services</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Select one or more</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DEFAULT_SERVICES.slice(0, 9).map((srv) => {
                    const isSelected = selectedServices.some(s => s.id === srv.id || s.slug === srv.slug);
                    return (
                      <button
                        type="button"
                        key={srv.id || srv.slug}
                        onClick={() => handleToggleService(srv)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base shrink-0">{srv.emoji || '👔'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate font-bold leading-tight">{srv.title || srv.name}</p>
                          {srv.startingPrice && (
                            <p className="text-[10px] text-slate-500 font-normal">
                              From {formatCurrency(srv.startingPrice)}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. PICKUP DATE & TIME SLOT */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>4. Pickup Date & Time Slot</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Pickup Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time Window</label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden bg-white"
                    >
                      <option value="Morning (08:00 AM - 12:00 PM)">Morning (08:00 AM - 12:00 PM)</option>
                      <option value="Afternoon (12:00 PM - 04:00 PM)">Afternoon (12:00 PM - 04:00 PM)</option>
                      <option value="Evening (04:00 PM - 08:00 PM)">Evening (04:00 PM - 08:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-500" />
                      <span>Estimated Clothes Weight (Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(e.target.value)}
                      placeholder="e.g. 5 (kg)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span>Number of Bags (Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfBags}
                      onChange={(e) => setNumberOfBags(e.target.value)}
                      placeholder="e.g. 2 bags"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Special Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Ring bell twice, delicate silk saree included, handle with care"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 text-xs sm:text-sm font-medium outline-hidden resize-none"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Submit Pickup Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
