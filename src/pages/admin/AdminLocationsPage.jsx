import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
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
import { MapPin, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_LOCATION = {
  name: '',
  address: '',
  phone: '',
  whatsapp: '',
  timings: '8:00 AM - 9:00 PM',
  weeklyHolidays: 'Open 7 Days a Week',
  googleMapsUrl: '',
  storeImage: '',
  isMain: false,
  active: true,
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

  const loadData = async () => {
    try {
      const data = await settingsService.getLocations();
      setLocations(data);
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
    setCurrentLocation({ ...INITIAL_LOCATION, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setCurrentLocation({ ...loc });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentLocation.name.trim() || !currentLocation.address.trim()) {
      error('Fields Required', 'Please provide branch name and physical address.');
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

      success('Location Saved', `${saved.name} saved successfully.`);
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
      await settingsService.deleteLocation(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Location',
        entityId: deleteTarget.id,
        entityName: deleteTarget.name,
        user: currentUser,
      });
      success('Deleted', 'Store branch removed.');
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
      title: 'Branch Name',
      key: 'name',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>{val}</span>
            {row.isMain && <Badge variant="royal" size="sm">Main Hub</Badge>}
          </div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{row.address}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'phone',
      render: (val, row) => (
        <div className="text-xs">
          <div>{val || '—'}</div>
          <div className="text-[11px] text-emerald-600">WA: {row.whatsapp || val || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Timings',
      key: 'timings',
      render: (val) => <span className="text-xs text-slate-600">{val}</span>,
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
        title="Store & Branch Locations CMS"
        subtitle="Manage physical stores, processing hubs, Google Maps directions, and branch working hours."
        actionLabel="Add Store Location"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={locations}
        isLoading={loading}
        emptyMessage="No store locations added yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title={currentLocation.id ? 'Edit Store Location' : 'Add Store Location'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Branch / Store Name *"
              required
              placeholder="e.g. Madhapur Central Lounge"
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
                Designate as Main Central Processing Hub
              </label>
            </div>
          </div>

          <Textarea
            label="Full Physical Address *"
            required
            rows={2}
            placeholder="Complete street address, landmark, Hyderabad locality..."
            value={currentLocation.address}
            onChange={(e) => setCurrentLocation({ ...currentLocation, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Branch Phone Number"
              placeholder="+91 98765 43210"
              value={currentLocation.phone}
              onChange={(e) => setCurrentLocation({ ...currentLocation, phone: e.target.value })}
            />
            <Input
              label="WhatsApp Support Number"
              placeholder="+91 98765 43210"
              value={currentLocation.whatsapp}
              onChange={(e) => setCurrentLocation({ ...currentLocation, whatsapp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opening & Closing Hours"
              value={currentLocation.timings}
              onChange={(e) => setCurrentLocation({ ...currentLocation, timings: e.target.value })}
            />
            <Input
              label="Weekly Off / Holidays"
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

          <Input
            label="Store Front Photo URL"
            placeholder="https://..."
            value={currentLocation.storeImage}
            onChange={(e) => setCurrentLocation({ ...currentLocation, storeImage: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Location
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This branch will be deleted."
        isLoading={isDeleting}
      />
    </div>
  );
};
