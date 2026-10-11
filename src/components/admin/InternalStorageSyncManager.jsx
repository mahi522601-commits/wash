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
  FolderPlus,
  Download,
  FolderCheck,
  Check,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';

const STORAGE_PROMPTED_KEY = 'techwash_storage_permission_prompted_v3';

export const InternalStorageSyncManager = () => {
  const { success, info, error: toastError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectingFolder, setIsConnectingFolder] = useState(false);
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
    physicalConnected: false,
    fileSystemSupported: false,
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
      
      // If never prompted on this PC, or if local IndexedDB has 0 orders, show permission modal automatically
      if (!hasPrompted || (currentStats && currentStats.orderCount === 0)) {
        try {
          await localDbService.requestPersistentStorage();
        } catch (e) {}

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

    // Event listener for physical directory connected
    const handleDirConnected = () => {
      loadStats();
    };

    window.addEventListener('techwash-open-storage-manager', handleOpenTrigger);
    window.addEventListener('techwash-internal-storage-synced', handleSyncCompleted);
    window.addEventListener('techwash-directory-connected', handleDirConnected);

    return () => {
      isMounted = false;
      window.removeEventListener('techwash-open-storage-manager', handleOpenTrigger);
      window.removeEventListener('techwash-internal-storage-synced', handleSyncCompleted);
      window.removeEventListener('techwash-directory-connected', handleDirConnected);
    };
  }, []);

  // 1. Browser Native Folder Picker: Connects & Auto-Creates C:\TechWash & Data Files
  const handleConnectDirectory = async () => {
    setIsConnectingFolder(true);
    try {
      const res = await localDbService.setupPhysicalDirectory();
      if (res.ok) {
        success(
          'Physical Storage Activated',
          `Created and verified C:\\TechWash folders on this PC with ${res.orderCount || 0} Orders & Customers!`
        );
        await loadStats();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_PROMPTED_KEY, 'true');
        }
        // Run sync to ensure latest cloud records are mirrored to disk
        localDbService.syncAllCloudDataToLocalDb().catch(() => {});
        setTimeout(() => setModalOpen(false), 1500);
      } else if (!res.aborted) {
        toastError('Storage Notice', res.error || 'Could not connect physical directory.');
      }
    } catch (e) {
      toastError('Folder Error', e.message);
    } finally {
      setIsConnectingFolder(false);
    }
  };

  // 2. 1-Click Windows Batch Script Generator (.bat)
  const handleDownloadWindowsScript = () => {
    try {
      localDbService.downloadWindowsFolderSetupScript();
      info(
        'Script Downloaded',
        'Double-click Create-TechWash-Folders.bat to auto-create all C:\\TechWash folders on this PC in 1 second!'
      );
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_PROMPTED_KEY, 'true');
      }
      // Also sync cloud data into IndexedDB
      handleGrantPermissionAndSync();
    } catch (e) {
      toastError('Download Error', e.message);
    }
  };

  // 3. Export all data as JSON
  const handleExportBackup = async () => {
    try {
      await localDbService.exportAllDataAsJson();
      success('Data Exported', 'All orders, customers, and payments exported to JSON file.');
    } catch (e) {
      toastError('Export Error', e.message);
    }
  };

  // 4. Hydrate Browser IndexedDB
  const handleGrantPermissionAndSync = async () => {
    setIsSyncing(true);
    setSyncStep('Requesting browser persistent storage permission...');

    try {
      await localDbService.requestPersistentStorage();
      setSyncStep('Downloading all cloud records into internal storage...');
      const res = await localDbService.syncAllCloudDataToLocalDb((step) => {
        setSyncStep(step);
      });

      const updatedStats = await loadStats();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_PROMPTED_KEY, 'true');
      }

      success(
        'Internal Storage Synced',
        `Saved to internal storage (TechWashPOS): ${updatedStats.orderCount} Orders, ${updatedStats.customerCount} Customers, and ${updatedStats.paymentCount} Payments!`
      );

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-[#121124] border border-orange-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-white relative space-y-6 overflow-hidden">
            
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
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tech Wash stores all business data locally on this computer in <strong className="text-orange-400 font-mono">C:\TechWash</strong> and browser IndexedDB (<strong className="text-white">TechWashPOS</strong>). Choose how you would like to initialize storage on this PC:
                </p>
              </div>
            </div>

            {/* Target Storage Paths Information Card */}
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
                  <span className="text-white font-bold">TechWashPOS (IndexedDB)</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Admin Orders Root</span>
                  <span className="text-purple-400 font-bold">C:\TechWash\Admin\</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Terminal POS Root</span>
                  <span className="text-white font-bold">C:\TechWash\POS-01\</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">Sales &amp; Orders</span>
                  <span className="text-emerald-400 font-bold">..\Data\orders.json</span>
                </div>
              </div>
            </div>

            {/* Sync Progress Status (If in progress) */}
            {isSyncing && (
              <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-orange-400" />
                <span className="font-medium">{syncStep || 'Synchronizing all records to internal storage...'}</span>
              </div>
            )}

            {/* Choose Activation Method Cards */}
            <div className="space-y-3 pt-1">
              
              {/* Option A: Direct Browser Folder Connect & Auto-Create */}
              {stats.fileSystemSupported && (
                <button
                  type="button"
                  onClick={handleConnectDirectory}
                  disabled={isConnectingFolder || isSyncing}
                  className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 hover:from-orange-500/30 hover:to-amber-500/20 border border-orange-500/40 hover:border-orange-500 transition-all flex items-center justify-between group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30">
                      {isConnectingFolder ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FolderPlus className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Select C:\ Folder in Browser</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Recommended</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Pick C:\ or TechWash. Web app will automatically create all subfolders &amp; write data files.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              )}

              {/* Option B: 1-Click Windows Setup Script (.bat) */}
              <button
                type="button"
                onClick={handleDownloadWindowsScript}
                disabled={isSyncing}
                className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      1-Click Windows Auto-Setup (<span className="font-mono text-purple-300 text-xs">Create-TechWash-Folders.bat</span>)
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Downloads a Windows script that creates <strong className="text-slate-300">C:\TechWash</strong> and all terminal folders in 1 second.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              {/* Option C: Browser Internal Database (IndexedDB) */}
              <button
                type="button"
                onClick={handleGrantPermissionAndSync}
                disabled={isSyncing}
                className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Save All Data into Browser Database (TechWashPOS IndexedDB)
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Stores all orders, customers, and payments securely inside this browser. Works 100% offline.
                    </p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                type="button"
                onClick={handleSkip}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Skip / Continue in Background
              </button>
              <span className="text-[11px] text-slate-400">
                You can change storage settings anytime from the top bar.
              </span>
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

            {/* Physical Storage Connection Status */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Physical Folder Status (C:\TechWash)</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] flex items-center gap-1 ${
                  stats.physicalConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {stats.physicalConnected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{stats.physicalConnected ? 'Folder Connected' : 'Not Connected'}</span>
                </span>
              </div>

              {stats.fileSystemSupported && (
                <button
                  type="button"
                  onClick={handleConnectDirectory}
                  disabled={isConnectingFolder}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{stats.physicalConnected ? 'Change / Reconnect C:\\ Folder' : 'Connect C:\\TechWash Folder via Browser'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadWindowsScript}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>1-Click Auto-Create Folders (.bat)</span>
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
                  <span className="text-slate-400">Admin Portal (Orders &amp; CRM):</span>
                  <span className="text-purple-400 font-bold">C:\TechWash\Admin\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Main Manikonda (POS-01):</span>
                  <span className="text-emerald-400 font-bold">C:\TechWash\POS-01\</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Orders File:</span>
                  <span className="text-emerald-300 font-bold">..\Data\orders.json</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Customers File:</span>
                  <span className="text-cyan-300 font-bold">..\Data\customers.json</span>
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
                <span className="text-slate-400">Browser Persistent Storage</span>
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
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download All Data Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="w-full py-2 px-4 rounded-2xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
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
