import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { terminalAuthService, DEFAULT_BILLING_TERMINALS } from '../../services/terminalAuthService';
import { orderService } from '../../services/orderService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { auditService } from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
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
  Laptop
} from 'lucide-react';

const INITIAL_BILL_STATE = {
  customerName: '',
  phone: '',
  email: '',
  notes: '',
  serviceId: 'srv-dry-cleaning',
  serviceName: 'Premium Dry Cleaning',
  serviceEmoji: '👔',
  pricingType: 'per_item', // 'per_item' | 'per_kg'
  weightKg: '',
  pricePerKg: 79,
  items: [],
  discountAmount: 0,
  discountCode: '',
  expressOption: 'STANDARD', // 'STANDARD' | 'EXPRESS_24H'
  paymentMethod: 'CASH', // 'CASH' | 'UPI_QR' | 'CARD' | 'PAY_ON_DELIVERY'
  paymentStatus: 'PAID', // 'PAID' | 'PARTIAL' | 'UNPAID'
  autoOpenReceipt: true,
  autoSendWhatsApp: true,
};

export const BillingMachinePage = () => {
  const { terminalId } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const activeTerminalId = terminalAuthService.normalizeTerminalId(terminalId);

  // Terminal & Auth State
  const [terminal, setTerminal] = useState(null);
  const [session, setSession] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Bill Form State
  const [billForm, setBillForm] = useState(INITIAL_BILL_STATE);
  const [itemCategory, setItemCategory] = useState('ALL');
  const [itemSearch, setItemSearch] = useState('');
  
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

  // Shift Stats
  const [shiftCount, setShiftCount] = useState(0);
  const [shiftTotal, setShiftTotal] = useState(0);

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
    e.preventDefault();
    if (!loginPassword.trim()) {
      error('PIN Required', 'Please enter the counter security password / PIN.');
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

  // Handle Terminal Sign-out
  const handleTerminalLogout = () => {
    terminalAuthService.logoutTerminal(activeTerminalId);
    setSession(null);
    info('Counter Locked', `Signed out of ${terminal?.name || 'Counter'}`);
  };

  // Filter Catalog Items
  const filteredCatalogItems = useMemo(() => {
    return MASTER_CATALOG_ITEMS.filter((item) => {
      const matchesCat = itemCategory === 'ALL' || item.categoryKey === itemCategory;
      const matchesSearch = !itemSearch || 
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(itemSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [itemCategory, itemSearch]);

  // Service Selector Change
  const handleSelectService = (srv) => {
    setBillForm(prev => ({
      ...prev,
      serviceId: srv.id,
      serviceName: srv.name,
      serviceEmoji: srv.emoji,
      pricingType: srv.perKg ? 'per_kg' : prev.pricingType,
      pricePerKg: srv.perKg ? srv.defaultPrice : prev.pricePerKg
    }));
  };

  // Add Item From Catalog
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
            emoji: item.emoji,
            category: item.categoryName,
            unitPrice: item.price,
            quantity: 1,
            lineTotal: item.price
          }
        ]
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

  // Live Unit Price Edit: Cashier can increase or decrease price directly
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

  // Financial Calculations
  const subtotal = useMemo(() => {
    if (billForm.pricingType === 'per_kg') {
      const wt = Number(billForm.weightKg) || 0;
      return Math.round(wt * billForm.pricePerKg);
    }
    return billForm.items.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  }, [billForm.pricingType, billForm.weightKg, billForm.pricePerKg, billForm.items]);

  const expressFee = billForm.expressOption === 'EXPRESS_24H' ? 100 : 0;
  const discountAmount = Number(billForm.discountAmount) || 0;
  const finalGrandTotal = Math.max(0, subtotal + expressFee - discountAmount);

  // Submit and Create In-Store POS Bill
  const handleCreatePOSOrder = async (e) => {
    e.preventDefault();
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
      error('Weight Required', 'Please enter the weighed laundry weight in Kg.');
      return;
    }

    setIsCreatingBill(true);
    try {
      const totalGrams = billForm.items.reduce((acc, it) => acc + (it.quantity * 350), 0);
      const estWeight = billForm.pricingType === 'per_kg' ? Number(billForm.weightKg) : (totalGrams > 0 ? (totalGrams / 1000) : null);

      const orderPayload = {
        isWalkIn: true,
        terminalId: terminal?.id || activeTerminalId,
        terminalCode: terminal?.code || 'TW-POS',
        storeBranch: terminal?.locationName || 'Tech Wash Store Counter',
        cashierName: terminal?.assignedOperator || 'Counter Cashier',
        customer: {
          name: billForm.customerName.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          email: billForm.email.trim(),
          address: `In-Store Walk-in Drop (${terminal?.name || 'Counter'})`,
          city: 'Hyderabad',
        },
        customerName: billForm.customerName.trim(),
        phone: cleanPhone,
        whatsapp: cleanPhone,
        address: `In-Store Walk-in Drop (${terminal?.name || 'Counter'})`,
        serviceId: billForm.serviceId,
        serviceName: billForm.serviceName,
        serviceEmoji: billForm.serviceEmoji,
        pricingType: billForm.pricingType,
        items: billForm.items.map(it => ({
          name: it.name,
          emoji: it.emoji || '👔',
          category: it.category || 'General',
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity),
          lineTotal: Number(it.unitPrice) * Number(it.quantity),
        })),
        estimatedWeightKg: estWeight,
        actualWeight: estWeight,
        priceSnapshot: {
          itemsSubtotal: subtotal,
          deliveryFee: 0,
          expressFee,
          discountAmount,
          taxes: 0,
          finalTotal: finalGrandTotal,
          isExpress: billForm.expressOption !== 'STANDARD',
        },
        totalAmount: finalGrandTotal,
        finalPrice: finalGrandTotal,
        paymentStatus: billForm.paymentStatus,
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
      setShiftCount(prev => prev + 1);
      setShiftTotal(prev => prev + finalGrandTotal);

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

      // Reset form but retain customer phone prompt readiness
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
          <div className="w-full max-w-md space-y-6">
            
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

            {/* Login Box */}
            <form onSubmit={handleTerminalLogin} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-5">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Terminal Code:</span>
                  <span className="font-mono font-bold text-orange-400">{terminal?.code || 'TW-POS'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Assigned Cashier:</span>
                  <span className="font-semibold text-slate-200">{terminal?.assignedOperator || 'Cashier'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enter Counter PIN / Security Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter assigned password (e.g. techwash1)"
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
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verifying Security PIN...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Unlock & Start POS Session</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500">
                <span>Admin can reset or assign counter passwords in </span>
                <Link to="/admin/staff" className="text-orange-400 hover:underline font-semibold">
                  Admin Panel
                </Link>
              </div>
            </form>

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

      <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
        
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
                    Online
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
                  <span className="text-slate-400 block text-[10px]">Today's Shift Bills</span>
                  <span className="font-bold text-white font-mono">{shiftCount} Invoices</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Shift Total</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{shiftTotal}</span>
                </div>
              </div>

              <Link
                to="/billing"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
                title="Switch to Counter 1, 2, or 3"
              >
                <span>Switch Counter</span>
              </Link>

              <button
                type="button"
                onClick={() => setBillForm(INITIAL_BILL_STATE)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition flex items-center gap-1 cursor-pointer"
                title="Clear current inputs for next customer"
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
              LEFT / CENTER AREA (COL 1-7): CUSTOMER & ITEM SELECTION
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. CUSTOMER INFORMATION CARD */}
            <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-[#EA580C]" />
                <span>Customer Details & Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            {/* 2. CORE SERVICE SELECTOR CHIPS */}
            <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-[#EA580C]" />
                  <span>Select Core Service</span>
                </div>
                <span className="text-xs font-bold text-[#EA580C]">
                  Active: {billForm.serviceEmoji} {billForm.serviceName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {WALK_IN_SERVICES.map((srv) => {
                  const isSelected = billForm.serviceId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectService(srv)}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-lg">{srv.emoji}</div>
                      <div className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2">
                        {srv.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {srv.perKg ? `₹${srv.defaultPrice}/Kg` : `From ₹${srv.defaultPrice}`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pricing Mode Toggle: Per Item vs Per Kg */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs">Billing Mode:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBillForm({ ...billForm, pricingType: 'per_item' })}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                        billForm.pricingType === 'per_item'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👔 Itemized Garments
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillForm({ ...billForm, pricingType: 'per_kg' })}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                        billForm.pricingType === 'per_kg'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ⚖️ Weighed Laundry (Per Kg)
                    </button>
                  </div>
                </div>

                {billForm.pricingType === 'per_kg' && (
                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 text-xs">
                    <span className="font-bold text-purple-900">Total Weighed Weight:</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight"
                      value={billForm.weightKg}
                      onChange={(e) => setBillForm({ ...billForm, weightKg: e.target.value })}
                      className="w-20 px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-950 outline-none"
                    />
                    <span className="font-bold text-purple-700">Kg @ ₹{billForm.pricePerKg}/Kg</span>
                  </div>
                )}
              </div>
            </section>

            {/* 3. MASTER CATALOG CATEGORY FILTER & SEARCH BAR */}
            <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase tracking-wider text-xs">
                  <Tag className="w-4 h-4 text-[#EA580C]" />
                  <span>Garment Master Catalog ({MASTER_CATALOG_ITEMS.length} Items)</span>
                </div>
                <span className="text-[11px] text-slate-400">Click item to add directly to invoice</span>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {POS_CATEGORIES.map((cat) => {
                  const isActive = itemCategory === cat.key;
                  const count = cat.key === 'ALL' 
                    ? MASTER_CATALOG_ITEMS.length 
                    : MASTER_CATALOG_ITEMS.filter(it => it.categoryKey === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setItemCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="🔍 Search across garments (e.g. Saree, Shirt, Blazer, Kurta, Bedsheet, Sneaker, Zari)..."
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

              {/* Item Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredCatalogItems.map((item) => {
                  const existing = billForm.items.find(it => it.name === item.name);
                  const isAdded = !!existing;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddCatalogItem(item)}
                      className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between gap-1 cursor-pointer active:scale-95 ${
                        isAdded
                          ? 'bg-orange-50/90 border-orange-300 ring-1 ring-orange-400/30'
                          : 'bg-slate-50 hover:bg-orange-50/50 border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-base">{item.emoji}</span>
                        {isAdded && (
                          <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-white text-[9px] font-black font-mono">
                            ×{existing.quantity}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-[11px] truncate group-hover:text-orange-950" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.categoryName}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-0.5">
                        <span className="font-mono font-bold text-orange-600 text-xs">
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

            {/* 4. MANUAL CUSTOM BILLING & EXTRA CHARGES */}
            <section className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-2 border-orange-500/30 shadow-xs space-y-3">
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
                      Enter any custom item, stain treatment, alteration, zari polish or custom rate.
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white border border-orange-300 text-[10px] font-bold text-orange-600">
                  ⚡ Live Total Calc
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Custom Item Description *
                  </label>
                  <Input
                    placeholder="e.g. Heavy Wine Stain Removal, Silk Zari Polish, Urgent Delivery"
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
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT AREA (COL 8-12): LIVE BILL, EDITABLE PRICES & TOTAL
             ══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* INVOICE LINE ITEMS & CART */}
            <div className="p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-4 sticky top-18">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                    Invoice Items ({billForm.items.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillForm({ ...billForm, items: [] })}
                  disabled={billForm.items.length === 0}
                  className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {billForm.items.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-1">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No Items Added Yet</p>
                    <p className="text-[11px]">Click items from the catalog or add a custom service to start billing.</p>
                  </div>
                ) : (
                  billForm.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          <span>{it.emoji}</span>
                          <span className="truncate" title={it.name}>{it.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {it.category}
                        </div>
                      </div>

                      {/* Live Editable Unit Price */}
                      <div className="flex items-center gap-1 shrink-0" title="Click to adjust price for this item">
                        <span className="text-[10px] font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleUpdateItemUnitPrice(idx, e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-slate-900 text-right outline-none focus:border-orange-500"
                        />
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-900 text-xs">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(idx, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="font-mono font-bold text-slate-900 text-xs shrink-0 w-16 text-right">
                        ₹{it.lineTotal}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* ── BILL SUMMARY CALCULATOR ── */}
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

                {/* Walk-in Discount */}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Discount / Coupon:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">-₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={billForm.discountAmount || ''}
                      onChange={(e) => setBillForm({ ...billForm, discountAmount: e.target.value })}
                      className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-emerald-700 text-right outline-none"
                    />
                  </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200 text-slate-900">
                  <div>
                    <span className="font-black text-sm uppercase tracking-wider block">Grand Total</span>
                    <span className="text-[10px] text-slate-500">GST Compliant Official Rate</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-orange-600">
                      ₹{finalGrandTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── PAYMENT OPTIONS ── */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Collection Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  {[
                    { key: 'CASH', label: '💵 Cash', badge: 'Counter' },
                    { key: 'UPI_QR', label: '📱 UPI QR', badge: 'Instant' },
                    { key: 'CARD', label: '💳 Card/POS', badge: 'Swipe' },
                    { key: 'PAY_ON_DELIVERY', label: '📦 Pay Later', badge: 'On Delivery' },
                  ].map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setBillForm({ ...billForm, paymentMethod: m.key })}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        billForm.paymentMethod === m.key
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs">{m.label}</div>
                    </button>
                  ))}
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

              {/* ── ACTION BUTTONS: PRINT & WHATSAPP ── */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isCreatingBill}
                  onClick={handleCreatePOSOrder}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingBill ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generating Tax Invoice...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>🧾 Save & Generate 1-Page Tax Invoice (₹{finalGrandTotal})</span>
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
                    <span>📲 Dispatch WhatsApp Invoice</span>
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
    </>
  );
};

export default BillingMachinePage;
