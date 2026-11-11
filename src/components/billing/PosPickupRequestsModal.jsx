import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Truck, 
  Search, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin, 
  User, 
  Bike, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  MessageSquare, 
  Copy, 
  Check, 
  RotateCcw, 
  Printer, 
  FileText, 
  Sparkles, 
  Layers, 
  DollarSign, 
  ChevronRight,
  PackageCheck,
  Scale,
  CreditCard,
  Wallet
} from 'lucide-react';
import { 
  pickupRequestService, 
  PICKUP_STATUSES, 
  PICKUP_STATUS_STEPS 
} from '../../services/pickupRequestService';
import { staffService } from '../../services/staffService';
import { DEFAULT_SERVICES } from '../../services/serviceService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { receiptService } from '../../services/receiptService';

export const PosPickupRequestsModal = ({
  isOpen,
  onClose,
  terminal = null,
  activeTerminalId = 'counter-2',
  onOrderCreated = null
}) => {
  const { success, error, info } = useToast();

  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Search
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'ASSIGNED' | 'COLLECTED' | 'CONVERTED' | 'ALL'
  const [searchQuery, setSearchQuery] = useState('');

  // Conversion Drawer / Modal State
  const [convertingRequest, setConvertingRequest] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [actualWeightKg, setActualWeightKg] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('srv-dry-cleaning');
  const [pricingType, setPricingType] = useState('per_kg'); // 'per_kg' | 'per_item'
  const [pricePerKg, setPricePerKg] = useState(100);
  const [customTotalAmount, setCustomTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'UPI_QR' | 'CARD' | 'UNPAID'
  const [paymentStatus, setPaymentStatus] = useState('PAID');

  // Quick Action States
  const [assigningRequestId, setAssigningRequestId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState(null);

  // Load Requests & Staff
  const loadRequests = async () => {
    try {
      setLoading(true);
      const [reqs, staff] = await Promise.all([
        pickupRequestService.getPickupRequests(),
        staffService.getStaff()
      ]);
      setRequests(reqs || []);
      setStaffList(staff || []);
    } catch (err) {
      console.warn('Failed to load POS pickup requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsub = pickupRequestService.subscribeToPickupRequests((updatedList) => {
      setRequests(updatedList);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Filter requests by Tab & Search
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Tab Filter
      if (activeTab === 'PENDING') {
        if (r.status !== PICKUP_STATUSES.PENDING) return false;
      } else if (activeTab === 'ASSIGNED') {
        if (r.status !== PICKUP_STATUSES.ASSIGNED && r.status !== PICKUP_STATUSES.CONFIRMED && r.status !== PICKUP_STATUSES.OUT_FOR_PICKUP) return false;
      } else if (activeTab === 'COLLECTED') {
        if (r.status !== PICKUP_STATUSES.COLLECTED && r.status !== PICKUP_STATUSES.DELIVERED_TO_BRANCH) return false;
      } else if (activeTab === 'CONVERTED') {
        if (r.status !== PICKUP_STATUSES.CONVERTED && r.status !== PICKUP_STATUSES.COMPLETED) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = r.pickupRequestId && r.pickupRequestId.toLowerCase().includes(q);
        const matchesName = r.customerName && r.customerName.toLowerCase().includes(q);
        const matchesPhone = r.mobileNumber && r.mobileNumber.includes(q);
        const matchesArea = r.address?.fullAddress && r.address.fullAddress.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesArea) return false;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  const pendingCount = useMemo(() => {
    return requests.filter(r => r.status === PICKUP_STATUSES.PENDING).length;
  }, [requests]);

  if (!isOpen) return null;

  // Handle Accept
  const handleAcceptRequest = async (req) => {
    try {
      await pickupRequestService.updatePickupRequestStatus(req.id, PICKUP_STATUSES.CONFIRMED, {
        updatedBy: `TW-POS-02 Operator (${terminal?.name || 'Tolichowki'})`,
        note: 'Pickup request accepted at POS-2 counter'
      });
      success('Pickup Accepted', `Request #${req.pickupRequestId} accepted and confirmed.`);
    } catch (err) {
      error('Failed to Accept', err.message);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingRequestId) return;
    try {
      await pickupRequestService.updatePickupRequestStatus(rejectingRequestId, PICKUP_STATUSES.CANCELLED, {
        updatedBy: `TW-POS-02 Operator`,
        note: `Cancelled at POS: ${cancellationReason || 'Unavailable'}`,
        cancellationReason: cancellationReason || 'Slot / area unavailable'
      });
      success('Request Rejected', 'The pickup request has been marked cancelled.');
      setRejectingRequestId(null);
      setCancellationReason('');
    } catch (err) {
      error('Reject Failed', err.message);
    }
  };

  // Handle Quick Assign
  const handleConfirmAssign = async () => {
    if (!assigningRequestId || !selectedStaffId) return;
    const matchedStaff = staffList.find(s => s.id === selectedStaffId);
    try {
      await pickupRequestService.assignPickupBoy(
        assigningRequestId,
        matchedStaff || { name: 'Executive', id: selectedStaffId },
        { updatedBy: 'TW-POS-02 Operator' }
      );
      success('Assigned Successfully', `Assigned to ${matchedStaff?.name || 'Rider'}.`);
      setAssigningRequestId(null);
      setSelectedStaffId('');
    } catch (err) {
      error('Assignment Failed', err.message);
    }
  };

  // Handle Status Shift
  const handleQuickStatus = async (reqId, nextStatus) => {
    try {
      await pickupRequestService.updatePickupRequestStatus(reqId, nextStatus, {
        updatedBy: 'TW-POS-02 Operator',
        note: `Status updated at Counter 2: ${nextStatus}`
      });
      success('Status Updated', `Set to ${nextStatus}.`);
    } catch (err) {
      error('Failed to update', err.message);
    }
  };

  // Open Convert Modal
  const handleStartConversion = (req) => {
    setConvertingRequest(req);
    setActualWeightKg(req.estimatedWeight ? String(req.estimatedWeight) : '');
    const firstSrv = req.services && req.services[0];
    if (firstSrv) {
      setSelectedServiceId(firstSrv.id || firstSrv.slug || 'srv-dry-cleaning');
    }
    setCustomTotalAmount('');
  };

  // Execute Conversion into POS Order
  const handleExecuteConversion = async (e) => {
    e.preventDefault();
    if (!convertingRequest || isConverting) return;

    setIsConverting(true);
    try {
      const activeSrv = DEFAULT_SERVICES.find(s => s.id === selectedServiceId || s.slug === selectedServiceId) || DEFAULT_SERVICES[0];
      
      const weightNum = actualWeightKg ? parseFloat(actualWeightKg) : 0;
      let calculatedTotal = 0;
      if (customTotalAmount && !isNaN(Number(customTotalAmount))) {
        calculatedTotal = Number(customTotalAmount);
      } else if (weightNum > 0) {
        calculatedTotal = weightNum * pricePerKg;
      } else {
        calculatedTotal = activeSrv.startingPrice || 100;
      }

      const orderPayload = {
        customerName: convertingRequest.customerName,
        phone: convertingRequest.mobileNumber,
        serviceId: activeSrv.id,
        serviceName: activeSrv.title || activeSrv.name,
        serviceEmoji: activeSrv.emoji || '👔',
        pricingType: 'per_kg',
        weightKg: weightNum || null,
        pricePerKg: pricePerKg,
        totalAmount: calculatedTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        receivedAmount: paymentStatus === 'PAID' ? calculatedTotal : 0,
        balanceAmount: paymentStatus === 'PAID' ? 0 : calculatedTotal,
        pickupRequestId: convertingRequest.pickupRequestId,
        pickupDate: convertingRequest.pickupDate,
        pickupSlot: convertingRequest.pickupTimeSlot,
        address: convertingRequest.address?.fullAddress || '',
        notes: `Converted from Doorstep Pickup Request #${convertingRequest.pickupRequestId}.`,
        terminalId: 'counter-2',
        counterNumber: '2',
        terminalCode: 'TW-POS-02',
        isWalkIn: false,
        isOnlineBooking: true
      };

      const result = await pickupRequestService.convertPickupToOrder(convertingRequest.id, orderPayload, {
        updatedBy: 'TW-POS-02 Operator'
      });

      success('Order Created!', `Converted to POS Order #${result.order.id || result.order.orderNumber}.`);

      // Print Receipt
      try {
        if (receiptService?.printReceipt) {
          receiptService.printReceipt(result.order);
        }
      } catch (printErr) {
        console.warn('Auto print receipt notice:', printErr);
      }

      if (typeof onOrderCreated === 'function') {
        onOrderCreated(result.order);
      }

      setConvertingRequest(null);
    } catch (err) {
      console.error('Order conversion failed:', err);
      error('Conversion Error', err?.message || 'Could not create POS order.');
    } finally {
      setIsConverting(false);
    }
  };

  const getGoogleMapsLink = (address) => {
    if (address?.latitude && address?.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
    }
    const cleanAddr = encodeURIComponent(address?.fullAddress || 'Hyderabad');
    return `https://www.google.com/maps/search/?api=1&query=${cleanAddr}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-black border border-emerald-500/30">
                  TW-POS-02 (Tolichowki Central Hub)
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                    {pendingCount} Pending Pickup Requests
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                Doorstep Pickup Requests Management
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRequests}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Requests"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters & Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'PENDING', label: 'Pending Review', count: pendingCount, color: 'amber' },
              { id: 'ASSIGNED', label: 'Assigned / Out', count: requests.filter(r => r.status === PICKUP_STATUSES.ASSIGNED || r.status === PICKUP_STATUSES.OUT_FOR_PICKUP).length },
              { id: 'COLLECTED', label: 'In Branch / Ready to Bill', count: requests.filter(r => r.status === PICKUP_STATUSES.COLLECTED || r.status === PICKUP_STATUSES.DELIVERED_TO_BRANCH).length },
              { id: 'CONVERTED', label: 'Converted to Orders', count: requests.filter(r => r.status === PICKUP_STATUSES.CONVERTED).length },
              { id: 'ALL', label: 'All Requests', count: requests.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                    tab.id === 'PENDING' && tab.count > 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, customer, phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
              <p className="text-xs">Loading incoming doorstep pickup requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Truck className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-bold text-slate-300">No requests in this view</p>
              <p className="text-xs text-slate-500">Website doorstep pickup submissions will instantly appear here.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isPending = req.status === PICKUP_STATUSES.PENDING;
              const isCollected = req.status === PICKUP_STATUSES.COLLECTED || req.status === PICKUP_STATUSES.DELIVERED_TO_BRANCH;
              const isConverted = req.status === PICKUP_STATUSES.CONVERTED;

              return (
                <div
                  key={req.id || req.pickupRequestId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-amber-950/20 border-amber-600/40 ring-1 ring-amber-500/20'
                      : isCollected
                      ? 'bg-emerald-950/20 border-emerald-600/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                        {req.pickupRequestId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPending ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(req.createdAt)}
                      </span>
                    </div>

                    {/* Quick POS Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => setRejectingRequestId(req.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {!req.assignedPickupBoy && !isConverted && (
                        <button
                          onClick={() => {
                            setAssigningRequestId(req.id);
                            setSelectedStaffId('');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 text-xs font-bold flex items-center gap-1"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Assign Rider</span>
                        </button>
                      )}

                      {req.status === PICKUP_STATUSES.ASSIGNED && (
                        <button
                          onClick={() => handleQuickStatus(req.id, PICKUP_STATUSES.OUT_FOR_PICKUP)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-700/50 text-xs font-bold"
                        >
                          Mark Out for Pickup
                        </button>
                      )}

                      {req.status === PICKUP_STATUSES.OUT_FOR_PICKUP && (
                        <button
                          onClick={() => handleQuickStatus(req.id, PICKUP_STATUSES.COLLECTED)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900 text-teal-300 border border-teal-700/50 text-xs font-bold"
                        >
                          Mark Collected
                        </button>
                      )}

                      {isCollected && !isConverted && (
                        <button
                          onClick={() => handleStartConversion(req)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Convert to POS Order & Bill</span>
                        </button>
                      )}

                      {isConverted && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700/40 text-xs font-bold flex items-center gap-1 font-mono">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Order: #{req.convertedOrderId}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
                    {/* Customer */}
                    <div className="space-y-1">
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <a href={`tel:${req.mobileNumber}`} className="hover:text-emerald-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>+91 {req.mobileNumber}</span>
                        </a>
                      </div>
                      {req.assignedPickupBoy && (
                        <div className="text-[11px] text-indigo-300 flex items-center gap-1 pt-1">
                          <Bike className="w-3 h-3" />
                          <span>Rider: <strong>{req.assignedPickupBoy}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <div className="text-slate-400 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 line-clamp-2 leading-relaxed">
                          {req.address?.fullAddress}
                        </span>
                      </div>
                      <a
                        href={getGoogleMapsLink(req.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline font-bold"
                      >
                        <span>Maps Navigation</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {/* Schedule & Services */}
                    <div className="space-y-1">
                      <div className="text-slate-300 flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.pickupDate} ({req.pickupTimeSlot})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {req.serviceNames && req.serviceNames.length > 0 ? (
                          req.serviceNames.map((sn, sIdx) => (
                            <span 
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700"
                            >
                              {sn}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Laundry Service</span>
                        )}
                      </div>
                      {req.specialInstructions && (
                        <p className="text-[10px] text-amber-300/80 italic pt-0.5 truncate">
                          "{req.specialInstructions}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CONVERT TO POS ORDER MODAL                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {convertingRequest && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div 
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-5 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Convert to Regular POS Order
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      Pickup #{convertingRequest.pickupRequestId} • Counter 2
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setConvertingRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExecuteConversion} className="space-y-4 text-xs">
                {/* Customer Details Display */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Customer</span>
                    <strong className="text-white">{convertingRequest.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone</span>
                    <strong className="text-white">+91 {convertingRequest.mobileNumber}</strong>
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Select Service</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden font-bold"
                  >
                    {DEFAULT_SERVICES.map(srv => (
                      <option key={srv.id} value={srv.id}>
                        {srv.title || srv.name} (From {formatCurrency(srv.startingPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actual Weighed Weight & Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Actual Weight (kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={actualWeightKg}
                      onChange={(e) => setActualWeightKg(e.target.value)}
                      placeholder="e.g. 5.4"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Rate per kg (₹)</label>
                    <input
                      type="number"
                      value={pricePerKg}
                      onChange={(e) => setPricePerKg(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold outline-hidden"
                    />
                  </div>
                </div>

                {/* Custom Grand Total Override */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Custom Grand Total Override (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    value={customTotalAmount}
                    onChange={(e) => setCustomTotalAmount(e.target.value)}
                    placeholder={actualWeightKg ? `Calculated: ₹${Math.round(parseFloat(actualWeightKg) * pricePerKg)}` : 'Enter custom total'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold outline-hidden"
                  />
                </div>

                {/* Payment Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold outline-hidden"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI_QR">UPI / QR</option>
                      <option value="CARD">Card</option>
                      <option value="PAY_ON_DELIVERY">Pay On Delivery (POD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold outline-hidden"
                    >
                      <option value="PAID">Paid</option>
                      <option value="UNPAID">Unpaid (Balance Due)</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setConvertingRequest(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConverting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isConverting ? 'Creating Order...' : 'Generate Bill & Print Receipt'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* QUICK RIDER ASSIGN MODAL                                      */}
        {/* ───────────────────────────────────────────────────────────── */}
        {assigningRequestId && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div 
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 space-y-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-sm">Assign Pickup Executive</h3>
                <button onClick={() => setAssigningRequestId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {staffList.map((st) => (
                  <label
                    key={st.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs ${
                      selectedStaffId === st.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="riderSelect"
                        value={st.id}
                        checked={selectedStaffId === st.id}
                        onChange={() => setSelectedStaffId(st.id)}
                        className="text-indigo-600"
                      />
                      <div>
                        <p className="font-bold">{st.name}</p>
                        <span className="text-[10px] text-slate-400">{st.role || 'Delivery'}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setAssigningRequestId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssign}
                  disabled={!selectedStaffId}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  Confirm Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* REJECT MODAL                                                  */}
        {/* ───────────────────────────────────────────────────────────── */}
        {rejectingRequestId && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div 
              className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 space-y-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-sm text-rose-400">Reject / Cancel Pickup</h3>
                <button onClick={() => setRejectingRequestId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Reason for Cancellation</label>
                <input
                  type="text"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g. Beyond operating radius / Slot full"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setRejectingRequestId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PosPickupRequestsModal;
