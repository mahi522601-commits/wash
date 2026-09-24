import React, { useState, useEffect } from 'react';
import { dailyReportScheduler, DEFAULT_SCHEDULE_CONFIG } from '../../services/dailyReportScheduler';
import { whatsappNotificationService } from '../../services/whatsappNotificationService';
import { useToast } from '../../context/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { 
  Clock, 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DailyWhatsAppSchedulerCard = ({ reportData, onRefresh }) => {
  const { success, error, info } = useToast();
  const [config, setConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [loading, setLoading] = useState(true);

  // Add Recipient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', phone: '', role: 'Management' });
  const [isAdding, setIsAdding] = useState(false);

  // Delete Recipient Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Dispatch Center Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isDispatchingNow, setIsDispatchingNow] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showPreviewText, setShowPreviewText] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await dailyReportScheduler.getConfig();
      setConfig(data);
    } catch (e) {
      console.warn('Failed to load daily schedule config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    const handleUpdate = (e) => {
      if (e.detail) setConfig(e.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('techwash-daily-schedule-updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('techwash-daily-schedule-updated', handleUpdate);
      }
    };
  }, []);

  const handleToggleEnabled = async () => {
    try {
      const nextState = !config.enabled;
      const updated = await dailyReportScheduler.saveConfig({
        ...config,
        enabled: nextState,
      });
      setConfig(updated);
      success(
        nextState ? 'Auto-Dispatch Enabled' : 'Auto-Dispatch Paused',
        nextState 
          ? 'Daily overview reports will be sent at 10:00 PM nightly.' 
          : 'Automated 10:00 PM dispatch is now paused.'
      );
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  const handleAddRecipient = async (e) => {
    e.preventDefault();
    if (!newRecipient.phone.trim()) {
      error('Phone Required', 'Please enter a valid WhatsApp mobile number.');
      return;
    }
    setIsAdding(true);
    try {
      const updated = await dailyReportScheduler.addRecipient(newRecipient);
      setConfig(updated);
      success('Recipient Added', `WhatsApp number for "${newRecipient.name || newRecipient.phone}" added to database.`);
      setShowAddModal(false);
      setNewRecipient({ name: '', phone: '', role: 'Management' });
    } catch (err) {
      error('Add Failed', err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRecipient = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const updated = await dailyReportScheduler.deleteRecipient(deleteTarget.id);
      setConfig(updated);
      success('Recipient Removed', `Number for "${deleteTarget.name}" was removed.`);
      setDeleteTarget(null);
    } catch (err) {
      error('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleRecipient = async (recId) => {
    try {
      const updated = await dailyReportScheduler.toggleRecipientActive(recId);
      setConfig(updated);
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  // Open Direct WhatsApp Send Center Modal
  const handleOpenDispatchCenter = async () => {
    setShowDispatchModal(true);
    try {
      await dailyReportScheduler.dispatchDailyReportNow({ isManual: true });
      loadConfig();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Dispatch log update notice:', err);
    }
  };

  // 1-Click WhatsApp Direct Opener
  const handleOpenIndividualWhatsApp = (rec) => {
    const documentText = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, rec.name);
    whatsappNotificationService.openWhatsAppManual(rec.phone, documentText);
    success('WhatsApp Opened', `Prepared executive sales summary for ${rec.name} (${rec.phone}).`);
  };

  // Copy Document Text
  const handleCopyDocument = async (rec) => {
    const documentText = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, rec?.name || 'Management');
    await whatsappNotificationService.copyMessageToClipboard(documentText);
    setCopiedId(rec?.id || 'all');
    success('Overview Copied', 'Daily executive sales summary copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeRecipients = (config.recipients || []).filter(r => r.active !== false);
  const sampleMessage = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, activeRecipients[0]?.name || 'Management');

  return (
    <Card variant="luxury" className="p-6 sm:p-7 bg-white border-emerald-300 shadow-md space-y-6">
      
      {/* 1. Header & Scheduler Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black font-display text-slate-900">
                ⏰ Automated 10:00 PM Daily Sales Overview & WhatsApp Dispatcher
              </h3>
              <Badge variant={config.enabled ? 'emerald' : 'slate'} dot>
                {config.enabled ? 'Active (10:00 PM)' : 'Paused'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically delivers professional in-detail daily sales breakdown, collection inflows, dues, and printable PDF audit links to Admin & Owner WhatsApp numbers every night at 10:00 PM IST.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleEnabled}
            className={config.enabled ? 'text-slate-600 border-slate-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'}
          >
            {config.enabled ? 'Pause Auto-Send' : 'Enable 10:00 PM Auto-Send'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Send}
            isLoading={isDispatchingNow}
            onClick={handleOpenDispatchCenter}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-md font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🚀 Send Today's 10 PM Overview Now</span>
          </Button>
        </div>
      </div>

      {/* 2. Schedule Parameters & Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Scheduled Night Trigger
          </span>
          <div className="text-sm font-black font-mono text-emerald-950 mt-0.5">
            🌙 Every Night at 10:00 PM (22:00 IST)
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Executive Message & Report Format
          </span>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            📄 In-Detail Sales Breakdown + Printable A4 PDF Link
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Last Dispatched Execution
          </span>
          <div className="text-xs font-bold text-slate-800 mt-0.5">
            {config.lastDispatchedTimestamp 
              ? `${new Date(config.lastDispatchedTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} (${config.lastDispatchedDate})`
              : 'Pending scheduled 10:00 PM trigger'}
          </div>
        </div>
      </div>

      {/* 3. Recipient WhatsApp Numbers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Admin & Owner WhatsApp Recipients ({config.recipients?.length || 0})
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddModal(true)}
            className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
          >
            Add WhatsApp Number
          </Button>
        </div>

        {(!config.recipients || config.recipients.length === 0) ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            No recipient WhatsApp numbers added yet. Click "+ Add WhatsApp Number" above to add owners and managers.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            {config.recipients.map((rec) => (
              <div 
                key={rec.id} 
                className="p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    rec.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {rec.name?.charAt(0)?.toUpperCase() || 'W'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <span>{rec.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {rec.role || 'Management'}
                      </span>
                      {rec.active !== false ? (
                        <span className="text-[10px] font-bold text-emerald-600">● Active</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">○ Paused</span>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                      +91 {rec.phone.replace(/\D/g, '').slice(-10)}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Primary 1-Click Send WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleOpenIndividualWhatsApp(rec)}
                    title={`Open WhatsApp and send daily overview to ${rec.name}`}
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyDocument(rec)}
                    title="Copy today's Document Text"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === rec.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === rec.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleRecipient(rec.id)}
                    className="text-[11px] font-bold px-2 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    {rec.active !== false ? 'Pause' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(rec)}
                    title="Remove Recipient"
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. DIRECT WHATSAPP SEND CENTER MODAL ── */}
      <Modal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        title="📱 Send Daily 10:00 PM Executive Overview via WhatsApp"
        subtitle="Click any recipient below to immediately open WhatsApp Web / App with the official formatted sales summary."
      >
        <div className="space-y-4 text-xs">
          
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Executive Sales Report Ready for Dispatch</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Clicking <strong>"Send to WhatsApp"</strong> on any number opens WhatsApp Web / Mobile directly with the full formatted text, totals, collections breakdown, and printable PDF audit link.
            </p>
          </div>

          {/* Recipient Buttons List */}
          <div className="space-y-2.5">
            <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
              Select Recipient to Send:
            </label>

            {activeRecipients.length === 0 ? (
              <p className="text-slate-500 py-2">No active recipients configured. Please add an active phone number first.</p>
            ) : (
              activeRecipients.map((rec, i) => (
                <div 
                  key={rec.id || i}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>👤 {rec.name}</span>
                      <span className="text-[10px] font-semibold text-slate-500">({rec.role || 'Management'})</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                      📱 +91 {rec.phone.replace(/\D/g, '').slice(-10)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyDocument(rec)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenIndividualWhatsApp(rec)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Open WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Collapsible Message Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setShowPreviewText(prev => !prev)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>📄 Preview Formatted Executive WhatsApp Document</span>
              {showPreviewText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPreviewText && (
              <div className="p-3 border-t border-slate-200 bg-white font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto">
                {sampleMessage}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end border-t border-slate-100">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowDispatchModal(false)}
              className="bg-slate-900 text-white"
            >
              Done
            </Button>
          </div>

        </div>
      </Modal>

      {/* 5. Add Recipient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add WhatsApp Report Recipient"
        subtitle="Add owner or store manager mobile numbers to receive the automated daily 10:00 PM executive sales overview."
      >
        <form onSubmit={handleAddRecipient} className="space-y-4 text-xs">
          <Input
            label="Recipient Name / Designation *"
            required
            placeholder="e.g. Rahul Sharma (Managing Director)"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
          />

          <Input
            label="WhatsApp Mobile Number *"
            required
            type="tel"
            placeholder="e.g. +91 93987 24704"
            value={newRecipient.phone}
            onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
          />

          <div>
            <label className="block text-slate-700 font-bold mb-1">Role / Department</label>
            <select
              value={newRecipient.role}
              onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-bold text-slate-800"
            >
              <option value="Store Owner / Director">👑 Store Owner / Director</option>
              <option value="General Manager">💼 General Manager</option>
              <option value="Operations Lead">🧺 Operations Lead</option>
              <option value="Accounts & Finance">💰 Accounts & Finance</option>
              <option value="Counter Cashier">🏪 Counter Cashier</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAdding} className="bg-[#25D366] text-white">
              Save WhatsApp Number
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Delete Recipient Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRecipient}
        title={`Remove Recipient "${deleteTarget?.name}"?`}
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.phone}) from receiving nightly 10:00 PM WhatsApp reports?`}
        confirmText="Remove Number"
        isLoading={isDeleting}
      />

    </Card>
  );
};
