import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkerAuth } from '../../context/WorkerAuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { 
  Bike, 
  KeyRound, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const WorkerLoginPage = () => {
  const { login, isAuthenticated } = useWorkerAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to worker dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/worker', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Fields Required', 'Please enter your worker email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const worker = await login(email.trim(), password.trim());
      success('Welcome back!', `Logged in as ${worker.name}.`);
      navigate('/worker', { replace: true });
    } catch (err) {
      error('Login Failed', err.message || 'Invalid worker email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A091A] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#6D28D9] to-[#00F0FF] p-0.5 shadow-2xl shadow-purple-950/80 mb-2">
            <div className="w-full h-full bg-[#0E0C22] rounded-[22px] flex items-center justify-center">
              <Bike className="w-8 h-8 text-[#00F0FF]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black tracking-widest uppercase border border-purple-500/30">
              Fleet & Rider Portal
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-500/30">
              Live GPS Dispatch
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Tech Wash Field Operations
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Doorstep pickup management, turn-by-turn customer navigation & contactless delivery hub.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#14122E]/90 border border-purple-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Worker Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Worker Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@techwash.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Worker Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-slate-500">
                  Assigned by Admin
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter assigned password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#00F0FF] hover:from-[#5B21B6] hover:to-[#00D4E0] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Field Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Information Box */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                Worker accounts and credentials are created and managed by Administrators in the <Link to="/admin/staff" className="text-cyan-300 underline font-semibold hover:text-cyan-200">Admin Staff Portal</Link>.
              </div>
            </div>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <Link to="/admin/login" className="hover:text-purple-300 transition-colors">
            Admin Portal
          </Link>
          <span>•</span>
          <Link to="/" className="hover:text-cyan-300 transition-colors">
            Customer Site
          </Link>
        </div>

      </div>
    </div>
  );
};
