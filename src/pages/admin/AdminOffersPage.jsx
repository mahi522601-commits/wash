import React, { useState, useEffect } from 'react';
import { offerService, DEFAULT_OFFERS, DEFAULT_POPUP_CONFIG } from '../../services/offerService';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  Sparkles, 
  Tag, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  BarChart2, 
  Smartphone, 
  Monitor, 
  ArrowRight, 
  Clock 
} from 'lucide-react';

export const AdminOffersPage = () => {
  const { success, error } = useToast();

  const [offers, setOffers] = useState([]);
  const [popupConfig, setPopupConfig] = useState(DEFAULT_POPUP_CONFIG);
  const [analyticsData, setAnalyticsData] = useState({});
  const [editingOffer, setEditingOffer] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [activeList, config] = await Promise.all([
      offerService.getActiveOffers(),
      offerService.getPopupConfig(),
    ]);
    setOffers(activeList);
    setPopupConfig(config);
    setAnalyticsData(offerService.getAnalytics());
  };

  const handleSavePopupConfig = async () => {
    await offerService.savePopupConfig(popupConfig);
    success('Settings Saved', 'First-visit offer popup configuration updated.');
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!editingOffer) return;

    let updatedList;
    if (editingOffer.id) {
      updatedList = offers.map(o => o.id === editingOffer.id ? editingOffer : o);
    } else {
      const newOffer = { ...editingOffer, id: `off-${Date.now()}` };
      updatedList = [...offers, newOffer];
    }

    setOffers(updatedList);
    await offerService.saveOffers(updatedList);
    setEditingOffer(null);
    success('Offer Saved', `Campaign ${editingOffer.code} successfully saved.`);
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    const updatedList = offers.filter(o => o.id !== id);
    setOffers(updatedList);
    await offerService.saveOffers(updatedList);
    success('Offer Deleted', 'Campaign removed from active list.');
  };

  const featuredOffer = offers.find(o => o.featured) || offers[0] || DEFAULT_OFFERS[0];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Offers & First-Visit Campaign Manager
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure promotional promo codes, first-visit 1:1 square modal popup, and track performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={Eye}
            onClick={() => setShowPreviewModal(true)}
          >
            Preview 1:1 Popup
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setEditingOffer({
              code: 'NEWOFFER',
              title: 'Special Promotion',
              badgeText: '✨ LIMITED OFFER',
              discountValue: '15% OFF',
              shortDescription: 'Enjoy special savings on your premium garment booking.',
              minOrder: '₹499',
              validTill: 'Limited Period',
              featured: false,
              priority: 4,
              active: true,
              showInPopup: true,
            })}
          >
            Create Offer
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          1. FIRST-VISIT POPUP CONFIGURATION CARD
      ───────────────────────────────────────────────────────── */}
      <Card variant="luxury" className="p-6 space-y-6 border-brand-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                First-Visit 1:1 Square Popup Settings
              </h2>
              <p className="text-xs text-slate-500">
                Automatically displays the primary offer to new visitors after page load.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={popupConfig.enabled}
              onChange={(e) => setPopupConfig({ ...popupConfig, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Display Cooldown
            </label>
            <select
              value={popupConfig.cooldown}
              onChange={(e) => setPopupConfig({ ...popupConfig, cooldown: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="session">Once Per Browser Session</option>
              <option value="daily">Once Per Day</option>
              <option value="always">Every Page Refresh (Testing)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Entrance Delay (ms)
            </label>
            <input
              type="number"
              value={popupConfig.delayMs}
              onChange={(e) => setPopupConfig({ ...popupConfig, delayMs: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              placeholder="1000"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              icon={Save}
              className="w-full"
              onClick={handleSavePopupConfig}
            >
              Save Popup Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────
          2. ACTIVE OFFERS LIST & PERFORMANCE ANALYTICS
      ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 font-display">
          Active Promotional Campaigns ({offers.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const metrics = analyticsData[offer.code] || { impressions: 0, copies: 0, bookings: 0 };
            const conversion = metrics.impressions > 0 
              ? ((metrics.bookings / metrics.impressions) * 100).toFixed(1) 
              : '0.0';

            return (
              <Card key={offer.id || offer.code} variant="luxury" className="p-6 flex flex-col justify-between group space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
                      {offer.badgeText || '✨ OFFER'}
                    </span>
                    {offer.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                        ★ FEATURED POPUP
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{offer.title}</h3>
                  <div className="text-2xl font-black text-brand-600 font-display mt-0.5">{offer.discountValue}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">{offer.shortDescription}</p>

                  <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-slate-800">{offer.code}</span>
                    <span className="text-[10px] text-slate-400">Min. {offer.minOrder}</span>
                  </div>
                </div>

                {/* Campaign Analytics Ticker */}
                <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-[10px] space-y-1">
                  <div className="font-bold text-brand-900 flex items-center gap-1">
                    <BarChart2 className="w-3 h-3 text-brand-600" />
                    <span>Live Telemetry</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center font-mono font-bold text-slate-700 pt-1">
                    <div>
                      <div className="text-xs text-brand-700">{metrics.impressions}</div>
                      <div className="text-[9px] text-slate-400 font-normal">Views</div>
                    </div>
                    <div>
                      <div className="text-xs text-cyan-600">{metrics.copies}</div>
                      <div className="text-[9px] text-slate-400 font-normal">Copies</div>
                    </div>
                    <div>
                      <div className="text-xs text-emerald-600">{conversion}%</div>
                      <div className="text-[9px] text-slate-400 font-normal">Conv.</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => setEditingOffer(offer)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteOffer(offer.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. EDIT / CREATE OFFER MODAL
      ───────────────────────────────────────────────────────── */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingOffer.id ? 'Edit Promotional Campaign' : 'Create New Campaign'}
              </h3>
              <button onClick={() => setEditingOffer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Promo Code *</label>
                <input
                  type="text"
                  required
                  value={editingOffer.code}
                  onChange={(e) => setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  value={editingOffer.title}
                  onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Headline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20% OFF"
                    value={editingOffer.discountValue}
                    onChange={(e) => setEditingOffer({ ...editingOffer, discountValue: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingOffer.badgeText}
                    onChange={(e) => setEditingOffer({ ...editingOffer, badgeText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingOffer.shortDescription}
                  onChange={(e) => setEditingOffer({ ...editingOffer, shortDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order</label>
                  <input
                    type="text"
                    value={editingOffer.minOrder}
                    onChange={(e) => setEditingOffer({ ...editingOffer, minOrder: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid Till</label>
                  <input
                    type="text"
                    value={editingOffer.validTill}
                    onChange={(e) => setEditingOffer({ ...editingOffer, validTill: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingOffer.featured}
                    onChange={(e) => setEditingOffer({ ...editingOffer, featured: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-bold text-slate-700">Feature in First-Visit Popup</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingOffer.active !== false}
                    onChange={(e) => setEditingOffer({ ...editingOffer, active: e.target.checked })}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-bold text-slate-700">Active</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingOffer(null)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Campaign</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          4. 1:1 SQUARE POPUP PREVIEW MODAL
      ───────────────────────────────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow' : 'bg-white/10 text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Desktop (420px × 420px)</span>
            </button>

            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow' : 'bg-white/10 text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Mobile (360px × 360px)</span>
            </button>

            <button
              onClick={() => setShowPreviewModal(false)}
              className="p-1.5 rounded-xl bg-white/20 text-white hover:bg-white/30 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* PREVIEW CONTAINER */}
          <div
            className={`aspect-square rounded-[36px] bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#6D28D9] text-white p-6 shadow-2xl border border-white/20 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
              previewDevice === 'desktop' ? 'w-[420px] h-[420px]' : 'w-[360px] h-[360px]'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 border border-white/15 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-300 fill-cyan-300" />
                <span>{featuredOffer.badgeText || '✦ LIMITED OFFER'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/15">
                <X className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-1 my-auto">
              <span className="text-[11px] font-bold text-purple-200 uppercase tracking-widest block">
                {featuredOffer.title}
              </span>
              <div className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[#00F0FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.45)] leading-none py-0.5">
                {featuredOffer.discountValue}
              </div>
              <p className="text-[11px] text-purple-100/90 max-w-[260px] mx-auto leading-tight">
                {featuredOffer.shortDescription}
              </p>

              <div className="pt-1.5 max-w-[240px] mx-auto">
                <div className="p-1.5 rounded-2xl bg-black/30 border border-dashed border-white/30 flex items-center justify-between gap-2">
                  <span className="font-mono font-black text-xs text-white tracking-widest pl-2">
                    {featuredOffer.code}
                  </span>
                  <div className="py-1 px-2.5 rounded-xl bg-white text-[#1E1B4B] font-bold text-[10px] flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    <span>COPY</span>
                  </div>
                </div>
                <span className="text-[9px] text-purple-300/80 block mt-1">
                  {featuredOffer.validTill} • Min. {featuredOffer.minOrder}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-1.5 text-center">
              <button className="w-full py-2.5 px-4 rounded-2xl bg-white text-[#1E1B4B] font-black text-xs flex items-center justify-center gap-1.5 shadow-md">
                <span>BOOK NOW</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6D28D9]" />
              </button>
              <span className="text-[10px] text-purple-200 underline">View all offers →</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
