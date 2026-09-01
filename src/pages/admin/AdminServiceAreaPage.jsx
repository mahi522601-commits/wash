import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Globe, ShieldCheck, Plus, Trash2, Save } from 'lucide-react';

const DEFAULT_SERVICE_AREA = {
  enabled: true,
  openToAll: true,
  allowedCities: ['Hyderabad', 'Secunderabad', 'Tirupati', 'Bengaluru'],
  allowedPincodes: ['500001', '500033', '500081', '500084', '517501', '560001'],
  maxRadiusKm: 35,
  pickupAvailable: true,
  deliveryAvailable: true,
};

export const AdminServiceAreaPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_SERVICE_AREA);
  const [newCity, setNewCity] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings()
      .then((data) => {
        if (data?.serviceArea) {
          setConfig({ ...DEFAULT_SERVICE_AREA, ...data.serviceArea });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const current = await settingsService.getSettings();
      const updated = {
        ...current,
        serviceArea: config,
      };
      await settingsService.saveSettings(updated);

      await auditService.logAction({
        action: 'UPDATE',
        entity: 'ServiceArea',
        entityName: 'Service Area Configuration',
        user: currentUser,
      });

      success('Service Area Updated', 'Geographic pickup & delivery parameters saved.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addCity = () => {
    if (!newCity.trim()) return;
    if (config.allowedCities.includes(newCity.trim())) return;
    setConfig({
      ...config,
      allowedCities: [...config.allowedCities, newCity.trim()]
    });
    setNewCity('');
  };

  const removeCity = (c) => {
    setConfig({
      ...config,
      allowedCities: config.allowedCities.filter((city) => city !== c)
    });
  };

  const addPincode = () => {
    if (!newPincode.trim()) return;
    if (config.allowedPincodes.includes(newPincode.trim())) return;
    setConfig({
      ...config,
      allowedPincodes: [...config.allowedPincodes, newPincode.trim()]
    });
    setNewPincode('');
  };

  const removePincode = (pin) => {
    setConfig({
      ...config,
      allowedPincodes: config.allowedPincodes.filter((p) => p !== pin)
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Service Area & Delivery Zones CMS"
        subtitle="Manage geographic service coverage, enabled cities, allowed PIN codes, and doorstep pickup eligibility."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Service Availability Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-600" />
              <span>Service Area Enforcement</span>
            </h3>
            <Badge variant={config.enabled ? 'emerald' : 'slate'}>
              {config.enabled ? 'Active Policy' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.openToAll}
                onChange={(e) => setConfig({ ...config, openToAll: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">Open to All Locations (Soft Validation)</div>
                <div className="text-[11px] text-slate-500">Allow orders from anywhere without strict PIN code blockage</div>
              </div>
            </label>

            <Input
              label="Maximum Branch Service Radius (KM)"
              type="number"
              value={config.maxRadiusKm}
              onChange={(e) => setConfig({ ...config, maxRadiusKm: Number(e.target.value) })}
            />
          </div>
        </Card>

        {/* Covered Cities Management Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-600" />
            <span>Eligible Service Cities</span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {config.allowedCities?.map((city, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-800">
                <span>{city}</span>
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Add city name (e.g. Hyderabad, Tirupati, Vijayawada)"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
            />
            <Button type="button" variant="secondary" size="md" onClick={addCity}>
              Add City
            </Button>
          </div>
        </Card>

        {/* Covered PIN Codes Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Allowed PIN Codes</span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {config.allowedPincodes?.map((pin, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                <span>{pin}</span>
                <button
                  type="button"
                  onClick={() => removePincode(pin)}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Add 6-digit PIN code (e.g. 500081)"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
            />
            <Button type="button" variant="secondary" size="md" onClick={addPincode}>
              Add PIN Code
            </Button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={isSaving}
          >
            Save Service Area Configuration
          </Button>
        </div>

      </form>
    </div>
  );
};
