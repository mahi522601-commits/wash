import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'luxury'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-gradient-to-r from-brand-600 to-royal-700 hover:from-brand-500 hover:to-royal-600 text-white shadow-lg shadow-brand-500/25 focus:ring-brand-500 border border-transparent',
    luxury: 'bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white shadow-luxury hover:shadow-luxury-hover border border-slate-700/50 focus:ring-slate-900',
    secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 focus:ring-brand-500',
    outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 focus:ring-brand-500',
    ghost: 'bg-transparent hover:bg-slate-100/80 text-slate-700 focus:ring-brand-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold',
    xl: 'text-lg px-8 py-4 rounded-2xl gap-3 font-semibold shadow-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{typeof children === 'string' ? 'Processing...' : children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};
