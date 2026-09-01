import React, { useState, useEffect } from 'react';
import { orderService, ORDER_CUSTOMER_STAGES, INTERNAL_OPERATIONAL_STAGES } from '../../services/orderService';
import { staffService } from '../../services/staffService';
import { auditService } from '../../services/auditService';
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
  FileText,
  MapPin,
  ExternalLink
} from 'lucide-react';

export const AdminOrdersPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Status edit state in modal
  const [newCustomerStage, setNewCustomerStage] = useState('CONFIRMED');
  const [newInternalStage, setNewInternalStage] = useState('RECEIVED_AT_HUB');
  const [newPaymentStatus, setNewPaymentStatus] = useState('PENDING');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [statusNote, setStatusNote] = useState('');

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

  const openOrderModal = (ord) => {
    setActiveOrder(ord);
    setNewCustomerStage(ord.customerStage || 'CONFIRMED');
    setNewInternalStage(ord.internalStage || 'RECEIVED_AT_HUB');
    setNewPaymentStatus(ord.paymentStatus || 'PENDING');
    setAssignedStaff(ord.assignedStaff || '');
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
      };

      const updated = await orderService.updateOrderStatus(activeOrder.id, {
        customerStage: newCustomerStage,
        internalStage: newInternalStage,
        paymentStatus: newPaymentStatus,
        assignedStaff: assignedStaff || null,
        note: statusNote,
      });

      await auditService.logAction({
        action: 'STATUS_CHANGE',
        entity: 'Order',
        entityId: activeOrder.id,
        entityName: `Order #${activeOrder.orderNumber}`,
        previousValue: previousState,
        newValue: { customerStage: newCustomerStage, internalStage: newInternalStage, paymentStatus: newPaymentStatus },
        user: currentUser,
      });

      success('Order Updated', `Status changed to ${newCustomerStage}`);
      setActiveOrder(updated);
      loadOrders();
    } catch (err) {
      error('Update Error', err.message || 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      error('No Data', 'No orders available to export.');
      return;
    }
    const headers = ['Order Number,Customer Name,Phone,Service,Amount,Customer Stage,Internal Stage,Payment Status,Created At'];
    const rows = orders.map(o => `"${o.orderNumber}","${o.customer?.name || ''}","${o.customer?.phone || ''}","${o.serviceName || ''}","${o.priceSnapshot?.finalTotal || o.totalAmount}","${o.customerStage}","${o.internalStage || ''}","${o.paymentStatus}","${o.createdAt}"`);
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
      render: (val, row) => (
        <span className="font-mono font-bold text-xs text-brand-700">
          {val || row.id}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{c?.name || 'Customer'}</div>
          <div className="text-[11px] text-slate-400">{c?.phone}</div>
        </div>
      ),
    },
    {
      title: 'Service',
      key: 'serviceName',
      render: (val) => <span className="text-xs font-semibold text-slate-700">{val}</span>,
    },
    {
      title: 'Amount',
      key: 'priceSnapshot',
      render: (snap, row) => (
        <span className="font-bold text-xs text-slate-900">
          {formatCurrency(snap?.finalTotal || row.totalAmount)}
        </span>
      ),
    },
    {
      title: 'Customer Stage',
      key: 'customerStage',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Payment',
      key: 'paymentStatus',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
    },
    {
      title: 'Action',
      key: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={() => openOrderModal(row)}>
            Manage
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => setReceiptModalOrder(row)}
            title="Preview & Print Official Tax Invoice"
          >
            Invoice
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Order Lifecycle & Status Management"
        subtitle="Manage 10-stage customer milestones, assign delivery riders, and view immutable financial snapshots."
      >
        <Button variant="outline" size="md" icon={Download} onClick={exportCSV}>
          Export CSV
        </Button>
      </AdminPageHeader>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {['ALL', 'CONFIRMED', 'PICKED_UP', 'CLEANING', 'FINISHING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
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
        maxWidth="max-w-3xl"
        title={activeOrder ? `Manage Order #${activeOrder.orderNumber}` : 'Order Details'}
        subtitle="Update milestone stages, assign staff, and record internal notes."
      >
        {activeOrder && (
          <div className="space-y-6">
            
            {/* Customer Overview & Invoice Action */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Customer Info</span>
                <div className="font-bold text-slate-900 text-sm">{activeOrder.customer?.name}</div>
                <div className="text-slate-600">{activeOrder.customer?.phone} • {activeOrder.customer?.email || 'No email'}</div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Service & Schedule</span>
                  <div className="font-bold text-slate-900">{activeOrder.serviceName}</div>
                  <div className="text-slate-600">{activeOrder.schedule?.pickupDate} ({activeOrder.schedule?.pickupSlot})</div>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setReceiptModalOrder(activeOrder)}
                    className="w-full justify-center bg-white border-brand-300 text-brand-700 hover:bg-brand-50"
                  >
                    Preview & Print Official Invoice
                  </Button>
                </div>
              </div>
            </div>

            {/* GPS & Pickup Location Card (Requirements #15 - #20) */}
            <OrderMapCard
              location={activeOrder.pickupLocation || {
                formattedAddress: activeOrder.customer?.address,
                street: activeOrder.customer?.address,
                city: activeOrder.customer?.city || 'Hyderabad',
                latitude: 17.385044,
                longitude: 78.486671,
                locationSource: 'MANUAL',
              }}
              customerName={activeOrder.customer?.name}
              title="Verified Pickup Doorstep"
            />

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-brand-900 font-display">
                Update Order Progression
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
                        Stage {s.stepNumber}: {s.label}
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
                  label="Update Note (Visible on customer tracking)"
                  placeholder="e.g. Garments cleared dual QC inspection"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isUpdating}
              >
                Save & Update Live Milestone
              </Button>
            </form>

            {/* Immutable Price Snapshot */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                Immutable Financial Snapshot
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(activeOrder.priceSnapshot?.itemsSubtotal || activeOrder.totalAmount)}</span>
                </div>
                {activeOrder.priceSnapshot?.expressFee > 0 && (
                  <div className="flex justify-between text-brand-600">
                    <span>Express Fee:</span>
                    <span>+{formatCurrency(activeOrder.priceSnapshot.expressFee)}</span>
                  </div>
                )}
                {activeOrder.priceSnapshot?.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(activeOrder.priceSnapshot.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>Total Amount:</span>
                  <span className="text-brand-600">{formatCurrency(activeOrder.priceSnapshot?.finalTotal || activeOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Status Timeline History */}
            {activeOrder.statusTimeline && activeOrder.statusTimeline.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-display">
                  Audit Milestone Timeline
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

      {/* Official Tax Invoice & Print Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptModalOrder}
        order={receiptModalOrder}
        onClose={() => setReceiptModalOrder(null)}
      />

    </div>
  );
};
