import React, { useState, useEffect } from 'react';
import { paymentService, DEFAULT_PAYMENT_CONFIG } from '../../services/paymentService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { UpiPaymentCard } from '../../components/payment/UpiPaymentCard';
import { UpiAppLogosRow } from '../../components/payment/UpiLogos';
import { CreditCard, QrCode, ShieldCheck, Save, Eye, Sparkles, Check, ExternalLink } from 'lucide-react';

const COMMON_UPI_HANDLES = [
  '@okaxis',
  '@okhdfcbank',
  '@oksbi',
  '@okicici',
  '@paytm',
  '@ybl',
  '@ibl',
  '@apl',
  '@upi'
];

export const AdminPaymentsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig()
      .then(cfg => {
        if (cfg) setConfig(cfg);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAppendHandle = (handle) => {
    const current = config.upi?.upiId || '';
    const base = current.split('@')[0] || 'techwash';
    setConfig({
      ...config,
      upi: { ...config.upi, upiId: `${base}${handle}` }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await paymentService.savePaymentConfig(config);
      setConfig(saved);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'Payments',
        entityName: 'Payment Configuration',
        user: currentUser,
      });
      success('Payment Settings Saved!', `UPI ID "${saved.upi?.upiId}" updated and active.`);
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        title="Payments & UPI Configuration"
        subtitle="Manage dynamic UPI QR codes, Merchant UPI IDs (GPay, PhonePe, Paytm), and online gateway parameters."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form Column (7 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          
          {/* UPI Configuration Card */}
          <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-6 border-brand-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Direct UPI & Dynamic QR Setup
                  </h3>
                  <p className="text-xs text-slate-500">
                    Saves directly to Firebase for customer checkout and invoices
                  </p>
                </div>
              </div>
              <Badge variant={config.upi?.enabled ? 'emerald' : 'slate'}>
                {config.upi?.enabled ? 'UPI Active' : 'Disabled'}
              </Badge>
            </div>

            {/* Merchant UPI ID Input */}
            <div className="space-y-2">
              <Input
                label="Merchant UPI ID (VPA) *"
                required
                placeholder="e.g. techwash@icici or 6304845567@paytm"
                value={config.upi?.upiId}
                onChange={(e) => setConfig({
                  ...config,
                  upi: { ...config.upi, upiId: e.target.value }
                })}
              />
              
              {/* Quick Handle Helper Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Bank Suffixes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_UPI_HANDLES.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleAppendHandle(h)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-800 text-[11px] font-mono font-medium transition-colors border border-slate-200"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Merchant Business Name *"
                placeholder="Tech Wash Laundry Services"
                value={config.upi?.merchantName}
                onChange={(e) => setConfig({
                  ...config,
                  upi: { ...config.upi, merchantName: e.target.value }
                })}
              />

              <Input
                label="Custom Static QR Image URL (Optional)"
                placeholder="https://... (Leave blank for auto-generated QR)"
                value={config.upi?.qrImageUrl}
                onChange={(e) => setConfig({
                  ...config,
                  upi: { ...config.upi, qrImageUrl: e.target.value }
                })}
              />
            </div>

            <Textarea
              label="Customer Payment Instructions"
              rows={2}
              value={config.upi?.instructions}
              onChange={(e) => setConfig({
                ...config,
                upi: { ...config.upi, instructions: e.target.value }
              })}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="upi-enable"
                checked={!!config.upi?.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  upi: { ...config.upi, enabled: e.target.checked }
                })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="upi-enable" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Enable Direct UPI & QR Option on Customer Booking Checkout
              </label>
            </div>
          </Card>

          {/* Pay on Delivery Option */}
          <Card variant="luxury" className="p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Pay on Delivery / Cash Option
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cod-enable"
                checked={config.payLater?.cashOnDeliveryEnabled !== false}
                onChange={(e) => setConfig({
                  ...config,
                  payLater: { ...config.payLater, cashOnDeliveryEnabled: e.target.checked }
                })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <label htmlFor="cod-enable" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Allow "Pay After Delivery / Cash" option
              </label>
            </div>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={isSaving}
            className="w-full justify-center shadow-lg"
          >
            Save & Publish Payment Settings to Firebase
          </Button>

        </form>

        {/* Right Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-600" />
              <span>Live Customer Checkout Preview</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Interactive
            </span>
          </div>

          <UpiPaymentCard
            upiConfig={config.upi}
            amount={599}
            orderNumber="TW-SAMPLE"
            showDirectPayButton={true}
            title="Scan & Pay (Sample ₹599 Order)"
          />

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 text-xs text-brand-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-brand-900">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>How this works:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <li>When customers choose "Direct UPI / QR Code" during checkout, they see the exact merchant UPI ID and live QR code shown above.</li>
              <li>Customers on mobile can tap the green button to open Google Pay, PhonePe, or Paytm directly.</li>
              <li>The QR code automatically embeds your UPI ID, Business Name, and dynamic invoice amount.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

