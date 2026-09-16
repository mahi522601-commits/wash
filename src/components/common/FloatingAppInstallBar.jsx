import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Bell, 
  Compass,
  ArrowRight,
  QrCode
} from 'lucide-react';

export const FloatingAppInstallBar = () => {
  const { 
    isInstallable, 
    isInstalled, 
    installApp, 
    isIOS, 
    isAndroid, 
    isMobile,
    isDesktop 
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed today
    const lastDismissed = localStorage.getItem('techwash_app_install_dismissed');
    if (lastDismissed) {
      const hoursAgo = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
      if (hoursAgo < 24) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('techwash_app_install_dismissed', String(Date.now()));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setModalOpen(true);
      return;
    }

    if (isAndroid || isDesktop) {
      const success = await installApp();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setModalOpen(false), 2000);
      } else {
        // If native prompt not directly available, open visual guide modal
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  // If already running inside standalone installed app, don't show prompt
  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* FLOATING MOBILE & DESKTOP APP INSTALL PILL */}
      <aside 
        role="region"
        aria-label="App Installation Bar"
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg animate-bounce-short pointer-events-auto"
      >
        <div 
          onClick={handleInstallClick}
          className="cursor-pointer bg-gradient-to-r from-[#0E0C22] via-[#161333] to-[#1E1238] border border-orange-500/40 hover:border-orange-400 p-2.5 sm:p-3.5 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_25px_rgba(249,115,22,0.25)] flex items-center justify-between gap-3 text-white backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group"
        >
          
          {/* App Logo with Live Glow Badge */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-0.5 shadow-md overflow-hidden flex items-center justify-center border border-orange-400/40">
              <img 
                src="/techwashlogo.webp" 
                alt="Tech Wash App Icon" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-[#0E0C22]" />
            </span>
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                {isIOS ? 'iOS Web App' : isAndroid ? 'Android App (.apk)' : 'Desktop App'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                <span>Fast 1-Tap</span>
              </span>
            </div>

            <div className="text-xs sm:text-sm font-black font-display text-white truncate mt-0.5">
              {isIOS ? 'Install Tech Wash on iPhone' : isAndroid ? 'Download Tech Wash App (.apk)' : 'Install Tech Wash Desktop App'}
            </div>
            
            <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
              Doorstep pickup, live GPS rider tracking & offline alerts.
            </div>
          </div>

          {/* Action Button & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleInstallClick();
              }}
              className="py-2 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-950/40 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* FULL INTERACTIVE APP INSTALL MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#14122E] border border-orange-500/30 rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden space-y-6 animate-scale-up">
            
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-3xl bg-white p-1 shadow-xl flex items-center justify-center border-2 border-orange-400 overflow-hidden">
                  <img src="/techwashlogo.webp" alt="App Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                      Official Web App
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Verified Safe</span>
                  </div>
                  <h3 className="text-xl font-black font-display text-white mt-1">
                    Tech Wash Mobile App
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* App Features List */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>1-Tap Booking</span>
                </div>
                <p className="text-[11px] text-slate-400">Save addresses & schedule pickups in 10 seconds.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Live GPS Tracking</span>
                </div>
                <p className="text-[11px] text-slate-400">Turn-by-turn rider arrival & dispatch map.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Sound Chime Alerts</span>
                </div>
                <p className="text-[11px] text-slate-400">Instant sound notifications when ready.</p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0 Storage Footprint</span>
                </div>
                <p className="text-[11px] text-slate-400">Ultra lightweight & always up to date.</p>
              </div>
            </div>

            {/* Platform Instructions */}
            <div className="relative z-10">
              {isIOS ? (
                /* iOS Safari Step-by-Step Guide */
                <div className="p-4 rounded-3xl bg-white/5 border border-white/15 space-y-3">
                  <div className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <span>How to install on iPhone & iPad:</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-200">
                    <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5">
                      <div className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <strong>Step 1:</strong> Tap the <strong>Share</strong> button at the bottom of Safari browser.
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/5">
                      <div className="w-7 h-7 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong>Step 2:</strong> Scroll down and tap <strong>"Add to Home Screen"</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Desktop Direct Install Button */
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await installApp();
                      if (ok) {
                        setInstallSuccess(true);
                        setTimeout(() => setModalOpen(false), 2000);
                      }
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 transition-all active:scale-[0.98]"
                  >
                    {installSuccess ? (
                      <>
                        <Check className="w-5 h-5 text-slate-950" />
                        <span>Installed Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Install Tech Wash App (.apk / PWA)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    Installs directly to your phone launcher without taking storage space.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span>Next-Gen Garment Care</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
