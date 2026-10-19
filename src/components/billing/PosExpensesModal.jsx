import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { expenseService } from '../../services/expenseService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { compressImageToTargetKb, formatFileSize, TARGET_MAX_EXPENSE_BILL_KB } from '../../utils/imageCompressor';
import { isSpeechRecognitionSupported, createSpeechRecognition } from '../../utils/speechRecognition';
import { 
  Wallet, 
  Receipt, 
  Camera, 
  Upload, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  X, 
  Plus, 
  Eye, 
  Store, 
  Clock, 
  DollarSign, 
  RefreshCw,
  FileText,
  Check,
  ZoomIn,
  Download,
  Printer
} from 'lucide-react';

const POS_EXPENSE_CATEGORIES = [
  { id: 'snacks', name: 'Tea & Snacks', icon: '☕', group: 'Staff Welfare' },
  { id: 'consumables', name: 'Detergent / Chemicals (Urgent)', icon: '🧴', group: 'Consumables' },
  { id: 'fuel', name: 'Delivery Bike Fuel / Petrol', icon: '🛵', group: 'Logistics' },
  { id: 'cleaning', name: 'Broom / Mop / Housekeeping', icon: '🧹', group: 'Maintenance' },
  { id: 'maintenance', name: 'Machine Repair & Hardware', icon: '🔧', group: 'Maintenance' },
  { id: 'packaging', name: 'Packaging Bags / Hanger Clips', icon: '📦', group: 'Consumables' },
  { id: 'utilities', name: 'Drinking Water / Minor Utility', icon: '💧', group: 'Utilities' },
  { id: 'misc', name: 'Other Counter Petty Cash', icon: '💸', group: 'General' },
];

const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

const QUICK_DESCRIPTIONS = [
  'Chai & biscuits for counter staff',
  'Emergency detergent packet from local store',
  'Petrol for delivery bike runner',
  'Drinking water 20L bubble refill',
  'Store cleaning cloth & mop buy',
  'Packaging tape & marker pens'
];

