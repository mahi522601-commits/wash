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
  WALK_IN_SERVICES, 
  POS_CATEGORIES, 
  MASTER_CATALOG_ITEMS 
} from '../admin/AdminOrdersPage';
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
  customGrandTotal: '', // Admin override for total bill amount
  items: [],
  expressOption: 'STANDARD', // 'STANDARD' | 'EXPRESS_24H'
  paymentMethod: 'CASH', // 'CASH' | 'UPI_QR' | 'CARD' | 'PAY_ON_DELIVERY'
  paymentStatus: 'PAID', // 'PAID' | 'PARTIAL' | 'UNPAID'
  receivedAmount: undefined, // undefined = auto-sync with finalGrandTotal if PAID
  autoOpenReceipt: true,
  autoSendWhatsApp: true,
};

// Preset weights for 1-click weighed laundry entry
const QUICK_WEIGHTS = [1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0];

// Granular sub-services / clothes items for Wash & Fold and Wash & Iron
export const WEIGHED_LAUNDRY_ITEMS = [
  { id: 'wt-m-1', name: 'Cotton Shirt', weightKg: 0.3, emoji: '👔', category: "Men's Tops" },
  { id: 'wt-m-2', name: 'Trouser / Pant', weightKg: 0.5, emoji: '👖', category: "Men's Bottoms" },
  { id: 'wt-m-3', name: 'Jeans / Denim', weightKg: 0.8, emoji: '👖', category: "Men's Bottoms" },
  { id: 'wt-m-4', name: 'T-Shirt / Polo', weightKg: 0.2, emoji: '👕', category: "Men's Tops" },
  { id: 'wt-m-5', name: 'Kurta / Ethnic', weightKg: 0.4, emoji: '👘', category: "Men's Ethnic" },
  { id: 'wt-m-6', name: 'Shorts / Trackpant', weightKg: 0.3, emoji: '🩳', category: "Men's Bottoms" },
  { id: 'wt-w-1', name: 'Normal Top / Kurti', weightKg: 0.35, emoji: '👚', category: "Women's Tops" },
  { id: 'wt-w-2', name: 'Medium / Long Top', weightKg: 0.6, emoji: '👚', category: "Women's Tops" },
  { id: 'wt-w-3', name: 'Leggings / Bottoms', weightKg: 0.25, emoji: '👖', category: "Women's Bottoms" },
  { id: 'wt-w-4', name: 'Women T-Shirt', weightKg: 0.2, emoji: '👕', category: "Women's Tops" },
  { id: 'wt-w-5', name: 'Daily Saree / Dress', weightKg: 0.5, emoji: '🥻', category: "Women's Ethnic" },
  { id: 'wt-w-6', name: 'Nighties / Sleepwear', weightKg: 0.3, emoji: '👗', category: "Women's Wear" },
  { id: 'wt-h-1', name: 'Single Bedsheet', weightKg: 0.6, emoji: '🛏️', category: 'Household' },
  { id: 'wt-h-2', name: 'Double / King Bedsheet', weightKg: 1.0, emoji: '🛌', category: 'Household' },
  { id: 'wt-h-3', name: 'Pillow Cover (Pair)', weightKg: 0.2, emoji: '🛋️', category: 'Household' },
  { id: 'wt-h-4', name: 'Bath Towel Large', weightKg: 0.4, emoji: '🧖', category: 'Household' },
];

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
    setBillForm(prev => ({
      ...prev,
      serviceId: srv.id,
      serviceName: srv.name,
      serviceEmoji: srv.emoji,
      pricingType: isPerKg ? 'per_kg' : 'per_item',
      pricePerKg: isPerKg ? (srv.defaultPrice || 100) : prev.pricePerKg
    }));
    setSubCategoryFilter('ALL');
  };

  // 1-STEP DYNAMIC CATALOG FILTER:
  // Maps the active selected core service directly to its relevant items
  const activeServiceCatalog = useMemo(() => {
    let items = MASTER_CATALOG_ITEMS;
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
        items = MASTER_CATALOG_ITEMS.filter(it => ['MEN', 'WOMEN', 'KIDS', 'SAREES_ETHNIC', 'FOOTWEAR_BAGS'].includes(it.categoryKey));
      } else {
        items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === subCategoryFilter);
      }
    } else if (sId === 'srv-wash-and-fold' || sId === 'srv-wash-and-iron') {
      if (subCategoryFilter === 'ALL') {
        items = MASTER_CATALOG_ITEMS.filter(it => ['MEN', 'WOMEN', 'KIDS', 'HOUSEHOLD'].includes(it.categoryKey));
      } else {
        items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === subCategoryFilter);
      }
    } else if (sId === 'srv-steam-ironing') {
      items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === 'STEAM_IRONING' || it.name.toLowerCase().includes('steam') || it.name.toLowerCase().includes('iron'));
    } else if (sId === 'srv-saree-spa') {
      items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === 'SAREES_ETHNIC' || it.name.toLowerCase().includes('saree') || it.name.toLowerCase().includes('silk') || it.name.toLowerCase().includes('lehanga'));
    } else if (sId === 'srv-shoe-spa') {
      items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === 'FOOTWEAR_BAGS' || it.name.toLowerCase().includes('shoe') || it.name.toLowerCase().includes('sneaker'));
    } else if (sId === 'srv-curtain-spa') {
      items = MASTER_CATALOG_ITEMS.filter(it => it.name.toLowerCase().includes('curtain'));
    } else if (sId === 'srv-starch-and-iron') {
      items = MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === 'STARCH_FINISHING' || it.name.toLowerCase().includes('starch'));
    }

    return items;
  }, [billForm.serviceId, subCategoryFilter, itemSearch]);

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

  // Add Weighed Laundry Garment Item (Auto-calculates item inventory & estimated weight)
  const handleAddWeighedClothesItem = (item) => {
    setBillForm(prev => {
      const existingIdx = prev.items.findIndex(it => it.name === item.name);
      let updatedItems = [];
      if (existingIdx >= 0) {
        updatedItems = [...prev.items];
        const newQty = updatedItems[existingIdx].quantity + 1;
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          quantity: newQty,
          lineTotal: updatedItems[existingIdx].unitPrice * newQty,
        };
      } else {
        updatedItems = [
          ...prev.items,
          {
            name: item.name,
            serviceName: prev.serviceName,
            subServiceName: item.name,
            emoji: item.emoji || '👕',
            category: item.category || 'Weighed Garment',
            unitPrice: 0, // Rate billed per-kg
            quantity: 1,
            lineTotal: 0,
            weightKg: item.weightKg || 0.35,
          }
        ];
      }

      // Automatically accumulate weight
      const totalGrams = updatedItems.reduce((acc, it) => acc + ((it.quantity || 1) * ((it.weightKg || 0.35) * 1000)), 0);
      const newWeight = (totalGrams / 1000).toFixed(1);

      return {
        ...prev,
        items: updatedItems,
        weightKg: Number(newWeight) > 0 ? newWeight : prev.weightKg,
      };
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
  const subtotal = useMemo(() => {
    if (billForm.pricingType === 'per_kg') {
      const wt = Number(billForm.weightKg) || 0;
      const weightCost = Math.round(wt * (Number(billForm.pricePerKg) || 100));
      const extraItemsCost = billForm.items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0);
      return weightCost + extraItemsCost;
    }
    return billForm.items.reduce((acc, it) => acc + (Number(it.lineTotal) || 0), 0);
  }, [billForm.pricingType, billForm.weightKg, billForm.pricePerKg, billForm.items]);

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

    if (billForm.pricingType === 'per_item' && billForm.items.length === 0) {
      error('No Items Added', 'Please add at least 1 garment/item to the invoice.');
      return;
    }

    if (billForm.pricingType === 'per_kg' && (!billForm.weightKg || Number(billForm.weightKg) <= 0)) {
      error('Weight Required', 'Please enter or select the weighed laundry weight in Kg.');
      return;
    }

    setIsCreatingBill(true);
    try {
      const totalGrams = billForm.items.reduce((acc, it) => acc + (it.quantity * 350), 0);
      const estWeight = billForm.pricingType === 'per_kg' ? Number(billForm.weightKg) : (totalGrams > 0 ? (totalGrams / 1000) : null);

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
      const resolvedCashier = terminal?.assignedOperator || session?.operatorName || branchDef.assignedOperator;

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
        cashierName: resolvedCashier,
        customer: {
          name: billForm.customerName.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          email: billForm.email.trim(),
          address: `In-Store Walk-in Drop (${resolvedStoreBranch})`,
          city: 'Hyderabad',
        },
        customerName: billForm.customerName.trim(),
        phone: cleanPhone,
        whatsapp: cleanPhone,
        address: `In-Store Walk-in Drop (${resolvedStoreBranch})`,
        serviceId: billForm.serviceId,
        serviceName: billForm.serviceName,
        serviceEmoji: billForm.serviceEmoji,
        pricingType: billForm.pricingType,
        weightKg: billForm.pricingType === 'per_kg' ? Number(billForm.weightKg) : undefined,
        pricePerKg: billForm.pricingType === 'per_kg' ? Number(billForm.pricePerKg) : undefined,
        items: billForm.items.map(it => ({
          serviceName: it.serviceName || billForm.serviceName,
          subServiceName: it.subServiceName || it.name,
          name: it.name,
          emoji: it.emoji || '👔',
          category: it.category || 'General',
          unitPrice: Number(it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
          lineTotal: Number(it.unitPrice || 0) * Number(it.quantity || 1),
          weightKg: it.weightKg || undefined,
        })),
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
  const isWeighedService = billForm.pricingType === 'per_kg';

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
                  <span>1. Select Service (1-Step Instant Catalog)</span>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {billForm.serviceEmoji} {billForm.serviceName} {billForm.pricingType === 'per_kg' ? `(₹${billForm.pricePerKg}/Kg)` : ''}
                </span>
              </div>

              {/* 8 Core Services Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WALK_IN_SERVICES.map((srv) => {
                  const isSelected = billForm.serviceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectService(srv)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md ring-2 ring-orange-400/30'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="text-2xl shrink-0 mt-0.5">{srv.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold text-xs leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {srv.name}
                        </div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                          {srv.perKg ? `₹${srv.defaultPrice}/Kg` : `From ₹${srv.defaultPrice}`}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3. DYNAMIC 1-STEP INTERFACE: WEIGHED SCALE OR SERVICE CATALOG */}
            {isWeighedService ? (
              /* ── 3A. WEIGHED LAUNDRY CONTROL PANEL ── */
              <section className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 border-2 border-purple-300 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-purple-950">
                        {billForm.serviceEmoji} {billForm.serviceName} Scale
                      </h2>
                      <div className="flex items-center gap-2 text-[11px] text-purple-700 mt-0.5">
                        <span>Editable Rate:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">₹</span>
                          <input
                            type="number"
                            min="1"
                            value={billForm.pricePerKg}
                            onChange={(e) => setBillForm({ ...billForm, pricePerKg: Number(e.target.value) || 0 })}
                            className="w-16 px-1.5 py-0.5 bg-white border border-purple-300 rounded font-mono font-black text-purple-900 text-xs text-center outline-none focus:border-purple-600"
                            title="Admin can edit Rate per Kg"
                          />
                          <span className="font-bold">/Kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-purple-700 block font-semibold">Weighed Subtotal:</span>
                    <span className="text-xl font-black font-mono text-purple-900">
                      ₹{Math.round((Number(billForm.weightKg) || 0) * (Number(billForm.pricePerKg) || 100))}
                    </span>
                  </div>
                </div>

                {/* Live Weight & Rate Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Weighed Weight (in Kg) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 4.5"
                        value={billForm.weightKg}
                        onChange={(e) => setBillForm({ ...billForm, weightKg: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border-2 border-purple-300 rounded-xl font-mono text-base font-black text-purple-950 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-purple-600">
                        Kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Rate per Kg (₹ / Kg) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 100"
                        value={billForm.pricePerKg}
                        onChange={(e) => setBillForm({ ...billForm, pricePerKg: Number(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border-2 border-purple-300 rounded-xl font-mono text-base font-black text-purple-950 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-purple-600">
                        /Kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Weight Preset Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                    ⚡ 1-Click Weight Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_WEIGHTS.map(wt => (
                      <button
                        key={wt}
                        type="button"
                        onClick={() => setBillForm({ ...billForm, weightKg: String(wt) })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                          Number(billForm.weightKg) === wt
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200'
                        }`}
                      >
                        {wt.toFixed(1)} Kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Services & Clothes Breakdown for Weighed Laundry */}
                <div className="pt-3 border-t border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-900 block">
                      👔 Select Clothes / Sub-Services Breakdown:
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold">
                      Click to tally pieces & auto-estimate weight
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                    {WEIGHED_LAUNDRY_ITEMS.map((item) => {
                      const existing = billForm.items.find(it => it.name === item.name);
                      const isAdded = !!existing;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddWeighedClothesItem(item)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isAdded
                              ? 'bg-purple-100 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-400 shadow-2xs'
                              : 'bg-white hover:bg-purple-50 border-purple-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{item.emoji}</span>
                            {isAdded && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-700 text-white text-[10px] font-black font-mono">
                                ×{existing.quantity}
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <div className="text-[11px] font-bold leading-tight truncate">{item.name}</div>
                            <div className="text-[9px] text-purple-700 truncate">{item.category} • ~{item.weightKg}kg</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add-on Treatments for Weighed Laundry */}
                <div className="pt-3 border-t border-purple-200 space-y-2">
                  <span className="text-[11px] font-bold text-purple-900 block">
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
                              ? 'bg-purple-100 border-purple-400 text-purple-950 font-bold ring-1 ring-purple-400'
                              : 'bg-white hover:bg-purple-50 border-purple-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{addon.emoji}</span>
                            <span className="font-mono font-bold text-purple-700">+₹{addon.price}</span>
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
                    Invoice Items ({billForm.items.length}{isWeighedService && billForm.weightKg ? ' + Weighed Batch' : ''})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillForm({ ...billForm, items: [], weightKg: '' })}
                  disabled={billForm.items.length === 0 && !billForm.weightKg}
                  className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                
                {/* Weighed Batch Line (if Per Kg) */}
                {isWeighedService && (Number(billForm.weightKg) > 0 || billForm.items.length > 0) && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-purple-950 flex items-center gap-1.5 truncate">
                        <span>{billForm.serviceEmoji}</span>
                        <span className="truncate">{billForm.serviceName} (Weighed Batch)</span>
                      </div>
                      <div className="font-mono font-black text-purple-950 text-xs shrink-0 text-right">
                        ₹{Math.round((Number(billForm.weightKg) || 0) * (Number(billForm.pricePerKg) || 100))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-purple-800 bg-white/80 p-1.5 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Weight:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={billForm.weightKg}
                          onChange={(e) => setBillForm({ ...billForm, weightKg: e.target.value })}
                          placeholder="0.0"
                          className="w-14 px-1 py-0.5 bg-purple-50 border border-purple-300 rounded font-mono font-bold text-purple-900 text-center outline-none focus:bg-white"
                          title="Edit Weight in Kg"
                        />
                        <span>Kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Rate: ₹</span>
                        <input
                          type="number"
                          min="0"
                          value={billForm.pricePerKg}
                          onChange={(e) => setBillForm({ ...billForm, pricePerKg: Number(e.target.value) || 0 })}
                          className="w-14 px-1 py-0.5 bg-purple-50 border border-purple-300 rounded font-mono font-bold text-purple-900 text-center outline-none focus:bg-white"
                          title="Edit Rate per Kg"
                        />
                        <span>/Kg</span>
                      </div>
                    </div>
                  </div>
                )}

                {billForm.items.length === 0 && (!isWeighedService || !billForm.weightKg) ? (
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
