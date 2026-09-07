import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { auditService } from '../../services/auditService';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  Loader2
} from 'lucide-react';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your admin email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      
      // Log audit trail for secure access
      try {
        await auditService.logAction({
          action: 'LOGIN',
          entity: 'AdminUsers',
          entityName: user.email,
          user,
        });
      } catch (e) {
        // Non-blocking audit log
      }

      success('Welcome Back', `Authenticated as ${user.displayName || user.email}`);
      navigate('/admin/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Incorrect email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F2937] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans antialiased">
      
      {/* 1. ATMOSPHERIC BACKGROUND GLOWS */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#F97316]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FED7AA]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* 2. BRAND COMMAND HEADER */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center p-1 mx-auto shadow-xl shadow-black/40 mb-3 group hover:scale-105 transition-transform duration-300 border border-[#F97316]/40 overflow-hidden">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight leading-none">
            TECH <span className="text-[#F97316]">WASH</span>
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
            <span>COMMAND CENTER</span>
            <span>•</span>
            <span className="text-[#F97316]">ADMIN PORTAL</span>
          </div>
        </div>

        {/* 3. HIGH-CONTRAST LUXURY LOGIN CARD */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-brand-200 text-slate-900">
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#1F2937] font-display">
              Administrator Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access business operations and command telemetry.
            </p>
          </div>

          {/* Inline Error Alert Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-snug">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            
            {/* Field 1: Admin Email */}
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-email" 
                className="block text-xs sm:text-[13px] font-bold text-[#1F2937] uppercase tracking-wider"
              >
                Admin Email
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-[#F97316]" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@techwash.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-[#FFF7ED] border border-slate-200 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 text-sm sm:text-base font-medium text-[#171717] placeholder-slate-400 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Field 2: Security Password with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="admin-password" 
                  className="block text-xs sm:text-[13px] font-bold text-[#1F2937] uppercase tracking-wider"
                >
                  Security Password
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-[#F97316]" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-[#FFF7ED] border border-slate-200 focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/10 text-sm sm:text-base font-medium text-[#171717] placeholder-slate-400 focus:outline-none transition-all shadow-xs"
                />

                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#F97316] focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in to Command Center...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Command Center</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Secure Environment Guarantee */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Role-Based Access Control & 256-Bit Encrypted Portal</span>
            </div>
          </div>

        </div>

        {/* Subtle Footer Link to Customer Website */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
          >
            ← Return to Tech Wash Customer Website
          </a>
        </div>

      </div>
    </div>
  );
};