export const PosExpensesModal = ({
  isOpen,
  onClose,
  terminal = null,
  activeTerminalId = 'counter-1'
}) => {
  const { success, error, info } = useToast();

  const isPos2 = activeTerminalId === 'counter-2';
  const posCode = terminal?.code || (isPos2 ? 'TW-POS-02' : 'TW-POS-01');
  const posName = terminal?.name || (isPos2 
    ? 'Counter 2 — Branch 1 (Tolichowki / OU Colony)' 
    : 'Counter 1 — Main Branch (Shaikpet / Manikonda)');

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'list'
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('snacks');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [vendorName, setVendorName] = useState('');
  
  // Mandatory Bill Image State (< 50 KB)
  const [billImage, setBillImage] = useState(null); // { dataUrl, sizeBytes, sizeKb, originalSizeKb }
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);

  // Speech-to-text State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [voiceUsed, setVoiceUsed] = useState(false);
  const recognitionRef = useRef(null);

  // Submitting & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Bill Image Enlarged Viewer Modal
  const [viewingBillImage, setViewingBillImage] = useState(null);

  // Delete Confirm
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Check speech recognition support
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Load expenses for this branch
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const allExpenses = await expenseService.getExpenses({ branchFilter: activeTerminalId, forceRefresh: true });
      // Sort newest first
      const sorted = (allExpenses || []).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setExpenses(sorted);
    } catch (err) {
      console.warn('Failed to load POS expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTerminalId]);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
      setFormError('');
    } else {
      // Stop speech recognition when modal closes
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen, loadExpenses]);

  // Today's expenses for this POS
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const todayExpenses = useMemo(() => {
    return expenses.filter(e => {
      const expDate = e.date || (e.createdAt ? e.createdAt.split('T')[0] : '');
      return expDate === todayStr;
    });
  }, [expenses, todayStr]);

  const todayTotalAmount = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [todayExpenses]);

  // ─────────────────────────────────────────────────────────────
  // SPEECH RECOGNITION HANDLER
  // ─────────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (!speechSupported) {
      info('Voice input is not supported in this browser. Please type the description.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechTranscript('');
      const recognition = createSpeechRecognition({
        lang: 'en-IN',
        onStart: () => {
          setIsListening(true);
          setVoiceUsed(true);
        },
        onResult: ({ text, amount: spokenAmount, cleanText }) => {
          setSpeechTranscript(text);
          if (cleanText) {
            setDescription(prev => {
              if (!prev || prev.trim().length === 0) return cleanText;
              return `${prev} ${cleanText}`;
            });
          }
          // If spoken sentence contained a rupee amount, auto-fill amount if not already set
          if (spokenAmount && (!amount || Number(amount) === 0)) {
            setAmount(String(spokenAmount));
            info(`Auto-detected amount: ₹${spokenAmount}`);
          }
        },
        onError: ({ message }) => {
          setIsListening(false);
          error(message || 'Voice error occurred. Please try again.');
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition failed to start:', err);
      setIsListening(false);
      error('Could not activate microphone. Check browser permissions.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MANDATORY IMAGE UPLOAD & COMPRESSION TO <= 50 KB
  // ─────────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsCompressing(true);
    setFormError('');

    try {
      const result = await compressImageToTargetKb(file, TARGET_MAX_EXPENSE_BILL_KB);
      setBillImage(result);
      success(`Bill compressed to ${result.sizeKb} KB (under ${TARGET_MAX_EXPENSE_BILL_KB} KB limit)!`);
    } catch (err) {
      console.error('Image compression failed:', err);
      setFormError('Failed to compress bill image. Please try another photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const removeBillImage = () => {
    setBillImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────
  // SUBMIT NEW EXPENSE
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid expense amount in ₹.');
      return;
    }

    if (!description || description.trim().length === 0) {
      setFormError('Expense description / reason is required.');
      return;
    }

    // MANDATORY BILL IMAGE CHECK
    if (!billImage || !billImage.dataUrl) {
      setFormError('⚠️ Bill / Receipt photo is MANDATORY! Please take a photo or upload the bill.');
      return;
    }

    if (!billImage.isUnder50Kb) {
      setFormError(`Bill image must be under ${TARGET_MAX_EXPENSE_BILL_KB} KB. Current: ${billImage.sizeKb} KB.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCat = POS_EXPENSE_CATEGORIES.find(c => c.id === categoryId) || POS_EXPENSE_CATEGORIES[0];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newExpense = {
        title: description.trim(),
        amount: parsedAmount,
        date: todayStr,
        createdAt: now.toISOString(),
        time: timeStr,
        branchId: activeTerminalId,
        branchName: posName,
        source: posCode,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        icon: selectedCat.icon,
        categoryGroup: selectedCat.group,
        paymentMode,
        vendorName: vendorName.trim() || 'Counter Expense',
        notes: `Recorded at ${posCode} (${posName}) at ${timeStr}${voiceUsed ? ' [Via Voice Mic]' : ''}`,
        receiptAttachmentUrl: billImage.dataUrl,
        receiptSizeBytes: billImage.sizeBytes,
        receiptSizeKb: billImage.sizeKb,
        voiceRecorded: Boolean(voiceUsed),
        isPosExpense: true,
      };

      const saved = await expenseService.addExpense(newExpense);
      success(`₹${parsedAmount} logged successfully for ${posCode}!`);

      // Reset Form
      setAmount('');
      setDescription('');
      setVendorName('');
      setBillImage(null);
      setVoiceUsed(false);
      setSpeechTranscript('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload list and switch to list tab
      await loadExpenses();
      setActiveTab('list');
    } catch (err) {
      console.error('Failed to save POS expense:', err);
      setFormError('Could not save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DELETE EXPENSE
  // ─────────────────────────────────────────────────────────────
  const handleDeleteExpense = async (id) => {
    try {
      await expenseService.deleteExpense(id);
      success('Expense deleted.');
      setExpenseToDelete(null);
      await loadExpenses();
    } catch (err) {
      error('Failed to delete expense.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* ── MODAL HEADER ── */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-slate-900/95 flex items-center justify-between gap-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isPos2 
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400' 
                : 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase ${
                  isPos2 
                    ? 'bg-blue-500 text-slate-950' 
                    : 'bg-orange-500 text-slate-950'
                }`}>
                  {posCode}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Counter Expenses & Petty Cash
                </h2>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {posName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SHIFT EXPENSES STATS BAR ── */}
        <div className="grid grid-cols-2 gap-3 px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Today's Entries</span>
              <span className="font-mono font-bold text-white text-sm">
                {todayExpenses.length} Expenses
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 justify-end">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Today's Total</span>
              <span className="font-mono font-black text-rose-400 text-sm">
                {formatCurrency(todayTotalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS ── */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-white/5 bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'new'
                ? isPos2 
                  ? 'border-blue-400 text-blue-400 bg-white/5' 
                  : 'border-orange-400 text-orange-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>➕ Log New Expense</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'list'
                ? isPos2 
                  ? 'border-blue-400 text-blue-400 bg-white/5' 
                  : 'border-orange-400 text-orange-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>📋 Today's Expenses ({todayExpenses.length})</span>
          </button>
        </div>

        {/* ── MODAL BODY CONTENT ── */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: LOG NEW EXPENSE FORM                                 */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'new' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Error Alert */}
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. AMOUNT (₹) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Expense Amount (₹) <strong className="text-rose-400">*</strong></span>
                  <span className="text-[10px] text-slate-400 font-normal">Paid from counter cash or UPI</span>
                </label>
                
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-rose-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-white/10 focus:border-orange-500 text-2xl font-black font-mono text-white placeholder-slate-600 outline-none transition"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick:</span>
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(String(amt))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. DESCRIPTION WITH MIC VOICE INPUT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <span>Description / Reason <strong className="text-rose-400">*</strong></span>
                    {voiceUsed && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        🎙️ Voice Recorded
                      </span>
                    )}
                  </label>

                  {/* Speech-to-text Mic Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300'
                    }`}
                    title={isListening ? 'Click to stop voice recording' : 'Click to speak description with microphone'}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 animate-spin" />
                        <span>Listening... Tap Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>🎙️ Speak (Mic)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Active Listening Animated Indicator */}
                {isListening && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Listening to microphone... Speak what this expense was for (e.g. "Tea 60 rupees", "Petrol 200").</span>
                  </div>
                )}

                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Tea & snacks for staff, Emergency detergent packet, Petrol for delivery bike..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-white/10 focus:border-orange-500 text-sm font-medium text-white placeholder-slate-500 outline-none transition resize-none"
                />

                {/* Quick Common Description Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_DESCRIPTIONS.slice(0, 4).map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDescription(text)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-slate-200 transition truncate max-w-[200px]"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. MANDATORY BILL PHOTO UPLOAD & 50 KB COMPRESSION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-400" />
                    <span>Bill / Receipt Image <strong className="text-rose-400">* (MANDATORY)</strong></span>
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono">
                    Auto-Compressed ≤ 50 KB
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Trigger / Compressed Preview Box */}
                {!billImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-2 cursor-pointer group ${
                      formError && !billImage
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : 'border-white/15 hover:border-orange-500/50 bg-slate-950/50 hover:bg-slate-950/80'
                    }`}
                  >
                    {isCompressing ? (
                      <div className="flex flex-col items-center gap-2 text-orange-400">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-bold">Compressing bill to ≤ 50 KB...</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white group-hover:text-orange-400 transition">
                            Tap to Take Photo or Upload Bill Receipt
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Camera / Gallery photo will automatically be compressed to ≤ 50 KB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail with Click to Enlarge */}
                      <div 
                        onClick={() => setViewingBillImage(billImage.dataUrl)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 bg-slate-800 cursor-pointer group shrink-0"
                        title="Click to view full image"
                      >
                        <img 
                          src={billImage.dataUrl} 
                          alt="Bill receipt" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Bill Attached Successfully</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                          <span className="text-emerald-400 font-bold">
                            {billImage.sizeKb} KB
                          </span>
                          <span>(from {billImage.originalSizeKb} KB original)</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                            ✓ ≤ 50 KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingBillImage(billImage.dataUrl)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        title="View Full Size"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={removeBillImage}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Remove and retake"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. CATEGORY & PAYMENT MODE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Expense Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-bold text-white outline-none focus:border-orange-500 transition cursor-pointer"
                  >
                    {POS_EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.icon} {cat.name} ({cat.group})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-bold text-white outline-none focus:border-orange-500 transition cursor-pointer"
                  >
                    <option value="CASH" className="bg-slate-900 text-white">💵 Cash (From Cash Drawer)</option>
                    <option value="UPI_ONLINE" className="bg-slate-900 text-white">📱 UPI / QR Code Transfer</option>
                    <option value="CARD" className="bg-slate-900 text-white">💳 Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              {/* 5. VENDOR / SHOP (OPTIONAL) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Vendor / Shop / Person Paid To (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sri Sai Bakery, Bharat Petroleum, Raju Kirana..."
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950/70 border border-white/10 focus:border-orange-500 text-xs font-medium text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing || !billImage}
                  className={`w-full py-3.5 rounded-2xl text-sm font-black transition flex items-center justify-center gap-2 shadow-lg select-none ${
                    !billImage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      : isPos2
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer active:scale-95'
                      : 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-orange-500/30 cursor-pointer active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Expense & Uploading Bill...</span>
                    </>
                  ) : !billImage ? (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Upload Bill Photo to Enable Save (Mandatory)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Expense {amount ? `(₹${amount})` : ''} to {posCode}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: TODAY'S EXPENSES LIST                                */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
                <span>Showing <strong>{todayExpenses.length}</strong> expenses recorded today at {posCode}</span>
                <span>Total: <strong className="text-rose-400 font-mono text-sm">{formatCurrency(todayTotalAmount)}</strong></span>
              </div>

              {todayExpenses.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-2 bg-slate-950/40 rounded-2xl border border-white/5">
                  <Receipt className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="font-bold text-slate-300">No expenses recorded today for {posCode}.</p>
                  <p className="text-[11px] text-slate-500">
                    Tap "Log New Expense" to record petty cash, tea, fuel, or emergency buys.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-white/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Bill Thumbnail */}
                        {exp.receiptAttachmentUrl ? (
                          <div
                            onClick={() => setViewingBillImage(exp.receiptAttachmentUrl)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-slate-800 cursor-pointer shrink-0 group"
                            title="Click to view full bill"
                          >
                            <img
                              src={exp.receiptAttachmentUrl}
                              alt="Receipt"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-lg shrink-0">
                            {exp.icon || '💸'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">
                              {exp.title}
                            </h4>
                            {exp.voiceRecorded && (
                              <span className="text-[10px] text-emerald-400" title="Recorded with voice microphone">
                                🎙️
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-mono text-slate-300">{exp.time || exp.date}</span>
                            <span>•</span>
                            <span className="text-slate-300">{exp.categoryName || 'General'}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/5 text-slate-400 text-[10px]">
                              {exp.paymentMode === 'CASH' ? '💵 Cash' : '📱 UPI'}
                            </span>
                            {exp.receiptSizeKb && (
                              <span className="text-emerald-400 font-mono text-[10px]">
                                ({exp.receiptSizeKb} KB bill)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Amount & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <span className="text-base font-black font-mono text-rose-400">
                          {formatCurrency(exp.amount)}
                        </span>

                        <div className="flex items-center gap-1">
                          {exp.receiptAttachmentUrl && (
                            <button
                              type="button"
                              onClick={() => setViewingBillImage(exp.receiptAttachmentUrl)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                              title="View Bill Image"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Synced in real-time with Admin Expenses Dashboard</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition"
          >
            Close
          </button>
        </div>

      </div>

      {/* ── ENLARGED BILL VIEWER MODAL ── */}
      {viewingBillImage && (
        <div 
          onClick={() => setViewingBillImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-950">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span>Uploaded Expense Bill Photo (Compressed ≤ 50 KB)</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingBillImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/40">
              <img
                src={viewingBillImage}
                alt="Enlarged Bill"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg border border-white/10"
              />
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-950 flex items-center justify-end gap-2">
              <a
                href={viewingBillImage}
                download="expense-bill.jpg"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                type="button"
                onClick={() => setViewingBillImage(null)}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-white/15 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Delete this Expense?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete expense <strong>"{expenseToDelete.title}"</strong> of{' '}
              <strong className="text-rose-400 font-mono">{formatCurrency(expenseToDelete.amount)}</strong>? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExpense(expenseToDelete.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shadow-lg shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PosExpensesModal;
