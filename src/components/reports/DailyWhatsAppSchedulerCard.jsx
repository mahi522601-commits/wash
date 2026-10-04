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
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Save,
  Power,
  FlaskConical
} from 'lucide-react';

export const DailyWhatsAppSchedulerCard = ({ reportData, onRefresh }) => {
  const { success, error, info } = useToast();
  const [config, setConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [loading, setLoading] = useState(true);

  // Time Picker Selectors
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('PM');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Add Recipient Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ name: '', phone: '', role: 'Management' });
  const [isAdding, setIsAdding] = useState(false);

  // Delete Recipient Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Confirmation Dialog State
  const [showManualConfirmModal, setShowManualConfirmModal] = useState(false);

  // Dry Run & Live Execution State
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const [copiedId, setCopiedId] = useState(null);
  const [showPreviewText, setShowPreviewText] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await dailyReportScheduler.getConfig();
      setConfig(data);
      
      if (data.hour !== undefined) setSelectedHour(data.hour);
      if (data.minute !== undefined) setSelectedMinute(data.minute);
      if (data.amPm) setSelectedAmPm(data.amPm);
      else if (data.scheduleTime) {
        const [h, m] = data.scheduleTime.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        setSelectedHour(h12);
        setSelectedMinute(m || 0);
        setSelectedAmPm(ampm);
      }
    } catch (e) {
      console.warn('Failed to load daily schedule config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();

    const handleUpdate = (e) => {
      if (e.detail) {
        setConfig(e.detail);
        if (e.detail.hour !== undefined) setSelectedHour(e.detail.hour);
        if (e.detail.minute !== undefined) setSelectedMinute(e.detail.minute);
        if (e.detail.amPm) setSelectedAmPm(e.detail.amPm);
      }
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
      const timeStr = updated.scheduleTimeFormatted || `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;
      success(
        nextState ? 'Auto-Dispatch Enabled' : 'Auto-Dispatch Paused',
        nextState 
          ? `Daily sales report will be sent automatically at ${timeStr} IST.` 
          : 'Automated daily report dispatch is now paused.'
      );
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSchedule(true);
    try {
      const updated = await dailyReportScheduler.saveScheduleTime({
        hour: selectedHour,
        minute: selectedMinute,
        amPm: selectedAmPm,
        enabled: config.enabled !== false,
      });
      setConfig(updated);
      const formatted = updated.scheduleTimeFormatted || `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;
      success('Schedule Updated', `Daily WhatsApp report schedule updated to ${formatted} IST.`);
    } catch (err) {
      error('Save Failed', err.message || 'Could not update schedule time.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Execute Serverless Dry Run (ZERO WhatsApp Messages Sent)
  const handleExecuteDryRun = async () => {
    setIsExecutingAction(true);
    try {
      const result = await dailyReportScheduler.triggerServerlessReport({ action: 'dry_run' });
      setExecutionResult(result);
      setShowResultModal(true);
      loadConfig();
      if (onRefresh) onRefresh();
      success('Dry Run Verified', 'A4 PDF generated & stored securely in Firebase Storage. ZERO WhatsApp messages sent.');
    } catch (err) {
      error('Dry Run Failed', err.message || 'Serverless dry run failed.');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Execute Serverless Live Send (Confirmed by Admin)
  const handleExecuteLiveSendNow = async () => {
    setShowManualConfirmModal(false);
    setIsExecutingAction(true);
    try {
      const result = await dailyReportScheduler.triggerServerlessReport({ action: 'send_today' });
      setExecutionResult(result);
      setShowResultModal(true);
      loadConfig();
      if (onRefresh) onRefresh();
      if (result.success) {
        success('Live Dispatch Completed', `Report and PDF dispatched to WhatsApp recipients.`);
      } else {
        error('Live Dispatch Notice', result.errorMessage || result.message || 'Dispatch completed with notices.');
      }
    } catch (err) {
      error('Live Send Failed', err.message || 'Failed to dispatch live report.');
    } finally {
      setIsExecutingAction(false);
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
      success('Recipient Added', `WhatsApp number for "${newRecipient.name || newRecipient.phone}" added.`);
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

  const handleOpenIndividualWhatsApp = (rec) => {
    const documentText = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, rec.name);
    whatsappNotificationService.openWhatsAppManual(rec.phone, documentText);
    success('WhatsApp Opened', `Prepared executive sales summary for ${rec.name} (${rec.phone}).`);
  };

  const handleCopyDocument = async (rec) => {
    const documentText = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, rec?.name || 'Management');
    await whatsappNotificationService.copyMessageToClipboard(documentText);
    setCopiedId(rec?.id || 'all');
    success('Overview Copied', 'Daily executive sales summary copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeRecipients = (config.recipients || []).filter(r => r.active !== false);
  const sampleMessage = dailyReportScheduler.buildDailyReportWhatsAppDocument(reportData, activeRecipients[0]?.name || 'Management');
  const currentScheduleFormatted = config.scheduleTimeFormatted || `${config.hour || 10}:${String(config.minute || 0).padStart(2, '0')} ${config.amPm || 'PM'}`;
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <Card variant="luxury" className="p-6 sm:p-7 bg-white border-emerald-300 shadow-md space-y-6">
      
      {/* 1. Header & Automation Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black font-display text-slate-900">
                DAILY WHATSAPP SALES REPORT & SCHEDULE CONTROL
              </h3>
              <Badge variant={config.enabled ? 'emerald' : 'slate'} dot>
                {config.enabled ? `Active (${currentScheduleFormatted})` : 'Paused'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated daily executive sales summary and printable A4 PDF audit links delivered directly to management WhatsApp numbers (Asia/Kolkata IST).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleEnabled}
            className={config.enabled ? 'text-slate-600 border-slate-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'}
          >
            <Power className="w-3.5 h-3.5 mr-1" />
            <span>Automation: {config.enabled ? 'ON' : 'OFF'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={FlaskConical}
            isLoading={isExecutingAction}
            onClick={handleExecuteDryRun}
            className="border-cyan-300 text-cyan-800 bg-cyan-50/70 hover:bg-cyan-100 font-bold cursor-pointer flex items-center gap-1.5"
            title="Execute dry run via Serverless Function. Calculates report and generates PDF but sends ZERO WhatsApp messages."
          >
            <span>🧪 Test Dry Run</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Send}
            isLoading={isExecutingAction}
            onClick={() => setShowManualConfirmModal(true)}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-md font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🚀 Send Today's Report Now</span>
          </Button>
        </div>
      </div>

      {/* 2. Admin Time Picker & Schedule Control Box */}
      <form onSubmit={handleSaveSchedule} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              ⏰ Admin Send Time Setting (Asia/Kolkata IST)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select the exact hour and minute for nightly WhatsApp report delivery. Stored securely in Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
            >
              {hoursList.map(h => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>

            <span className="text-slate-500 font-black text-sm">:</span>

            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
            >
              {minutesList.map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>

            <select
              value={selectedAmPm}
              onChange={(e) => setSelectedAmPm(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={isSavingSchedule}
              className="bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
            >
              Save Schedule
            </Button>
          </div>
        </div>

        {/* Schedule Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200">
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Current Schedule
            </span>
            <div className="text-sm font-black font-mono text-emerald-700 mt-0.5">
              {currentScheduleFormatted} IST
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Next Scheduled Report
            </span>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {config.enabled !== false ? `Today at ${currentScheduleFormatted}` : 'Paused (Automation Off)'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Last Report Dispatched
            </span>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {config.lastDispatchedTimestamp 
                ? `${new Date(config.lastDispatchedTimestamp).toLocaleDateString('en-IN')} ${new Date(config.lastDispatchedTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Not Sent Yet'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Last Server Status
            </span>
            <div className="text-xs font-bold mt-0.5">
              {config.lastStatus === 'COMPLETED' ? (
                <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Dispatched</span>
              ) : config.lastStatus === 'DRY_RUN_COMPLETED' ? (
                <span className="text-cyan-700 flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> DRY RUN — WhatsApp not sent</span>
              ) : config.lastStatus === 'FAILED' ? (
                <span className="text-rose-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>
              ) : (
                <span className="text-slate-500">Idle / Ready</span>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* 3. Recipient WhatsApp Numbers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Management WhatsApp Recipients ({config.recipients?.length || 0})
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
            No recipient WhatsApp numbers added yet. Click "+ Add WhatsApp Number" above.
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

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

      {/* 4. Manual Send Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showManualConfirmModal}
        onClose={() => setShowManualConfirmModal(false)}
        onConfirm={handleExecuteLiveSendNow}
        title="Send today's sales report to WhatsApp now?"
        message={`This will call the Vercel serverless function using your authenticated Firebase ID token, generate today's live executive report, create the private A4 PDF statement, and dispatch WhatsApp messages to ${activeRecipients.length} configured management recipient(s).`}
        confirmText={`Yes, Send Now (${activeRecipients.length} Recipients)`}
        isLoading={isExecutingAction}
      />

      {/* 5. Server Execution Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={executionResult?.mode === 'DRY_RUN' ? '🧪 Dry Run Execution Result' : '🚀 Serverless Dispatch Result'}
        subtitle={`Report Date: ${executionResult?.reportDate || 'Today'} • Status: ${executionResult?.statusLabel || executionResult?.status}`}
      >
        <div className="space-y-4 text-xs font-sans">
          
          <div className={`p-3.5 rounded-2xl border ${
            executionResult?.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-cyan-50 border-cyan-200 text-cyan-950'
          }`}>
            <div className="font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{executionResult?.statusLabel || executionResult?.status}</span>
            </div>
            <p className="text-[11px] mt-1">
              {executionResult?.mode === 'DRY_RUN' 
                ? 'Report calculated, A4 PDF generated, and 24h signed link stored. ZERO WhatsApp messages were dispatched.'
                : 'Serverless execution completed.'}
            </p>
          </div>

          {executionResult?.financialSummary && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">Total Orders</span>
                <span className="font-black text-slate-900 font-mono text-sm">{executionResult.financialSummary.totalOrders}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">Gross Billed Sales</span>
                <span className="font-black text-amber-700 font-mono text-sm">Rs. {(executionResult.financialSummary.grossBilledSales || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">Inflow Collections</span>
                <span className="font-black text-emerald-700 font-mono text-sm">Rs. {(executionResult.financialSummary.totalInflowCollections || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">Net Pending Dues</span>
                <span className="font-black text-rose-700 font-mono text-sm">Rs. {(executionResult.financialSummary.netPendingDues || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {executionResult?.pdfLocation && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Private A4 PDF Signed URL (24h)</span>
              <a
                href={executionResult.pdfLocation}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-700 hover:underline font-mono text-[11px] block truncate"
              >
                👉 {executionResult.pdfLocation}
              </a>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end border-t border-slate-100">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowResultModal(false)}
              className="bg-slate-900 text-white"
            >
              Close Result
            </Button>
          </div>

        </div>
      </Modal>

      {/* 6. Add Recipient Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add WhatsApp Report Recipient"
        subtitle="Add owner or store manager mobile numbers to receive automated daily executive sales overviews."
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

      {/* 7. Delete Recipient Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRecipient}
        title={`Remove Recipient "${deleteTarget?.name}"?`}
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.phone}) from receiving daily WhatsApp reports?`}
        confirmText="Remove Number"
        isLoading={isDeleting}
      />

    </Card>
  );
};
