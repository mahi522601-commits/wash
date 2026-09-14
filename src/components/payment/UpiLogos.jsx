import React from 'react';

/**
 * High-quality vector SVG Indian Payment App Logos
 * Google Pay, PhonePe, Paytm, BHIM UPI, Amazon Pay, Unified Payments Interface (UPI)
 */

export const UpiIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 8L28 20L12 32L12 8Z" fill="#097939" />
    <path d="M22 8L38 20L22 32L22 8Z" fill="#ED7524" />
    <text x="44" y="27" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" fill="#1F2937">UPI</text>
  </svg>
);

export const GooglePayLogo = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs ${className}`}>
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
    <span className="text-[11px] font-bold text-slate-800 tracking-tight">GPay</span>
  </div>
);

export const PhonePeLogo = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 bg-[#5f259f] px-2.5 py-1 rounded-lg text-white shadow-xs ${className}`}>
    <span className="font-extrabold text-[12px] bg-white text-[#5f259f] w-4 h-4 rounded-full flex items-center justify-center leading-none">पे</span>
    <span className="text-[11px] font-bold tracking-tight">PhonePe</span>
  </div>
);

export const PaytmLogo = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-1 bg-[#002e6e] px-2.5 py-1 rounded-lg text-white shadow-xs ${className}`}>
    <span className="text-[11px] font-black tracking-tight text-white">pay</span>
    <span className="text-[11px] font-black tracking-tight text-[#00baf2]">tm</span>
  </div>
);

export const BhimLogo = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-[#008744] to-[#00572e] px-2.5 py-1 rounded-lg text-white shadow-xs ${className}`}>
    <span className="text-[11px] font-black tracking-wider text-[#FFA500]">BHIM</span>
    <span className="text-[10px] font-bold text-white">UPI</span>
  </div>
);

export const AmazonPayLogo = ({ className = "" }) => (
  <div className={`inline-flex items-center gap-1 bg-[#232f3e] px-2.5 py-1 rounded-lg text-white shadow-xs ${className}`}>
    <span className="text-[11px] font-bold text-white">amazon</span>
    <span className="text-[11px] font-bold text-[#ff9900]">pay</span>
  </div>
);

export const UpiAppLogosRow = ({ className = "" }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <GooglePayLogo />
    <PhonePeLogo />
    <PaytmLogo />
    <BhimLogo />
    <AmazonPayLogo />
  </div>
);
