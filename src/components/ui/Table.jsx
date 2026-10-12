import React from 'react';
import { AdvancedLogoLoader } from '../common/AdvancedLogoLoader';

export const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found',
  className = '',
  onRowClick = null,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center">
        <AdvancedLogoLoader size="sm" text="Loading records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200/80 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || idx} className={`py-3.5 px-4 sm:px-6 ${col.headerClassName || col.className || ''}`}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr 
                key={row[keyField] || row.id || rowIdx} 
                onClick={(e) => {
                  if (onRowClick) {
                    if (e.target.closest('button, a, input, select, textarea, [data-prevent-row-click]')) {
                      return;
                    }
                    onRowClick(row, rowIdx);
                  }
                }}
                className={`transition-colors ${
                  onRowClick 
                    ? 'cursor-pointer hover:bg-brand-50/40 active:bg-brand-100/50' 
                    : 'hover:bg-slate-50/70'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} className={`py-4 px-4 sm:px-6 align-middle ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
