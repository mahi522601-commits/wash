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
import { Award, Plus, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

const INITIAL_QUALITY_CARD = {
  title: '',
  subtitle: '',
  image: '',
  focalX: 50,
  focalY: 50,
  zoom: 100,
  bullets: [
    'Digitally controlled gentle wash cycles',
    'Fabric-sensitive temperature regulation'
  ],
  order: 1,
  active: true,
};

export const AdminQualityServicesPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState(INITIAL_QUALITY_CARD);
  const [newBullet, setNewBullet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('qualityServices');
      setCards(data);
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
    setCurrentCard({ ...INITIAL_QUALITY_CARD, id: null, order: cards.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setCurrentCard({ ...c });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentCard.title.trim() || !currentCard.image.trim()) {
      error('Fields Required', 'Please provide a title and image URL.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentCard.id;
      const saved = await cmsService.saveItem('qualityServices', currentCard);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'QualityService',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Quality Pillar Saved', `${saved.title} updated.`);
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
      await cmsService.deleteItem('qualityServices', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'QualityService',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Deleted', 'Quality pillar removed.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const addBullet = () => {
    if (!newBullet.trim()) return;
    setCurrentCard({
      ...currentCard,
      bullets: [...(currentCard.bullets || []), newBullet.trim()]
    });
    setNewBullet('');
  };

  const removeBullet = (bIdx) => {
    setCurrentCard({
      ...currentCard,
      bullets: currentCard.bullets.filter((_, i) => i !== bIdx)
    });
  };

  const columns = [
    {
      title: 'Quality Standard',
      key: 'title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <img src={row.image} alt={val} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
            <div className="text-[11px] text-slate-500 line-clamp-1">{row.subtitle}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Verification Points',
      key: 'bullets',
      render: (bullets) => (
        <span className="text-xs font-bold text-brand-700">
          {bullets?.length || 0} Criteria
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
          {val !== false ? 'Active' : 'Disabled'}
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
        title="Quality of Service & Guarantee CMS"
        subtitle="Manage the 'Impeccable Care. Every Time.' 50-70% visual area photography cards and verified handling protocols."
        actionLabel="Add Quality Card"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={cards}
        isLoading={loading}
        emptyMessage="No quality standard cards created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title={currentCard.id ? 'Edit Quality Standard Card' : 'Add Quality Standard Card'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Quality Title *"
            required
            placeholder="e.g. Professional Cleaning Equipment"
            value={currentCard.title}
            onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
          />

          <Textarea
            label="Subtitle / Summary Description *"
            required
            rows={2}
            value={currentCard.subtitle}
            onChange={(e) => setCurrentCard({ ...currentCard, subtitle: e.target.value })}
          />

          <Input
            label="High-Resolution Photo URL *"
            required
            placeholder="https://..."
            value={currentCard.image}
            onChange={(e) => setCurrentCard({ ...currentCard, image: e.target.value })}
          />

          {/* Embedded Visual Focal Point Adjuster */}
          <ImageFocalEditor
            imageUrl={currentCard.image}
            focalX={currentCard.focalX || 50}
            focalY={currentCard.focalY || 50}
            zoom={currentCard.zoom || 100}
            onChange={({ focalX, focalY, zoom }) => setCurrentCard({ ...currentCard, focalX, focalY, zoom })}
          />

          {/* Structured Bullet Points */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Verified Handling Checklist
            </label>
            <div className="space-y-2">
              {currentCard.bullets?.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span>• {b}</span>
                  <button
                    type="button"
                    onClick={() => removeBullet(idx)}
                    className="text-rose-500 hover:text-rose-700 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Add verified handling bullet point..."
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
              />
              <Button variant="secondary" size="md" onClick={addBullet}>
                Add
              </Button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Quality Standard
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This quality pillar will be removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
