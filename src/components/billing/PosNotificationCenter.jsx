import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  FileText, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Truck, 
  X, 
  Trash2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  playOrderPlacedSound, 
  testOrderPlacedSound, 
  isAudioNotificationEnabled, 
  setAudioNotificationEnabled,
  requestSystemNotificationPermission,
  showSystemNotification
} from '../../utils/audioNotification';
import { generateInvoicePDFBlob } from '../../services/pdfInvoiceGenerator';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const STORAGE_KEY = 'techwash_pos_notifications_v1';

export const PosNotificationCenter = ({
  terminal = null,
  activeTerminalId = 'counter-1',
  onOpenOrder = null,
  onOpenReceipt = null,
  onOpenCollect = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'BILLS' | 'DUES' | 'READY'
  const [isAudioMuted, setIsAudioMuted] = useState(!isAudioNotificationEnabled());
  const [isChiming, setIsChiming] = useState(false);
  const [hasPermission, setHasPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const containerRef = useRef(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to cache notifications:', e);
    }
  }, [notifications]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [isOpen]);

  const addNotification = useCallback((notif) => {
    const newEntry = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      unread: true,
      terminalId: activeTerminalId,
      ...notif
    };

    setNotifications(prev => [newEntry, ...prev].slice(0, 50));

    // Visual chime trigger
    setIsChiming(true);
    setTimeout(() => setIsChiming(false), 2500);

    // Play Audio Chime
    playOrderPlacedSound(newEntry.title, {
      body: newEntry.message,
      tag: newEntry.id,
    });
  }, [activeTerminalId]);

  // Listen to Global POS Events
  useEffect(() => {
    const handleNewOrder = (e) => {
      const ord = e?.detail?.order || e?.detail;
      if (!ord) return;

      const billNum = ord.orderNumber || ord.id || 'TW-New';
      const custName = ord.customerName || ord.customer?.name || 'Customer';
      const total = Number(ord.totalAmount || ord.finalPrice || 0);
      const isPaid = ord.paymentStatus === 'PAID';

      addNotification({
        type: 'BILL',
        icon: 'BILL',
        title: `🧾 New Bill Generated: #${billNum}`,
        message: `${custName} • ${formatCurrency(total)} (${ord.paymentMethod || 'CASH'})${isPaid ? ' — PAID' : ' — DUE'}`,
        order: ord,
        orderId: ord.id || billNum,
      });
    };

    const handlePayment = (e) => {
      const detail = e?.detail || {};
      const orderId = detail.orderId || 'Order';
      const amt = detail.amount || 0;

      addNotification({
        type: 'DUE',
        icon: 'PAYMENT',
        title: `💵 Payment Settled: #${orderId}`,
        message: `Collected ${formatCurrency(amt)} at counter.`,
        orderId,
      });
    };

    const handleOrderUpdated = (e) => {
      const detail = e?.detail || {};
      if (detail.status === 'READY_FOR_DELIVERY' || detail.customerStage === 'READY_FOR_DELIVERY') {
        addNotification({
          type: 'READY',
          icon: 'READY',
          title: `✨ Garments Ready for Handover: #${detail.orderId || 'Bill'}`,
          message: 'Quality check completed. Ready for customer pickup.',
          orderId: detail.orderId,
        });
      }
    };

    window.addEventListener('techwash-new-order-placed', handleNewOrder);
    window.addEventListener('techwash-order-payment-updated', handlePayment);
    window.addEventListener('techwash-order-updated', handleOrderUpdated);

    return () => {
      window.removeEventListener('techwash-new-order-placed', handleNewOrder);
      window.removeEventListener('techwash-order-payment-updated', handlePayment);
      window.removeEventListener('techwash-order-updated', handleOrderUpdated);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleMute = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    setAudioNotificationEnabled(!nextState);
  };

  const handleRequestPush = async () => {
    const res = await requestSystemNotificationPermission();
    setHasPermission(res === 'granted');
    if (res === 'granted') {
      showSystemNotification('✅ Notifications Enabled', {
        body: 'Tech Wash real-time counter alerts are now active on your Windows PC.'
      });
    }
  };

  const handleOpenPdf = (order) => {
    if (!order) return;
    try {
      const blob = generateInvoicePDFBlob(order);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.warn('PDF open error:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'BILLS') return n.type === 'BILL';
    if (filterTab === 'DUES') return n.type === 'DUE';
    if (filterTab === 'READY') return n.type === 'READY';
    return true;
  });

  return (
    <div className="relative" ref={containerRef}>
      {/* ── NOTIFICATION BELL BUTTON ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => !prev);
          if (!isOpen && unreadCount > 0) {
            markAllRead();
          }
        }}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
          isChiming
            ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
            : isOpen
            ? 'bg-indigo-600 text-white shadow-md'
            : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
        }`}
        title="POS Real-Time Notifications & Counter Alerts"
      >
        <Bell className={`w-4 h-4 ${isChiming ? 'animate-bounce text-slate-950 font-bold' : ''}`} />
        
        {/* Animated Ping Wave */}
        {isChiming && (
          <span className="absolute -top-1 -left-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
        )}

        {/* Live Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-scale-up">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── ADVANCED NOTIFICATION DRAWER / DROPDOWN ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-scale-up">
          
          {/* Header Strip */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>POS Notifications</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                    {terminal?.code || 'POS'}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts up to date'}
                </p>
              </div>
            </div>

            {/* Quick Sound & Push Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isAudioMuted 
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
                title={isAudioMuted ? 'Sound Muted — Click to Enable Chime' : 'Sound Active — Click to Mute'}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => testOrderPlacedSound()}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
                title="Test Counter Audio Chime"
              >
                Test Sound
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Push Banner (if not granted) */}
          {!hasPermission && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="px-3 py-2 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between gap-2 text-[11px] text-indigo-300">
              <span className="truncate">Enable native desktop popups for new bills:</span>
              <button
                type="button"
                onClick={handleRequestPush}
                className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shrink-0 cursor-pointer shadow-xs"
              >
                Enable Push
              </button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 text-xs overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTab === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('BILLS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTab === 'BILLS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🧾 Bills
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('DUES')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTab === 'DUES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              💵 Payments
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('READY')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                filterTab === 'READY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ Ready
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-[10px] text-slate-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                title="Clear all notifications"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto max-h-[55vh] p-2 space-y-1.5 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-30 text-indigo-400" />
                <p className="text-xs">No notifications in this view.</p>
                <p className="text-[10px] text-slate-600">New counter bills and stage alerts will ring here automatically.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isBill = notif.type === 'BILL';
                const isDue = notif.type === 'DUE';
                const isReady = notif.type === 'READY';

                return (
                  <div
                    key={notif.id}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      notif.unread
                        ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isBill ? 'bg-emerald-500/20 text-emerald-400' :
                          isDue ? 'bg-amber-500/20 text-amber-400' :
                          isReady ? 'bg-teal-500/20 text-teal-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {isBill ? '🧾' : isDue ? '💵' : isReady ? '✨' : '🔔'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-500 block mt-1">
                            {formatDateTime(notif.timestamp)}
                          </span>
                        </div>
                      </div>

                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Action Toolbar for Order Notifications */}
                    {notif.order && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(notif.order)}
                          className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Open Official 1-Page Tax Invoice PDF"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF Invoice</span>
                        </button>

                        {onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenReceipt(notif.order);
                              setIsOpen(false);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Thermal Print Receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}

                        {onOpenOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenOrder(notif.order);
                              setIsOpen(false);
                            }}
                            className="ml-auto text-[10px] text-slate-400 hover:text-white font-medium flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Zero-Loss POS Sync Active</span>
            </div>
            <span>Auto-cleared after 50 alerts</span>
          </div>

        </div>
      )}
    </div>
  );
};

export default PosNotificationCenter;
