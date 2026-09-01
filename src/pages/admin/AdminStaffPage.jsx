import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
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
import { UserCheck, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_STAFF = {
  name: '',
  phone: '',
  email: '',
  role: 'Delivery Executive',
  hub: 'Central Hub',
  active: true,
};

export const AdminStaffPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(INITIAL_STAFF);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await staffService.getStaff();
      setStaffList(data);
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
    setCurrentStaff({ ...INITIAL_STAFF, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setCurrentStaff({ ...st });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentStaff.name.trim() || !currentStaff.phone.trim()) {
      error('Fields Required', 'Please enter staff name and contact number.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentStaff.id;
      const saved = await staffService.saveStaff(currentStaff);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Staff',
        entityId: saved.id,
        entityName: saved.name,
        user: currentUser,
      });

      success('Staff Member Saved', `${saved.name} updated.`);
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
      await staffService.deleteStaff(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Staff',
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        user: currentUser,
      });
      success('Staff Deleted', 'Member removed.');
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
      title: 'Staff Member',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
          <div className="text-[11px] text-slate-400">{row.hub || 'Central Processing Hub'}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (val) => <Badge variant="royal" size="sm">{val}</Badge>,
    },
    {
      title: 'Contact Phone',
      key: 'phone',
      render: (val) => <span className="text-xs font-semibold text-slate-800">{val}</span>,
    },
    {
      title: 'Status',
      key: 'active',
      render: (val) => (
        <Badge variant={val !== false ? 'emerald' : 'slate'}>
          {val !== false ? 'Active' : 'On Leave'}
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
        title="Operations Staff & Delivery Fleet"
        subtitle="Manage logistics executives, certified dry cleaning masters, and quality inspectors (Requirement #42)."
        actionLabel="Add Staff Member"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={staffList}
        isLoading={loading}
        emptyMessage="No staff members registered yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentStaff.id ? 'Edit Staff Member' : 'Add Staff Member'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name *"
            required
            placeholder="e.g. Suresh Varma"
            value={currentStaff.name}
            onChange={(e) => setCurrentStaff({ ...currentStaff, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone *"
              required
              type="tel"
              value={currentStaff.phone}
              onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={currentStaff.email}
              onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Role & Function
              </label>
              <select
                value={currentStaff.role}
                onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
              >
                <option value="Delivery Executive">Delivery Executive (Rider)</option>
                <option value="Master Dry Cleaner">Master Dry Cleaner</option>
                <option value="Quality Inspector">Quality Inspector (QC)</option>
                <option value="Hub Operations Manager">Hub Operations Manager</option>
              </select>
            </div>

            <Input
              label="Assigned Hub"
              placeholder="e.g. Madhapur Hub"
              value={currentStaff.hub}
              onChange={(e) => setCurrentStaff({ ...currentStaff, hub: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="staff-active"
              checked={currentStaff.active !== false}
              onChange={(e) => setCurrentStaff({ ...currentStaff, active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="staff-active" className="text-xs font-semibold text-slate-700">
              Staff Member Active for Dispatch
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Member
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Remove "${deleteTarget?.name}"?`}
        message="This staff member will be removed from dispatch lists."
        isLoading={isDeleting}
      />
    </div>
  );
};
