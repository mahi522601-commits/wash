import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { INITIAL_PRICING_CONFIG, pricingService } from '../../services/pricingConfig';
import { 
  orderService, 
  TIME_PERIODS, 
  TIME_SLOTS, 
  calculateDefaultDelivery, 
  normalizeDateString 
} from '../../services/orderService';
import { paymentService, PAYMENT_METHODS } from '../../services/paymentService';
import { UpiPaymentCard } from '../../components/payment/UpiPaymentCard';
import { UpiAppLogosRow } from '../../components/payment/UpiLogos';
import { playOrderPlacedSound } from '../../utils/audioNotification';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { WhatsAppLogo } from '../../components/ui/BrandIcons';
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
  ChevronDown,
  ChevronUp,
  X,
  Search,
  CheckCircle
} from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';

const STEPS = [
  { id: 1, label: 'SERVICE', shortLabel: 'Service', icon: Sparkles },
  { id: 2, label: 'ITEMS', shortLabel: 'Items', icon: ShoppingBag },
  { id: 3, label: 'DETAILS', shortLabel: 'Address & Slot', icon: MapPin },
  { id: 4, label: 'SUMMARY', shortLabel: 'Summary', icon: CreditCard },
];

const SUBCATEGORY_TABS = {
  dryCleaning: [
    { id: 'all', label: 'All Items', emoji: '✨' },
    { id: 'tops', label: 'Tops', emoji: '👕' },
    { id: 'bottoms', label: 'Pants & Bottoms', emoji: '👖' },
    { id: 'jackets', label: 'Jackets & Formal', emoji: '🧥' },
    { id: 'traditional', label: 'Sarees & Traditional', emoji: '🥻' },
    { id: 'dresses', label: 'Dresses & Couture', emoji: '👗' },
    { id: 'kids', label: 'Kids & Toys', emoji: '🧸' },
    { id: 'bags', label: 'Bags & Accessories', emoji: '👜' },
    { id: 'shoes', label: 'Shoes', emoji: '👟' },
  ],
  ironing: [
    { id: 'all', label: 'All Items', emoji: '✨' },
    { id: 'tops', label: 'Tops', emoji: '👕' },
    { id: 'bottoms', label: 'Pants & Bottoms', emoji: '👖' },
    { id: 'jackets', label: 'Jackets & Formal', emoji: '🧥' },
    { id: 'traditional', label: 'Sarees & Traditional', emoji: '🥻' },
    { id: 'dresses', label: 'Dresses & Couture', emoji: '👗' },
    { id: 'household', label: 'Home & Curtains', emoji: '🏠' },
    { id: 'kids', label: 'Kids', emoji: '🧸' },
  ],
  'starch-and-iron': [
    { id: 'all', label: 'All Items', emoji: '✨' },
    { id: 'tops', label: 'Tops & Shirts', emoji: '👔' },
    { id: 'traditional', label: 'Sarees & Ethnic', emoji: '🥻' },
    { id: 'bottoms', label: 'Pants & Bottoms', emoji: '👖' },
    { id: 'household', label: 'Home & Linens', emoji: '🏠' },
    { id: 'jackets', label: 'Workwear & Aprons', emoji: '🥼' },
  ]
};

export const findMatchingService = (serviceParam, servicesList = []) => {
  if (!serviceParam) return null;
  const raw = String(serviceParam).toLowerCase().trim();
  const clean = raw.replace(/^srv-/, '');
  
  // 1. Direct match on id or slug
  const direct = servicesList.find(s => s.id === raw || s.slug === raw || s.id === clean || s.slug === clean);
  if (direct) return direct;

  // 2. Synonyms and fuzzy aliases
  const aliasMap = {
    'steam-ironing': 'ironing',
    'iron': 'ironing',
    'ironing': 'ironing',
    'wash-iron': 'wash-and-iron',
    'wash-and-iron': 'wash-and-iron',
    'wash-fold': 'wash-and-fold',
    'wash-and-fold': 'wash-and-fold',
    'wash-and-fold-laundry': 'wash-and-fold',
    'curtain-cleaning': 'curtain-washing',
    'curtain-washing': 'curtain-washing',
    'curtains': 'curtain-washing',
    'shoe-cleaning': 'shoe-washing',
    'shoe-washing': 'shoe-washing',
    'shoes': 'shoe-washing',
    'carpet-cleaning': 'carpet-washing',
    'carpet-washing': 'carpet-washing',
    'carpets': 'carpet-washing',
    'saree': 'saree-rolling',
    'saree-rolling': 'saree-rolling',
    'dryclean': 'dry-cleaning',
    'dry-cleaning': 'dry-cleaning',
    'dry-clean': 'dry-cleaning',
  };

  const targetId = aliasMap[clean] || aliasMap[raw];
  if (targetId) {
    const aliasMatch = servicesList.find(s => s.id === targetId || s.slug === targetId);
    if (aliasMatch) return aliasMatch;
  }

  // 3. Fallback partial match
  return servicesList.find(s => {
    const sId = (s.id || '').toLowerCase();
    const sSlug = (s.slug || '').toLowerCase();
    const sName = (s.name || s.title || '').toLowerCase();
    return sId.includes(clean) || clean.includes(sId) || sSlug.includes(clean) || clean.includes(sSlug) || sName.includes(clean);
  }) || null;
};

