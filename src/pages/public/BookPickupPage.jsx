import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { INITIAL_PRICING_CONFIG, pricingService } from '../../services/pricingConfig';
import { orderService } from '../../services/orderService';
import { paymentService, PAYMENT_METHODS } from '../../services/paymentService';
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
  Tag,
  Navigation,
  Edit3,
  AlertTriangle,
  Info,
  Scale,
  Maximize2,
  Trash2,
  Phone,
  MessageSquare,
  HelpCircle,
  Scissors
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Select Service', shortLabel: 'Service', icon: Sparkles },
  { id: 2, label: 'Configure Items', shortLabel: 'Items', icon: ShoppingBag },
  { id: 3, label: 'Pickup & Slot', shortLabel: 'Address & Slot', icon: MapPin },
  { id: 4, label: 'Review & Confirm', shortLabel: 'Summary', icon: CreditCard },
];

export const BookPickupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { settings } = useSettings();

  // Pricing config state (defaults to authoritative initial pricing)
  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);
  const [currentStep, setCurrentStep] = useState(1);

  // Selected Service
  const [selectedServiceId, setSelectedServiceId] = useState('dry-cleaning');

  // Step 2: Item and Service Configuration States
  // A. Itemized Services (Dry Cleaning & Ironing)
  const [itemizedCategory, setItemizedCategory] = useState('men'); // 'men' | 'women' | 'common'
  const [itemizedQuantities, setItemizedQuantities] = useState({}); // { [itemId]: count }
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // B. Per-KG Services (Wash & Iron, Wash & Fold)
  const [perKgGender, setPerKgGender] = useState('men'); // 'men' | 'women'
  const [perKgCounts, setPerKgCounts] = useState({
    men: { 'wt-m-1': 0, 'wt-m-2': 0, 'wt-m-3': 0, 'wt-m-4': 0, 'wt-m-5': 0, 'wt-m-6': 0 },
    women: { 'wt-w-1': 0, 'wt-w-2': 0, 'wt-w-3': 0, 'wt-w-4': 0, 'wt-w-5': 0, 'wt-w-6': 0 }
  });
  const [customKgInput, setCustomKgInput] = useState('');

  // C. Saree Rolling
  const [sareeCount, setSareeCount] = useState(1);
  const [sareeNotes, setSareeNotes] = useState('');

  // D. Curtain Washing
  const [curtainItems, setCurtainItems] = useState([
    { id: 'c-1', width: 4, height: 6, quantity: 2, label: 'Standard Window (4ft × 6ft)' }
  ]);

  // E. Shoe Washing
  const [shoePairs, setShoePairs] = useState(1);
  const [shoeType, setShoeType] = useState('Sneakers / Sports Shoes');

  // F. Carpet Washing
  const [carpetItems, setCarpetItems] = useState([
    { id: 'cp-1', length: 6, width: 4, quantity: 1, label: 'Medium Rug (6ft × 4ft)' }
  ]);

  // Step 3: Customer Details & Pickup Address & Schedule State
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    email: '',
  });

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

  // Turnaround & Coupon & Payment State
  const [isExpress, setIsExpress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PAY_ON_DELIVERY');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Load config & handle URL prefill
  useEffect(() => {
    pricingService.getPricingConfig().then(cfg => {
      if (cfg) setPricingConfig(cfg);
    });

    paymentService.getPaymentConfig().then(setPaymentConfig);

    const prefillService = searchParams.get('service');
    if (prefillService) {
      const match = INITIAL_PRICING_CONFIG.services.find(s => s.slug === prefillService || s.id === prefillService);
      if (match) setSelectedServiceId(match.id);
    }

    try {
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

  // Current active service definition
  const currentService = useMemo(() => {
    return pricingConfig.services.find(s => s.id === selectedServiceId) || pricingConfig.services[0];
  }, [pricingConfig, selectedServiceId]);

  // Handle WhatsApp sync
  const handlePhoneChange = (val) => {
    setCustomer(prev => ({
      ...prev,
      phone: val,
      whatsapp: prev.sameAsPhone ? val : prev.whatsapp,
    }));
  };

  const handleToggleSameAsPhone = (checked) => {
    setCustomer(prev => ({
      ...prev,
      sameAsPhone: checked,
      whatsapp: checked ? prev.phone : prev.whatsapp,
    }));
  };

  // ----------------------------------------------------
  // ITEM QUANTITY HANDLERS
  // ----------------------------------------------------
  const updateItemizedQty = (itemId, delta) => {
    setItemizedQuantities(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[itemId];
      } else {
        copy[itemId] = next;
      }
      return copy;
    });
  };

  const updatePerKgCount = (gender, itemId, delta) => {
    setPerKgCounts(prev => {
      const current = prev[gender]?.[itemId] || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [gender]: {
          ...prev[gender],
          [itemId]: next,
        }
      };
    });
  };

  // Curtain handlers
  const addCurtainItem = () => {
    setCurtainItems(prev => [
      ...prev,
      { id: `c-${Date.now()}`, width: 4, height: 6, quantity: 1, label: 'Custom Curtain' }
    ]);
  };

  const updateCurtainItem = (id, field, val) => {
    setCurtainItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: Number(val) || 0 };
      }
      return item;
    }));
  };

  const removeCurtainItem = (id) => {
    setCurtainItems(prev => prev.filter(item => item.id !== id));
  };

  // Carpet handlers
  const addCarpetItem = () => {
    setCarpetItems(prev => [
      ...prev,
      { id: `cp-${Date.now()}`, length: 6, width: 4, quantity: 1, label: 'Custom Carpet' }
    ]);
  };

  const updateCarpetItem = (id, field, val) => {
    setCarpetItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: Number(val) || 0 };
      }
      return item;
    }));
  };

  const removeCarpetItem = (id) => {
    setCarpetItems(prev => prev.filter(item => item.id !== id));
  };

  // ----------------------------------------------------
  // DYNAMIC PRICE & SUMMARY CALCULATION
  // ----------------------------------------------------
  const orderBreakdown = useMemo(() => {
    const lineItems = [];
    let itemsSubtotal = 0;
    let estimatedWeightKg = 0;
    let estimatedWeightGrams = 0;
    let hasUnpricedItems = false;
    let unpricedMessage = '';

    if (currentService.pricingType === 'ITEMIZED') {
      // Dry Cleaning or Ironing
      const catalog = currentService.id === 'dry-cleaning' 
        ? pricingConfig.dryCleaning 
        : pricingConfig.ironing;

      const allCatalogItems = [
        ...(catalog.men || []),
        ...(catalog.women || []),
        ...(catalog.common || []),
      ];

      Object.entries(itemizedQuantities).forEach(([itemId, qty]) => {
        if (qty > 0) {
          const itemDef = allCatalogItems.find(i => i.id === itemId);
          if (itemDef) {
            const lineTotal = itemDef.price * qty;
            itemsSubtotal += lineTotal;
            lineItems.push({
              id: itemDef.id,
              name: itemDef.name,
              category: itemDef.category,
              emoji: itemDef.emoji,
              quantity: qty,
              unitPrice: itemDef.price,
              lineTotal,
              unit: 'piece',
              startingNote: itemDef.startingNote || null,
            });
          }
        }
      });
    } else if (currentService.pricingType === 'PER_KG') {
      // Wash & Iron OR Wash & Fold
      const ratePerKg = currentService.baseRates[perKgGender] || (perKgGender === 'men' ? 130 : 160);
      const standards = pricingConfig.weightStandards[perKgGender] || [];
      const genderCounts = perKgCounts[perKgGender] || {};

      let totalGrams = 0;
      let totalPieces = 0;

      standards.forEach(std => {
        const qty = genderCounts[std.id] || 0;
        if (qty > 0) {
          totalPieces += qty;
          if (std.weightGrams) {
            totalGrams += std.weightGrams * qty;
          }
          lineItems.push({
            id: std.id,
            name: `${std.name} (${perKgGender === 'men' ? 'Men' : 'Women'})`,
            emoji: std.emoji,
            quantity: qty,
            weightGramsEach: std.weightGrams,
            unconfirmed: std.unconfirmed || false,
            unit: 'piece',
          });
        }
      });

      // If user provided manual custom weight override
      if (customKgInput && Number(customKgInput) > 0) {
        estimatedWeightKg = Number(customKgInput);
        estimatedWeightGrams = Math.round(estimatedWeightKg * 1000);
      } else {
        estimatedWeightGrams = totalGrams;
        estimatedWeightKg = Number((totalGrams / 1000).toFixed(2));
      }

      // If weight > 0, compute subtotal
      if (estimatedWeightKg > 0) {
        itemsSubtotal = Math.round(estimatedWeightKg * ratePerKg);
      } else if (totalPieces > 0) {
        // Fallback baseline estimation (minimum 1 kg if pieces selected)
        itemsSubtotal = Math.round(1 * ratePerKg);
      }
    } else if (currentService.pricingType === 'UNPRICED') {
      // Saree Rolling
      hasUnpricedItems = true;
      unpricedMessage = 'Price to be confirmed at pickup';
      lineItems.push({
        id: 'saree-rolling-item',
        name: 'Saree Rolling & Polishing',
        emoji: '🥻',
        quantity: sareeCount,
        unit: 'saree',
        unitPrice: null,
        lineTotal: null,
        note: 'Price to be confirmed by pickup executive after fabric inspection',
      });
    } else if (currentService.pricingType === 'DIMENSIONAL_AREA') {
      // Curtains or Carpets
      if (currentService.id === 'curtain-washing') {
        const ratePerSqFt = pricingConfig.curtains.ratePerSqFt || 30;
        curtainItems.forEach((c, idx) => {
          const area = Math.max(0, c.width * c.height);
          const lineTotal = Math.round(area * ratePerSqFt * (c.quantity || 1));
          itemsSubtotal += lineTotal;
          lineItems.push({
            id: c.id,
            name: `Curtain Set #${idx + 1} (${c.width}ft × ${c.height}ft)`,
            emoji: '🪟',
            dimensions: `${c.width}ft × ${c.height}ft (${area} sq.ft.)`,
            quantity: c.quantity,
            ratePerSqFt,
            lineTotal,
            unit: 'set',
          });
        });
      } else if (currentService.id === 'carpet-washing') {
        const ratePerSqFt = pricingConfig.carpets.ratePerSqFt || 45;
        carpetItems.forEach((c, idx) => {
          const area = Math.max(0, c.length * c.width);
          const lineTotal = Math.round(area * ratePerSqFt * (c.quantity || 1));
          itemsSubtotal += lineTotal;
          lineItems.push({
            id: c.id,
            name: `Carpet #${idx + 1} (${c.length}ft × ${c.width}ft)`,
            emoji: '🧶',
            dimensions: `${c.length}ft × ${c.width}ft (${area} sq.ft.)`,
            quantity: c.quantity,
            ratePerSqFt,
            lineTotal,
            unit: 'piece',
          });
        });
      }
    } else if (currentService.pricingType === 'PER_PAIR') {
      // Shoe Washing
      const ratePerPair = pricingConfig.shoes.ratePerPair || 350;
      const lineTotal = shoePairs * ratePerPair;
      itemsSubtotal += lineTotal;
      lineItems.push({
        id: 'shoe-washing-pair',
        name: `Shoe Deep Clean (${shoeType})`,
        emoji: '👟',
        quantity: shoePairs,
        unitPrice: ratePerPair,
        lineTotal,
        unit: 'pair',
      });
    }

    // Additional calculation rules
    const expressFee = isExpress ? 99 : 0;
    const deliveryFee = (itemsSubtotal >= 499 || itemsSubtotal === 0) ? 0 : 49;

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        discountAmount = Math.round(itemsSubtotal * (appliedCoupon.value / 100));
        if (appliedCoupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
        }
      } else if (appliedCoupon.type === 'flat') {
        discountAmount = Math.min(itemsSubtotal, appliedCoupon.value);
      }
    }

    const taxableBase = Math.max(0, itemsSubtotal + expressFee - discountAmount);
    const taxAmount = Math.round(taxableBase * 0.05); // 5% GST
    const finalTotal = Math.max(0, taxableBase + deliveryFee + taxAmount);

    return {
      lineItems,
      itemsSubtotal,
      estimatedWeightKg,
      estimatedWeightGrams,
      hasUnpricedItems,
      unpricedMessage,
      expressFee,
      deliveryFee,
      discountAmount,
      taxAmount,
      finalTotal,
    };
  }, [
    currentService,
    pricingConfig,
    itemizedQuantities,
    perKgGender,
    perKgCounts,
    customKgInput,
    sareeCount,
    curtainItems,
    shoePairs,
    shoeType,
    carpetItems,
    isExpress,
    appliedCoupon
  ]);

  // Coupon handling
  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'TECHWASH20') {
      setAppliedCoupon({ code: 'TECHWASH20', type: 'percentage', value: 20, maxDiscount: 200 });
      success('Coupon Applied!', 'Flat 20% discount applied to your order.');
    } else if (code === 'WELCOME50') {
      setAppliedCoupon({ code: 'WELCOME50', type: 'flat', value: 50 });
      success('Coupon Applied!', 'Flat ₹50 welcome discount applied.');
    } else {
      error('Invalid Promo Code', 'Please enter a valid active promo coupon.');
    }
  };

  // Step Navigations & Validations
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedServiceId) {
        error('Select Service', 'Please select a laundry service to continue.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      if (!customer.name.trim()) {
        error('Name Required', 'Please enter your full name.');
        return;
      }
      if (!validatePhone(customer.phone)) {
        error('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (customer.whatsapp && !validatePhone(customer.whatsapp)) {
        error('Invalid WhatsApp', 'Please enter a valid 10-digit WhatsApp number.');
        return;
      }
      if (!pickupLocation && (!address.street.trim() || !address.locality.trim())) {
        error('Address Required', 'Please detect live GPS location or enter your street and locality.');
        return;
      }
      if (!schedule.pickupDate || !schedule.pickupSlot) {
        error('Select Slot', 'Please choose your preferred pickup date and time window.');
        return;
      }
      setCurrentStep(4);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Final Booking Submission
  const handleFinalBooking = async (e) => {
    if (e) e.preventDefault();

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
          whatsapp: (customer.sameAsPhone ? customer.phone : customer.whatsapp).trim(),
          email: customer.email.trim(),
          address: locationSnapshot.formattedAddress,
          locality: locationSnapshot.area || address.locality,
          city: locationSnapshot.city || address.city,
        },
        pickupLocation: locationSnapshot,
        serviceId: currentService.id,
        serviceName: currentService.name,
        serviceSlug: currentService.slug,
        serviceEmoji: currentService.emoji,
        pricingType: currentService.pricingType,
        items: orderBreakdown.lineItems,
        estimatedWeightKg: orderBreakdown.estimatedWeightKg,
        isExpress,
        schedule: {
          pickupDate: schedule.pickupDate,
          pickupSlot: schedule.pickupSlot,
          instructions: schedule.instructions,
        },
        priceSnapshot: {
          calculatedAt: new Date().toISOString(),
          currency: 'INR',
          itemsSubtotal: orderBreakdown.itemsSubtotal,
          expressFee: orderBreakdown.expressFee,
          deliveryFee: orderBreakdown.deliveryFee,
          discountAmount: orderBreakdown.discountAmount,
          taxAmount: orderBreakdown.taxAmount,
          finalTotal: orderBreakdown.finalTotal,
          hasUnpricedItems: orderBreakdown.hasUnpricedItems,
          unpricedMessage: orderBreakdown.unpricedMessage,
          appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, discount: orderBreakdown.discountAmount } : null,
          isExpress,
        },
        totalAmount: orderBreakdown.finalTotal,
        paymentMethod,
        paymentStatus: 'PENDING',
        approximateWeightWarningAcknowledged: true,
      };

      const created = await orderService.createOrder(orderPayload);

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F97316', '#FB923C', '#10B981', '#3B82F6'],
        });
      } catch (err) {}

      setConfirmedOrder(created);
      analyticsService.trackEvent('booking_submit', { orderId: created.id, value: orderBreakdown.finalTotal });
      success('Booking Confirmed!', `Order ${created.orderNumber} placed successfully.`);
    } catch (err) {
      error('Booking Error', err.message || 'Failed to place booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // CONFIRMATION SUCCESS VIEW
  // ----------------------------------------------------
  if (confirmedOrder) {
    return (
      <div className="py-16 sm:py-24 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card variant="luxury" className="p-8 sm:p-12 text-center bg-white border border-brand-200 shadow-luxury space-y-6">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md border border-emerald-100 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <Badge variant="emerald" size="lg">Booking Successfully Scheduled</Badge>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 mt-3">
                Thank You, {confirmedOrder.customer.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Your doorstep pickup has been scheduled for{' '}
                <strong className="text-slate-800">{confirmedOrder.schedule.pickupDate} ({confirmedOrder.schedule.pickupSlot})</strong>.
              </p>
            </div>

            {/* Approximate Weight & Confirmation Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>WhatsApp Order Confirmation & Actual Weight:</strong>
                <p className="mt-0.5 text-amber-800 text-[11px]">
                  Our pickup executive will inspect the actual garment weight & count at your doorstep and immediately confirm the final details to your WhatsApp at <span className="font-bold text-amber-950">{confirmedOrder.customer.whatsapp || confirmedOrder.customer.phone}</span>.
                </p>
              </div>
            </div>

            {/* Order Card Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Order Tracking ID:</span>
                <span className="font-mono font-bold text-sm text-brand-700">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.serviceEmoji} {confirmedOrder.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Total:</span>
                <span className="font-bold text-slate-900">
                  {confirmedOrder.priceSnapshot.hasUnpricedItems && confirmedOrder.priceSnapshot.itemsSubtotal === 0 
                    ? 'Price to be confirmed' 
                    : formatCurrency(confirmedOrder.priceSnapshot.finalTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Address:</span>
                <span className="font-semibold text-slate-900 text-right line-clamp-1 max-w-[240px]">{confirmedOrder.customer.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Option:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.paymentMethod.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <Link to={`/track-order?id=${confirmedOrder.orderNumber}`} className="w-full sm:flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  Track Order Live ↗
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

  // ----------------------------------------------------
  // MAIN BOOKING WIZARD INTERFACE
  // ----------------------------------------------------
  return (
    <div className="py-10 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Tech Wash Doorstep Care</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            Schedule Doorstep Pickup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Transparent pricing • Demineralized RO wash • European steam press
          </p>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="mb-8 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px]">
            {STEPS.map((step) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    onClick={() => isPast && setCurrentStep(step.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-4 ring-brand-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                    {step.shortLabel}
                  </span>
                  {step.id < STEPS.length && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-1 ${isPast ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form Steps on Left (8 cols), Sticky Summary on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8">
            <Card variant="luxury" className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm">
              
              {/* ============================================================ */}
              {/* STEP 1: SELECT PRIMARY SERVICE (8 OFFICIAL SERVICES)         */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                      <span>Select Laundry Service</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Choose from our 8 specialized garment care categories below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pricingConfig.services.map((service) => {
                      const isSelected = selectedServiceId === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/40 shadow-luxury ring-2 ring-brand-400/20'
                              : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50/60 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-3xl p-2 rounded-2xl bg-white border border-slate-100 shadow-xs">
                                {service.emoji}
                              </span>
                              <Badge variant={isSelected ? 'brand' : 'slate'} size="sm">
                                {service.startingPriceDisplay}
                              </Badge>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 font-display">
                              {service.name}
                            </h3>
                            <p className="text-[11px] font-semibold text-brand-700 mt-0.5">
                              {service.tagline}
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                              {service.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Rate:</span>
                            <span className="font-bold text-slate-900">
                              {service.startingPriceDisplay}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: CONFIGURE ITEMS / WEIGHT / DIMENSIONS DYNAMICALLY    */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{currentService.emoji}</span>
                        <h2 className="text-xl font-bold text-slate-900 font-display">
                          {currentService.name} Configuration
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentService.tagline} • {currentService.startingPriceDisplay}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 underline self-start sm:self-auto"
                    >
                      Change Service
                    </button>
                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* CASE A: ITEMIZED SERVICES (Dry Cleaning & Ironing)       */}
                  {/* -------------------------------------------------------- */}
                  {currentService.pricingType === 'ITEMIZED' && (
                    <div className="space-y-5">
                      {/* Gender / Category Tabs */}
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        {[
                          { id: 'men', label: '👨 Men\'s Wear' },
                          { id: 'women', label: '👩 Women\'s & Kids' },
                          ...(currentService.id === 'dry-cleaning' ? [{ id: 'common', label: '🧸 Common & Bags' }] : []),
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setItemizedCategory(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              itemizedCategory === tab.id
                                ? 'bg-brand-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Item Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search garment item (e.g. Shirt, Kurta, Saree, Blazer)..."
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                        <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                        {(() => {
                          const catalog = currentService.id === 'dry-cleaning'
                            ? pricingConfig.dryCleaning
                            : pricingConfig.ironing;

                          const list = catalog[itemizedCategory] || [];
                          const filtered = list.filter(item => 
                            !itemSearchQuery || item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
                          );

                          if (filtered.length === 0) {
                            return (
                              <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                                No items found matching "{itemSearchQuery}".
                              </div>
                            );
                          }

                          return filtered.map(item => {
                            const count = itemizedQuantities[item.id] || 0;
                            return (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                  count > 0
                                    ? 'border-brand-500 bg-brand-50/50 shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-xl shrink-0">{item.emoji || '👔'}</span>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {item.name}
                                    </h4>
                                    <div className="text-[11px] font-bold text-brand-700 mt-0.5">
                                      {item.startingNote || item.rangeNote || formatCurrency(item.price)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => updateItemizedQty(item.id, -1)}
                                    disabled={count === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-xs text-slate-900">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateItemizedQty(item.id, 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CASE B: PER-KG SERVICES (Wash & Iron, Wash & Fold)       */}
                  {/* -------------------------------------------------------- */}
                  {currentService.pricingType === 'PER_KG' && (
                    <div className="space-y-6">
                      
                      {/* Gender Selector */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          Select Laundry Type / Gender Rate
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPerKgGender('men')}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              perKgGender === 'men'
                                ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">👨 Men's Apparel</span>
                              <Badge variant={perKgGender === 'men' ? 'brand' : 'slate'} size="sm">
                                {formatCurrency(currentService.baseRates.men)} / Kg
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Shirts, Trousers, Jeans, T-Shirts & Kurtas
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPerKgGender('women')}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              perKgGender === 'women'
                                ? 'border-brand-600 bg-brand-50/50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900">👩 Women's Apparel</span>
                              <Badge variant={perKgGender === 'women' ? 'brand' : 'slate'} size="sm">
                                {formatCurrency(currentService.baseRates.women)} / Kg
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Tops, Leggings, T-Shirts, Dresses & Sarees
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Weight Estimator with Exact Supplied Standards */}
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-brand-600" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Select Clothes to Estimate Weight
                            </h4>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Standard supplied garment weights
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(pricingConfig.weightStandards[perKgGender] || []).map(std => {
                            const count = perKgCounts[perKgGender]?.[std.id] || 0;
                            return (
                              <div
                                key={std.id}
                                className={`p-3 rounded-xl bg-white border transition-all flex items-center justify-between gap-3 ${
                                  count > 0 ? 'border-brand-500 shadow-xs' : 'border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xl">{std.emoji}</span>
                                  <div>
                                    <div className="text-xs font-bold text-slate-800">
                                      {std.name}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {std.weightGrams ? `${std.weightGrams}g (${std.weightKg} Kg)` : 'Weight confirmed at pickup'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => updatePerKgCount(perKgGender, std.id, -1)}
                                    disabled={count === 0}
                                    className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center font-bold text-xs">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updatePerKgCount(perKgGender, std.id, 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded bg-brand-100 text-brand-800 hover:bg-brand-200"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Weight Summary Box */}
                        <div className="p-4 rounded-xl bg-white border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-slate-400">Estimated Total Weight:</span>
                            <div className="text-base font-black text-slate-900 font-display">
                              {orderBreakdown.estimatedWeightKg} Kg{' '}
                              <span className="text-xs font-normal text-slate-500">
                                ({orderBreakdown.estimatedWeightGrams.toLocaleString()} grams)
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-slate-400">Estimated Subtotal:</span>
                            <div className="text-base font-black text-brand-600 font-display">
                              {formatCurrency(orderBreakdown.itemsSubtotal)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Mandatory Warning Banner */}
                      <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>⚠️ APPROXIMATE WEIGHT & PRICE NOTICE</span>
                        </div>
                        <p className="leading-relaxed text-[11px] text-amber-900 font-medium">
                          The weight and price shown are estimated based on the selected clothes. Our pickup executive will check the actual weight/items during pickup and update the final details to you on WhatsApp.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CASE C: SAREE ROLLING (Unpriced - "To be confirmed")     */}
                  {/* -------------------------------------------------------- */}
                  {currentService.pricingType === 'UNPRICED' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">🥻</span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                Saree Rolling & Wooden Cylinder Finishing
                              </h3>
                              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                Price to be confirmed at pickup
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setSareeCount(Math.max(1, sareeCount - 1))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {sareeCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSareeCount(sareeCount + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          Saree rolling and delicate polishing rates depend on the specific silk zari, fabric density, and embellishments. Our pickup executive will inspect the saree at your doorstep and update the exact quote with zero obligation.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CASE D: CURTAIN WASHING (Dimensional: ₹30/sq.ft.)        */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'curtain-washing' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Curtain Dimensions (Width × Height in Feet)
                          </h3>
                          <span className="text-[11px] text-brand-700 font-bold">
                            Rate: ₹30 / sq. ft.
                          </span>
                        </div>

                        <Button variant="outline" size="sm" icon={Plus} onClick={addCurtainItem}>
                          Add Another Curtain
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {curtainItems.map((cItem, index) => {
                          const area = cItem.width * cItem.height;
                          const linePrice = area * 30 * cItem.quantity;
                          return (
                            <div key={cItem.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  🪟 Curtain Set #{index + 1}
                                </span>
                                {curtainItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCurtainItem(cItem.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Width (ft)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={cItem.width}
                                    onChange={(e) => updateCurtainItem(cItem.id, 'width', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Height (ft)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={cItem.height}
                                    onChange={(e) => updateCurtainItem(cItem.id, 'height', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Quantity
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={cItem.quantity}
                                    onChange={(e) => updateCurtainItem(cItem.id, 'quantity', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                                <span className="text-slate-500">
                                  Area: <strong className="text-slate-800">{area} sq.ft.</strong> × {cItem.quantity} curtain(s)
                                </span>
                                <span className="font-bold text-brand-700">
                                  Subtotal: {formatCurrency(linePrice)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CASE E: SHOE WASHING (Per-Pair: ₹350/pair)               */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'shoe-washing' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Shoe Deep Cleaning & Disinfection
                            </h3>
                            <span className="text-xs font-bold text-brand-700">
                              ₹350 / pair (All sneaker & leather types)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setShoePairs(Math.max(1, shoePairs - 1))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {shoePairs}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShoePairs(shoePairs + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Select Footwear Style:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['Sneakers / Casual', 'Sports / Running', 'Formal Leather', 'Suede / Boots'].map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setShoeType(type)}
                                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                                  shoeType === type
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-500">{shoePairs} pair(s) × ₹350</span>
                          <span className="text-base font-black text-brand-700 font-display">
                            {formatCurrency(shoePairs * 350)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CASE F: CARPET WASHING (Dimensional: ₹45/sq.ft.)         */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'carpet-washing' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Carpet Dimensions (Length × Width in Feet)
                          </h3>
                          <span className="text-[11px] text-brand-700 font-bold">
                            Rate: ₹45 / sq. ft.
                          </span>
                        </div>

                        <Button variant="outline" size="sm" icon={Plus} onClick={addCarpetItem}>
                          Add Another Carpet
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {carpetItems.map((cpItem, index) => {
                          const area = cpItem.length * cpItem.width;
                          const linePrice = area * 45 * cpItem.quantity;
                          return (
                            <div key={cpItem.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  🧶 Carpet / Rug #{index + 1}
                                </span>
                                {carpetItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCarpetItem(cpItem.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Length (ft)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="40"
                                    value={cpItem.length}
                                    onChange={(e) => updateCarpetItem(cpItem.id, 'length', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Width (ft)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="40"
                                    value={cpItem.width}
                                    onChange={(e) => updateCarpetItem(cpItem.id, 'width', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Quantity
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={cpItem.quantity}
                                    onChange={(e) => updateCarpetItem(cpItem.id, 'quantity', e.target.value)}
                                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                                <span className="text-slate-500">
                                  Area: <strong className="text-slate-800">{area} sq.ft.</strong> × {cpItem.quantity} rug(s)
                                </span>
                                <span className="font-bold text-brand-700">
                                  Subtotal: {formatCurrency(linePrice)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: CUSTOMER CONTACT, PICKUP ADDRESS & SCHEDULE SLOT     */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Doorstep Pickup Details
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide contact number for live tracking & WhatsApp pickup alerts.
                    </p>
                  </div>

                  {/* Contact Inputs */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name *"
                        required
                        placeholder="e.g. Mahesh Velchuri"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      />
                      <Input
                        label="Mobile Number (10 Digits) *"
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={customer.phone}
                        onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>

                    {/* WhatsApp Checkbox */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customer.sameAsPhone}
                          onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Use same number for WhatsApp Order Updates & Invoices
                        </span>
                      </label>

                      {!customer.sameAsPhone && (
                        <div className="pt-2">
                          <Input
                            label="WhatsApp Number *"
                            type="tel"
                            maxLength={10}
                            placeholder="Enter 10-digit WhatsApp number"
                            value={customer.whatsapp}
                            onChange={(e) => setCustomer({ ...customer, whatsapp: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>
                      )}
                    </div>

                    <Input
                      label="Email Address (Optional, for tax invoices)"
                      type="email"
                      placeholder="e.g. mahesh@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>

                  {/* Doorstep Location Selection (LocationPicker with GPS) */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Doorstep Pickup Address *
                    </label>

                    {pickupLocation ? (
                      <div className="p-5 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-slate-900">
                              {pickupLocation.locationSource === 'GPS' ? '🛰️ Satellite GPS Confirmed' : '📍 ' + pickupLocation.locationSource}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickupLocation(null)}
                            className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Change Address
                          </button>
                        </div>

                        <div className="font-semibold text-slate-800 leading-relaxed">
                          {pickupLocation.formattedAddress}
                        </div>

                        {pickupLocation.landmark && (
                          <div className="text-[11px] text-slate-600">
                            <strong>Landmark:</strong> {pickupLocation.landmark}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Lat: {pickupLocation.latitude?.toFixed(4)}, Lon: {pickupLocation.longitude?.toFixed(4)}
                          </span>

                          <a
                            href={pickupLocation.latitude ? `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.latitude},${pickupLocation.longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupLocation.formattedAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-200 text-brand-700 text-xs font-bold shadow-xs hover:bg-brand-50"
                          >
                            <Navigation className="w-3.5 h-3.5 text-brand-600" />
                            <span>View on Google Maps ↗</span>
                          </a>
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
                          success('Location Locked', 'Pickup address coordinates confirmed.');
                        }}
                      />
                    )}
                  </div>

                  {/* Schedule Date & 2-Hour Slot */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Pickup Date *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={schedule.pickupDate}
                          onChange={(e) => setSchedule({ ...schedule, pickupDate: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          2-Hour Pickup Window *
                        </label>
                        <select
                          value={schedule.pickupSlot}
                          onChange={(e) => setSchedule({ ...schedule, pickupSlot: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Morning)</option>
                          <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Mid Morning)</option>
                          <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM (Afternoon)</option>
                          <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM (Evening Early)</option>
                          <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                          <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM (Night)</option>
                        </select>
                      </div>
                    </div>

                    <Textarea
                      label="Pickup Instructions / Gate Codes (Optional)"
                      rows={2}
                      placeholder="e.g. Ring flat bell 402, call before arrival, handle pattu saree with caution."
                      value={schedule.instructions}
                      onChange={(e) => setSchedule({ ...schedule, instructions: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: ORDER REVIEW, SPEED & PAYMENT CHOICE                 */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Review & Confirm Booking
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify your selected services and pick your preferred payment mode.
                    </p>
                  </div>

                  {/* Delivery Speed Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Select Turnaround Speed
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setIsExpress(false)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          !isExpress
                            ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">48-Hour Standard Care</span>
                          <Badge variant={!isExpress ? 'brand' : 'slate'} size="sm">Standard</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Complete RO soft wash, slow-drum dry, and 3D steam press.
                        </p>
                        <span className="text-xs font-bold text-emerald-700 block mt-2">FREE with order</span>
                      </div>

                      <div
                        onClick={() => setIsExpress(true)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isExpress
                            ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">24-Hour Express Turnaround</span>
                          <Badge variant="emerald" size="sm">Express 24H</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Prioritized wash cycle & dedicated dispatch within 24 hours.
                        </p>
                        <span className="text-xs font-bold text-brand-700 block mt-2">+₹99 Priority Fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Choose Payment Option
                    </label>
                    <div className="space-y-2.5">
                      {Object.values(PAYMENT_METHODS).map((pm) => {
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <div
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/40 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900">
                                  {pm.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
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
                  </div>

                  {/* Approximate Weight Confirmation Notice */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Doorstep Weight & Item Verification</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Our executive will weigh items on digital scale at your doorstep and WhatsApp you the final confirmed receipt. Pay only after delivery.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
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

                {currentStep < 4 ? (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                    onClick={handleNextStep}
                  >
                    Continue to {STEPS[currentStep].shortLabel}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleFinalBooking}
                    icon={CheckCircle2}
                  >
                    {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0
                      ? 'Confirm Doorstep Booking (Quote at Pickup)'
                      : `Confirm Doorstep Booking (${formatCurrency(orderBreakdown.finalTotal)})`}
                  </Button>
                )}
              </div>

            </Card>
          </div>

          {/* ============================================================ */}
          {/* RIGHT LIVE ORDER SNAPSHOT SIDEBAR (STICKY DESKTOP)           */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <Card variant="luxury" className="p-6 bg-white border border-brand-200 shadow-luxury space-y-4">
              
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <Badge variant="brand" size="sm">Live Estimate</Badge>
                  <h3 className="text-base font-bold text-slate-900 font-display mt-1">
                    Order Summary
                  </h3>
                </div>
                <span className="text-2xl">{currentService.emoji}</span>
              </div>

              {/* Service & Schedule Details */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Selected Service:</span>
                  <span className="font-bold text-slate-900">{currentService.name}</span>
                </div>
                {schedule.pickupDate && (
                  <div className="flex justify-between">
                    <span>Pickup Date:</span>
                    <span className="font-semibold text-slate-900">{schedule.pickupDate}</span>
                  </div>
                )}
                {schedule.pickupSlot && (
                  <div className="flex justify-between">
                    <span>Time Slot:</span>
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

              {/* Line Items List */}
              {orderBreakdown.lineItems.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Selected Items ({orderBreakdown.lineItems.length}):
                  </span>
                  {orderBreakdown.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                      <span className="truncate max-w-[180px]">
                        {item.emoji} {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-slate-900 shrink-0">
                        {item.lineTotal ? formatCurrency(item.lineTotal) : (item.unconfirmed ? 'To be weighed' : 'Quote at pickup')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Weight Indicator if Per-KG */}
              {currentService.pricingType === 'PER_KG' && orderBreakdown.estimatedWeightKg > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Estimated Weight:</span>
                  <span className="font-bold text-slate-900">
                    {orderBreakdown.estimatedWeightKg} Kg ({orderBreakdown.estimatedWeightGrams}g)
                  </span>
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Input
                    placeholder="PROMO CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-xs uppercase font-mono"
                  />
                  <Button variant="secondary" size="sm" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon {appliedCoupon.code} applied (-{formatCurrency(orderBreakdown.discountAmount)})</span>
                  </div>
                )}
              </div>

              {/* Financial Snapshot */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderBreakdown.itemsSubtotal)}</span>
                </div>
                {isExpress && (
                  <div className="flex justify-between text-brand-600">
                    <span>Express Priority (24H):</span>
                    <span>+{formatCurrency(orderBreakdown.expressFee)}</span>
                  </div>
                )}
                {orderBreakdown.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(orderBreakdown.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Doorstep Pickup:</span>
                  <span className={orderBreakdown.deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                    {orderBreakdown.deliveryFee === 0 ? 'FREE' : formatCurrency(orderBreakdown.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>GST (5%):</span>
                  <span>{formatCurrency(orderBreakdown.taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span className="font-display">Estimated Total:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-600 font-display">
                      {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                        ? 'To be confirmed' 
                        : formatCurrency(orderBreakdown.finalTotal)}
                    </span>
                    {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal > 0 && (
                      <span className="block text-[10px] text-amber-700 font-normal">
                        + Saree rolling quote at pickup
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero Advance Needed • Pay After Delivery</span>
              </div>

            </Card>
          </div>

        </div>

        {/* Mobile Sticky Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Estimated Total:
            </span>
            <span className="text-lg font-black text-brand-600 font-display">
              {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                ? 'To be confirmed' 
                : formatCurrency(orderBreakdown.finalTotal)}
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={currentStep === 4 ? handleFinalBooking : handleNextStep}
            isLoading={isSubmitting}
            icon={currentStep === 4 ? CheckCircle2 : ArrowRight}
            iconPosition="right"
          >
            {currentStep === 4 ? 'Confirm Booking' : `Step ${currentStep + 1} ➔`}
          </Button>
        </div>

      </div>
    </div>
  );
};
