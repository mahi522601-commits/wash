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
import { Megaphone, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_ANNOUNCEMENT = {
  title: '',
  message: '',
  link: '/offers',
  ctaText: 'View Details',
  priority: 1,
  active: true,
};

export const AdminAnnouncementsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(INITIAL_ANNOUNCEMENT);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('announcements');
      setAnnouncements(data);
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
    setCurrentAnnouncement({ ...INITIAL_ANNOUNCEMENT, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setCurrentAnnouncement({ ...a });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentAnnouncement.title.trim() || !currentAnnouncement.message.trim()) {
      error('Fields Required', 'Please provide title and announcement message.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentAnnouncement.id;
      const saved = await cmsService.saveItem('announcements', currentAnnouncement);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Announcement',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Announcement Saved', `${saved.title} updated.`);
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
      await cmsService.deleteItem('announcements', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Announcement',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Deleted', 'Announcement removed.');
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
      title: 'Announcement Title',
      key: 'title',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.message}</div>
        </div>
      ),
    },
    {
      title: 'Link URL',
      key: 'link',
      render: (val) => <span className="text-xs font-mono text-brand-700">{val || '—'}</span>,
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
        title="Announcements & Notification Bar"
        subtitle="Manage website header ticker messages and store service updates."
        actionLabel="Create Announcement"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={announcements}
        isLoading={loading}
        emptyMessage="No announcements created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentAnnouncement.id ? 'Edit Announcement' : 'Create Announcement'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Title *"
            required
            placeholder="e.g. Holiday Schedule Announcement"
            value={currentAnnouncement.title}
            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, title: e.target.value })}
          />

          <Textarea
            label="Message Body *"
            required
            rows={3}
            placeholder="Announcement message displayed to users..."
            value={currentAnnouncement.message}
            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, message: e.target.value })}
          />

          <Input
            label="Action Link (Optional)"
            placeholder="/offers or https://..."
            value={currentAnnouncement.link}
            onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, link: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ann-active"
              checked={currentAnnouncement.active !== false}
              onChange={(e) => setCurrentAnnouncement({ ...currentAnnouncement, active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="ann-active" className="text-xs font-semibold text-slate-700">
              Active & Broadcast to Website
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Announcement
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This announcement will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
