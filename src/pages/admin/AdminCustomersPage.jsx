import React, { useState, useEffect } from 'react';
import { customerService, CUSTOMER_SEGMENTS } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Users, Search, Phone, Mail, ShoppingBag, Trash2 } from 'lucide-react';

export const AdminCustomersPage = () => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.warn('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDeleteCustomer = async () => {
    if (!deleteTargetCustomer) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(deleteTargetCustomer.phone || deleteTargetCustomer.id);
      success('Customer Profile Deleted', `Profile for "${deleteTargetCustomer.name}" was removed.`);
      setDeleteTargetCustomer(null);
      loadCustomers();
    } catch (err) {
      error('Delete Failed', err.message || 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const getSegmentBadge = (segmentKey) => {
    switch (segmentKey) {
      case 'VIP':
        return <Badge variant="purple" dot>VIP Customer</Badge>;
      case 'RETURNING':
        return <Badge variant="royal">Returning</Badge>;
      case 'NEW':
        return <Badge variant="emerald">New Customer</Badge>;
      default:
        return <Badge variant="slate">Inactive</Badge>;
    }
  };

  const columns = [
    {
      title: 'Customer Name',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-400">{row.address || 'Doorstep Pickup'}</div>
        </div>
      ),
    },
    {
      title: 'Contact Details',
      key: 'phone',
      render: (phone, row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{phone}</div>
          <div className="text-[11px] text-slate-400">{row.email || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Segment Tag',
      key: 'segment',
      render: (val) => getSegmentBadge(val),
    },
    {
      title: 'Total Bookings',
      key: 'orderCount',
      render: (count) => (
        <span className="font-bold text-xs text-slate-900">{count} Orders</span>
      ),
    },
    {
      title: 'Lifetime Value (LTV)',
      key: 'totalSpent',
      render: (val) => (
        <span className="font-extrabold text-xs text-emerald-700">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Average Order Value',
      key: 'averageOrderValue',
      render: (val) => (
        <span className="font-semibold text-xs text-slate-700">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      title: 'Last Activity',
      key: 'lastOrderDate',
      render: (val, row) => (
        <div className="text-xs text-slate-500">
          <div>{formatDate(val)}</div>
          <span className="text-[10px] text-slate-400">({row.daysSinceLastOrder} days ago)</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDeleteTargetCustomer(row)}
            title="Delete Customer Profile"
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
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
        title="Customer CRM & Lifetime Value"
        subtitle="Customer segmentation, aggregate spend tracking, and order frequency intelligence."
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-brand-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        isLoading={loading}
        emptyMessage="Customer records are generated automatically as orders are placed."
      />

      {/* Delete Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetCustomer}
        onClose={() => setDeleteTargetCustomer(null)}
        onConfirm={handleDeleteCustomer}
        title={`Delete Customer Profile "${deleteTargetCustomer?.name}"?`}
        message={`Are you sure you want to remove the customer record for ${deleteTargetCustomer?.name} (${deleteTargetCustomer?.phone})? This will remove their saved CRM profile.`}
        confirmText="Delete Customer"
        isLoading={isDeleting}
      />
    </div>
  );
};

