import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'default', // 'default' | 'glass' | 'luxury' | 'flat'
  hover = true,
  onClick,
  ...props
}) => {
  const base = 'rounded-2xl transition-all duration-300 relative';
  
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-sm',
    glass: 'glass-card shadow-glass',
    luxury: 'bg-white border border-slate-200/70 shadow-luxury',
    flat: 'bg-slate-50/80 border border-slate-200',
  };

  const hoverClass = hover ? 'hover:shadow-luxury-hover hover:-translate-y-0.5' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`${base} ${variants[variant]} ${hoverClass} ${cursorClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-5 sm:p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);
