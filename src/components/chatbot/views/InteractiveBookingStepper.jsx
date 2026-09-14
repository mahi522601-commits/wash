import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { QUICK_ITEMS_CATALOG } from '../../../services/chatbotService';
import { locationService } from '../../../services/locationService';
import { orderService } from '../../../services/orderService';
import { playOrderPlacedSound } from '../../../utils/audioNotification';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Navigation, 
  CheckCircle2, 
  User, 
  Phone 
} from 'lucide-react';

export const InteractiveBookingStepper = ({
  initialService,
  initialItem,
  onBookingConfirmed,
  onCancel,
}) => {
  // Stepper: 1: Service, 2: Items, 3: Location, 4: Schedule, 5: Review & Confirm
  const [step, setStep] = useState(initialItem ? 2 : (initialService ? 2 : 1));

  // State
  const [selectedService, setSelectedService] = useState(
    initialService?.title || 'Laundry'
  );
  
  const [items, setItems] = useState(
    initialItem
      ? [{ ...initialItem, quantity: 1 }]
      : [{ id: 'qi-1', name: 'Shirts / T-Shirts', unitPrice: 49, quantity: 2 }]
  );

  const [locationSource, setLocationSource] = useState('GPS');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    building: '',
    locality: '',
    city: 'Hyderabad',
    pincode: '500033',
    landmark: '',
    latitude: 17.385044,
    longitude: 78.486671,
    formattedAddress: '',
  });

  const [schedule, setSchedule] = useState({
    pickupDate: 'Tomorrow',
    pickupSlot: '10:00 AM - 12:00 PM',
  });

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Live total estimation
  const itemsSubtotal = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const deliveryFee = itemsSubtotal >= 499 ? 0 : 49;
  const estimatedTotal = itemsSubtotal + deliveryFee;

  const handleQtyChange = (item, delta) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter((i) => i.id !== item.id);
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
      }
      if (delta > 0) {
        return [...prev, { ...item, quantity: 1 }];
      }
      return prev;
    });
  };

  const handleGpsDetect = async () => {
    setIsDetectingGps(true);
    try {
      const pos = await locationService.getCurrentPosition();
      const geo = await locationService.reverseGeocode(pos.latitude, pos.longitude);
      setAddress({
        building: geo.houseNumber || '',
        street: geo.street || '',
        locality: geo.area || geo.locality || '',
        city: geo.city || 'Hyderabad',
        pincode: geo.postalCode || '',
        landmark: '',
        latitude: pos.latitude,
        longitude: pos.longitude,
        formattedAddress: geo.formattedAddress,
      });
      setLocationSource('GPS');
    } catch (e) {
      alert('Unable to detect location. Please type your address.');
      setLocationSource('MANUAL');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert('Please enter your name and phone number for pickup coordination.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedAddr = address.formattedAddress || [
        address.building,
        address.street,
        address.locality,
        address.city,
        address.pincode
      ].filter(Boolean).join(', ');

      const locationSnapshot = {
        formattedAddress: formattedAddr,
        houseNumber: address.building,
        street: address.street,
        area: address.locality,
        landmark: address.landmark,
        city: address.city,
        postalCode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        locationSource: locationSource,
        locationCapturedAt: new Date().toISOString(),
      };

      const dateStr = schedule.pickupDate === 'Today'
        ? new Date().toISOString().split('T')[0]
        : new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const orderPayload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          address: formattedAddr,
          city: address.city,
        },
        pickupLocation: locationSnapshot,
        serviceName: selectedService,
        items: items.map(i => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
        schedule: {
          pickupDate: dateStr,
          pickupSlot: schedule.pickupSlot,
        },
        priceSnapshot: {
          itemsSubtotal,
          expressFee: 0,
          deliveryFee,
          discountAmount: 0,
          taxAmount: Math.round(itemsSubtotal * 0.05),
          finalTotal: estimatedTotal,
        },
        totalAmount: estimatedTotal,
        paymentMethod: 'PAY_ON_DELIVERY',
        paymentStatus: 'PENDING',
      };

      const created = await orderService.createOrder(orderPayload);

      // Play custom order received sound from /1.mp4
      playOrderPlacedSound();

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F97316', '#FED7AA', '#1F2937'],
        });
      } catch (e) {}

      setConfirmedOrder(created);
      if (onBookingConfirmed) onBookingConfirmed(created);
    } catch (e) {
      alert('Failed to place booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION STATE
  if (confirmedOrder) {
    return (
      <div className="p-4 rounded-2xl bg-[#FFF7ED] border-2 border-[#FED7AA] text-center space-y-3 animate-fade-in text-xs">
        <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center mx-auto shadow-md">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#FED7AA] text-[#F97316] text-[10px] font-bold">
            Pickup Scheduled Successfully!
          </span>
          <h4 className="text-sm font-black text-[#1F2937] mt-1">
            Order #{confirmedOrder.orderNumber}
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Our certified pickup executive will arrive on <strong>{schedule.pickupDate} ({schedule.pickupSlot})</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#FED7AA] text-left space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Service:</span>
            <span className="font-bold text-slate-800">{confirmedOrder.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Total:</span>
            <span className="font-bold text-[#F97316]">{formatCurrency(confirmedOrder.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>Payment:</span>
            <span>Pay on Delivery (UPI / Cash)</span>
          </div>
        </div>

        <a
          href={`/track-order?id=${confirmedOrder.orderNumber}`}
          className="block py-2 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs transition-colors shadow-sm"
        >
          Track Live 10-Stage Milestone →
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3.5 animate-fade-in text-xs">
      
      {/* 5-Step Compact Stepper Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center">
            {step}
          </span>
          <span className="text-xs font-bold text-[#1F2937]">
            {step === 1 && 'Select Service'}
            {step === 2 && 'Choose Garments & Qty'}
            {step === 3 && 'Doorstep Pickup Address'}
            {step === 4 && 'Schedule Pickup Time'}
            {step === 5 && 'Confirm Booking'}
          </span>
        </div>

        <span className="text-[10px] font-bold text-slate-400 font-mono">
          Step {step} of 5
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────
          STEP 1: SELECT PRIMARY SERVICE CHIPS
      ───────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-slate-500">
            Choose your primary garment care category:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              'Laundry',
              'Steam Iron',
              'Stains Remover',
              'Dry Cleaning',
            ].map((srv) => (
              <button
                key={srv}
                type="button"
                onClick={() => {
                  setSelectedService(srv);
                  setStep(2);
                }}
                className={`p-2.5 rounded-xl border text-left font-bold text-[11px] transition-all flex items-center justify-between ${
                  selectedService === srv
                    ? 'bg-[#FFF7ED] border-[#F97316] text-[#F97316] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{srv}</span>
                {selectedService === srv && <Check className="w-3 h-3 text-[#F97316]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STEP 2: GARMENT SELECTION & QUANTITY TICKER
      ───────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Add approximate pieces:</span>
            <span className="text-[10px] text-[#F97316] font-bold">
              Service: {selectedService}
            </span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {QUICK_ITEMS_CATALOG.slice(0, 6).map((qItem) => {
              const currentQty = items.find((i) => i.id === qItem.id)?.quantity || 0;
              return (
                <div
                  key={qItem.id}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-[11px]">{qItem.name}</div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {formatCurrency(qItem.unitPrice)} / piece
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white rounded-lg p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(qItem, -1)}
                      className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold text-xs">{currentQty}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(qItem, 1)}
                      className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Estimate Bar */}
          <div className="p-2 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Estimated Total:</span>
            <span className="font-black font-mono text-[#F97316]">
              {formatCurrency(estimatedTotal)}
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STEP 3: LOCATION CHOOSER (GPS VS MANUAL)
      ───────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500">
            Where should our executive collect your garments?
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleGpsDetect}
              disabled={isDetectingGps}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                locationSource === 'GPS' && address.formattedAddress
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : 'bg-brand-50/60 border-brand-200 text-brand-900 hover:bg-brand-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin text-cyan-600' : 'text-brand-600'}`} />
                <span>{isDetectingGps ? 'Locking GPS...' : 'Use Current GPS'}</span>
              </div>
              <span className="text-[9px] text-slate-500">One-click satellite lock</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationSource('MANUAL')}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                locationSource === 'MANUAL'
                  ? 'bg-brand-50 border-brand-500 text-brand-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>Enter Manually</span>
              </div>
              <span className="text-[9px] text-slate-500">Type flat & street</span>
            </button>
          </div>

          {/* Resolved or manual address fields */}
          {address.formattedAddress ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Doorstep Pinned</span>
                </div>
                <a
                  href={address.latitude && address.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.formattedAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#F97316] hover:underline flex items-center gap-0.5"
                  title="Open in Google Maps"
                >
                  <Navigation className="w-3 h-3 text-[#F97316]" />
                  <span>Google Maps ↗</span>
                </a>
              </div>
              <p className="leading-snug">{address.formattedAddress}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Flat / Building Name *"
                value={address.building}
                onChange={(e) => setAddress({ ...address, building: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
              <input
                type="text"
                placeholder="Street / Road & Locality *"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
              <input
                type="text"
                placeholder="City (e.g. Hyderabad / Tirupati)"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STEP 4: PICKUP DATE & TIME SLOTS
      ───────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500">
            Select preferred executive arrival window:
          </p>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pickup Day
            </span>
            <div className="grid grid-cols-2 gap-2">
              {['Today', 'Tomorrow'].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSchedule({ ...schedule, pickupDate: day })}
                  className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                    schedule.pickupDate === day
                      ? 'bg-[#F97316] text-white border-[#F97316] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Time Window (2-Hour Slot)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                '08:00 AM - 10:00 AM',
                '10:00 AM - 12:00 PM',
                '02:00 PM - 04:00 PM',
                '04:00 PM - 06:00 PM',
              ].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSchedule({ ...schedule, pickupSlot: slot })}
                  className={`p-2 rounded-lg border text-center font-semibold text-[10px] transition-all ${
                    schedule.pickupSlot === slot
                      ? 'bg-[#FFF7ED] border-[#F97316] text-[#F97316] font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          STEP 5: SUMMARY & CONTACT INPUT
      ───────────────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-900">{selectedService}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Items:</span>
              <span className="font-semibold text-slate-800">
                {items.reduce((acc, i) => acc + i.quantity, 0)} garments
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Schedule:</span>
              <span className="font-semibold text-slate-800">
                {schedule.pickupDate} ({schedule.pickupSlot})
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-xs">
              <span className="text-slate-900">Estimated Total:</span>
              <span className="text-[#F97316] font-mono">{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Your Full Name *"
              required
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-[#F97316] focus:outline-none"
            />
            <input
              type="tel"
              placeholder="10-Digit Mobile (for OTP & live alerts) *"
              required
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-[#F97316] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Bottom Navigation Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="px-4 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{isSubmitting ? 'Confirming...' : 'Confirm Doorstep Pickup'}</span>
          </button>
        )}
      </div>

    </div>
  );
};
