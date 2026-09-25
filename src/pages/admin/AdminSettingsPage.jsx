import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { auditService } from '../../services/auditService';
import { DEFAULT_SETTINGS } from '../../services/settingsService';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { WhatsAppLogo, PhoneCallLogo } from '../../components/ui/BrandIcons';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Building2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  MessageSquare, 
  Send, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { settings, updateSettings, loading: contextLoading } = useSettings();
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [formData, setFormData] = useState(settings || DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleGeneralChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value
      }
    }));
  };

  const handleHoursChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings(formData);

      // Audit log
      try {
        await auditService.logAction({
          action: 'UPDATE_BUSINESS_SETTINGS',
          entity: 'SettingsGlobal',
          entityName: 'Master Business & Contact Settings',
          details: {
            primaryPhone: formData.general?.primaryPhone,
            whatsappNumber: formData.general?.whatsappNumber,
            supportEmail: formData.general?.supportEmail,
          },
          user: currentUser,
        });
      } catch (e) {}

      success('Settings Saved!', 'Contact numbers, WhatsApp hotline & business details updated across the website.');
    } catch (err) {
      error('Save Failed', err.message || 'Unable to update settings in Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all business and contact settings to default?')) {
      setFormData(DEFAULT_SETTINGS);
      info('Defaults Restored', 'Click "Save Changes to Website" to commit changes.');
    }
  };

  const currentPhoneClean = (formData.general?.primaryPhone || '6304845567').replace(/[^0-9]/g, '');
  const currentWaClean = (formData.general?.whatsappNumber || '6304845567').replace(/[^0-9]/g, '');

  if (contextLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <AdvancedLogoLoader size="md" text="Loading Business Settings..." subtext="Syncing contact info & master configuration" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Master Contact & Website Configuration</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-display">
            Business Settings & Contact Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live phone numbers, WhatsApp concierge, email, and working hours. Changes sync automatically across all customer touchpoints.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={RotateCcw}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Save}
            isLoading={isSaving}
            onClick={handleSave}
            className="shadow-md shadow-brand-500/20"
          >
            Save Changes to Website
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. MASTER PHONE & WHATSAPP NUMBERS (PRIMARY CARD) */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center text-xl shrink-0">
                <WhatsAppLogo className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Live Calling & WhatsApp Hotline
                </h3>
                <p className="text-xs text-slate-500">
                  Controls the direct telephone links, WhatsApp floating buttons, header/footer numbers, and customer concierge.
                </p>
              </div>
            </div>

            <Badge variant="success" className="w-fit">Live Dynamic Sync</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Primary Phone / Hotline */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-600" />
                  <span>Primary Calling Phone *</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">Header, Footer, Floating Call</span>
              </div>
              <input
                type="text"
                required
                placeholder="+91 63048 45567"
                value={formData.general?.primaryPhone || ''}
                onChange={(e) => handleGeneralChange('primaryPhone', e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Clean numeric: <strong className="text-slate-800">{currentPhoneClean}</strong></span>
                <a
                  href={`tel:${currentPhoneClean}`}
                  className="text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Test Call Link
                </a>
              </div>
            </div>

            {/* WhatsApp Hotline */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <WhatsAppLogo className="w-3.5 h-3.5 fill-current text-[#25D366]" />
                  <span>WhatsApp Concierge Number *</span>
                </label>
                <span className="text-[10px] font-bold text-[#25D366]">wa.me Direct Chat</span>
              </div>
              <input
                type="text"
                required
                placeholder="+91 63048 45567"
                value={formData.general?.whatsappNumber || ''}
                onChange={(e) => handleGeneralChange('whatsappNumber', e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Clean numeric: <strong className="text-slate-800">{currentWaClean}</strong></span>
                <a
                  href={`https://wa.me/${currentWaClean}?text=${encodeURIComponent(formData.general?.whatsappDefaultMessage || 'Hello Tech Wash!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:text-emerald-700 font-bold inline-flex items-center gap-1"
                >
                  <WhatsAppLogo className="w-3 h-3 fill-current" /> Test WhatsApp Chat
                </a>
              </div>
            </div>

          </div>

          {/* WhatsApp Default Greeting Message */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
              <span>Default WhatsApp Greeting Message</span>
            </label>
            <input
              type="text"
              placeholder="Hello Tech Wash, I would like to schedule a premium garment pickup."
              value={formData.general?.whatsappDefaultMessage || ''}
              onChange={(e) => handleGeneralChange('whatsappDefaultMessage', e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <p className="text-[11px] text-slate-400">
              This message will be pre-filled when customers click on floating WhatsApp buttons across the website.
            </p>
          </div>

        </Card>

        {/* 2. BUSINESS IDENTITY & EMAIL & ADDRESS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Brand Identity & Email */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Brand & Contact Details</h3>
                <p className="text-[11px] text-slate-400">Official business identity</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.general?.businessName || ''}
                  onChange={(e) => handleGeneralChange('businessName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.general?.tagline || ''}
                  onChange={(e) => handleGeneralChange('tagline', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  <span>Support Email</span>
                </label>
                <input
                  type="email"
                  value={formData.general?.supportEmail || ''}
                  onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </Card>

          {/* Central Headquarters Address & Working Hours */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">HQ Address & Working Hours</h3>
                <p className="text-[11px] text-slate-400">Displayed in footer and top header</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Central Address / City Hub</span>
                </label>
                <input
                  type="text"
                  value={formData.general?.businessAddress || 'Shaikpet Main Rd, Sri Ram Nagar Colony, Manikonda, Hyderabad, Telangana 500089'}
                  onChange={(e) => handleGeneralChange('businessAddress', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Weekdays Hours</label>
                  <input
                    type="text"
                    value={formData.workingHours?.weekdays || '8:00 AM - 9:00 PM'}
                    onChange={(e) => handleHoursChange('weekdays', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Weekly Holidays</label>
                  <input
                    type="text"
                    value={formData.workingHours?.weeklyHolidays || 'Open 7 Days a Week'}
                    onChange={(e) => handleHoursChange('weeklyHolidays', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* Floating Quick Action Footer */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Updates are synchronized to Firestore and cached for high availability.</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            isLoading={isSaving}
          >
            Save All Changes
          </Button>
        </div>

      </form>

    </div>
  );
};
