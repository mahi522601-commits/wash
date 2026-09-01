import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DollarSign, Plus, Edit3, Trash2, Search } from 'lucide-react';

const INITIAL_ITEM = {
  name: '',
  category: 'Men',
  washAndIron: 49,
  dryClean: 129,
  steamIron: 29,
  unit: 'piece',
};

export const AdminPricingPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(INITIAL_ITEM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPricing = async () => {
    try {
      const data = await cmsService.getItems('pricingItems');
      setItems(data);
    } catch (e) {
      console.warn("Pricing load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  const handleOpenCreate = () => {
    setCurrentItem({ ...INITIAL_ITEM, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setCurrentItem({ ...item });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentItem.name.trim()) {
      error('Name Required', 'Please enter a garment item name.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentItem.id;
      const saved = await cmsService.saveItem('pricingItems', currentItem);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Pricing',
        entityId: saved.id,
        entityName: saved.name,
        user: currentUser,
      });

      success('Price Updated', `${saved.name} saved to rate card.`);
      setModalOpen(false);
      loadPricing();
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await cmsService.deleteItem('pricingItems', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Pricing',
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        user: currentUser,
      });
      success('Item Removed', `${deleteTarget.name} removed from rate card.`);
      setDeleteTarget(null);
      loadPricing();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      title: 'Garment Item',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-400">Category: {row.category}</div>
        </div>
      ),
    },
    {
      title: 'Wash & Iron Rate',
      key: 'washAndIron',
      render: (val) => (
        <span className="font-semibold text-xs text-brand-700">
          {val ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      title: 'Dry Clean Rate',
      key: 'dryClean',
      render: (val) => (
        <span className="font-semibold text-xs text-royal-700">
          {val ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      title: 'Steam Iron Rate',
      key: 'steamIron',
      render: (val) => (
        <span className="font-semibold text-xs text-purple-700">
          {val ? formatCurrency(val) : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
        title="Pricing & Rate Card CMS"
        subtitle="Manage live garment prices, per piece/kg models, and interactive calculator items."
        actionLabel="Add Garment Item"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search garment item..."
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
        emptyMessage="No pricing items found."
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentItem.id ? `Edit ${currentItem.name}` : 'Add Garment Item'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Garment Name *"
            required
            placeholder="e.g. Silk Saree / Blazer"
            value={currentItem.name}
            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <select
              value={currentItem.category}
              onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Household">Household & Bedding</option>
              <option value="Footwear">Footwear & Bags</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Wash & Iron (₹)"
              type="number"
              value={currentItem.washAndIron || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, washAndIron: Number(e.target.value) || null })}
            />
            <Input
              label="Dry Clean (₹)"
              type="number"
              value={currentItem.dryClean || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, dryClean: Number(e.target.value) || null })}
            />
            <Input
              label="Steam Iron (₹)"
              type="number"
              value={currentItem.steamIron || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, steamIron: Number(e.target.value) || null })}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Item
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Remove "${deleteTarget?.name}"?`}
        message="This item will be deleted from the live rate card."
        isLoading={isDeleting}
      />
    </div>
  );
};
