import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService, getOrderBranchKey } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import { 
  ShoppingBag,
  Truck, 
  Wallet, 
  ExternalLink 
} from 'lucide-react';

/**
 * PosQuickNavButtons
 * Dedicated quick-access action buttons for all POS Billing Counters:
 * 1. Orders: In-POS Order Management Hub (live active orders count & direct URL)
 * 2. Tasks: In-POS Task & Delivery Dispatcher (live task count & direct URL)
 * 3. Balances: In-POS Balance Due Collection & Tracker (live due count & direct URL)
 * 
 * Supports full browser URL deep-linking (?view=orders, ?view=tasks, ?view=balances),
 * bookmarking, middle-click / new tab support, and native in-POS modal opening
 * without redirecting to the admin panel or losing active cart state.
 */
export const PosQuickNavButtons = ({ 
  className = '', 
  compact = false,
  showLabelOnMobile = false,
  branchId = null,
  onOpenOrders = null,
  onOpenTasks = null,
  onOpenBalances = null
}) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalTasks: 0,
    todayDeliv: 0,
    todayPick: 0,
    todayIntakes: 0,
    allActive: 0,
    overdue: 0,
    totalBalances: 0,
    totalDueAmount: 0,
    loading: true,
  });

  const getButtonUrl = (viewName) => {
    let base = '/billing';
    if (branchId && branchId !== 'ALL') {
      base = `/billing/${branchId}`;
    } else if (typeof window !== 'undefined' && window.location.pathname.startsWith('/billing/')) {
      base = window.location.pathname;
    }
    return `${base}?view=${viewName}`;
  };

  const handleLinkClick = (e, callback) => {
    // If the user performed modifier click (Ctrl / Meta / Shift) or middle click, allow default browser behavior (new tab)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) {
      return;
    }
    if (callback) {
      e.preventDefault();
      callback();
    }
  };

  const loadStats = useCallback(async () => {
    try {
      const allOrders = await orderService.getOrders({ limitCount: 500 });
      const orders = branchId && branchId !== 'ALL'
        ? allOrders.filter(o => getOrderBranchKey(o) === branchId)
        : allOrders;

      // 1. Orders Metrics
      const totalOrders = orders.length;
      const activeOrdersList = orders.filter(o => {
        if (!o || o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        return o.customerStage !== 'DELIVERED' && o.status !== 'DELIVERED';
      });
      const activeOrders = activeOrdersList.length;

      // 2. Tasks Metrics
      const metrics = orderService.getTaskScheduleMetrics(orders);
      const todayDeliv = metrics.todayDeliveries?.length || 0;
      const todayPick = metrics.todayPickups?.length || 0;
      const overdue = metrics.overdueDeliveries?.length || 0;
      const todayIntakes = metrics.todayIntakes?.length || 0;
      const allActive = metrics.allActiveTasks?.length || 0;
      const totalTasks = allActive || (todayDeliv + todayPick + overdue);

      // 3. Balances Metrics
      const dueOrders = orders.filter((o) => {
        if (!o || o.status === 'CANCELLED' || o.customerStage === 'CANCELLED') return false;
        const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
        const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
        const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));
        return balance > 0 || (o.paymentStatus !== 'PAID' && total > 0);
      });

      const totalBalances = dueOrders.length;
      const totalDueAmount = dueOrders.reduce((sum, o) => {
        const total = Number(o.totalAmount || o.finalPrice || o.priceSnapshot?.finalTotal || 0);
        const received = Number(o.receivedAmount !== undefined ? o.receivedAmount : (o.paymentStatus === 'PAID' ? total : 0));
        const balance = Number(o.balanceAmount !== undefined ? o.balanceAmount : Math.max(0, total - received));
        return sum + balance;
      }, 0);

      setStats({
        totalOrders,
        activeOrders,
        totalTasks,
        todayDeliv,
        todayPick,
        todayIntakes,
        allActive,
        overdue,
        totalBalances,
        totalDueAmount,
        loading: false,
      });
    } catch (err) {
      console.warn('Failed to load POS quick stats:', err);
    }
  }, [branchId]);

  useEffect(() => {
    loadStats();

    // 1. Subscribe to new orders via orderService real-time engine
    const unsubOrders = orderService.subscribeToNewOrders(loadStats);

    // 2. Listen to custom window events triggered when orders or payments are modified
    const eventNames = [
      'techwash-order-updated',
      'techwash-order-payment-updated',
      'techwash-orders-updated',
      'techwash-new-order-placed',
      'techwash-worker-refresh-tasks',
      'techwash-order-deleted'
    ];

    const handleEvent = () => loadStats();
    eventNames.forEach(ev => window.addEventListener(ev, handleEvent));

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      eventNames.forEach(ev => window.removeEventListener(ev, handleEvent));
    };
  }, [loadStats]);

  const ordersButtonClasses = `group relative px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
    stats.activeOrders > 0
      ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-200 shadow-sm shadow-sky-500/10'
      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
  }`;

  const tasksButtonClasses = `group relative px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
    stats.overdue > 0
      ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-200 shadow-sm shadow-amber-500/10'
      : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
  }`;

  const balancesButtonClasses = `group relative px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border select-none ${
    stats.totalBalances > 0
      ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10'
      : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
  }`;

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. ORDER MANAGEMENT BUTTON (WITH URL & LIVE NOTIFICATION)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {onOpenOrders ? (
        <a
          href={getButtonUrl('orders')}
          onClick={(e) => handleLinkClick(e, onOpenOrders)}
          className={ordersButtonClasses}
          title={`In-POS Order Management: ${stats.activeOrders} active orders in progress, ${stats.totalOrders} total counter orders`}
        >
          <div className="relative">
            <ShoppingBag className="w-3.5 h-3.5 transition-transform group-hover:scale-110 text-sky-400" />
            {stats.activeOrders > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Orders
          </span>

          {/* Live Notification Badge Counter */}
          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.activeOrders > 0
                ? 'bg-sky-500 text-slate-950 ring-1 ring-sky-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.activeOrders}
          </span>
        </a>
      ) : (
        <Link
          to="/admin/orders"
          target="_blank"
          rel="noopener noreferrer"
          className={ordersButtonClasses}
          title={`Order Management: ${stats.activeOrders} active orders, ${stats.totalOrders} total`}
        >
          <div className="relative">
            <ShoppingBag className="w-3.5 h-3.5 transition-transform group-hover:scale-110 text-sky-400" />
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Orders
          </span>

          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.activeOrders > 0
                ? 'bg-sky-500 text-slate-950 ring-1 ring-sky-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.activeOrders}
          </span>
          <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity hidden md:inline" />
        </Link>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TODAY'S TASKS BUTTON (WITH URL & LIVE NOTIFICATION)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {onOpenTasks ? (
        <a
          href={getButtonUrl('tasks')}
          onClick={(e) => handleLinkClick(e, onOpenTasks)}
          className={tasksButtonClasses}
          title={`POS Tasks Hub: ${stats.todayDeliv} Deliveries today, ${stats.todayPick} Pickups today, ${stats.overdue} Overdue tasks`}
        >
          <div className="relative">
            <Truck className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              stats.overdue > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            {stats.overdue > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping" />
            )}
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Tasks
          </span>

          {/* Live Notification Badge Counter */}
          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.overdue > 0
                ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400/50'
                : stats.totalTasks > 0
                ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.totalTasks}
          </span>
        </a>
      ) : (
        <Link
          to="/admin/tasks"
          target="_blank"
          rel="noopener noreferrer"
          className={tasksButtonClasses}
          title={`Tasks Hub: ${stats.todayDeliv} Deliveries today, ${stats.todayPick} Pickups today, ${stats.overdue} Overdue tasks`}
        >
          <div className="relative">
            <Truck className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              stats.overdue > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            {stats.overdue > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping" />
            )}
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Tasks
          </span>

          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.overdue > 0
                ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400/50'
                : stats.totalTasks > 0
                ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.totalTasks}
          </span>
          <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity hidden md:inline" />
        </Link>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. DUE BALANCES BUTTON (WITH URL & LIVE NOTIFICATION)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {onOpenBalances ? (
        <a
          href={getButtonUrl('balances')}
          onClick={(e) => handleLinkClick(e, onOpenBalances)}
          className={balancesButtonClasses}
          title={`POS Balance Due Tracker: ${stats.totalBalances} orders with pending balance dues (Total Unpaid: ${formatCurrency(stats.totalDueAmount)})`}
        >
          <div className="relative">
            <Wallet className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              stats.totalBalances > 0 ? 'text-rose-400' : 'text-slate-400'
            }`} />
            {stats.totalBalances > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Balances
          </span>

          {/* Live Notification Badge Counter */}
          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.totalBalances > 0
                ? 'bg-rose-500 text-white ring-1 ring-rose-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.totalBalances}
          </span>
        </a>
      ) : (
        <Link
          to="/admin/balances"
          target="_blank"
          rel="noopener noreferrer"
          className={balancesButtonClasses}
          title={`Balance Tracker: ${stats.totalBalances} orders with pending balance dues (Total Unpaid: ${formatCurrency(stats.totalDueAmount)})`}
        >
          <div className="relative">
            <Wallet className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
              stats.totalBalances > 0 ? 'text-rose-400' : 'text-slate-400'
            }`} />
            {stats.totalBalances > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </div>

          <span className={`text-xs font-bold ${showLabelOnMobile ? 'inline' : 'hidden sm:inline'}`}>
            Balances
          </span>

          <span
            className={`px-1.5 py-0.2 min-w-[20px] rounded-full text-[10px] font-mono font-black text-center shadow-xs transition-all ${
              stats.totalBalances > 0
                ? 'bg-rose-500 text-white ring-1 ring-rose-400/50'
                : 'bg-slate-700/60 text-slate-300'
            }`}
          >
            {stats.loading ? '…' : stats.totalBalances}
          </span>
          <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity hidden md:inline" />
        </Link>
      )}

    </div>
  );
};

export default PosQuickNavButtons;