export const BookPickupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();
  const { settings } = useSettings();

  // Pricing config state
  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);

  // Step 1: Selected Service & Step Initialization
  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    const prefill = searchParams.get('service');
    const match = findMatchingService(prefill, INITIAL_PRICING_CONFIG.services);
    return match ? match.id : 'dry-cleaning';
  });

  // When a service is provided in URL, jump STRAIGHT to Step 2 (Items & Quantities)
  const [currentStep, setCurrentStep] = useState(() => {
    const prefill = searchParams.get('service');
    return prefill ? 2 : 1;
  });

  // Step 2: Customer Personas & Categories
  // 'men' | 'women' | 'mixed'
  const [clothingFor, setClothingFor] = useState('men');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [perKgMode, setPerKgMode] = useState('preset'); // 'preset' | 'doorstep' | 'manual'
  const [bagSize, setBagSize] = useState(5); // kg (3, 5, 8)
  const [showManualPerKg, setShowManualPerKg] = useState(false);

  // Quantities for Itemized Services (Dry Cleaning & Ironing)
  const [itemizedQuantities, setItemizedQuantities] = useState({});

  // Quantities for Per-KG Services (Wash & Iron, Wash & Fold)
  const [perKgCounts, setPerKgCounts] = useState({
    men: { 'wt-m-1': 0, 'wt-m-2': 0, 'wt-m-3': 0, 'wt-m-4': 0, 'wt-m-5': 0, 'wt-m-6': 0 },
    women: { 'wt-w-1': 0, 'wt-w-2': 0, 'wt-w-3': 0, 'wt-w-4': 0, 'wt-w-5': 0, 'wt-w-6': 0 }
  });

  // Saree Rolling
  const [sareeCount, setSareeCount] = useState(1);

  // Curtain Sub-Services (4 Standard Sub-Services: Dry Cleaning, Wash & Iron, Iron, Wash & Fold)
  const [curtainCounts, setCurtainCounts] = useState({
    dryCleaning: 0,
    washAndIron: 0,
    iron: 0,
    washAndFold: 0,
  });

  // Shoe Washing (Per-Pair)
  const [shoePairs, setShoePairs] = useState(1);
  const [shoeType, setShoeType] = useState('Sneakers / Casual');

  // Carpet Washing (Dimensional)
  const [carpetItems, setCarpetItems] = useState([
    { id: 'carpet-1', length: 10, width: 8, quantity: 1 }
  ]);

  // Step 3: Customer Details & Pickup Address & Schedule
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

  const [schedule, setSchedule] = useState(() => {
    const pickupDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const defDelivery = calculateDefaultDelivery(pickupDate, false, 'MORNING');
    return {
      pickupDate,
      pickupPeriod: 'MORNING',
      pickupSlot: 'Morning (08:00 AM - 12:00 PM)',
      deliveryDate: defDelivery.deliveryDate,
      deliveryPeriod: 'MORNING',
      deliverySlot: defDelivery.deliverySlot,
      instructions: '',
    };
  });

  // Turnaround & Coupon & Payment State
  const [isExpress, setIsExpress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PAY_ON_DELIVERY');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Mobile Bottom Drawer Open State
  const [isMobileBagOpen, setIsMobileBagOpen] = useState(false);

  // Load config & handle URL prefill
  useEffect(() => {
    pricingService.getPricingConfig().then(cfg => {
      if (cfg) setPricingConfig(cfg);
    });

    const unsubPricing = pricingService.subscribeToPricing((newCfg) => {
      if (newCfg) setPricingConfig(newCfg);
    });

    paymentService.getPaymentConfig().then(setPaymentConfig);

    const handlePaymentConfigUpdate = (e) => {
      if (e.detail) {
        setPaymentConfig(e.detail);
      } else {
        paymentService.getPaymentConfig().then(setPaymentConfig);
      }
    };
    window.addEventListener('techwash-payment-config-updated', handlePaymentConfigUpdate);

    const prefillService = searchParams.get('service');
    if (prefillService) {
      const match = findMatchingService(prefillService, pricingConfig.services || INITIAL_PRICING_CONFIG.services);
      if (match) {
        setSelectedServiceId(match.id);
        setCurrentStep(2); // Jump straight to Step 2
      }
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

    return () => {
      unsubPricing();
      window.removeEventListener('techwash-payment-config-updated', handlePaymentConfigUpdate);
    };
  }, [searchParams]);

  // All services including dynamic custom services
  const allAvailableServices = useMemo(() => {
    const base = pricingConfig.services || INITIAL_PRICING_CONFIG.services;
    const custom = Array.isArray(pricingConfig.customServices) ? pricingConfig.customServices : [];
    const formattedCustom = custom.map(cs => ({
      id: cs.id,
      slug: cs.slug || cs.id,
      name: cs.name || cs.title,
      title: cs.name || cs.title,
      emoji: cs.emoji || cs.icon || '✨',
      icon: cs.emoji || cs.icon || '✨',
      tagline: cs.category || 'Specialized Care',
      description: cs.shortDescription || 'Bespoke garment care treatment',
      startingPriceDisplay: `Starts at ₹${cs.startingPrice || cs.defaultPrice || 99}`,
      pricingType: cs.pricingType === 'per_kg' ? 'PER_KG' : 'ITEMIZED',
      subServices: cs.subServices || [],
      isCustom: true,
    }));
    return [...base, ...formattedCustom];
  }, [pricingConfig.services, pricingConfig.customServices]);

  // Current active service definition
  const currentService = useMemo(() => {
    return allAvailableServices.find(s => s.id === selectedServiceId || s.slug === selectedServiceId) || allAvailableServices[0];
  }, [allAvailableServices, selectedServiceId]);

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

  // Curtain sub-services handler
  const updateCurtainSubServiceCount = (subKey, delta) => {
    setCurtainCounts(prev => ({
      ...prev,
      [subKey]: Math.max(0, (prev[subKey] || 0) + delta)
    }));
  };

  // Carpet handlers
  const addCarpetItem = () => {
    setCarpetItems(prev => [
      ...prev,
      { id: `carpet-${Date.now()}`, length: 10, width: 8, quantity: 1 }
    ]);
  };

  const updateCarpetItem = (id, field, val) => {
    const num = Math.max(1, Number(val) || 1);
    setCarpetItems(prev => prev.map(item => item.id === id ? { ...item, [field]: num } : item));
  };

  const removeCarpetItem = (id) => {
    if (carpetItems.length <= 1) return;
    setCarpetItems(prev => prev.filter(item => item.id !== id));
  };

  // Phone and WhatsApp sync
  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setCustomer(prev => ({
      ...prev,
      phone: cleaned,
      whatsapp: prev.sameAsPhone ? cleaned : prev.whatsapp,
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
  // DYNAMIC PRICE & SUMMARY CALCULATION
  // ----------------------------------------------------
  const orderBreakdown = useMemo(() => {
    const lineItems = [];
    let itemsSubtotal = 0;
    let estimatedWeightKg = 0;
    let estimatedWeightGrams = 0;
    let hasUnpricedItems = false;
    let unpricedMessage = '';
    let totalItemCount = 0;

    if (currentService.pricingType === 'ITEMIZED') {
      // Dry Cleaning, Ironing, or Starch & Iron
      const catalog = currentService.id === 'dry-cleaning' 
        ? pricingConfig.dryCleaning 
        : ((currentService.id === 'starch-and-iron' || currentService.id === 'srv-starch-and-iron')
            ? (pricingConfig['starch-and-iron'] || pricingConfig.starchAndIron || {})
            : pricingConfig.ironing);

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
            totalItemCount += qty;
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

      // If user selected 0 items, treat as Doorstep Tally
      if (totalItemCount === 0) {
        hasUnpricedItems = true;
        unpricedMessage = 'Garments will be counted and tagged at doorstep';
        totalItemCount = 1;
        lineItems.push({
          id: 'itemized-doorstep-count',
          name: `${currentService.name} (Tally at Doorstep)`,
          emoji: currentService.emoji || '🧺',
          quantity: 1,
          unconfirmed: true,
          unit: 'bundle',
        });
      }
    } else if (currentService.pricingType === 'PER_KG') {
      // Wash & Iron OR Wash & Fold
      const menRate = currentService.baseRates.men;
      const womenRate = currentService.baseRates.women;
      const effectiveRate = clothingFor === 'women' ? womenRate : menRate;

      if (perKgMode === 'doorstep') {
        hasUnpricedItems = true;
        unpricedMessage = 'Weighed with digital scale during doorstep pickup';
        totalItemCount = 1;
        lineItems.push({
          id: 'per-kg-doorstep-scale',
          name: `${currentService.name} (Doorstep Scale Weighing)`,
          persona: clothingFor === 'women' ? "Women's" : clothingFor === 'men' ? "Men's" : "Mixed",
          emoji: '⚖️',
          quantity: 1,
          unconfirmed: true,
          unit: 'load',
        });
      } else if (perKgMode === 'preset') {
        const weight = bagSize || 5;
        estimatedWeightKg = weight;
        estimatedWeightGrams = weight * 1000;
        itemsSubtotal = Math.round(weight * effectiveRate);
        totalItemCount = 1;
        lineItems.push({
          id: `per-kg-bag-${weight}kg`,
          name: `${currentService.name} (~${weight} Kg Load)`,
          persona: clothingFor === 'women' ? "Women's" : clothingFor === 'men' ? "Men's" : "Mixed",
          emoji: '🧺',
          quantity: 1,
          weightGramsEach: weight * 1000,
          totalGrams: weight * 1000,
          unitPrice: effectiveRate,
          lineTotal: itemsSubtotal,
          unit: 'load',
        });
      } else {
        // Manual item counting
        const menStandards = pricingConfig.weightStandards.men || [];
        const womenStandards = pricingConfig.weightStandards.women || [];

        let menGrams = 0;
        let womenGrams = 0;

        if (clothingFor === 'men' || clothingFor === 'mixed') {
          menStandards.forEach(std => {
            const qty = perKgCounts.men?.[std.id] || 0;
            if (qty > 0) {
              totalItemCount += qty;
              if (std.weightGrams) {
                menGrams += std.weightGrams * qty;
              }
              lineItems.push({
                id: std.id,
                name: std.name,
                persona: "Men's",
                emoji: std.emoji,
                quantity: qty,
                weightGramsEach: std.weightGrams,
                totalGrams: std.weightGrams ? std.weightGrams * qty : null,
                unconfirmed: std.unconfirmed || false,
                unit: 'piece',
              });
            }
          });
        }

        if (clothingFor === 'women' || clothingFor === 'mixed') {
          womenStandards.forEach(std => {
            const qty = perKgCounts.women?.[std.id] || 0;
            if (qty > 0) {
              totalItemCount += qty;
              if (std.weightGrams) {
                womenGrams += std.weightGrams * qty;
              }
              lineItems.push({
                id: std.id,
                name: std.name,
                persona: "Women's",
                emoji: std.emoji,
                quantity: qty,
                weightGramsEach: std.weightGrams,
                totalGrams: std.weightGrams ? std.weightGrams * qty : null,
                unconfirmed: std.unconfirmed || false,
                unit: 'piece',
              });
            }
          });
        }

        const totalGrams = menGrams + womenGrams;
        estimatedWeightGrams = totalGrams;
        estimatedWeightKg = Number((totalGrams / 1000).toFixed(2));

        const menKg = menGrams / 1000;
        const womenKg = womenGrams / 1000;
        itemsSubtotal = Math.round((menKg * menRate) + (womenKg * womenRate));
      }
    } else if (currentService.pricingType === 'UNPRICED' || currentService.id === 'saree-rolling' || currentService.id === 'srv-saree-rolling') {
      // Saree Rolling
      const sareeRate = Number(pricingConfig.sareeRolling?.rate) || null;
      if (sareeRate) {
        const lineTotal = sareeCount * sareeRate;
        itemsSubtotal += lineTotal;
        totalItemCount = sareeCount;
        lineItems.push({
          id: 'saree-rolling-item',
          name: 'Saree Rolling & Polishing',
          emoji: '🥻',
          quantity: sareeCount,
          unit: 'saree',
          unitPrice: sareeRate,
          lineTotal,
        });
      } else {
        hasUnpricedItems = true;
        unpricedMessage = 'Price to be confirmed at pickup';
        totalItemCount = sareeCount;
        lineItems.push({
          id: 'saree-rolling-item',
          name: 'Saree Rolling',
          emoji: '🥻',
          quantity: sareeCount,
          unit: 'saree',
          unitPrice: null,
          lineTotal: null,
          note: 'Price to be confirmed by pickup executive after fabric inspection',
        });
      }
    } else if (currentService.id === 'curtain-washing' || currentService.id === 'srv-curtain-spa') {
      // Curtains (4 Official Sub-Services: Dry Cleaning, Wash & Iron, Iron, Wash & Fold)
      const curtainPricing = pricingConfig.curtains || {
        dryCleaning: 200,
        washAndIron: 150,
        iron: 60,
        washAndFold: 100,
      };

      const curtainDefs = [
        { key: 'dryCleaning', name: 'Curtain Dry Cleaning', price: Number(curtainPricing.dryCleaning !== undefined ? curtainPricing.dryCleaning : 200), emoji: '🧺', subName: 'Dry Cleaning' },
        { key: 'washAndIron', name: 'Curtain Wash & Iron', price: Number(curtainPricing.washAndIron !== undefined ? curtainPricing.washAndIron : 150), emoji: '🫧', subName: 'Wash & Iron' },
        { key: 'iron', name: 'Curtain Iron', price: Number(curtainPricing.iron !== undefined ? curtainPricing.iron : 60), emoji: '✨', subName: 'Iron' },
        { key: 'washAndFold', name: 'Curtain Wash & Fold', price: Number(curtainPricing.washAndFold !== undefined ? curtainPricing.washAndFold : 100), emoji: '👕', subName: 'Wash & Fold' },
      ];

      curtainDefs.forEach(def => {
        const qty = curtainCounts[def.key] || 0;
        if (qty > 0) {
          const lineTotal = qty * def.price;
          itemsSubtotal += lineTotal;
          totalItemCount += qty;
          lineItems.push({
            id: `curtain-${def.key}`,
            name: def.name,
            serviceName: 'Curtain Service',
            subServiceName: def.subName,
            emoji: def.emoji,
            quantity: qty,
            unitPrice: def.price,
            lineTotal,
            unit: 'panel',
          });
        }
      });
    } else if (currentService.pricingType === 'DIMENSIONAL_AREA' || currentService.id === 'carpet-washing') {
      // Carpets
      const ratePerSqFt = pricingConfig.carpets?.ratePerSqFt || 45;
      carpetItems.forEach((c, idx) => {
        const area = Math.max(1, c.length * c.width);
        const lineTotal = Math.round(area * ratePerSqFt * (c.quantity || 1));
        itemsSubtotal += lineTotal;
        totalItemCount += c.quantity || 1;
        lineItems.push({
          id: c.id,
          name: `Carpet (${c.length}ft × ${c.width}ft)`,
          emoji: '🧶',
          dimensions: `${c.length}ft × ${c.width}ft = ${area} sq.ft.`,
          areaSqFt: area,
          quantity: c.quantity,
          ratePerSqFt,
          lineTotal,
          unit: 'piece',
        });
      });
    } else if (currentService.pricingType === 'PER_PAIR') {
      // Shoe Washing
      const ratePerPair = pricingConfig.shoes.ratePerPair || 350;
      const lineTotal = shoePairs * ratePerPair;
      itemsSubtotal += lineTotal;
      totalItemCount = shoePairs;
      lineItems.push({
        id: 'shoe-washing-pair',
        name: `Shoe Washing (${shoeType})`,
        emoji: '👟',
        quantity: shoePairs,
        unitPrice: ratePerPair,
        lineTotal,
        unit: 'pair',
      });
    } else if (currentService.isCustom) {
      // Dynamic Custom Service
      const subItems = Array.isArray(currentService.subServices) && currentService.subServices.length > 0
        ? currentService.subServices
        : [{ id: `${currentService.id}-base`, name: currentService.name, price: currentService.startingPrice || currentService.defaultPrice || 99, emoji: currentService.emoji || '✨' }];

      subItems.forEach(item => {
        const qty = itemizedQuantities[item.id] || 0;
        if (qty > 0) {
          const lineTotal = Number(item.price || 0) * qty;
          itemsSubtotal += lineTotal;
          totalItemCount += qty;
          lineItems.push({
            id: item.id,
            name: `${currentService.name} — ${item.name}`,
            serviceName: currentService.name,
            subServiceName: item.name,
            category: currentService.tagline || 'Custom Care',
            emoji: item.emoji || currentService.emoji || '✨',
            quantity: qty,
            unitPrice: item.price,
            lineTotal,
            unit: currentService.pricingType === 'PER_KG' ? 'kg' : 'piece',
          });
        }
      });

      if (totalItemCount === 0) {
        hasUnpricedItems = true;
        unpricedMessage = 'Garments will be counted and tagged at doorstep';
        totalItemCount = 1;
        lineItems.push({
          id: `${currentService.id}-doorstep-count`,
          name: `${currentService.name} (Tally at Doorstep)`,
          emoji: currentService.emoji || '✨',
          quantity: 1,
          unconfirmed: true,
          unit: 'bundle',
        });
      }
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
    const taxAmount = 0; // 0% GST (GST removed)
    const finalTotal = Math.max(0, taxableBase + deliveryFee);

    return {
      lineItems,
      totalItemCount,
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
    clothingFor,
    itemizedQuantities,
    perKgCounts,
    perKgMode,
    bagSize,
    sareeCount,
    curtainCounts,
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

  // Step Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedServiceId) {
        error('Select Service', 'Please choose a service to get started.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      if (orderBreakdown.totalItemCount === 0 && currentService.pricingType !== 'UNPRICED') {
        info('No items selected', 'You can proceed or add estimated clothes. Our executive can also tally at doorstep.');
      }
      setCurrentStep(3);
      setIsMobileBagOpen(false);
      window.scrollTo({ top: 100, behavior: 'smooth' });
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
      setIsMobileBagOpen(false);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setIsMobileBagOpen(false);
      window.scrollTo({ top: 100, behavior: 'smooth' });
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
        pickupDate: schedule.pickupDate,
        pickupPeriod: schedule.pickupPeriod || 'MORNING',
        pickupSlot: schedule.pickupSlot,
        deliveryDate: schedule.deliveryDate || calculateDefaultDelivery(schedule.pickupDate, isExpress, schedule.deliveryPeriod).deliveryDate,
        deliveryPeriod: schedule.deliveryPeriod || 'MORNING',
        deliverySlot: schedule.deliverySlot || calculateDefaultDelivery(schedule.pickupDate, isExpress, schedule.deliveryPeriod).deliverySlot,
        schedule: {
          pickupDate: schedule.pickupDate,
          pickupPeriod: schedule.pickupPeriod || 'MORNING',
          pickupSlot: schedule.pickupSlot,
          deliveryDate: schedule.deliveryDate || calculateDefaultDelivery(schedule.pickupDate, isExpress, schedule.deliveryPeriod).deliveryDate,
          deliveryPeriod: schedule.deliveryPeriod || 'MORNING',
          deliverySlot: schedule.deliverySlot || calculateDefaultDelivery(schedule.pickupDate, isExpress, schedule.deliveryPeriod).deliverySlot,
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
        storeBranch: 'Tech Wash Laundry Main Branch',
        storeAddress: 'Shaikpet Main Rd,Sri Ram Nagar Colony,Manikonda,Hyderabad,Telangana,500089',
        paymentMethod,
        paymentStatus: 'PENDING',
        approximateWeightWarningAcknowledged: true,
      };

      const created = await orderService.createOrder(orderPayload);

      // Play custom order confirmation chime from /1.mp4
      playOrderPlacedSound();

      // Automatically dispatch rich WhatsApp order confirmation to customer's WhatsApp in the background
      whatsappNotificationService.sendCustomerWhatsAppOrderConfirmation(created, { autoOpen: false });

      try {
        confetti({
          particleCount: 130,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#F97316', '#FB923C', '#10B981', '#3B82F6'],
        });
      } catch (err) {}

      setConfirmedOrder(created);
      analyticsService.trackEvent('booking_submit', { orderId: created.id, value: orderBreakdown.finalTotal });
      success('Booking Confirmed!', `Order ${created.orderNumber} placed & details sent to your WhatsApp.`);
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
      <div className="py-14 sm:py-20 bg-slate-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card variant="luxury" className="p-8 sm:p-12 text-center bg-white border border-brand-200 shadow-luxury space-y-6">
            
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md border border-emerald-100 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <Badge variant="emerald" size="lg">Pickup Successfully Scheduled</Badge>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 mt-3">
                Thank You, {confirmedOrder.customer.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Your doorstep pickup has been booked for{' '}
                <strong className="text-slate-800">{confirmedOrder.schedule.pickupDate} ({confirmedOrder.schedule.pickupSlot})</strong>.
              </p>
            </div>

            {/* 1. WHATSAPP CONFIRMATION CARD (1-CLICK MANUAL SEND & RECEIPT) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 text-left space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                    <WhatsAppLogo className="w-6 h-6 fill-current text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        WhatsApp Order Summary
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        📱 +91 {confirmedOrder.customer.whatsapp || confirmedOrder.customer.phone}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Click below to send or save your complete booking details directly on WhatsApp:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const msg = whatsappNotificationService.buildOrderConfirmationMessage(confirmedOrder);
                      whatsappNotificationService.openWhatsAppManual(
                        confirmedOrder.customer.whatsapp || confirmedOrder.customer.phone,
                        msg
                      );
                    }}
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <WhatsAppLogo className="w-4 h-4 fill-current text-white" />
                    <span>Send to WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const msg = whatsappNotificationService.buildOrderConfirmationMessage(confirmedOrder);
                      await whatsappNotificationService.copyMessageToClipboard(msg);
                      success('Copied!', 'Order summary copied to clipboard.');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                    title="Copy full order receipt text"
                  >
                    <span>📋 Copy</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/90 border border-emerald-200 text-[11px] text-slate-700 space-y-1 font-mono leading-relaxed">
                <div className="flex justify-between font-bold text-emerald-900 border-b border-emerald-100 pb-1">
                  <span>Tracking ID: #{confirmedOrder.orderNumber}</span>
                  <span>{confirmedOrder.serviceEmoji} {confirmedOrder.serviceName}</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-0.5 space-y-0.5">
                  <div>📅 <strong>Pickup:</strong> {confirmedOrder.schedule?.pickupDate || confirmedOrder.pickupDate} ({confirmedOrder.schedule?.pickupSlot || confirmedOrder.pickupSlot})</div>
                  <div>🚚 <strong>Delivery:</strong> {confirmedOrder.schedule?.deliveryDate || confirmedOrder.deliveryDate} ({confirmedOrder.schedule?.deliverySlot || confirmedOrder.deliverySlot})</div>
                  <div>📍 <strong>Address:</strong> {confirmedOrder.customer.address}</div>
                  <div>💰 <strong>Total Tariff:</strong> {confirmedOrder.priceSnapshot.hasUnpricedItems && confirmedOrder.priceSnapshot.itemsSubtotal === 0 ? 'To be verified at doorstep' : formatCurrency(confirmedOrder.priceSnapshot.finalTotal)}</div>
                </div>
              </div>
            </div>

            {/* Approximate Weight & Confirmation Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Doorstep Inspection & Live Tracking:</strong>
                <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
                  Our pickup executive will verify garment count & weight at your doorstep. You will continue to receive live status alerts on your WhatsApp!
                </p>
              </div>
            </div>

            {/* Order Card Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Tracking ID:</span>
                <span className="font-mono font-bold text-sm text-brand-700">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.serviceEmoji} {confirmedOrder.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Window:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.schedule?.pickupDate || confirmedOrder.pickupDate} ({confirmedOrder.schedule?.pickupSlot || confirmedOrder.pickupSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Window:</span>
                <span className="font-bold text-orange-700">{confirmedOrder.schedule?.deliveryDate || confirmedOrder.deliveryDate} ({confirmedOrder.schedule?.deliverySlot || confirmedOrder.deliverySlot})</span>
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
            </div>

            {/* Instant UPI Payment Section if UPI_QR Selected */}
            {confirmedOrder.paymentMethod === 'UPI_QR' && (
              <div className="text-left pt-2">
                <UpiPaymentCard 
                  upiConfig={paymentConfig?.upi} 
                  amount={confirmedOrder.priceSnapshot?.finalTotal} 
                  orderNumber={confirmedOrder.orderNumber}
                  customerName={confirmedOrder.customer?.name}
                  title="Pay via UPI QR Code"
                  description="Scan below with Google Pay, PhonePe, Paytm or BHIM to pay for your scheduled pickup"
                />
              </div>
            )}

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
    <>
      <SEOHead
        title="Schedule Doorstep Laundry & Dry Cleaning Pickup | Tech Wash Hyderabad"
        description="Book your doorstep laundry or dry cleaning pickup in 60 seconds across Manikonda, Puppalaguda, Khajaguda, Lanco Hills & Hyderabad with Tech Wash."
        canonicalUrl={`${BASE_URL}/book-pickup`}
        keywords="book laundry pickup hyderabad, schedule dry clean manikonda, doorstep wash and fold booking"
      />
      <div className="py-8 sm:py-14 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Step Indicator Progress Bar */}
        <div className="mb-6 sm:mb-8 bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between w-full">
            {STEPS.map((step) => {
              const isPast = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => isPast && setCurrentStep(step.id)}
                      disabled={!isPast && !isCurrent}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-500 text-white shadow-xs cursor-pointer'
                          : isCurrent
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-2 sm:ring-4 ring-brand-100'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : step.id}
                    </button>
                    <span className={`text-[10px] sm:text-xs font-bold tracking-wide ${isCurrent ? 'text-slate-900 font-bold' : isPast ? 'text-slate-700 cursor-pointer' : 'text-slate-400'}`}>
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.shortLabel}</span>
                    </span>
                  </div>
                  {step.id < STEPS.length && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 min-w-[8px] ${isPast ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form Steps on Left (8 cols), Sticky Laundry Bag on Right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8">
            <Card variant="luxury" className="p-5 sm:p-8 bg-white border border-slate-200 shadow-sm">
              
              {/* ============================================================ */}
              {/* STEP 1: "WHAT DO YOU NEED?" (RESPONSIVE 2-COL SERVICE CARDS) */}
              {/* ============================================================ */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                        Select a Laundry Service
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Tap a service below to start your order
                      </p>
                    </div>

                    {/* Instant Doorstep Pickup Fast-Track */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceId('dry-cleaning');
                        setCurrentStep(3);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#F97316] border border-orange-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all self-start sm:self-auto shadow-2xs"
                    >
                      <span>⚡ Instant Pickup (Count at Door) ➔</span>
                    </button>
                  </div>

                  {/* 2-Column Responsive Service Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    {allAvailableServices.map((service) => {
                      const isSelected = selectedServiceId === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setCurrentStep(2);
                            window.scrollTo({ top: 100, behavior: 'smooth' });
                          }}
                          className={`p-3.5 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group active:scale-[0.98] ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/40 shadow-luxury ring-2 ring-brand-400/20'
                              : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/80 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <span className="text-2xl sm:text-3xl p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border border-slate-100 shadow-xs group-hover:scale-105 transition-transform">
                                {service.emoji}
                              </span>
                              {service.startingPriceDisplay && (
                                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-orange-50 text-[#F97316] border border-orange-200/60 leading-none">
                                  {service.startingPriceDisplay}
                                </span>
                              )}
                            </div>

                            <h3 className="text-xs sm:text-base font-bold text-slate-900 font-display group-hover:text-brand-700 transition-colors leading-tight">
                              {service.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed hidden sm:block">
                              {service.tagline}
                            </p>
                          </div>

                          <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-brand-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              Select ➔
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 2: SERVICE-SPECIFIC SELECTION JOURNEY                   */}
              {/* ============================================================ */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  
                  {/* Service Header with Back to Services button */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-brand-50 rounded-2xl border border-brand-100">
                        {currentService.emoji}
                      </span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
                          {currentService.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {currentService.tagline} • {currentService.startingPriceDisplay}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
                    >
                      ← Change Service
                    </button>
                  </div>

                  {/* Quick Fast-Track Doorstep Tally Card */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-brand-50 via-indigo-50/50 to-blue-50 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl shrink-0 mt-0.5">⚡</span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>In a hurry? Skip selecting items</span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-brand-600 text-white px-2 py-0.5 rounded-full">Fastest</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          Our rider will count, inspect & weigh your garments right at your doorstep. Zero effort needed!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(3);
                        window.scrollTo({ top: 100, behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 text-center flex items-center justify-center gap-1.5"
                    >
                      <span>Skip to Address & Slot</span>
                      <span>➔</span>
                    </button>
                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* DRY CLEANING, IRONING & STARCH & IRON FLOW               */}
                  {/* -------------------------------------------------------- */}
                  {(currentService.id === 'dry-cleaning' || currentService.id === 'ironing' || currentService.id === 'starch-and-iron' || currentService.id === 'srv-starch-and-iron') && (
                    <div className="space-y-6">
                      
                      {/* Persona Filter: Who are these clothes for? */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          Who are these clothes for?
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: 'men', label: "👨 Men's", desc: 'Shirts, Pants, Suits' },
                            { id: 'women', label: "👩 Women's", desc: 'Tops, Sarees, Dresses' },
                            { id: 'mixed', label: "👨👩👧 Mixed / Both", desc: 'All family clothes' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setClothingFor(tab.id);
                                setActiveSubCategory('all');
                              }}
                              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                                clothingFor === tab.id
                                  ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-1 ring-brand-500/30'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {tab.label}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                                {tab.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Chips Bar */}
                      <div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                          {(SUBCATEGORY_TABS[currentService.id === 'dry-cleaning' ? 'dryCleaning' : (currentService.id === 'starch-and-iron' || currentService.id === 'srv-starch-and-iron' ? 'starch-and-iron' : 'ironing')] || []).map(cat => {
                            const isActive = activeSubCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveSubCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                                  isActive
                                    ? 'bg-brand-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <span>{cat.emoji}</span>
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Search Bar Filter */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search items (e.g. Shirt, Kurta, Saree, Blazer)..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>

                      {/* Visual Item Cards Grid - Free flowing on mobile, no scroll traps */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        {(() => {
                          const catalog = currentService.id === 'dry-cleaning' 
                            ? pricingConfig.dryCleaning 
                            : ((currentService.id === 'starch-and-iron' || currentService.id === 'srv-starch-and-iron')
                                ? (pricingConfig['starch-and-iron'] || pricingConfig.starchAndIron || {})
                                : pricingConfig.ironing);

                          let list = [];
                          if (clothingFor === 'men') {
                            list = [...(catalog.men || []), ...(catalog.common || [])];
                          } else if (clothingFor === 'women') {
                            list = [...(catalog.women || []), ...(catalog.common || [])];
                          } else {
                            // mixed
                            list = [...(catalog.men || []), ...(catalog.women || []), ...(catalog.common || [])];
                          }

                          // Remove duplicate IDs if any
                          const uniqueList = Array.from(new Map(list.map(item => [item.id, item])).values());

                          const filtered = uniqueList.filter(item => {
                            const matchesSub = activeSubCategory === 'all' || item.subCategory === activeSubCategory;
                            const matchesSearch = !searchFilter || item.name.toLowerCase().includes(searchFilter.toLowerCase());
                            return matchesSub && matchesSearch;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="col-span-2 py-10 text-center text-xs text-slate-400">
                                No items found in this category. Try selecting "All Items" or searching.
                              </div>
                            );
                          }

                          return filtered.map(item => {
                            const count = itemizedQuantities[item.id] || 0;
                            return (
                              <div
                                key={item.id}
                                className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                  count > 0
                                    ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-1 ring-brand-400/30'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                  <span className="text-2xl shrink-0 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                    {item.emoji || '👔'}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {item.name}
                                    </h4>
                                    <div className="text-[11px] font-bold text-brand-700 mt-0.5">
                                      {item.startingNote || item.rangeNote || formatCurrency(item.price)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 bg-white rounded-xl p-1 border border-slate-200 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => updateItemizedQty(item.id, -1)}
                                    disabled={count === 0}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-7 text-center font-bold text-xs sm:text-sm text-slate-900">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateItemizedQty(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                                    aria-label="Increase quantity"
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
                  {/* WASH & IRON & WASH & FOLD (PER-KG SERVICES)              */}
                  {/* -------------------------------------------------------- */}
                  {(currentService.id === 'wash-and-iron' || currentService.id === 'wash-and-fold') && (
                    <div className="space-y-6">
                      
                      {/* Charged by weight badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                        <Scale className="w-3.5 h-3.5 text-blue-600" />
                        <span>Charged by weight (Per Kg)</span>
                      </div>

                      {/* Who are the clothes for? */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                          Who are the clothes for?
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setClothingFor('men')}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                              clothingFor === 'men'
                                ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">👨 Men</span>
                            <span className="text-[11px] font-bold text-brand-700 block mt-0.5">
                              {formatCurrency(currentService.baseRates.men)} / Kg
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setClothingFor('women')}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                              clothingFor === 'women'
                                ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">👩 Women</span>
                            <span className="text-[11px] font-bold text-brand-700 block mt-0.5">
                              {formatCurrency(currentService.baseRates.women)} / Kg
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setClothingFor('mixed')}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                              clothingFor === 'mixed'
                                ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">👨👩👧 Mixed / Both</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Men {formatCurrency(currentService.baseRates.men)} • Women {formatCurrency(currentService.baseRates.women)}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Fast Choice: Quick Bag Load Selector or Doorstep Weighing */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Laundry Load
                          </label>
                          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                            1-Tap Booking
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {[
                            {
                              id: 3,
                              label: 'Small Bag',
                              weight: '3 Kg',
                              approx: '~8-10 daily clothes',
                              emoji: '🧺',
                              popular: false,
                            },
                            {
                              id: 5,
                              label: 'Regular Bag',
                              weight: '5 Kg',
                              approx: '~15-18 daily clothes',
                              emoji: '🧺',
                              popular: true,
                            },
                            {
                              id: 8,
                              label: 'Family Bag',
                              weight: '8 Kg',
                              approx: '~25-30 clothes',
                              emoji: '🧺',
                              popular: false,
                            },
                            {
                              id: 'doorstep',
                              label: 'Weigh at Door',
                              weight: 'Scale at Pickup',
                              approx: 'Rider brings digital scale',
                              emoji: '⚖️',
                              popular: false,
                            },
                          ].map((bag) => {
                            const isSelected = bag.id === 'doorstep' 
                              ? perKgMode === 'doorstep' 
                              : (perKgMode === 'preset' && bagSize === bag.id);

                            const rate = clothingFor === 'women' 
                              ? currentService.baseRates.women 
                              : currentService.baseRates.men;

                            const estCost = typeof bag.id === 'number' ? Math.round(bag.id * rate) : null;

                            return (
                              <button
                                key={String(bag.id)}
                                type="button"
                                onClick={() => {
                                  if (bag.id === 'doorstep') {
                                    setPerKgMode('doorstep');
                                  } else {
                                    setPerKgMode('preset');
                                    setBagSize(bag.id);
                                  }
                                }}
                                className={`p-3 rounded-2xl border-2 text-left relative transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'border-brand-600 bg-brand-50/50 shadow-xs ring-1 ring-brand-500/20'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                {bag.popular && (
                                  <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 bg-brand-600 text-white text-[9px] font-extrabold uppercase rounded-full tracking-wider shadow-xs">
                                    Popular
                                  </span>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-xl">{bag.emoji}</span>
                                    <span className="text-xs font-bold text-slate-900 truncate">{bag.label}</span>
                                  </div>
                                  <div className="text-sm font-black text-brand-700 font-display">
                                    {bag.weight}
                                  </div>
                                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                                    {bag.approx}
                                  </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-700">
                                  <span>{estCost ? formatCurrency(estCost) : 'Pay after weighing'}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Collapsible toggle for piece-by-piece custom counting */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowManualPerKg(!showManualPerKg);
                            if (!showManualPerKg) {
                              setPerKgMode('manual');
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-brand-400 bg-slate-50/70 hover:bg-brand-50/30 text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>📋</span>
                            <span>{showManualPerKg ? 'Hide piece-by-piece counter' : 'Need exact piece breakdown? (Click to count garments)'}</span>
                          </span>
                          <span className="text-brand-600 text-[11px]">{showManualPerKg ? '▲ Collapse' : '▼ Expand'}</span>
                        </button>

                        {/* Optional Detailed Piece-by-Piece Counting Grid */}
                        {showManualPerKg && (
                          <div className="space-y-4 pt-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Customize Clothes Count
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                Tap + / - to calculate weight
                              </span>
                            </div>

                            {/* Men's clothes section */}
                            {(clothingFor === 'men' || clothingFor === 'mixed') && (
                              <div className="space-y-2">
                                {clothingFor === 'mixed' && (
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pt-1">
                                    <span>👨 Men's Clothes ({formatCurrency(currentService.baseRates.men)} / Kg)</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {(pricingConfig.weightStandards.men || []).map(std => {
                                    const count = perKgCounts.men?.[std.id] || 0;
                                    return (
                                      <div
                                        key={std.id}
                                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                                          count > 0 ? 'border-brand-500 bg-brand-50/40 shadow-xs' : 'border-slate-200 bg-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="text-2xl shrink-0">{std.emoji}</span>
                                          <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">{std.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                              {std.weightGrams ? `Approx. ${std.weightGrams} g` : 'Weight confirmed at pickup'}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPerKgMode('manual');
                                              updatePerKgCount('men', std.id, -1);
                                            }}
                                            disabled={count === 0}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                                            aria-label="Decrease item"
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <span className="w-6 text-center font-bold text-xs">
                                            {count}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPerKgMode('manual');
                                              updatePerKgCount('men', std.id, 1);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-100 text-brand-800 hover:bg-brand-200"
                                            aria-label="Increase item"
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

                            {/* Women's clothes section */}
                            {(clothingFor === 'women' || clothingFor === 'mixed') && (
                              <div className="space-y-2 pt-2">
                                {clothingFor === 'mixed' && (
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pt-1">
                                    <span>👩 Women's Clothes ({formatCurrency(currentService.baseRates.women)} / Kg)</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {(pricingConfig.weightStandards.women || []).map(std => {
                                    const count = perKgCounts.women?.[std.id] || 0;
                                    return (
                                      <div
                                        key={std.id}
                                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                                          count > 0 ? 'border-brand-500 bg-brand-50/40 shadow-xs' : 'border-slate-200 bg-white'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span className="text-2xl shrink-0">{std.emoji}</span>
                                          <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">{std.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                              {std.weightGrams ? `Approx. ${std.weightGrams} g` : 'Weight confirmed at pickup'}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPerKgMode('manual');
                                              updatePerKgCount('women', std.id, -1);
                                            }}
                                            disabled={count === 0}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                                            aria-label="Decrease item"
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <span className="w-6 text-center font-bold text-xs">
                                            {count}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPerKgMode('manual');
                                              updatePerKgCount('women', std.id, 1);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-100 text-brand-800 hover:bg-brand-200"
                                            aria-label="Increase item"
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
                          </div>
                        )}
                      </div>

                      {/* Live Calculation Display Box */}
                      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Approximate weight:</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {perKgMode === 'doorstep' ? 'To be weighed at door ⚖️' : `${orderBreakdown.estimatedWeightKg} Kg`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>Rate:</span>
                          <span className="font-semibold text-slate-900">
                            {clothingFor === 'mixed' 
                              ? `Men ${formatCurrency(currentService.baseRates.men)}/Kg • Women ${formatCurrency(currentService.baseRates.women)}/Kg`
                              : `${formatCurrency(currentService.baseRates[clothingFor])} / Kg`}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-brand-200/80 flex justify-between items-baseline font-bold text-slate-900">
                          <span className="font-display">Estimated subtotal:</span>
                          <span className="text-lg font-black text-brand-700 font-display">
                            {perKgMode === 'doorstep' ? 'Tally at doorstep' : formatCurrency(orderBreakdown.itemsSubtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Approximate Estimate Warning Banner */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>⚠️ APPROXIMATE ESTIMATE</span>
                        </div>
                        <p className="leading-relaxed text-[11px] text-amber-900">
                          Weight and price are estimated. Our pickup rider will verify the actual items with a calibrated digital hanging scale at pickup and update your final bill on WhatsApp.
                        </p>
                      </div>

                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* SAREE ROLLING FLOW (UNPRICED)                            */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'saree-rolling' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">🥻</span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                How many sarees?
                              </h3>
                              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                                Price to be confirmed
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs">
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

                        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                          Saree rolling and polishing rates are determined based on specific silk zari, embroidery, and fabric type. Our executive will check your sarees at your doorstep and confirm the final price with zero advance payment needed.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CURTAIN CARE FLOW (4 OFFICIAL SUB-SERVICES)              */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'curtain-washing' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select Curtain Care Treatments
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Choose between Dry Cleaning, Wash & Iron, Steam Ironing, and Wash & Fold
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full w-fit">
                          Per Curtain Panel
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[
                          {
                            key: 'dryCleaning',
                            name: 'Curtain Dry Cleaning',
                            emoji: '🧺',
                            price: Number(pricingConfig.curtains?.dryCleaning !== undefined ? pricingConfig.curtains.dryCleaning : 200),
                            desc: 'Single-batch delicate solvent cleaning for blackout, silk & jacquard drapes',
                            tag: 'Delicate & Blackouts'
                          },
                          {
                            key: 'washAndIron',
                            name: 'Curtain Wash & Iron',
                            emoji: '🫧',
                            price: Number(pricingConfig.curtains?.washAndIron !== undefined ? pricingConfig.curtains.washAndIron : 150),
                            desc: 'Demineralized RO soft wash with vertical steam hanging press',
                            tag: 'Deep Wash + Steam Press'
                          },
                          {
                            key: 'iron',
                            name: 'Curtain Iron',
                            emoji: '✨',
                            price: Number(pricingConfig.curtains?.iron !== undefined ? pricingConfig.curtains.iron : 60),
                            desc: 'High-pressure vertical tension steam pressing & deep wrinkle removal',
                            tag: 'Steam Ironing Only'
                          },
                          {
                            key: 'washAndFold',
                            name: 'Curtain Wash & Fold',
                            emoji: '👕',
                            price: Number(pricingConfig.curtains?.washAndFold !== undefined ? pricingConfig.curtains.washAndFold : 100),
                            desc: 'Hygienic drum laundry cycle, moisture-controlled drying & neat fold',
                            tag: 'Wash & Fold'
                          },
                        ].map((sub) => {
                          const count = curtainCounts[sub.key] || 0;
                          return (
                            <div
                              key={sub.key}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                count > 0 
                                  ? 'border-brand-500 bg-brand-50/40 shadow-xs' 
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-2xl shrink-0 p-2 rounded-xl bg-slate-100/80">
                                      {sub.emoji}
                                    </span>
                                    <div className="min-w-0">
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {sub.name}
                                      </h4>
                                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                        {sub.tag}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-black text-sm text-slate-900 block">
                                      {formatCurrency(sub.price)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">/ panel</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                                  {sub.desc}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <span className="text-xs font-semibold text-slate-600">
                                  {count > 0 ? `${count} panel${count > 1 ? 's' : ''} (${formatCurrency(count * sub.price)})` : 'Select quantity:'}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => updateCurtainSubServiceCount(sub.key, -1)}
                                    disabled={count === 0}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-xs">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCurtainSubServiceCount(sub.key, 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* SHOE WASHING FLOW (PER-PAIR)                             */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'shoe-washing' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                          <span>₹350 / pair</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">
                            How many pairs?
                          </h3>

                          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs">
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
                            Footwear Type:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['Sneakers / Casual', 'Sports / Running', 'Formal Leather', 'Suede / Boots'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setShoeType(t)}
                                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                                  shoeType === t
                                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-600">
                            {shoePairs} {shoePairs === 1 ? 'pair' : 'pairs'} × ₹350
                          </span>
                          <span className="text-base font-black text-brand-700 font-display">
                            {formatCurrency(shoePairs * 350)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* CARPET WASHING FLOW (DIMENSIONAL)                        */}
                  {/* -------------------------------------------------------- */}
                  {currentService.id === 'carpet-washing' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                            <span>₹45 / sq. ft.</span>
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-2">
                            Enter Carpet Dimensions
                          </h3>
                        </div>

                        <Button variant="outline" size="sm" icon={Plus} onClick={addCarpetItem}>
                          Add Another Carpet
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {carpetItems.map((c, idx) => {
                          const area = Math.max(1, c.length * c.width);
                          const linePrice = area * 45 * (c.quantity || 1);
                          return (
                            <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  🧶 Carpet / Rug #{idx + 1}
                                </span>
                                {carpetItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCarpetItem(c.id)}
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
                                    value={c.length}
                                    onChange={(e) => updateCarpetItem(c.id, 'length', e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
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
                                    value={c.width}
                                    onChange={(e) => updateCarpetItem(c.id, 'width', e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
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
                                    value={c.quantity}
                                    onChange={(e) => updateCarpetItem(c.id, 'quantity', e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-center"
                                  />
                                </div>
                              </div>

                              {/* Understandable calculation step */}
                              <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                                <div className="flex justify-between text-slate-600">
                                  <span>{c.length} × {c.width} = <strong>{area} sq. ft.</strong></span>
                                  <span>{area} × ₹45 {c.quantity > 1 ? `× ${c.quantity}` : ''}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 font-bold text-slate-900">
                                  <span>Estimated price:</span>
                                  <span className="text-sm text-brand-700 font-black font-display">
                                    {formatCurrency(linePrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* DYNAMIC CUSTOM SERVICE FLOW                              */}
                  {/* -------------------------------------------------------- */}
                  {currentService.isCustom && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Select {currentService.name} Treatments & Sub-Services
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {currentService.description || currentService.tagline || 'Choose items and treatments for bespoke garment care'}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full w-fit">
                          {currentService.pricingType === 'PER_KG' ? 'Per Kilogram' : 'Per Item'}
                        </span>
                      </div>

                      {Array.isArray(currentService.subServices) && currentService.subServices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {currentService.subServices.map((sub) => {
                            const count = itemizedQuantities[sub.id] || 0;
                            const subPrice = Number(sub.price || currentService.startingPrice || 0);
                            return (
                              <div
                                key={sub.id}
                                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                  count > 0 
                                    ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-1 ring-brand-400/30' 
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="text-2xl shrink-0 p-2 rounded-xl bg-slate-100/80">
                                        {sub.emoji || currentService.emoji || '✨'}
                                      </span>
                                      <div className="min-w-0">
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                          {sub.name}
                                        </h4>
                                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                          {currentService.pricingType === 'PER_KG' ? 'Weight Care' : 'Specialized Care'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-black text-sm text-slate-900 block">
                                        {formatCurrency(subPrice)}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-medium">
                                        {currentService.pricingType === 'PER_KG' ? '/ kg' : '/ piece'}
                                      </span>
                                    </div>
                                  </div>
                                  {sub.description && (
                                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                      {sub.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                  <span className="text-xs font-semibold text-slate-600">
                                    {count > 0 ? `${count} ${currentService.pricingType === 'PER_KG' ? 'kg' : 'pc'}${count > 1 ? 's' : ''} (${formatCurrency(count * subPrice)})` : 'Select quantity:'}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 rounded-xl p-1 border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => updateItemizedQty(sub.id, -1)}
                                      disabled={count === 0}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-6 text-center font-bold text-xs">
                                      {count}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateItemizedQty(sub.id, 1)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                {currentService.emoji || '✨'}
                              </span>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                  {currentService.name} Quantity
                                </h3>
                                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                                  {formatCurrency(currentService.startingPrice || 99)} {currentService.pricingType === 'PER_KG' ? '/ kg' : '/ piece'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs">
                              {(() => {
                                const baseId = `${currentService.id}-base`;
                                const count = itemizedQuantities[baseId] || 1;
                                return (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateItemizedQty(baseId, -1)}
                                      disabled={count <= 1}
                                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-sm">
                                      {count}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateItemizedQty(baseId, 1)}
                                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            {currentService.description || 'Our master fabric specialists will inspect and process your garments with tailored care. Total price will be confirmed at doorstep or pickup.'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2 Bottom Proceed Bar */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                    <div className="text-xs text-slate-500 w-full sm:w-auto text-center sm:text-left">
                      {orderBreakdown.totalItemCount > 0 ? (
                        <span>Selected: <strong className="text-slate-800">{orderBreakdown.totalItemCount} {currentService.pricingType === 'PER_KG' ? 'items / load' : 'items'}</strong> • Est: <strong className="text-brand-700">{formatCurrency(orderBreakdown.itemsSubtotal)}</strong></span>
                      ) : (
                        <span>✨ Garments will be counted & weighed at your doorstep</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => {
                          setCurrentStep(1);
                          window.scrollTo({ top: 100, behavior: 'smooth' });
                        }}
                        className="flex-1 sm:flex-initial"
                      >
                        ← Services
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={handleNextStep}
                        className="flex-1 sm:flex-initial justify-center shadow-md shadow-brand-500/20"
                      >
                        Proceed to Address ➔
                      </Button>
                    </div>
                  </div>

                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 3: "WHERE SHOULD WE PICK UP YOUR LAUNDRY?"             */}
              {/* ============================================================ */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Where should we pick up your laundry?
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter contact number for doorstep arrival & live WhatsApp updates.
                    </p>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Name *"
                        required
                        placeholder="e.g. Ramesh Chandra"
                        value={customer.name}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      />
                      <Input
                        label="Mobile Number *"
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 6304845567"
                        value={customer.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />
                    </div>

                    {/* WhatsApp Checkbox */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customer.sameAsPhone}
                          onChange={(e) => handleToggleSameAsPhone(e.target.checked)}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Use same number for WhatsApp updates & receipts
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
                            onChange={(e) => setCustomer({ ...customer, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          />
                        </div>
                      )}
                    </div>

                    <Input
                      label="Email (Optional, for tax invoices)"
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>

                  {/* Pickup Address & LocationPicker */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pickup Address & Landmark *
                    </label>

                    {pickupLocation ? (
                      <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{pickupLocation.locationSource === 'GPS' ? '🛰️ Live Satellite GPS Locked' : '📍 ' + pickupLocation.locationSource}</span>
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
                            GPS: {pickupLocation.latitude?.toFixed(4)}, {pickupLocation.longitude?.toFixed(4)}
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
                          success('Location Confirmed', 'Pickup coordinates locked.');
                        }}
                      />
                    )}
                  </div>

                  {/* Schedule Date & Slot (Pickup & Delivery) */}
                  <div className="pt-4 border-t border-slate-100 space-y-6">
                    
                    {/* 1. PICKUP SCHEDULE */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-600" />
                          <span>1. Preferred Pickup Schedule *</span>
                        </label>
                        <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          {schedule.pickupPeriod || 'MORNING'} Slot
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Pickup Date
                          </label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={schedule.pickupDate}
                            onChange={(e) => {
                              const newPDate = e.target.value;
                              const defDel = calculateDefaultDelivery(newPDate, isExpress, schedule.deliveryPeriod || 'MORNING');
                              setSchedule(prev => ({
                                ...prev,
                                pickupDate: newPDate,
                                deliveryDate: defDel.deliveryDate,
                                deliverySlot: defDel.deliverySlot,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div className="sm:col-span-7">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Pickup Time Window
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {TIME_SLOTS.map((slot) => {
                              const isSelected = (schedule.pickupPeriod === slot.period) || (schedule.pickupSlot?.includes(slot.time));
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSchedule(prev => ({
                                    ...prev,
                                    pickupPeriod: slot.period,
                                    pickupSlot: slot.label,
                                  }))}
                                  className={`px-2 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    isSelected
                                      ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                                  }`}
                                >
                                  <span className="text-xs">{slot.icon} {slot.period === 'MORNING' ? 'Morning' : slot.period === 'AFTERNOON' ? 'Afternoon' : 'Evening'}</span>
                                  <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-slate-500'}`}>
                                    {slot.shortLabel.split(' ')[1] || slot.time}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. EXPECTED DELIVERY SCHEDULE */}
                    <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-orange-600" />
                          <span>2. Expected Drop-off / Delivery Schedule *</span>
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsExpress(true);
                              const calc = calculateDefaultDelivery(schedule.pickupDate, true, schedule.deliveryPeriod);
                              setSchedule(prev => ({ ...prev, deliveryDate: calc.deliveryDate, deliverySlot: calc.deliverySlot }));
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${isExpress ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-100'}`}
                          >
                            ⚡ Express (24h)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsExpress(false);
                              const calc = calculateDefaultDelivery(schedule.pickupDate, false, schedule.deliveryPeriod);
                              setSchedule(prev => ({ ...prev, deliveryDate: calc.deliveryDate, deliverySlot: calc.deliverySlot }));
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${!isExpress ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                          >
                            🛡️ Standard (48h)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Delivery Date
                          </label>
                          <input
                            type="date"
                            min={schedule.pickupDate || new Date().toISOString().split('T')[0]}
                            value={schedule.deliveryDate}
                            onChange={(e) => setSchedule({ ...schedule, deliveryDate: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div className="sm:col-span-7">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Delivery Time Window
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {TIME_SLOTS.map((slot) => {
                              const isSelected = (schedule.deliveryPeriod === slot.period) || (schedule.deliverySlot?.includes(slot.time));
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSchedule(prev => ({
                                    ...prev,
                                    deliveryPeriod: slot.period,
                                    deliverySlot: slot.label,
                                  }))}
                                  className={`px-2 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    isSelected
                                      ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs'
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                                  }`}
                                >
                                  <span className="text-xs">{slot.icon} {slot.period === 'MORNING' ? 'Morning' : slot.period === 'AFTERNOON' ? 'Afternoon' : 'Evening'}</span>
                                  <span className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                                    {slot.shortLabel.split(' ')[1] || slot.time}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Textarea
                      label="Additional Notes / Gate Instructions (Optional)"
                      rows={2}
                      placeholder="e.g. Ring flat 301 bell, call 5 mins before arrival, handle pattu saree with care"
                      value={schedule.instructions}
                      onChange={(e) => setSchedule({ ...schedule, instructions: e.target.value })}
                    />
                  </div>

                </div>
              )}

              {/* ============================================================ */}
              {/* STEP 4: "🎉 ALMOST DONE!" (REVIEW & CONFIRM PICKUP)          */}
              {/* ============================================================ */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready to book</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 font-display">
                      🎉 Almost Done!
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your pickup summary
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                    
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <span className="text-slate-500">Service:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {currentService.emoji} {currentService.name}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Items:
                      </span>
                      {orderBreakdown.lineItems.length > 0 ? (
                        <div className="space-y-1.5">
                          {orderBreakdown.lineItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-700">
                              <span>{item.emoji} {item.name} × {item.quantity}</span>
                              <span className="font-semibold text-slate-900">
                                {item.lineTotal ? formatCurrency(item.lineTotal) : (item.unconfirmed ? 'To be weighed' : 'Quote at pickup')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 italic">
                          Executive will tally items at doorstep
                        </div>
                      )}
                    </div>

                    {/* Weight & Rate if Per-KG */}
                    {currentService.pricingType === 'PER_KG' && (
                      <div className="pt-3 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Approx. Weight:</span>
                          <span className="font-bold text-slate-900">{orderBreakdown.estimatedWeightKg} Kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rate:</span>
                          <span className="font-semibold text-slate-900">
                            {clothingFor === 'mixed' 
                              ? `Men ${formatCurrency(currentService.baseRates.men)}/Kg • Women ${formatCurrency(currentService.baseRates.women)}/Kg`
                              : `${formatCurrency(currentService.baseRates[clothingFor])} / Kg`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Estimated Price */}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900">
                      <span className="text-sm font-display">Estimated Price:</span>
                      <span className="text-xl font-black text-brand-700 font-display">
                        {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                          ? 'To be confirmed'
                          : formatCurrency(orderBreakdown.finalTotal)}
                      </span>
                    </div>

                    {/* Remember Notice */}
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <strong className="block font-bold">⚠️ Remember:</strong>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        This is an approximate estimate. Our pickup executive will check the actual clothes/weight and update the final amount to you on WhatsApp.
                      </p>
                    </div>

                    {/* Address & Phone */}
                    <div className="pt-3 border-t border-slate-200 space-y-2 text-slate-600">
                      <div>
                        <strong className="text-slate-800">Pickup Address:</strong>
                        <div className="text-slate-700 mt-0.5">{pickupLocation?.formattedAddress || address.street}</div>
                      </div>
                      <div>
                        <strong className="text-slate-800">Phone:</strong>
                        <span className="text-slate-700 ml-2 font-semibold">{customer.phone}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                        <div className="p-2.5 rounded-xl bg-slate-100/80">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">📅 Doorstep Pickup</span>
                          <span className="text-slate-900 font-bold text-xs">{schedule.pickupDate} ({schedule.pickupSlot})</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200/70">
                          <span className="text-[10px] font-bold text-orange-700 uppercase block">🚚 Scheduled Delivery</span>
                          <span className="text-orange-950 font-bold text-xs">{schedule.deliveryDate} ({schedule.deliverySlot})</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Delivery Speed Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Turnaround Speed
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setIsExpress(false)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          !isExpress
                            ? 'border-brand-600 bg-brand-50/40 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">48-Hour Standard Care</span>
                          <Badge variant={!isExpress ? 'brand' : 'slate'} size="sm">Standard</Badge>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">FREE delivery on ₹499+</span>
                      </div>

                      <div
                        onClick={() => setIsExpress(true)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isExpress
                            ? 'border-brand-600 bg-brand-50/40 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">24-Hour Express Speed</span>
                          <Badge variant="emerald" size="sm">Express 24H</Badge>
                        </div>
                        <span className="text-xs font-bold text-brand-700">+₹99 Priority Fee</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Payment Option
                    </label>
                    <div className="space-y-2">
                      {Object.values(PAYMENT_METHODS).map((pm) => {
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <div
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/40 shadow-xs'
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
                                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                  <span>{pm.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {pm.description}
                                </div>
                              </div>
                            </div>
                            <Badge variant={isSelected ? 'brand' : 'slate'} size="sm" className="shrink-0">
                              {pm.badge}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>

                    {/* Visual UPI Payment Card when Direct UPI / QR Code is selected */}
                    {paymentMethod === 'UPI_QR' && (
                      <div className="pt-2 animate-fade-in">
                        <UpiPaymentCard
                          upiConfig={paymentConfig?.upi}
                          amount={orderBreakdown.finalTotal}
                          title="Instant UPI Scan & Pay"
                          description="Scan with Google Pay, PhonePe, Paytm or BHIM UPI at checkout"
                        />
                      </div>
                    )}
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
                    Continue →
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs"
                    >
                      ← Edit Booking
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      onClick={handleFinalBooking}
                      icon={CheckCircle2}
                      className="flex-1 sm:flex-none"
                    >
                      📦 CONFIRM PICKUP
                    </Button>
                  </div>
                )}
              </div>

            </Card>
          </div>

          {/* ============================================================ */}
          {/* RIGHT STICKY "YOUR LAUNDRY BAG" SUMMARY (DESKTOP)            */}
          {/* ============================================================ */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <Card variant="luxury" className="p-6 bg-white border border-brand-200 shadow-luxury space-y-4">
              
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <Badge variant="brand" size="sm">Live Cart</Badge>
                  <h3 className="text-base font-black text-slate-900 font-display mt-1 tracking-tight">
                    🧺 YOUR LAUNDRY BAG
                  </h3>
                </div>
                <span className="text-2xl">{currentService.emoji}</span>
              </div>

              {/* Selected Service & Persona */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-bold text-slate-900">{currentService.name}</span>
                </div>
                {schedule.pickupDate && currentStep >= 3 && (
                  <div className="flex justify-between">
                    <span>Pickup:</span>
                    <span className="font-semibold text-slate-900">{schedule.pickupDate}</span>
                  </div>
                )}
              </div>

              {/* Line Items List */}
              {orderBreakdown.lineItems.length > 0 ? (
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {orderBreakdown.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 text-xs">
                      <span className="truncate max-w-[190px]">
                        {item.emoji} {item.name} × {item.quantity}
                      </span>
                      <span className="font-bold text-slate-900 shrink-0">
                        {item.lineTotal ? formatCurrency(item.lineTotal) : (item.unconfirmed ? 'To be weighed' : 'Quote at pickup')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 py-3 text-center text-xs text-slate-400 italic">
                  No items selected yet. Tap + on clothes to calculate live.
                </div>
              )}

              {/* Approx Weight indicator */}
              {currentService.pricingType === 'PER_KG' && orderBreakdown.estimatedWeightKg > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                  <span className="text-slate-500">Approx. Weight:</span>
                  <span className="font-bold text-slate-900">
                    {orderBreakdown.estimatedWeightKg} Kg
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

              {/* Financial Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderBreakdown.itemsSubtotal)}</span>
                </div>
                {isExpress && (
                  <div className="flex justify-between text-brand-600">
                    <span>Express Speed:</span>
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
                {orderBreakdown.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>GST:</span>
                    <span>{formatCurrency(orderBreakdown.taxAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span className="font-display">Estimated Total:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-600 font-display">
                      {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                        ? 'To be confirmed' 
                        : formatCurrency(orderBreakdown.finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step action button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={currentStep === 4 ? handleFinalBooking : handleNextStep}
                isLoading={isSubmitting}
                icon={currentStep === 4 ? CheckCircle2 : ArrowRight}
                iconPosition="right"
              >
                {currentStep === 4 ? '📦 CONFIRM PICKUP' : 'Continue →'}
              </Button>

              <div className="pt-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero advance • Pay after delivery</span>
              </div>

            </Card>
          </div>

        </div>

        {/* ============================================================ */}
        {/* MOBILE STICKY BOTTOM SUMMARY BAR                             */}
        {/* ============================================================ */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40">
          <div className="p-3.5 flex items-center justify-between gap-3">
            <div 
              onClick={() => setIsMobileBagOpen(true)}
              className="cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center text-base">
                🧺
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  <span>{orderBreakdown.totalItemCount} {orderBreakdown.totalItemCount === 1 ? 'item' : 'items'}</span>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-base font-black text-brand-600 font-display">
                  {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                    ? 'To be confirmed' 
                    : `${formatCurrency(orderBreakdown.finalTotal)} estimated`}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={currentStep === 4 ? handleFinalBooking : handleNextStep}
              isLoading={isSubmitting}
              icon={currentStep === 4 ? CheckCircle2 : ArrowRight}
              iconPosition="right"
            >
              {currentStep === 4 ? 'Confirm' : 'Continue →'}
            </Button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE EXPANDABLE LAUNDRY BAG MODAL / DRAWER                 */}
        {/* ============================================================ */}
        {isMobileBagOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in">
            <div className="bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl animate-slide-up">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧺</span>
                  <h3 className="text-base font-black text-slate-900 font-display">
                    YOUR LAUNDRY BAG
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileBagOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              {orderBreakdown.lineItems.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {orderBreakdown.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                      <span>{item.emoji} {item.name} × {item.quantity}</span>
                      <span className="font-bold text-slate-900">
                        {item.lineTotal ? formatCurrency(item.lineTotal) : (item.unconfirmed ? 'To be weighed' : 'Quote at pickup')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No items selected yet.
                </div>
              )}

              {/* Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orderBreakdown.itemsSubtotal)}</span>
                </div>
                {orderBreakdown.estimatedWeightKg > 0 && (
                  <div className="flex justify-between">
                    <span>Approx. Weight:</span>
                    <span className="font-semibold text-slate-900">{orderBreakdown.estimatedWeightKg} Kg</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Doorstep Pickup:</span>
                  <span className="text-emerald-600 font-bold">
                    {orderBreakdown.deliveryFee === 0 ? 'FREE' : formatCurrency(orderBreakdown.deliveryFee)}
                  </span>
                </div>
                {orderBreakdown.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST:</span>
                    <span>{formatCurrency(orderBreakdown.taxAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                  <span>Estimated Total:</span>
                  <span className="text-xl font-black text-brand-600 font-display">
                    {orderBreakdown.hasUnpricedItems && orderBreakdown.itemsSubtotal === 0 
                      ? 'To be confirmed' 
                      : formatCurrency(orderBreakdown.finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-2"
                onClick={() => {
                  setIsMobileBagOpen(false);
                  if (currentStep < 4) handleNextStep();
                  else handleFinalBooking();
                }}
              >
                {currentStep === 4 ? '📦 CONFIRM PICKUP' : 'Continue to next step →'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
};
