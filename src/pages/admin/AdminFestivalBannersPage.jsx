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
import { PartyPopper, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_FESTIVAL = {
  title: '',
  description: '',
  desktopImage: '',
  url: '/offers',
  startDate: '',
  endDate: '',
  priority: 1,
  active: true,
};

export const AdminFestivalBannersPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [festivalBanners, setFestivalBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(INITIAL_FESTIVAL);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBanners = async () => {
    try {
      const data = await cmsService.getItems('festivalBanners');
      setFestivalBanners(data);
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
    setCurrentBanner({ ...INITIAL_FESTIVAL, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setCurrentBanner({ ...b });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentBanner.title.trim()) {
      error('Title Required', 'Please enter festival banner title.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentBanner.id;
      const saved = await cmsService.saveItem('festivalBanners', currentBanner);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'FestivalBanner',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Festival Banner Saved', `${saved.title} updated.`);
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
      await cmsService.deleteItem('festivalBanners', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'FestivalBanner',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Banner Removed', 'Festival banner deleted.');
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
      title: 'Festival Campaign',
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
            <div className="text-[11px] text-slate-400">{row.startDate ? `${row.startDate} to ${row.endDate || 'Active'}` : 'No date limit'}</div>
          </div>
        </div>
      ),
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
        title="Festival Banners CMS"
        subtitle="Schedule date-bounded festival campaigns (Diwali, Eid, New Year) with auto-expiry."
        actionLabel="Add Festival Banner"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={festivalBanners}
        isLoading={loading}
        emptyMessage="No festival banners scheduled yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title={currentBanner.id ? 'Edit Festival Banner' : 'Add Festival Banner'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Festival Banner Title *"
            required
            placeholder="e.g. Diwali Shimmer Care: Flat 25% OFF on Ethnic Silk Sarees"
            value={currentBanner.title}
            onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
          />

          <Input
            label="Banner Destination Link"
            value={currentBanner.url}
            onChange={(e) => setCurrentBanner({ ...currentBanner, url: e.target.value })}
          />

          <Input
            label="Banner Graphic URL"
            placeholder="https://..."
            value={currentBanner.desktopImage}
            onChange={(e) => setCurrentBanner({ ...currentBanner, desktopImage: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={currentBanner.startDate}
              onChange={(e) => setCurrentBanner({ ...currentBanner, startDate: e.target.value })}
            />
            <Input
              label="End Date (Auto-Expires After)"
              type="date"
              value={currentBanner.endDate}
              onChange={(e) => setCurrentBanner({ ...currentBanner, endDate: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fest-active"
              checked={currentBanner.active !== false}
              onChange={(e) => setCurrentBanner({ ...currentBanner, active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="fest-active" className="text-xs font-semibold text-slate-700">
              Banner Active
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Festival Banner
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This festival campaign will be removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
