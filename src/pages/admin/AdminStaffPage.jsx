import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import { auditService } from '../../services/auditService';
import { terminalAuthService, DEFAULT_BILLING_TERMINALS } from '../../services/terminalAuthService';
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
  Clock,
  Store,
  MapPin,
  Laptop,
  Lock,
  ArrowRight,
  RefreshCw
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

  // Billing Terminals State
  const [terminals, setTerminals] = useState(DEFAULT_BILLING_TERMINALS);
  const [terminalModalOpen, setTerminalModalOpen] = useState(false);
  const [currentTerminal, setCurrentTerminal] = useState(null);
  const [showTerminalPwd, setShowTerminalPwd] = useState(false);
  const [isSavingTerminal, setIsSavingTerminal] = useState(false);
  const [copiedTerminalId, setCopiedTerminalId] = useState(null);

  const loadData = async () => {
    try {
      const [staffData, terminalData] = await Promise.all([
        staffService.getStaff(),
        terminalAuthService.getTerminals()
      ]);
      setStaffList(staffData);
      setTerminals(terminalData);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditTerminal = (term) => {
    setCurrentTerminal({ ...term });
    setShowTerminalPwd(false);
    setTerminalModalOpen(true);
  };

  const handleGenerateTerminalPIN = () => {
    const randomPin = 'tw' + Math.floor(1000 + Math.random() * 9000);
    setCurrentTerminal({ ...currentTerminal, password: randomPin });
    setShowTerminalPwd(true);
  };

  const handleSaveTerminal = async (e) => {
    e.preventDefault();
    if (!currentTerminal.password?.trim()) {
      error('PIN Required', 'Please assign a password / PIN for this billing counter.');
      return;
    }

    setIsSavingTerminal(true);
    try {
      await terminalAuthService.updateTerminal(currentTerminal.id, {
        name: currentTerminal.name,
        assignedOperator: currentTerminal.assignedOperator,
        password: currentTerminal.password.trim(),
        phone: currentTerminal.phone,
        active: currentTerminal.active !== false,
      });

      await auditService.logAction({
        action: 'UPDATE',
        entity: 'BillingTerminal',
        entityId: currentTerminal.id,
        entityName: currentTerminal.name,
        user: currentUser,
      });

      success('Terminal Updated', `Password and settings saved for ${currentTerminal.name}.`);
      setTerminalModalOpen(false);
      const updated = await terminalAuthService.getTerminals();
      setTerminals(updated);
    } catch (err) {
      error('Update Failed', err.message);
    } finally {
      setIsSavingTerminal(false);
    }
  };

  const handleCopyTerminalCredentials = (term) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `🏪 Tech Wash POS Billing Counter Credentials:
URL: ${origin}/billing/${term.id}
Counter: ${term.name} (${term.code})
Location: ${term.locationName}
Address: ${term.address}
Assigned Cashier: ${term.assignedOperator}
Security PIN / Password: ${term.password}
Admin Master Unlock: techwashadmin`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedTerminalId(term.id);
      success('Copied to Clipboard!', `Credentials for ${term.name} copied.`);
      setTimeout(() => setCopiedTerminalId(null), 3000);
    }).catch(() => {
      info('Terminal Credentials', text);
    });
  };

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
      password: st.password || ''
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
Email / Login: ${staff.email || staff.phone + '@techwashlaundry.com'}
Password: ${staff.password || '(Contact Administrator)'}
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
    <div className="space-y-8">
      {/* 1. 3 IN-STORE BILLING COUNTERS & PASSWORDS SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0B0A1C] to-slate-950 p-6 sm:p-7 rounded-3xl border border-purple-500/20 shadow-xl text-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[11px] font-black tracking-wider uppercase flex items-center gap-1">
                <Store className="w-3.5 h-3.5" />
                <span>In-Store POS Terminals</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black tracking-wider uppercase">
                3 Dedicated Counters
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-1.5 flex items-center gap-2">
              <span>🏪 3 Billing Machines & Password Access</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Assign cashier operators, set login passwords/PINs, and launch standalone counter POS machines for walk-in billing. All 3 counter machines sync live with central orders & inventory.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Billing Hub</span>
            </a>
          </div>
        </div>

        {/* 3 Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {terminals.map((term, idx) => (
            <div 
              key={term.id}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[11px] font-mono font-bold text-slate-300">
                    Counter #{idx + 1} • {term.code}
                  </span>
                  <Badge variant={term.active !== false ? 'emerald' : 'slate'} size="sm">
                    {term.active !== false ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
                    {term.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{term.address}</span>
                  </div>
                </div>

                {/* Password & Operator Display Box */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Cashier:</span>
                    <span className="font-semibold text-orange-300 truncate max-w-[140px]" title={term.assignedOperator}>
                      {term.assignedOperator}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-400" />
                      <span>Security PIN:</span>
                    </span>
                    <span className="font-mono font-black text-amber-300 tracking-wider bg-white/10 px-2 py-0.5 rounded">
                      {term.password || 'techwash' + (idx + 1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>URL:</span>
                    <span className="font-mono text-cyan-400">/billing/{term.id}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTerminal(term)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Change password, cashier name or branch"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-300" />
                    <span>Edit PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyTerminalCredentials(term)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                    title="Copy full credentials to clipboard"
                  >
                    {copiedTerminalId === term.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <a
                  href={`/billing/${term.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <span>Launch POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. WORKER & DELIVERY FLEET SECTION */}
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

      {/* Edit Billing Counter Modal */}
      {currentTerminal && (
        <Modal
          isOpen={terminalModalOpen}
          onClose={() => setTerminalModalOpen(false)}
          maxWidth="max-w-lg"
          title={`Edit Billing Machine: ${currentTerminal.name}`}
        >
          <form onSubmit={handleSaveTerminal} className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Counter Terminal Security:</strong> The password or PIN you set here is stored in Firebase Firestore and unlocks <code>/billing/{currentTerminal.id}</code> for in-store staff.
              </div>
            </div>

            <Input
              label="Counter / Machine Display Name *"
              required
              placeholder="e.g. Counter 1 — Jubilee Hills Flagship"
              value={currentTerminal.name}
              onChange={(e) => setCurrentTerminal({ ...currentTerminal, name: e.target.value })}
            />

            <Input
              label="Assigned Cashier / Operator *"
              required
              placeholder="e.g. Rahul Verma (Cashier #1)"
              value={currentTerminal.assignedOperator}
              onChange={(e) => setCurrentTerminal({ ...currentTerminal, assignedOperator: e.target.value })}
            />

            {/* Password Input with Quick PIN Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Counter Sign-In Password / PIN *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTerminalPIN}
                  className="text-[11px] text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>🎲 Generate PIN</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showTerminalPwd ? 'text' : 'password'}
                  required
                  placeholder="Enter counter password or PIN"
                  value={currentTerminal.password || ''}
                  onChange={(e) => setCurrentTerminal({ ...currentTerminal, password: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-10 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowTerminalPwd(!showTerminalPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showTerminalPwd ? 'Hide PIN' : 'Show PIN'}
                >
                  {showTerminalPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Cashiers at this branch will enter this PIN or password to start billing.
              </p>
            </div>

            <Input
              label="Store Contact Phone"
              placeholder="+91 63048 45567"
              value={currentTerminal.phone || ''}
              onChange={(e) => setCurrentTerminal({ ...currentTerminal, phone: e.target.value })}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="terminal-active"
                checked={currentTerminal.active !== false}
                onChange={(e) => setCurrentTerminal({ ...currentTerminal, active: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <label htmlFor="terminal-active" className="text-xs font-semibold text-slate-700">
                Counter Active (Enables billing machine URL)
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setTerminalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingTerminal}>
                Save Counter Settings
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
              <strong>Worker Portal Credentials:</strong> The email and password configured here are stored directly in <strong>Firebase Firestore</strong>, allowing the rider to sign into the mobile Worker Portal at <code>/worker/login</code>.
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
              placeholder="e.g. 6304845567"
              value={currentStaff.phone}
              onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
            />
            <Input
              label="Worker Email Address *"
              required
              type="email"
              placeholder="e.g. rider@techwashlaundry.com"
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
