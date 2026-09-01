import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Layers, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_PROCESS_STEP = {
  stepNumber: '01',
  title: '',
  bullets: ['Add step operational bullet detail'],
  order: 1,
};

export const AdminProcessPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(INITIAL_PROCESS_STEP);
  const [newBullet, setNewBullet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('processSteps');
      setSteps(data);
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
    const nextNum = steps.length + 1;
    setCurrentStep({
      ...INITIAL_PROCESS_STEP,
      id: null,
      stepNumber: nextNum < 10 ? `0${nextNum}` : `${nextNum}`,
      order: nextNum,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setCurrentStep({ ...st });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentStep.title.trim()) {
      error('Title Required', 'Please enter a stage title.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentStep.id;
      const saved = await cmsService.saveItem('processSteps', currentStep);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'ProcessStep',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Stage Saved', `Step ${saved.stepNumber} updated.`);
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
      await cmsService.deleteItem('processSteps', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'ProcessStep',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Deleted', 'Process step removed.');
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
    setCurrentStep({
      ...currentStep,
      bullets: [...(currentStep.bullets || []), newBullet.trim()]
    });
    setNewBullet('');
  };

  const removeBullet = (bIdx) => {
    setCurrentStep({
      ...currentStep,
      bullets: currentStep.bullets.filter((_, i) => i !== bIdx)
    });
  };

  const columns = [
    {
      title: 'Stage',
      key: 'stepNumber',
      render: (val) => (
        <span className="font-mono font-bold text-sm bg-brand-600 text-white px-2.5 py-1 rounded-xl shadow-sm">
          {val}
        </span>
      ),
    },
    {
      title: 'Stage Title',
      key: 'title',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-400">{row.bullets?.length || 0} Operational points</div>
        </div>
      ),
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
        title="6-Stage Process Roadmap CMS"
        subtitle="Manage the customer journey timeline nodes, sequence order, and individual bullet points."
        actionLabel="Add Process Step"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={steps}
        isLoading={loading}
        emptyMessage="No process stages configured."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-lg"
        title={currentStep.id ? `Edit Stage ${currentStep.stepNumber}` : 'Add Process Stage'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Step No."
              placeholder="01"
              value={currentStep.stepNumber}
              onChange={(e) => setCurrentStep({ ...currentStep, stepNumber: e.target.value })}
            />
            <div className="col-span-2">
              <Input
                label="Stage Title *"
                required
                placeholder="e.g. Optical Inspection"
                value={currentStep.title}
                onChange={(e) => setCurrentStep({ ...currentStep, title: e.target.value })}
              />
            </div>
          </div>

          {/* Structured Bullets */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Operational Bullet Points
            </label>
            <div className="space-y-2">
              {currentStep.bullets?.map((b, idx) => (
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
                placeholder="Add bullet point..."
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
              Save Stage
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Stage "${deleteTarget?.title}"?`}
        message="This step will be removed from the process timeline."
        isLoading={isDeleting}
      />
    </div>
  );
};
