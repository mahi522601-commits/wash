import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { orderService, getOrderBranchKey, ORDER_CUSTOMER_STAGES } from '../../services/orderService';
import { auditService } from '../../services/auditService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../admin/StatusBadge';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { 
  Wallet, 
  Search, 
  Printer, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  RefreshCw, 
  X,
  Store,
  ChevronRight,
  ArrowRight,
  Check,
  Zap,
  Edit3
} from 'lucide-react';

export const PosBalanceDueModal = ({
  isOpen,
  onClose,
  terminal = null,
  activeTerminalId = 'counter-1'
}) => {
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('LOCAL'); // 'LOCAL' | 'ALL'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PARTIAL' | 'UNPAID'

  // Payment Collection Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'UPI_QR' | 'CARD'
  const [collectNote, setCollectNote] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Status Management Modal State in Balances
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedStage, setSelectedStage] = useState('DELIVERED');
  const [statusNote, setStatusNote] = useState('');
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState(true);
  const [openPdfAfterUpdate, setOpenPdfAfterUpdate] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Active Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ limitCount: 500 });
      setOrders(data || []);
    } catch (err) {
      console.warn('Failed to load orders for balance tracking:', err);
      error('Load Error', 'Failed to load balance dues.');
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

  // Branch filter using official getOrderBranchKey
  const branchFilteredOrders = useMemo(() => {
    if (branchFilter === 'ALL' || !activeTerminalId || activeTerminalId === 'ALL') return orders;
    return orders.filter(o => getOrderBranchKey(o) === activeTerminalId);
  }, [orders, branchFilter, activeTerminalId]);

  // Filter orders that have pending balance due (> 0)
  const dueOrders = useMemo(() => {
    return branchFilteredOrders.filter((o) => {
      if (!o || o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;

      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));

      const hasBalance = balance > 0 || (o.paymentStatus !== 'PAID' && total > 0);
      if (!hasBalance) return false;

      // Status filter
      if (statusFilter === 'PARTIAL' && received === 0) return false;
      if (statusFilter === 'UNPAID' && received > 0) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (o.customerName || o.customer?.name || '').toLowerCase();
        const phone = (o.phone || o.customer?.phone || o.whatsapp || '').toLowerCase();
        const num = (o.orderNumber || o.id || '').toLowerCase();
        const billNo = (o.manualBillNumber || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || num.includes(q) || billNo.includes(q);
      }

      return true;
    });
  }, [branchFilteredOrders, statusFilter, searchQuery]);

  // Global Financial Balance Summary
  const financialSummary = useMemo(() => {
    let totalOutstanding = 0;
    let totalDueCount = 0;
    let totalCollected = 0;
    let totalAllRevenue = 0;

    branchFilteredOrders.forEach((o) => {
      if (!o || o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return;

      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));

      totalAllRevenue += total;
      totalCollected += received;

      if (balance > 0) {
        totalOutstanding += balance;
        totalDueCount += 1;
      }
    });

    const collectionRate = totalAllRevenue > 0 ? Math.round((totalCollected / totalAllRevenue) * 100) : 100;

    return {
      totalOutstanding,
      totalDueCount,
      totalCollected,
      collectionRate,
    };
  }, [branchFilteredOrders]);

  // Open Payment Collection Modal
  const handleOpenCollectModal = (order) => {
    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));

    setSelectedOrder(order);
    setCollectAmount(String(balance));
    setPaymentMethod('CASH');
    setCollectNote(`Counter settlement of ₹${balance} at ${terminal?.name || 'POS'}`);
  };

  // Save Collected Payment
  const handleSaveCollection = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    const amountNum = Number(collectAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      error('Invalid Amount', 'Please enter a valid amount greater than ₹0.');
      return;
    }

    const total = Number(selectedOrder.totalAmount || selectedOrder.finalPrice || selectedOrder.priceSnapshot?.finalTotal || 0);
    const prevReceived = Number(selectedOrder.receivedAmount !== undefined ? selectedOrder.receivedAmount : 0);
    const newTotalReceived = Math.min(total, prevReceived + amountNum);
    const newBalance = Math.max(0, total - newTotalReceived);

    setIsCollecting(true);
    try {
      const isCash = paymentMethod === 'CASH';
      const markAsDelivered = isCash || newBalance === 0;

      // Update payment record in database and storage
      const updated = await orderService.updateOrderPayment(selectedOrder.id, {
        receivedAmount: newTotalReceived,
        paymentMethod,
        paymentStatus: newBalance === 0 ? 'PAID' : 'PARTIAL',
        markDelivered: markAsDelivered,
        note: collectNote || `POS Counter collected ₹${amountNum} (${paymentMethod}) — Full Balance Cleared & Marked as DELIVERED`,
      });

      // User requirement: "when we collect due cash then make the status as paid and deliveryed"
      if (markAsDelivered) {
        await orderService.updateOrderStatus(
          selectedOrder.id,
          'DELIVERED',
          `Payment of ₹${amountNum} (${paymentMethod}) collected at POS counter — Status updated to PAID & DELIVERED`
        );
      }

      await auditService.logAction({
        action: 'PAYMENT_COLLECTED',
        entity: 'Order',
        entityId: selectedOrder.id,
        entityName: `Order #${selectedOrder.orderNumber || selectedOrder.id}`,
        details: `Collected ₹${amountNum} (${paymentMethod}) at POS ${terminal?.code || ''}. New Balance: ₹${newBalance}. Status: PAID & DELIVERED.`,
        user: { name: terminal?.assignedOperator || 'POS Cashier', role: 'cashier' },
      });

      // Dispatch event to update shift counter and other listeners
      window.dispatchEvent(new CustomEvent('techwash-order-payment-updated', { detail: { orderId: selectedOrder.id, amount: amountNum } }));
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { detail: { orderId: selectedOrder.id, status: 'DELIVERED', customerStage: 'DELIVERED' } }));

      success('Payment Recorded & Delivered!', `Order #${selectedOrder.orderNumber || selectedOrder.id} marked as PAID & DELIVERED.`);
      
      const finishedOrder = { 
        ...selectedOrder, 
        ...updated, 
        receivedAmount: newTotalReceived, 
        balanceAmount: newBalance,
        paymentStatus: newBalance === 0 ? 'PAID' : 'PARTIAL',
        customerStage: markAsDelivered ? 'DELIVERED' : selectedOrder.customerStage,
        status: markAsDelivered ? 'DELIVERED' : selectedOrder.status,
      };
      setSelectedOrder(null);
      await loadOrders();

      // Open updated receipt for printing immediately
      setReceiptOrder(finishedOrder);
    } catch (err) {
      error('Collection Error', err.message || 'Failed to record payment.');
    } finally {
      setIsCollecting(false);
    }
  };

  // Send WhatsApp Reminder
  const handleSendReminder = (order) => {
    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));
    const phone = order.phone || order.whatsapp || order.customer?.phone;

    if (!phone) {
      error('No Phone Number', 'Customer phone number is not available.');
      return;
    }

    const message = `✨ *Tech Wash Laundry Services — Payment Balance Reminder*
Dear *${order.customerName || 'Customer'}*,
Your garment care order *#${order.orderNumber || order.id}* has an outstanding balance due:

💰 *Total Bill:* ₹${total}
✅ *Amount Paid:* ₹${received}
⚠️ *Balance Due:* *₹${balance}*

Kindly clear the balance upon collection or via UPI.
📍 *Branch:* ${terminal?.name || 'Tech Wash Store'}
Thank you for choosing Tech Wash!`;

    whatsappNotificationService.openWhatsAppManual(phone, message);
    success('Reminder Opened', `WhatsApp balance reminder prepared for ${order.customerName || 'Customer'}.`);
  };

  // Open Status Management Dialog from Balances
  const handleOpenStatusModal = (order) => {
    setStatusModalOrder(order);
    setSelectedStage(order.customerStage || order.status || 'CONFIRMED');
    setStatusNote('');
    setSendWhatsAppAlert(true);
    setOpenPdfAfterUpdate(false);
  };

  // Confirm Status Change from Balances
  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!statusModalOrder) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await orderService.updateOrderStatus(statusModalOrder.id, {
        customerStage: selectedStage,
        status: selectedStage,
        note: statusNote || `Status updated to ${selectedStage} from Balance Tracker`,
      });

      success('Status Updated', `Order #${statusModalOrder.orderNumber || statusModalOrder.id} is now ${selectedStage}.`);

      const finishedOrder = { ...statusModalOrder, ...updated, customerStage: selectedStage, status: selectedStage };

      if (sendWhatsAppAlert) {
        const phone = finishedOrder.phone || finishedOrder.customer?.phone || finishedOrder.whatsapp;
        if (phone) {
          const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === selectedStage) || { label: selectedStage };
          const msg = whatsappNotificationService.buildStatusUpdateMessage(finishedOrder, stageConfig.label, statusNote);
          whatsappNotificationService.openWhatsAppManual(phone, msg);
        }
      }

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
      <div 
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* ── TOP HEADER ── */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  POS Balance Due Tracker
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                  Payment Collection
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {terminal?.name || 'Counter Machine'} • Cashier: <strong className="text-orange-300">{terminal?.assignedOperator || 'Staff'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Balance Dues"
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

        {/* ── METRICS OVERVIEW ── */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 shrink-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Metric 1: Total Outstanding */}
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-white">
              <div className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Total Outstanding Due</div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5 flex items-center justify-between">
                <span>{formatCurrency(financialSummary.totalOutstanding)}</span>
                <DollarSign className="w-4 h-4 text-rose-400 opacity-60" />
              </div>
            </div>

            {/* Metric 2: Due Orders Count */}
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid / Partial Bills</div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 flex items-center justify-between">
                <span>{financialSummary.totalDueCount} Orders</span>
                <AlertCircle className="w-4 h-4 text-amber-400 opacity-60" />
              </div>
            </div>

            {/* Metric 3: Total Collected */}
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-white">
              <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Total Collected</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 flex items-center justify-between">
                <span>{formatCurrency(financialSummary.totalCollected)}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60" />
              </div>
            </div>

            {/* Metric 4: Collection Rate */}
            <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-white">
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Collection Rate</div>
              <div className="text-xl sm:text-2xl font-black text-blue-400 font-mono mt-0.5 flex items-center justify-between">
                <span>{financialSummary.collectionRate}%</span>
                <span className="text-xs text-blue-300 font-normal">settled</span>
              </div>
            </div>
          </div>

          {/* Filters: Branch, Status, Search */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Toggle */}
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
                  All Branches
                </button>
              </div>

              {/* Status Toggle */}
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Due
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('PARTIAL')}
                  className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    statusFilter === 'PARTIAL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  Partially Paid
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNPAID')}
                  className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    statusFilter === 'UNPAID' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  100% Unpaid
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, bill #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* ── DUE ORDERS LIST ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading balance records...</p>
            </div>
          ) : dueOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-white">No Outstanding Balances!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All customer bills for this branch have been fully settled and paid in full.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {dueOrders.map((order) => {
                const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
                const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));

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
                            {order.customerName || order.customer?.name || 'Walk-in Customer'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            className="group flex items-center gap-1 p-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            title="Click to change order status"
                          >
                            <StatusBadge status={order.customerStage || order.status || 'CONFIRMED'} />
                            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition" />
                          </button>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            received > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {received > 0 ? 'Partial' : 'Unpaid'}
                          </span>
                        </div>
                      </div>

                      {/* Service & Customer Details */}
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[180px]">
                            <span>{order.serviceEmoji || '👔'}</span>
                            <span className="truncate">{order.service || order.serviceName || 'Garment Care'}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {order.phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{order.phone}</span>
                          </div>
                        )}

                        {/* Financials Strip */}
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
                          <div className="flex justify-between text-slate-400">
                            <span>Bill Total:</span>
                            <span className="font-bold text-white">₹{total}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>Received so far:</span>
                            <span className="font-bold">₹{received}</span>
                          </div>
                          <div className="flex justify-between text-rose-400 pt-1 border-t border-slate-800 font-bold">
                            <span>Remaining Due:</span>
                            <span className="text-sm">₹{balance}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── ACTION BUTTONS ── */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      {/* Update Status Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(order)}
                        className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Update Status / Milestone"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Status</span>
                      </button>

                      {/* Collect Payment Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenCollectModal(order)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Collect ₹{balance}</span>
                      </button>

                      {/* WhatsApp Reminder */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(order)}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Balance Due Reminder"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {/* Call Customer */}
                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Print Receipt */}
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="p-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 transition cursor-pointer"
                        title="Print Bill Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FAST PAYMENT COLLECTION DIALOG ── */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-5 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Collect Balance Payment</h3>
                    <p className="text-[11px] text-slate-400">Order #{selectedOrder.orderNumber || selectedOrder.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              {/* Order Info & Remaining Balance Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedOrder.customerName || 'Customer'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Bill:</span>
                  <span className="font-mono text-white font-bold">
                    ₹{selectedOrder.totalAmount || selectedOrder.finalPrice || selectedOrder.priceSnapshot?.finalTotal || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Already Paid:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ₹{selectedOrder.receivedAmount !== undefined ? selectedOrder.receivedAmount : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-800">
                  <span className="text-rose-400">Remaining Balance:</span>
                  <span className="font-mono text-rose-400 text-base">
                    ₹{selectedOrder.balanceAmount !== undefined ? selectedOrder.balanceAmount : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.receivedAmount || 0))}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Amount Collecting Now (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const bal = selectedOrder.balanceAmount !== undefined ? selectedOrder.balanceAmount : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.receivedAmount || 0));
                      setCollectAmount(String(bal));
                    }}
                    className="flex-1 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 cursor-pointer"
                  >
                    Full Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const bal = selectedOrder.balanceAmount !== undefined ? selectedOrder.balanceAmount : Math.max(0, (selectedOrder.totalAmount || 0) - (selectedOrder.receivedAmount || 0));
                      setCollectAmount(String(Math.round(bal / 2)));
                    }}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectAmount('500')}
                    className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    ₹500
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>💵 Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI_QR')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'UPI_QR'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>📱 UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>💳 Card</span>
                  </button>
                </div>
              </div>

              {/* Operator Note */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Receipt Note (Optional)</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  placeholder="e.g. Cleared at counter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isCollecting}
                  onClick={handleSaveCollection}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCollecting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Record & Settle</span>
                    </>
                  )}
                </button>
              </div>
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
                    placeholder="e.g. Payment verified, items marked ready / delivered"
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

        {/* ── PRINTABLE RECEIPT MODAL ── */}
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

export default PosBalanceDueModal;
