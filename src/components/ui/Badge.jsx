import React from 'react';

export const Badge = ({
  children,
  variant = 'brand', // 'brand' | 'royal' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'cyan'
  size = 'md', // 'sm' | 'md' | 'lg'
  dot = false,
  className = '',
}) => {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200/80',
    royal: 'bg-royal-50 text-royal-700 border-royal-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
  };

  const dotColors = {
    brand: 'bg-brand-500',
    royal: 'bg-royal-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-400',
    cyan: 'bg-cyan-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 rounded-xl gap-2 font-semibold',
  };

  return (
    <span className={`inline-flex items-center border ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />}
      {children}
    </span>
  );
};
