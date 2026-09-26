import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { terminalAuthService, DEFAULT_BILLING_TERMINALS } from '../../services/terminalAuthService';
import { orderService } from '../../services/orderService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { auditService } from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { FinancialReportModal } from '../../components/reports/FinancialReportModal';
import { reportService } from '../../services/reportService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  POS_CATEGORIES 
} from '../admin/AdminOrdersPage';
import { 
  pricingService, 
  INITIAL_PRICING_CONFIG,
  buildMasterCatalogFromPricing,
  buildWalkInServicesFromPricing,
  buildWeightBandsFromPricing,
  buildPersonaRateBandsFromPricing
} from '../../services/pricingConfig';
import { 
  Store, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Tag, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Receipt, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Clock, 
  Zap, 
  Layers, 
  ChevronRight, 
  RotateCcw,
  Send,
  Copy,
  ExternalLink,
  Laptop,
  Scale,
  ShieldCheck,
  Check,
  AlertCircle,
  Calendar,
  ChevronDown,
  FileText
} from 'lucide-react';

const INITIAL_BILL_STATE = {
  manualBillNumber: '', // 4-digit manual offline slip/token number (e.g. 1042)
  customerName: '',
  phone: '',
  email: '',
  notes: '',
  serviceId: 'srv-dry-cleaning',
  serviceName: 'Premium Dry Cleaning',
  serviceEmoji: '👔',
  pricingType: 'per_item', // 'per_item' | 'per_kg'
  weightKg: '',
  pricePerKg: 100,
  foldWeightKg: '',
  foldPricePerKg: 100,
  ironWeightKg: '',
  ironPricePerKg: 130,
  customGrandTotal: '', // Admin override for total bill amount
  items: [],
  expressOption: 'STANDARD', // 'STANDARD' | 'EXPRESS_24H'
  paymentMethod: 'CASH', // 'CASH' | 'UPI_QR' | 'CARD' | 'PAY_ON_DELIVERY'
  paymentStatus: 'PAID', // 'PAID' | 'PARTIAL' | 'UNPAID'
  receivedAmount: undefined, // undefined = auto-sync with finalGrandTotal if PAID
  autoOpenReceipt: true,
  autoSendWhatsApp: true,
};

// Distinct Weight Bands for Wash & Fold (₹100/Kg Base Scale)
export const FOLD_WEIGHT_BANDS = [
  { wt: 1.5, label: '1.5 Kg', price: 150, desc: 'Light Load (~5 pcs)' },
  { wt: 2.0, label: '2.0 Kg', price: 200, desc: 'Daily Load (~7 pcs)' },
  { wt: 3.0, label: '3.0 Kg', price: 300, desc: 'Standard (~10 pcs)' },
  { wt: 4.0, label: '4.0 Kg', price: 400, desc: 'Regular (~14 pcs)' },
  { wt: 5.0, label: '5.0 Kg', price: 500, desc: 'Medium (~18 pcs)' },
  { wt: 6.0, label: '6.0 Kg', price: 600, desc: 'Family (~22 pcs)' },
  { wt: 8.0, label: '8.0 Kg', price: 800, desc: 'Heavy Load' },
  { wt: 10.0, label: '10.0 Kg', price: 1000, desc: 'Bulk Wash' },
  { wt: 12.0, label: '12.0 Kg', price: 1200, desc: 'Mega Batch' },
  { wt: 15.0, label: '15.0 Kg', price: 1500, desc: 'Commercial' },
];

// Distinct Weight Bands for Wash & Steam Iron (₹130/Kg Base Scale)
export const IRON_WEIGHT_BANDS = [
  { wt: 1.5, label: '1.5 Kg', price: 195, desc: 'Light Press (~4 pcs)' },
  { wt: 2.0, label: '2.0 Kg', price: 260, desc: 'Daily Press (~6 pcs)' },
  { wt: 3.0, label: '3.0 Kg', price: 390, desc: 'Standard (~9 pcs)' },
  { wt: 4.0, label: '4.0 Kg', price: 520, desc: 'Regular (~12 pcs)' },
  { wt: 5.0, label: '5.0 Kg', price: 650, desc: 'Executive (~16 pcs)' },
  { wt: 6.0, label: '6.0 Kg', price: 780, desc: 'Family Steam (~20 pcs)' },
  { wt: 8.0, label: '8.0 Kg', price: 1040, desc: 'Heavy Wardrobe' },
  { wt: 10.0, label: '10.0 Kg', price: 1300, desc: 'Bulk Steam Iron' },
  { wt: 12.0, label: '12.0 Kg', price: 1560, desc: 'Mega Steam Batch' },
  { wt: 15.0, label: '15.0 Kg', price: 1950, desc: 'Commercial Steam' },
];

// Fallback Quick weights
const QUICK_WEIGHTS = [1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0];

// Category Tabs for Wash & Fold (100% Dedicated)
export const WASH_AND_FOLD_CATEGORIES = [
  { key: 'ALL', label: 'All Wash & Fold', emoji: '🧺' },
  { key: 'MEN', label: "Men's Fold", emoji: '👔' },
  { key: 'WOMEN', label: "Women's Fold", emoji: '👗' },
  { key: 'HOUSEHOLD', label: 'Linens Fold', emoji: '🏠' },
  { key: 'KIDS', label: 'Kids Fold', emoji: '👶' },
];

// Category Tabs for Wash & Steam Iron (100% Dedicated)
export const WASH_AND_IRON_CATEGORIES = [
  { key: 'ALL', label: 'All Wash & Steam Iron', emoji: '🫧' },
  { key: 'MEN', label: "Men's Steam Iron", emoji: '👔' },
  { key: 'WOMEN', label: "Women's Steam Iron", emoji: '👗' },
  { key: 'HOUSEHOLD', label: 'Linens Steam Iron', emoji: '🏠' },
  { key: 'KIDS', label: 'Kids Steam Iron', emoji: '👶' },
];

// Base Clothes Master Catalog for Weighed Laundry
export const RAW_CLOTHES_ITEMS = [
  // ── MEN'S CLOTHES ──
  { id: 'm-1', name: 'Cotton Shirt', emoji: '👔', category: "Men's Tops", group: 'MEN' },
  { id: 'm-2', name: 'Trouser / Pant', emoji: '👖', category: "Men's Bottoms", group: 'MEN' },
  { id: 'm-3', name: 'Jeans / Denim', emoji: '👖', category: "Men's Bottoms", group: 'MEN' },
  { id: 'm-4', name: 'T-Shirt / Polo', emoji: '👕', category: "Men's Tops", group: 'MEN' },
  { id: 'm-5', name: 'Kurta / Ethnic', emoji: '👘', category: "Men's Ethnic", group: 'MEN' },
  { id: 'm-6', name: 'Shorts / Trackpant', emoji: '🩳', category: "Men's Bottoms", group: 'MEN' },
  { id: 'm-7', name: 'Pyjama / Lounge Pant', emoji: '🩳', category: "Men's Bottoms", group: 'MEN' },
  { id: 'm-8', name: 'Silk Dhoti / Lungi', emoji: '🥻', category: "Men's Ethnic", group: 'MEN' },

  // ── WOMEN'S CLOTHES ──
  { id: 'w-1', name: 'Normal Top / Kurti', emoji: '👚', category: "Women's Tops", group: 'WOMEN' },
  { id: 'w-2', name: 'Medium / Long Top', emoji: '👚', category: "Women's Tops", group: 'WOMEN' },
  { id: 'w-3', name: 'Leggings / Bottoms', emoji: '👖', category: "Women's Bottoms", group: 'WOMEN' },
  { id: 'w-4', name: 'Women T-Shirt', emoji: '👕', category: "Women's Tops", group: 'WOMEN' },
  { id: 'w-5', name: 'Daily Saree / Dress', emoji: '🥻', category: "Women's Ethnic", group: 'WOMEN' },
  { id: 'w-6', name: 'Nighties / Sleepwear', emoji: '👗', category: "Women's Wear", group: 'WOMEN' },
  { id: 'w-7', name: 'Saree Blouse', emoji: '👚', category: "Women's Ethnic", group: 'WOMEN' },
  { id: 'w-8', name: 'Dupatta / Chunni', emoji: '🧣', category: "Women's Ethnic", group: 'WOMEN' },
  { id: 'w-9', name: 'Western Skirt / Gown', emoji: '👗', category: "Women's Wear", group: 'WOMEN' },

  // ── HOUSEHOLD & LINENS ──
  { id: 'h-1', name: 'Single Bedsheet', emoji: '🛏️', category: 'Household', group: 'HOUSEHOLD' },
  { id: 'h-2', name: 'Double / King Bedsheet', emoji: '🛌', category: 'Household', group: 'HOUSEHOLD' },
  { id: 'h-3', name: 'Pillow Cover (Pair)', emoji: '🛋️', category: 'Household', group: 'HOUSEHOLD' },
  { id: 'h-4', name: 'Bath Towel Large', emoji: '🧖', category: 'Household', group: 'HOUSEHOLD' },
  { id: 'h-5', name: 'Hand Towel / Napkin', emoji: '🧼', category: 'Household', group: 'HOUSEHOLD' },

  // ── KIDS & BABY ──
  { id: 'k-1', name: 'Kids Dress / Frock', emoji: '👗', category: 'Kids Wear', group: 'KIDS' },
  { id: 'k-2', name: 'Kids Shirt / T-Shirt', emoji: '👕', category: 'Kids Wear', group: 'KIDS' },
  { id: 'k-3', name: 'Kids Shorts / Pant', emoji: '🩳', category: 'Kids Wear', group: 'KIDS' },
  { id: 'k-4', name: 'Kids School Uniform', emoji: '👔', category: 'Kids Wear', group: 'KIDS' },
];

