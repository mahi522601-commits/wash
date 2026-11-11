import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  PackageCheck
} from 'lucide-react';
import { 
  stopOrderRingingAlarm, 
  getActiveRingingOrders, 
  isOrderRingingActive 
} from '../../utils/audioNotification';
import { orderService } from '../../services/orderService';
import { pickupRequestService } from '../../services/pickupRequestService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const IncomingOrderAlertModal = ({ 
  terminalId = null, // e.g. 'counter-2' or null for Admin
  acceptedByRole = 'Admin Command Center'
}) => {
  const { success, error } = useToast();
  const [ringingOrders, setRingingOrders] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Sync with global ringing orders state
  useEffect(() => {
    const syncOrders = () => {
      const allRinging = getActiveRingingOrders();
      // If scoped to a terminal (e.g. counter-2), only show orders for this terminal
      const filtered = terminalId 
        ? allRinging.filter(o => !o.terminalId || o.terminalId === terminalId || o.isOnlineBooking)
        : allRinging;
      setRingingOrders(filtered);
    };

    syncOrders();

    const handleRingingChange = (e) => {
      const orders = e.detail?.orders || [];
      const filtered = terminalId 
        ? orders.filter(o => !o.terminalId || o.terminalId === terminalId || o.isOnlineBooking)
        : orders;
      setRingingOrders(filtered);
    };

    const handleAccepted = (e) => {
      const acceptedId = e.detail?.orderId || e.detail?.order?.id;
      if (acceptedId) {
        setRingingOrders(prev => prev.filter(o => o.id !== acceptedId && o.orderNumber !== acceptedId));
      }
    };

    window.addEventListener('techwash-ringing-orders-changed', handleRingingChange);
    window.addEventListener('techwash-order-accepted', handleAccepted);

    return () => {
      window.removeEventListener('techwash-ringing-orders-changed', handleRingingChange);
      window.removeEventListener('techwash-order-accepted', handleAccepted);
    };
  }, [terminalId]);

  if (!ringingOrders || ringingOrders.length === 0) {
    return null;
  }

  const currentOrder = ringingOrders[selectedIdx] || ringingOrders[0];
  if (!currentOrder) return null;

  const orderId = currentOrder.id || currentOrder.orderNumber;
  const customerName = currentOrder.customerName || currentOrder.customer?.name || 'Customer';
  const customerPhone = currentOrder.phone || currentOrder.customer?.phone || '';
  const serviceName = currentOrder.serviceName || currentOrder.service || 'Laundry Service';
  const totalAmount = currentOrder.totalAmount || currentOrder.priceSnapshot?.finalTotal || 0;
  const pickupDate = currentOrder.pickupDate || currentOrder.schedule?.pickupDate || 'Scheduled on Demand';
  const pickupSlot = currentOrder.pickupSlot || currentOrder.schedule?.pickupSlot || 'Morning Window';
  const address = currentOrder.address || currentOrder.customer?.address || 'Doorstep Pickup';

  const handleAccept = async (orderToAccept) => {
    const targetId = orderToAccept.id || orderToAccept.orderNumber;
    setAcceptingId(targetId);

    try {
      if (String(targetId).startsWith('TW-PU-')) {
        await pickupRequestService.updatePickupRequestStatus(targetId, 'Confirmed', {
          updatedBy: acceptedByRole,
          note: 'Confirmed from Incoming Ringing Alert Banner'
        });
      } else {
        await orderService.acceptOrder(targetId, acceptedByRole);
      }
      stopOrderRingingAlarm(targetId);
      success('Request Accepted!', `Booking #${orderToAccept.orderNumber || targetId} accepted. Ringing alarm silenced.`);
    } catch (err) {
      console.error('Failed to accept order:', err);
      // Fallback: stop audio locally anyway
      stopOrderRingingAlarm(targetId);
      error('Accept Failed', err.message || 'Could not update order status.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAcceptAll = async () => {
    setAcceptingId('ALL');
    try {
      for (const ord of ringingOrders) {
        const id = ord.id || ord.orderNumber;
        if (String(id).startsWith('TW-PU-')) {
          await pickupRequestService.updatePickupRequestStatus(id, 'Confirmed', {
            updatedBy: acceptedByRole,
            note: 'Confirmed from Incoming Ringing Alert Banner'
          }).catch(() => {});
        } else {
          await orderService.acceptOrder(id, acceptedByRole).catch(() => {});
        }
        stopOrderRingingAlarm(id);
      }
      stopOrderRingingAlarm('ALL');
      success('All Requests Accepted!', `${ringingOrders.length} online requests accepted. Alarm silenced.`);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-rose-500 overflow-hidden transform transition-all animate-bounce-subtle">
        
        {/* Pulsing Alarm Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/30 animate-pulse">
              <Volume2 className="w-7 h-7 animate-wiggle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-200 text-[10px] font-black uppercase tracking-widest border border-rose-400/40">
                  ⚡ Persistent Alarm Active
                </span>
                {ringingOrders.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-white text-rose-900 text-xs font-black">
                    {selectedIdx + 1} of {ringingOrders.length} New Orders
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                Incoming Online Customer Booking!
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0 relative z-10">
            <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider block">Sound Alert</span>
            <span className="inline-flex items-center gap-1 text-xs font-black text-white bg-rose-900/80 px-2.5 py-1 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Ringing...
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-rose-50/50 to-white">
          
          {/* Multiple Orders Tabs */}
          {ringingOrders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-rose-100">
              {ringingOrders.map((ord, idx) => (
                <button
                  key={ord.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedIdx === idx 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  #{ord.orderNumber || ord.id?.slice(-6)} ({ord.customerName?.split(' ')[0] || 'Cust'})
                </button>
              ))}
            </div>
          )}

          {/* Customer & Order Highlight Banner */}
          <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  Order Number: #{currentOrder.orderNumber || orderId}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {customerName}
                </h3>
                {customerPhone && (
                  <a 
                    href={`tel:${customerPhone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{customerPhone}</span>
                  </a>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-[11px] block font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5 border border-amber-200">
                  {currentOrder.paymentMethod === 'PAY_ON_DELIVERY' ? '💵 Pay on Delivery' : currentOrder.paymentMethod || 'Pay on Delivery'}
                </span>
              </div>
            </div>

            {/* Service & Pickup Details Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold shrink-0">
                  🧺
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Requested Service</span>
                  <span className="font-extrabold text-slate-900">{serviceName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Doorstep Pickup</span>
                  <span className="font-extrabold text-slate-900">{pickupDate} • {pickupSlot}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-2 pt-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2 leading-relaxed font-medium">
                {address}
              </p>
            </div>
          </div>

          <p className="text-center text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Sound chime will continue ringing until you click Accept below.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleAccept(currentOrder)}
              disabled={acceptingId !== null}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {acceptingId === (currentOrder.id || currentOrder.orderNumber) ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                  <span>Accept Order &amp; Silence Alarm</span>
                </>
              )}
            </button>

            {ringingOrders.length > 1 && (
              <button
                onClick={handleAcceptAll}
                disabled={acceptingId !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4 text-slate-600" />
                <span>Accept All {ringingOrders.length} Orders &amp; Silence Alarm</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
