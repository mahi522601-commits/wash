import React, { useState, useEffect } from 'react';
import { dailyReportScheduler, DEFAULT_SCHEDULE_CONFIG } from '../../services/dailyReportScheduler';
import { useToast } from '../../context/ToastContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
  Mail, 
  Clock, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Power, 
  FlaskConical, 
  RefreshCw, 
  Globe, 
  AtSign, 
  ShieldCheck,
  Check,
  Calendar
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DailyEmailSchedulerCard = ({ reportData, onRefresh }) => {
  const { success, error, info } = useToast();
  const [config, setConfig] = useState(DEFAULT_SCHEDULE_CONFIG);
  const [loading, setLoading] = useState(true);

  // Time Picker Selectors
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('PM');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Email Recipient Lists State
  const [emailTo, setEmailTo] = useState(['admin@techwash.in']);
  const [emailCc, setEmailCc] = useState([]);
  const [newToInput, setNewToInput] = useState('');
  const [newCcInput, setNewCcInput] = useState('');
  const [toInputError, setToInputError] = useState('');
  const [ccInputError, setCcInputError] = useState('');

  // Action Execution State
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [lastServerStatus, setLastServerStatus] = useState('Ready');
  const [lastReportInfo, setLastReportInfo] = useState(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await dailyReportScheduler.getConfig();
      setConfig(data);
      
      if (data.hour !== undefined) setSelectedHour(data.hour);
      if (data.minute !== undefined) setSelectedMinute(data.minute);
      if (data.amPm) setSelectedAmPm(data.amPm);
      
      const parsedTo = data.emailTo || data.recipientsTo || (process.env.EMAIL_TO ? [process.env.EMAIL_TO] : ['admin@techwash.in']);
      const parsedCc = data.emailCc || data.recipientsCc || (process.env.EMAIL_CC ? [process.env.EMAIL_CC] : []);
      
      setEmailTo(Array.isArray(parsedTo) ? parsedTo : [String(parsedTo)]);
      setEmailCc(Array.isArray(parsedCc) ? parsedCc : (parsedCc ? [String(parsedCc)] : []));

      if (data.lastStatus) {
        setLastServerStatus(data.lastStatus);
      }
      if (data.lastDispatchedTimestamp) {
        setLastReportInfo({
          timestamp: data.lastDispatchedTimestamp,
          date: data.lastDispatchedDate || 'Today',
          status: data.lastStatus || 'SENT',
        });
      }
    } catch (e) {
      console.warn('Failed to load daily email schedule config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Toggle Automation Enabled / Disabled
  const handleToggleEnabled = async () => {
    try {
      const nextState = !config.enabled;
      const updated = await dailyReportScheduler.saveConfig({
        ...config,
        enabled: nextState,
        emailTo,
        emailCc,
      });
      setConfig(updated);
      const timeStr = `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;
      success(
        nextState ? 'Email Automation Enabled' : 'Email Automation Paused',
        nextState 
          ? `Daily executive report will be sent automatically at ${timeStr} IST.` 
          : 'Automated daily report email dispatch is now paused.'
      );
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  // Add Recipient Handlers
  const handleAddEmailTo = () => {
    const val = newToInput.trim().toLowerCase();
    if (!val) return;
    if (!EMAIL_REGEX.test(val)) {
      setToInputError('Please enter a valid email address (e.g. owner@example.com)');
      return;
    }
    if (emailTo.includes(val)) {
      setToInputError('Email is already in TO list.');
      return;
    }
    setToInputError('');
    setEmailTo(prev => [...prev, val]);
    setNewToInput('');
  };

  const handleRemoveEmailTo = (targetEmail) => {
    if (emailTo.length <= 1) {
      error('Recipient Required', 'At least one TO email address is required.');
      return;
    }
    setEmailTo(prev => prev.filter(e => e !== targetEmail));
  };

  const handleAddEmailCc = () => {
    const val = newCcInput.trim().toLowerCase();
    if (!val) return;
    if (!EMAIL_REGEX.test(val)) {
      setCcInputError('Please enter a valid email address (e.g. accounts@example.com)');
      return;
    }
    if (emailCc.includes(val)) {
      setCcInputError('Email is already in CC list.');
      return;
    }
    setCcInputError('');
    setEmailCc(prev => [...prev, val]);
    setNewCcInput('');
  };

  const handleRemoveEmailCc = (targetEmail) => {
    setEmailCc(prev => prev.filter(e => e !== targetEmail));
  };

  // Save Schedule & Recipients Settings
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

      const fullConfig = await dailyReportScheduler.saveConfig({
        ...updated,
        emailTo,
        emailCc,
        recipientsTo: emailTo,
        recipientsCc: emailCc,
        cutoffHour: selectedHour,
        cutoffMinute: selectedMinute,
        cutoffAmPm: selectedAmPm,
        timezone: 'Asia/Kolkata',
      });

      setConfig(fullConfig);
      const formatted = `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;
      success('Email Schedule Saved', `Daily email report settings updated to ${formatted} IST with ${emailTo.length} TO and ${emailCc.length} CC recipient(s).`);
    } catch (err) {
      error('Save Failed', err.message || 'Could not update email schedule settings.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Trigger Send Today's Report Now
  const handleSendTodayReportNow = async () => {
    setIsSendingNow(true);
    try {
      const res = await dailyReportScheduler.triggerServerlessReport({ 
        force: true,
        to: emailTo.join(','),
        cc: emailCc.join(','),
      });

      if (res && res.success) {
        setLastServerStatus('Sent');
        const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        setLastReportInfo({
          timestamp: new Date().toISOString(),
          date: res.reportDate || 'Today',
          status: 'SENT',
        });
        success('Email Report Sent', `Daily Executive Sales Report & A4 PDF dispatched successfully via ${res.emailProvider || 'Resend'}.`);
        if (onRefresh) onRefresh();
      } else {
        setLastServerStatus('Failed');
        error('Delivery Failed', res?.error || 'Failed to dispatch daily report email.');
      }
    } catch (err) {
      setLastServerStatus('Failed');
      error('Server Error', err.message || 'Error connecting to daily report serverless endpoint.');
    } finally {
      setIsSendingNow(false);
    }
  };

  // Trigger Test Email
  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const res = await dailyReportScheduler.triggerServerlessReport({ 
        force: true,
        testMode: true,
        to: emailTo.join(','),
        cc: emailCc.join(','),
      });

      if (res && res.success) {
        success('Test Email Sent', `Verification test email dispatched to ${emailTo.join(', ')}. No fake sales transactions were created.`);
      } else {
        error('Test Email Failed', res?.error || 'Failed to deliver test email.');
      }
    } catch (err) {
      error('Test Error', err.message || 'Could not trigger test email.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const scheduleTimeFormatted = `${selectedHour}:${String(selectedMinute).padStart(2, '0')} ${selectedAmPm}`;

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-slate-700 shadow-xl overflow-hidden relative">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        
        {/* ── HEADER TITLE & AUTOMATION SWITCH ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white font-display tracking-tight">
                  DAILY EMAIL SALES REPORT & SCHEDULE CONTROL
                </h2>
                <Badge 
                  variant={config.enabled ? 'success' : 'secondary'}
                  className={`text-xs font-bold px-2.5 py-0.5 border ${
                    config.enabled 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  {config.enabled ? 'Automation: ON' : 'Automation: OFF'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Automated daily executive sales summary and A4 PDF report delivered by email.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleEnabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0 ${
              config.enabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{config.enabled ? 'Pause Email Automation' : 'Enable Email Automation'}</span>
          </button>
        </div>

        {/* ── 4 STATUS CARDS GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>CURRENT SCHEDULE</span>
            </div>
            <div className="text-base font-black text-white font-mono">
              {scheduleTimeFormatted} IST
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Daily Cutoff</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEXT REPORT</span>
            </div>
            <div className="text-base font-black text-cyan-300 font-mono">
              Today at {scheduleTimeFormatted}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Asia/Kolkata</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>LAST EMAIL REPORT</span>
            </div>
            <div className="text-base font-black text-emerald-300 font-mono">
              {lastReportInfo ? lastReportInfo.date : 'Today'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {lastReportInfo ? `Status: ${lastReportInfo.status}` : 'Status: Delivered'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SERVER STATUS</span>
            </div>
            <div className={`text-base font-black font-mono ${
              lastServerStatus === 'Sent' || lastServerStatus === 'Ready' 
                ? 'text-emerald-400' 
                : 'text-amber-400'
            }`}>
              {lastServerStatus}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Resend Engine</div>
          </div>
        </div>

        {/* ── REPORT TIME & RECIPIENTS FORM ── */}
        <form onSubmit={handleSaveSchedule} className="space-y-6">
          
          {/* 1. REPORT TIME (ASIA/KOLKATA IST) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>REPORT TIME (ASIA/KOLKATA IST)</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Timezone: Asia/Kolkata (IST)</span>
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-700">
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-slate-400 font-black text-lg">:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(Number(e.target.value))}
                  className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {[0, 15, 30, 45].map(m => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  value={selectedAmPm}
                  onChange={(e) => setSelectedAmPm(e.target.value)}
                  className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <div className="text-xs text-slate-300 font-medium">
                The selected time (<span className="text-white font-bold">{scheduleTimeFormatted} IST</span>) controls the daily executive cutoff calculation.
              </div>
            </div>
          </div>

          {/* 2. EMAIL RECIPIENTS (TO & CC) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-4 h-4 text-indigo-400" />
                <span>EMAIL RECIPIENTS</span>
              </label>
              <span className="text-[11px] text-slate-400">Multiple email addresses supported</span>
            </div>

            {/* TO RECIPIENTS LIST */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>TO:</span>
                <span className="text-[11px] font-normal text-slate-400">(Primary Management Recipients)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                {emailTo.map(email => (
                  <div key={email} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-semibold">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmailTo(email)}
                      className="text-indigo-300 hover:text-rose-400 transition cursor-pointer ml-1"
                      title="Remove email address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <input
                    type="email"
                    placeholder="e.g. owner@example.com"
                    value={newToInput}
                    onChange={(e) => { setNewToInput(e.target.value); setToInputError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmailTo(); } }}
                    className="flex-1 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmailTo}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add TO</span>
                  </button>
                </div>
              </div>
              {toInputError && <p className="text-xs text-rose-400 font-medium">{toInputError}</p>}
            </div>

            {/* CC RECIPIENTS LIST */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>CC:</span>
                <span className="text-[11px] font-normal text-slate-400">(Copy Accounts / Audit Team)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                {emailCc.length === 0 && (
                  <span className="text-xs text-slate-500 italic">No CC recipients configured (Optional).</span>
                )}
                {emailCc.map(email => (
                  <div key={email} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-semibold">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmailCc(email)}
                      className="text-cyan-300 hover:text-rose-400 transition cursor-pointer ml-1"
                      title="Remove CC address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <input
                    type="email"
                    placeholder="e.g. accounts@example.com"
                    value={newCcInput}
                    onChange={(e) => { setNewCcInput(e.target.value); setCcInputError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmailCc(); } }}
                    className="flex-1 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-600 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmailCc}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add CC</span>
                  </button>
                </div>
              </div>
              {ccInputError && <p className="text-xs text-rose-400 font-medium">{ccInputError}</p>}
            </div>

          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Server keys (RESEND_API_KEY, CRON_SECRET) remain protected on Vercel.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={isSavingSchedule}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingSchedule ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Email Schedule</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSendingNow}
                onClick={handleSendTodayReportNow}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSendingNow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Real Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Today's Report Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isTestingEmail}
                onClick={handleSendTestEmail}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingEmail ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Test...</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                    <span>Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </Card>
  );
};

// Re-export alias for backward compatibility
export const DailyWhatsAppSchedulerCard = DailyEmailSchedulerCard;
export default DailyEmailSchedulerCard;
