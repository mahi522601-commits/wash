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
import { CreditCard, QrCode, ShieldCheck, Save } from 'lucide-react';

export const AdminPaymentsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_PAYMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    paymentService.getPaymentConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await paymentService.savePaymentConfig(config);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'Payments',
        entityName: 'Payment Configuration',
        user: currentUser,
      });
      success('Payment Settings Saved', 'UPI and Payment Gateway settings updated.');
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments & Gateway Architecture"
        subtitle="Manage dynamic UPI QR codes, Merchant UPI IDs, and Razorpay/Gateway test and live keys."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* UPI QR Code Section */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand-600" />
              <span>Direct UPI & Dynamic QR Configuration</span>
            </h3>
            <Badge variant={config.upi?.enabled ? 'emerald' : 'slate'}>
              {config.upi?.enabled ? 'UPI Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Merchant UPI ID *"
              required
              placeholder="e.g. techwash@icici or techwash@upi"
              value={config.upi?.upiId}
              onChange={(e) => setConfig({
                ...config,
                upi: { ...config.upi, upiId: e.target.value }
              })}
            />
            <Input
              label="Merchant Display Name"
              value={config.upi?.merchantName}
              onChange={(e) => setConfig({
                ...config,
                upi: { ...config.upi, merchantName: e.target.value }
              })}
            />
          </div>

          <Input
            label="Custom Payment QR Code Graphic URL"
            placeholder="https://... or upload to Media Library"
            value={config.upi?.qrImageUrl}
            onChange={(e) => setConfig({
              ...config,
              upi: { ...config.upi, qrImageUrl: e.target.value }
            })}
          />

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
            <label htmlFor="upi-enable" className="text-xs font-semibold text-slate-700">
              Enable Direct UPI & QR Option on Booking Checkout
            </label>
          </div>
        </Card>

        {/* Payment Gateway Section (Razorpay / Online) */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Online Payment Gateway (Cards/NetBanking)</span>
            </h3>
            <Badge variant={config.gateway?.enabled ? 'emerald' : 'slate'}>
              {config.gateway?.enabled ? 'Gateway Active' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Gateway Provider
              </label>
              <select
                value={config.gateway?.provider || 'Razorpay'}
                onChange={(e) => setConfig({
                  ...config,
                  gateway: { ...config.gateway, provider: e.target.value }
                })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
              >
                <option value="Razorpay">Razorpay</option>
                <option value="Cashfree">Cashfree</option>
                <option value="Paytm">Paytm PG</option>
              </select>
            </div>

            <Input
              label="Public Client Key (Key ID)"
              placeholder="rzp_test_..."
              value={config.gateway?.keyId}
              onChange={(e) => setConfig({
                ...config,
                gateway: { ...config.gateway, keyId: e.target.value }
              })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Mode
              </label>
              <select
                value={config.gateway?.testMode ? 'test' : 'live'}
                onChange={(e) => setConfig({
                  ...config,
                  gateway: { ...config.gateway, testMode: e.target.value === 'test' }
                })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800"
              >
                <option value="test">Sandbox / Test Mode</option>
                <option value="live">Live Production</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Security Rule #29 & #73: Secret API Keys must remain in secure backend environment variables. Never enter secret credentials here.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="gw-enable"
              checked={!!config.gateway?.enabled}
              onChange={(e) => setConfig({
                ...config,
                gateway: { ...config.gateway, enabled: e.target.checked }
              })}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <label htmlFor="gw-enable" className="text-xs font-semibold text-slate-700">
              Enable Online Gateway in Checkout
            </label>
          </div>
        </Card>

        {/* Pay Later / COD Option */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">
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
            <label htmlFor="cod-enable" className="text-xs font-semibold text-slate-700">
              Allow "Pay After Delivery" (Zero risk customer conversion driver)
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={isSaving}
          >
            Save All Payment Settings
          </Button>
        </div>

      </form>
    </div>
  );
};
