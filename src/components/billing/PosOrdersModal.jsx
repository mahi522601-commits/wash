import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  orderService, 
  getOrderBranchKey,
  ORDER_CUSTOMER_STAGES,
  normalizeDateString
} from '../../services/orderService';
import { auditService } from '../../services/auditService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { StatusBadge } from '../admin/StatusBadge';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { 
  ShoppingBag, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  RefreshCw, 
  X, 
  Check, 
  Send, 
  ChevronRight, 
  Tag, 
  Trash2, 
  AlertCircle,
  LayoutList,
  LayoutGrid,
  Calendar,
  DollarSign,
  Wallet,
  Edit3,
  Zap,
  Sliders
} from 'lucide-react';

export const PosOrdersModal = ({
  isOpen,
  onClose,
  terminal = null,
  activeTerminalId = 'counter-1'
}) => {
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [branchFilter, setBranchFilter] = useState('LOCAL'); // 'LOCAL' | 'ALL'
  const [stageFilter, setStageFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards'

  // Selected Order for Receipt / Quick Action
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Quick Inline Balance Collect Modal
  const [collectOrder, setCollectOrder] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isCollecting, setIsCollecting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ limitCount: 1000 });
      setOrders(data || []);
    } catch (err) {
      console.warn('Failed to load POS orders:', err);
      error('Load Error', 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (isOpen) {
      loadOrders();

      const unsub = orderService.subscribeToNewOrders(() => {
        loadOrders();
      });

      const handleEvent = () => loadOrders();
      window.addEventListener('techwash-new-order-placed', handleEvent);
      window.addEventListener('techwash-order-updated', handleEvent);
      window.addEventListener('techwash-orders-updated', handleEvent);
      window.addEventListener('techwash-order-payment-updated', handleEvent);

      return () => {
        if (typeof unsub === 'function') unsub();
        window.removeEventListener('techwash-new-order-placed', handleEvent);
        window.removeEventListener('techwash-order-updated', handleEvent);
        window.removeEventListener('techwash-orders-updated', handleEvent);
        window.removeEventListener('techwash-order-payment-updated', handleEvent);
      };
    }
  }, [isOpen, loadOrders]);

  // Branch filter using standardized getOrderBranchKey
  const branchFilteredOrders = useMemo(() => {
    if (branchFilter === 'ALL' || !activeTerminalId || activeTerminalId === 'ALL') return orders;
    return orders.filter(o => getOrderBranchKey(o) === activeTerminalId);
  }, [orders, branchFilter, activeTerminalId]);

  // Stage Categories
  const stageGroups = useMemo(() => {
    const counts = {
      ALL: branchFilteredOrders.length,
      INTAKE: 0,
      PROCESSING: 0,
      READY: 0,
      OUT: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      UNPAID: 0
    };

    branchFilteredOrders.forEach(o => {
      const stage = o.customerStage || o.status || 'INSPECTION';
      if (stage === 'DELIVERED') counts.DELIVERED++;
      else if (stage === 'CANCELLED') counts.CANCELLED++;
      else if (stage === 'OUT_FOR_DELIVERY') counts.OUT++;
      else if (stage === 'READY_FOR_DELIVERY') counts.READY++;
      else if (['PROCESSING', 'WASHING', 'IRONING', 'IN_PROGRESS'].includes(stage)) counts.PROCESSING++;
      else counts.INTAKE++;

      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));
      if (balance > 0 && stage !== 'CANCELLED') counts.UNPAID++;
    });

    return counts;
  }, [branchFilteredOrders]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return branchFilteredOrders.filter(o => {
      const stage = o.customerStage || o.status || 'INSPECTION';
      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));

      // Stage Filter
      if (stageFilter !== 'ALL') {
        if (stageFilter === 'INTAKE' && !['CONFIRMED', 'PICKUP_SCHEDULED', 'RECEIVED_AT_HUB', 'INSPECTION'].includes(stage)) return false;
        if (stageFilter === 'PROCESSING' && !['PROCESSING', 'WASHING', 'IRONING', 'IN_PROGRESS'].includes(stage)) return false;
        if (stageFilter === 'READY' && stage !== 'READY_FOR_DELIVERY') return false;
        if (stageFilter === 'OUT' && stage !== 'OUT_FOR_DELIVERY') return false;
        if (stageFilter === 'DELIVERED' && stage !== 'DELIVERED') return false;
        if (stageFilter === 'CANCELLED' && stage !== 'CANCELLED') return false;
      }

      // Payment Filter
      if (paymentFilter === 'UNPAID' && balance <= 0) return false;
      if (paymentFilter === 'PAID' && balance > 0) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (o.customerName || o.customer?.name || '').toLowerCase();
        const phone = (o.phone || o.customer?.phone || o.whatsapp || '').toLowerCase();
        const num = (o.orderNumber || o.id || '').toLowerCase();
        const slip = (o.manualBillNumber || '').toLowerCase();
        const addr = (o.address || o.customer?.address || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || num.includes(q) || slip.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [branchFilteredOrders, stageFilter, paymentFilter, searchQuery]);

  // Status Management Modal State
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedStage, setSelectedStage] = useState('CONFIRMED');
  const [statusNote, setStatusNote] = useState('');
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState(true);
  const [openPdfAfterUpdate, setOpenPdfAfterUpdate] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick Open Status Management Dialog
  const handleOpenStatusModal = (order) => {
    setStatusModalOrder(order);
    setSelectedStage(order.customerStage || order.status || 'CONFIRMED');
    setStatusNote('');
    setSendWhatsAppAlert(true);
    setOpenPdfAfterUpdate(false);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!statusModalOrder) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await orderService.updateOrderStatus(statusModalOrder.id, {
        customerStage: selectedStage,
        status: selectedStage,
        note: statusNote || `Status updated to ${selectedStage} by POS Cashier`,
      });

      success('Status Updated', `Order #${statusModalOrder.orderNumber || statusModalOrder.id} is now ${selectedStage}.`);

      const finishedOrder = { ...statusModalOrder, ...updated, customerStage: selectedStage, status: selectedStage };

      // Send WhatsApp update if toggled
      if (sendWhatsAppAlert) {
        const phone = finishedOrder.phone || finishedOrder.customer?.phone || finishedOrder.whatsapp;
        if (phone) {
          const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === selectedStage) || { label: selectedStage };
          const msg = whatsappNotificationService.buildStatusUpdateMessage(finishedOrder, stageConfig.label, statusNote);
          whatsappNotificationService.openWhatsAppManual(phone, msg);
        }
      }

      // Open PDF receipt if toggled
      if (openPdfAfterUpdate) {
        setReceiptOrder(finishedOrder);
      }

      setStatusModalOrder(null);
      await loadOrders();
    } catch (err) {
      error('Status Update Failed', err.message || 'Could not update order status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick Stage Update
  const handleUpdateStage = async (order, targetStage) => {
    setActionLoadingId(order.id);
    try {
      const updated = await orderService.updateOrderStatus(order.id, targetStage, `Stage updated to ${targetStage} by POS Cashier`);
      success('Stage Updated', `Order #${order.orderNumber || order.id} moved to ${targetStage}.`);
      await loadOrders();
    } catch (err) {
      error('Update Failed', err.message || 'Could not update stage.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Collect Due Payment
  const handleOpenCollect = (order) => {
    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));

    setCollectOrder(order);
    setCollectAmount(String(balance));
    setPaymentMethod('CASH');
  };

  const handleSaveCollection = async (e) => {
    if (e) e.preventDefault();
    if (!collectOrder) return;

    const amountNum = Number(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const total = Number(collectOrder.totalAmount || collectOrder.finalPrice || collectOrder.priceSnapshot?.finalTotal || 0);
    const prevReceived = Number(collectOrder.receivedAmount !== undefined ? collectOrder.receivedAmount : 0);
    const newTotalReceived = Math.min(total, prevReceived + amountNum);
    const newBalance = Math.max(0, total - newTotalReceived);
    const isCash = paymentMethod === 'CASH';
    const markAsDelivered = isCash || newBalance === 0;

    setIsCollecting(true);
    try {
      const updated = await orderService.updateOrderPayment(collectOrder.id, {
        receivedAmount: newTotalReceived,
        paymentMethod,
        paymentStatus: newBalance === 0 ? 'PAID' : 'PARTIAL',
        markDelivered: markAsDelivered,
        note: `POS Counter collected ₹${amountNum} (${paymentMethod}) — Status: PAID & DELIVERED`,
      });

      if (markAsDelivered) {
        await orderService.updateOrderStatus(
          collectOrder.id,
          'DELIVERED',
          `Payment of ₹${amountNum} (${paymentMethod}) collected at POS counter — Status updated to PAID & DELIVERED`
        );
      }

      window.dispatchEvent(new CustomEvent('techwash-order-payment-updated', { detail: { orderId: collectOrder.id, amount: amountNum } }));
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { detail: { orderId: collectOrder.id, status: 'DELIVERED', customerStage: 'DELIVERED' } }));

      success('Payment Recorded & Delivered!', `Order #${collectOrder.orderNumber || collectOrder.id} marked as PAID & DELIVERED.`);
      
      const finished = { ...collectOrder, ...updated, receivedAmount: newTotalReceived, balanceAmount: newBalance, customerStage: 'DELIVERED', status: 'DELIVERED' };
      setCollectOrder(null);
      await loadOrders();
      setReceiptOrder(finished);
    } catch (err) {
      error('Collection Error', err.message || 'Failed to record payment.');
    } finally {
      setIsCollecting(false);
    }
  };

  // WhatsApp Status Alert
  const handleSendWhatsAppUpdate = (order) => {
    const phone = order.phone || order.customer?.phone || order.whatsapp;
    if (!phone) {
      error('No Phone Number', 'Customer phone number is missing.');
      return;
    }
    const currentStage = order.customerStage || order.status || 'PROCESSING';
    const msg = whatsappNotificationService.buildCustomerUpdateMessage(order, currentStage);
    whatsappNotificationService.openWhatsAppManual(phone, msg);
    success('WhatsApp Opened', `Order update prepared for ${order.customerName || 'Customer'}.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in no-print">
      <div 
        className="w-full max-w-6xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* ── TOP HEADER ── */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Order Management
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  POS Counter Console
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {terminal?.name || 'Counter Machine'} • {terminal?.locationName || 'Main Branch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: List vs Cards */}
            <div className="inline-flex rounded-xl bg-slate-800/90 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table / List View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── STAGE FILTER TABS ── */}
        <div className="p-3 sm:px-5 sm:py-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          
          <button
            type="button"
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>All Orders</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              stageFilter === 'ALL' ? 'bg-white text-indigo-950' : 'bg-slate-700 text-slate-300'
            }`}>
              {stageGroups.ALL}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('INTAKE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'INTAKE'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>🧺 Intake & Inspection</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
              {stageGroups.INTAKE}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('PROCESSING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'PROCESSING'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>⚡ Processing / Wash</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
              {stageGroups.PROCESSING}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'READY'
                ? 'bg-teal-500 text-slate-950 shadow-md ring-2 ring-teal-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>✨ Ready for Delivery</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300">
              {stageGroups.READY}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('OUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'OUT'
                ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>🚚 Out for Delivery</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
              {stageGroups.OUT}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              stageFilter === 'DELIVERED'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>✅ Delivered</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
              {stageGroups.DELIVERED}
            </span>
          </button>

          {stageGroups.CANCELLED > 0 && (
            <button
              type="button"
              onClick={() => setStageFilter('CANCELLED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                stageFilter === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40'
                  : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
              }`}
            >
              <span>❌ Cancelled</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-200">
                {stageGroups.CANCELLED}
              </span>
            </button>
          )}
        </div>

        {/* ── SEARCH & SUB-FILTERS BAR ── */}
        <div className="p-3 sm:px-5 sm:py-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Branch Selector */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setBranchFilter('LOCAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  branchFilter === 'LOCAL' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                This Branch ({terminal?.code || 'Local'})
              </button>
              <button
                type="button"
                onClick={() => setBranchFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  branchFilter === 'ALL' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Stores
              </button>
            </div>

            {/* Payment Filter */}
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  paymentFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Payments
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('UNPAID')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                  paymentFilter === 'UNPAID' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <span>⚠️ Balance Due</span>
                <span className="font-mono text-[10px]">({stageGroups.UNPAID})</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PAID')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  paymentFilter === 'PAID' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* ── ORDER LISTING ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading store orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-14 px-4 text-center text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800 max-w-md mx-auto my-6 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-sm text-white">No matching orders found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                No orders match your active search or stage filter.
              </p>
              <button
                type="button"
                onClick={() => { setStageFilter('ALL'); setPaymentFilter('ALL'); setSearchQuery(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* ── TABLE VIEW ── */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">Order / Bill</th>
                    <th className="py-3 px-3 whitespace-nowrap">Customer</th>
                    <th className="py-3 px-3 whitespace-nowrap">Service & Items</th>
                    <th className="py-3 px-3 whitespace-nowrap">Scheduled Delivery</th>
                    <th className="py-3 px-3 whitespace-nowrap">Stage</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Payment</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.map((order) => {
                    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
                    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));
                    const currentStage = order.customerStage || order.status || 'INSPECTION';
                    const scheduledDate = order.deliveryDate || order.schedule?.deliveryDate || order.pickupDate;

                    return (
                      <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                        {/* Order / Bill */}
                        <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                          <div className="font-mono font-black text-xs text-white">
                            #{order.orderNumber || order.id?.substring(0, 8)}
                          </div>
                          {order.manualBillNumber && (
                            <div className="text-[10px] text-amber-300 font-mono font-bold">
                              Slip: {order.manualBillNumber}
                            </div>
                          )}
                          {order.terminalCode && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 text-[9px] font-bold">
                              {order.terminalCode}
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3 align-middle">
                          <div className="font-bold text-white text-xs truncate max-w-[170px]">
                            {order.customerName || order.customer?.name || 'Customer'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {order.phone || order.customer?.phone || order.whatsapp || 'No Phone'}
                          </div>
                          {order.address && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[170px] flex items-center gap-0.5" title={order.address}>
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{order.address}</span>
                            </div>
                          )}
                        </td>

                        {/* Service & Items */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1 text-slate-200 font-semibold truncate max-w-[150px]">
                            <span>{order.serviceEmoji || '🧺'}</span>
                            <span className="truncate">{order.service || order.serviceName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                          </div>
                        </td>

                        {/* Delivery */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-xs text-slate-300">
                          {scheduledDate ? formatDate(scheduledDate) : '—'}
                        </td>

                        {/* Stage */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            className="group flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800/80 transition cursor-pointer text-left"
                            title="Click to change order status"
                          >
                            <StatusBadge status={currentStage} />
                            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
                          </button>
                        </td>

                        {/* Payment */}
                        <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-mono">
                          <div className="text-slate-300 font-bold">₹{total}</div>
                          <div className={`text-[10px] font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {balance > 0 ? `₹${balance} Due` : '✅ Paid'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 align-middle text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Update Status Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(order)}
                              className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Update Status / Milestone"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Status</span>
                            </button>
                            
                            {/* Collect Balance if Unpaid */}
                            {balance > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenCollect(order)}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Collect Balance Cash / UPI"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Collect</span>
                              </button>
                            )}

                            {/* Mark Delivered if Ready / Out */}
                            {['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(currentStage) && (
                              <button
                                type="button"
                                disabled={actionLoadingId === order.id}
                                onClick={() => handleUpdateStage(order, 'DELIVERED')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Mark as Delivered"
                              >
                                <Check className="w-3 h-3" />
                                <span>Delivered</span>
                              </button>
                            )}

                            {/* Print Bill / Receipt */}
                            <button
                              type="button"
                              onClick={() => setReceiptOrder(order)}
                              className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 transition cursor-pointer"
                              title="Print Tax Invoice / Bill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Send WhatsApp Status */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppUpdate(order)}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition cursor-pointer"
                              title="Send WhatsApp Update"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Call */}
                            {order.phone && (
                              <a
                                href={`tel:${order.phone}`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Call Customer"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── CARDS VIEW ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredOrders.map((order) => {
                const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
                const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));
                const currentStage = order.customerStage || order.status || 'INSPECTION';

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs text-white">
                              #{order.orderNumber || order.id?.substring(0, 8)}
                            </span>
                            {order.manualBillNumber && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                                Slip: {order.manualBillNumber}
                              </span>
                            )}
                            {order.terminalCode && (
                              <span className="px-1.5 py-0.2 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                                {order.terminalCode}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-200 text-sm mt-0.5">
                            {order.customerName || order.customer?.name || 'Customer'}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(order)}
                          className="group flex items-center gap-1 p-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                          title="Click to change order status"
                        >
                          <StatusBadge status={currentStage} />
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
                        </button>
                      </div>

                      {/* Items & Financials */}
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[180px]">
                            <span>{order.serviceEmoji || '🧺'}</span>
                            <span className="truncate">{order.service || order.serviceName}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {order.address && (
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1" title={order.address}>
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{order.address}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 font-mono text-xs">
                          <span className="text-slate-400">Total: <strong className="text-white">₹{total}</strong></span>
                          <span className={`font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {balance > 0 ? `₹${balance} Due` : '✅ Paid'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      {/* Update Status Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(order)}
                        className="p-1.5 px-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Update Status / Milestone"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Status</span>
                      </button>

                      {balance > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenCollect(order)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Collect ₹{balance}</span>
                        </button>
                      )}

                      {['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(currentStage) && (
                        <button
                          type="button"
                          disabled={actionLoadingId === order.id}
                          onClick={() => handleUpdateStage(order, 'DELIVERED')}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="p-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Bill</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppUpdate(order)}
                        className="p-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition cursor-pointer"
                        title="Send WhatsApp Update"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── INLINE QUICK COLLECT DIALOG ── */}
        {collectOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Collect Balance Cash</h3>
                    <p className="text-xs text-slate-400">Order #{collectOrder.orderNumber || collectOrder.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCollectOrder(null)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCollection} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Amount to Collect (₹) *</label>
                  <input
                    type="number"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI_QR')}
                      className={`py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentMethod === 'UPI_QR'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      📱 UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      💳 Card
                    </button>
                  </div>
                </div>

                {/* Auto Delivery Notice */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {paymentMethod === 'CASH'
                      ? 'Collecting due cash will automatically update order to PAID and DELIVERED.'
                      : 'Clearing this balance will mark order as PAID and DELIVERED.'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCollectOrder(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCollecting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCollecting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Collect & Deliver</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MANAGE / UPDATE ORDER STATUS MODAL ── */}
        {statusModalOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Update Order Status</h3>
                    <p className="text-xs text-slate-400">
                      Order #{statusModalOrder.orderNumber || statusModalOrder.id} • {statusModalOrder.customerName || 'Customer'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Status & Balance Preview */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Current Stage</span>
                  <div className="mt-1">
                    <StatusBadge status={statusModalOrder.customerStage || statusModalOrder.status || 'CONFIRMED'} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Bill Balance</span>
                  <span className={`font-mono font-bold ${(statusModalOrder.balanceAmount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(statusModalOrder.balanceAmount || 0) > 0 ? `₹${statusModalOrder.balanceAmount} Due` : '✅ Paid'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmStatusChange} className="space-y-4">
                {/* Select New Stage Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Select New Milestone Stage:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORDER_CUSTOMER_STAGES.map((st) => {
                      const isSelected = selectedStage === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setSelectedStage(st.key)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            st.key === 'DELIVERED' ? 'bg-emerald-400' :
                            st.key === 'OUT_FOR_DELIVERY' ? 'bg-amber-400' :
                            st.key === 'READY_FOR_DELIVERY' ? 'bg-cyan-400' :
                            st.key === 'CANCELLED' ? 'bg-rose-400' : 'bg-indigo-400'
                          }`} />
                          <span className="truncate">{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Update Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Update Note / Internal Remark (Optional):
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Garments cleaned, pressed and packed at counter"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Action Options Toggles */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs cursor-pointer hover:bg-slate-950">
                    <input
                      type="checkbox"
                      checked={sendWhatsAppAlert}
                      onChange={(e) => setSendWhatsAppAlert(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200">
                      📲 <strong>Send WhatsApp Alert to Customer</strong> with live tracking link
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs cursor-pointer hover:bg-slate-950">
                    <input
                      type="checkbox"
                      checked={openPdfAfterUpdate}
                      onChange={(e) => setOpenPdfAfterUpdate(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <span className="text-slate-200">
                      🧾 <strong>Open Official Tax Invoice / Receipt PDF</strong> upon saving
                    </span>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatusModalOrder(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm & Update Status</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── PRINT RECEIPT MODAL ── */}
        {receiptOrder && (
          <ReceiptModal
            isOpen={Boolean(receiptOrder)}
            order={receiptOrder}
            onClose={() => setReceiptOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PosOrdersModal;