// Dedicated Wash & Fold Sub-Services (100% Isolated)
export const WASH_AND_FOLD_SUB_SERVICES = RAW_CLOTHES_ITEMS.map(it => ({
  ...it,
  id: `waf-${it.id}`,
  serviceId: 'srv-wash-and-fold',
  serviceName: 'Wash & Fold',
  displayName: `🧺 Fold — ${it.name}`,
  fullName: `🧺 Wash & Fold — ${it.name}`,
}));

// Dedicated Wash & Steam Iron Sub-Services (100% Isolated)
export const WASH_AND_IRON_SUB_SERVICES = RAW_CLOTHES_ITEMS.map(it => ({
  ...it,
  id: `wai-${it.id}`,
  serviceId: 'srv-wash-and-iron',
  serviceName: 'Wash & Steam Iron',
  displayName: `🫧 Iron — ${it.name}`,
  fullName: `🫧 Wash & Steam Iron — ${it.name}`,
}));

export const BillingMachinePage = () => {
  const { terminalId } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const activeTerminalId = terminalAuthService.normalizeTerminalId(terminalId);

  // Terminal & Auth State
  const initialTerminalDef = DEFAULT_BILLING_TERMINALS.find(t => t.id === activeTerminalId) || DEFAULT_BILLING_TERMINALS[0];
  const [terminal, setTerminal] = useState(initialTerminalDef);
  const [session, setSession] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Bill Form State
  const [billForm, setBillForm] = useState(INITIAL_BILL_STATE);
  const [itemSearch, setItemSearch] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
  
  // Weighed Laundry Category Filter & Search State
  const [weighedCategoryFilter, setWeighedCategoryFilter] = useState('ALL');
  const [weighedItemSearch, setWeighedItemSearch] = useState('');
  
  // Custom Manual Extra Item State
  const [customItem, setCustomItem] = useState({
    name: '',
    price: '',
    quantity: 1,
    category: 'Custom Extra Service',
  });

  // Active Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  // Shift Stats & Daily Settlement Report Modal
  const [shiftCount, setShiftCount] = useState(0);
  const [shiftTotal, setShiftTotal] = useState(0);
  const [showShiftReportModal, setShowShiftReportModal] = useState(false);
  const [shiftReportData, setShiftReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Load Real-time Daily Shift Stats for This Counter (Strictly Offline POS Walk-In Orders)
  const loadRealtimeShiftStats = useCallback(async () => {
    try {
      const data = await reportService.generateFinancialReport({
        datePreset: 'today',
        branchFilter: activeTerminalId || 'POS_ONLY',
        channelFilter: 'POS_ONLY',
        onlyOfflinePos: true,
      });
      const count = data?.metrics?.totalOrdersCount || 0;
      const total = data?.metrics?.totalGrossBilled || 0;
      setShiftCount(count);
      setShiftTotal(total);
      return data;
    } catch (err) {
      console.warn('Failed to load real-time shift stats:', err);
    }
  }, [activeTerminalId]);

  const [showPastShiftPicker, setShowPastShiftPicker] = useState(false);
  const [selectedPastDate, setSelectedPastDate] = useState('');

  const handleOpenShiftReport = async (targetDate = null, preset = 'today') => {
    setIsLoadingReport(true);
    setShowPastShiftPicker(false);
    try {
      let data;
      if (preset === 'today' && !targetDate) {
        data = await loadRealtimeShiftStats();
      } else {
        data = await reportService.generateFinancialReport({
          datePreset: preset,
          targetDate: targetDate || null,
          branchFilter: activeTerminalId || 'POS_ONLY',
          channelFilter: 'POS_ONLY',
          onlyOfflinePos: true,
        });
      }
      if (data) {
        setShiftReportData(data);
        setShowShiftReportModal(true);
      }
    } catch (err) {
      error('Report Error', 'Failed to generate counter shift settlement report.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Real-time synchronization of shift orders
  useEffect(() => {
    loadRealtimeShiftStats();

    const handleOrderChange = () => {
      loadRealtimeShiftStats();
    };

    window.addEventListener('techwash-new-order-placed', handleOrderChange);
    window.addEventListener('techwash-order-updated', handleOrderChange);
    window.addEventListener('storage', handleOrderChange);

    let broadcastChannel;
    try {
      if ('BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel('techwash_orders_channel');
        broadcastChannel.onmessage = () => {
          loadRealtimeShiftStats();
        };
      }
    } catch (e) {}

    const interval = setInterval(() => {
      loadRealtimeShiftStats();
    }, 6000); // Live poll every 6s

    return () => {
      window.removeEventListener('techwash-new-order-placed', handleOrderChange);
      window.removeEventListener('techwash-order-updated', handleOrderChange);
      window.removeEventListener('storage', handleOrderChange);
      clearInterval(interval);
      if (broadcastChannel) {
        try { broadcastChannel.close(); } catch (e) {}
      }
    };
  }, [loadRealtimeShiftStats]);

  // Load Terminal and Session
  useEffect(() => {
    const initTerminal = async () => {
      const termData = await terminalAuthService.getTerminalById(activeTerminalId);
      setTerminal(termData);
      const activeSession = terminalAuthService.getTerminalSession(activeTerminalId);
      setSession(activeSession);
    };
    initTerminal();
  }, [activeTerminalId]);

  // Real-time Master Pricing Configuration Synchronization
  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);

  useEffect(() => {
    pricingService.getPricingConfig().then(cfg => {
      if (cfg) setPricingConfig(cfg);
    });
    const unsub = pricingService.subscribeToPricing((newCfg) => {
      if (newCfg) setPricingConfig(newCfg);
    });
    return unsub;
  }, []);

  const posServices = useMemo(() => buildWalkInServicesFromPricing(pricingConfig), [pricingConfig]);
  const dynamicMasterCatalog = useMemo(() => buildMasterCatalogFromPricing(pricingConfig), [pricingConfig]);
  const dynamicWeightBands = useMemo(() => buildWeightBandsFromPricing(pricingConfig), [pricingConfig]);
  const dynamicPersonaBands = useMemo(() => buildPersonaRateBandsFromPricing(pricingConfig), [pricingConfig]);

  // Handle Terminal PIN Sign-in
  const handleTerminalLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginPassword.trim()) {
      error('PIN Required', 'Please enter the counter security password / PIN or click Quick Unlock.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const activeSession = await terminalAuthService.loginTerminal(activeTerminalId, loginPassword);
      setSession(activeSession);
      setLoginPassword('');
      success('Counter Unlocked', `Signed in to ${activeSession.terminalName}`);
    } catch (err) {
      error('Access Denied', err.message || 'Incorrect Counter Password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Instant 1-Click Quick Unlock (Zero friction)
  const handleQuickUnlock = async () => {
    setIsLoggingIn(true);
    try {
      const activeSession = await terminalAuthService.quickUnlockTerminal(activeTerminalId);
      setSession(activeSession);
      setLoginPassword('');
      success('Counter Unlocked!', `Ready for billing at ${activeSession.terminalName}`);
    } catch (err) {
      error('Unlock Error', err.message || 'Failed to unlock counter');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Terminal Sign-out
  const handleTerminalLogout = () => {
    terminalAuthService.logoutTerminal(activeTerminalId);
    setSession(null);
    info('Counter Locked', `Signed out of ${terminal?.name || 'Counter'}`);
  };

  // 1-STEP SERVICE SELECTOR:
  // Selecting a service immediately drives the active interface & catalog below
  const handleSelectService = (srv) => {
    const isPerKg = Boolean(srv.perKg);
    const isFold = srv.id === 'srv-wash-and-fold';
    const isIron = srv.id === 'srv-wash-and-iron';
    const foldDefault = dynamicWeightBands.foldRate || srv.defaultPrice || 100;
    const ironDefault = dynamicWeightBands.ironRate || srv.defaultPrice || 130;

    setBillForm(prev => {
      let activeWt = '';
      let activeRate = srv.defaultPrice || 100;

      if (isFold) {
        activeWt = prev.foldWeightKg || '';
        activeRate = prev.foldPricePerKg || foldDefault;
      } else if (isIron) {
        activeWt = prev.ironWeightKg || '';
        activeRate = prev.ironPricePerKg || ironDefault;
      }

      return {
        ...prev,
        serviceId: srv.id,
        serviceName: srv.name,
        serviceEmoji: srv.emoji,
        pricingType: isPerKg ? 'per_kg' : 'per_item',
        weightKg: activeWt,
        pricePerKg: activeRate,
        foldPricePerKg: prev.foldPricePerKg || foldDefault,
        ironPricePerKg: prev.ironPricePerKg || ironDefault,
      };
    });

    setSubCategoryFilter('ALL');
    setWeighedCategoryFilter('ALL');
    setWeighedItemSearch('');
  };

  // Dedicated weight updater ensuring fold and iron weights never overwrite each other
  const handleUpdateWeight = (newWeight) => {
    const isFold = billForm.serviceId === 'srv-wash-and-fold';
    const isIron = billForm.serviceId === 'srv-wash-and-iron';
    setBillForm(prev => ({
      ...prev,
      weightKg: newWeight,
      foldWeightKg: isFold ? newWeight : prev.foldWeightKg,
      ironWeightKg: isIron ? newWeight : prev.ironWeightKg,
    }));
  };

  // Dedicated rate per kg updater ensuring fold and iron rates never overwrite each other
  const handleUpdatePricePerKg = (newRate) => {
    const isFold = billForm.serviceId === 'srv-wash-and-fold';
    const isIron = billForm.serviceId === 'srv-wash-and-iron';
    const parsedRate = Math.max(0, Number(newRate) || 0);
    setBillForm(prev => ({
      ...prev,
      pricePerKg: parsedRate,
      foldPricePerKg: isFold ? parsedRate : prev.foldPricePerKg,
      ironPricePerKg: isIron ? parsedRate : prev.ironPricePerKg,
    }));
  };

  // Active Weighed Laundry category tabs based on active service
  const activeWeighedCategories = useMemo(() => {
    return billForm.serviceId === 'srv-wash-and-fold' 
      ? WASH_AND_FOLD_CATEGORIES 
      : WASH_AND_IRON_CATEGORIES;
  }, [billForm.serviceId]);

  // Weighed Laundry sub-services strictly separated for Wash & Fold vs Wash & Steam Iron
  const filteredWeighedLaundryItems = useMemo(() => {
    const isFold = billForm.serviceId === 'srv-wash-and-fold';
    let list = isFold ? WASH_AND_FOLD_SUB_SERVICES : WASH_AND_IRON_SUB_SERVICES;
    if (weighedItemSearch.trim()) {
      const q = weighedItemSearch.toLowerCase();
      list = list.filter(it => 
        it.name.toLowerCase().includes(q) || 
        (it.displayName && it.displayName.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q))
      );
    }
    if (weighedCategoryFilter !== 'ALL') {
      list = list.filter(it => it.group === weighedCategoryFilter);
    }
    return list;
  }, [billForm.serviceId, weighedCategoryFilter, weighedItemSearch]);

  const isWeighedService = billForm.pricingType === 'per_kg' || billForm.serviceId === 'srv-wash-and-fold' || billForm.serviceId === 'srv-wash-and-iron';

  // 1-STEP DYNAMIC CATALOG FILTER:
  // Maps the active selected core service directly to its relevant items
  const activeServiceCatalog = useMemo(() => {
    let items = dynamicMasterCatalog;
    const sId = billForm.serviceId;

    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      return items.filter(it => 
        it.name.toLowerCase().includes(q) || 
        (it.categoryName && it.categoryName.toLowerCase().includes(q))
      );
    }

    if (sId === 'srv-dry-cleaning') {
      if (subCategoryFilter === 'ALL') {
        items = dynamicMasterCatalog.filter(it => ['MEN', 'WOMEN', 'KIDS', 'SAREES_ETHNIC', 'FOOTWEAR_BAGS'].includes(it.categoryKey));
      } else {
        items = dynamicMasterCatalog.filter(it => it.categoryKey === subCategoryFilter);
      }
    } else if (sId === 'srv-wash-and-fold' || sId === 'srv-wash-and-iron') {
      if (subCategoryFilter === 'ALL') {
        items = dynamicMasterCatalog.filter(it => ['MEN', 'WOMEN', 'KIDS', 'HOUSEHOLD'].includes(it.categoryKey));
      } else {
        items = dynamicMasterCatalog.filter(it => it.categoryKey === subCategoryFilter);
      }
    } else if (sId === 'srv-steam-ironing') {
      items = dynamicMasterCatalog.filter(it => it.categoryKey === 'STEAM_IRONING' || it.name.toLowerCase().includes('steam') || it.name.toLowerCase().includes('iron'));
    } else if (sId === 'srv-saree-spa') {
      items = dynamicMasterCatalog.filter(it => it.categoryKey === 'SAREES_ETHNIC' || it.name.toLowerCase().includes('saree') || it.name.toLowerCase().includes('silk') || it.name.toLowerCase().includes('lehanga'));
    } else if (sId === 'srv-shoe-spa') {
      items = dynamicMasterCatalog.filter(it => it.categoryKey === 'FOOTWEAR_BAGS' || it.name.toLowerCase().includes('shoe') || it.name.toLowerCase().includes('sneaker'));
    } else if (sId === 'srv-curtain-spa') {
      items = dynamicMasterCatalog.filter(it => it.name.toLowerCase().includes('curtain'));
    } else if (sId === 'srv-starch-and-iron') {
      items = dynamicMasterCatalog.filter(it => it.categoryKey === 'STARCH_FINISHING' || it.name.toLowerCase().includes('starch'));
    }

    return items;
  }, [billForm.serviceId, subCategoryFilter, itemSearch, dynamicMasterCatalog]);

  // Add Item From Catalog (with Service Name & Sub-Service Name explicitly linked)
  const handleAddCatalogItem = (item) => {
    setBillForm(prev => {
      const existingIdx = prev.items.findIndex(it => it.name === item.name);
      if (existingIdx >= 0) {
        const updated = [...prev.items];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: updated[existingIdx].unitPrice * newQty
        };
        return { ...prev, items: updated };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            name: item.name,
            serviceName: prev.serviceName,
            subServiceName: item.name,
            emoji: item.emoji || '👔',
            category: item.categoryName || item.category || 'Garment',
            unitPrice: Number(item.price !== undefined ? item.price : (item.defaultPrice || 0)),
            quantity: 1,
            lineTotal: Number(item.price !== undefined ? item.price : (item.defaultPrice || 0))
          }
        ]
      };
    });
  };

  // Add Weighed Laundry Garment Item (Tallies clothes count for receipt/tagging without modifying weighed scale weight)
  const handleAddWeighedClothesItem = (item) => {
    const isFold = billForm.serviceId === 'srv-wash-and-fold';
    const srvName = isFold ? 'Wash & Fold' : 'Wash & Steam Iron';
    const fullItemName = item.fullName || (isFold ? `🧺 Wash & Fold — ${item.name}` : `🫧 Wash & Steam Iron — ${item.name}`);

    setBillForm(prev => {
      const existingIdx = prev.items.findIndex(it => it.name === fullItemName || it.name === item.displayName || it.name === item.name);
      let updatedItems = [];
      if (existingIdx >= 0) {
        updatedItems = [...prev.items];
        const newQty = updatedItems[existingIdx].quantity + 1;
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          name: fullItemName,
          serviceName: srvName,
          quantity: newQty,
          lineTotal: 0,
        };
      } else {
        updatedItems = [
          ...prev.items,
          {
            name: fullItemName,
            serviceName: srvName,
            subServiceName: `${srvName} (${item.category || 'Garment'})`,
            emoji: item.emoji || (isFold ? '🧺' : '🫧'),
            category: `${srvName} Clothes`,
            unitPrice: 0, // Billed under overall batch weight (₹/Kg)
            quantity: 1,
            lineTotal: 0,
          }
        ];
      }
      return { ...prev, items: updatedItems };
    });
  };

  // Add Manual Custom Extra Charge Item
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim()) {
      error('Description Required', 'Please enter a description for the custom service or item.');
      return;
    }
    const price = Number(customItem.price);
    if (isNaN(price) || price <= 0) {
      error('Valid Price Required', 'Please enter a valid amount greater than ₹0.');
      return;
    }
    const qty = Math.max(1, Number(customItem.quantity) || 1);

    setBillForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: customItem.name.trim(),
          emoji: '⚡',
          category: customItem.category || 'Custom Extra Charge',
          unitPrice: price,
          quantity: qty,
          lineTotal: price * qty
        }
      ]
    }));

    setCustomItem({
      name: '',
      price: '',
      quantity: 1,
      category: 'Custom Extra Service'
    });
    success('Added to Bill', `Added "${customItem.name.trim()}" (₹${price} × ${qty})`);
  };

  // Stepper: Increase / Decrease Item Quantity
  const handleUpdateItemQuantity = (index, delta) => {
    setBillForm(prev => {
      const updated = [...prev.items];
      const newQty = (updated[index].quantity || 1) + delta;
      if (newQty <= 0) {
        return { ...prev, items: prev.items.filter((_, i) => i !== index) };
      }
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        lineTotal: updated[index].unitPrice * newQty
      };
      return { ...prev, items: updated };
    });
  };

  // Live Sub-Service / Item Name Edit: Cashier can edit name/description directly
  const handleUpdateItemName = (index, newName) => {
    setBillForm(prev => {
      const updated = [...prev.items];
      if (!updated[index]) return prev;
      updated[index] = {
        ...updated[index],
        name: newName,
        subServiceName: newName
      };
      return { ...prev, items: updated };
    });
  };

  // Live Unit Price Edit: Cashier can adjust price directly per sub-service
  const handleUpdateItemUnitPrice = (index, newPrice) => {
    setBillForm(prev => {
      const updated = [...prev.items];
      if (!updated[index]) return prev;
      const parsedPrice = Math.max(0, Number(newPrice) || 0);
      updated[index] = {
        ...updated[index],
        unitPrice: parsedPrice,
        lineTotal: parsedPrice * (Number(updated[index].quantity) || 1)
      };
      return { ...prev, items: updated };
    });
  };

  // Remove Line Item
  const handleRemoveItem = (index) => {
    setBillForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Financial Calculations (NO DISCOUNT, NO GST, FULLY EDITABLE)
  const foldBatchCost = Number(billForm.foldWeightKg) > 0 
    ? Math.round(Number(billForm.foldWeightKg) * (Number(billForm.foldPricePerKg) || 100)) 
    : 0;

  const ironBatchCost = Number(billForm.ironWeightKg) > 0 
    ? Math.round(Number(billForm.ironWeightKg) * (Number(billForm.ironPricePerKg) || 130)) 
    : 0;

  const subtotal = useMemo(() => {
    // 1. Sum dedicated weighed batches
    const weighedScalesCost = foldBatchCost + ironBatchCost;

    // 2. Extra items or itemized garments
    const extraItemsCost = billForm.items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0);

    // 3. Fallback active weight if neither foldWeightKg nor ironWeightKg was explicitly set but weightKg was set
    let activeFallback = 0;
    if (billForm.pricingType === 'per_kg' && !foldBatchCost && !ironBatchCost && Number(billForm.weightKg) > 0) {
      activeFallback = Math.round(Number(billForm.weightKg) * (Number(billForm.pricePerKg) || 100));
    }

    return weighedScalesCost + activeFallback + extraItemsCost;
  }, [foldBatchCost, ironBatchCost, billForm.pricingType, billForm.weightKg, billForm.pricePerKg, billForm.items]);

  const expressFee = billForm.expressOption === 'EXPRESS_24H' ? 100 : 0;
  const calculatedGrandTotal = Math.max(0, subtotal + expressFee);

  // Admin editable grand total override
  const hasCustomGrandTotal = billForm.customGrandTotal !== '' && billForm.customGrandTotal !== undefined && !isNaN(Number(billForm.customGrandTotal));
  const finalGrandTotal = hasCustomGrandTotal ? Math.max(0, Number(billForm.customGrandTotal)) : calculatedGrandTotal;

  // Received Amount & Balance Due
  const effectiveReceived = billForm.receivedAmount !== undefined 
    ? Number(billForm.receivedAmount) 
    : (billForm.paymentStatus === 'PAID' ? finalGrandTotal : 0);
  const balanceDueAmount = Math.max(0, finalGrandTotal - effectiveReceived);

  // Quick 1-Click Payment Mode Setter
  const handleQuickPaymentSelect = (method, isPaid) => {
    if (isPaid) {
      setBillForm(prev => ({
        ...prev,
        paymentMethod: method,
        paymentStatus: 'PAID',
        receivedAmount: finalGrandTotal
      }));
    } else {
      setBillForm(prev => ({
        ...prev,
        paymentMethod: method,
        paymentStatus: 'UNPAID',
        receivedAmount: 0
      }));
    }
  };

  // Submit and Create In-Store POS Bill
  const handleCreatePOSOrder = async (e) => {
    if (e) e.preventDefault();
    if (!billForm.customerName.trim()) {
      error('Customer Name Required', 'Please enter customer full name.');
      return;
    }
    const cleanPhone = String(billForm.phone).replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      error('Valid Mobile Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const hasFoldWeight = Number(billForm.foldWeightKg) > 0;
    const hasIronWeight = Number(billForm.ironWeightKg) > 0;
    const hasActiveWeight = billForm.pricingType === 'per_kg' && Number(billForm.weightKg) > 0;
    const hasAnyWeight = hasFoldWeight || hasIronWeight || hasActiveWeight;

    if (billForm.pricingType === 'per_item' && billForm.items.length === 0 && !hasAnyWeight) {
      error('No Items Added', 'Please add at least 1 garment/item or enter weighed laundry weight.');
      return;
    }

    if (billForm.pricingType === 'per_kg' && !hasAnyWeight && billForm.items.length === 0) {
      error('Weight Required', 'Please enter or select the weighed laundry weight in Kg.');
      return;
    }

    setIsCreatingBill(true);
    try {
      // Calculate total grams & weight
      const totalGrams = billForm.items.reduce((acc, it) => acc + (it.quantity * 350), 0);
      const totalWeighedKg = (Number(billForm.foldWeightKg) || 0) + (Number(billForm.ironWeightKg) || 0) || (billForm.pricingType === 'per_kg' ? Number(billForm.weightKg) : null);
      const estWeight = totalWeighedKg || (totalGrams > 0 ? (totalGrams / 1000) : null);

      // Generate next 5-digit sequential number or use cashier-entered 4-digit offline bill slip number
      const seqData = await orderService.getNextOrderSequence();
      const customBill = billForm.manualBillNumber?.trim();
      const finalOrderNum = customBill 
        ? (customBill.startsWith('TW-') ? customBill : `TW-${customBill}`)
        : seqData.orderNumber;
      const finalInvoiceNum = customBill 
        ? (customBill.startsWith('TW-') ? customBill : `TW-${customBill}`)
        : seqData.invoiceNumber;

      const resolvedPaymentStatus = balanceDueAmount === 0 
        ? 'PAID' 
        : (effectiveReceived > 0 ? 'PARTIAL' : 'PENDING');

      const branchDef = DEFAULT_BILLING_TERMINALS.find(t => t.id === activeTerminalId) || DEFAULT_BILLING_TERMINALS[0];
      const resolvedTerminalId = terminal?.id || activeTerminalId || branchDef.id;
      const resolvedTerminalCode = terminal?.code || branchDef.code;
      const resolvedStoreBranch = terminal?.locationName || branchDef.locationName;
      const resolvedStoreAddress = terminal?.address || branchDef.address;
      const resolvedCashier = terminal?.assignedOperator || session?.operatorName || branchDef.assignedOperator;

      // Construct explicit line items
      const finalItems = [];

      if (Number(billForm.foldWeightKg) > 0) {
        const foldRate = Number(billForm.foldPricePerKg) || 100;
        const foldCost = Math.round(Number(billForm.foldWeightKg) * foldRate);
        finalItems.push({
          name: `🧺 Wash & Fold Scale Batch (${billForm.foldWeightKg} Kg @ ₹${foldRate}/Kg)`,
          serviceName: 'Wash & Fold',
          subServiceName: `Wash & Fold Scale (${billForm.foldWeightKg} Kg)`,
          emoji: '🧺',
          category: 'Wash & Fold Scale',
          unitPrice: foldCost,
          quantity: 1,
          lineTotal: foldCost,
          weightKg: Number(billForm.foldWeightKg),
          pricePerKg: foldRate,
          isWeightItem: true,
        });
      }

      if (Number(billForm.ironWeightKg) > 0) {
        const ironRate = Number(billForm.ironPricePerKg) || 130;
        const ironCost = Math.round(Number(billForm.ironWeightKg) * ironRate);
        finalItems.push({
          name: `🫧 Wash & Steam Iron Scale Batch (${billForm.ironWeightKg} Kg @ ₹${ironRate}/Kg)`,
          serviceName: 'Wash & Steam Iron',
          subServiceName: `Wash & Steam Iron Scale (${billForm.ironWeightKg} Kg)`,
          emoji: '🫧',
          category: 'Wash & Steam Iron Scale',
          unitPrice: ironCost,
          quantity: 1,
          lineTotal: ironCost,
          weightKg: Number(billForm.ironWeightKg),
          pricePerKg: ironRate,
          isWeightItem: true,
        });
      }

      billForm.items.forEach(it => {
        finalItems.push({
          serviceName: it.serviceName || billForm.serviceName,
          subServiceName: it.subServiceName || it.name,
          name: it.name,
          emoji: it.emoji || '👔',
          category: it.category || 'General',
          unitPrice: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          lineTotal: Number(it.unitPrice || 0) * Number(it.quantity || 1),
          weightKg: it.weightKg || undefined,
        });
      });

      // Derive composite service name if both were billed
      let resolvedServiceName = billForm.serviceName;
      let resolvedServiceEmoji = billForm.serviceEmoji;
      if (hasFoldWeight && hasIronWeight) {
        resolvedServiceName = '🧺 Wash & Fold + 🫧 Wash & Steam Iron';
        resolvedServiceEmoji = '🧺🫧';
      }

      const orderPayload = {
        id: finalOrderNum,
        orderNumber: finalOrderNum,
        invoiceNumber: finalInvoiceNum,
        manualBillNumber: customBill || '',
        isWalkIn: true,
        orderSource: 'OFFLINE_POS',
        terminalId: resolvedTerminalId,
        terminalCode: resolvedTerminalCode,
        storeBranch: resolvedStoreBranch,
        storeAddress: resolvedStoreAddress,
        storePhone: terminal?.phone || branchDef.phone,
        cashierName: resolvedCashier,
        customer: {
          name: billForm.customerName.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          email: billForm.email.trim(),
          address: `In-Store Walk-in Drop (${resolvedStoreBranch})`,
          storeBranch: resolvedStoreBranch,
          storeAddress: resolvedStoreAddress,
          city: 'Hyderabad',
        },
        customerName: billForm.customerName.trim(),
        phone: cleanPhone,
        whatsapp: cleanPhone,
        address: `In-Store Walk-in Drop (${resolvedStoreBranch})`,
        serviceId: billForm.serviceId,
        serviceName: resolvedServiceName,
        serviceEmoji: resolvedServiceEmoji,
        pricingType: billForm.pricingType,
        weightKg: totalWeighedKg || undefined,
        pricePerKg: billForm.pricingType === 'per_kg' ? Number(billForm.pricePerKg) : undefined,
        items: finalItems,
        estimatedWeightKg: estWeight,
        actualWeight: estWeight,
        priceSnapshot: {
          itemsSubtotal: subtotal,
          deliveryFee: 0,
          expressFee,
          discountAmount: 0,
          taxAmount: 0, // GST REMOVED
          taxes: 0,
          finalTotal: finalGrandTotal,
          receivedAmount: effectiveReceived,
          balanceAmount: balanceDueAmount,
          isExpress: billForm.expressOption !== 'STANDARD',
        },
        totalAmount: finalGrandTotal,
        finalPrice: finalGrandTotal,
        receivedAmount: effectiveReceived,
        balanceAmount: balanceDueAmount,
        paymentStatus: resolvedPaymentStatus,
        paymentMethod: billForm.paymentMethod,
        customerStage: 'INSPECTION',
        internalStage: 'RECEIVED_AT_HUB',
        notes: billForm.notes || 'In-store counter drop-off',
        adminNotes: `POS Order from ${terminal?.name} (Cashier: ${terminal?.assignedOperator})`,
        schedule: {
          pickupDate: new Date().toLocaleDateString('en-GB'),
          pickupSlot: 'In-Store Counter',
        },
      };

      const created = await orderService.createOrder(orderPayload);
      setLastCreatedOrder(created);
      await loadRealtimeShiftStats();

      success('Invoice Created!', `Bill #${created.orderNumber} (₹${finalGrandTotal}) saved successfully.`);

      if (billForm.autoOpenReceipt) {
        setReceiptOrder(created);
      }

      if (billForm.autoSendWhatsApp) {
        setTimeout(() => {
          const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(created);
          whatsappNotificationService.openWhatsAppManual(cleanPhone, msg);
        }, 500);
      }

      // Reset bill form for next customer
      setBillForm(INITIAL_BILL_STATE);
    } catch (err) {
      error('Billing Error', err.message || 'Failed to generate in-store invoice.');
    } finally {
      setIsCreatingBill(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. UNLOCK / SIGN-IN GATE (IF NOT LOGGED IN ON THIS TERMINAL)
  // ─────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <>
        <SEOHead
          title={`${terminal?.name || 'POS Billing Machine'} Sign In | Tech Wash`}
          description="In-Store POS Terminal Sign In for Tech Wash Counter."
          canonicalUrl={`${BASE_URL}/billing/${activeTerminalId}`}
        />

        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
          <div className="w-full max-w-lg space-y-6">
            
            {/* Header Brand */}
            <div className="text-center space-y-2">
              <Link to="/billing" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white transition">
                <span>← All Billing Terminals</span>
              </Link>

              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-orange-500/20">
                <Store className="w-8 h-8" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
                {terminal?.name || 'Counter POS Terminal'}
              </h1>
              <p className="text-xs text-slate-400">
                {terminal?.address || 'Tech Wash Store Location, Hyderabad'}
              </p>
            </div>

            {/* Quick Switch Counter Bar */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-bold px-2">Switch Machine:</span>
              {DEFAULT_BILLING_TERMINALS.map((t) => {
                const isCur = t.id === activeTerminalId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/billing/${t.id}`)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCur 
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {t.code}
                  </button>
                );
              })}
            </div>

            {/* Login Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-5">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Terminal Code:</span>
                  <span className="font-mono font-bold text-orange-400">{terminal?.code || 'TW-POS'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Assigned Cashier:</span>
                  <span className="font-semibold text-slate-200">{terminal?.assignedOperator || 'Cashier'}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-white/5">
                  <span className="text-slate-500">Default PIN:</span>
                  <span className="font-mono font-bold text-emerald-400">{terminal?.password || 'techwash1'}</span>
                </div>
              </div>

              {/* Instant 1-Click Cashier Unlock Button */}
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={handleQuickUnlock}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>⚡ Instant Cashier Unlock (Start POS Now)</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Or Enter Counter PIN</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <form onSubmit={handleTerminalLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Security Password / PIN *
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginPassword(terminal?.password || 'techwash1');
                        }}
                        className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                      >
                        [Fill '{terminal?.password || 'techwash1'}']
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      placeholder={`Enter PIN (e.g. ${terminal?.password || 'techwash1'})`}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/20 text-white font-mono text-sm tracking-wider outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-orange-400" />
                      <span>Sign In with PIN</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-[11px] text-slate-500">
                <span>Admin can reset or assign counter passwords in </span>
                <Link to="/admin/staff" className="text-orange-400 hover:underline font-semibold">
                  Admin Panel
                </Link>
              </div>
            </div>

          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ACTIVE POS BILLING MACHINE INTERFACE
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <SEOHead
        title={`POS Billing — ${terminal?.name || 'Counter Machine'} | Tech Wash`}
        description="Active In-Store Billing Machine & POS Terminal."
        canonicalUrl={`${BASE_URL}/billing/${activeTerminalId}`}
      />

      <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 pos-workspace-screen print:hidden no-print">
        
        {/* ── TOP COUNTER STATUS & ACTION BAR ── */}
        <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            
            {/* Left: Terminal Identity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm text-white font-display">
                    {terminal?.name}
                  </h1>
                  <span className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online Counter
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-sm">
                  {terminal?.address} • Cashier: <strong className="text-orange-300">{terminal?.assignedOperator}</strong>
                </p>
              </div>
            </div>

            {/* Right: Shift Stats & Counter Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Today's Shift</span>
                  <span className="font-bold text-white font-mono">{shiftCount} Bills</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Shift Collection</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{shiftTotal}</span>
                </div>
              </div>

              {/* Today's Shift Report (PDF) */}
              <button
                type="button"
                disabled={isLoadingReport}
                onClick={() => handleOpenShiftReport(null, 'today')}
                className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold transition border border-orange-500/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Print today's live shift settlement report for this counter"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span>Shift Report (PDF)</span>
              </button>

              {/* Past Shifts Dropdown / Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPastShiftPicker(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  title="View or print past day shifts"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Past Shifts</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showPastShiftPicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl z-50 text-white space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-200">Select Shift Date</span>
                      <button
                        type="button"
                        onClick={() => setShowPastShiftPicker(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenShiftReport(null, 'today')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-orange-300 transition text-left cursor-pointer"
                      >
                        📅 Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenShiftReport(null, 'yesterday')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition text-left cursor-pointer"
                      >
                        ⏪ Yesterday
                      </button>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase">
                        Pick Specific Date:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={selectedPastDate || new Date().toISOString().split('T')[0]}
                          onChange={(e) => setSelectedPastDate(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedPastDate) {
                              handleOpenShiftReport(selectedPastDate, 'single');
                            }
                          }}
                          className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        to="/admin/reports"
                        target="_blank"
                        className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 justify-center"
                      >
                        <span>Open Full Date-Wise Archive</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Link to Counter Orders in Order Management */}
              <Link
                to={`/admin/orders?branch=${activeTerminalId}&channel=OFFLINE_POS`}
                target="_blank"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold transition border border-blue-500/40"
                title="View all bills & orders for this branch in Order Management"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Counter Orders</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>

              <Link
                to="/admin/reports?preset=30days"
                target="_blank"
                className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition"
                title="Open 30-Day Master History in new tab"
              >
                <span>30-Day History</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              {/* 1-Click Instant Counter Switcher */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <span className="hidden xl:inline text-[10px] text-slate-400 font-bold px-1.5 uppercase">Counter:</span>
                {DEFAULT_BILLING_TERMINALS.map((t) => {
                  const isCur = t.id === activeTerminalId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={async () => {
                        if (!isCur) {
                          await terminalAuthService.quickUnlockTerminal(t.id);
                          navigate(`/billing/${t.id}`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCur
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                      title={`Switch to ${t.name}`}
                    >
                      <span>{t.code}</span>
                    </button>
                  );
                })}
              </div>

              <Link
                to="/billing"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
                title="View All Billing Machines Hub"
              >
                <span>All Machines</span>
              </Link>

              <button
                type="button"
                onClick={() => setBillForm(INITIAL_BILL_STATE)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                title="Clear inputs for next customer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Bill</span>
              </button>

              <button
                type="button"
                onClick={handleTerminalLogout}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition border border-red-500/30 flex items-center gap-1 cursor-pointer"
                title="Lock this counter terminal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock Counter</span>
              </button>
            </div>

          </div>
        </header>

        {/* ── MAIN POS WORKSPACE GRID ── */}
        <main className="max-w-[1600px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ══════════════════════════════════════════════════════════
              LEFT / CENTER AREA (COL 1-7): 1-STEP SERVICE & CATALOG
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. CUSTOMER & BILL NUMBER CARD */}
            <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>Customer & Bill Details</span>
                </div>
                <span className="text-[11px] text-slate-400">Offline Counter Walk-in</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 4-Digit Offline Bill / Slip Number Input */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    4-Digit Bill No. / Slip #
                  </label>
                  <Input
                    placeholder="e.g. 1042 (Auto if blank)"
                    value={billForm.manualBillNumber}
                    onChange={(e) => setBillForm({ ...billForm, manualBillNumber: e.target.value.replace(/[^0-9A-Za-z\-]/g, '').slice(0, 8) })}
                    className="font-mono font-bold text-orange-600 bg-orange-50/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Customer Name *</label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={billForm.customerName}
                    onChange={(e) => setBillForm({ ...billForm, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">10-Digit Mobile / WhatsApp *</label>
                  <Input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={billForm.phone}
                    onChange={(e) => setBillForm({ ...billForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Email (Optional)</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={billForm.email}
                    onChange={(e) => setBillForm({ ...billForm, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* 2. 1-STEP CORE SERVICE SELECTOR */}
            <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>1. Select Service Category</span>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {billForm.serviceEmoji} {billForm.serviceName} {billForm.pricingType === 'per_kg' ? `(₹${billForm.pricePerKg}/Kg)` : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {posServices.map((srv) => {
                  const isSelected = billForm.serviceId === srv.id;
                  const isWeighed = Boolean(srv.perKg);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectService(srv)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative ${
                        isSelected
                          ? srv.id === 'srv-wash-and-fold'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/40'
                            : srv.id === 'srv-wash-and-iron'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md ring-2 ring-orange-400/30'
                          : srv.id === 'srv-wash-and-fold'
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 text-slate-800'
                            : srv.id === 'srv-wash-and-iron'
                              ? 'bg-purple-50/50 hover:bg-purple-50 border-purple-200 text-slate-800'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{srv.emoji}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isSelected
                            ? 'bg-black/20 text-white'
                            : isWeighed
                              ? srv.id === 'srv-wash-and-fold' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {isWeighed ? `₹${srv.defaultPrice}/Kg` : `From ₹${srv.defaultPrice}`}
                        </span>
                      </div>
                      <div>
                        <div className={`font-bold text-xs leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {srv.name}
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {isWeighed ? 'Scale Weighed Laundry' : 'Per Piece Garment Care'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. DYNAMIC 1-STEP INTERFACE: WEIGHED SCALE OR SERVICE CATALOG */}
            {isWeighedService ? (
              /* ── 3A. WEIGHED LAUNDRY CONTROL PANEL (WASH & FOLD VS WASH & STEAM IRON) ── */
              <section className={`p-5 rounded-2xl border-2 shadow-xs space-y-4 ${
                billForm.serviceId === 'srv-wash-and-fold'
                  ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border-emerald-300'
                  : 'bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/40 border-purple-300'
              }`}>
                {/* 1-Click Top Scale Switcher Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-900/5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 pl-2 hidden sm:inline">
                    Active Scale:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const waf = posServices.find(s => s.id === 'srv-wash-and-fold');
                      if (waf) handleSelectService(waf);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      billForm.serviceId === 'srv-wash-and-fold'
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                    }`}
                  >
                    <span>🧺 Wash & Fold Scale (₹{dynamicWeightBands.foldRate}/Kg)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const wai = posServices.find(s => s.id === 'srv-wash-and-iron');
                      if (wai) handleSelectService(wai);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      billForm.serviceId === 'srv-wash-and-iron'
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/40'
                        : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                    }`}
                  >
                    <span>🫧 Wash & Steam Iron Scale (₹{dynamicWeightBands.ironRate}/Kg)</span>
                  </button>
                </div>

                {/* Header & Subtotal */}
                <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
                  billForm.serviceId === 'srv-wash-and-fold' ? 'border-emerald-200' : 'border-purple-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs text-lg ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'bg-emerald-600' : 'bg-purple-600'
                    }`}>
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`font-bold text-sm sm:text-base font-display ${
                          billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-950' : 'text-purple-950'
                        }`}>
                          {billForm.serviceEmoji} {billForm.serviceName}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          billForm.serviceId === 'srv-wash-and-fold' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}>
                          {billForm.serviceId === 'srv-wash-and-fold' ? `₹${dynamicWeightBands.foldRate}/Kg Base Scale` : `₹${dynamicWeightBands.ironRate}/Kg Base Scale`}
                        </span>
                      </div>
                      <p className={`text-[11px] font-medium ${
                        billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-700' : 'text-purple-700'
                      }`}>
                        {billForm.serviceId === 'srv-wash-and-fold'
                          ? '100% RO Soft Water Wash + Moisture Controlled Dry + Store Style Fold'
                          : '100% RO Soft Water Wash + Bio-Enzymes + 3D Tension Steam Form Press'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs block font-semibold ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-700' : 'text-purple-700'
                    }`}>
                      {billForm.serviceId === 'srv-wash-and-fold' ? '🧺 Wash & Fold Subtotal:' : '🫧 Wash & Steam Iron Subtotal:'}
                    </span>
                    <span className={`text-2xl font-black font-mono ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-900' : 'text-purple-900'
                    }`}>
                      ₹{billForm.serviceId === 'srv-wash-and-fold' 
                        ? Math.round((Number(billForm.foldWeightKg || billForm.weightKg) || 0) * (Number(billForm.foldPricePerKg || billForm.pricePerKg) || dynamicWeightBands.foldRate))
                        : Math.round((Number(billForm.ironWeightKg || billForm.weightKg) || 0) * (Number(billForm.ironPricePerKg || billForm.pricePerKg) || dynamicWeightBands.ironRate))}
                    </span>
                  </div>
                </div>

                {/* 1-Click Rate Presets by Customer Persona */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-900' : 'text-purple-900'
                    }`}>
                      ⚡ Select Rate / Kg by Category Persona:
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Current Scale Rate: <strong>₹{billForm.serviceId === 'srv-wash-and-fold' ? (billForm.foldPricePerKg || billForm.pricePerKg || dynamicWeightBands.foldRate) : (billForm.ironPricePerKg || billForm.pricePerKg || dynamicWeightBands.ironRate)}/Kg</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(billForm.serviceId === 'srv-wash-and-fold' 
                      ? dynamicPersonaBands.foldPriceBands 
                      : dynamicPersonaBands.ironPriceBands
                    ).map((persona) => {
                      const currentSelectedRate = Number(billForm.serviceId === 'srv-wash-and-fold' 
                        ? (billForm.foldPricePerKg || billForm.pricePerKg || dynamicWeightBands.foldRate) 
                        : (billForm.ironPricePerKg || billForm.pricePerKg || dynamicWeightBands.ironRate));
                      const isSelected = currentSelectedRate === persona.rate;
                      const isFold = billForm.serviceId === 'srv-wash-and-fold';

                      return (
                        <button
                          key={persona.label}
                          type="button"
                          onClick={() => handleUpdatePricePerKg(persona.rate)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? isFold 
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : isFold
                                ? 'bg-white hover:bg-emerald-50 text-slate-800 border-emerald-200'
                                : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200'
                          }`}
                        >
                          <span className="text-xs font-bold block">{persona.label}</span>
                          <span className={`text-[11px] font-mono font-black ${
                            isSelected 
                              ? isFold ? 'text-emerald-100' : 'text-purple-100' 
                              : isFold ? 'text-emerald-700' : 'text-purple-700'
                          }`}>
                            ₹{persona.rate} / Kg
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Weight & Rate Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-bold uppercase tracking-wider ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-950' : 'text-purple-950'
                    }`}>
                      {billForm.serviceId === 'srv-wash-and-fold' ? '🧺 Wash & Fold Scale Weight (in Kg) *' : '🫧 Wash & Steam Iron Scale Weight (in Kg) *'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder={billForm.serviceId === 'srv-wash-and-fold' ? "e.g. 4.0 (Fold Kg)" : "e.g. 3.5 (Steam Iron Kg)"}
                        value={billForm.serviceId === 'srv-wash-and-fold' ? (billForm.foldWeightKg || (billForm.pricingType === 'per_kg' ? billForm.weightKg : '')) : (billForm.ironWeightKg || (billForm.pricingType === 'per_kg' ? billForm.weightKg : ''))}
                        onChange={(e) => handleUpdateWeight(e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl font-mono text-base font-black outline-none ${
                          billForm.serviceId === 'srv-wash-and-fold'
                            ? 'border-emerald-300 text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                            : 'border-purple-300 text-purple-950 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20'
                        }`}
                      />
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs ${
                        billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-600' : 'text-purple-600'
                      }`}>
                        Kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`block text-xs font-bold uppercase tracking-wider ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-950' : 'text-purple-950'
                    }`}>
                      Rate per Kg (₹ / Kg) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={billForm.serviceId === 'srv-wash-and-fold' ? String(dynamicWeightBands.foldRate) : String(dynamicWeightBands.ironRate)}
                        value={billForm.serviceId === 'srv-wash-and-fold' ? (billForm.foldPricePerKg || billForm.pricePerKg || dynamicWeightBands.foldRate) : (billForm.ironPricePerKg || billForm.pricePerKg || dynamicWeightBands.ironRate)}
                        onChange={(e) => handleUpdatePricePerKg(e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white border-2 rounded-xl font-mono text-base font-black outline-none ${
                          billForm.serviceId === 'srv-wash-and-fold'
                            ? 'border-emerald-300 text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                            : 'border-purple-300 text-purple-950 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20'
                        }`}
                      />
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs ${
                        billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-600' : 'text-purple-600'
                      }`}>
                        /Kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distinct Weight Bands */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-800' : 'text-purple-800'
                    }`}>
                      {billForm.serviceId === 'srv-wash-and-fold' ? '🧺 Wash & Fold Weight Bands:' : '🫧 Wash & Steam Iron Weight Bands:'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Click preset to auto-set weight & calculate total
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {(billForm.serviceId === 'srv-wash-and-fold' ? dynamicWeightBands.foldBands : dynamicWeightBands.ironBands).map((band) => {
                      const activeWt = Number(billForm.serviceId === 'srv-wash-and-fold' ? (billForm.foldWeightKg || billForm.weightKg) : (billForm.ironWeightKg || billForm.weightKg));
                      const activeRate = Number(billForm.serviceId === 'srv-wash-and-fold' ? (billForm.foldPricePerKg || billForm.pricePerKg || dynamicWeightBands.foldRate) : (billForm.ironPricePerKg || billForm.pricePerKg || dynamicWeightBands.ironRate));
                      const isSelected = activeWt === band.wt;
                      const calculatedBandTotal = Math.round(band.wt * activeRate);

                      return (
                        <button
                          key={band.wt}
                          type="button"
                          onClick={() => handleUpdateWeight(String(band.wt))}
                          className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                            isSelected
                              ? billForm.serviceId === 'srv-wash-and-fold'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                                : 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-400/40'
                              : billForm.serviceId === 'srv-wash-and-fold'
                                ? 'bg-white hover:bg-emerald-50 text-slate-800 border-emerald-200'
                                : 'bg-white hover:bg-purple-50 text-slate-800 border-purple-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs">{band.label}</span>
                            <span className={`text-[10px] font-mono font-bold ${
                              isSelected ? 'text-white font-extrabold' : billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-700' : 'text-purple-700'
                            }`}>
                              ₹{calculatedBandTotal}
                            </span>
                          </div>
                          <span className={`text-[9px] truncate mt-0.5 ${
                            isSelected ? 'text-white/85' : 'text-slate-500'
                          }`}>
                            {band.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Services & Clothes Breakdown for Weighed Laundry (Categorized) */}
                <div className={`pt-3 border-t space-y-3 ${
                  billForm.serviceId === 'srv-wash-and-fold' ? 'border-emerald-200' : 'border-purple-200'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={`text-xs font-bold block ${
                        billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-950' : 'text-purple-950'
                      }`}>
                        👔 {billForm.serviceName} Clothes Count (Categorized for Tagging & Receipt):
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Tallying {billForm.items.reduce((acc, it) => acc + (it.quantity || 0), 0)} pieces under {billForm.serviceName}
                      </span>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      billForm.serviceId === 'srv-wash-and-fold'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {filteredWeighedLaundryItems.length} Clothes in View
                    </span>
                  </div>

                  {/* Weighed Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {activeWeighedCategories.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setWeighedCategoryFilter(cat.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                          weighedCategoryFilter === cat.key
                            ? billForm.serviceId === 'srv-wash-and-fold'
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/30'
                              : 'bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-400/30'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Weighed Clothes Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`🔍 Search clothes (e.g. Shirt, Saree, Bedsheet, Kurta, Leggings)...`}
                      value={weighedItemSearch}
                      onChange={(e) => setWeighedItemSearch(e.target.value)}
                      className="w-full pl-8 pr-16 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    {weighedItemSearch && (
                      <button
                        type="button"
                        onClick={() => setWeighedItemSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* Categorized Clothes Pieces Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredWeighedLaundryItems.map((item) => {
                      const existing = billForm.items.find(it => it.name === item.fullName || it.name === item.displayName || it.name === item.name);
                      const isAdded = !!existing;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddWeighedClothesItem(item)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isAdded
                              ? billForm.serviceId === 'srv-wash-and-fold'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400 shadow-2xs'
                                : 'bg-purple-50 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-400 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{item.emoji}</span>
                            {isAdded && (
                              <span className={`px-1.5 py-0.2 rounded-md text-white text-[10px] font-black font-mono ${
                                billForm.serviceId === 'srv-wash-and-fold' ? 'bg-emerald-700' : 'bg-purple-700'
                              }`}>
                                ×{existing.quantity} Pcs
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <div className="text-[11px] font-bold leading-tight truncate">{item.displayName || item.name}</div>
                            <div className={`text-[9px] truncate ${
                              billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-700' : 'text-purple-700'
                            }`}>{item.category}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add-on Treatments for Weighed Laundry */}
                <div className={`pt-3 border-t space-y-2 ${
                  billForm.serviceId === 'srv-wash-and-fold' ? 'border-emerald-200' : 'border-purple-200'
                }`}>
                  <span className={`text-[11px] font-bold block ${
                    billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-900' : 'text-purple-900'
                  }`}>
                    + Optional Laundry Add-ons & Treatments:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Antiseptic Fabric Sanitization', price: 40, emoji: '🛡️', cat: 'Sanitization' },
                      { name: 'Luxury Fold & Box Packing', price: 50, emoji: '🎁', cat: 'Packaging' },
                      { name: 'Collar & Cuff Stain Treatment', price: 100, emoji: '🧼', cat: 'Stain Care' },
                      { name: 'Silk Softener Rinse', price: 50, emoji: '🌸', cat: 'Softener' },
                    ].map((addon, idx) => {
                      const isAdded = billForm.items.some(it => it.name === addon.name);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddCatalogItem(addon)}
                          className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex flex-col justify-between ${
                            isAdded
                              ? billForm.serviceId === 'srv-wash-and-fold'
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                : 'bg-purple-100 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-400'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{addon.emoji}</span>
                            <span className={`font-mono font-bold ${
                              billForm.serviceId === 'srv-wash-and-fold' ? 'text-emerald-700' : 'text-purple-700'
                            }`}>+₹{addon.price}</span>
                          </div>
                          <span className="text-[10px] mt-1 leading-tight line-clamp-1">{addon.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </section>
            ) : (
              /* ── 3B. 1-STEP ITEM CATALOG GRID ── */
              <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                    <Tag className="w-4 h-4 text-orange-600" />
                    <span>{billForm.serviceEmoji} {billForm.serviceName} Catalog ({activeServiceCatalog.length} Items)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Click item to add directly to invoice</span>
                </div>

                {/* Sub-category chips (if Dry Cleaning is active) */}
                {billForm.serviceId === 'srv-dry-cleaning' && !itemSearch && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { key: 'ALL', label: 'All Garments', emoji: '✨' },
                      { key: 'MEN', label: "Men's Tops & Suits", emoji: '👔' },
                      { key: 'WOMEN', label: "Women's & Dresses", emoji: '👗' },
                      { key: 'SAREES_ETHNIC', label: 'Sarees & Ethnic', emoji: '🥻' },
                      { key: 'KIDS', label: 'Kids Wear', emoji: '👶' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSubCategoryFilter(cat.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1 cursor-pointer ${
                          subCategoryFilter === cat.key
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`🔍 Search garments (e.g. ${billForm.serviceId === 'srv-saree-spa' ? 'Pattu, Silk, Zari, Blouse' : 'Shirt, Blazer, Saree, Kurta, Shoes, Curtains'})...`}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-10 pr-20 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  {itemSearch && (
                    <button
                      type="button"
                      onClick={() => setItemSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {/* Garments Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                  {activeServiceCatalog.map((item) => {
                    const existing = billForm.items.find(it => it.name === item.name);
                    const isAdded = !!existing;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddCatalogItem(item)}
                        className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between gap-1 cursor-pointer active:scale-95 ${
                          isAdded
                            ? 'bg-orange-50/95 border-orange-400 ring-1 ring-orange-400/40 shadow-xs'
                            : 'bg-slate-50 hover:bg-orange-50/50 border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-base">{item.emoji || '👔'}</span>
                          {isAdded && (
                            <span className="px-1.5 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black font-mono">
                              ×{existing.quantity}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate group-hover:text-orange-950" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.categoryName || 'Care'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-0.5">
                          <span className="font-mono font-black text-orange-600 text-xs">
                            ₹{item.price}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 group-hover:text-orange-600">
                            + Add
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. MANUAL CUSTOM BILLING & EXTRA CHARGES */}
            <section className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-orange-500/30 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                      Manual Custom Billing & Extra Charges
                    </span>
                    <span className="text-[11px] text-slate-600 block">
                      Add any custom item, stain treatment, alteration or special rate.
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Custom Item Description *
                  </label>
                  <Input
                    placeholder="e.g. Wine Stain Removal, Silk Zari Polish, Alteration"
                    value={customItem.name}
                    onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                    className="bg-white text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={customItem.category}
                    onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Custom Extra Service">Custom Service</option>
                    <option value="Special Stain Treatment">Stain Treatment</option>
                    <option value="Alteration & Repair">Alteration & Repair</option>
                    <option value="Zari Polishing & Shield">Zari Polish</option>
                    <option value="Express Surcharge">Express Fee</option>
                    <option value="Packing & Box">Packaging</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Rate (₹) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="₹ Rate"
                    value={customItem.price}
                    onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                    className="bg-white text-xs font-bold text-orange-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT AREA (COL 8-12): LIVE BILL, EDITABLE PRICES & TOTAL
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* INVOICE LINE ITEMS & CART */}
            <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4 sticky top-18">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                    Invoice Items ({billForm.items.length}{((Number(billForm.foldWeightKg) > 0) || (Number(billForm.ironWeightKg) > 0)) ? ' + Scale Batches' : (isWeighedService && billForm.weightKg ? ' + Scale Batch' : '')})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillForm({ ...billForm, items: [], weightKg: '', foldWeightKg: '', ironWeightKg: '' })}
                  disabled={billForm.items.length === 0 && !billForm.weightKg && !billForm.foldWeightKg && !billForm.ironWeightKg}
                  className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                
                {/* 🧺 Wash & Fold Weighed Batch Line */}
                {(Number(billForm.foldWeightKg) > 0 || (billForm.serviceId === 'srv-wash-and-fold' && Number(billForm.weightKg) > 0)) && (
                  <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/90 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5 truncate text-emerald-950">
                        <span>🧺</span>
                        <span className="truncate">🧺 Wash & Fold Scale Batch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs shrink-0 text-emerald-950">
                          ₹{Math.round((Number(billForm.foldWeightKg || (billForm.serviceId === 'srv-wash-and-fold' ? billForm.weightKg : 0)) || 0) * (Number(billForm.foldPricePerKg || billForm.pricePerKg) || 100))}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillForm(prev => ({ 
                            ...prev, 
                            foldWeightKg: '', 
                            weightKg: prev.serviceId === 'srv-wash-and-fold' ? '' : prev.weightKg 
                          }))}
                          className="text-emerald-700 hover:text-red-500 p-0.5 cursor-pointer"
                          title="Remove Wash & Fold batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] bg-white/90 p-1.5 rounded-lg border border-emerald-200 text-emerald-800">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Fold Wt:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={billForm.foldWeightKg || (billForm.serviceId === 'srv-wash-and-fold' ? billForm.weightKg : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBillForm(prev => ({
                              ...prev,
                              foldWeightKg: val,
                              weightKg: prev.serviceId === 'srv-wash-and-fold' ? val : prev.weightKg
                            }));
                          }}
                          placeholder="0.0"
                          className="w-14 px-1 py-0.5 border border-emerald-300 rounded font-mono font-bold text-center outline-none bg-emerald-50 text-emerald-900 focus:bg-white"
                          title="Edit Wash & Fold Weight (Kg)"
                        />
                        <span>Kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Rate: ₹</span>
                        <input
                          type="number"
                          min="0"
                          value={billForm.foldPricePerKg || 100}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setBillForm(prev => ({
                              ...prev,
                              foldPricePerKg: val,
                              pricePerKg: prev.serviceId === 'srv-wash-and-fold' ? val : prev.pricePerKg
                            }));
                          }}
                          className="w-14 px-1 py-0.5 border border-emerald-300 rounded font-mono font-bold text-center outline-none bg-emerald-50 text-emerald-900 focus:bg-white"
                          title="Edit Wash & Fold Rate (₹/Kg)"
                        />
                        <span>/Kg</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🫧 Wash & Steam Iron Weighed Batch Line */}
                {(Number(billForm.ironWeightKg) > 0 || (billForm.serviceId === 'srv-wash-and-iron' && Number(billForm.weightKg) > 0)) && (
                  <div className="p-2.5 rounded-xl border border-purple-300 bg-purple-50/90 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5 truncate text-purple-950">
                        <span>🫧</span>
                        <span className="truncate">🫧 Wash & Steam Iron Scale Batch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs shrink-0 text-purple-950">
                          ₹{Math.round((Number(billForm.ironWeightKg || (billForm.serviceId === 'srv-wash-and-iron' ? billForm.weightKg : 0)) || 0) * (Number(billForm.ironPricePerKg || billForm.pricePerKg) || 130))}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillForm(prev => ({ 
                            ...prev, 
                            ironWeightKg: '', 
                            weightKg: prev.serviceId === 'srv-wash-and-iron' ? '' : prev.weightKg 
                          }))}
                          className="text-purple-700 hover:text-red-500 p-0.5 cursor-pointer"
                          title="Remove Wash & Steam Iron batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] bg-white/90 p-1.5 rounded-lg border border-purple-200 text-purple-800">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Iron Wt:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={billForm.ironWeightKg || (billForm.serviceId === 'srv-wash-and-iron' ? billForm.weightKg : '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBillForm(prev => ({
                              ...prev,
                              ironWeightKg: val,
                              weightKg: prev.serviceId === 'srv-wash-and-iron' ? val : prev.weightKg
                            }));
                          }}
                          placeholder="0.0"
                          className="w-14 px-1 py-0.5 border border-purple-300 rounded font-mono font-bold text-center outline-none bg-purple-50 text-purple-900 focus:bg-white"
                          title="Edit Wash & Steam Iron Weight (Kg)"
                        />
                        <span>Kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Rate: ₹</span>
                        <input
                          type="number"
                          min="0"
                          value={billForm.ironPricePerKg || 130}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setBillForm(prev => ({
                              ...prev,
                              ironPricePerKg: val,
                              pricePerKg: prev.serviceId === 'srv-wash-and-iron' ? val : prev.pricePerKg
                            }));
                          }}
                          className="w-14 px-1 py-0.5 border border-purple-300 rounded font-mono font-bold text-center outline-none bg-purple-50 text-purple-900 focus:bg-white"
                          title="Edit Wash & Steam Iron Rate (₹/Kg)"
                        />
                        <span>/Kg</span>
                      </div>
                    </div>
                  </div>
                )}

                {billForm.items.length === 0 && !Number(billForm.foldWeightKg) && !Number(billForm.ironWeightKg) && (!isWeighedService || !billForm.weightKg) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-1">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No Items Added Yet</p>
                    <p className="text-[11px]">Select items or enter weight to start billing.</p>
                  </div>
                ) : (
                  billForm.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-sm shrink-0">{it.emoji || '👔'}</span>
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => handleUpdateItemName(idx, e.target.value)}
                            className="font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-orange-500 px-1 py-0.5 rounded outline-none w-full text-xs"
                            title="Click to edit garment / sub-service name"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-[10px] text-slate-500 truncate">
                          {it.serviceName || billForm.serviceName}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Live Editable Unit Price */}
                          <div className="flex items-center gap-0.5 shrink-0" title="Adjust price per item">
                            <span className="text-[10px] font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={it.unitPrice}
                              onChange={(e) => handleUpdateItemUnitPrice(idx, e.target.value)}
                              className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 text-right outline-none focus:border-orange-500"
                            />
                          </div>

                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-0.5 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, -1)}
                              className="w-4 h-4 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-slate-900 text-[11px]">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, 1)}
                              className="w-4 h-4 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="font-mono font-bold text-slate-900 text-xs shrink-0 w-12 text-right">
                            ₹{it.lineTotal}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── BILL SUMMARY CALCULATOR (NO DISCOUNT, NO GST) ── */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                
                {/* Subtotal */}
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal}</span>
                </div>

                {/* Turnaround Selector */}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery Speed:</span>
                  <select
                    value={billForm.expressOption}
                    onChange={(e) => setBillForm({ ...billForm, expressOption: e.target.value })}
                    className="px-2 py-0.5 rounded bg-white border border-slate-300 font-bold text-[11px] text-slate-800"
                  >
                    <option value="STANDARD">Standard Care (0 Fee)</option>
                    <option value="EXPRESS_24H">⚡ 24-Hr Express (+₹100)</option>
                  </select>
                </div>

                {/* Grand Total with Direct Editable Override */}
                <div className="pt-2 border-t-2 border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-slate-900">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm uppercase tracking-wider block">Grand Total</span>
                        {hasCustomGrandTotal && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white uppercase shadow-2xs">
                            Custom
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {hasCustomGrandTotal ? `Auto-calc was ₹${calculatedGrandTotal}` : 'Click box to edit final total'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-orange-600">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={hasCustomGrandTotal ? billForm.customGrandTotal : calculatedGrandTotal}
                        onChange={(e) => setBillForm({ ...billForm, customGrandTotal: e.target.value })}
                        placeholder={String(calculatedGrandTotal)}
                        className="w-24 px-2 py-1 bg-white border-2 border-orange-400 rounded-xl font-mono text-lg font-black text-orange-600 text-right outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                        title="Admin can edit Grand Total amount directly"
                      />
                      {hasCustomGrandTotal && (
                        <button
                          type="button"
                          onClick={() => setBillForm({ ...billForm, customGrandTotal: '' })}
                          className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer border border-slate-300"
                          title="Reset to auto-calculated total"
                        >
                          ↺ Auto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 4 QUICK 1-CLICK PAYMENT BUTTONS ── */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Quick Payment Selection (1-Click)
                  </label>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPaymentSelect('CASH', true)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        billForm.paymentMethod === 'CASH' && effectiveReceived === finalGrandTotal
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <span>💵</span>
                      <span className="text-xs">Full Cash Paid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPaymentSelect('UPI_QR', true)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        billForm.paymentMethod === 'UPI_QR' && effectiveReceived === finalGrandTotal
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <span>📱</span>
                      <span className="text-xs">Full UPI Paid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPaymentSelect('CARD', true)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        billForm.paymentMethod === 'CARD' && effectiveReceived === finalGrandTotal
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <span>💳</span>
                      <span className="text-xs">Full Card Paid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickPaymentSelect('PAY_ON_DELIVERY', false)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        billForm.paymentMethod === 'PAY_ON_DELIVERY' && effectiveReceived === 0
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <span>⏳</span>
                      <span className="text-xs">Unpaid / Pay Later</span>
                    </button>
                  </div>

                  {/* Custom Received Amount Input */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-xs">Amount Received (₹):</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setBillForm({ ...billForm, receivedAmount: finalGrandTotal, paymentStatus: 'PAID' })}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200 cursor-pointer"
                        >
                          ⚡ Full (₹{finalGrandTotal})
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillForm({ ...billForm, receivedAmount: 0, paymentStatus: 'UNPAID' })}
                          className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                        >
                          ₹0 Unpaid
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={finalGrandTotal}
                        placeholder={String(finalGrandTotal)}
                        value={billForm.receivedAmount !== undefined ? billForm.receivedAmount : (billForm.paymentStatus === 'PAID' ? finalGrandTotal : '')}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setBillForm({ 
                            ...billForm, 
                            receivedAmount: val,
                            paymentStatus: val === finalGrandTotal ? 'PAID' : (val > 0 ? 'PARTIAL' : 'UNPAID')
                          });
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Payment Status Banner */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    balanceDueAmount > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {balanceDueAmount > 0 ? (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>{balanceDueAmount > 0 ? 'Balance Due Pending:' : 'Payment Cleared:'}</span>
                    </div>
                    <span className="font-mono font-black text-sm">
                      {balanceDueAmount > 0 ? `₹${balanceDueAmount} PENDING` : '✓ FULLY PAID (₹0 DUE)'}
                    </span>
                  </div>

                </div>

              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Notes (Printed on Tax Invoice)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 Silk shirts with collar starch, deliver by Friday evening"
                  value={billForm.notes}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-orange-500"
                />
              </div>

              {/* ── DYNAMIC ACTION BUTTON: CONFIRM & PRINT ── */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isCreatingBill}
                  onClick={handleCreatePOSOrder}
                  className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:opacity-50 ${
                    balanceDueAmount === 0
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25'
                  }`}
                >
                  {isCreatingBill ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generating Tax Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>
                        {balanceDueAmount === 0
                          ? `🧾 Settle & Print Bill (Fully Paid - ₹${finalGrandTotal})`
                          : `⏳ Save Order & Print Due Bill (₹${balanceDueAmount} Due)`}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billForm.autoOpenReceipt}
                      onChange={(e) => setBillForm({ ...billForm, autoOpenReceipt: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Auto-open 1-Page Print Receipt</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billForm.autoSendWhatsApp}
                      onChange={(e) => setBillForm({ ...billForm, autoSendWhatsApp: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>📲 Send WhatsApp Bill</span>
                  </label>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* ── OFFICIAL 1-PAGE TAX INVOICE PRINT MODAL ── */}
      {receiptOrder && (
        <ReceiptModal
          isOpen={Boolean(receiptOrder)}
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* ── DAILY SHIFT SETTLEMENT REPORT MODAL ── */}
      {showShiftReportModal && shiftReportData && (
        <FinancialReportModal
          isOpen={showShiftReportModal}
          reportData={shiftReportData}
          onClose={() => setShowShiftReportModal(false)}
        />
      )}
    </>
  );
};

export default BillingMachinePage;
