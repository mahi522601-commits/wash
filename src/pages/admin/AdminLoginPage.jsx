import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { auditService } from '../../services/auditService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, Lock, Mail, ShieldCheck } from 'lucide-react';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('admin@techwash.in');
  const [password, setPassword] = useState('TechWash@2026');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      await auditService.logAction({
        action: 'LOGIN',
        entity: 'AdminUsers',
        entityName: user.email,
        user,
      });
      success('Welcome Back', `Logged in as ${user.displayName || user.email}`);
      navigate('/admin/dashboard');
    } catch (err) {
      error('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-royal-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/25 mb-4">
            <Sparkles className="w-6 h-6 text-cyan-200" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            TECH WASH
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mt-1">
            Admin SaaS Management Suite
          </p>
        </div>

        {/* Login Card */}
        <Card variant="luxury" className="p-8 bg-slate-900 border border-slate-800 shadow-2xl text-white">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                label="Admin Email"
                type="email"
                required
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-cyan-400"
              />
            </div>

            <div>
              <Input
                label="Security Password"
                type="password"
                required
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-cyan-400"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Command Center
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Access Control Protected</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Default Dev Access: <span className="font-mono text-cyan-400">admin@techwash.in / TechWash@2026</span>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};
