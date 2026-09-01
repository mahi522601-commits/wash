import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Phone, Mail, MessageSquare, Clock, Save, Globe } from 'lucide-react';

export const AdminContactsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { settings, updateSettings } = useSettings();

  const [formData, setFormData] = useState({
    primaryPhone: '',
    whatsappNumber: '',
    whatsappDefaultMessage: '',
    supportEmail: '',
    weekdaysHours: '',
    weekendsHours: '',
    weeklyHolidays: '',
    instagram: '',
    facebook: '',
    youtube: '',
    googleBusiness: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        primaryPhone: settings.general?.primaryPhone || '',
        whatsappNumber: settings.general?.whatsappNumber || '',
        whatsappDefaultMessage: settings.general?.whatsappDefaultMessage || '',
        supportEmail: settings.general?.supportEmail || '',
        weekdaysHours: settings.workingHours?.weekdays || '',
        weekendsHours: settings.workingHours?.weekends || '',
        weeklyHolidays: settings.workingHours?.weeklyHolidays || '',
        instagram: settings.social?.instagram || '',
        facebook: settings.social?.facebook || '',
        youtube: settings.social?.youtube || '',
        googleBusiness: settings.social?.googleBusiness || '',
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = {
        ...settings,
        general: {
          ...settings.general,
          primaryPhone: formData.primaryPhone,
          whatsappNumber: formData.whatsappNumber,
          whatsappDefaultMessage: formData.whatsappDefaultMessage,
          supportEmail: formData.supportEmail,
        },
        workingHours: {
          ...settings.workingHours,
          weekdays: formData.weekdaysHours,
          weekends: formData.weekendsHours,
          weeklyHolidays: formData.weeklyHolidays,
        },
        social: {
          ...settings.social,
          instagram: formData.instagram,
          facebook: formData.facebook,
          youtube: formData.youtube,
          googleBusiness: formData.googleBusiness,
        }
      };

      await updateSettings(updated);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'Contacts',
        entityName: 'Business Contact Info',
        user: currentUser,
      });

      success('Contacts Updated', 'Contact information saved across website and footer.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact & Hours Management"
        subtitle="Control primary phone numbers, WhatsApp concierge templates, working hours, and social channels."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Phone & Messaging Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-600" />
            <span>Primary Phone & WhatsApp Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Phone Number *"
              required
              value={formData.primaryPhone}
              onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
            />
            <Input
              label="WhatsApp Support Number *"
              required
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            />
          </div>

          <Input
            label="WhatsApp Floating Button Greeting Template"
            value={formData.whatsappDefaultMessage}
            onChange={(e) => setFormData({ ...formData, whatsappDefaultMessage: e.target.value })}
          />

          <Input
            label="Support Email Address *"
            required
            type="email"
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
          />
        </Card>

        {/* Operating Hours Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Operating Hours & Weekly Schedule</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Weekdays Schedule"
              placeholder="8:00 AM - 9:00 PM"
              value={formData.weekdaysHours}
              onChange={(e) => setFormData({ ...formData, weekdaysHours: e.target.value })}
            />
            <Input
              label="Weekends Schedule"
              placeholder="8:00 AM - 9:00 PM"
              value={formData.weekendsHours}
              onChange={(e) => setFormData({ ...formData, weekendsHours: e.target.value })}
            />
            <Input
              label="Weekly Holidays / Off"
              placeholder="Open 7 Days a Week"
              value={formData.weeklyHolidays}
              onChange={(e) => setFormData({ ...formData, weeklyHolidays: e.target.value })}
            />
          </div>
        </Card>

        {/* Social Links Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            <span>Social Media Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Instagram Profile Link"
              placeholder="https://instagram.com/..."
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
            <Input
              label="Facebook Page Link"
              placeholder="https://facebook.com/..."
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            />
            <Input
              label="YouTube Channel"
              placeholder="https://youtube.com/..."
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
            />
            <Input
              label="Google Business Listing Link"
              placeholder="https://maps.google.com/..."
              value={formData.googleBusiness}
              onChange={(e) => setFormData({ ...formData, googleBusiness: e.target.value })}
            />
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
            Save All Contact Settings
          </Button>
        </div>

      </form>
    </div>
  );
};
