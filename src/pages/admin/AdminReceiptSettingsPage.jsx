import React, { useState, useEffect } from 'react';
import { receiptService, DEFAULT_RECEIPT_CONFIG } from '../../services/receiptService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  FileText, 
  Save, 
  QrCode, 
  Building, 
  ShieldCheck, 
  Sliders, 
  Check, 
  Eye, 
  Sparkles 
} from 'lucide-react';

export const AdminReceiptSettingsPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState(DEFAULT_RECEIPT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    receiptService.getReceiptConfig().then(setConfig);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await receiptService.saveReceiptConfig(config);
      await auditService.logAction({
        action: 'UPDATE',
        entity: 'ReceiptSettings',
        entityName: 'Invoice Template & Numbering Configuration',
        user: currentUser,
      });
      success('Receipt Settings Saved', 'Official invoice template & layout updated successfully.');
    } catch (err) {
      error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Official Tax Invoice & Receipt CMS"
        subtitle="Manage business branding, GSTIN details, invoice numbering schema, QR code toggles, and terms on print receipts."
      />

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Business Header & GSTIN Settings */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-600" />
              <span>Business Information on Printed Receipts</span>
            </h3>
            <Badge variant="brand">Tax Compliant</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Legal Name *"
              required
              value={config.businessName}
              onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
            />

            <Input
              label="Tagline / Brand Subtitle"
              value={config.tagline}
              onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Phone *"
              required
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
            />

            <Input
              label="Support Email *"
              required
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
            />

            <Input
              label="Website URL"
              value={config.website}
              onChange={(e) => setConfig({ ...config, website: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registered Facility Address *"
              required
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
            />

            <Input
              label="GSTIN Number (Goods & Services Tax)"
              placeholder="e.g. 36AAAAA0000A1Z5"
              value={config.gstNumber}
              onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
            />
          </div>
        </Card>

        {/* 2. Numbering Schema & Prefix */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <span>Invoice Numbering Pattern</span>
            </h3>
            <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
              Sample: TW-2026-001245
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Numbering Schema Pattern"
              placeholder="TW-{YEAR}-{NUMBER}"
              value={config.prefixPattern}
              onChange={(e) => setConfig({ ...config, prefixPattern: e.target.value })}
            />

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Dynamic Tokens:</strong>
              <div className="mt-1 font-mono text-[11px] text-brand-700">
                • {'{YEAR}'} : Current 4-digit year (e.g. 2026)<br />
                • {'{NUMBER}'} : 6-digit sequential order number
              </div>
            </div>
          </div>
        </Card>

        {/* 3. QR Codes & Section Visibility Toggles */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <span>QR Codes & Section Visibility</span>
            </h3>
            <Badge variant="emerald">Live Dynamic Rendering</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <label className="flex items-center gap-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTrackingQr}
                onChange={(e) => setConfig({ ...config, showTrackingQr: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">Live Tracking QR</div>
                <div className="text-[11px] text-slate-500">Scan to view milestones</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPaymentQr}
                onChange={(e) => setConfig({ ...config, showPaymentQr: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">UPI Payment QR</div>
                <div className="text-[11px] text-slate-500">Scan to pay pending bill</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-brand-50/60 border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showGst}
                onChange={(e) => setConfig({ ...config, showGst: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">Print GSTIN Details</div>
                <div className="text-[11px] text-slate-500">Official tax breakdown</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPickupLocationMapRef}
                onChange={(e) => setConfig({ ...config, showPickupLocationMapRef: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">GPS Location Reference</div>
                <div className="text-[11px] text-slate-500">Show locked doorstep info</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showGarmentNotes}
                onChange={(e) => setConfig({ ...config, showGarmentNotes: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">Garment Instructions</div>
                <div className="text-[11px] text-slate-500">Print special customer care notes</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTerms}
                onChange={(e) => setConfig({ ...config, showTerms: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-navy-800">Terms & Conditions</div>
                <div className="text-[11px] text-slate-500">Show policy text in footer</div>
              </div>
            </label>

          </div>
        </Card>

        {/* 4. Thank You Note & Terms Editor */}
        <Card variant="luxury" className="p-6 sm:p-8 bg-white space-y-4">
          <h3 className="text-base font-bold text-navy-800 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <span>Thank You Message & Terms & Conditions</span>
          </h3>

          <Input
            label="Thank You Note (Displayed above footer)"
            value={config.thankYouMessage}
            onChange={(e) => setConfig({ ...config, thankYouMessage: e.target.value })}
          />

          <Textarea
            label="Terms & Conditions (Compact Bullet Points)"
            rows={3}
            value={config.termsAndConditions}
            onChange={(e) => setConfig({ ...config, termsAndConditions: e.target.value })}
          />

          <Input
            label="Footer Concierge / Help Note"
            value={config.footerContactNote}
            onChange={(e) => setConfig({ ...config, footerContactNote: e.target.value })}
          />
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={isSaving}
            className="shadow-glow-purple"
          >
            Save Receipt & Invoice Settings
          </Button>
        </div>

      </form>
    </div>
  );
};
