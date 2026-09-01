import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Sparkles, MessageCircle, Phone, Star, Bot, Save } from 'lucide-react';

const DEFAULT_FLOATING_ACTIONS = {
  id: 'floating-config',
  whatsappEnabled: true,
  callEnabled: true,
  chatbotEnabled: true,
  googleReviewEnabled: true,
  googleReviewUrl: 'https://maps.google.com',
  whatsappGreeting: 'Hi Tech Wash, I would like to arrange laundry & dry cleaning pickup!',
  mobileOffsetBottom: 88,
};

export const AdminFloatingActionsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_FLOATING_ACTIONS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    cmsService.getItems('floatingActions')
      .then((data) => {
        if (data && data.length > 0) {
          setConfig({ ...DEFAULT_FLOATING_ACTIONS, ...data[0] });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await cmsService.saveItem('floatingActions', config);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'FloatingActions',
        entityName: 'Floating CTAs & Google Review',
        user: currentUser,
      });
      success('Floating Actions Saved', 'Positioning and action toggles updated.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Floating Actions & Google Review CMS"
        subtitle="Manage the coordinated floating action hub: WhatsApp Concierge, Direct Call, AI Assistant, and Google Review button."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Right Stack: WhatsApp & Call */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>Right-Side Actions (WhatsApp & Direct Phone)</span>
          </h3>

          <Textarea
            label="WhatsApp Preset Greeting Message"
            rows={2}
            value={config.whatsappGreeting}
            onChange={(e) => setConfig({ ...config, whatsappGreeting: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={config.whatsappEnabled !== false}
                onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Enable Pulsing WhatsApp Button</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={config.callEnabled !== false}
                onChange={(e) => setConfig({ ...config, callEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Enable Direct Phone Call Button</span>
            </label>
          </div>
        </Card>

        {/* Left Stack: AI Assistant & Google Review */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span>Left-Side Actions (AI Assistant & Google Review)</span>
          </h3>

          <Input
            label="Google Business Review Destination URL"
            placeholder="https://maps.google.com/?cid=..."
            value={config.googleReviewUrl}
            onChange={(e) => setConfig({ ...config, googleReviewUrl: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={config.chatbotEnabled !== false}
                onChange={(e) => setConfig({ ...config, chatbotEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Enable Tech Wash AI Assistant Button</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={config.googleReviewEnabled !== false}
                onChange={(e) => setConfig({ ...config, googleReviewEnabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span>Enable Google Review Button</span>
            </label>
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
            Save Floating Actions
          </Button>
        </div>

      </form>
    </div>
  );
};
