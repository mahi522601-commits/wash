import React, { useState, useEffect } from 'react';
import { orderService, ORDER_CUSTOMER_STAGES, INTERNAL_OPERATIONAL_STAGES } from '../../services/orderService';
import { staffService } from '../../services/staffService';
import { auditService } from '../../services/auditService';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { OrderMapCard } from '../../components/location/OrderMapCard';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Truck, 
  User, 
  Phone,
  MessageSquare,
  FileText,
  MapPin,
  ExternalLink,
  Scale,
  DollarSign,
  Send,
  Navigation,
  Bike,
  UserCheck,
  Sparkles,
  Trash2
} from 'lucide-react';

export const AdminOrdersPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTestingGateway, setIsTestingGateway] = useState(false);

  // Status & Weight edit state in modal
  const [newCustomerStage, setNewCustomerStage] = useState('CONFIRMED');
  const [newInternalStage, setNewInternalStage] = useState('RECEIVED_AT_HUB');
  const [newPaymentStatus, setNewPaymentStatus] = useState('PENDING');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const handleAssignWorker = async (order, staffMember) => {
    setIsDispatching(true);
    try {
      await orderService.assignWorkerToOrder(order.id, staffMember);
      await auditService.logAction({
        action: 'ASSIGN_STAFF',
        entity: 'Order',
        entityId: order.id,
        entityName: `Order #${order.orderNumber}`,
        newValue: { assignedStaff: staffMember.name, staffId: staffMember.id },
        user: currentUser,
      });

      success('Rider Dispatched!', `Order #${order.orderNumber} assigned to ${staffMember.name}. Rider notified.`);
      setAssignModalOrder(null);
      loadOrders();
    } catch (err) {
      error('Dispatch Error', err.message || 'Failed to assign worker');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteTargetOrder) return;
    setIsDeletingOrder(true);
    try {
      await orderService.deleteOrder(deleteTargetOrder.id);
      
      try {
        await auditService.logAction({
          action: 'DELETE',
          entity: 'Order',
          entityId: deleteTargetOrder.id,
          entityName: `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id}`,
          user: currentUser,
        });
      } catch (e) {}

      success('Order Deleted', `Order #${deleteTargetOrder.orderNumber || deleteTargetOrder.id} permanently removed.`);
      setDeleteTargetOrder(null);
      if (activeOrder && (activeOrder.id === deleteTargetOrder.id || activeOrder.orderNumber === deleteTargetOrder.orderNumber)) {
        setActiveOrder(null);
      }
      loadOrders();
    } catch (err) {
      error('Delete Error', err.message || 'Failed to delete order.');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const loadOrders = async () => {
    try {
      const [orderData, staffData] = await Promise.all([
        orderService.getOrders({ status: selectedStatus, search: searchQuery }),
        staffService.getStaff(),
      ]);
      setOrders(orderData);
      setStaffList(staffData);
    } catch (e) {
      console.warn("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, searchQuery]);

  // Real-time listener for incoming orders to update table instantly
  useEffect(() => {
    const unsubscribe = orderService.subscribeToNewOrders(() => {
      loadOrders();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [selectedStatus, searchQuery]);

  const openOrderModal = (ord) => {
    setActiveOrder(ord);
    setNewCustomerStage(ord.customerStage || ord.status || 'CONFIRMED');
    setNewInternalStage(ord.internalStage || 'RECEIVED_AT_HUB');
    setNewPaymentStatus(ord.paymentStatus || 'PENDING');
    setAssignedStaff(ord.assignedStaff || '');
    setActualWeight(ord.actualWeight !== null && ord.actualWeight !== undefined ? String(ord.actualWeight) : '');
    setFinalPrice(ord.finalPrice !== null && ord.finalPrice !== undefined ? String(ord.finalPrice) : (ord.priceSnapshot?.finalTotal || ord.totalAmount || ''));
    setAdminNotes(ord.adminNotes || '');
    setStatusNote('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    setIsUpdating(true);

    try {
      const previousState = {
        customerStage: activeOrder.customerStage,
        internalStage: activeOrder.internalStage,
        paymentStatus: activeOrder.paymentStatus,
        actualWeight: activeOrder.actualWeight,
        finalPrice: activeOrder.finalPrice,
      };

      const updated = await orderService.updateOrderStatus(activeOrder.id, {
        customerStage: newCustomerStage,
        internalStage: newInternalStage,
        paymentStatus: newPaymentStatus,
        assignedStaff: assignedStaff || null,
        actualWeight: actualWeight !== '' ? Number(actualWeight) : null,
        finalPrice: finalPrice !== '' ? Number(finalPrice) : null,
        adminNotes: adminNotes,
        note: statusNote || `Status updated to ${newCustomerStage}`,
      });

      await auditService.logAction({
        action: 'STATUS_CHANGE',
        entity: 'Order',
        entityId: activeOrder.id,
        entityName: `Order #${activeOrder.orderNumber}`,
        previousValue: previousState,
        newValue: { 
          customerStage: newCustomerStage, 
          internalStage: newInternalStage, 
          paymentStatus: newPaymentStatus,
          actualWeight: actualWeight !== '' ? Number(actualWeight) : null,
          finalPrice: finalPrice !== '' ? Number(finalPrice) : null,
        },
        user: currentUser,
      });

      success('Order Updated', `Status changed to ${newCustomerStage} with financial record saved.`);
      setActiveOrder(updated);
      loadOrders();
    } catch (err) {
      error('Update Error', err.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    whatsappNotificationService.getGatewayConfig().then((cfg) => {
      setGatewayConfig(cfg);
    });
  }, []);

  const handleSendWhatsAppUpdate = (ord) => {
    const phone = ord.whatsapp || ord.phone || ord.customer?.whatsapp || ord.customer?.phone;
    if (!phone) {
      error('No Phone', 'No customer phone number available.');
      return;
    }

    const stageLabel = ORDER_CUSTOMER_STAGES.find(s => s.key === (ord.customerStage || ord.status))?.label || ord.customerStage || 'Updated';
    const isInitialConfirmation = (ord.customerStage || ord.status) === 'CONFIRMED';
    const msg = isInitialConfirmation
      ? whatsappNotificationService.buildOrderConfirmationMessage(ord)
      : whatsappNotificationService.buildStatusUpdateMessage(ord, stageLabel, ord.statusTimeline?.[ord.statusTimeline.length - 1]?.note || '');

    whatsappNotificationService.openWhatsAppManual(phone, msg);
    success('WhatsApp Opened', `Opening WhatsApp for +91 ${phone}`);
  };

  const handleWhatsAppToWorker = (ord, staffMember) => {
    if (!staffMember?.phone) {
      error('No Rider Phone', 'This delivery worker does not have a phone number on file.');
      return;
    }
    const msg = whatsappNotificationService.buildWorkerAssignmentMessage(ord, staffMember);
    whatsappNotificationService.openWhatsAppManual(staffMember.phone, msg);
    success('WhatsApp Opened for Rider', `Sending dispatch order details to ${staffMember.name} (+91 ${staffMember.phone})`);
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    if (!gatewayConfig) return;
    setIsSavingGateway(true);
    try {
      await whatsappNotificationService.saveGatewayConfig(gatewayConfig);
      success('Gateway Updated', 'WhatsApp notification gateway configuration saved successfully.');
      setShowGatewayModal(false);
    } catch (err) {
      error('Save Error', err.message || 'Failed to save gateway config');
    } finally {
      setIsSavingGateway(false);
    }
  };

  const handleTestGatewayDispatch = async () => {
    if (!testPhone) {
      error('Test Phone Required', 'Please enter a 10-digit mobile number to test.');
      return;
    }
    setIsTestingGateway(true);
    try {
      const dummyOrder = {
        orderNumber: 'TEST-9999',
        customerName: 'Test Customer',
        serviceName: 'Premium Dry Cleaning',
        serviceEmoji: '👔',
        schedule: { pickupDate: 'Tomorrow', pickupSlot: '10:00 AM - 12:00 PM' },
        address: 'Flagship Lounge, Jubilee Hills, Hyderabad',
        totalAmount: 499,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI_QR',
        customer: { name: 'Test Customer', phone: testPhone }
      };

      const result = await whatsappNotificationService.dispatchAutomatedMessage({
        phone: testPhone,
        message: whatsappNotificationService.buildOrderConfirmationMessage(dummyOrder),
        order: dummyOrder,
        type: 'GATEWAY_TEST'
      });

      if (result.success) {
        success('Test Dispatched', `Automated WhatsApp test packet sent to +91 ${testPhone} via ${gatewayConfig?.provider || 'Direct Gateway'}`);
      } else {
        error('Test Failed', result.error || 'Failed to dispatch test message');
      }
    } catch (err) {
      error('Test Error', err.message);
    } finally {
      setIsTestingGateway(false);
    }
  };


  const handleOpenGoogleMaps = (ord) => {
    const lat = ord.pickupLocation?.latitude || 17.385044;
    const lng = ord.pickupLocation?.longitude || 78.486671;
    const address = ord.address || ord.customer?.address || `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      error('No Data', 'No orders available to export.');
      return;
    }
    const headers = ['Order Number,Customer Name,Phone,Service,Est Weight,Actual Weight,Est Amount,Final Amount,Customer Stage,Internal Stage,Payment Status,Created At'];
    const rows = orders.map(o => `"${o.orderNumber}","${o.customerName || o.customer?.name || ''}","${o.phone || o.customer?.phone || ''}","${o.service || o.serviceName || ''}","${o.estimatedWeightKg || o.estimatedWeight || ''}","${o.actualWeight || ''}","${o.estimatedPrice || o.priceSnapshot?.finalTotal || ''}","${o.finalPrice || o.totalAmount || ''}","${o.customerStage || o.status}","${o.internalStage || ''}","${o.paymentStatus}","${o.createdAt}"`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `techwash_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Complete', 'Orders exported to CSV.');
  };

  const columns = [
    {
      title: 'Order ID',
      key: 'orderNumber',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <span className="font-mono font-black text-xs text-purple-800 bg-purple-100/80 px-2 py-1 rounded-lg border border-purple-200 shadow-2xs">
          #{val || row.id}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{row.customerName || row.customer?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-400">{row.phone || row.customer?.phone}</div>
        </div>
      ),
    },
    {
      title: 'Service',
      key: 'service',
      render: (val, row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700">{row.serviceEmoji || '🧺'} {row.service || row.serviceName}</span>
          {(row.actualWeight || row.estimatedWeightKg || row.estimatedWeight) && (
            <div className="text-[10px] text-slate-400">
              {row.actualWeight ? `Actual: ${row.actualWeight} Kg` : `Est: ${row.estimatedWeightKg || row.estimatedWeight} Kg`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'finalPrice',
      render: (val, row) => (
        <div>
          <span className="font-bold text-xs text-slate-900">
            {formatCurrency(val || row.priceSnapshot?.finalTotal || row.totalAmount)}
          </span>
          {row.actualWeight && row.finalPrice && (
            <div className="text-[10px] text-emerald-600 font-semibold">Verified Final</div>
          )}
        </div>
      ),
    },
    {
      title: 'Stage',
      key: 'customerStage',
      render: (val, row) => <StatusBadge status={val || row.status} />,
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Schedule / Date',
      key: 'pickupDate',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <div className="text-xs text-slate-600">
          <div className="font-bold text-slate-800">{val || formatDate(row.createdAt)}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.pickupSlot || row.schedule?.pickupSlot || 'Standard Slot'}</div>
        </div>
      ),
    },
    {
      title: 'Assigned Worker',
      key: 'assignedStaff',
      className: 'whitespace-nowrap',
      render: (val, row) => (
        <div>
          {val ? (
            <button
              type="button"
              onClick={() => setAssignModalOrder(row)}
              className="group px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              title="Click to reassign worker"
            >
              <Bike className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span className="font-extrabold">{val}</span>
              <span className="text-[10px] text-purple-600 group-hover:translate-x-0.5 transition-transform font-bold">➔</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAssignModalOrder(row)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>⚡ Assign Rider</span>
            </button>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'id',
      className: 'whitespace-nowrap min-w-[210px]',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openOrderModal(row)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Manage</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendWhatsAppUpdate(row)}
            title="WhatsApp Customer Update"
            className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenGoogleMaps(row)}
            title="Open Google Maps Directions"
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setReceiptModalOrder(row)}
            title="Print Official Tax Invoice"
            className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setDeleteTargetOrder(row)}
            title="Delete Order Permanently"
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-2xs active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Order Lifecycle & Pickup Management"
        subtitle="Manage 10-stage customer milestones, record verified actual weights, assign delivery staff, and sync with Firebase."
      >
        <Button 
          variant="outline" 
          size="md" 
          icon={MessageSquare} 
          onClick={() => setShowGatewayModal(true)}
          className="bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
        >
          WhatsApp Auto-Gateway
        </Button>
        <Button variant="outline" size="md" icon={Download} onClick={exportCSV}>
          Export CSV
        </Button>
      </AdminPageHeader>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
            { key: 'PICKED_UP', label: 'Picked Up' },
            { key: 'CLEANING', label: 'Cleaning' },
            { key: 'FINISHING', label: 'Finishing' },
            { key: 'PACKED', label: 'Packed' },
            { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'CANCELLED', label: 'Cancelled' }
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => setSelectedStatus(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedStatus === st.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Table
        columns={columns}
        data={orders}
        isLoading={loading}
        emptyMessage="No orders found matching the filter."
      />

      {/* Order Management Modal */}
      <Modal
        isOpen={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        maxWidth="max-w-4xl"
        title={activeOrder ? `Manage Order #${activeOrder.orderNumber}` : 'Order Details'}
        subtitle="Update milestone stages, record inspected weight, assign staff, and send WhatsApp updates."
      >
        {activeOrder && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            
            {/* Customer Overview & Contact Actions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Customer Details</span>
                <div className="font-bold text-slate-900 text-sm">{activeOrder.customerName || activeOrder.customer?.name}</div>
                <div className="text-slate-600">📞 {activeOrder.phone || activeOrder.customer?.phone}</div>
                {activeOrder.whatsapp && activeOrder.whatsapp !== activeOrder.phone && (
                  <div className="text-slate-600">💬 WhatsApp: {activeOrder.whatsapp}</div>
                )}
                <div className="text-slate-600">📍 {activeOrder.address || activeOrder.customer?.address || 'Doorstep Pickup'}</div>
                {activeOrder.landmark && (
                  <div className="text-slate-500 text-[11px]">Landmark: {activeOrder.landmark}</div>
                )}
              </div>

              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Service & Pickup Slot</span>
                  <div className="font-bold text-slate-900">{activeOrder.serviceEmoji || '🧺'} {activeOrder.service || activeOrder.serviceName}</div>
                  <div className="text-slate-600">🗓️ {activeOrder.pickupDate || activeOrder.schedule?.pickupDate} ({activeOrder.pickupSlot || activeOrder.schedule?.pickupSlot})</div>
                  {activeOrder.notes && (
                    <div className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] mt-1">
                      <strong>Customer Note:</strong> {activeOrder.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={MessageSquare}
                    onClick={() => handleSendWhatsAppUpdate(activeOrder)}
                    className="flex-1 justify-center bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    WhatsApp Update
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Navigation}
                    onClick={() => handleOpenGoogleMaps(activeOrder)}
                    className="flex-1 justify-center bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Maps Directions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setReceiptModalOrder(activeOrder)}
                    className="flex-1 justify-center bg-white border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    Invoice
                  </Button>
                </div>
              </div>
            </div>

            {/* GPS & Pickup Location Card */}
            <OrderMapCard
              location={activeOrder.pickupLocation || {
                formattedAddress: activeOrder.address || activeOrder.customer?.address,
                street: activeOrder.address || activeOrder.customer?.address,
                city: activeOrder.city || activeOrder.customer?.city || 'Hyderabad',
                latitude: 17.385044,
                longitude: 78.486671,
                locationSource: 'MANUAL',
              }}
              customerName={activeOrder.customerName || activeOrder.customer?.name}
              title="Doorstep Pickup Location Map"
            />

            {/* Status & Operational Progression Form */}
            <form onSubmit={handleUpdateStatus} className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-900 font-display flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Update Order Progression & Inspection Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Customer Milestone *
                  </label>
                  <select
                    value={newCustomerStage}
                    onChange={(e) => setNewCustomerStage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                  >
                    {ORDER_CUSTOMER_STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.stepNumber > 0 ? `Stage ${s.stepNumber}: ` : ''}{s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Internal Sub-Stage
                  </label>
                  <select
                    value={newInternalStage}
                    onChange={(e) => setNewInternalStage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800"
                  >
                    {Object.entries(INTERNAL_OPERATIONAL_STAGES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Actual Weight & Final Price Fields for Doorstep Weighing / Inspection */}
              <div className="p-4 bg-white rounded-xl border border-brand-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-brand-600" />
                    <span>Actual Inspected Weight (Kg)</span>
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    placeholder={activeOrder.estimatedWeightKg || activeOrder.estimatedWeight ? `Est: ${activeOrder.estimatedWeightKg || activeOrder.estimatedWeight} Kg` : 'e.g. 4.5'}
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">Doorstep calibrated weight in kilograms</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Final Verified Amount (₹)</span>
                  </label>
                  <Input
                    type="number"
                    placeholder={`₹${activeOrder.priceSnapshot?.finalTotal || activeOrder.totalAmount || 0}`}
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400">Final bill amount after weight/item verification</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Assign Delivery Executive / Staff
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Customer Milestone Update Note"
                  placeholder="e.g. Garments picked up and verified at central hub"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Internal Admin Notes (Private)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Internal notes, stains identified, special handling..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetOrder(activeOrder)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Delete Order</span>
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full sm:flex-1 justify-center"
                  isLoading={isUpdating}
                >
                  Save Changes to Firebase
                </Button>
              </div>
            </form>

            {/* Selected Clothes / Items List */}
            {activeOrder.items && activeOrder.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Selected Items ({activeOrder.items.length})
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{it.emoji || '👕'}</span>
                        <span className="font-semibold text-slate-800">{it.name}</span>
                        <span className="text-slate-400">× {it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-700">
                        {it.lineTotal ? formatCurrency(it.lineTotal) : (it.weightGramsEach ? `${(it.weightGramsEach * it.quantity) / 1000} Kg` : '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Timeline History */}
            {activeOrder.statusTimeline && activeOrder.statusTimeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Milestone Audit Timeline
                </h4>
                <div className="space-y-2">
                  {activeOrder.statusTimeline.map((tl, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{tl.label || tl.stage}</span>
                        {tl.note && <span className="text-slate-500 ml-2">• {tl.note}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDateTime(tl.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Assign Worker & Dispatch Modal */}
      <Modal
        isOpen={!!assignModalOrder}
        onClose={() => setAssignModalOrder(null)}
        maxWidth="max-w-lg"
        title={assignModalOrder ? `Dispatch Order #${assignModalOrder.orderNumber}` : 'Assign Delivery Rider'}
        subtitle="Select an active worker to attach to this order. The worker will instantly receive full customer location & contact details on their portal."
      >
        {assignModalOrder && (
          <div className="space-y-4">
            
            {/* Target Order Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-display">
                  {assignModalOrder.serviceEmoji || '🧺'} {assignModalOrder.service || assignModalOrder.serviceName}
                </span>
                <span className="font-mono font-bold text-brand-600">
                  {formatCurrency(assignModalOrder.finalPrice || assignModalOrder.priceSnapshot?.finalTotal || assignModalOrder.totalAmount)}
                </span>
              </div>
              <div className="text-slate-600">
                <strong>Customer:</strong> {assignModalOrder.customerName || assignModalOrder.customer?.name} • 📞 {assignModalOrder.phone || assignModalOrder.customer?.phone}
              </div>
              <div className="text-slate-500 truncate">
                <strong>Pickup Address:</strong> {assignModalOrder.address || assignModalOrder.customer?.address}
              </div>
            </div>

            {/* Rider Selection List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Available Worker / Delivery Executive:
              </label>

              {staffList.filter(s => s.active !== false).length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center">
                  No active workers available. Please create staff in the Staff Directory.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {staffList.filter(s => s.active !== false).map((st) => {
                    const isCurrentAssigned = assignModalOrder.assignedStaff === st.name || assignModalOrder.assignedStaffId === st.id;
                    const activeAssignedCount = orders.filter(o => 
                      (o.assignedStaff === st.name || o.assignedStaffId === st.id) && 
                      o.customerStage !== 'DELIVERED' && 
                      o.customerStage !== 'CANCELLED'
                    ).length;

                    return (
                      <div
                        key={st.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrentAssigned 
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20' 
                            : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {(st.name || 'W')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span className="truncate">{st.name}</span>
                              {st.dutyStatus === 'ON_DUTY' ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  🟢 Online
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold">
                                  ⚪ Offline
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              📞 {st.phone} • {st.hub || 'Central Hub'}
                            </div>
                            <div className="text-[10px] text-purple-700 font-medium">
                              📦 {activeAssignedCount} active order{activeAssignedCount !== 1 ? 's' : ''} in queue
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleWhatsAppToWorker(assignModalOrder, st)}
                            title={`Send WhatsApp task alert to ${st.name}`}
                            className="w-8 h-8 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <Button
                            type="button"
                            variant={isCurrentAssigned ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={isDispatching}
                            onClick={() => handleAssignWorker(assignModalOrder, st)}
                            className="text-xs"
                          >
                            {isCurrentAssigned ? 'Re-Dispatch' : '⚡ Dispatch'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAssignModalOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Tax Invoice & Print Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptModalOrder}
        order={receiptModalOrder}
        onClose={() => setReceiptModalOrder(null)}
      />

      {/* Delete Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetOrder}
        onClose={() => setDeleteTargetOrder(null)}
        onConfirm={handleDeleteOrder}
        title={`Delete Order #${deleteTargetOrder?.orderNumber || deleteTargetOrder?.id || ''}?`}
        message="This order will be permanently deleted from Firebase Firestore and removed from all dispatch queues. This action cannot be undone."
        confirmText="Delete Order"
        isLoading={isDeletingOrder}
      />

      {/* WhatsApp Automated Gateway Settings Modal */}
      <Modal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        maxWidth="max-w-2xl"
        title="WhatsApp Automated Notification Gateway"
        subtitle="Configure backend WhatsApp delivery so receipts and status updates are sent automatically to customer mobile phones without browser popups."
      >
        {gatewayConfig && (
          <form onSubmit={handleSaveGateway} className="space-y-5 text-left text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero-Popup Automated WhatsApp Architecture</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                When customers book pickups, the system dispatches their full order confirmation and real-time tracking link directly to their WhatsApp number via your backend gateway.
              </p>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select WhatsApp Delivery Gateway:
              </label>
              <select
                value={gatewayConfig.provider || 'DIRECT_BACKGROUND'}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DIRECT_BACKGROUND">⚡ Direct Automated Background Service (Built-In Zero Setup)</option>
                <option value="META_CLOUD_API">🌐 Meta WhatsApp Cloud API (Official Business API)</option>
                <option value="GREEN_API">🟢 Green API (Instance & Token)</option>
                <option value="ULTRAMSG">💬 UltraMsg WhatsApp Gateway</option>
                <option value="WEBHOOK">🔗 Custom Webhook / Firebase Cloud Function / Zapier</option>
              </select>
            </div>

            {/* Provider Specific Configuration Fields */}
            {gatewayConfig.provider === 'META_CLOUD_API' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Meta WhatsApp Cloud API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone Number ID</label>
                  <Input
                    placeholder="e.g. 109283746592817"
                    value={gatewayConfig.meta?.phoneNumberId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      meta: { ...gatewayConfig.meta, phoneNumberId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">System User Access Token (Permanent)</label>
                  <Input
                    type="password"
                    placeholder="EAAG..."
                    value={gatewayConfig.meta?.accessToken || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      meta: { ...gatewayConfig.meta, accessToken: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'GREEN_API' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Green API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instance ID</label>
                  <Input
                    placeholder="e.g. 1101823928"
                    value={gatewayConfig.greenApi?.instanceId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      greenApi: { ...gatewayConfig.greenApi, instanceId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">API Token Instance</label>
                  <Input
                    type="password"
                    placeholder="e.g. 4d7f9a8b1c..."
                    value={gatewayConfig.greenApi?.apiToken || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      greenApi: { ...gatewayConfig.greenApi, apiToken: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'ULTRAMSG' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">UltraMsg API Credentials</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instance ID</label>
                  <Input
                    placeholder="e.g. instance12345"
                    value={gatewayConfig.ultraMsg?.instanceId || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      ultraMsg: { ...gatewayConfig.ultraMsg, instanceId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Token</label>
                  <Input
                    type="password"
                    placeholder="e.g. abcdef123456"
                    value={gatewayConfig.ultraMsg?.token || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      ultraMsg: { ...gatewayConfig.ultraMsg, token: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {gatewayConfig.provider === 'WEBHOOK' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs">Custom Backend Webhook Endpoint</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Webhook URL (POST payload)</label>
                  <Input
                    placeholder="https://your-api.com/api/send-whatsapp"
                    value={gatewayConfig.webhook?.url || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      webhook: { ...gatewayConfig.webhook, url: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Optional Secret Header Token</label>
                  <Input
                    type="password"
                    placeholder="Bearer secret_token_here"
                    value={gatewayConfig.webhook?.secretKey || ''}
                    onChange={(e) => setGatewayConfig({
                      ...gatewayConfig,
                      webhook: { ...gatewayConfig.webhook, secretKey: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}

            {/* Test Gateway Box */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="font-bold text-amber-950 text-xs">Test Live WhatsApp Dispatch</div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 10-digit mobile number (e.g. 9398724704)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isTestingGateway}
                  onClick={handleTestGatewayDispatch}
                  className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                >
                  Send Test
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowGatewayModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingGateway}>
                Save Gateway Settings
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};


