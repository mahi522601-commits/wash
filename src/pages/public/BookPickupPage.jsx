import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { serviceService } from '../../services/serviceService';
import { orderService } from '../../services/orderService';
import { paymentService, PAYMENT_METHODS } from '../../services/paymentService';
import { calculateOrderTotal } from '../../services/pricingEngine';
import { analyticsService } from '../../services/analyticsService';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/formatters';
import { validatePhone, validateEmail } from '../../utils/validators';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LocationPicker } from '../../components/location/LocationPicker';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  User, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Check, 
  Truck, 
  QrCode,
  Tag
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Service', icon: Sparkles },
  { id: 2, label: 'Items', icon: ShoppingBag },
  { id: 3, label: 'Address', icon: MapPin },
  { id: 4, label: 'Schedule', icon: Calendar },
  { id: 5, label: 'Delivery', icon: Truck },
  { id: 6, label: 'Review & Pay', icon: CreditCard },
];

export const BookPickupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { settings } = useSettings();

  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [items, setItems] = useState([]);
  const [isExpress, setIsExpress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Address & Schedule State
  const [pickupLocation, setPickupLocation] = useState(null);
  const [address, setAddress] = useState({
    street: '',
    building: '',
    locality: '',
    city: 'Hyderabad',
    pincode: '',
    landmark: '',
  });

  const [schedule, setSchedule] = useState({
    pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickupSlot: '10:00 AM - 12:00 PM',
    instructions: '',
  });

  // Customer Contact State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('PAY_ON_DELIVERY');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Quick item catalog for estimation
  const quickItems = [
    { id: 'qi-1', name: 'Shirts / T-Shirts', unitPrice: 49, category: 'Apparel' },
    { id: 'qi-2', name: 'Trousers / Jeans', unitPrice: 59, category: 'Apparel' },
    { id: 'qi-3', name: 'Suit / Blazer (2-Pc)', unitPrice: 399, category: 'Couture' },
    { id: 'qi-4', name: 'Silk Saree / Kurta', unitPrice: 299, category: 'Ethnic' },
    { id: 'qi-5', name: 'Bedsheet & Linens', unitPrice: 129, category: 'Household' },
    { id: 'qi-6', name: 'Sneakers / Shoes', unitPrice: 299, category: 'Footwear' },
  ];

  useEffect(() => {
    serviceService.getServices({ publishedOnly: true })
      .then((data) => {
        setServices(data);
        const prefillSlug = searchParams.get('service');
        if (prefillSlug) {
          const match = data.find(s => s.slug === prefillSlug);
          if (match) setSelectedService(match);
        } else if (data.length > 0) {
          setSelectedService(data[0]);
        }
      });

    paymentService.getPaymentConfig().then(setPaymentConfig);

    // Check prefilled items from pricing calculator
    try {
      const savedItems = sessionStorage.getItem('techwash_prefilled_items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
        sessionStorage.removeItem('techwash_prefilled_items');
      }
      const savedExpress = sessionStorage.getItem('techwash_is_express');
      if (savedExpress) {
        setIsExpress(JSON.parse(savedExpress));
        sessionStorage.removeItem('techwash_is_express');
      }
      const couponParam = searchParams.get('coupon');
      if (couponParam) {
        setCouponCode(couponParam);
        if (couponParam === 'TECHWASH20') {
          setAppliedCoupon({ code: 'TECHWASH20', type: 'percentage', value: 20 });
        }
      }
    } catch (e) {}

    analyticsService.trackEvent('booking_start');
  }, [searchParams]);

  // Pricing Calculation
  const calculation = calculateOrderTotal({
    items,
    service: selectedService,
    isExpress,
    coupon: appliedCoupon,
  });

  const addItemQuantity = (item, delta) => {
    setItems((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i);
      }
      if (delta > 0) {
        return [...prev, { ...item, quantity: 1 }];
      }
      return prev;
    });
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'TECHWASH20') {
      setAppliedCoupon({ code: 'TECHWASH20', type: 'percentage', value: 20, maxDiscount: 200 });
      success('Coupon Applied!', 'Flat 20% discount applied to your order.');
    } else if (code === 'COUTURE15') {
      setAppliedCoupon({ code: 'COUTURE15', type: 'percentage', value: 15, maxDiscount: 300 });
      success('Coupon Applied!', '15% Couture discount applied.');
    } else {
      error('Invalid Coupon', 'Please enter a valid active promo code.');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 3) {
      if (!pickupLocation && (!address.street || !address.locality)) {
        error('Incomplete Address', 'Please confirm your doorstep pickup location or fill the address.');
        return;
      }
    }
    if (currentStep === 4) {
      if (!schedule.pickupDate || !schedule.pickupSlot) {
        error('Select Schedule', 'Please choose a pickup date and time slot.');
        return;
      }
    }
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!customer.name || !customer.phone) {
      error('Contact Info Required', 'Please enter your name and 10-digit mobile number.');
      return;
    }
    if (!validatePhone(customer.phone)) {
      error('Invalid Mobile', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const locationSnapshot = pickupLocation || {
        formattedAddress: `${address.building ? address.building + ', ' : ''}${address.street}, ${address.locality}, ${address.city} ${address.pincode}`,
        houseNumber: address.building,
        street: address.street,
        area: address.locality,
        landmark: address.landmark,
        city: address.city,
        state: 'Telangana',
        postalCode: address.pincode,
        country: 'India',
        latitude: 17.385044,
        longitude: 78.486671,
        locationSource: 'MANUAL',
        locationCapturedAt: new Date().toISOString(),
      };

      const orderPayload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
          address: locationSnapshot.formattedAddress,
          locality: locationSnapshot.area || address.locality,
          city: locationSnapshot.city || address.city,
        },
        pickupLocation: locationSnapshot,
        serviceId: selectedService?.id || 'general-care',
        serviceName: selectedService?.title || 'Garment Care',
        serviceSlug: selectedService?.slug || 'services',
        items: calculation.processedItems,
        isExpress,
        schedule: {
          pickupDate: schedule.pickupDate,
          pickupSlot: schedule.pickupSlot,
          instructions: schedule.instructions,
        },
        priceSnapshot: calculation.priceSnapshot,
        totalAmount: calculation.finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === 'PAY_ON_DELIVERY' ? 'PENDING' : 'PENDING',
      };

      const created = await orderService.createOrder(orderPayload);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#2563eb', '#10b981', '#f59e0b'],
        });
      } catch (err) {}

      setConfirmedOrder(created);
      analyticsService.trackEvent('booking_submit', { orderId: created.id, value: calculation.finalTotal });
      success('Booking Confirmed!', `Order ${created.orderNumber} placed successfully.`);
    } catch (err) {
      error('Booking Error', err.message || 'Failed to place booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (confirmedOrder) {
    return (
      <div className="py-16 sm:py-24 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card variant="luxury" className="p-8 sm:p-12 text-center bg-white border border-brand-200 shadow-luxury space-y-6">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md border border-emerald-100">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <Badge variant="emerald" size="lg">Booking Successfully Confirmed</Badge>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 mt-3">
                Thank You, {confirmedOrder.customer.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Your doorstep pickup has been scheduled for{' '}
                <strong className="text-slate-800">{confirmedOrder.schedule.pickupDate} ({confirmedOrder.schedule.pickupSlot})</strong>.
              </p>
            </div>

            {/* Order Card Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Order ID / Tracking Number:</span>
                <span className="font-mono font-bold text-sm text-brand-700">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Total:</span>
                <span className="font-bold text-slate-900">{formatCurrency(confirmedOrder.priceSnapshot.finalTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Option:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <Link to={`/track-order?id=${confirmedOrder.orderNumber}`} className="w-full sm:flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  Track Order Live
                </Button>
              </Link>

              <Link to="/" className="w-full sm:flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  Return Home
                </Button>
              </Link>
            </div>

          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Doorstep Scheduling</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            Schedule Doorstep Pickup
          </h1>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="mb-10 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[540px]">
            {STEPS.map((step) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-4 ring-brand-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {step.id < STEPS.length && (
                    <div className={`w-8 h-0.5 mx-1 ${isPast ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form Steps on Left, Sticky Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8">
            <Card variant="luxury" className="p-6 sm:p-10 bg-white">
              
              {/* STEP 1: SERVICE SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Select Primary Service
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose the main garment care category you require.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((s) => {
                      const isSelected = selectedService?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/40 shadow-luxury'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={isSelected ? 'brand' : 'slate'} size="sm">
                                {s.category || 'Garment Care'}
                              </Badge>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 font-display">
                              {s.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {s.shortDescription}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Starting:</span>
                            <span className="font-bold text-brand-700">
                              {s.startingPrice ? formatCurrency(s.startingPrice) : 'Quote'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: ITEMS & QUANTITY ESTIMATE */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 font-display">
                        Estimate Your Garment Count
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Optional: Add approximate item counts or skip to let our executive tally at doorstep.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {quickItems.map((qItem) => {
                      const currentCount = items.find(i => i.id === qItem.id)?.quantity || 0;
                      return (
                        <div
                          key={qItem.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              {qItem.name}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {formatCurrency(qItem.unitPrice)} / piece
                            </span>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => addItemQuantity(qItem, -1)}
                              className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-bold text-xs">
                              {currentCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => addItemQuantity(qItem, 1)}
                              className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: ADVANCED GPS + MANUAL PICKUP ADDRESS (Requirement #1 - #31) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {pickupLocation ? (
                    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-brand-200 shadow-luxury space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-navy-800 font-display">
                              Pickup Location Confirmed
                            </h3>
                            <div className="text-[11px] text-slate-400">
                              {pickupLocation.locationSource === 'GPS' ? '🛰️ Live Satellite GPS Verified' : '📍 ' + (pickupLocation.locationSource || 'Manual Entry')}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPickupLocation(null)}
                          className="px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Location</span>
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-1.5 text-xs">
                        <div className="font-bold text-navy-800 text-sm">
                          {pickupLocation.formattedAddress}
                        </div>
                        {pickupLocation.landmark && (
                          <div className="text-[11px] text-slate-600 font-medium">
                            <strong className="text-brand-700">Landmark:</strong> {pickupLocation.landmark}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          GPS: {pickupLocation.latitude?.toFixed(5)}, {pickupLocation.longitude?.toFixed(5)}
                          {pickupLocation.accuracy ? ` (±${pickupLocation.accuracy}m)` : ''}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          icon={ArrowRight}
                          onClick={() => {
                            setCurrentStep(4);
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                        >
                          Continue to Schedule Date & Slot
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <LocationPicker
                      initialLocation={pickupLocation}
                      onLocationConfirmed={(loc) => {
                        setPickupLocation(loc);
                        setAddress({
                          building: loc.houseNumber || '',
                          street: loc.street || '',
                          locality: loc.area || loc.locality || '',
                          city: loc.city || 'Hyderabad',
                          pincode: loc.postalCode || '',
                          landmark: loc.landmark || '',
                        });
                        success('Location Confirmed', 'Doorstep pickup coordinates locked.');
                        setCurrentStep(4);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }}
                    />
                  )}
                </div>
              )}

              {/* STEP 4: SCHEDULE & SLOTS */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Choose Date & Time Window
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Select your preferred 2-hour slot for executive doorstep arrival.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                        Pickup Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={schedule.pickupDate}
                        onChange={(e) => setSchedule({ ...schedule, pickupDate: e.target.value })}
                        className="w-full sm:w-64 p-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                        Preferred Time Slot *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          '08:00 AM - 10:00 AM',
                          '10:00 AM - 12:00 PM',
                          '12:00 PM - 02:00 PM',
                          '02:00 PM - 04:00 PM',
                          '04:00 PM - 06:00 PM',
                          '06:00 PM - 08:00 PM',
                        ].map((slot) => {
                          const isSelected = schedule.pickupSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSchedule({ ...schedule, pickupSlot: slot })}
                              className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Textarea
                      label="Special Instructions for Pickup Executive (Optional)"
                      rows={2}
                      placeholder="e.g. Ring the bell twice, call upon arrival, handle silk saree with extra care"
                      value={schedule.instructions}
                      onChange={(e) => setSchedule({ ...schedule, instructions: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: DELIVERY PREFERENCE */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Delivery Speed & Preferences
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose standard 48-hour care or 24-hour express turnaround.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setIsExpress(false)}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        !isExpress
                          ? 'border-brand-600 bg-brand-50/40 shadow-luxury'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Badge variant={!isExpress ? 'brand' : 'slate'} size="sm">Standard</Badge>
                      <h4 className="text-base font-bold text-slate-900 font-display mt-2">
                        48-Hour Regular Turnaround
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Thorough multi-stage soft wash, slow drying, and 3D tension steam press.
                      </p>
                      <div className="mt-4 text-xs font-bold text-emerald-700">
                        FREE on orders ₹499+
                      </div>
                    </div>

                    <div
                      onClick={() => setIsExpress(true)}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        isExpress
                          ? 'border-brand-600 bg-brand-50/40 shadow-luxury'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Badge variant="emerald" size="sm">Express 24H</Badge>
                      <h4 className="text-base font-bold text-slate-900 font-display mt-2">
                        Next-Day Express Turnaround
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Prioritized laboratory washing, express steam pressing, and dedicated dispatch.
                      </p>
                      <div className="mt-4 text-xs font-bold text-brand-700">
                        +₹99 Flat Express Priority
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: CONTACT DETAILS & PAYMENT */}
              {currentStep === 6 && (
                <form onSubmit={handleFinalSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Customer Details & Payment Choice
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Provide contact details for digital invoice delivery and tracking alerts.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Your Full Name *"
                        required
                        placeholder="e.g. Ramesh Chandra"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      />
                      <Input
                        label="Mobile Number (for OTP/Updates) *"
                        required
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Email Address (for Digital Receipt)"
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />

                    {/* Payment Method Selector */}
                    <div className="pt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                        Select Payment Option
                      </label>
                      <div className="space-y-3">
                        {Object.values(PAYMENT_METHODS).map((pm) => {
                          const isSelected = paymentMethod === pm.id;
                          return (
                            <div
                              key={pm.id}
                              onClick={() => setPaymentMethod(pm.id)}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                                isSelected
                                  ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div>
                                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                                    {pm.name}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {pm.description}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={isSelected ? 'brand' : 'slate'} size="sm">
                                {pm.badge}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      {/* Display UPI QR code if UPI_QR selected */}
                      {paymentMethod === 'UPI_QR' && paymentConfig?.upi?.enabled && (
                        <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white text-center space-y-3">
                          <p className="text-xs text-cyan-300 font-semibold">
                            Scan & Pay Instant via Any UPI App
                          </p>
                          {paymentConfig.upi.qrImageUrl ? (
                            <img
                              src={paymentConfig.upi.qrImageUrl}
                              alt="Payment QR"
                              className="w-40 h-40 object-contain mx-auto bg-white p-2 rounded-xl"
                            />
                          ) : (
                            <div className="w-36 h-36 bg-white rounded-xl mx-auto flex flex-col items-center justify-center text-slate-900 p-2 shadow-inner">
                              <QrCode className="w-16 h-16 text-brand-600 mb-1" />
                              <span className="text-[10px] font-mono font-bold">{paymentConfig.upi.upiId || 'techwash@upi'}</span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400">
                            UPI ID: <strong className="text-white">{paymentConfig.upi.upiId}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    size="md"
                    icon={ArrowLeft}
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                ) : <div />}

                {currentStep < 6 ? (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                    onClick={handleNextStep}
                  >
                    Continue to {STEPS[currentStep].label}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleFinalSubmit}
                    icon={CheckCircle2}
                  >
                    Confirm Doorstep Booking ({formatCurrency(calculation.finalTotal)})
                  </Button>
                )}
              </div>

            </Card>
          </div>

          {/* RIGHT LIVE ORDER SNAPSHOT SIDEBAR */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card variant="luxury" className="p-6 bg-white border border-brand-200 shadow-luxury space-y-4">
              
              <div className="pb-3 border-b border-slate-100">
                <Badge variant="brand" size="sm">Live Summary</Badge>
                <h3 className="text-base font-bold text-slate-900 font-display mt-1">
                  Order Breakdown
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Selected Service:</span>
                  <span className="font-bold text-slate-900">{selectedService?.title || 'General Care'}</span>
                </div>
                {schedule.pickupDate && (
                  <div className="flex justify-between">
                    <span>Pickup Date:</span>
                    <span className="font-semibold text-slate-900">{schedule.pickupDate}</span>
                  </div>
                )}
                {schedule.pickupSlot && (
                  <div className="flex justify-between">
                    <span>Time Window:</span>
                    <span className="font-semibold text-slate-900">{schedule.pickupSlot}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Turnaround:</span>
                  <span className={isExpress ? 'font-bold text-brand-600' : 'font-semibold text-slate-900'}>
                    {isExpress ? '24-Hour Express' : '48-Hour Standard'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Estimated Garments:
                  </span>
                  {items.map(i => (
                    <div key={i.id} className="flex justify-between text-slate-700">
                      <span>{i.name} (x{i.quantity})</span>
                      <span>{formatCurrency(i.unitPrice * i.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon Input */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="Promo Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-xs uppercase"
                  />
                  <Button variant="secondary" size="sm" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon {appliedCoupon.code} applied (-{formatCurrency(calculation.discountAmount)})</span>
                  </div>
                )}
              </div>

              {/* Financial Snapshot */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculation.itemsSubtotal)}</span>
                </div>
                {isExpress && (
                  <div className="flex justify-between text-brand-600">
                    <span>Express Fee:</span>
                    <span>+{formatCurrency(calculation.expressFee)}</span>
                  </div>
                )}
                {calculation.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(calculation.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Doorstep Pickup:</span>
                  <span className={calculation.deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {calculation.deliveryFee === 0 ? 'FREE' : formatCurrency(calculation.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(calculation.taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span className="font-display">Total Amount:</span>
                  <span className="text-2xl font-black text-brand-600 font-display">
                    {formatCurrency(calculation.finalTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero-risk guarantee • Pay after delivery</span>
              </div>

            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};
