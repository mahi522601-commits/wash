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
import { MessageSquareQuote, Plus, Edit3, Trash2, Star } from 'lucide-react';

const INITIAL_TESTIMONIAL = {
  customerName: '',
  location: 'Hyderabad',
  serviceUsed: 'Premium Dry Cleaning',
  rating: 5,
  review: '',
  verified: true,
  featured: true,
  active: true,
};

export const AdminTestimonialsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(INITIAL_TESTIMONIAL);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('testimonials');
      setTestimonials(data);
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
    setCurrentTestimonial({ ...INITIAL_TESTIMONIAL, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setCurrentTestimonial({ ...t });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentTestimonial.customerName.trim() || !currentTestimonial.review.trim()) {
      error('Fields Required', 'Please provide customer name and review text.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentTestimonial.id;
      const saved = await cmsService.saveItem('testimonials', currentTestimonial);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Testimonial',
        entityId: saved.id,
        entityName: saved.customerName,
        user: currentUser,
      });

      success('Saved', `Review from ${saved.customerName} saved.`);
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
      await cmsService.deleteItem('testimonials', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Testimonial',
        entityId: deleteTarget.id,
        entityName: deleteTarget.customerName,
        user: currentUser,
      });
      success('Deleted', 'Testimonial removed.');
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
      title: 'Customer',
      key: 'customerName',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-400">{row.location} • {row.serviceUsed}</div>
        </div>
      ),
    },
    {
      title: 'Rating',
      key: 'rating',
      render: (val) => (
        <div className="flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: val || 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-current" />
          ))}
        </div>
      ),
    },
    {
      title: 'Review Snippet',
      key: 'review',
      render: (val) => <span className="text-xs text-slate-600 line-clamp-1 italic max-w-xs">"{val}"</span>,
    },
    {
      title: 'Status',
      key: 'active',
      render: (val) => (
        <Badge variant={val !== false ? 'emerald' : 'slate'}>
          {val !== false ? 'Active' : 'Hidden'}
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
        title="Customer Testimonials CMS"
        subtitle="Manage verified customer ratings and reviews displayed across the website."
        actionLabel="Add Testimonial"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={testimonials}
        isLoading={loading}
        emptyMessage="No customer reviews added yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentTestimonial.id ? 'Edit Testimonial' : 'Add Testimonial'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Customer Name *"
            required
            placeholder="e.g. Vikram Joshi"
            value={currentTestimonial.customerName}
            onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, customerName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="e.g. Hyderabad"
              value={currentTestimonial.location}
              onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, location: e.target.value })}
            />
            <Input
              label="Service Used"
              placeholder="e.g. Silk Dry Clean"
              value={currentTestimonial.serviceUsed}
              onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, serviceUsed: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Star Rating (1 to 5)
            </label>
            <select
              value={currentTestimonial.rating}
              onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, rating: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
            >
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
            </select>
          </div>

          <Textarea
            label="Customer Review Text *"
            required
            rows={3}
            value={currentTestimonial.review}
            onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, review: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Testimonial
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Review by "${deleteTarget?.customerName}"?`}
        message="This testimonial will be removed from display."
        isLoading={isDeleting}
      />
    </div>
  );
};
