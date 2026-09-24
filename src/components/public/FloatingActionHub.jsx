import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { cmsService } from '../../services/cmsService';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { WhatsAppLogo, PhoneCallLogo } from '../ui/BrandIcons';
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
  Volume2, 
  QrCode,
  ArrowRight
} from 'lucide-react';
import { testOrderPlacedSound } from '../../utils/audioNotification';

export const FloatingActionHub = ({ onOpenAssistant }) => {
  const { settings } = useSettings();
  const { 
    isInstallable, 
    isInstalled, 
    installApp, 
    isIOS, 
    isAndroid, 
    isMobile,
    isDesktop 
  } = usePWAInstall();

  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : isAndroid ? 'android' : 'desktop');
  const [showAppTeaser, setShowAppTeaser] = useState(false);

  useEffect(() => {
    // Show brief teaser flyout on initial visit if not installed
    if (!isInstalled) {
      const timer = setTimeout(() => {
        setShowAppTeaser(true);
        setTimeout(() => setShowAppTeaser(false), 5000);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const whatsappNumber = settings?.general?.whatsappNumber || '+91 63048 45567';
  const whatsappMsg = settings?.general?.whatsappDefaultMessage || 'Hi Tech Wash, I would like to inquire about laundry & dry cleaning pickup!';
  const primaryPhone = settings?.general?.primaryPhone || '+91 63048 45567';

  const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');
  const cleanPhone = primaryPhone.replace(/[^0-9]/g, '');

  const handleAppInstallClick = async () => {
    if (isIOS) {
      setActiveTab('ios');
      setInstallModalOpen(true);
      return;
    }

    if (isAndroid || isDesktop) {
      const success = await installApp();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallModalOpen(false), 2000);
      } else {
        setActiveTab(isAndroid ? 'android' : 'desktop');
        setInstallModalOpen(true);
      }
    } else {
      setInstallModalOpen(true);
    }
  };

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://techwash.in';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(appOrigin)}&bgcolor=14122E&color=F97316&format=png`;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          RIGHT SIDE: NEATLY STACKED FLOATING ACTION CONTROLS
          Stack Order (Bottom to Top):
          1. AI Chatbot Trigger (Bottom)
          2. WhatsApp Button
          3. Phone Call Button
          4. Mobile App (.apk / iOS / PWA) Download Button (Top)
      ───────────────────────────────────────────────────────── */}
      <div className="fixed right-3 sm:right-6 bottom-20 sm:bottom-24 md:bottom-8 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto no-print">
        
        {/* 1. APP DOWNLOAD / .APK / PWA FLOATING BUTTON (Top of Stack) */}
        {!isInstalled && (
          <div className="relative flex items-center">
            
            {/* Animated Teaser Pill on load / hover */}
            {showAppTeaser && (
              <div
                onClick={handleAppInstallClick}
                className="mr-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#0E0C22] to-[#1E1238] border border-orange-500/60 shadow-[0_8px_25px_rgba(249,115,22,0.35)] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer animate-fade-in hover:scale-105 transition-transform"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-orange-300">
                  {isIOS ? '📱 Get iOS App' : isAndroid ? '⚡ Download .APK' : '💻 Install App'}
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-orange-500/30 text-[9px] font-black text-orange-400 border border-orange-500/40">
                  FREE
                </span>
              </div>
            )}

            {/* Main Floating App Install Button */}
            <button
              type="button"
              onClick={handleAppInstallClick}
              className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#EA580C] via-[#F97316] to-[#FB923C] text-slate-950 shadow-[0_10px_30px_rgba(249,115,22,0.45)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.65)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-white"
              title={isIOS ? 'Install Tech Wash on iPhone' : isAndroid ? 'Download Tech Wash App (.apk)' : 'Install Tech Wash Desktop App'}
              aria-label="Download Tech Wash Mobile App"
            >
              {/* Subtle Pulsing Beacon Ring */}
              <span className="absolute -inset-1 rounded-full bg-orange-400/40 animate-pulse pointer-events-none" />

              {/* Floating Badge (APK / APP) */}
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#0E0C22] text-[#00F0FF] text-[8px] font-black border border-cyan-400 shadow-sm leading-tight uppercase tracking-wider z-20">
                {isIOS ? 'iOS' : 'APK'}
              </span>

              {/* Icon with Download bounce on hover */}
              <div className="relative z-10 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] text-slate-950 group-hover:translate-y-0.5 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* 2. DIRECT CALL BUTTON (Phone Dialer Green) */}
        <a
          href={`tel:${cleanPhone}`}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-luxury flex items-center justify-center hover:scale-110 transition-all duration-300 group border-2 border-white/80"
          title={`Call ${primaryPhone}`}
          aria-label="Call concierge"
        >
          <PhoneCallLogo className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white group-hover:rotate-12 transition-transform" />
        </a>

        {/* 3. WHATSAPP BUTTON WITH GLOW RING (Official WhatsApp Green) */}
        <a
          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(whatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-luxury hover:scale-110 transition-all duration-300 flex items-center justify-center group border-2 border-white/80"
          title="Chat on WhatsApp Concierge"
          aria-label="Chat on WhatsApp"
        >
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
          <WhatsAppLogo className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white relative z-10" />
        </a>

        {/* 4. AI CHATBOT TRIGGER BUTTON (Bottom of Stack) */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-[#1F2937] text-white border-2 border-[#F97316] shadow-[0_10px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_15px_35px_rgba(249,115,22,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          title="Open Tech Wash AI Concierge"
          aria-label="Open Tech Wash AI Concierge"
        >
          {/* Subtle Ambient Glow Ring */}
          <span className="absolute -inset-0.5 rounded-full bg-orange-400/30 animate-pulse pointer-events-none" />
          
          <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Active Status Dot */}
          <span className="absolute top-1 right-1 w-3 h-3 bg-[#F97316] border-2 border-white rounded-full shadow-sm z-20" />
        </button>

      </div>

      {/* ─────────────────────────────────────────────────────────
          FULL HIGH-TECH APP INSTALL MODAL
      ───────────────────────────────────────────────────────── */}
      {installModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#14122E] border border-orange-500/40 rounded-[32px] sm:rounded-[36px] max-w-lg w-full p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden space-y-5 animate-scale-up">
            
            {/* Ambient Lighting Background */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-xl flex items-center justify-center border-2 border-orange-400 overflow-hidden shrink-0">
                  <img src="/techwashlogo.webp" alt="Tech Wash App Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                      Official Mobile App
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Verified Safe</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                    Tech Wash Mobile App
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
                className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Device Platform Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'android'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android (.apk)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ios'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>Apple iOS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'desktop'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Desktop / QR</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-2 relative z-10 text-xs">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-orange-400 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>1-Tap Booking</span>
                </div>
                <p className="text-[10px] text-slate-400">Save addresses & schedule pickups in 10s.</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Live GPS Tracking</span>
                </div>
                <p className="text-[10px] text-slate-400">Turn-by-turn rider arrival map.</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Sound Chime Alerts</span>
                </div>
                <p className="text-[10px] text-slate-400">Crisp audio alerts when clothes are ready.</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0 Storage Size</span>
                </div>
                <p className="text-[10px] text-slate-400">No phone memory taken, auto-updates.</p>
              </div>
            </div>

            {/* Platform Specific Action Pane */}
            <div className="relative z-10">
              
              {/* ANDROID TAB */}
              {activeTab === 'android' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await installApp();
                      if (ok) {
                        setInstallSuccess(true);
                        setTimeout(() => setInstallModalOpen(false), 2000);
                      }
                    }}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 transition-all active:scale-[0.98]"
                  >
                    {installSuccess ? (
                      <>
                        <Check className="w-5 h-5 text-slate-950" />
                        <span>Installed Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 stroke-[2.5]" />
                        <span>Install Android App (.apk / PWA)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    Installs directly to your home screen launcher with offline support.
                  </p>
                </div>
              )}

              {/* IOS APPLE TAB */}
              {activeTab === 'ios' && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 space-y-2.5 text-xs text-slate-200">
                  <div className="text-[11px] font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                    <span>How to Install on iPhone & iPad:</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <div className="w-7 h-7 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <strong>Step 1:</strong> Tap <strong>Share</strong> icon in Safari bottom bar.
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <div className="w-7 h-7 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong>Step 2:</strong> Tap <strong>"Add to Home Screen"</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DESKTOP & QR CODE SCAN TAB */}
              {activeTab === 'desktop' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0E0C22] p-1.5 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-md">
                      <img 
                        src={qrCodeUrl} 
                        alt="Scan QR for App" 
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="text-xs space-y-1.5 text-center sm:text-left">
                      <div className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <QrCode className="w-4 h-4 text-orange-400" />
                        <span>Scan with Mobile Camera</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Scan this QR code with your Android or iPhone camera to open and 1-tap install on your phone.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await installApp();
                      if (ok) {
                        setInstallSuccess(true);
                        setTimeout(() => setInstallModalOpen(false), 2000);
                      }
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Install Desktop Standalone App</span>
                  </button>
                </div>
              )}

            </div>

            {/* Audio Chime Preview & Footer Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <button
                type="button"
                onClick={testOrderPlacedSound}
                className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
                title="Test /1.mp4 notification sound"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Audio Chime</span>
              </button>

              <button
                type="button"
                onClick={() => setInstallModalOpen(false)}
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

