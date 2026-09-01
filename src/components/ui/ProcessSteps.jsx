import React from 'react';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export const ProcessSteps = ({
  steps = [],
  title = 'How We Handle Your Garments',
  subtitle = 'Our certified multi-stage garment care standard ensures absolute fiber protection and hygienic finish.',
  className = '',
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle) && (
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Process Excellence</span>
          </div>
          {title && (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, idx) => {
          const stepNum = step.stepNumber || `0${idx + 1}`;
          return (
            <div
              key={idx}
              className="relative p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-luxury hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-3xl font-black text-slate-200 font-display group-hover:text-brand-500/30 transition-colors">
                    {stepNum}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shadow-sm border border-brand-100">
                    Step {idx + 1}
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-900 mb-3 font-display">
                  {step.title}
                </h4>

                {step.bullets && step.bullets.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {step.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Stage {stepNum} Inspection Passed</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
