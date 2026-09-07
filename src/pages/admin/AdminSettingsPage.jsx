import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Sliders, Save, Palette, Eye, Bell, Sparkles, Shield } from 'lucide-react';

export const AdminSettingsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { settings, updateSettings } = useSettings();

  const [form, setForm] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(form);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'Settings',
        entityName: 'Global Site Settings',
        user: currentUser,
      });
      success('Settings Saved', 'Global website parameters updated.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Global Website Settings"
        subtitle="Control business identity, branding design tokens, announcement bar, and section toggles."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Business Info */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            <span>Business Identity & Branding</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Brand Name *"
              required
              value={form.general?.businessName}
              onChange={(e) => setForm({
                ...form,
                general: { ...form.general, businessName: e.target.value }
              })}
            />
            <Input
              label="Brand Tagline"
              value={form.general?.tagline}
              onChange={(e) => setForm({
                ...form,
                general: { ...form.general, tagline: e.target.value }
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Brand Logo Graphic URL"
                placeholder="/techwashlogo.webp"
                value={form.general?.logoUrl}
                onChange={(e) => setForm({
                  ...form,
                  general: { ...form.general, logoUrl: e.target.value }
                })}
              />
              {form.general?.logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Current Logo:</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 p-0.5 border border-slate-200 overflow-hidden">
                    <img 
                      src={form.general.logoUrl} 
                      alt="Logo Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Browser Favicon URL"
                placeholder="/techwashlogo.webp"
                value={form.general?.faviconUrl}
                onChange={(e) => setForm({
                  ...form,
                  general: { ...form.general, faviconUrl: e.target.value }
                })}
              />
              {form.general?.faviconUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Favicon Preview:</span>
                  <div className="w-6 h-6 rounded-md bg-slate-100 p-0.5 border border-slate-200 overflow-hidden">
                    <img 
                      src={form.general.faviconUrl} 
                      alt="Favicon Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Announcement Ticker Bar */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" />
              <span>Top Announcement Ticker Bar</span>
            </h3>
            <Badge variant={form.website?.announcementBarEnabled ? 'emerald' : 'slate'}>
              {form.website?.announcementBarEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <Textarea
            label="Announcement Message Text"
            rows={2}
            value={form.website?.announcementText}
            onChange={(e) => setForm({
              ...form,
              website: { ...form.website, announcementText: e.target.value }
            })}
          />

          <Input
            label="Announcement Action Destination Link"
            value={form.website?.announcementLink}
            onChange={(e) => setForm({
              ...form,
              website: { ...form.website, announcementLink: e.target.value }
            })}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ann-bar-enable"
              checked={!!form.website?.announcementBarEnabled}
              onChange={(e) => setForm({
                ...form,
                website: { ...form.website, announcementBarEnabled: e.target.checked }
              })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="ann-bar-enable" className="text-xs font-semibold text-slate-700">
              Display Announcement Bar on Public Website
            </label>
          </div>
        </Card>

        {/* Section Toggles */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-600" />
            <span>Homepage Section Visibility Controls</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'showTrustStats', label: 'Trust Statistics Bar' },
              { key: 'showVideoShowcase', label: 'YouTube Video Showcase' },
              { key: 'showStoreLocations', label: 'Store Branches Section' },
              { key: 'showTestimonials', label: 'Testimonials Carousel' },
              { key: 'showBlogSection', label: 'Fabric Care Guides Section' },
              { key: 'showGallerySection', label: 'Transformation Gallery' },
              { key: 'showFaqSection', label: 'FAQ Accordion Section' },
              { key: 'floatingWhatsAppEnabled', label: 'Floating WhatsApp CTA Button' },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100"
              >
                <input
                  type="checkbox"
                  checked={form.website?.[toggle.key] !== false}
                  onChange={(e) => setForm({
                    ...form,
                    website: { ...form.website, [toggle.key]: e.target.checked }
                  })}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <span>{toggle.label}</span>
              </label>
            ))}
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
            Save All Settings
          </Button>
        </div>

      </form>
    </div>
  );
};
