import React from 'react';
import { Button } from '../ui/Button';

export const AdminPageHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionVariant = 'primary',
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {children}
        {actionLabel && onAction && (
          <Button
            variant={actionVariant}
            size="md"
            icon={ActionIcon}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
