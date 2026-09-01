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
import { ImageFocalEditor } from '../../components/admin/ImageFocalEditor';
import { Film, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_SLIDE = {
  title: '',
  badge: '✨ Technology-Driven Garment Care',
  subtitle: '',
  ctaPrimaryText: 'Book Doorstep Pickup',
  ctaPrimaryUrl: '/book-pickup',
  ctaSecondaryText: 'View Rates',
  ctaSecondaryUrl: '/pricing',
  desktopImage: '',
  mobileImage: '',
  order: 1,
  active: true,
};

export const AdminHeroSlidesPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(INITIAL_SLIDE);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSlides = async () => {
    try {
      const list = await cmsService.getItems('heroSlides');
      setSlides(list);
    } catch (e) {
      console.warn("Failed to load slides:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const handleOpenCreate = () => {
    setCurrentSlide({ ...INITIAL_SLIDE, id: null, order: slides.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (slide) => {
    setCurrentSlide({ ...slide });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentSlide.title.trim()) {
      error('Title Required', 'Please enter a slide heading.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentSlide.id;
      const saved = await cmsService.saveItem('heroSlides', currentSlide);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'HeroSlide',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Slide Saved', `${saved.title} updated.`);
      setModalOpen(false);
      loadSlides();
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
      await cmsService.deleteItem('heroSlides', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'HeroSlide',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Slide Deleted', 'Hero slide removed.');
      setDeleteTarget(null);
      loadSlides();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Slide Banner',
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
            <div className="text-[11px] text-slate-400">{row.badge}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'CTAs',
      key: 'ctaPrimaryText',
      render: (val, row) => (
        <span className="text-xs text-slate-700">
          {val} ({row.ctaPrimaryUrl})
        </span>
      ),
    },
    {
      title: 'Order',
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
        title="Hero Slider CMS"
        subtitle="Manage full-bleed visual slides, desktop/mobile images, video overlays, and primary CTAs on the homepage."
        actionLabel="Add Hero Slide"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={slides}
        isLoading={loading}
        emptyMessage="No hero slides found."
      />

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title={currentSlide.id ? 'Edit Hero Slide' : 'Add New Hero Slide'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Slide Heading *"
            required
            placeholder="e.g. Next-Generation Premium Garment Care"
            value={currentSlide.title}
            onChange={(e) => setCurrentSlide({ ...currentSlide, title: e.target.value })}
          />

          <Input
            label="Badge Text"
            placeholder="e.g. ✨ Technology-Driven Laundry & Dry Cleaning"
            value={currentSlide.badge}
            onChange={(e) => setCurrentSlide({ ...currentSlide, badge: e.target.value })}
          />

          <Textarea
            label="Subtitle / Description"
            rows={3}
            placeholder="Slide description text..."
            value={currentSlide.subtitle}
            onChange={(e) => setCurrentSlide({ ...currentSlide, subtitle: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary CTA Text"
              value={currentSlide.ctaPrimaryText}
              onChange={(e) => setCurrentSlide({ ...currentSlide, ctaPrimaryText: e.target.value })}
            />
            <Input
              label="Primary CTA URL"
              value={currentSlide.ctaPrimaryUrl}
              onChange={(e) => setCurrentSlide({ ...currentSlide, ctaPrimaryUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Secondary CTA Text"
              value={currentSlide.ctaSecondaryText}
              onChange={(e) => setCurrentSlide({ ...currentSlide, ctaSecondaryText: e.target.value })}
            />
            <Input
              label="Secondary CTA URL"
              value={currentSlide.ctaSecondaryUrl}
              onChange={(e) => setCurrentSlide({ ...currentSlide, ctaSecondaryUrl: e.target.value })}
            />
          </div>

          <Input
            label="Desktop Background Image URL"
            placeholder="https://..."
            value={currentSlide.desktopImage}
            onChange={(e) => setCurrentSlide({ ...currentSlide, desktopImage: e.target.value })}
          />

          <ImageFocalEditor
            imageUrl={currentSlide.desktopImage}
            focalX={currentSlide.focalX || 50}
            focalY={currentSlide.focalY || 50}
            zoom={currentSlide.zoom || 100}
            onChange={({ focalX, focalY, zoom }) => setCurrentSlide({ ...currentSlide, focalX, focalY, zoom })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Order"
              type="number"
              value={currentSlide.order}
              onChange={(e) => setCurrentSlide({ ...currentSlide, order: Number(e.target.value) })}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="slide-active"
                checked={currentSlide.active !== false}
                onChange={(e) => setCurrentSlide({ ...currentSlide, active: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="slide-active" className="text-xs font-semibold text-slate-700">
                Slide is Active & Visible
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Slide
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Slide "${deleteTarget?.title}"?`}
        message="This slide will be removed from the homepage hero carousel."
        isLoading={isDeleting}
      />
    </div>
  );
};
