import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../services/orderService';
import { auditService } from '../../services/auditService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  DollarSign, 
  Search, 
  MessageSquare, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Store, 
  Globe, 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Sparkles, 
  Send, 
  ExternalLink,
  RefreshCw,
  Wallet,
  ArrowRight,
  Receipt,
  Trash2
} from 'lucide-react';

export const AdminBalanceDuePage = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL'); // 'ALL' | 'OFFLINE_POS' | 'ONLINE_WEBSITE'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PARTIAL' | 'UNPAID'
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Payment Collection Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'UPI_QR' | 'CARD'
  const [collectNote, setCollectNote] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Active Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState(null);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders({ limitCount: 500 });
      setOrders(data);
    } catch (e) {
      console.warn('Failed to load orders for balance tracking:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsub = orderService.subscribeToNewOrders(() => {
      loadOrders();
    });
    return unsub;
  }, []);

  // Filter orders that have balance due (> 0)
  const dueOrders = useMemo(() => {
    return orders.filter((o) => {
      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));

      // Must have positive balance or non-PAID status
      const hasBalance = balance > 0 || (o.paymentStatus !== 'PAID' && total > 0);
      if (!hasBalance) return false;

      // Channel filter
      const isPos = Boolean(o.isWalkIn || o.orderSource === 'OFFLINE_POS' || o.terminalCode);
      if (channelFilter === 'OFFLINE_POS' && !isPos) return false;
      if (channelFilter === 'ONLINE_WEBSITE' && isPos) return false;

      // Status filter
      if (statusFilter === 'PARTIAL' && received === 0) return false;
      if (statusFilter === 'UNPAID' && received > 0) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (o.orderNumber || o.id || '').toLowerCase().includes(q);
        const matchesName = (o.customerName || o.customer?.name || '').toLowerCase().includes(q);
        const matchesPhone = (o.phone || o.customer?.phone || '').includes(q);
        const matchesBranch = (o.storeBranch || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesBranch) return false;
      }

      return true;
    });
  }, [orders, channelFilter, statusFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalOutstanding = 0;
    let totalDueCount = 0;
    let totalCollected = 0;
    let totalAllRevenue = 0;

    orders.forEach((o) => {
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
  }, [orders]);

  // Open Payment Collection Modal
  const handleOpenCollectModal = (order) => {
    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));

    setSelectedOrder(order);
    setCollectAmount(String(balance));
    setPaymentMethod('CASH');
    setCollectNote(`Balance settlement of ₹${balance}`);
    setCollectModalOpen(true);
  };

  // Save Collected Payment
  const handleSaveCollection = async (e) => {
    e.preventDefault();
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
      const updated = await orderService.updateOrderPayment(selectedOrder.id, {
        receivedAmount: newTotalReceived,
        paymentMethod,
        paymentStatus: newBalance === 0 ? 'PAID' : 'PARTIAL',
        note: collectNote || `Collected ₹${amountNum} via ${paymentMethod}`,
      });

      await auditService.logAction({
        action: 'PAYMENT_COLLECTED',
        entity: 'Order',
        entityId: selectedOrder.id,
        entityName: `Order #${selectedOrder.orderNumber}`,
        details: `Collected ₹${amountNum} (${paymentMethod}). New Balance: ₹${newBalance}.`,
        user: currentUser,
      });

      success('Payment Recorded!', `Collected ₹${amountNum} for #${selectedOrder.orderNumber}.`);
      setCollectModalOpen(false);
      setSelectedOrder(null);
      await loadOrders();
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

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://techwash.in';
    const trackingLink = `${origin}/track-order?id=${order.orderNumber || order.id}`;

    const message = `✨ *Tech Wash Laundry Services — Payment Balance Reminder*

Hello *${order.customerName || order.customer?.name || 'Valued Customer'}*,

Thank you for choosing Tech Wash for your garment care. Here is the payment summary for your order:

🧾 *Order ID:* ${order.orderNumber || order.id}
👔 *Service:* ${order.serviceName || order.service || 'Garment Care'}
💰 *Total Bill:* ₹${total}
✅ *Amount Received:* ₹${received}
🔴 *Balance Due Amount:* *₹${balance}*

📱 *Track Order & Digital Invoice:*
${trackingLink}

💳 *Payment Methods:*
• Scan UPI QR upon delivery / counter
• Cash / UPI on delivery

For queries or assistance, contact our concierge at *+91 63048 45567*. Thank you!`;

    whatsappNotificationService.openWhatsAppManual(phone, message);
    success('WhatsApp Opened', `Payment reminder prepared for ${order.customerName}.`);
  };

  const handleDeleteOrder = async () => {
    if (!deleteTargetOrder) return;
    setIsDeleting(true);
    try {
      await orderService.deleteOrder(deleteTargetOrder.id);
      try {
        await auditService.logAction({
          action: 'DELETE',
          entity: 'Order',
          entityId: deleteTargetOrder.id,
          entityName: `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id}`,
          user: currentUser,
        });
      } catch (e) {}

      success('Order Deleted', `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id} was permanently removed.`);
      setDeleteTargetOrder(null);
      loadOrders();
    } catch (err) {
      error('Delete Failed', err.message || 'Failed to delete order.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Order & Source',
      key: 'orderNumber',
      render: (val, row) => {
        const isPos = Boolean(row.isWalkIn || row.orderSource === 'OFFLINE_POS' || row.terminalCode);
        return (
          <div className="space-y-1">
            <div className="font-mono font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>{val || row.id}</span>
            </div>
            {isPos ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                <Store className="w-3 h-3 text-amber-700" />
                <span>In-Store POS ({row.terminalCode || 'Counter'})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-100 border border-cyan-300 text-cyan-900 text-[10px] font-black uppercase tracking-wider">
                <Globe className="w-3 h-3 text-cyan-700" />
                <span>Online Pickup</span>
              </span>
            )}
            {row.storeBranch && (
              <div className="text-[10px] text-slate-500 truncate max-w-[170px]" title={row.storeBranch}>
                {row.storeBranch}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Customer Details',
      key: 'customerName',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {val || row.customer?.name || 'Valued Customer'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <a href={`tel:${row.phone || row.customer?.phone}`} className="hover:text-orange-600">
              {row.phone || row.customer?.phone || 'No phone'}
            </a>
          </div>
        </div>
      ),
    },
    {
      title: 'Service & Date',
      key: 'service',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
            <span>{row.serviceEmoji || '👔'}</span>
            <span>{row.serviceName || row.service || 'Garment Care'}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(row.createdAt || row.pickupDate)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Total Bill',
      key: 'totalAmount',
      render: (_, row) => {
        const total = Number(row.totalAmount || row.finalPrice || row.priceSnapshot?.finalTotal || 0);
        return (
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
            {formatCurrency(total)}
          </div>
        );
      },
    },
    {
      title: 'Amount Received',
      key: 'receivedAmount',
      render: (_, row) => {
        const total = Number(row.totalAmount || row.finalPrice || row.priceSnapshot?.finalTotal || 0);
        const received = Number(row.receivedAmount !== undefined ? row.receivedAmount : (row.paymentStatus === 'PAID' ? total : 0));
        return (
          <div>
            <span className="font-mono font-bold text-emerald-700 text-xs">
              {formatCurrency(received)}
            </span>
            <div className="text-[10px] text-slate-400">
              via {String(row.paymentMethod || 'CASH').replace(/_/g, ' ')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Balance Due',
      key: 'balanceAmount',
      render: (_, row) => {
        const total = Number(row.totalAmount || row.finalPrice || row.priceSnapshot?.finalTotal || 0);
        const received = Number(row.receivedAmount !== undefined ? row.receivedAmount : (row.paymentStatus === 'PAID' ? total : 0));
        const balance = Number(row.balanceAmount !== undefined ? row.balanceAmount : Math.max(0, total - received));
        return (
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-1 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 font-mono font-black text-xs sm:text-sm shadow-xs">
              {formatCurrency(balance)}
            </span>
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              {received > 0 ? 'Partial Unpaid' : 'Full Due'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions & Collection',
      key: 'id',
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenCollectModal(row)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
            title="Record payment collected from customer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Collect</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendReminder(row)}
            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
            title="Send WhatsApp Payment Reminder"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setReceiptOrder(row)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="View & Print Official Invoice"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteTargetOrder(row)}
            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
            title="Delete / Dismiss Order"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pos-workspace-screen print:hidden no-print">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0B0A1C] to-slate-950 p-6 sm:p-7 rounded-3xl border border-rose-500/20 shadow-xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black tracking-wider uppercase flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Accounts Receivable</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black tracking-wider uppercase">
                Live Settlement
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-1.5 flex items-center gap-2">
              <span>💰 Outstanding Balance Due Tracker</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Track all pending customer balance payments from In-Store POS counters and Online Doorstep orders, record spot cash/UPI collections, and dispatch 1-click WhatsApp payment reminders.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadOrders}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-rose-500/30 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
              Total Outstanding Due
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
              {formatCurrency(stats.totalOutstanding)}
            </div>
            <div className="text-[10px] text-slate-400">
              Across {stats.totalDueCount} pending customer orders
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Orders with Due Balance
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
              {stats.totalDueCount} <span className="text-sm font-normal text-slate-400">orders</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Requiring collection or follow-up
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Total Revenue Collected
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(stats.totalCollected)}
            </div>
            <div className="text-[10px] text-slate-400">
              Cash, UPI QR & Card receipts
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/30 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Overall Collection Rate
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">
              {stats.collectionRate}%
            </div>
            <div className="text-[10px] text-slate-400">
              Real-time payment clearance ratio
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID (TW-00001), Customer, Phone, or Counter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                channelFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('OFFLINE_POS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                channelFilter === 'OFFLINE_POS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>🏪 In-Store POS</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('ONLINE_WEBSITE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                channelFilter === 'ONLINE_WEBSITE'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Online</span>
            </button>
          </div>

        </div>

        {/* Status Sub-Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            Filter Due Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold ${
              statusFilter === 'ALL'
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Outstanding ({dueOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PARTIAL')}
            className={`px-2.5 py-1 rounded-lg font-bold ${
              statusFilter === 'PARTIAL'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Partial Paid (₹ Remaining)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-2.5 py-1 rounded-lg font-bold ${
              statusFilter === 'UNPAID'
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completely Unpaid (₹0 Received)
          </button>
        </div>
      </div>

      {/* 3. Due Orders Table */}
      <Table
        columns={columns}
        data={dueOrders}
        isLoading={loading}
        emptyMessage="🎉 Excellent! No pending balance dues. All customer orders are fully settled."
      />

      {/* 4. Payment Collection Modal */}
      {selectedOrder && (
        <Modal
          isOpen={collectModalOpen}
          onClose={() => setCollectModalOpen(false)}
          maxWidth="max-w-md"
          title={`Collect Payment for #${selectedOrder.orderNumber || selectedOrder.id}`}
        >
          <form onSubmit={handleSaveCollection} className="space-y-4">
            
            {/* Customer & Bill Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedOrder.customerName || selectedOrder.customer?.name}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Total Order Bill:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(selectedOrder.totalAmount || selectedOrder.finalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Already Received:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(selectedOrder.receivedAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-800">Current Balance Due:</span>
                <span className="font-mono font-black text-rose-600">
                  {formatCurrency(selectedOrder.balanceAmount || (Number(selectedOrder.totalAmount || 0) - Number(selectedOrder.receivedAmount || 0)))}
                </span>
              </div>
            </div>

            {/* Quick Balance Shortcut */}
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Settlement Amount (₹) *
              </label>
              <button
                type="button"
                onClick={() => {
                  const bal = Number(selectedOrder.balanceAmount || (Number(selectedOrder.totalAmount || 0) - Number(selectedOrder.receivedAmount || 0)));
                  setCollectAmount(String(bal));
                }}
                className="text-[11px] text-emerald-600 font-bold hover:text-emerald-700"
              >
                ⚡ Full Balance (₹{selectedOrder.balanceAmount || (Number(selectedOrder.totalAmount || 0) - Number(selectedOrder.receivedAmount || 0))})
              </button>
            </div>

            <Input
              type="number"
              required
              min="1"
              max={selectedOrder.totalAmount || 999999}
              placeholder="Enter amount being collected"
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
              className="text-base font-mono font-bold"
            />

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Payment Method Received *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'CASH', label: '💵 Cash', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                  { key: 'UPI_QR', label: '📱 UPI / QR', color: 'border-cyan-300 bg-cyan-50 text-cyan-900' },
                  { key: 'CARD', label: '💳 Card / POS', color: 'border-purple-300 bg-purple-50 text-purple-900' },
                ].map((pm) => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPaymentMethod(pm.key)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      paymentMethod === pm.key
                        ? `${pm.color} ring-2 ring-emerald-500 shadow-xs font-black`
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Collection Notes / Remarks"
              placeholder="e.g. Received at shop counter / PhonePe transaction ref"
              value={collectNote}
              onChange={(e) => setCollectNote(e.target.value)}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setCollectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCollecting}>
                Confirm & Record Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. Official Tax Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
      )}

      {/* 6. Delete / Dismiss Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetOrder}
        onClose={() => setDeleteTargetOrder(null)}
        onConfirm={handleDeleteOrder}
        title={`Delete Order #${deleteTargetOrder?.orderNumber || deleteTargetOrder?.id || ''}?`}
        message="This order will be permanently deleted from Firebase Firestore and removed from all due balance records. This action cannot be undone."
        confirmText="Delete Order"
        isLoading={isDeleting}
      />

    </div>
  );
};

export default AdminBalanceDuePage;

