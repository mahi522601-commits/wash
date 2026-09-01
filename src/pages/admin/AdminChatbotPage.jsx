import React, { useState, useEffect } from 'react';
import { chatbotService, DEFAULT_CHATBOT_CONFIG } from '../../services/chatbotService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Bot, Sparkles, Save, MessageSquare, ShieldCheck } from 'lucide-react';

export const AdminChatbotPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_CHATBOT_CONFIG);
  const [newChipText, setNewChipText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    chatbotService.getConfig().then(setConfig);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await chatbotService.saveConfig(config);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'Chatbot',
        entityName: 'Chatbot Configuration',
        user: currentUser,
      });
      success('Chatbot Saved', 'AI Concierge parameters updated successfully.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addChip = () => {
    if (!newChipText.trim()) return;
    setConfig({
      ...config,
      quickPrompts: [...(config.quickPrompts || []), newChipText.trim()]
    });
    setNewChipText('');
  };

  const removeChip = (idx) => {
    setConfig({
      ...config,
      quickPrompts: config.quickPrompts.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Assistant & Concierge CMS"
        subtitle="Manage conversational bot greeting, quick suggestion chips, live CMS knowledge base, and booking handoffs."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Main Settings Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-600" />
              <span>General Assistant Identity</span>
            </h3>
            <Badge variant={config.enabled !== false ? 'emerald' : 'slate'}>
              {config.enabled !== false ? 'Bot Active' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Concierge Bot Name *"
              required
              value={config.botName}
              onChange={(e) => setConfig({ ...config, botName: e.target.value })}
            />
            <Input
              label="Availability Status Subtitle"
              value={config.workingHoursText}
              onChange={(e) => setConfig({ ...config, workingHoursText: e.target.value })}
            />
          </div>

          <Textarea
            label="Welcome Greeting Message *"
            required
            rows={3}
            value={config.welcomeMessage}
            onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Human WhatsApp Fallback Number"
              placeholder="+91 98765 43210"
              value={config.whatsappFallbackPhone}
              onChange={(e) => setConfig({ ...config, whatsappFallbackPhone: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                AI Intelligence Provider Engine
              </label>
              <select
                value={config.aiProvider || 'rule-based-cms'}
                onChange={(e) => setConfig({ ...config, aiProvider: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800"
              >
                <option value="rule-based-cms">Real-time CMS Knowledge Matcher (Zero latency, live sync)</option>
                <option value="openai">OpenAI GPT-4o Gateway (Requires Serverless Bridge)</option>
                <option value="gemini">Google Gemini 1.5 Pro (Requires Serverless Bridge)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="bot-enable"
              checked={config.enabled !== false}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="bot-enable" className="text-xs font-semibold text-slate-700">
              Enable Floating AI Assistant on Public Website
            </label>
          </div>
        </Card>

        {/* Quick Suggestion Prompt Chips Card */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Quick Suggestion Prompt Chips</span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-3">
            {config.quickPrompts?.map((chip, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-800">
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => removeChip(idx)}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Add new suggestion chip (e.g. Silk saree care pricing)"
              value={newChipText}
              onChange={(e) => setNewChipText(e.target.value)}
            />
            <Button variant="secondary" size="md" onClick={addChip}>
              Add Chip
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
            Save Chatbot Settings
          </Button>
        </div>

      </form>
    </div>
  );
};
