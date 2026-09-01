import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Menu, LogOut, ShieldCheck, User } from 'lucide-react';

export const AdminHeader = ({ onMenuToggle }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const roleLabel = (currentUser?.role || 'admin').replace('_', ' ').toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Live Business Operations</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.displayName || currentUser.email}
              </div>
              <div className="text-[10px] font-bold text-brand-600 tracking-wider">
                {roleLabel}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
