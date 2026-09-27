import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  orderService, 
  normalizePeriod,
  normalizeDateString,
  getOrderBranchKey,
  TIME_PERIODS,
  ORDER_CUSTOMER_STAGES
} from '../../services/orderService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../admin/StatusBadge';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { 
  Truck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Navigation, 
  Printer, 
  Search, 
  RefreshCw, 
  MapPin, 
  X,
  Store,
  Send,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ClipboardList,
  CalendarDays,
  Filter,
  LayoutList,
  LayoutGrid,
  Edit3,
  Zap,
  DollarSign,
  Wallet
} from 'lucide-react';

export const PosTasksModal = ({
  isOpen,
  onClose,
  terminal = null,
  activeTerminalId = 'counter-1'
}) => {
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'all_deliveries' (Full Delivery List) | 'daily_calendar' | 'tomorrow_deliveries' | 'today_deliveries' | 'today_pickups' | 'all_active' | 'overdue_deliveries'
  const [activeTab, setActiveTab] = useState('all_deliveries');
  
  // View Mode: 'list' (compact table) | 'cards' (grid cards)
  const [viewMode, setViewMode] = useState('list');

  // Selected Calendar Date (defaults to Today)
  const [selectedDate, setSelectedDate] = useState(() => {
    return normalizeDateString(new Date());
  });

  const [slotFilter, setSlotFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  const [branchFilter, setBranchFilter] = useState('LOCAL'); // 'LOCAL' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Reschedule State
  const [rescheduleOrder, setRescheduleOrder] = useState(null);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newDeliveryPeriod, setNewDeliveryPeriod] = useState('MORNING');

  // "+ Add New Task" Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    customerName: '',
    phone: '',
    taskType: 'COUNTER_DROP',
    serviceName: 'Premium Dry Cleaning',
    deliveryDate: normalizeDateString(new Date()),
    deliveryPeriod: 'MORNING',
    estimatedPrice: '',
    notes: '',
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ limitCount: 1000 });
      setOrders(data || []);
    } catch (err) {
      console.warn('Failed to load POS task orders:', err);
      error('Load Error', 'Failed to load task schedule.');
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

      return () => {
        if (typeof unsub === 'function') unsub();
        window.removeEventListener('techwash-new-order-placed', handleEvent);
        window.removeEventListener('techwash-order-updated', handleEvent);
        window.removeEventListener('techwash-orders-updated', handleEvent);
      };
    }
  }, [isOpen, loadOrders]);

  // Compute metrics with branch filter using official getOrderBranchKey
  const branchFilteredOrders = useMemo(() => {
    if (branchFilter === 'ALL' || !activeTerminalId || activeTerminalId === 'ALL') return orders;
    return orders.filter(o => getOrderBranchKey(o) === activeTerminalId);
  }, [orders, branchFilter, activeTerminalId]);

  const taskMetrics = useMemo(() => {
    return orderService.getTaskScheduleMetrics(branchFilteredOrders);
  }, [branchFilteredOrders]);

  // Generate 10-Day Calendar Strip around selected date (Yesterday, Today, Tomorrow, +2 to +8 days)
  const calendarDays = useMemo(() => {
    const list = [];
    const base = new Date();

    for (let i = -1; i <= 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = normalizeDateString(d);

      // Count deliveries scheduled on this date
      const count = branchFilteredOrders.filter(o => {
        if (o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
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
  }, [branchFilteredOrders]);

  // Stats for the currently selected calendar date
  const selectedDateStats = useMemo(() => {
    const ordersOnDate = branchFilteredOrders.filter(o => {
      if (o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
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
  }, [branchFilteredOrders, selectedDate]);

  // Active Task List based on Tab & Day-Wise Calendar Selection
  const activeTaskList = useMemo(() => {
    let list = [];
    
    if (activeTab === 'all_deliveries') {
      // Complete Delivery List: All pending deliveries across all dates
      list = branchFilteredOrders.filter(o => {
        if (o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
        if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        return true;
      });
      // Sort chronologically: Overdue -> Today -> Tomorrow -> Upcoming -> Later
      list.sort((a, b) => {
        const dateA = normalizeDateString(a.deliveryDate || a.schedule?.deliveryDate || a.pickupDate || '9999-99-99');
        const dateB = normalizeDateString(b.deliveryDate || b.schedule?.deliveryDate || b.pickupDate || '9999-99-99');
        return dateA.localeCompare(dateB);
      });
    } else if (activeTab === 'daily_calendar') {
      // Deliveries for the specifically selected calendar date
      list = branchFilteredOrders.filter(o => {
        if (o.customerStage === 'DELIVERED' || o.status === 'DELIVERED') return false;
        if (o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        const dDate = normalizeDateString(o.deliveryDate || o.schedule?.deliveryDate);
        return dDate === selectedDate;
      });
    } else if (activeTab === 'tomorrow_deliveries') {
      list = taskMetrics.tomorrowDeliveries || [];
    } else if (activeTab === 'today_deliveries') {
      list = taskMetrics.todayDeliveries || [];
    } else if (activeTab === 'today_pickups') {
      list = taskMetrics.todayPickups || [];
    } else if (activeTab === 'overdue_deliveries') {
      list = taskMetrics.overdueDeliveries || [];
    } else if (activeTab === 'all_active') {
      list = taskMetrics.allActiveTasks || [];
    }

    // Apply Time Slot filter
    if (slotFilter !== 'ALL' && activeTab !== 'overdue_deliveries') {
      list = list.filter(o => {
        const period = normalizePeriod(
          o.deliveryPeriod || o.schedule?.deliveryPeriod || o.deliverySlot || o.schedule?.deliverySlot ||
          o.pickupPeriod || o.schedule?.pickupPeriod || o.pickupSlot || o.schedule?.pickupSlot
        );
        return period === slotFilter;
      });
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => {
        const name = (o.customerName || o.customer?.name || '').toLowerCase();
        const phone = (o.phone || o.customer?.phone || o.whatsapp || '').toLowerCase();
        const num = (o.orderNumber || o.id || '').toLowerCase();
        const slip = (o.manualBillNumber || '').toLowerCase();
        const addr = (o.address || o.customer?.address || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || num.includes(q) || slip.includes(q) || addr.includes(q);
      });
    }

    return list;
  }, [taskMetrics, branchFilteredOrders, activeTab, selectedDate, slotFilter, searchQuery]);

  // Navigate Previous Day / Next Day
  const handleShiftDate = (offsetDays) => {
    const d = new Date(selectedDate || new Date());
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(normalizeDateString(d));
    if (activeTab !== 'daily_calendar') {
      setActiveTab('daily_calendar');
    }
  };

  // Status Management Modal State in Tasks
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedStage, setSelectedStage] = useState('DELIVERED');
  const [statusNote, setStatusNote] = useState('');
  const [sendWhatsAppAlert, setSendWhatsAppAlert] = useState(true);
  const [openPdfAfterUpdate, setOpenPdfAfterUpdate] = useState(false);
  const [collectBalanceOnDelivered, setCollectBalanceOnDelivered] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Open Status Management Dialog
  const handleOpenStatusModal = (order, defaultStage = null) => {
    setStatusModalOrder(order);
    setSelectedStage(defaultStage || (order.customerStage === 'OUT_FOR_DELIVERY' ? 'DELIVERED' : (order.customerStage || order.status || 'CONFIRMED')));
    setStatusNote('');
    setSendWhatsAppAlert(true);
    setOpenPdfAfterUpdate(false);
    setCollectBalanceOnDelivered(true);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!statusModalOrder) return;

    setIsUpdatingStatus(true);
    try {
      const total = Number(statusModalOrder.totalAmount || statusModalOrder.finalPrice || statusModalOrder.priceSnapshot?.finalTotal || 0);
      const isMarkingDelivered = selectedStage === 'DELIVERED';
      const shouldClearBalance = isMarkingDelivered && collectBalanceOnDelivered;

      if (shouldClearBalance) {
        await orderService.updateOrderPayment(statusModalOrder.id, {
          receivedAmount: total,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          markDelivered: true,
          note: `POS Counter collected full balance upon delivery — Marked as PAID & DELIVERED`,
        });
      }

      const updated = await orderService.updateOrderStatus(statusModalOrder.id, {
        customerStage: selectedStage,
        status: selectedStage,
        paymentStatus: shouldClearBalance ? 'PAID' : statusModalOrder.paymentStatus,
        receivedAmount: shouldClearBalance ? total : statusModalOrder.receivedAmount,
        balanceAmount: shouldClearBalance ? 0 : statusModalOrder.balanceAmount,
        note: statusNote || `Status updated to ${selectedStage} from Task Console`,
      });

      success('Status Updated', `Order #${statusModalOrder.orderNumber || statusModalOrder.id} is now ${selectedStage}.`);

      const finishedOrder = { 
        ...statusModalOrder, 
        ...updated, 
        customerStage: selectedStage, 
        status: selectedStage,
        paymentStatus: shouldClearBalance ? 'PAID' : statusModalOrder.paymentStatus,
        receivedAmount: shouldClearBalance ? total : statusModalOrder.receivedAmount,
        balanceAmount: shouldClearBalance ? 0 : statusModalOrder.balanceAmount,
      };

      if (sendWhatsAppAlert) {
        const phone = finishedOrder.phone || finishedOrder.customer?.phone || finishedOrder.whatsapp;
        if (phone) {
          const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === selectedStage) || { label: selectedStage };
          const msg = whatsappNotificationService.buildStatusUpdateMessage(finishedOrder, stageConfig.label, statusNote);
          whatsappNotificationService.openWhatsAppManual(phone, msg);
        }
      }

      if (openPdfAfterUpdate) {
        setReceiptModalOrder(finishedOrder);
      }

      setStatusModalOrder(null);
      await loadOrders();
    } catch (err) {
      error('Update Error', err.message || 'Could not update task status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Mark Delivered
  const handleMarkDelivered = async (order) => {
    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));

    // If there is pending balance, open status modal with collect option pre-checked
    if (balance > 0) {
      handleOpenStatusModal(order, 'DELIVERED');
      return;
    }

    setActionLoadingId(order.id);
    try {
      const updated = await orderService.updateOrderStatus(order.id, 'DELIVERED', 'Delivered at counter / doorstep by POS');
      success('Order Delivered!', `Order #${order.orderNumber || order.id} marked as DELIVERED.`);
      await loadOrders();
    } catch (err) {
      error('Update Failed', err.message || 'Could not update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark Out for Delivery
  const handleMarkOutForDelivery = async (order) => {
    setActionLoadingId(order.id);
    try {
      await orderService.updateOrderStatus(order.id, 'OUT_FOR_DELIVERY', 'Dispatched from POS counter');
      success('Status Updated', `Order #${order.orderNumber || order.id} marked OUT FOR DELIVERY.`);
      await loadOrders();
    } catch (err) {
      error('Update Failed', err.message || 'Could not update order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Send Single WhatsApp Reminder
  const handleSendReminder = (order) => {
    const phone = order.phone || order.customer?.phone || order.whatsapp;
    if (!phone) {
      error('No Phone', 'Customer phone number is missing.');
      return;
    }
    const dDate = normalizeDateString(order.deliveryDate || order.schedule?.deliveryDate);
    const dayLabel = dDate === taskMetrics.todayStr ? 'Today' : dDate === taskMetrics.tomorrowStr ? 'Tomorrow' : formatDate(dDate);
    const msg = whatsappNotificationService.buildDeliveryReminderWhatsAppMessage(order, dayLabel);
    whatsappNotificationService.openWhatsAppManual(phone, msg);
    success('WhatsApp Opened', `Delivery reminder created for ${order.customerName || 'Customer'}.`);
  };

  // Bulk Send Reminders for Currently Selected Date
  const handleBulkSendDateReminders = async () => {
    const targetList = selectedDateStats.orders || [];
    if (targetList.length === 0) {
      info('No Deliveries', `There are no scheduled deliveries for ${selectedDate}.`);
      return;
    }

    setIsBulkSending(true);
    let sentCount = 0;
    try {
      const isTomorrow = selectedDate === taskMetrics.tomorrowStr;
      const isToday = selectedDate === taskMetrics.todayStr;
      const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(selectedDate);

      for (const ord of targetList) {
        const phone = ord.phone || ord.customer?.phone || ord.whatsapp;
        if (phone) {
          const msg = whatsappNotificationService.buildDeliveryReminderWhatsAppMessage(ord, label);
          await whatsappNotificationService.dispatchAutomatedMessage(phone, msg);
          sentCount++;
        }
      }
      success('Bulk Reminders Sent!', `Dispatched delivery reminders for ${sentCount} orders on ${label}.`);
    } catch (err) {
      error('Bulk Dispatch Issue', err.message || 'Some reminders failed to queue.');
    } finally {
      setIsBulkSending(false);
    }
  };

  // Open Google Maps
  const handleOpenGoogleMaps = (order) => {
    const addr = order.address || order.customer?.address;
    if (!addr) {
      error('No Address', 'Customer address not found.');
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
  };

  // Save Reschedule
  const handleSaveReschedule = async () => {
    if (!rescheduleOrder || !newDeliveryDate) return;
    setActionLoadingId(rescheduleOrder.id);
    try {
      await orderService.updateOrderSchedule(rescheduleOrder.id, {
        deliveryDate: newDeliveryDate,
        deliveryPeriod: newDeliveryPeriod,
        deliverySlot: newDeliveryPeriod === 'MORNING' ? 'Morning (8:00 AM - 12:00 PM)' : 
                      newDeliveryPeriod === 'AFTERNOON' ? 'Afternoon (12:00 PM - 4:00 PM)' : 'Evening (4:00 PM - 8:00 PM)'
      });
      success('Rescheduled!', `Delivery moved to ${newDeliveryDate} (${newDeliveryPeriod}).`);
      setRescheduleOrder(null);
      await loadOrders();
    } catch (err) {
      error('Reschedule Failed', err.message || 'Could not reschedule order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // "+ Add New Task" Handler
  const handleCreateNewTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.customerName.trim()) {
      error('Missing Name', 'Please enter customer name.');
      return;
    }
    const cleanPhone = newTaskForm.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      error('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsCreatingTask(true);
    try {
      const seq = await orderService.getNextOrderSequence();
      const orderNum = seq.orderNumber;
      const invoiceNum = seq.invoiceNumber;
      const todayStr = normalizeDateString(new Date());

      const isHomePickup = newTaskForm.taskType === 'HOME_PICKUP';
      const isExpress = newTaskForm.taskType === 'EXPRESS_DELIVERY';
      const estPrice = Number(newTaskForm.estimatedPrice) || 0;

      const taskPayload = {
        id: orderNum,
        orderNumber: orderNum,
        invoiceNumber: invoiceNum,
        isWalkIn: !isHomePickup,
        orderSource: 'OFFLINE_POS',
        terminalId: activeTerminalId || 'counter-1',
        terminalCode: terminal?.code || 'TW-POS-01',
        storeBranch: terminal?.locationName || 'Tech Wash — Main Branch (Manikonda)',
        storeAddress: terminal?.address || 'Hyderabad',
        cashierName: terminal?.assignedOperator || 'Cashier',
        customerName: newTaskForm.customerName.trim().toUpperCase(),
        phone: cleanPhone,
        whatsapp: cleanPhone,
        customer: {
          name: newTaskForm.customerName.trim().toUpperCase(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          storeBranch: terminal?.locationName || 'Main Branch',
        },
        serviceName: newTaskForm.serviceName,
        serviceEmoji: isHomePickup ? '🚚' : isExpress ? '⚡' : '👔',
        pricingType: 'custom',
        totalAmount: estPrice,
        finalPrice: estPrice,
        receivedAmount: 0,
        balanceAmount: estPrice,
        paymentStatus: 'UNPAID',
        customerStage: isHomePickup ? 'PICKUP_SCHEDULED' : 'INSPECTION',
        internalStage: 'RECEIVED_AT_HUB',
        pickupDate: todayStr,
        pickupPeriod: 'MORNING',
        pickupSlot: isHomePickup ? 'Doorstep Scheduled Pickup' : 'In-Store Counter Drop',
        deliveryDate: newTaskForm.deliveryDate || todayStr,
        deliveryPeriod: newTaskForm.deliveryPeriod || 'MORNING',
        deliverySlot: newTaskForm.deliveryPeriod === 'MORNING' ? 'Morning (8:00 AM - 12:00 PM)' : 
                      newTaskForm.deliveryPeriod === 'AFTERNOON' ? 'Afternoon (12:00 PM - 4:00 PM)' : 'Evening (4:00 PM - 8:00 PM)',
        notes: newTaskForm.notes || `Direct Task Created at Counter (${newTaskForm.taskType})`,
        adminNotes: `Added via POS Tasks on ${terminal?.name || 'Counter'}`,
        schedule: {
          pickupDate: todayStr,
          pickupPeriod: 'MORNING',
          deliveryDate: newTaskForm.deliveryDate || todayStr,
          deliveryPeriod: newTaskForm.deliveryPeriod || 'MORNING',
        }
      };

      const created = await orderService.createOrder(taskPayload);
      
      window.dispatchEvent(new CustomEvent('techwash-new-order-placed', { detail: created }));
      window.dispatchEvent(new CustomEvent('techwash-order-updated', { detail: created }));

      success('Task Created!', `New task #${created.orderNumber} added for ${created.customerName}.`);

      setNewTaskForm({
        customerName: '',
        phone: '',
        taskType: 'COUNTER_DROP',
        serviceName: 'Premium Dry Cleaning',
        deliveryDate: normalizeDateString(new Date()),
        deliveryPeriod: 'MORNING',
        estimatedPrice: '',
        notes: '',
      });
      setIsAddTaskOpen(false);
      await loadOrders();
    } catch (err) {
      error('Task Creation Error', err.message || 'Failed to add task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const isTodaySelected = selectedDate === taskMetrics.todayStr;
  const isTomorrowSelected = selectedDate === taskMetrics.tomorrowStr;
  const selectedDateLabel = isTodaySelected ? 'Today' : isTomorrowSelected ? 'Tomorrow' : formatDate(selectedDate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
      <div 
        className="w-full max-w-6xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* ── TOP HEADER ── */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Delivery Schedule & Task Dispatcher
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  Day-Wise Calendar
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
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Delivery List Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards View</span>
              </button>
            </div>

            {/* "+ Add New Task" Button */}
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Tasks"
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

        {/* ── TOP PRIMARY TABS ── */}
        <div className="p-3 sm:px-5 sm:py-2.5 border-b border-slate-800 bg-slate-950/60 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          
          {/* Tab 1: ALL DELIVERIES (Complete Schedule List) */}
          <button
            type="button"
            onClick={() => setActiveTab('all_deliveries')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'all_deliveries'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚚 All Deliveries</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'all_deliveries' ? 'bg-white text-slate-950' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {branchFilteredOrders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length}
            </span>
          </button>

          {/* Tab 2: Day-Wise Calendar Picker */}
          <button
            type="button"
            onClick={() => setActiveTab('daily_calendar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'daily_calendar'
                ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>📅 Day Calendar</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'daily_calendar' ? 'bg-slate-950 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {selectedDateStats.count}
            </span>
          </button>

          {/* Tab 3: Tomorrow Deliveries (1-Click check tomorrow) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('tomorrow_deliveries');
              setSelectedDate(taskMetrics.tomorrowStr);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tomorrow_deliveries'
                ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tomorrow Deliveries</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'tomorrow_deliveries' ? 'bg-slate-950 text-white' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              {taskMetrics.tomorrowDeliveries?.length || 0}
            </span>
          </button>

          {/* Tab 4: Today Deliveries */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('today_deliveries');
              setSelectedDate(taskMetrics.todayStr);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'today_deliveries'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today Deliveries</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'today_deliveries' ? 'bg-slate-950 text-white' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {taskMetrics.todayDeliveries?.length || 0}
            </span>
          </button>

          {/* Tab 5: Today Drops & Pickups */}
          <button
            type="button"
            onClick={() => setActiveTab('today_pickups')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'today_pickups'
                ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Drops & Pickups</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'today_pickups' ? 'bg-slate-950 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {taskMetrics.todayPickups?.length || 0}
            </span>
          </button>

          {/* Tab 6: All Active Tasks */}
          <button
            type="button"
            onClick={() => setActiveTab('all_active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'all_active'
                ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-400/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'all_active' ? 'bg-slate-950 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              {taskMetrics.allActiveTasks?.length || 0}
            </span>
          </button>

          {/* Tab 7: Overdue */}
          {taskMetrics.overdueDeliveries?.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('overdue_deliveries')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'overdue_deliveries'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/40'
                  : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-200 text-[10px] font-mono font-bold">
                {taskMetrics.overdueDeliveries?.length || 0}
              </span>
            </button>
          )}
        </div>

        {/* ── DAY-WISE CALENDAR HORIZONTAL STRIP ── */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 shrink-0 space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Delivery Date Filter:</span>
              </span>

              {/* Prev / Next Date Navigation */}
              <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Direct Native Date Picker */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setActiveTab('daily_calendar');
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-orange-400 outline-none focus:border-orange-500 cursor-pointer"
                  title="Pick Any Date on Calendar"
                />
              </div>
            </div>

            {/* Bulk Reminder Button for This Date */}
            {selectedDateStats.count > 0 && activeTab === 'daily_calendar' && (
              <button
                type="button"
                onClick={handleBulkSendDateReminders}
                disabled={isBulkSending}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Remind All for {selectedDateLabel} ({selectedDateStats.count})</span>
              </button>
            )}

            {/* Total Balance Due on Selected Filter */}
            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{activeTaskList.length}</strong> deliveries
            </div>
          </div>

          {/* 10-Day Calendar Strip Pills + All Dates Pill */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            
            {/* Pill 0: All Dates / Complete Delivery List */}
            <button
              type="button"
              onClick={() => setActiveTab('all_deliveries')}
              className={`px-3 py-2 rounded-2xl border text-center transition-all shrink-0 cursor-pointer flex flex-col items-center justify-between min-w-[78px] ${
                activeTab === 'all_deliveries'
                  ? 'bg-gradient-to-b from-blue-600/40 to-indigo-600/30 border-blue-500 text-white ring-2 ring-blue-400/40 shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-[10px] font-bold tracking-tight">🌐 All Schedule</span>
              <span className="text-sm font-black font-mono my-0.5">All Dates</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'all_deliveries' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-300'
              }`}>
                {branchFilteredOrders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length} all
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
                  className={`px-3 py-2 rounded-2xl border text-center transition-all shrink-0 cursor-pointer flex flex-col items-center justify-between min-w-[76px] ${
                    isSelected
                      ? 'bg-gradient-to-b from-emerald-500/30 to-teal-500/20 border-emerald-500 text-white ring-2 ring-emerald-400/40 shadow-md'
                      : day.isToday
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 hover:bg-amber-500/20'
                      : day.isTomorrow
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/20'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-tight">
                    {day.dayName}
                  </span>
                  <span className="text-sm font-black font-mono my-0.5">
                    {day.dayNumber} {day.monthName}
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950'
                      : day.count > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {day.count} {day.count === 1 ? 'deliv' : 'delivs'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time-of-Day Slots & Branch Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Time Slots Filter */}
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSlotFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    slotFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Times ({activeTab === 'daily_calendar' ? selectedDateStats.count : activeTaskList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('MORNING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    slotFilter === 'MORNING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  <span>🌅 Morning (8AM-12PM)</span>
                  {activeTab === 'daily_calendar' && (
                    <span className="font-mono text-[10px]">({selectedDateStats.morning})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('AFTERNOON')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    slotFilter === 'AFTERNOON' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-orange-400'
                  }`}
                >
                  <span>☀️ Afternoon (12PM-4PM)</span>
                  {activeTab === 'daily_calendar' && (
                    <span className="font-mono text-[10px]">({selectedDateStats.afternoon})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter('EVENING')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                    slotFilter === 'EVENING' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-indigo-400'
                  }`}
                >
                  <span>🌙 Evening (4PM-8PM)</span>
                  {activeTab === 'daily_calendar' && (
                    <span className="font-mono text-[10px]">({selectedDateStats.evening})</span>
                  )}
                </button>
              </div>

              {/* Branch Filter */}
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setBranchFilter('LOCAL')}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    branchFilter === 'LOCAL' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  This Branch ({terminal?.code || 'Local'})
                </button>
                <button
                  type="button"
                  onClick={() => setBranchFilter('ALL')}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    branchFilter === 'ALL' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Stores
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
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

        {/* ── TASK CARDS LIST ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading delivery schedule...</p>
            </div>
          ) : activeTaskList.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-400 bg-slate-950/60 rounded-3xl border border-slate-800 max-w-lg mx-auto my-6 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 text-emerald-400 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  No deliveries scheduled for {activeTab === 'daily_calendar' ? selectedDateLabel : activeTab.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                  You have <strong className="text-orange-400 font-bold">{branchFilteredOrders.filter(o => o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED').length} active deliveries</strong> across other dates. Quick jump below:
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('all_deliveries')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>View All Deliveries</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('today_deliveries');
                    setSelectedDate(taskMetrics.todayStr);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Today ({taskMetrics.todayDeliveries?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tomorrow_deliveries');
                    setSelectedDate(taskMetrics.tomorrowStr);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Tomorrow ({taskMetrics.tomorrowDeliveries?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskForm(prev => ({ ...prev, deliveryDate: selectedDate }));
                    setIsAddTaskOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Schedule for this Date</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* ── HIGH-DENSITY DELIVERY TABLE / LIST VIEW ── */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">Order / Slip</th>
                    <th className="py-3 px-3 whitespace-nowrap">Customer</th>
                    <th className="py-3 px-3 whitespace-nowrap">Delivery Date & Window</th>
                    <th className="py-3 px-3 whitespace-nowrap">Service & Items</th>
                    <th className="py-3 px-3 whitespace-nowrap">Stage</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Payment</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeTaskList.map((order) => {
                    const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
                    const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                    const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));
                    
                    const period = normalizePeriod(
                      order.deliveryPeriod || order.schedule?.deliveryPeriod || order.deliverySlot || order.schedule?.deliverySlot
                    );
                    const scheduledDate = normalizeDateString(order.deliveryDate || order.schedule?.deliveryDate || order.pickupDate);
                    const isToday = scheduledDate === taskMetrics.todayStr;
                    const isTomorrow = scheduledDate === taskMetrics.tomorrowStr;
                    const isOverdue = scheduledDate && scheduledDate < taskMetrics.todayStr;

                    const isDelivered = order.customerStage === 'DELIVERED' || order.status === 'DELIVERED';
                    const isOut = order.customerStage === 'OUT_FOR_DELIVERY' || order.status === 'OUT_FOR_DELIVERY';
                    const currentStage = order.customerStage || order.status || 'INSPECTION';

                    return (
                      <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                        {/* Order / Slip */}
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

                        {/* Delivery Schedule */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                              isOverdue 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                : isToday
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isTomorrow
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {isOverdue && '⚠️ '}
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(scheduledDate)}
                            </span>
                            <span className="text-[11px]" title={period}>
                              {period === 'MORNING' ? '🌅 8-12' : period === 'AFTERNOON' ? '☀️ 12-4' : '🌙 4-8'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleOrder(order);
                              setNewDeliveryDate(scheduledDate || new Date().toISOString().split('T')[0]);
                              setNewDeliveryPeriod(period || 'MORNING');
                            }}
                            className="mt-1 text-[10px] text-orange-400 hover:text-orange-300 hover:underline cursor-pointer block"
                          >
                            Reschedule slot
                          </button>
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

                        {/* Status */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(order)}
                            className="group flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-800/80 transition cursor-pointer text-left"
                            title="Click to change order status"
                          >
                            <StatusBadge status={currentStage} />
                            <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
                          </button>
                        </td>

                        {/* Payment & Balance */}
                        <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-mono">
                          <div className="text-slate-300 font-bold">₹{total}</div>
                          <div className={`text-[10px] font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {balance > 0 ? `₹${balance} Due` : '✅ Paid'}
                          </div>
                        </td>

                        {/* Fast Actions */}
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
                            {!isDelivered ? (
                              <button
                                type="button"
                                disabled={actionLoadingId === order.id}
                                onClick={() => isOut ? handleMarkDelivered(order) : handleMarkOutForDelivery(order)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                                  isOut
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                                title={isOut ? 'Mark Delivered' : 'Mark Out for Delivery'}
                              >
                                {actionLoadingId === order.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{isOut ? 'Delivered' : 'Out'}</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                Delivered
                              </span>
                            )}

                            {/* WA Reminder */}
                            <button
                              type="button"
                              onClick={() => handleSendReminder(order)}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition cursor-pointer"
                              title="Send WhatsApp Delivery Reminder"
                            >
                              <Send className="w-3 h-3" />
                            </button>

                            {/* Phone Call */}
                            {order.phone && (
                              <a
                                href={`tel:${order.phone}`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Call Customer"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}

                            {/* Receipt */}
                            <button
                              type="button"
                              onClick={() => setReceiptModalOrder(order)}
                              className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 transition cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── CARDS GRID VIEW ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeTaskList.map((order) => {
                const total = Number(order.totalAmount || order.finalPrice || order.priceSnapshot?.finalTotal || 0);
                const received = Number(order.receivedAmount !== undefined ? order.receivedAmount : (order.paymentStatus === 'PAID' ? total : 0));
                const balance = Number(order.balanceAmount !== undefined ? order.balanceAmount : Math.max(0, total - received));
                
                const period = normalizePeriod(
                  order.deliveryPeriod || order.schedule?.deliveryPeriod || order.deliverySlot || order.schedule?.deliverySlot
                );
                const scheduledDate = order.deliveryDate || order.schedule?.deliveryDate || order.pickupDate;

                const isDelivered = order.customerStage === 'DELIVERED' || order.status === 'DELIVERED';
                const isOut = order.customerStage === 'OUT_FOR_DELIVERY' || order.status === 'OUT_FOR_DELIVERY';
                const currentStage = order.customerStage || order.status || 'INSPECTION';

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      {/* Top Header: Order #, Bill #, Status */}
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
                          <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
                        </button>
                      </div>

                      {/* Scheduled Window Banner */}
                      <div className={`p-2.5 rounded-xl border mb-2.5 flex items-center justify-between gap-2 text-xs ${
                        period === 'MORNING'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : period === 'AFTERNOON'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {period === 'MORNING' ? '🌅' : period === 'AFTERNOON' ? '☀️' : '🌙'}
                          </span>
                          <div>
                            <div className="font-bold text-[11px]">
                              Expected Delivery
                            </div>
                            <div className="text-[10px] opacity-80 font-mono">
                              {scheduledDate} • {period}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleOrder(order);
                            setNewDeliveryDate(scheduledDate || new Date().toISOString().split('T')[0]);
                            setNewDeliveryPeriod(period || 'MORNING');
                          }}
                          className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white transition cursor-pointer"
                          title="Reschedule this task"
                        >
                          Reschedule
                        </button>
                      </div>

                      {/* Items, Address & Financials */}
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
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1" title={order.address}>
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

                    {/* ── ACTION BUTTONS ── */}
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

                      {/* Mark Out For Delivery / Delivered */}
                      {!isDelivered && (
                        <button
                          type="button"
                          disabled={actionLoadingId === order.id}
                          onClick={() => isOut ? handleMarkDelivered(order) : handleMarkOutForDelivery(order)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 ${
                            isOut
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          {actionLoadingId === order.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isOut ? 'Mark Delivered' : 'Out for Deliv'}</span>
                            </>
                          )}
                        </button>
                      )}

                      {isDelivered && (
                        <div className="flex-1 py-1 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </div>
                      )}

                      {/* Remind WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(order)}
                        className="p-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Send WhatsApp Delivery Reminder"
                      >
                        <Send className="w-3 h-3" />
                        <span>WA</span>
                      </button>

                      {/* Phone Call */}
                      {order.phone && (
                        <a
                          href={`tel:${order.phone}`}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Maps */}
                      {order.address && (
                        <button
                          type="button"
                          onClick={() => handleOpenGoogleMaps(order)}
                          className="p-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 transition cursor-pointer"
                          title="Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Print Receipt */}
                      <button
                        type="button"
                        onClick={() => setReceiptModalOrder(order)}
                        className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 transition cursor-pointer"
                        title="Print Receipt"
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

        {/* ── "+ ADD NEW TASK" POPUP MODAL ── */}
        {isAddTaskOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Add New Store Task</h3>
                    <p className="text-xs text-slate-400">Add a pickup, express order, or service task to {terminal?.name || 'Counter'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="text-slate-400 hover:text-white text-sm p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateNewTask} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SURESH REDDY"
                      value={newTaskForm.customerName}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, customerName: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500 uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mobile / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={newTaskForm.phone}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Task Category</label>
                    <select
                      value={newTaskForm.taskType}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, taskType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="COUNTER_DROP">🧺 Counter Drop / Intake</option>
                      <option value="HOME_PICKUP">🚚 Doorstep Pickup Request</option>
                      <option value="EXPRESS_DELIVERY">⚡ Express 24H Delivery</option>
                      <option value="SPECIAL_CARE">👔 Stain Treatment / Special Care</option>
                      <option value="ALTERATION">🧵 Alteration & Tailoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Service Type</label>
                    <select
                      value={newTaskForm.serviceName}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, serviceName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="Premium Dry Cleaning">Premium Dry Cleaning</option>
                      <option value="Wash & Fold">Wash & Fold</option>
                      <option value="Wash & Steam Iron">Wash & Steam Iron</option>
                      <option value="Steam Press Only">Steam Press Only</option>
                      <option value="Premium Saree Care">Premium Saree Care</option>
                      <option value="Curtains & Drapes Care">Curtains & Drapes Care</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Target Delivery Date</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setNewTaskForm({ ...newTaskForm, deliveryDate: normalizeDateString(new Date()) })}
                          className="text-[10px] text-orange-400 hover:underline font-bold"
                        >
                          Today
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const tmrw = new Date();
                            tmrw.setDate(tmrw.getDate() + 1);
                            setNewTaskForm({ ...newTaskForm, deliveryDate: normalizeDateString(tmrw) });
                          }}
                          className="text-[10px] text-orange-400 hover:underline font-bold"
                        >
                          +1 Day
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={newTaskForm.deliveryDate}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, deliveryDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Time Window</label>
                    <select
                      value={newTaskForm.deliveryPeriod}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, deliveryPeriod: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="MORNING">🌅 Morning (8AM - 12PM)</option>
                      <option value="AFTERNOON">☀️ Afternoon (12PM - 4PM)</option>
                      <option value="EVENING">🌙 Evening (4PM - 8PM)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Est. Amount (₹, Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 350"
                      value={newTaskForm.estimatedPrice}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, estimatedPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Special Notes / Garment Details</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Silk Shirts, remove collar stain"
                      value={newTaskForm.notes}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTaskOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingTask ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create & Add Task</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── RESCHEDULE POPUP MODAL ── */}
        {rescheduleOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Reschedule Task</h3>
                <button
                  type="button"
                  onClick={() => setRescheduleOrder(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">New Delivery Date</label>
                  <input
                    type="date"
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Time Period</label>
                  <select
                    value={newDeliveryPeriod}
                    onChange={(e) => setNewDeliveryPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                  >
                    <option value="MORNING">🌅 Morning (8AM - 12PM)</option>
                    <option value="AFTERNOON">☀️ Afternoon (12PM - 4PM)</option>
                    <option value="EVENING">🌙 Evening (4PM - 8PM)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleOrder(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReschedule}
                  className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white cursor-pointer"
                >
                  Save Reschedule
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

                {/* If Marking as Delivered and balance is due: Collect Cash Option */}
                {selectedStage === 'DELIVERED' && Number(statusModalOrder.balanceAmount || 0) > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={collectBalanceOnDelivered}
                        onChange={(e) => setCollectBalanceOnDelivered(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-300">
                        Collect Remaining Cash of ₹{statusModalOrder.balanceAmount} & Mark as PAID
                      </span>
                    </label>
                    <p className="text-[11px] text-emerald-400/80 pl-6">
                      Automatically records payment receipt, clears the outstanding balance to ₹0, and marks order as PAID & DELIVERED.
                    </p>
                  </div>
                )}

                {/* Stage Update Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Update Note / Internal Remark (Optional):
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g. Delivered at customer doorstep / handed over to security"
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
        {receiptModalOrder && (
          <ReceiptModal
            isOpen={Boolean(receiptModalOrder)}
            order={receiptModalOrder}
            onClose={() => setReceiptModalOrder(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PosTasksModal;
