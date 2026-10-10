import React, { useState, useEffect } from 'react';
import { localDbService } from '../../services/localDbService';
import { useToast } from '../../context/ToastContext';
import { 
  HardDrive, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Database, 
  Zap, 
  X, 
  AlertCircle,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';

const STORAGE_PROMPTED_KEY = 'techwash_storage_permission_prompted_v2';

export const InternalStorageSyncManager = () => {
  const { success, info, error: toastError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [stats, setStats] = useState({
    isPersisted: false,
    usage: 0,
    quota: 0,
    orderCount: 0,
    customerCount: 0,
    paymentCount: 0,
    dueCount: 0,
    settingsCount: 0,
  });

  const loadStats = async () => {
    try {
      const currentStats = await localDbService.getStorageStats();
      setStats(currentStats);
      return currentStats;
    } catch (e) {
      console.warn('Failed to load storage stats:', e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkAndPromptStorage = async () => {
      const currentStats = await loadStats();
      if (!isMounted) return;

      const hasPrompted = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_PROMPTED_KEY) : null;
      
      // If never prompted, or if local IndexedDB has 0 orders, show permission prompt automatically
      if (!hasPrompted || (currentStats && currentStats.orderCount === 0)) {
        // Automatically ask for browser persistent storage
        try {
          await localDbService.requestPersistentStorage();
        } catch (e) {}

        // Open permission modal to confirm data hydration
        setModalOpen(true);
      } else {
        // Automatically run background refresh to keep IndexedDB up-to-date
        localDbService.syncAllCloudDataToLocalDb().catch(() => {});
      }
    };

    checkAndPromptStorage();

    // Event listener for manual open trigger from Header
    const handleOpenTrigger = () => {
      loadStats();
      setIsInspectorOpen(true);
    };

    // Event listener for sync completed
    const handleSyncCompleted = (e) => {
      if (e.detail) {
        setStats(prev => ({ ...prev, ...e.detail }));
      } else {
        loadStats();
      }
    };

    window.addEventListener('techwash-open-storage-manager', handleOpenTrigger);
    window.addEventListener('techwash-internal-storage-synced', handleSyncCompleted);

    return () => {
      isMounted = false;
      window.removeEventListener('techwash-open-storage-manager', handleOpenTrigger);
      window.removeEventListener('techwash-internal-storage-synced', handleSyncCompleted);
    };
  }, []);

  const handleGrantPermissionAndSync = async () => {
    setIsSyncing(true);
    setSyncStep('Requesting browser persistent storage permission...');

    try {
      // 1. Request persistent storage permission
      const persistResult = await localDbService.requestPersistentStorage();

      // 2. Run master synchronization
      setSyncStep('Downloading all cloud records into internal storage...');
      const res = await localDbService.syncAllCloudDataToLocalDb((step) => {
        setSyncStep(step);
      });

      const updatedStats = await loadStats();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_PROMPTED_KEY, 'true');
      }

      success(
        'Internal Storage Activated',
        `Saved to C:\\TechWash (TechWashPOS): ${updatedStats.orderCount} Orders, ${updatedStats.customerCount} Customers, and ${updatedStats.paymentCount} Payments!`
      );

      // Close modal after brief delay
      setTimeout(() => {
        setModalOpen(false);
        setIsSyncing(false);
        setSyncStep('');
      }, 1200);
    } catch (err) {
      console.error('Storage sync error:', err);
      toastError('Storage Sync Notice', err.message || 'Could not complete internal storage synchronization.');
      setIsSyncing(false);
      setSyncStep('');
    }
  };

  const handleSkip = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PROMPTED_KEY, 'true');
    }
    setModalOpen(false);
    // Still trigger background sync silently
    localDbService.syncAllCloudDataToLocalDb().catch(() => {});
  };

  const handleManualReSync = async () => {
    setIsSyncing(true);
    setSyncStep('Refreshing all internal storage tables...');
    try {
      await localDbService.syncAllCloudDataToLocalDb((msg) => setSyncStep(msg));
      const s = await loadStats();
      success('Storage Refreshed', `Internal storage now contains ${s.orderCount} Orders and ${s.customerCount} Customers.`);
    } catch (e) {
      toastError('Sync Failed', e.message);
    } finally {
      setIsSyncing(false);
      setSyncStep('');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <>
      {/* 1. AUTOMATIC PERMISSION & INITIAL HYDRATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-[#121124] border border-orange-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white relative space-y-6 overflow-hidden">
            
            {/* Background Atmosphere */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                <HardDrive className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider">
                  <span>Device Master Storage</span>
                  <span>•</span>
                  <span>C:\TechWash</span>
                </div>
                <h3 className="text-xl font-black font-display text-white tracking-tight">
                  Activate Internal Master Storage (C:\TechWash)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tech Wash Command Center requires internal storage permission on this device to store all business records locally in <strong className="text-orange-400 font-mono">C:\TechWash</strong> and browser IndexedDB (<strong className="text-slate-200">TechWashPOS</strong>) for instant offline POS &amp; reporting.
                </p>
              </div>
            </div>

            {/* Storage Path Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-orange-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Local Storage Target:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30">
                  C:\TechWash\
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Database Engine</span>
                  <span className="text-white font-bold">TechWashPOS</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Terminal Root</span>
                  <span className="text-white font-bold">C:\TechWash\POS-XX</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">PDF Invoices</span>
                  <span className="text-white font-bold">..\Invoices\YYYY-MM-DD\</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Daily Excel</span>
                  <span className="text-white font-bold">..\Exports\YYYY-MM-DD.xlsx</span>
                </div>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="grid grid-cols-1 gap-2.5 bg-white/5 rounded-2xl p-4 border border-white/10 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Instant Offline Billing:</strong> POS and reporting work without cloud delays.</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>Persistent Storage:</strong> Browser is instructed never to delete your POS data.</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <RefreshCw className="w-4 h-4 text-orange-400 shrink-0" />
                <span><strong>Two-Way Sync:</strong> Local records mirror securely to cloud in the background.</span>
              </div>
            </div>

            {/* Sync Progress Status (If in progress) */}
            {isSyncing && (
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-orange-400" />
                <span className="font-medium">{syncStep || 'Synchronizing all records to internal storage...'}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGrantPermissionAndSync}
                disabled={isSyncing}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Adding All Data...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Grant Permission & Add All Data</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={isSyncing}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Auto-Sync in Background
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. STORAGE INSPECTOR & TELEMETRY DRAWER */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#121124] border-l border-white/10 w-full max-w-md h-full shadow-2xl text-white p-6 flex flex-col space-y-6 overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Internal Storage Telemetry</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Location: C:\TechWash • TechWashPOS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Destination & Folder Structure */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  Local File &amp; DB Storage Paths
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono text-[10px] font-bold border border-orange-500/30">
                  C:\TechWash
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Physical Root:</span>
                  <span className="text-white font-bold">C:\TechWash\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Main Manikonda (POS-01):</span>
                  <span className="text-emerald-400 font-bold">C:\TechWash\POS-01\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Tolichowki (POS-02):</span>
                  <span className="text-amber-400 font-bold">C:\TechWash\POS-02\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Ambience Kiosk (POS-03):</span>
                  <span className="text-purple-400 font-bold">C:\TechWash\POS-03\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Browser DB Engine:</span>
                  <span className="text-cyan-400 font-bold">IndexedDB: TechWashPOS</span>
                </div>
              </div>
            </div>

            {/* Storage Quota & Status Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Persistent Storage Status</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  stats.isPersisted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {stats.isPersisted ? 'Active / Persisted' : 'Default Quota'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Disk Quota Usage</span>
                <span className="font-mono text-slate-200">{formatBytes(stats.usage)} / {formatBytes(stats.quota)}</span>
              </div>
            </div>

            {/* Table Record Counts */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Internal Storage Tables
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-slate-400 text-[10px] uppercase">Orders & Bills</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{stats.orderCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-slate-400 text-[10px] uppercase">Customer Records</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{stats.customerCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-slate-400 text-[10px] uppercase">Payments Recorded</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{stats.paymentCount}</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-slate-400 text-[10px] uppercase">Pending Dues</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{stats.dueCount}</div>
                </div>
              </div>
            </div>

            {/* Sync Status Banner */}
            {isSyncing && (
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-orange-400" />
                <span>{syncStep || 'Re-synchronizing all records...'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 mt-auto space-y-2">
              <button
                type="button"
                onClick={handleManualReSync}
                disabled={isSyncing}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Re-Sync All Cloud Data Now</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default InternalStorageSyncManager;
