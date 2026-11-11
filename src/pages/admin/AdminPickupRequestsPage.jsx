import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ExternalLink, 
  MessageSquare, 
  Copy, 
  Check, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Bike, 
  Store, 
  Sparkles, 
  ArrowUpDown, 
  ChevronRight,
  ShieldCheck,
  Send,
  X,
  Layers,
  FileText
} from 'lucide-react';
import { 
  pickupRequestService, 
  PICKUP_STATUSES, 
  PICKUP_STATUS_STEPS 
} from '../../services/pickupRequestService';
import { staffService } from '../../services/staffService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const AdminPickupRequestsPage = () => {
  const { success, error, info } = useToast();

  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');

  // Selected Request for Detail / Edit Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningRiderId, setAssigningRiderId] = useState('');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Load Requests and Staff
  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, staff] = await Promise.all([
        pickupRequestService.getPickupRequests(),
        staffService.getStaff()
      ]);
      setRequests(reqs || []);
      setStaffList(staff || []);
    } catch (err) {
      console.error('Failed to load doorstep pickup requests:', err);
      error('Load Failed', 'Could not retrieve pickup requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Subscribe to real-time changes
    const unsub = pickupRequestService.subscribeToPickupRequests((updatedList) => {
      setRequests(updatedList);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Compute live dashboard stats
  const stats = useMemo(() => {
    return pickupRequestService.getStats(requests);
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Status filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) {
        return false;
      }
      // Date filter
      if (dateFilter && r.pickupDate !== dateFilter) {
        return false;
      }
      // Staff filter
      if (staffFilter !== 'ALL' && r.assignedPickupBoyId !== staffFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = r.pickupRequestId && r.pickupRequestId.toLowerCase().includes(q);
        const matchesName = r.customerName && r.customerName.toLowerCase().includes(q);
        const matchesPhone = r.mobileNumber && r.mobileNumber.includes(q);
        const matchesAddress = r.address?.fullAddress && r.address.fullAddress.toLowerCase().includes(q);
        const matchesBoy = r.assignedPickupBoy && r.assignedPickupBoy.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesAddress && !matchesBoy) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, dateFilter, staffFilter, searchQuery]);

  // Status Badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case PICKUP_STATUSES.PENDING:
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
      case PICKUP_STATUSES.CONFIRMED:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
      case PICKUP_STATUSES.ASSIGNED:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300';
      case PICKUP_STATUSES.OUT_FOR_PICKUP:
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300';
      case PICKUP_STATUSES.COLLECTED:
        return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300';
      case PICKUP_STATUSES.DELIVERED_TO_BRANCH:
        return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300';
      case PICKUP_STATUSES.CONVERTED:
      case PICKUP_STATUSES.COMPLETED:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case PICKUP_STATUSES.CANCELLED:
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Handle Quick Status Transition
  const handleUpdateStatus = async (requestId, nextStatus) => {
    try {
      setIsUpdating(true);
      await pickupRequestService.updatePickupRequestStatus(requestId, nextStatus, {
        updatedBy: 'Admin Command Center',
        note: statusUpdateNote || `Status changed to ${nextStatus}`,
        cancellationReason: nextStatus === PICKUP_STATUSES.CANCELLED ? cancellationReason : ''
      });
      success('Status Updated', `Request #${requestId} set to ${nextStatus}.`);
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: nextStatus }));
      }
      setStatusUpdateNote('');
      setCancellationReason('');
    } catch (err) {
      error('Update Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Assign Pickup Boy
  const handleAssignRider = async () => {
    if (!selectedRequest) return;
    if (!assigningRiderId) {
      error('Selection Required', 'Please select a staff member or delivery executive.');
      return;
    }

    const matchedStaff = staffList.find(s => s.id === assigningRiderId);
    try {
      setIsUpdating(true);
      const updated = await pickupRequestService.assignPickupBoy(
        selectedRequest.id,
        matchedStaff || { name: 'Assigned Executive', id: assigningRiderId },
        { updatedBy: 'Admin Command Center' }
      );
      success('Assigned Successfully', `Assigned to ${matchedStaff?.name || 'Executive'}.`);
      setSelectedRequest(updated);
      setIsAssignModalOpen(false);
    } catch (err) {
      error('Assignment Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getGoogleMapsLink = (address) => {
    if (address?.latitude && address?.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
    }
    const cleanAddr = encodeURIComponent(address?.fullAddress || address?.street || 'Hyderabad');
    return `https://www.google.com/maps/search/?api=1&query=${cleanAddr}`;
  };

  const getWhatsAppChatUrl = (request) => {
    if (!request) return '#';
    const phone = (request.whatsappNumber || request.mobileNumber || '').replace(/\D/g, '').slice(-10);
    const text = encodeURIComponent(
      `Hello ${request.customerName}, this is Tech Wash Laundry regarding your Doorstep Pickup Request #${request.pickupRequestId}.\n\n📅 Scheduled Pickup: ${request.pickupDate} (${request.pickupTimeSlot})\n📍 Address: ${request.address?.fullAddress}\n\nOur team is coordinating your collection. Feel free to reply here if you have any questions!`
    );
    return `https://wa.me/91${phone}?text=${text}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & QUICK STATS                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tolichowki Central Hub (TW-POS-02) Linked</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">
            Doorstep Pickup Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time customer pickup requests from the website, synchronized with TW-POS-02 and delivery fleet.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. STATS CARDS                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">Total Requests</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.total}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.PENDING)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.PENDING
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider block">Pending</span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.pending}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.CONFIRMED)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.CONFIRMED
              ? 'bg-blue-600 text-white border-blue-600 shadow-md font-bold'
              : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 hover:border-blue-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">Confirmed</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.confirmed}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.ASSIGNED)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.ASSIGNED
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold'
              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 hover:border-indigo-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">Assigned</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.assigned}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.OUT_FOR_PICKUP)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.OUT_FOR_PICKUP
              ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold'
              : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200 hover:border-purple-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">In Progress</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.inProgress}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.COMPLETED)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.COMPLETED
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold'
              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 hover:border-emerald-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">Completed</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.completed}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(PICKUP_STATUSES.CANCELLED)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === PICKUP_STATUSES.CANCELLED
              ? 'bg-rose-600 text-white border-rose-600 shadow-md font-bold'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 hover:border-rose-400'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider block">Cancelled</span>
          <span className="text-xl sm:text-2xl font-black mt-1 block">{stats.cancelled}</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. FILTERS & SEARCH BAR                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, Customer, Phone, Area..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium outline-hidden focus:border-emerald-600 dark:focus:border-emerald-400 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(PICKUP_STATUSES).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 outline-hidden"
          />

          {/* Staff Dropdown */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 outline-hidden"
          >
            <option value="ALL">All Pickup Executives</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>{st.name} ({st.role || 'Staff'})</option>
            ))}
          </select>

          {(statusFilter !== 'ALL' || dateFilter || staffFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setDateFilter('');
                setStaffFilter('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. MANAGEMENT TABLE                                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Services</th>
                <th className="py-3.5 px-4">Pickup Schedule</th>
                <th className="py-3.5 px-4">Assigned Executive</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Loading doorstep pickup requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">No pickup requests found.</p>
                    <p className="text-[11px]">Any new requests submitted online will automatically appear here in real-time.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr 
                    key={req.id || req.pickupRequestId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Request ID */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{req.pickupRequestId}</span>
                        <button
                          onClick={() => handleCopy(req.pickupRequestId)}
                          className="opacity-40 hover:opacity-100 text-slate-500 transition-opacity"
                          title="Copy ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block">
                        {formatDateTime(req.createdAt)}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {req.customerName}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                        <a 
                          href={`tel:${req.mobileNumber}`} 
                          className="hover:text-emerald-600 transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{req.mobileNumber}</span>
                        </a>
                        <a
                          href={getWhatsAppChatUrl(req)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700"
                          title="WhatsApp Chat"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
                        {req.address?.fullAddress || `${req.address?.houseNumber || ''} ${req.address?.street || ''}`}
                      </div>
                      <a
                        href={getGoogleMapsLink(req.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-0.5 font-bold"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>View on Maps</span>
                      </a>
                    </td>

                    {/* Services */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {req.serviceNames && req.serviceNames.length > 0 ? (
                          req.serviceNames.map((sn, sIdx) => (
                            <span 
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[140px]"
                            >
                              {sn}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Doorstep Laundry</span>
                        )}
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{req.pickupDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{req.pickupTimeSlot}</span>
                      </div>
                    </td>

                    {/* Assigned Pickup Boy */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {req.assignedPickupBoy ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            <Bike className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                              {req.assignedPickupBoy}
                            </span>
                            {req.assignedPickupBoyPhone && (
                              <a 
                                href={`tel:${req.assignedPickupBoyPhone}`} 
                                className="text-[10px] text-slate-400 hover:text-indigo-600 block"
                              >
                                {req.assignedPickupBoyPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 text-[11px] font-bold transition-colors"
                        >
                          + Assign Rider
                        </button>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {req.status === PICKUP_STATUSES.PENDING && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, PICKUP_STATUSES.CONFIRMED)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors"
                            title="Confirm Request"
                          >
                            Confirm
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsAssignModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 transition-colors"
                          title="Assign Pickup Executive"
                        >
                          <Bike className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. REQUEST DETAILS DRAWER / MODAL                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-emerald-400">
                      {selectedRequest.pickupRequestId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Created: {formatDateTime(selectedRequest.createdAt)} via {selectedRequest.requestSource || 'Website'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Customer Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Customer Details</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {selectedRequest.customerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Number</span>
                    <a 
                      href={`tel:${selectedRequest.mobileNumber}`} 
                      className="font-bold text-emerald-700 dark:text-emerald-400 text-sm hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>+91 {selectedRequest.mobileNumber}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">WhatsApp Number</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      +91 {selectedRequest.whatsappNumber || selectedRequest.mobileNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Alternative Contact</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedRequest.alternatePhone || 'None Provided'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <a
                    href={`tel:${selectedRequest.mobileNumber}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                  <a
                    href={getWhatsAppChatUrl(selectedRequest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Chat</span>
                  </a>
                </div>
              </div>

              {/* Pickup Address Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Pickup Address</span>
                  </h4>
                  <a
                    href={getGoogleMapsLink(selectedRequest.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedRequest.address?.fullAddress}
                </p>

                {selectedRequest.address?.landmark && (
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold">Landmark:</span> {selectedRequest.address.landmark}
                  </div>
                )}
              </div>

              {/* Laundry Services & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Requested Services
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.serviceNames && selectedRequest.serviceNames.length > 0 ? (
                      selectedRequest.serviceNames.map((sn, sIdx) => (
                        <span 
                          key={sIdx}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        >
                          {sn}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Doorstep Laundry Service</span>
                    )}
                  </div>

                  <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>Est. Weight: <strong>{selectedRequest.estimatedWeight ? `${selectedRequest.estimatedWeight} kg` : 'Not specified'}</strong></span>
                    <span>Bags: <strong>{selectedRequest.numberOfBags || 'Not specified'}</strong></span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Pickup Schedule
                  </span>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRequest.pickupDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedRequest.pickupTimeSlot}</span>
                    </div>
                  </div>

                  {selectedRequest.specialInstructions && (
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold block">Special Instructions:</span>
                      <p className="italic">"{selectedRequest.specialInstructions}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Workflow Selector */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Update Request Status
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PICKUP_STATUS_STEPS.map((step) => {
                    const isCurrent = selectedRequest.status === step.key;
                    return (
                      <button
                        key={step.key}
                        onClick={() => handleUpdateStatus(selectedRequest.id, step.key)}
                        disabled={isUpdating || isCurrent}
                        className={`p-2 rounded-xl text-left border text-[11px] font-bold transition-all ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{step.label}</span>
                          {isCurrent && <Check className="w-3 h-3 text-emerald-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audit History Log */}
              {selectedRequest.history && selectedRequest.history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Audit & Timeline History
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-[11px]">
                    {selectedRequest.history.map((h, hIdx) => (
                      <div key={hIdx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{h.status}</span>
                          <span className="text-slate-500">{h.note || 'No notes provided'}</span>
                        </div>
                        <div className="text-right text-slate-400 shrink-0">
                          <span>{formatDateTime(h.timestamp)}</span>
                          <span className="block text-[10px]">{h.by || 'System'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsAssignModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Bike className="w-4 h-4" />
                <span>{selectedRequest.assignedPickupBoy ? 'Reassign Rider' : 'Assign Rider'}</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. ASSIGN PICKUP BOY MODAL                                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAssignModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white font-display text-base">
                    Assign Pickup Executive
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Request #{selectedRequest.pickupRequestId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Operational Staff / Delivery Rider
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {staffList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No staff members configured in database.</p>
                ) : (
                  staffList.map((st) => (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        assigningRiderId === st.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold ring-1 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="assignedStaff"
                          value={st.id}
                          checked={assigningRiderId === st.id}
                          onChange={() => setAssigningRiderId(st.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="text-xs font-bold">{st.name}</p>
                          <span className="text-[10px] text-slate-400 block">{st.role || 'Delivery Executive'} • {st.phone || 'No phone'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {st.dutyStatus || 'Available'}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignRider}
                disabled={isUpdating || !assigningRiderId}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isUpdating ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
