import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Award, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_BENEFIT = {
  title: '',
  description: '',
  icon: 'Droplets',
  order: 1,
  active: true,
};

export const AdminWhyChooseUsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBenefit, setCurrentBenefit] = useState(INITIAL_BENEFIT);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('whyChooseUs');
      setBenefits(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setCurrentBenefit({ ...INITIAL_BENEFIT, id: null, order: benefits.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setCurrentBenefit({ ...b });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentBenefit.title.trim()) {
      error('Title Required', 'Please provide a benefit title.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentBenefit.id;
      const saved = await cmsService.saveItem('whyChooseUs', currentBenefit);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'WhyChooseUs',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Benefit Saved', `${saved.title} updated.`);
      setModalOpen(false);
      loadData();
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
      await cmsService.deleteItem('whyChooseUs', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'WhyChooseUs',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Deleted', 'Benefit removed.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Benefit Card',
      key: 'title',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.description}</div>
        </div>
      ),
    },
    {
      title: 'Icon Type',
      key: 'icon',
      render: (val) => <Badge variant="brand" size="sm">{val}</Badge>,
    },
    {
      title: 'Display Order',
      key: 'order',
      render: (val) => <span className="font-bold text-xs">#{val}</span>,
    },
    {
      title: 'Status',
      key: 'active',
      render: (val) => (
        <Badge variant={val !== false ? 'emerald' : 'slate'}>
          {val !== false ? 'Active' : 'Inactive'}
        </Badge>
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
        title="Why Choose Tech Wash CMS"
        subtitle="Manage unique technology benefits and value propositions displayed on the homepage."
        actionLabel="Add Benefit Card"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={benefits}
        isLoading={loading}
        emptyMessage="No benefit cards created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentBenefit.id ? 'Edit Benefit Card' : 'Add Benefit Card'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Benefit Title *"
            required
            placeholder="e.g. RO Soft Water Washing"
            value={currentBenefit.title}
            onChange={(e) => setCurrentBenefit({ ...currentBenefit, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Icon Symbol
            </label>
            <select
              value={currentBenefit.icon}
              onChange={(e) => setCurrentBenefit({ ...currentBenefit, icon: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
            >
              <option value="Droplets">Droplets (Soft Water)</option>
              <option value="Sparkles">Sparkles (Eco Solvent)</option>
              <option value="Clock">Clock (Speed / 45-Min Pickup)</option>
              <option value="ShieldCheck">ShieldCheck (10-Stage QC)</option>
              <option value="Truck">Truck (Doorstep Delivery)</option>
              <option value="Award">Award (Certified Technicians)</option>
            </select>
          </div>

          <Textarea
            label="Description *"
            required
            rows={3}
            value={currentBenefit.description}
            onChange={(e) => setCurrentBenefit({ ...currentBenefit, description: e.target.value })}
          />

          <Input
            label="Display Order"
            type="number"
            value={currentBenefit.order}
            onChange={(e) => setCurrentBenefit({ ...currentBenefit, order: Number(e.target.value) })}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Card
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This benefit card will be removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
