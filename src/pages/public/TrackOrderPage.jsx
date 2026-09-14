import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService, ORDER_CUSTOMER_STAGES } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { OrderMapCard } from '../../components/location/OrderMapCard';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { UpiPaymentCard } from '../../components/payment/UpiPaymentCard';
import { 
  Search, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Flame, 
  ShieldCheck, 
  Package, 
  Home, 
  Phone, 
  Printer,
  QrCode,
  AlertCircle
} from 'lucide-react';

const ICON_COMPONENTS = {
  CheckCircle2,
  Calendar,
  Truck,
  Search,
  Sparkles,
  Flame,
  ShieldCheck,
  Package,
  Send: Truck,
  Home,
};

export const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig().then(setPaymentConfig);
    const handleConfigUpdate = (e) => {
      if (e.detail) setPaymentConfig(e.detail);
      else paymentService.getPaymentConfig().then(setPaymentConfig);
    };
    window.addEventListener('techwash-payment-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('techwash-payment-config-updated', handleConfigUpdate);
  }, []);

  const searchOrder = async (queryToSearch) => {
    if (!queryToSearch || !queryToSearch.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const found = await orderService.getOrderById(queryToSearch.trim());
      if (found) {
        setOrder(found);
      } else {
        setErrorMsg(`No active order found matching "${queryToSearch}". Please verify your Order ID (e.g. TW-102948).`);
        setOrder(null);
      }
    } catch (e) {
      setErrorMsg('Failed to search order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setOrderQuery(idParam);
      searchOrder(idParam);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchOrder(orderQuery);
  };

  // Find index of current customer stage
  const currentStageIndex = order
    ? ORDER_CUSTOMER_STAGES.findIndex(s => s.key === order.customerStage)
    : -1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 no-print">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>10-Stage Real-Time Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Track Garment Status
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Enter your 6-digit Order ID or Mobile Number to view live processing milestones.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-8 flex items-center gap-2 max-w-md mx-auto">
            <Input
              placeholder="e.g. TW-102948 or Mobile Number"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              className="text-center uppercase font-mono tracking-wider font-bold"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Search}
              isLoading={loading}
            >
              Track
            </Button>
          </form>

          {errorMsg && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* ORDER DETAILS & LIVE TIMELINE */}
        {order && (
          <div className="space-y-8 printable-receipt">
            
            {/* Top Order Overview Banner */}
            <Card variant="luxury" className="p-6 sm:p-8 bg-white border border-brand-200 shadow-luxury">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="brand" size="md">Live Tracking Active</Badge>
                    <span className="text-xs text-slate-400 font-medium">Placed {formatDateTime(order.createdAt)}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                    Order #{order.orderNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <strong className="text-slate-800">{order.customer?.name}</strong> • Phone: {order.customer?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-3 no-print">
                  <Button variant="outline" size="sm" icon={Printer} onClick={() => setIsReceiptOpen(true)}>
                    Official Tax Invoice
                  </Button>
                  <a href={`tel:${order.customer?.phone || '+919876543210'}`}>
                    <Button variant="secondary" size="sm" icon={Phone}>
                      Call Rider
                    </Button>
                  </a>
                </div>
              </div>

              {/* 10-Stage Horizontal/Vertical Visual Timeline */}
              <div className="pt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-8 font-display">
                  10-Stage Processing Roadmap
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {ORDER_CUSTOMER_STAGES.map((stage, idx) => {
                    const isCompleted = currentStageIndex >= idx;
                    const isCurrent = currentStageIndex === idx;
                    const Icon = ICON_COMPONENTS[stage.icon] || Sparkles;

                    return (
                      <div
                        key={stage.key}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/25 ring-4 ring-brand-100 scale-105'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[11px] font-black font-display ${isCurrent ? 'text-cyan-200' : 'text-slate-400'}`}>
                            STAGE {stage.stepNumber}
                          </span>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isCurrent ? 'bg-white/20 text-white' : isCompleted ? 'bg-emerald-200/60 text-emerald-700' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        <div className={`text-xs font-bold font-display ${isCurrent ? 'text-white' : isCompleted ? 'text-emerald-950' : 'text-slate-600'}`}>
                          {stage.label}
                        </div>

                        {isCurrent && (
                          <div className="mt-2 text-[10px] font-semibold text-cyan-200 animate-pulse">
                            ● In Active Processing
                          </div>
                        )}
                        {isCompleted && !isCurrent && (
                          <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Order Itemized Receipt Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Garment Breakdown */}
              <div className="md:col-span-8">
                <Card variant="default" className="p-6">
                  <h3 className="text-base font-bold text-slate-900 font-display mb-4">
                    Garment Custody Breakdown
                  </h3>

                  {order.items && order.items.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                          <div>
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            <div className="text-[11px] text-slate-400">Category: {item.category || 'General'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">{item.quantity} pcs</div>
                            <div className="text-[11px] text-slate-400">{formatCurrency(item.unitPrice)} each</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Garment tally conducted upon doorstep pickup.</p>
                  )}

                  {/* Address Summary */}
                  <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block">
                      Pickup & Delivery Destination:
                    </span>
                    <p>{order.customer?.address}</p>
                  </div>
                </Card>

                {/* GPS Location & Map Preview Card */}
                {order.pickupLocation && (
                  <OrderMapCard
                    location={order.pickupLocation}
                    customerName={order.customer?.name}
                    title="Confirmed Doorstep Pickup Point"
                  />
                )}
              </div>

              {/* Right Invoice & Payment Summary */}
              <div className="md:col-span-4">
                <Card variant="luxury" className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 font-display pb-2 border-b border-slate-100">
                    Payment Status
                  </h3>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status:</span>
                    <Badge variant={order.paymentStatus === 'PAID' ? 'emerald' : 'amber'} size="md">
                      {order.paymentStatus}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Payment Option:</span>
                    <span className="font-semibold text-slate-800">{order.paymentMethod?.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>{formatCurrency(order.priceSnapshot?.itemsSubtotal || order.totalAmount)}</span>
                    </div>
                    {order.priceSnapshot?.expressFee > 0 && (
                      <div className="flex justify-between text-brand-600">
                        <span>Express Fee:</span>
                        <span>+{formatCurrency(order.priceSnapshot.expressFee)}</span>
                      </div>
                    )}
                    {order.priceSnapshot?.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(order.priceSnapshot.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{order.priceSnapshot?.deliveryFee === 0 ? 'FREE' : formatCurrency(order.priceSnapshot?.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST (5%):</span>
                      <span>{formatCurrency(order.priceSnapshot?.taxAmount || 0)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
                      <span>Total Amount:</span>
                      <span className="text-brand-600 font-display">
                        {formatCurrency(order.priceSnapshot?.finalTotal || order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Instant UPI Scan & Pay Card for Pending Balance */}
                {order.paymentStatus !== 'PAID' && (
                  <div className="mt-4 animate-fade-in">
                    <UpiPaymentCard
                      upiConfig={paymentConfig?.upi}
                      amount={order.priceSnapshot?.finalTotal || order.totalAmount}
                      orderNumber={order.orderNumber}
                      customerName={order.customer?.name}
                      title="Settle Bill via UPI QR"
                      description="Instant scan & pay for this order with Google Pay, PhonePe, Paytm or BHIM"
                    />
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Official Tax Invoice & Print Receipt Modal */}
      {order && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          order={order}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

    </div>
  );
};
