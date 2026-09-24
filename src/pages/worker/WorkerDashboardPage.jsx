import React, { useState, useEffect, useCallback } from 'react';
import { useWorkerAuth } from '../../context/WorkerAuthContext';
import { useToast } from '../../context/ToastContext';
import { orderService, ORDER_CUSTOMER_STAGES } from '../../services/orderService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { testOrderPlacedSound } from '../../utils/audioNotification';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import confetti from 'canvas-confetti';
import { 
  Bike, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  LogOut, 
  Volume2, 
  Search, 
  ShieldCheck, 
  Package, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  Scale, 
  ExternalLink,
  ChevronRight,
  Send,
  Truck,
  Check,
  X,
  FileText,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

export const WorkerDashboardPage = () => {
  const { currentWorker, logout, toggleDuty, isOnDuty } = useWorkerAuth();
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [pickupBagCount, setPickupBagCount] = useState(1);
  const [pickupWeight, setPickupWeight] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');

  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('CASH');
  const [deliveryAmountCollected, setDeliveryAmountCollected] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [noteModalOrder, setNoteModalOrder] = useState(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete / Unassign task modal state
  const [deleteModalAction, setDeleteModalAction] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isChiming, setIsChiming] = useState(false);

  useEffect(() => {
    const handleSoundPlayed = () => {
      setIsChiming(true);
      setTimeout(() => setIsChiming(false), 3500);
    };
    window.addEventListener('techwash-sound-played', handleSoundPlayed);
    return () => window.removeEventListener('techwash-sound-played', handleSoundPlayed);
  }, []);

  const handleExecuteAction = async () => {
    if (!deleteModalAction) return;
    setIsActionLoading(true);
    try {
      if (deleteModalAction.type === 'UNASSIGN') {
        await orderService.unassignWorkerFromOrder(deleteModalAction.order.id, `Unassigned by ${currentWorker.name}`);
        success('Task Unassigned', `Order #${deleteModalAction.order.orderNumber} returned to dispatch pool.`);
      } else if (deleteModalAction.type === 'REMOVE' || deleteModalAction.type === 'DELETE') {
        await orderService.unassignWorkerFromOrder(deleteModalAction.order.id, `Dismissed by rider ${currentWorker.name}`);
        success('Task Removed', `Order #${deleteModalAction.order.orderNumber} removed from your task list.`);
      } else if (deleteModalAction.type === 'CLEAR_COMPLETED') {
        const completed = orders.filter(o => o.customerStage === 'DELIVERED' || o.customerStage === 'RECEIVED_AT_HUB');
        await Promise.all(
          completed.map(o => orderService.unassignWorkerFromOrder(o.id, `Cleared from queue by ${currentWorker.name}`))
        );
        success('History Cleared', `Cleared ${completed.length} completed task(s) from your queue.`);
      }
      setDeleteModalAction(null);
      loadWorkerOrders(true);
    } catch (err) {
      error('Action Failed', err.message || 'Failed to complete action');
    } finally {
      setIsActionLoading(false);
    }
  };

  const loadWorkerOrders = useCallback(async (quiet = false) => {
    if (!currentWorker?.id) return;
    if (!quiet) setLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await orderService.getOrdersForWorker(currentWorker.id, {
        search: searchQuery
      });
      setOrders(data);
    } catch (e) {
      console.warn("Failed to load worker tasks:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentWorker?.id, searchQuery]);

  useEffect(() => {
    loadWorkerOrders();
  }, [loadWorkerOrders]);

  // Real-time event listener for newly assigned tasks
  useEffect(() => {
    const handleTaskRefresh = () => {
      loadWorkerOrders(true);
    };

    window.addEventListener('techwash-worker-refresh-tasks', handleTaskRefresh);
    window.addEventListener('techwash-worker-order-assigned', handleTaskRefresh);
    return () => {
      window.removeEventListener('techwash-worker-refresh-tasks', handleTaskRefresh);
      window.removeEventListener('techwash-worker-order-assigned', handleTaskRefresh);
    };
  }, [loadWorkerOrders]);

  // Handle stage transition (Start Navigation, Drop off at Hub, Start Delivery)
  const handleUpdateStage = async (order, stageKey, note = '') => {
    setIsUpdating(true);
    try {
      const stageConfig = ORDER_CUSTOMER_STAGES.find(s => s.key === stageKey) || { label: stageKey };
      const updated = await orderService.updateOrderStatus(order.id, {
        customerStage: stageKey,
        status: stageKey,
        note: note || `Rider ${currentWorker.name}: ${stageConfig.label}`,
      });

      success('Task Updated!', `Order #${order.orderNumber} updated to ${stageConfig.label}.`);
      loadWorkerOrders(true);
    } catch (err) {
      error('Update Error', err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Pickup Modal Submission
  const handleConfirmPickup = async (e) => {
    e.preventDefault();
    if (!pickupModalOrder) return;
    setIsUpdating(true);

    try {
      const note = `Picked up ${pickupBagCount} bag(s) from customer.${pickupWeight ? ` Weight: ${pickupWeight} kg.` : ''} ${pickupNotes ? ` Note: ${pickupNotes}` : ''}`;
      
      await orderService.updateOrderStatus(pickupModalOrder.id, {
        customerStage: 'PICKED_UP',
        status: 'PICKED_UP',
        actualWeight: pickupWeight !== '' ? Number(pickupWeight) : undefined,
        note: note.trim(),
      });

      success('Pickup Confirmed!', `Order #${pickupModalOrder.orderNumber} marked as Picked Up.`);
      setPickupModalOrder(null);
      loadWorkerOrders(true);
    } catch (err) {
      error('Pickup Error', err.message || 'Failed to confirm pickup');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delivery Modal Submission
  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;
    setIsUpdating(true);

    try {
      const note = `Delivered to customer.${deliveryPaymentMethod === 'CASH' ? ` Collected Cash: ₹${deliveryAmountCollected}.` : ' Paid via UPI/Online.'} ${deliveryNotes ? ` Note: ${deliveryNotes}` : ''}`;

      await orderService.updateOrderStatus(deliveryModalOrder.id, {
        customerStage: 'DELIVERED',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        note: note.trim(),
      });

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#10B981', '#F97316', '#7C3AED']
        });
      } catch (err) {}

      success('Delivery Complete! 🎉', `Order #${deliveryModalOrder.orderNumber} successfully delivered and payment recorded.`);
      setDeliveryModalOrder(null);
      loadWorkerOrders(true);
    } catch (err) {
      error('Delivery Error', err.message || 'Failed to complete delivery');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add Custom Rider Note
  const handleSaveQuickNote = async (e) => {
    e.preventDefault();
    if (!noteModalOrder || !quickNoteText.trim()) return;
    setIsUpdating(true);

    try {
      await orderService.updateOrderStatus(noteModalOrder.id, {
        note: `Rider Note: ${quickNoteText.trim()}`,
      });

      success('Note Added', `Recorded note on Order #${noteModalOrder.orderNumber}`);
      setNoteModalOrder(null);
      setQuickNoteText('');
      loadWorkerOrders(true);
    } catch (err) {
      error('Note Error', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Direct Google Maps Navigation
  const handleOpenNavigation = (order) => {
    const lat = order.pickupLocation?.latitude;
    const lng = order.pickupLocation?.longitude;
    const address = order.address || order.customer?.address || `${lat},${lng}`;
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(navUrl, '_blank');
  };

  // Open Direct WhatsApp Chat
  const handleOpenWhatsApp = (order) => {
    const rawPhone = order.whatsapp || order.phone || order.customer?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      error('No Phone', 'No contact phone available for this customer.');
      return;
    }

    const customerName = order.customerName || order.customer?.name || 'Customer';
    const message = `Hello ${customerName}! 👋\n\nI am *${currentWorker.name}*, your Tech Wash delivery executive for order *#${order.orderNumber}* (${order.service || order.serviceName}).\n\nI am en route to your doorstep (${order.address || 'Address'}). Please let me know if you have any landmark directions!\n\n📞 Tech Wash Hotline: 6304845567`;

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filter calculations
  const pendingPickups = orders.filter(o => 
    o.customerStage === 'CONFIRMED' || 
    o.customerStage === 'PICKUP_SCHEDULED'
  );

  const activeDeliveries = orders.filter(o => 
    o.customerStage === 'PACKED' || 
    o.customerStage === 'OUT_FOR_DELIVERY' || 
    o.customerStage === 'CLEANING' ||
    o.customerStage === 'FINISHING'
  );

  const completedHistory = orders.filter(o => 
    o.customerStage === 'DELIVERED' || 
    o.customerStage === 'RECEIVED_AT_HUB'
  );

  const pendingCashToCollect = orders
    .filter(o => o.customerStage !== 'DELIVERED' && o.customerStage !== 'CANCELLED' && o.paymentStatus !== 'PAID')
    .reduce((sum, o) => sum + Number(o.finalPrice || o.priceSnapshot?.finalTotal || o.totalAmount || 0), 0);

  // Tab Filtering
  const filteredOrders = orders.filter(o => {
    if (activeTab === 'PICKUPS') {
      return o.customerStage === 'CONFIRMED' || o.customerStage === 'PICKUP_SCHEDULED';
    }
    if (activeTab === 'DELIVERIES') {
      return o.customerStage === 'PACKED' || o.customerStage === 'OUT_FOR_DELIVERY';
    }
    if (activeTab === 'COMPLETED') {
      return o.customerStage === 'DELIVERED' || o.customerStage === 'RECEIVED_AT_HUB';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A091A] text-white flex flex-col pb-16 font-sans">
      
      {/* 1. TOP MOBILE COMMAND BAR */}
      <header className="bg-[#12102B] border-b border-white/10 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xl backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          
          {/* Worker Profile Avatar & Hub */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#00F0FF] p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-[#0E0C22] rounded-[14px] flex items-center justify-center font-black text-sm text-[#00F0FF]">
                {(currentWorker?.name || 'R')[0].toUpperCase()}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white font-display truncate">
                  {currentWorker?.name || 'Rider'}
                </h1>
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase border border-purple-500/30">
                  {currentWorker?.role || 'Rider'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{currentWorker?.hub || 'Banjara Hills Hub'}</span>
                {currentWorker?.vehicleNumber && (
                  <span className="text-slate-500 font-mono">• {currentWorker.vehicleNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Duty Status Toggle & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDuty}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border ${
                isOnDuty
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isOnDuty ? 'On Duty' : 'Off Duty'}</span>
            </button>

            <button
              type="button"
              onClick={() => testOrderPlacedSound()}
              className={`p-2 rounded-xl transition-all relative ${
                isChiming 
                  ? 'bg-purple-600 text-white border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.7)] animate-pulse' 
                  : 'bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10'
              }`}
              title="Test Chime Sound (/1.mp4)"
            >
              <Volume2 className={`w-4 h-4 ${isChiming ? 'animate-bounce text-cyan-200' : ''}`} />
              {isChiming && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => loadWorkerOrders(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              title="Refresh Task Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Duty Status Warning if Offline */}
        {!isOnDuty && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You are currently <strong>Off Duty</strong>. Toggle to On Duty to receive new orders.</span>
            </div>
            <button
              type="button"
              onClick={toggleDuty}
              className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black uppercase hover:bg-amber-400 transition-colors"
            >
              Go Online
            </button>
          </div>
        )}

        {/* 3. METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-4 rounded-3xl bg-[#14122E] border border-purple-500/20 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Pending Pickups</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-display text-white mt-1">
              {pendingPickups.length}
            </div>
            <div className="text-[10px] text-purple-300/80 mt-0.5">Doorstep collection</div>
          </div>

          <div className="p-4 rounded-3xl bg-[#14122E] border border-cyan-500/20 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Out for Delivery</span>
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-display text-cyan-300 mt-1">
              {activeDeliveries.length}
            </div>
            <div className="text-[10px] text-cyan-300/80 mt-0.5">In-transit dropoffs</div>
          </div>

          <div className="p-4 rounded-3xl bg-[#14122E] border border-emerald-500/20 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-display text-emerald-400 mt-1">
              {completedHistory.length}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">Delivered / At Hub</div>
          </div>

          <div className="p-4 rounded-3xl bg-[#14122E] border border-amber-500/20 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Cash/UPI to Collect</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-display text-amber-400 mt-1">
              {formatCurrency(pendingCashToCollect)}
            </div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">Pay-on-delivery balance</div>
          </div>

        </div>

        {/* 4. FILTER TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'ALL', label: `All Tasks (${orders.length})` },
              { key: 'PICKUPS', label: `Pickups (${pendingPickups.length})` },
              { key: 'DELIVERIES', label: `Deliveries (${activeDeliveries.length})` },
              { key: 'COMPLETED', label: `Done (${completedHistory.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white border-transparent shadow-md'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {completedHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteModalAction({ type: 'CLEAR_COMPLETED' })}
                className="px-3 py-1.5 rounded-2xl text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95"
                title="Clear all completed tasks from queue"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Completed</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

        </div>

        {/* 5. TASK CARDS LIST */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <AdvancedLogoLoader size="md" isDark={true} text="Syncing Dispatch Queue..." subtext="Connecting live to rider dispatch & GPS coordinates" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-[#14122E]/60 border border-purple-500/20 rounded-[32px] p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-cyan-400 flex items-center justify-center mx-auto text-xl">
              🛵
            </div>
            <h3 className="text-base font-bold text-white">No Assigned Tasks in this View</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When an admin dispatches an order to you, it will appear here instantly with sound alerts and turn-by-turn customer location.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const customerName = ord.customerName || ord.customer?.name || 'Customer';
              const phone = ord.phone || ord.customer?.phone || '';
              const address = ord.address || ord.customer?.address || 'Doorstep Pickup';
              const service = ord.service || ord.serviceName || 'Laundry Service';
              const total = ord.finalPrice || ord.priceSnapshot?.finalTotal || ord.totalAmount || 0;
              const isPaid = ord.paymentStatus === 'PAID';
              const isExpress = ord.isExpress || ord.priceSnapshot?.isExpress;

              const isPickupStage = ord.customerStage === 'CONFIRMED' || ord.customerStage === 'PICKUP_SCHEDULED';
              const isPickedUp = ord.customerStage === 'PICKED_UP';
              const isOutForDelivery = ord.customerStage === 'OUT_FOR_DELIVERY';
              const isDelivered = ord.customerStage === 'DELIVERED';

              return (
                <div
                  key={ord.id}
                  className={`bg-[#14122E] border rounded-[28px] p-5 sm:p-6 shadow-xl transition-all space-y-4 relative overflow-hidden ${
                    isDelivered 
                      ? 'border-emerald-500/30 opacity-80' 
                      : isExpress 
                      ? 'border-orange-500/40 ring-1 ring-orange-500/20' 
                      : 'border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  
                  {/* Card Header: Order #, Service, Stage Chip & Speed */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#00F0FF]">
                          #{ord.orderNumber || ord.id}
                        </span>
                        {isExpress && (
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                            ⚡ Express 24h
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase border border-purple-500/30">
                          {ord.customerStage || ord.status || 'CONFIRMED'}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                        <span>{ord.serviceEmoji || '🧺'}</span>
                        <span>{service}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-base sm:text-lg text-white">
                        {formatCurrency(total)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isPaid ? '✓ Paid Online' : '⚠️ Collect at Doorstep'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Contact & GPS Location Card */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    
                    {/* Customer Name & Instant 1-Tap Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Customer
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {customerName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                            title="Direct Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(ord)}
                          className="px-3 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                          title="WhatsApp Concierge Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    {/* Full Address & Landmark */}
                    <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-white/5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium text-white">{address}</span>
                          {ord.landmark && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Landmark: <span className="text-purple-300">{ord.landmark}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scheduled Slot */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Scheduled: {ord.pickupDate || formatDate(ord.createdAt)} ({ord.pickupSlot || 'Standard Slot'})</span>
                      </div>
                    </div>

                    {/* 1-Tap Google Maps GPS Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenNavigation(ord)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span>Open Turn-by-Turn GPS Navigation in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </button>

                  </div>

                  {/* Garment Details & Customer Note */}
                  {(ord.items?.length > 0 || ord.notes || ord.actualWeight) && (
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-300 space-y-1.5">
                      {ord.items?.length > 0 && (
                        <div className="text-[11px] text-slate-400">
                          <strong>Items ({ord.items.length}):</strong> {ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>
                      )}
                      {ord.actualWeight && (
                        <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Inspected Weight: {ord.actualWeight} Kg</span>
                        </div>
                      )}
                      {ord.notes && (
                        <div className="text-amber-300/90 text-[11px] bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          <strong>Customer Note:</strong> {ord.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic Workflow Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setNoteModalOrder(ord);
                          setQuickNoteText('');
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span>Rider Note</span>
                      </button>

                      {isDelivered ? (
                        <button
                          type="button"
                          onClick={() => setDeleteModalAction({ order: ord, type: 'REMOVE' })}
                          title="Remove from your completed list"
                          className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteModalAction({ order: ord, type: 'UNASSIGN' })}
                          title="Unassign / Return task to Dispatch Pool"
                          className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-white/5 hover:border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Unassign</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {/* 1. PICKUP FLOW BUTTONS */}
                      {ord.customerStage === 'CONFIRMED' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStage(ord, 'PICKUP_SCHEDULED')}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Start Pickup Route</span>
                        </button>
                      )}

                      {isPickupStage && (
                        <button
                          type="button"
                          onClick={() => {
                            setPickupModalOrder(ord);
                            setPickupBagCount(1);
                            setPickupWeight('');
                            setPickupNotes('');
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#00F0FF] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Confirm Garment Pickup</span>
                        </button>
                      )}

                      {isPickedUp && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStage(ord, 'RECEIVED_AT_HUB')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Drop at Central Hub</span>
                        </button>
                      )}

                      {/* 2. DELIVERY FLOW BUTTONS */}
                      {ord.customerStage === 'PACKED' && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStage(ord, 'OUT_FOR_DELIVERY')}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Start Delivery Ride</span>
                        </button>
                      )}

                      {isOutForDelivery && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryModalOrder(ord);
                            setDeliveryPaymentMethod(isPaid ? 'ONLINE' : 'CASH');
                            setDeliveryAmountCollected(String(total));
                            setDeliveryNotes('');
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered & Collect Payment</span>
                        </button>
                      )}

                      {isDelivered && (
                        <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>Order Delivered</span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 6. MODAL: CONFIRM PICKUP */}
      {pickupModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161333] border border-purple-500/30 rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  🧺
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Confirm Garment Pickup
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Order #{pickupModalOrder.orderNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickupModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPickup} className="space-y-4">
              
              {/* Bag Count Stepper */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Number of Laundry Bags Collected *
                </label>
                <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPickupBagCount(Math.max(1, pickupBagCount - 1))}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-black text-lg hover:bg-white/20 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-mono font-black text-lg text-white">
                    {pickupBagCount} Bag{pickupBagCount !== 1 ? 's' : ''}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickupBagCount(pickupBagCount + 1)}
                    className="w-10 h-10 rounded-xl bg-white/10 text-white font-black text-lg hover:bg-white/20 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Weight in Kg (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Actual Inspected Weight (Kg) (Optional)
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 4.5"
                  value={pickupWeight}
                  onChange={(e) => setPickupWeight(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Pickup Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Rider Inspection Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3 silk sarees with slight coffee stain near border"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPickupModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  {isUpdating ? 'Saving...' : 'Confirm Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: CONFIRM DELIVERY & PAYMENT */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161333] border border-emerald-500/30 rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    Complete Delivery & Payment
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Order #{deliveryModalOrder.orderNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              
              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Payment Collection Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryPaymentMethod('CASH')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      deliveryPaymentMethod === 'CASH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    💵 Cash Collected
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryPaymentMethod('UPI')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      deliveryPaymentMethod === 'UPI' || deliveryPaymentMethod === 'ONLINE'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    📱 UPI QR / Paid
                  </button>
                </div>
              </div>

              {/* Amount Collected Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Total Amount Collected (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={deliveryAmountCollected}
                  onChange={(e) => setDeliveryAmountCollected(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-3 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Delivery Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Delivery Handover Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handed over directly to customer, paid via PhonePe QR"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  {isUpdating ? 'Completing...' : 'Mark Delivered & Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: RIDER QUICK NOTE */}
      {noteModalOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161333] border border-purple-500/30 rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-display">
                Add Field Note for Order #{noteModalOrder.orderNumber}
              </h3>
              <button
                type="button"
                onClick={() => setNoteModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickNote} className="space-y-4">
              <textarea
                rows={3}
                required
                placeholder="e.g. Customer requested doorstep delivery after 5:30 PM"
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNoteModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: DELETE / UNASSIGN TASK CONFIRMATION */}
      {deleteModalAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161333] border border-purple-500/30 rounded-[32px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white font-display">
                  {deleteModalAction.type === 'CLEAR_COMPLETED'
                    ? 'Clear All Completed Tasks?'
                    : deleteModalAction.type === 'UNASSIGN'
                    ? `Unassign Order #${deleteModalAction.order?.orderNumber}?`
                    : `Remove Order #${deleteModalAction.order?.orderNumber}?`}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {deleteModalAction.type === 'CLEAR_COMPLETED'
                    ? 'This will clear all delivered and completed orders from your field queue.'
                    : deleteModalAction.type === 'UNASSIGN'
                    ? 'This task will be returned to the Admin dispatch queue so another rider can be assigned.'
                    : 'This order will be removed from your active queue.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalAction(null)}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isActionLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isActionLoading
                  ? 'Processing...'
                  : deleteModalAction.type === 'CLEAR_COMPLETED'
                  ? 'Yes, Clear History'
                  : deleteModalAction.type === 'UNASSIGN'
                  ? 'Yes, Unassign Task'
                  : 'Yes, Remove Task'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

