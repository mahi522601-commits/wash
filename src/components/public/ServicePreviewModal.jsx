import React from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { YouTubeEmbed } from '../ui/YouTubeEmbed';
import { ProcessSteps } from '../ui/ProcessSteps';
import { formatCurrency } from '../../utils/formatters';
import { Calendar, CheckCircle2, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export const ServicePreviewModal = ({
  isOpen,
  onClose,
  service,
}) => {
  if (!service) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      className="p-0 overflow-hidden"
    >
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm">Live Public Preview Mode</Badge>
          <span className="text-xs text-slate-300 font-mono">/services/{service.slug || 'preview'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} className="text-white border-slate-700 hover:bg-slate-800">
          Close Preview
        </Button>
      </div>

      <div className="max-h-[80vh] overflow-y-auto bg-white text-slate-900">
        {/* Service Hero */}
        <div className="relative py-12 px-6 sm:px-12 bg-slate-950 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src={service.heroImage || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80'}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 max-w-3xl space-y-4">
            <Badge variant="royal" size="md">{service.category || 'Specialized Service'}</Badge>
            <h1 className="text-3xl sm:text-4xl font-black font-display text-white">
              {service.title || 'Untitled Service'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {service.shortDescription || 'Service short summary description.'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="text-2xl font-black font-display text-cyan-400">
                {service.startingPrice ? `${formatCurrency(service.startingPrice)}` : 'Custom Quote'}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {service.pricingType || 'per piece'}</span>
              </div>
              <Button variant="primary" size="md" icon={Calendar}>
                Book This Service
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="p-6 sm:p-12 space-y-12">
          {service.detailedDescription && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">Service Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {service.detailedDescription}
              </p>
            </div>
          )}

          {/* Features Grid */}
          {service.features && service.features.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 font-display">Key Service Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.features.map((feat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube Video Section if configured */}
          {service.youtubeUrl && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 font-display">
                {service.youtubeTitle || 'Process Demonstration Video'}
              </h3>
              <YouTubeEmbed url={service.youtubeUrl} title={service.youtubeTitle} />
            </div>
          )}

          {/* Step by Step Process */}
          {service.processSteps && service.processSteps.length > 0 && (
            <div>
              <ProcessSteps
                steps={service.processSteps}
                title={`How We Process Your ${service.title}`}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
