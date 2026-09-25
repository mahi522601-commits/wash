import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { terminalAuthService, DEFAULT_BILLING_TERMINALS } from '../../services/terminalAuthService';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';
import { 
  Store, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  RefreshCw,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const BillingHubPage = () => {
  const navigate = useNavigate();
  const [terminals, setTerminals] = useState(DEFAULT_BILLING_TERMINALS);
  const [loading, setLoading] = useState(true);

  const loadTerminals = async () => {
    try {
      const data = await terminalAuthService.getTerminals();
      setTerminals(data);
    } catch (e) {
      console.warn('Failed to load terminals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerminals();
  }, []);

  return (
    <>
      <SEOHead
        title="POS Billing Terminals & Counter Machines | Tech Wash"
        description="Official in-store POS billing terminals for Tech Wash stores in Manikonda, Tolichowki, and Ambience Courtyard."
        canonicalUrl={`${BASE_URL}/billing`}
      />

      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header Brand */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Store className="w-4 h-4 text-orange-400" />
              <span>In-Store POS & Billing Terminals</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight">
              Tech Wash Billing Machines
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Select your physical store counter terminal below. Sign in with your assigned counter password or administrator PIN to begin billing walk-in customers.
            </p>
          </div>

          {/* 3 Terminal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {terminals.map((terminal, idx) => {
              const session = terminalAuthService.getTerminalSession(terminal.id);
              const isLoggedIn = Boolean(session && session.terminalId);

              return (
                <div
                  key={terminal.id}
                  className="rounded-3xl bg-slate-900/90 border border-white/10 hover:border-orange-500/50 p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                >
                  {/* Top Status & Machine Number */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-300">
                        Machine #{idx + 1} • {terminal.code}
                      </span>
                      {isLoggedIn ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Logged In
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold">
                          <KeyRound className="w-3 h-3" />
                          PIN Protected
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                        {terminal.name}
                      </h2>
                      <div className="flex items-start gap-2 mt-2 text-xs text-slate-400">
                        <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{terminal.address}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Store Branch:</span>
                        <span className="font-semibold text-slate-200 truncate max-w-[180px]" title={terminal.locationName}>
                          {terminal.locationName.replace('Tech Wash ', '')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Assigned Cashier:</span>
                        <span className="font-semibold text-orange-300">{terminal.assignedOperator}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Counter URL:</span>
                        <span className="font-mono font-bold text-slate-400">/billing/{terminal.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Launch / Sign In CTA */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={async () => {
                        await terminalAuthService.quickUnlockTerminal(terminal.id);
                        navigate(`/billing/${terminal.id}`);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer group-hover:shadow-orange-500/40 active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-orange-200" />
                      <span>Launch POS Machine ({terminal.code})</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Default PIN: <strong className="text-emerald-400 font-mono">{terminal.password || 'techwash1'}</strong></span>
                      <Link
                        to={`/admin/orders?branch=${terminal.id}&channel=OFFLINE_POS`}
                        target="_blank"
                        className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1"
                      >
                        <span>Branch Orders</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Help & Admin Notice Banner */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Administrator Security & Password Management</h4>
                <p className="text-xs text-slate-400">
                  Passwords and PINs for all 3 counters are assigned and managed in the Admin Suite under Operations Staff.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/admin/staff"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10 flex items-center gap-1.5"
              >
                <span>Manage Passwords in Admin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BillingHubPage;
