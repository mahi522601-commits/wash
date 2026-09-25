import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsService } from '../../services/settingsService';
import { terminalAuthService } from '../../services/terminalAuthService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Store, 
  Zap, 
  ExternalLink, 
  KeyRound, 
  User, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Laptop
} from 'lucide-react';

const INITIAL_LOCATION = {
  name: '',
  address: '',
  phone: '+91 63048 45567',
  whatsapp: '+91 63048 45567',
  timings: '8:00 AM - 9:00 PM (All Days)',
  weeklyHolidays: 'Open 7 Days a Week',
  googleMapsUrl: '',
  storeImage: '',
  isMain: false,
  active: true,
  // POS Billing System Integration
  posTerminalId: 'counter-1',
  posTerminalCode: 'TW-POS-01',
  assignedOperator: 'Counter Cashier',
  posPassword: 'techwash1',
  posMachineActive: true,
};

export const AdminLocationsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(INITIAL_LOCATION);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPinMap, setShowPinMap] = useState({});

  const toggleShowPin = (id) => {
    setShowPinMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = async () => {
    try {
      const data = await settingsService.getLocations();
      setLocations(data);
    } catch (e) {
      console.warn('Failed to load locations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('techwash-locations-updated', handleUpdate);
    return () => window.removeEventListener('techwash-locations-updated', handleUpdate);
  }, []);

  const handleOpenCreate = () => {
    const nextIdx = locations.length + 1;
    setCurrentLocation({
      ...INITIAL_LOCATION,
      id: null,
      name: '',
      posTerminalId: `counter-${nextIdx}`,
      posTerminalCode: `TW-POS-0${nextIdx}`,
      assignedOperator: `Cashier #${nextIdx}`,
      posPassword: `techwash${nextIdx}`,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    const termId = loc.posTerminalId || (loc.id === 'loc-hitec-city' ? 'counter-2' : loc.id === 'loc-banjara-hills' ? 'counter-3' : 'counter-1');
    const termCode = loc.posTerminalCode || (termId === 'counter-2' ? 'TW-POS-02' : termId === 'counter-3' ? 'TW-POS-03' : 'TW-POS-01');
    const operator = loc.assignedOperator || (termId === 'counter-2' ? 'Sneha Reddy (Cashier #2)' : termId === 'counter-3' ? 'Vikram Rao (Cashier #3)' : 'Rahul Verma (Cashier #1)');
    const pin = loc.posPassword || (termId === 'counter-2' ? 'techwash2' : termId === 'counter-3' ? 'techwash3' : 'techwash1');

    setCurrentLocation({
      ...loc,
      posTerminalId: termId,
      posTerminalCode: termCode,
      assignedOperator: operator,
      posPassword: pin,
      posMachineActive: loc.posMachineActive !== undefined ? loc.posMachineActive : true,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentLocation.name.trim() || !currentLocation.address.trim()) {
      error('Fields Required', 'Please provide store branch name and full physical address.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentLocation.id;
      const saved = await settingsService.saveLocation(currentLocation);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Location',
        entityId: saved.id,
        entityName: saved.name,
        user: currentUser,
      });

      success('Store & POS Machine Synced', `${saved.name} and connected billing machine updated.`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      error('Save Error', err.message || 'Failed to save location.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await settingsService.deleteLocation(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Location',
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        user: currentUser,
      });
      success('Deleted', 'Store branch and POS connection removed.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      error('Delete Error', err.message || 'Failed to delete store branch.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Store Branch & Address',
      key: 'name',
      render: (val, row) => (
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>{val}</span>
            {row.isMain && <Badge variant="royal" size="sm">Main Processing Lounge</Badge>}
            {row.active === false && <Badge variant="destructive" size="sm">Inactive</Badge>}
          </div>
          <div className="text-[11px] text-slate-500 line-clamp-2 max-w-sm">
            📍 {row.address}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>🕒 {row.timings || '8:00 AM - 9:00 PM'}</span>
            <span>•</span>
            <span>📞 {row.phone || '+91 63048 45567'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Connected POS Machine & Cashier',
      key: 'posTerminalId',
      render: (val, row) => {
        const termId = row.posTerminalId || (row.id === 'loc-hitec-city' ? 'counter-2' : row.id === 'loc-banjara-hills' ? 'counter-3' : 'counter-1');
        const termCode = row.posTerminalCode || (termId === 'counter-2' ? 'TW-POS-02' : termId === 'counter-3' ? 'TW-POS-03' : 'TW-POS-01');
        const operator = row.assignedOperator || (termId === 'counter-2' ? 'Sneha Reddy (Cashier #2)' : termId === 'counter-3' ? 'Vikram Rao (Cashier #3)' : 'Rahul Verma (Cashier #1)');
        const pin = row.posPassword || (termId === 'counter-2' ? 'techwash2' : termId === 'counter-3' ? 'techwash3' : 'techwash1');
        const isShow = showPinMap[row.id];

        return (
          <div className="space-y-1.5 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-900 font-mono font-bold text-xs">
                <Laptop className="w-3.5 h-3.5 text-orange-600" />
                <span>{termCode}</span>
                <span className="opacity-75">({termId})</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live POS
              </span>
            </div>

            <div className="text-xs text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold truncate">{operator}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                PIN: <strong>{isShow ? pin : '••••••••'}</strong>
              </span>
              <button
                type="button"
                onClick={() => toggleShowPin(row.id)}
                className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                {isShow ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        );
      },
    },
    {
      title: '1-Click POS & Branch Actions',
      key: 'actions',
      render: (_, row) => {
        const termId = row.posTerminalId || (row.id === 'loc-hitec-city' ? 'counter-2' : row.id === 'loc-banjara-hills' ? 'counter-3' : 'counter-1');

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1-Click Launch POS Billing Terminal */}
            <Link
              to={`/billing/${termId}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs transition"
              title={`Open POS Counter Machine for ${row.name}`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Open POS</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </Link>

            {/* View Branch Orders */}
            <Link
              to={`/admin/orders?branch=${termId}&channel=OFFLINE_POS`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-200 transition"
              title={`View offline orders for ${row.name}`}
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>Orders</span>
            </Link>

            {/* View Shift PDF Reports */}
            <Link
              to={`/admin/reports?branch=${termId}&preset=today`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-xs border border-purple-200 transition"
              title={`View shift reports for ${row.name}`}
            >
              <Printer className="w-3 h-3 text-purple-600" />
              <span>Shift PDF</span>
            </Link>

            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100 cursor-pointer ml-1"
              title="Edit Location and POS Settings"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
              title="Delete Store Branch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AdminPageHeader
        title="Store Locations & POS Billing Machines CMS"
        subtitle="Manage physical store branches, map connected in-store POS counter terminals, configure cashier PINs, and launch billing machines."
        actionLabel="Add Store & POS Counter"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Quick POS & Multi-Branch Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Physical Store Branches</span>
            <Store className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {locations.length} Locations
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Hyderabad Metropolitan Region</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Connected POS Billing Terminals</span>
            <Laptop className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {locations.length} Live Counters
          </div>
          <div className="text-[11px] text-blue-500 mt-0.5 font-medium">1-Click Auto Cashier Access</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Master Processing Lounge</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 truncate">
            {locations.find(l => l.isMain)?.name || 'Tech Wash Laundry Main Branch'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Central Hub & Garment Spa</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-950 text-xs font-bold">
            <span>POS Billing Terminals Hub</span>
            <Zap className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-orange-800">Launch All Terminals</span>
            <Link
              to="/billing"
              target="_blank"
              className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-1 transition shadow-xs"
            >
              <span>Hub</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={locations}
        isLoading={loading}
        emptyMessage="No store branches added yet."
      />

      {/* Add / Edit Store Location & POS Machine Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-3xl"
        title={currentLocation.id ? `Edit ${currentLocation.name}` : 'Add New Store Branch & Connected POS Machine'}
      >
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* 1. Store Location Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-orange-500" />
              <span>1. Physical Store Location Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store / Branch Name *"
                required
                placeholder="e.g. Tech Wash Care Center — Madhapur"
                value={currentLocation.name}
                onChange={(e) => setCurrentLocation({ ...currentLocation, name: e.target.value })}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="loc-main"
                  checked={!!currentLocation.isMain}
                  onChange={(e) => setCurrentLocation({ ...currentLocation, isMain: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <label htmlFor="loc-main" className="text-xs font-semibold text-slate-700">
                  Designate as Central Main Processing Lounge
                </label>
              </div>
            </div>

            <Textarea
              label="Full Physical Address *"
              required
              rows={2}
              placeholder="Complete street address, building, road no, landmark, locality, Hyderabad, pincode..."
              value={currentLocation.address}
              onChange={(e) => setCurrentLocation({ ...currentLocation, address: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Store Phone Number"
                placeholder="+91 63048 45567"
                value={currentLocation.phone}
                onChange={(e) => setCurrentLocation({ ...currentLocation, phone: e.target.value })}
              />
              <Input
                label="WhatsApp Customer Support"
                placeholder="+91 63048 45567"
                value={currentLocation.whatsapp}
                onChange={(e) => setCurrentLocation({ ...currentLocation, whatsapp: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Working Hours / Timings"
                value={currentLocation.timings}
                onChange={(e) => setCurrentLocation({ ...currentLocation, timings: e.target.value })}
              />
              <Input
                label="Weekly Holidays"
                value={currentLocation.weeklyHolidays}
                onChange={(e) => setCurrentLocation({ ...currentLocation, weeklyHolidays: e.target.value })}
              />
            </div>

            <Input
              label="Google Maps Direction URL"
              placeholder="https://maps.google.com/?q=..."
              value={currentLocation.googleMapsUrl}
              onChange={(e) => setCurrentLocation({ ...currentLocation, googleMapsUrl: e.target.value })}
            />
          </div>

          {/* 2. Connected POS Billing Machine Settings */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 border-2 border-orange-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950 border-b border-orange-200 pb-1.5 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-orange-600" />
              <span>2. Connected In-Store POS Billing Machine Settings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  POS Counter Terminal ID *
                </label>
                <select
                  value={currentLocation.posTerminalId || 'counter-1'}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const num = tId.replace(/\D/g, '') || '1';
                    setCurrentLocation({
                      ...currentLocation,
                      posTerminalId: tId,
                      posTerminalCode: `TW-POS-0${num}`,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-orange-500"
                >
                  <option value="counter-1">Counter 1 (counter-1)</option>
                  <option value="counter-2">Counter 2 (counter-2)</option>
                  <option value="counter-3">Counter 3 (counter-3)</option>
                  <option value="counter-4">Counter 4 (counter-4)</option>
                  <option value="counter-5">Counter 5 (counter-5)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Accessible at: <code>/billing/{currentLocation.posTerminalId || 'counter-1'}</code>
                </span>
              </div>

              <Input
                label="POS Terminal Code"
                placeholder="TW-POS-01"
                value={currentLocation.posTerminalCode || 'TW-POS-01'}
                onChange={(e) => setCurrentLocation({ ...currentLocation, posTerminalCode: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Assigned Cashier / Operator Name"
                placeholder="e.g. Rahul Verma (Cashier #1)"
                value={currentLocation.assignedOperator || ''}
                onChange={(e) => setCurrentLocation({ ...currentLocation, assignedOperator: e.target.value })}
              />
              <Input
                label="Cashier Access Security PIN"
                placeholder="e.g. techwash1"
                value={currentLocation.posPassword || ''}
                onChange={(e) => setCurrentLocation({ ...currentLocation, posPassword: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pos-active"
                checked={currentLocation.posMachineActive !== false}
                onChange={(e) => setCurrentLocation({ ...currentLocation, posMachineActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <label htmlFor="pos-active" className="text-xs font-bold text-orange-950">
                Enable Active POS Walk-in Billing for this Store Location
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Store & Sync POS
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Store Location "${deleteTarget?.name}"?`}
        message="This store branch and its associated POS counter configuration will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminLocationsPage;
