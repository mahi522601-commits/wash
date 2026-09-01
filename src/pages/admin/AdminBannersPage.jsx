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
import { Flag, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_BANNER = {
  title: '',
  description: '',
  desktopImage: '',
  mobileImage: '',
  url: '/book-pickup',
  ctaText: 'Explore Offer',
  startDate: '',
  endDate: '',
  active: true,
  order: 1,
};

export const AdminBannersPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(INITIAL_BANNER);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBanners = async () => {
    try {
      const data = await cmsService.getItems('banners');
      setBanners(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenCreate = () => {
    setCurrentBanner({ ...INITIAL_BANNER, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setCurrentBanner({ ...b });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentBanner.title.trim()) {
      error('Title Required', 'Please enter banner title.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentBanner.id;
      const saved = await cmsService.saveItem('banners', currentBanner);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Banner',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Banner Saved', `${saved.title} updated.`);
      setModalOpen(false);
      loadBanners();
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
      await cmsService.deleteItem('banners', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Banner',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Banner Removed', 'Promotional banner deleted.');
      setDeleteTarget(null);
      loadBanners();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Banner',
      key: 'title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.desktopImage ? (
            <img src={row.desktopImage} alt={val} className="w-16 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
              No Image
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-xs">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Link URL',
      key: 'url',
      render: (val) => <span className="text-xs font-mono text-brand-700">{val}</span>,
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
        title="Promotional Banners CMS"
        subtitle="Manage scheduled advertising and campaign banners on the website."
        actionLabel="Add Promotional Banner"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={banners}
        isLoading={loading}
        emptyMessage="No promotional banners created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title={currentBanner.id ? 'Edit Promotional Banner' : 'Add Promotional Banner'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Banner Title *"
            required
            placeholder="e.g. Monsoon Care Special: 20% OFF Woolens"
            value={currentBanner.title}
            onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
          />

          <Textarea
            label="Short Description"
            rows={2}
            value={currentBanner.description}
            onChange={(e) => setCurrentBanner({ ...currentBanner, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CTA Button Text"
              value={currentBanner.ctaText}
              onChange={(e) => setCurrentBanner({ ...currentBanner, ctaText: e.target.value })}
            />
            <Input
              label="Destination URL"
              value={currentBanner.url}
              onChange={(e) => setCurrentBanner({ ...currentBanner, url: e.target.value })}
            />
          </div>

          <Input
            label="Desktop Banner Image URL"
            placeholder="https://..."
            value={currentBanner.desktopImage}
            onChange={(e) => setCurrentBanner({ ...currentBanner, desktopImage: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date (Optional)"
              type="date"
              value={currentBanner.startDate}
              onChange={(e) => setCurrentBanner({ ...currentBanner, startDate: e.target.value })}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={currentBanner.endDate}
              onChange={(e) => setCurrentBanner({ ...currentBanner, endDate: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="banner-active"
              checked={currentBanner.active !== false}
              onChange={(e) => setCurrentBanner({ ...currentBanner, active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="banner-active" className="text-xs font-semibold text-slate-700">
              Banner Active
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Banner
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Banner "${deleteTarget?.title}"?`}
        message="This banner will be removed from display."
        isLoading={isDeleting}
      />
    </div>
  );
};
