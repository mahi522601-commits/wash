import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Search, Globe, Save } from 'lucide-react';

export const AdminSEOPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const { settings, updateSettings } = useSettings();

  const [seo, setSeo] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    ogImageUrl: '',
    canonicalUrl: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.seo) {
      setSeo({ ...settings.seo });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = {
        ...settings,
        seo,
      };
      await updateSettings(updated);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'SEO',
        entityName: 'Global Meta Tags & SEO',
        user: currentUser,
      });
      success('SEO Settings Saved', 'Global metadata updated.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SEO & Search Engine Optimization"
        subtitle="Configure global title tags, search snippets, OpenGraph social sharing graphics, and local SEO keywords (Requirement #46)."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            <span>Search Engine Meta Tags</span>
          </h3>

          <Input
            label="Global Website Meta Title *"
            required
            value={seo.metaTitle}
            onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
          />

          <Textarea
            label="Global Meta Description (150-160 characters recommended)"
            rows={3}
            value={seo.metaDescription}
            onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
          />

          <Input
            label="Target Keywords (comma-separated)"
            placeholder="laundry services, dry cleaning, steam press, Hyderabad doorstep laundry"
            value={seo.keywords}
            onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Canonical URL"
              placeholder="https://techwash.in"
              value={seo.canonicalUrl}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
            />
            <Input
              label="OpenGraph Social Share Image URL"
              placeholder="https://..."
              value={seo.ogImageUrl}
              onChange={(e) => setSeo({ ...seo, ogImageUrl: e.target.value })}
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
            Save SEO Metadata
          </Button>
        </div>
      </form>
    </div>
  );
};
