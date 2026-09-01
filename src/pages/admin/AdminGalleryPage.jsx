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
import { Layers, Plus, Edit3, Trash2, Eye } from 'lucide-react';

const INITIAL_GALLERY = {
  title: '',
  category: 'Couture',
  imageUrl: '',
  description: '',
  altText: '',
  order: 1,
  active: true,
};

export const AdminGalleryPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGallery, setCurrentGallery] = useState(INITIAL_GALLERY);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('gallery');
      setGallery(data);
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
    setCurrentGallery({ ...INITIAL_GALLERY, id: null, order: gallery.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (g) => {
    setCurrentGallery({ ...g });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentGallery.title.trim() || !currentGallery.imageUrl.trim()) {
      error('Fields Required', 'Please provide a title and image URL.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentGallery.id;
      const saved = await cmsService.saveItem('gallery', currentGallery);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Gallery',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Saved', `${saved.title} updated in gallery.`);
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
      await cmsService.deleteItem('gallery', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Gallery',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Deleted', 'Gallery item removed.');
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
      title: 'Transformation Showcase',
      key: 'title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.imageUrl} alt={val} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-xs">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (val) => <Badge variant="royal" size="sm">{val}</Badge>,
    },
    {
      title: 'Status',
      key: 'active',
      render: (val) => (
        <Badge variant={val !== false ? 'emerald' : 'slate'}>
          {val !== false ? 'Visible' : 'Hidden'}
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
        title="Photo Gallery CMS"
        subtitle="Manage before-and-after garment transformations and craftsmanship showcases."
        actionLabel="Add Gallery Image"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={gallery}
        isLoading={loading}
        emptyMessage="No gallery transformation photos added yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentGallery.id ? 'Edit Gallery Photo' : 'Add Gallery Photo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Title / Garment Description *"
            required
            placeholder="e.g. Silk Saree Gold Zari Preservation"
            value={currentGallery.title}
            onChange={(e) => setCurrentGallery({ ...currentGallery, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <select
              value={currentGallery.category}
              onChange={(e) => setCurrentGallery({ ...currentGallery, category: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
            >
              <option value="Couture">Couture & Ethnic</option>
              <option value="Dry Cleaning">Dry Cleaning</option>
              <option value="Steam Ironing">Steam Ironing</option>
              <option value="Shoe Spa">Shoe Spa & Sneakers</option>
              <option value="Laundry">Laundry & Soft Wash</option>
            </select>
          </div>

          <Input
            label="Image URL *"
            required
            placeholder="https://... or copy from Media Library"
            value={currentGallery.imageUrl}
            onChange={(e) => setCurrentGallery({ ...currentGallery, imageUrl: e.target.value })}
          />

          <Input
            label="Image Alt Text (SEO & Accessibility)"
            placeholder="Accessible description..."
            value={currentGallery.altText}
            onChange={(e) => setCurrentGallery({ ...currentGallery, altText: e.target.value })}
          />

          <Textarea
            label="Detailed Caption"
            rows={2}
            value={currentGallery.description}
            onChange={(e) => setCurrentGallery({ ...currentGallery, description: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Photo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This photo will be removed from the gallery."
        isLoading={isDeleting}
      />
    </div>
  );
};
