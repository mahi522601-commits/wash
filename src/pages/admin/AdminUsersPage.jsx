import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import { auditService } from '../../services/auditService';
import { USER_ROLES } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ShieldAlert, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_USER = {
  email: '',
  displayName: '',
  role: USER_ROLES.ADMIN,
  active: true,
};

export const AdminUsersPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserForm, setCurrentUserForm] = useState(INITIAL_USER);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await staffService.getAdminUsers();
      if (data.length === 0) {
        // Seed default super admin
        setUsers([
          {
            id: 'superadmin-1',
            email: 'admin@techwash.in',
            displayName: 'Tech Wash Super Admin',
            role: USER_ROLES.SUPER_ADMIN,
            active: true,
          }
        ]);
      } else {
        setUsers(data);
      }
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
    setCurrentUserForm({ ...INITIAL_USER, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setCurrentUserForm({ ...u });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUserForm.email.trim()) {
      error('Email Required', 'Please enter user email address.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentUserForm.id;
      const saved = await staffService.saveAdminUser(currentUserForm);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'AdminUser',
        entityId: saved.id,
        entityName: saved.email,
        user: currentUser,
      });

      success('Admin Saved', `${saved.email} role updated.`);
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
    if (deleteTarget.role === USER_ROLES.SUPER_ADMIN) {
      error('Protected User', 'Cannot delete primary Super Admin.');
      setDeleteTarget(null);
      return;
    }
    setIsDeleting(true);
    try {
      await staffService.deleteAdminUser(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'AdminUser',
        entityId: deleteTarget.id,
        entityName: deleteTarget.email,
        user: currentUser,
      });
      success('User Deleted', 'Admin user removed.');
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
      title: 'Administrator',
      key: 'displayName',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{val || row.email}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Assigned Role',
      key: 'role',
      render: (role) => (
        <Badge variant={role === USER_ROLES.SUPER_ADMIN ? 'purple' : 'royal'} size="sm">
          {role.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
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
          {row.role !== USER_ROLES.SUPER_ADMIN && (
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Users & Role Permissions"
        subtitle="Manage administrative accounts, role-based authorization scopes, and platform security (Requirement #38, #39)."
        actionLabel="Add Admin User"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={users}
        isLoading={loading}
        emptyMessage="No admin users found."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title={currentUserForm.id ? 'Edit Admin User' : 'Create Admin Account'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Email Address *"
            required
            type="email"
            placeholder="admin@techwash.in"
            value={currentUserForm.email}
            onChange={(e) => setCurrentUserForm({ ...currentUserForm, email: e.target.value })}
          />

          <Input
            label="Display Name"
            placeholder="e.g. Operations Manager"
            value={currentUserForm.displayName}
            onChange={(e) => setCurrentUserForm({ ...currentUserForm, displayName: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Role Permission Scope *
            </label>
            <select
              value={currentUserForm.role}
              onChange={(e) => setCurrentUserForm({ ...currentUserForm, role: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800"
            >
              <option value={USER_ROLES.SUPER_ADMIN}>Super Admin (Full Platform & System Access)</option>
              <option value={USER_ROLES.ADMIN}>Admin (Full Content CMS & Orders)</option>
              <option value={USER_ROLES.MANAGER}>Manager (Orders, CRM & Pricing)</option>
              <option value={USER_ROLES.STAFF}>Staff (Order Progression & Quality Check)</option>
              <option value={USER_ROLES.DELIVERY_EXECUTIVE}>Delivery Executive (Pickup & Delivery Only)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="user-active"
              checked={currentUserForm.active !== false}
              onChange={(e) => setCurrentUserForm({ ...currentUserForm, active: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="user-active" className="text-xs font-semibold text-slate-700">
              Account Active & Enabled
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save User
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.email}"?`}
        message="This user will lose access to the administrative suite immediately."
        isLoading={isDeleting}
      />
    </div>
  );
};
