import React from 'react';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { ORDER_CUSTOMER_STAGES } from '../../../services/orderService';
import { 
  Package, 
  Truck, 
  MapPin, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export const OrderTrackingCard = ({ order }) => {
  if (!order) return null;

  const currentStageIdx = ORDER_CUSTOMER_STAGES.findIndex(
    (s) => s.key === order.customerStage
  );

  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-200 shadow-sm space-y-3.5 animate-fade-in text-xs">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA] text-[10px] font-bold">
              Active Progression
            </span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              #{order.orderNumber}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>

        <span className="text-xs font-black text-[#F97316] font-mono">
          {formatCurrency(order.totalAmount || order.priceSnapshot?.finalTotal)}
        </span>
      </div>

      {/* 6-Stage Milestone Compact Timeline */}
      <div className="space-y-2 py-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Custody Progression
        </span>

        <div className="space-y-1.5 pl-2 border-l-2 border-brand-200">
          {ORDER_CUSTOMER_STAGES.slice(0, 5).map((stage, idx) => {
            const isCompleted = currentStageIdx >= idx;
            const isCurrent = currentStageIdx === idx;

            return (
              <div key={stage.key} className="flex items-center gap-2 text-[11px]">
                <div
                  className={`w-3.5 h-3.5 rounded-full -ml-[13px] flex items-center justify-center text-[8px] font-bold ${
                    isCompleted
                      ? 'bg-[#F97316] text-white ring-2 ring-orange-100'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={
                    isCurrent
                      ? 'font-bold text-[#F97316]'
                      : isCompleted
                      ? 'font-semibold text-slate-800'
                      : 'text-slate-400'
                  }
                >
                  {stage.label}
                </span>
                {isCurrent && (
                  <span className="px-1.5 py-0.2 rounded bg-[#F97316] text-white text-[9px] font-bold animate-pulse">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Doorstep Location Pin */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Pickup Address</span>
        </div>
        <p className="text-[10px] text-slate-600 leading-snug">
          {order.customer?.address || 'Doorstep location on record'}
        </p>
      </div>

      {/* Action Button to Full Tracking Page */}
      <a
        href={`/track-order?id=${order.orderNumber}`}
        className="block py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-center text-[11px] shadow-sm transition-all flex items-center justify-center gap-1.5"
      >
        <span>Open Live GPS Map & Tax Invoice</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

    </div>
  );
};
