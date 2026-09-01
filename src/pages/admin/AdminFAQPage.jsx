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
import { HelpCircle, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_FAQ = {
  q: '',
  a: '',
  category: 'General',
  order: 1,
  active: true,
};

export const AdminFAQPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState(INITIAL_FAQ);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('faqs');
      setFaqs(data);
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
    setCurrentFaq({ ...INITIAL_FAQ, id: null, order: faqs.length + 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (f) => {
    setCurrentFaq({ ...f });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentFaq.q.trim() || !currentFaq.a.trim()) {
      error('Fields Required', 'Please provide question and answer.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentFaq.id;
      const saved = await cmsService.saveItem('faqs', currentFaq);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'FAQ',
        entityId: saved.id,
        entityName: saved.q,
        user: currentUser,
      });

      success('FAQ Saved', 'Question updated in help center.');
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
      await cmsService.deleteItem('faqs', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'FAQ',
        entityId: deleteTarget.id,
        entityName: deleteTarget.q,
        user: currentUser,
      });
      success('Deleted', 'FAQ removed.');
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
      title: 'Question',
      key: 'q',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.a}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (val) => <Badge variant="royal" size="sm">{val}</Badge>,
    },
    {
      title: 'Order',
      key: 'order',
      render: (val) => <span className="font-bold text-xs">#{val}</span>,
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
        title="Frequently Asked Questions (FAQ) CMS"
        subtitle="Manage categorized questions and answers displayed in the public help center and service pages."
        actionLabel="Add New FAQ"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={faqs}
        isLoading={loading}
        emptyMessage="No FAQs created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentFaq.id ? 'Edit FAQ' : 'Add FAQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Question *"
            required
            placeholder="e.g. Is RO water used for every wash cycle?"
            value={currentFaq.q}
            onChange={(e) => setCurrentFaq({ ...currentFaq, q: e.target.value })}
          />

          <Input
            label="Category"
            placeholder="e.g. Fabric Care / Pickup"
            value={currentFaq.category}
            onChange={(e) => setCurrentFaq({ ...currentFaq, category: e.target.value })}
          />

          <Textarea
            label="Answer Body *"
            required
            rows={4}
            value={currentFaq.a}
            onChange={(e) => setCurrentFaq({ ...currentFaq, a: e.target.value })}
          />

          <Input
            label="Display Order"
            type="number"
            value={currentFaq.order}
            onChange={(e) => setCurrentFaq({ ...currentFaq, order: Number(e.target.value) })}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Question
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this FAQ?"
        message="This question will be removed from help center accordions."
        isLoading={isDeleting}
      />
    </div>
  );
};
