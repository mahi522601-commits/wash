import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable Accessible Breadcrumb Component
 * Renders SEO-friendly visible breadcrumb links with proper DOM hierarchy
 */
export const BreadcrumbNav = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center text-xs sm:text-sm text-slate-500 font-medium py-2 overflow-x-auto whitespace-nowrap"
    >
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              )}
              {isLast ? (
                <span 
                  className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-xs" 
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path || '#'}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1 text-slate-600"
                >
                  {isFirst && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
