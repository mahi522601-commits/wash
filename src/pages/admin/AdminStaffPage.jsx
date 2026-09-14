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
import { 
  UserCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Bike, 
  ShieldCheck, 
  Check, 
  Clock 
} from 'lucide-react';

const INITIAL_STAFF = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'Delivery Executive',
  hub: 'Banjara Hills Hub',
  vehicleNumber: '',
  dutyStatus: 'ON_DUTY',
  active: true,
};

export const AdminStaffPage = () => {
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(INITIAL_STAFF);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

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
    const defaultPassword = staffService.generateSecurePassword(8);
    setCurrentStaff({ 
      ...INITIAL_STAFF, 
      id: null,
      password: defaultPassword,
    });
    setShowPassword(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setCurrentStaff({ 
      ...st,
      password: st.password || staffService.generateSecurePassword(8)
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const newPwd = staffService.generateSecurePassword(8);
    setCurrentStaff({ ...currentStaff, password: newPwd });
    setShowPassword(true);
  };

  const handleCopyCredentials = (staff) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `🚀 Tech Wash Worker Login Credentials:
Portal URL: ${origin}/worker/login
Worker Name: ${staff.name}
Email / Login: ${staff.email || staff.phone + '@techwash.in'}
Password: ${staff.password || 'Contact Admin'}
Hub: ${staff.hub || 'Central Hub'}
Role: ${staff.role || 'Delivery Executive'}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(staff.id);
      success('Copied to Clipboard!', `Login details for ${staff.name} copied.`);
      setTimeout(() => setCopiedId(null), 3000);
    }).catch(() => {
      info('Credentials', text);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentStaff.name.trim() || !currentStaff.phone.trim()) {
      error('Fields Required', 'Please enter staff name and contact phone number.');
      return;
    }

    if (!currentStaff.email.trim()) {
      error('Email Required', 'Please enter a valid email for worker login.');
      return;
    }

    if (!currentStaff.password.trim()) {
      error('Password Required', 'Please assign a password for the worker.');
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

      success('Worker Account Saved!', `${saved.name} is ready to log into the Worker Portal.`);
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
      success('Staff Deleted', 'Worker removed from dispatch system.');
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
      title: 'Worker / Rider',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
            {(val || 'W')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span>{val}</span>
              {row.dutyStatus === 'ON_DUTY' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="On Duty" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" title="Off Duty" />
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">{row.email || 'No email set'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role & Hub',
      key: 'role',
      render: (val, row) => (
        <div>
          <Badge variant="brand" size="sm">{val}</Badge>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{row.hub || 'Central Hub'}</span>
            {row.vehicleNumber && (
              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {row.vehicleNumber}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Contact Phone',
      key: 'phone',
      render: (val) => (
        <a 
          href={`tel:${val}`} 
          className="text-xs font-semibold text-slate-800 hover:text-orange-600 font-mono"
        >
          {val}
        </a>
      ),
    },
    {
      title: 'Portal Credentials',
      key: 'email',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => handleCopyCredentials(row)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          title="Copy Email, Password & Portal URL to send to rider"
        >
          {copiedId === row.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Login</span>
            </>
          )}
        </button>
      ),
    },
    {
      title: 'Status',
      key: 'active',
      render: (val, row) => (
        <div className="space-y-1">
          <Badge variant={val !== false ? 'emerald' : 'slate'}>
            {val !== false ? 'Active' : 'Disabled'}
          </Badge>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {row.dutyStatus === 'ON_DUTY' ? '🟢 Online' : '⚪ Offline'}
          </div>
        </div>
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
            title="Edit Worker & Password"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete Worker"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold tracking-wider uppercase">
              Field Operations
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold tracking-wider uppercase">
              Live Dispatch
            </span>
          </div>
          <h2 className="text-xl font-bold font-display text-slate-900 mt-1">
            Worker & Delivery Fleet Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create email and passwords for riders and field executives. When orders arrive, dispatch tasks directly to their portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/worker/login"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Open Worker Portal</span>
          </a>

          <Button 
            variant="primary" 
            size="md" 
            icon={Plus} 
            onClick={handleOpenCreate}
            className="shadow-sm"
          >
            Add New Worker
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={staffList}
        isLoading={loading}
        emptyMessage="No delivery riders or workers registered yet."
      />

      {/* Create / Edit Worker Modal with Email & Password */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-lg"
        title={currentStaff.id ? `Edit Worker: ${currentStaff.name}` : 'Create New Worker / Rider Account'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-xs text-purple-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong>Worker Portal Credentials:</strong> The email and password configured here allow the rider to sign into the mobile Worker Portal at <code>/worker/login</code>.
            </div>
          </div>

          <Input
            label="Worker Full Name *"
            required
            placeholder="e.g. Ramesh Kumar"
            value={currentStaff.name}
            onChange={(e) => setCurrentStaff({ ...currentStaff, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone *"
              required
              type="tel"
              placeholder="e.g. 8977769866"
              value={currentStaff.phone}
              onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
            />
            <Input
              label="Worker Email Address *"
              required
              type="email"
              placeholder="e.g. rider@techwash.in"
              value={currentStaff.email}
              onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
            />
          </div>

          {/* Password Input with Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Worker Portal Password *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>🎲 Generate Secure Password</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter login password"
                value={currentStaff.password}
                onChange={(e) => setCurrentStaff({ ...currentStaff, password: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Give this password to the rider to sign in on their smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Role & Function
              </label>
              <select
                value={currentStaff.role}
                onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Delivery Executive">Delivery Executive (Rider)</option>
                <option value="Pickup Agent">Doorstep Pickup Specialist</option>
                <option value="Master Dry Cleaner">Master Dry Cleaner</option>
                <option value="Hub QC Specialist">Quality Inspector (QC)</option>
                <option value="Hub Operations Manager">Hub Operations Manager</option>
              </select>
            </div>

            <Input
              label="Assigned Hub / Territory"
              placeholder="e.g. Banjara Hills Hub"
              value={currentStaff.hub}
              onChange={(e) => setCurrentStaff({ ...currentStaff, hub: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Vehicle / Bike Number"
              placeholder="e.g. TS 09 AB 4421"
              value={currentStaff.vehicleNumber || ''}
              onChange={(e) => setCurrentStaff({ ...currentStaff, vehicleNumber: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Initial Duty Status
              </label>
              <select
                value={currentStaff.dutyStatus || 'ON_DUTY'}
                onChange={(e) => setCurrentStaff({ ...currentStaff, dutyStatus: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ON_DUTY">🟢 On Duty (Available for Pickups)</option>
                <option value="OFF_DUTY">⚪ Off Duty (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="staff-active"
              checked={currentStaff.active !== false}
              onChange={(e) => setCurrentStaff({ ...currentStaff, active: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <label htmlFor="staff-active" className="text-xs font-semibold text-slate-700">
              Worker Account Active (Allows login and order assignment)
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {currentStaff.id ? 'Save Changes' : 'Create Worker Account'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Remove "${deleteTarget?.name}"?`}
        message="This worker will be removed from dispatch lists and their login will be revoked."
        isLoading={isDeleting}
      />
    </div>
  );
};
