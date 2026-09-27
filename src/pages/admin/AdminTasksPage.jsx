import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  orderService, 
  TIME_PERIODS, 
  TIME_SLOTS, 
  normalizePeriod,
  normalizeDateString 
} from '../../services/orderService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { Modal } from '../../components/ui/Modal';
import { 
  Truck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Phone, 
  Navigation, 
  Printer, 
  Search, 
  RefreshCw, 
  Sparkles, 
  MapPin, 
  Check, 
  ArrowRight,
  Sun,
  Moon,
  Bike,
  DollarSign,
  User,
  ShoppingBag,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  LayoutGrid
} from 'lucide-react';

export const AdminTasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const initialTab = searchParams.get('tab') || 'all_deliveries';
  const initialSlot = searchParams.get('slot') || 'ALL';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // 'all_deliveries' | 'today_deliveries' | 'tomorrow_deliveries' | 'daily_calendar' | 'today_pickups' | 'overdue_deliveries'
  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState(() => {
    return normalizeDateString(new Date());
  });
  const [slotFilter, setSlotFilter] = useState(initialSlot); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isBulkSending, setIsBulkSending] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ limitCount: 1000 });
      setOrders(data || []);
    } catch (err) {
      console.warn("Failed to load task orders:", err);
      error('Load Error', 'Failed to load task schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsub = orderService.subscribeToNewOrders(() => {
      loadOrders();
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const taskMetrics = useMemo(() => {
    return orderService.getTaskScheduleMetrics(orders);
  }, [orders]);

  // Generate 10-Day Calendar Strip around selected date
  const calendarDays = useMemo(() => {
    const list = [];
    const base = new Date();

    for (let i = -1; i <= 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = normalizeDateString(d);

      const count = (orders || []).filter(o => {
        if (!o || o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
        if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
        return dDate === dateStr;
      }).length;

      const isToday = i === 0;
      const isTomorrow = i === 1;
      const isYesterday = i === -1;
      const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      list.push({
        dateStr,
        dayName,
        dayNumber,
        monthName,
        count,
        isToday,
        isTomorrow,
        isYesterday,
      });
    }
    return list;
  }, [orders]);

  // Selected date statistics
  const selectedDateStats = useMemo(() => {
    const ordersOnDate = (orders || []).filter(o => {
      if (!o || o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
      if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
      const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
      return dDate === selectedDate;
    });

    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let totalDue = 0;

    ordersOnDate.forEach(o => {
      const period = normalizePeriod(o.deliveryPeriod || o.schedule?.deliveryPeriod || o.deliverySlot || o.schedule?.deliverySlot);
      if (period === 'AFTERNOON') afternoon++;
      else if (period === 'EVENING') evening++;
      else morning++;

      const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
      const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
      const bal = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));
      totalDue += bal;
    });

    return {
      count: ordersOnDate.length,
      morning,
      afternoon,
      evening,
      totalDue,
      orders: ordersOnDate
    };
  }, [orders, selectedDate]);

  const activeTaskList = useMemo(() => {
    let list = [];
    if (activeTab === 'all_deliveries') {
      list = (orders || []).filter(o => {
        if (!o || o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
        if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        return true;
      });
      list.sort((a, b) => {
        const dA = normalizeDateString(a.deliveryDate || a.schedule?.deliveryDate || a.pickupDate || '9999-99-99');
        const dB = normalizeDateString(b.deliveryDate || b.schedule?.deliveryDate || b.pickupDate || '9999-99-99');
        return dA.localeCompare(dB);
      });
    } else if (activeTab === 'daily_calendar') {
      list = (orders || []).filter(o => {
        if (!o || o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
        if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
        return dDate === selectedDate;
      });
    } else if (activeTab === 'today_deliveries') {
      list = taskMetrics.todayDeliveries || [];
    } else if (activeTab === 'tomorrow_deliveries') {
      list = taskMetrics.tomorrowDeliveries || [];
    } else if (activeTab === 'today_pickups') {
      list = taskMetrics.todayPickups || [];
    } else if (activeTab === 'overdue_deliveries') {
      list = taskMetrics.overdueDeliveries || [];
    }

    if (slotFilter !== 'ALL' && activeTab !== 'overdue_deliveries') {
      list = list.filter(o => {
        const period = normalizePeriod(
          o.deliveryPeriod || o.schedule?.deliveryPeriod || o.deliverySlot || o.schedule?.deliverySlot ||
          o.pickupPeriod || o.schedule?.pickupPeriod || o.pickupSlot || o.schedule?.pickupSlot
        );
        return period === slotFilter;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => {
        const name = (o.customerName || o.customer?.name || '').toLowerCase();
        const phone = (o.phone || o.customer?.phone || o.whatsapp || '').toLowerCase();
        const num = (o.orderNumber || o.id || '').toLowerCase();
        const addr = (o.address || o.customer?.address || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || num.includes(q) || addr.includes(q);
      });
    }

    return list;
  }, [orders, taskMetrics, activeTab, selectedDate, slotFilter, searchQuery]);

  const handleSendReminder = (order, dayLabel = 'Tomorrow') => {
    const phone = order.phone || order.customer?.phone || order.whatsapp;
    if (!phone) {
      error('No Phone Number', 'Customer phone number is missing.');
      return;
    }
    const msg = whatsappNotificationService.buildDeliveryReminderWhatsAppMessage(order, dayLabel);
    whatsappNotificationService.openWhatsAppManual(phone, msg);
    success('WhatsApp Opened', `Delivery reminder created for ${order.customerName || 'Customer'}.`);
  };

  const handleBulkSendTomorrowReminders = async () => {
    const tomorrowList = taskMetrics.tomorrowDeliveries || [];
    if (tomorrowList.length === 0) {
      info('No Tomorrow Deliveries', 'There are no orders scheduled for tomorrow delivery.');
      return;
    }

    setIsBulkSending(true);
    let sentCount = 0;
    try {
      for (const ord of tomorrowList) {
        const phone = ord.phone || ord.customer?.phone || ord.whatsapp;
        if (phone) {
          const msg = whatsappNotificationService.buildDeliveryReminderWhatsAppMessage(ord, 'Tomorrow');
          await whatsappNotificationService.dispatchAutomatedMessage(phone, msg);
          sentCount++;
        }
      }
      success('Bulk Reminders Sent!', `Dispatched automated delivery reminders for ${sentCount} orders via WhatsApp gateway.`);
    } catch (err) {
      error('Bulk Dispatch Issue', err.message || 'Some reminders failed to queue.');
    } finally {
      setIsBulkSending(false);
    }
  };

  const handleOpenGoogleMaps = (order) => {
    const addr = order.address || order.customer?.address;
    if (!addr) {
      error('No Address', 'Customer address not found.');
      return;
    }
    const encoded = encodeURIComponent(addr);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Header */}
      <AdminPageHeader
        title="Today's Tasks & Delivery Dispatcher"
        subtitle="Manage today's deliveries by time slot, dispatch automated WhatsApp reminders for tomorrow, coordinate pickups, and resolve overdue orders."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadOrders}
            isLoading={loading}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Truck}
            onClick={handleBulkSendTomorrowReminders}
            isLoading={isBulkSending}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md font-bold"
          >
            📲 Send All Tomorrow Reminders ({taskMetrics.tomorrowDeliveries?.length || 0})
          </Button>
        </div>
      </AdminPageHeader>

      {/* Metric Highlights Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Card 0: All Deliveries */}
        <button
          type="button"
          onClick={() => { setActiveTab('all_deliveries'); setSlotFilter('ALL'); }}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'all_deliveries'
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-indigo-600 shadow-lg ring-2 ring-indigo-400/40'
              : 'bg-white hover:bg-indigo-50/50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              activeTab === 'all_deliveries' ? 'text-indigo-100' : 'text-slate-400'
            }`}>
              🚚 ALL DELIVERIES
            </span>
            <span className="text-base">📋</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {taskMetrics.counts?.allDeliveries || orders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${
            activeTab === 'all_deliveries' ? 'text-indigo-100' : 'text-slate-500'
          }`}>
            Full Delivery Schedule
          </div>
        </button>

        {/* Card 1: Today Deliveries */}
        <button
          type="button"
          onClick={() => { setActiveTab('today_deliveries'); setSlotFilter('ALL'); }}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'today_deliveries'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-400/40'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              activeTab === 'today_deliveries' ? 'text-emerald-100' : 'text-slate-400'
            }`}>
              🚚 TODAY DELIVERIES
            </span>
            <span className="text-base">✨</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {taskMetrics.todayDeliveries?.length || 0}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${
            activeTab === 'today_deliveries' ? 'text-emerald-100' : 'text-slate-500'
          }`}>
            🌅 {taskMetrics.todayDeliveriesMorning?.length || 0} Morn • ☀️ {taskMetrics.todayDeliveriesAfternoon?.length || 0} Aft • 🌙 {taskMetrics.todayDeliveriesEvening?.length || 0} Eve
          </div>
        </button>

        {/* Card 2: Tomorrow Deliveries */}
        <button
          type="button"
          onClick={() => { setActiveTab('tomorrow_deliveries'); setSlotFilter('ALL'); }}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'tomorrow_deliveries'
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-lg ring-2 ring-blue-400/40'
              : 'bg-white hover:bg-blue-50/50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              activeTab === 'tomorrow_deliveries' ? 'text-blue-100' : 'text-slate-400'
            }`}>
              📲 TOMORROW (REMIND)
            </span>
            <span className="text-base">🗓️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {taskMetrics.tomorrowDeliveries?.length || 0}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${
            activeTab === 'tomorrow_deliveries' ? 'text-blue-100' : 'text-slate-500'
          }`}>
            1-Click WhatsApp Reminders Ready
          </div>
        </button>

        {/* Card 3: Today Pickups */}
        <button
          type="button"
          onClick={() => { setActiveTab('today_pickups'); setSlotFilter('ALL'); }}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'today_pickups'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-400/40'
              : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              activeTab === 'today_pickups' ? 'text-amber-100' : 'text-slate-400'
            }`}>
              📦 TODAY PICKUPS
            </span>
            <span className="text-base">📍</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {taskMetrics.todayPickups?.length || 0}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${
            activeTab === 'today_pickups' ? 'text-amber-100' : 'text-slate-500'
          }`}>
            Doorstep Collections Scheduled
          </div>
        </button>

        {/* Card 4: Overdue Deliveries */}
        <button
          type="button"
          onClick={() => { setActiveTab('overdue_deliveries'); setSlotFilter('ALL'); }}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            activeTab === 'overdue_deliveries'
              ? 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-600 shadow-lg ring-2 ring-rose-400/40'
              : 'bg-white hover:bg-rose-50/50 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              activeTab === 'overdue_deliveries' ? 'text-rose-100' : 'text-rose-600'
            }`}>
              ⚠️ OVERDUE DELIVERIES
            </span>
            <span className="text-base">🚨</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {taskMetrics.overdueDeliveries?.length || 0}
          </div>
          <div className={`text-[11px] font-bold mt-1 ${
            activeTab === 'overdue_deliveries' ? 'text-rose-100' : 'text-rose-600'
          }`}>
            Passed Schedule • Need Attention
          </div>
        </button>

      </div>

      {/* Main Task Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* Primary View Tabs */}
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('all_deliveries'); setSlotFilter('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all_deliveries'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>🚚 All Deliveries</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'all_deliveries' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {orders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('daily_calendar'); setSlotFilter('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'daily_calendar'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>📅 Day Calendar</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'daily_calendar' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedDateStats.count}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('tomorrow_deliveries'); setSlotFilter('ALL'); setSelectedDate(taskMetrics.tomorrowStr); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tomorrow_deliveries'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span>📲 Tomorrow ({taskMetrics.tomorrowDeliveries?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('today_deliveries'); setSlotFilter('ALL'); setSelectedDate(taskMetrics.todayStr); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'today_deliveries'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>🚚 Today Deliveries ({taskMetrics.todayDeliveries?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('today_pickups'); setSlotFilter('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'today_pickups'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span>📦 Today Pickups ({taskMetrics.todayPickups?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('overdue_deliveries'); setSlotFilter('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overdue_deliveries'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span>⚠️ Overdue ({taskMetrics.overdueDeliveries?.length || 0})</span>
            </button>
          </div>

          {/* View Mode Toggle & Search Box */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
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
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search customer, phone, order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* 10-Day Calendar Strip & Date Picker */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery Date Filter:</span>
              </span>

              {/* Prev / Next Date Buttons */}
              <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(selectedDate || new Date());
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(normalizeDateString(d));
                    setActiveTab('daily_calendar');
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(selectedDate || new Date());
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(normalizeDateString(d));
                    setActiveTab('daily_calendar');
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Native Date Picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    if (activeTab !== 'daily_calendar') setActiveTab('daily_calendar');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Deliveries for <strong>{selectedDate === taskMetrics.todayStr ? 'Today' : selectedDate === taskMetrics.tomorrowStr ? 'Tomorrow' : formatDate(selectedDate)}</strong>: <strong className="text-emerald-700 font-mono">{selectedDateStats.count} orders</strong>
            </div>
          </div>

          {/* Calendar Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {/* Pill 0: All Dates */}
            <button
              type="button"
              onClick={() => setActiveTab('all_deliveries')}
              className={`px-3 py-1.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer flex flex-col items-center min-w-[76px] ${
                activeTab === 'all_deliveries'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-400/40'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-bold">🌐 All Dates</span>
              <span className="text-xs font-black font-mono my-0.5">All Schedule</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                activeTab === 'all_deliveries' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {orders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length} all
              </span>
            </button>

            {calendarDays.map((day) => {
              const isSelected = selectedDate === day.dateStr && activeTab === 'daily_calendar';
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.dateStr);
                    setActiveTab('daily_calendar');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer flex flex-col items-center min-w-[70px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                      : day.isToday
                      ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                      : day.isTomorrow
                      ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-bold">{day.dayName}</span>
                  <span className="text-xs font-black font-mono my-0.5">{day.dayNumber} {day.monthName}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white text-emerald-800'
                      : day.count > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {day.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time Slot Window:</span>
              <div className="inline-flex rounded-xl bg-slate-50 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSlotFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    slotFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Slots
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('MORNING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    slotFilter === 'MORNING'
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-amber-600'
                  }`}
                >
                  <span>🌅 Morning (8AM-12PM)</span>
                  {activeTab === 'today_deliveries' && (
                    <span className="text-[10px] font-mono">({taskMetrics.todayDeliveriesMorning?.length || 0})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('AFTERNOON')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    slotFilter === 'AFTERNOON'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600'
                  }`}
                >
                  <span>☀️ Afternoon (12PM-4PM)</span>
                  {activeTab === 'today_deliveries' && (
                    <span className="text-[10px] font-mono">({taskMetrics.todayDeliveriesAfternoon?.length || 0})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('EVENING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    slotFilter === 'EVENING'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <span>🌙 Evening (4PM-8PM)</span>
                  {activeTab === 'today_deliveries' && (
                    <span className="text-[10px] font-mono">({taskMetrics.todayDeliveriesEvening?.length || 0})</span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-500">
              Showing <span className="text-slate-900 font-black">{activeTaskList.length}</span> matching tasks
            </div>
          </div>
        </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold text-slate-500">Loading daily schedule tasks...</div>
        </div>
      ) : activeTaskList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">No Deliveries in this Window</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no tasks matching this specific date or tab. You have <strong className="text-indigo-600 font-bold">{orders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length} active deliveries</strong> in the system.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('all_deliveries')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>View All Deliveries</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('today_deliveries'); setSelectedDate(taskMetrics.todayStr); }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today ({taskMetrics.todayDeliveries?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('tomorrow_deliveries'); setSelectedDate(taskMetrics.tomorrowStr); }}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tomorrow ({taskMetrics.tomorrowDeliveries?.length || 0})</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* ── HIGH-DENSITY ADMIN DELIVERY TABLE / LIST VIEW ── */
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Order / Bill</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Customer Info</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Delivery Schedule</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Service & Items</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Stage</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Amount / Due</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTaskList.map((order) => {
                const isDeliveryTab = activeTab === 'all_deliveries' || activeTab === 'today_deliveries' || activeTab === 'tomorrow_deliveries' || activeTab === 'overdue_deliveries';
                const scheduledDate = normalizeDateString(isDeliveryTab 
                  ? (order.deliveryDate || order.schedule?.deliveryDate || 'Today')
                  : (order.pickupDate || order.schedule?.pickupDate || 'Today'));
                const period = normalizePeriod(isDeliveryTab ? (order.deliveryPeriod || order.schedule?.deliveryPeriod) : (order.pickupPeriod || order.schedule?.pickupPeriod));
                const isToday = scheduledDate === taskMetrics.todayStr;
                const isTomorrow = scheduledDate === taskMetrics.tomorrowStr;
                const isOverdue = scheduledDate && scheduledDate < taskMetrics.todayStr;

                const total = Number(order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount || 0);
                const received = Number(order.receivedAmount !== undefined && order.receivedAmount !== null ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                const balance = Number(order.balanceAmount !== undefined && order.balanceAmount !== null ? order.balanceAmount : Math.max(0, total - received));

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order / Bill */}
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="font-mono font-black text-xs text-slate-900">
                        #{order.orderNumber || order.id?.substring(0, 8)}
                      </div>
                      {order.manualBillNumber && (
                        <div className="text-[10px] text-amber-700 font-mono font-bold">
                          Slip: {order.manualBillNumber}
                        </div>
                      )}
                      {order.terminalCode && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 text-[9px] font-bold">
                          {order.terminalCode}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3 align-middle">
                      <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]">
                        {order.customerName || order.customer?.name || 'Customer'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {order.phone || order.customer?.phone || order.whatsapp || 'No Phone'}
                      </div>
                      {order.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px] flex items-center gap-0.5" title={order.address}>
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{order.address}</span>
                        </div>
                      )}
                    </td>

                    {/* Delivery Schedule */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isOverdue 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 font-black'
                            : isToday
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isTomorrow
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isOverdue && '⚠️ '}
                          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(scheduledDate)}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {period === 'MORNING' ? '🌅 8-12' : period === 'AFTERNOON' ? '☀️ 12-4' : '🌙 4-8'}
                        </span>
                      </div>
                    </td>

                    {/* Service & Items */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold truncate max-w-[150px]">
                        <span>{order.serviceEmoji || '🧺'}</span>
                        <span className="truncate">{order.service || order.serviceName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-3 align-middle whitespace-nowrap">
                      <StatusBadge status={order.customerStage || order.status || 'CONFIRMED'} />
                    </td>

                    {/* Payment / Due */}
                    <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-mono">
                      <div className="text-slate-800 font-bold">₹{total}</div>
                      <div className={`text-[10px] font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {balance > 0 ? `₹${balance} Due` : '✅ Paid'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendReminder(order, isTomorrow ? 'Tomorrow' : 'Today')}
                          className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Send WhatsApp Delivery Reminder"
                        >
                          <span>📲</span>
                          <span>WA</span>
                        </button>

                        {order.phone && (
                          <a
                            href={`tel:${order.phone}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setReceiptModalOrder(order)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer"
                          title="View Invoice / Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={`/admin/orders?branch=ALL`}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition"
                          title="Manage in Orders Table"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTaskList.map((order) => {
            const isDeliveryTab = activeTab === 'today_deliveries' || activeTab === 'tomorrow_deliveries' || activeTab === 'overdue_deliveries';
            const scheduledDate = isDeliveryTab 
              ? (order.deliveryDate || order.schedule?.deliveryDate || 'Today')
              : (order.pickupDate || order.schedule?.pickupDate || 'Today');
            const scheduledSlot = isDeliveryTab
              ? (order.deliverySlot || order.schedule?.deliverySlot || (order.deliveryPeriod ? TIME_SLOTS[order.deliveryPeriod] : 'Evening (4PM - 8PM)'))
              : (order.pickupSlot || order.schedule?.pickupSlot || 'Morning (8AM - 12PM)');
            const period = normalizePeriod(isDeliveryTab ? (order.deliveryPeriod || order.schedule?.deliveryPeriod) : (order.pickupPeriod || order.schedule?.pickupPeriod));

            const total = Number(order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount || 0);
            const received = Number(order.receivedAmount !== undefined && order.receivedAmount !== null ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
            const balance = Number(order.balanceAmount !== undefined && order.balanceAmount !== null ? order.balanceAmount : Math.max(0, total - received));

            return (
              <div 
                key={order.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between gap-3 shadow-xs bg-white ${
                  activeTab === 'overdue_deliveries'
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                    : activeTab === 'tomorrow_deliveries'
                    ? 'border-blue-200 hover:border-blue-400'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  {/* Card Header: Order # + Status Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-slate-900">
                          #{order.orderNumber || order.id?.substring(0, 8)}
                        </span>
                        {order.isWalkIn || order.orderSource === 'OFFLINE_POS' ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">
                            🏪 POS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                            🌐 Online
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {order.customerName || order.customer?.name || 'Customer'}
                      </div>
                    </div>

                    <StatusBadge status={order.customerStage || order.status} />
                  </div>

                  {/* Scheduled Window Banner */}
                  <div className={`p-2.5 rounded-2xl border mb-3 flex items-center justify-between gap-2 text-xs ${
                    period === 'MORNING'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : period === 'AFTERNOON'
                      ? 'bg-orange-50/80 border-orange-200 text-orange-950'
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {period === 'MORNING' ? '🌅' : period === 'AFTERNOON' ? '☀️' : '🌙'}
                      </span>
                      <div>
                        <div className="font-black text-[11px] leading-tight">
                          {isDeliveryTab ? '🚚 Delivery Window' : '📦 Pickup Window'}
                        </div>
                        <div className="text-[10px] font-semibold opacity-80">
                          {scheduledDate} • {scheduledSlot}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/80 border border-current/20">
                      {period}
                    </span>
                  </div>

                  {/* Garment Details & Financials */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <span>{order.serviceEmoji || '🧺'}</span>
                        <span className="truncate max-w-[150px]">{order.service || order.serviceName}</span>
                      </span>
                      <span className="font-bold text-slate-500 text-[11px]">
                        {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {order.address && (
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1" title={order.address}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono">
                      <span className="text-slate-500 text-[11px]">Bill: <strong>{formatCurrency(total)}</strong></span>
                      <span className={`text-[11px] font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {balance > 0 ? `₹${balance} Due` : '✅ Paid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  {/* WhatsApp Reminder Button */}
                  <button
                    type="button"
                    onClick={() => handleSendReminder(order, activeTab === 'tomorrow_deliveries' ? 'Tomorrow' : 'Today')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                    title="Send WhatsApp Delivery Reminder"
                  >
                    <span>📲</span>
                    <span>Remind WA</span>
                  </button>

                  {/* Phone Call */}
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition-colors"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Maps Directions */}
                  <button
                    type="button"
                    onClick={() => handleOpenGoogleMaps(order)}
                    className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center text-xs transition-colors"
                    title="Google Maps Navigation"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>

                  {/* Print Invoice */}
                  <button
                    type="button"
                    onClick={() => setReceiptModalOrder(order)}
                    className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 flex items-center justify-center text-xs transition-colors"
                    title="View Tax Invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Order Details */}
                  <Link
                    to={`/admin/orders?branch=ALL`}
                    className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs transition-colors"
                    title="Manage in Orders Table"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptModalOrder && (
        <ReceiptModal
          order={receiptModalOrder}
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
        />
      )}

    </div>
  );
};
