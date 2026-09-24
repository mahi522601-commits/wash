import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService, ORDER_CUSTOMER_STAGES } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { receiptService } from '../../services/receiptService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { OrderMapCard } from '../../components/location/OrderMapCard';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { PrintReceipt } from '../../components/receipt/PrintReceipt';
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
  AlertCircle,
  Download,
  FileText,
  Eye,
  MessageSquare,
  Check,
  Zap,
  RotateCcw
} from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';
import { useSettings } from '../../context/SettingsContext';

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
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const [orderQuery, setOrderQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'timeline'
  const [receiptConfig, setReceiptConfig] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig().then(setPaymentConfig);
    receiptService.getReceiptConfig().then(setReceiptConfig);

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
        const cfg = await receiptService.getReceiptConfig();
        setReceiptConfig(cfg);
        setReceiptData(receiptService.mapOrderToReceiptData(found, cfg));
      } else {
        setErrorMsg(`No active order found matching "${queryToSearch}". Please verify your Order ID (e.g. TW-102948).`);
        setOrder(null);
        setReceiptData(null);
      }
    } catch (e) {
      setErrorMsg('Failed to search order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idParam = searchParams.get('id');
    const viewParam = searchParams.get('view');
    if (viewParam === 'timeline') {
      setActiveTab('timeline');
    } else {
      setActiveTab('invoice');
    }

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

  const handleDirectPrint = () => {
    setIsReceiptOpen(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const phone = order.whatsapp || order.phone || order.customer?.whatsapp || order.customer?.phone || '';
    const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(order, receiptData || {});
    whatsappNotificationService.openWhatsAppManual(phone, msg);
  };

  const handleCopyInvoice = async () => {
    if (!order) return;
    const msg = whatsappNotificationService.buildInvoiceWhatsAppMessage(order, receiptData || {});
    await whatsappNotificationService.copyMessageToClipboard(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <>
      <SEOHead
        title="Live Order Tracking & Status — Tech Wash Laundry Hyderabad"
        description="Track your laundry and dry cleaning order status in real time across 10 processing stages with Tech Wash Hyderabad."
        canonicalUrl={`${BASE_URL}/track-order`}
        noindex={!!order}
      />
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

        {/* ORDER DETAILS & LIVE TIMELINE / INVOICE VIEW */}
        {order && (
          <div className="space-y-6">
            
            {/* 1. TOP DEDICATED 1-PAGE INVOICE HERO ACTION CARD */}
            <div className="no-print p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-[#F97316] to-amber-500 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-5 border border-orange-400/40">
              <div className="flex items-start sm:items-center gap-4 text-left w-full md:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#EA580C] text-[10px] font-black uppercase tracking-wider shadow-xs">
                      Official Tax Invoice
                    </span>
                    <span className="text-white/90 text-xs font-mono font-bold">
                      Order #{order.orderNumber}
                    </span>
                    <span className="text-white/75 text-xs">
                      • {order.customer?.name}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black font-display tracking-tight text-white mt-1">
                    Download 1-Page Official Tax Invoice
                  </h2>
                  <p className="text-xs text-orange-100 mt-0.5 max-w-xl">
                    Strict 1-page A4 certified tax receipt with QR code, garment breakdown, GST and payment status.
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-white hover:bg-orange-50 text-[#EA580C] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Direct 1-click Download / Print 1-Page PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print 1-Page Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
                  title="Send Invoice to WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* 2. TAB SWITCHER: 📄 1-Page Invoice Sheet vs 🚀 10-Stage Live Timeline */}
            <div className="no-print flex items-center justify-center sm:justify-start gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0 border border-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('invoice')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'invoice'
                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                <span>📄 1-Page Tax Invoice Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-brand-600" />
                <span>🚀 Live Tracking Roadmap (10 Stages)</span>
              </button>
            </div>

            {/* 3. TAB CONTENT: INVOICE SHEET VIEW */}
            {activeTab === 'invoice' && receiptData && receiptConfig && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Floating Invoice Control Toolbar */}
                <div className="no-print p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Certified 1-Page Tax Invoice Preview</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={Printer}
                      onClick={handleDirectPrint}
                      className="bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold"
                    >
                      Print / Save as PDF
                    </Button>
                    <button
                      type="button"
                      onClick={handleCopyInvoice}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* The 1-Page Tax Invoice Sheet */}
                <div className="p-2 sm:p-6 bg-slate-200/50 rounded-3xl border border-slate-300/80 shadow-inner flex justify-center overflow-x-auto">
                  <PrintReceipt
                    receiptData={receiptData}
                    config={receiptConfig}
                    includeInternalNotes={false}
                    className="w-full"
                  />
                </div>

                {/* Instant UPI Scan & Pay Card if Pending */}
                {order.paymentStatus !== 'PAID' && (
                  <div className="no-print max-w-md mx-auto">
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
            )}

            {/* 4. TAB CONTENT: LIVE TRACKING TIMELINE VIEW */}
            {activeTab === 'timeline' && (
              <div className="space-y-8 animate-fade-in printable-receipt">
                
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
                      <a href={`tel:${order.customer?.phone || (settings?.general?.primaryPhone || '+916304845567').replace(/\s/g, '')}`}>
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
                        {order.priceSnapshot?.taxAmount > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>GST:</span>
                            <span>{formatCurrency(order.priceSnapshot.taxAmount)}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
                          <span>Total Amount:</span>
                          <span className="text-brand-600 font-display">
                            {formatCurrency(order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount)}
                          </span>
                        </div>

                        {order.receivedAmount !== undefined && order.receivedAmount > 0 && (
                          <div className="flex justify-between font-medium text-emerald-700 text-sm">
                            <span>Amount Received:</span>
                            <span className="font-mono font-bold">
                              {formatCurrency(order.receivedAmount)}
                            </span>
                          </div>
                        )}

                        {(order.balanceAmount !== undefined || order.paymentStatus !== 'PAID') && (
                          <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-100">
                            <span className="text-slate-700">Balance Due:</span>
                            <span className={`font-mono font-black ${(order.balanceAmount > 0 || (order.balanceAmount === undefined && order.paymentStatus !== 'PAID')) ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatCurrency(order.balanceAmount !== undefined ? order.balanceAmount : (order.paymentStatus === 'PAID' ? 0 : (order.finalPrice || order.totalAmount)))}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Instant UPI Scan & Pay Card for Pending Balance */}
                    {order.paymentStatus !== 'PAID' && (order.balanceAmount === undefined || order.balanceAmount > 0) && (
                      <div className="mt-4 animate-fade-in">
                        <UpiPaymentCard
                          upiConfig={paymentConfig?.upi}
                          amount={order.balanceAmount !== undefined && order.balanceAmount > 0 ? order.balanceAmount : (order.finalPrice || order.priceSnapshot?.finalTotal || order.totalAmount)}
                          orderNumber={order.orderNumber}
                          customerName={order.customer?.name}
                          title="Settle Outstanding Balance via UPI QR"
                          description="Instant scan & pay for this order with Google Pay, PhonePe, Paytm or BHIM"
                        />
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

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
    </>
  );
};
