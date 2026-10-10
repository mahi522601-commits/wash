import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../../services/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { syncQueueService } from '../../services/syncQueueService';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Wifi, WifiOff, HardDrive } from 'lucide-react';

export const TerminalSyncHealthWidget = () => {
  const [healthMap, setHealthMap] = useState({
    'counter-1': {
      terminalId: 'counter-1',
      terminalCode: 'TW-POS-01',
      branchName: 'Main Branch — Manikonda',
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
    },
    'counter-2': {
      terminalId: 'counter-2',
      terminalCode: 'TW-POS-02',
      branchName: 'Branch 1 — Tolichowki',
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
    },
    'counter-3': {
      terminalId: 'counter-3',
      terminalCode: 'TW-POS-03',
      branchName: 'Pick Up Point — Ambience',
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [localQueueSummary, setLocalQueueSummary] = useState(syncQueueService.getQueueSummary());

  useEffect(() => {
    // 1. Subscribe to local queue changes
    const unsubLocal = syncQueueService.subscribe((summary) => {
      setLocalQueueSummary(summary);
    });

    // 2. Real-time Firestore snapshot for terminal sync health across POS-01, POS-02, POS-03
    let unsubFirestore = () => {};
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'terminal_sync_health');
        unsubFirestore = onSnapshot(docRef, (snap) => {
          if (snap.exists() && snap.data()?.terminals) {
            setHealthMap(prev => ({
              ...prev,
              ...snap.data().terminals,
            }));
          }
          setLoading(false);
        }, (err) => {
          console.warn('Firestore sync health listener notice:', err);
          setLoading(false);
        });
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      unsubLocal();
      unsubFirestore();
    };
  }, []);

  const handleManualTriggerSync = () => {
    syncQueueService.processQueue();
  };

  const terminals = [
    { id: 'counter-1', code: 'TW-POS-01', name: 'Main Branch — Manikonda (POS-01)' },
    { id: 'counter-2', code: 'TW-POS-02', name: 'Branch 1 — Tolichowki (POS-02)' },
    { id: 'counter-3', code: 'TW-POS-03', name: 'Pick Up Point — Ambience (POS-03)' },
  ];

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              BRANCH TERMINAL SYNCHRONIZATION HEALTH
            </h3>
            <p className="text-[11px] text-slate-500">
              Live status, offline queue, and sync health across physical branch POS terminals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {localQueueSummary.pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-300 animate-pulse">
              ⏳ {localQueueSummary.pendingCount} Pending Local Sync
            </span>
          )}

          <button
            type="button"
            onClick={handleManualTriggerSync}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Trigger immediate sync queue processing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${localQueueSummary.isSyncing ? 'animate-spin' : ''}`} />
            <span>{localQueueSummary.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {terminals.map(term => {
          const health = healthMap[term.id] || {
            status: 'ONLINE',
            pendingCount: 0,
            syncedCount: 0,
            failedCount: 0,
          };

          const isOnline = health.status === 'ONLINE' || health.status === 'SYNCING';
          const isSyncing = health.status === 'SYNCING' || localQueueSummary.isSyncing;
          const isError = health.status === 'ERROR' || health.failedCount > 0;

          const lastSyncFormatted = health.lastSync 
            ? `${new Date(health.lastSync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
            : 'Recent';

          return (
            <div key={term.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 truncate" title={term.name}>
                  {term.code} — {term.name.split('—')[1] || term.name}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border ${
                  isError 
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : (isSyncing 
                      ? 'bg-amber-50 text-amber-700 border-amber-300' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300')
                }`}>
                  {isError ? <AlertCircle className="w-3 h-3" /> : (isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />)}
                  <span>{isError ? 'ERROR' : (isSyncing ? 'SYNCING' : 'ONLINE')}</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono pt-1">
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[9px] text-slate-400 font-sans block">Synced</span>
                  <span className="font-bold text-emerald-700">{health.syncedCount || 0}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[9px] text-slate-400 font-sans block">Pending</span>
                  <span className={`font-bold ${health.pendingCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{health.pendingCount || 0}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-[9px] text-slate-400 font-sans block">Failed</span>
                  <span className={`font-bold ${health.failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{health.failedCount || 0}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>Last Sync: <strong className="text-slate-700">{lastSyncFormatted}</strong></span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 font-semibold" title={`Local Storage Directory: C:\\TechWash\\${term.code.replace('TW-', '')}\\`}>
                  <HardDrive className="w-3 h-3 text-orange-500" />
                  C:\TechWash\{term.code.replace('TW-', '')}\
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
