import React, { useState, useEffect } from 'react';
import { pricingService, INITIAL_PRICING_CONFIG } from '../../services/pricingConfig';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Save, 
  Sparkles, 
  Scale, 
  Maximize2, 
  Check, 
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

export const AdminPricingPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);
  const [activeTab, setActiveTab] = useState('dryCleaning'); // 'dryCleaning' | 'ironing' | 'perKg' | 'weights' | 'special'
  const [activeCategory, setActiveCategory] = useState('men'); // 'men' | 'women' | 'common'
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New item draft state
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '👔', category: 'Men', subCategory: 'tops' });
  const [showAddModal, setShowAddModal] = useState(false);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const config = await pricingService.getPricingConfig();
      if (config) setPricingConfig(config);
    } catch (e) {
      console.warn("Pricing load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  // Update Itemized Price
  const handleItemPriceChange = (serviceType, category, itemId, newPrice) => {
    setPricingConfig(prev => {
      const currentList = prev[serviceType]?.[category] || [];
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          return { ...item, price: Math.max(0, Number(newPrice) || 0) };
        }
        return item;
      });
      return {
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          [category]: updatedList
        }
      };
    });
  };

  // Delete Itemized Price item
  const handleDeleteItem = (serviceType, category, itemId) => {
    setPricingConfig(prev => {
      const currentList = prev[serviceType]?.[category] || [];
      const updatedList = currentList.filter(item => item.id !== itemId);
      return {
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          [category]: updatedList
        }
      };
    });
  };

  // Add Itemized Price item
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) {
      error('Name & Price Required', 'Please enter both item name and valid price.');
      return;
    }

    const itemObj = {
      id: `${activeTab === 'dryCleaning' ? 'dc' : 'ir'}-${activeCategory[0]}-${Date.now()}`,
      name: newItem.name.trim(),
      price: Number(newItem.price),
      emoji: newItem.emoji || '👔',
      category: activeCategory === 'men' ? 'Men' : activeCategory === 'women' ? 'Women' : 'Common',
      subCategory: newItem.subCategory || 'tops',
      gender: activeCategory,
    };

    setPricingConfig(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [activeCategory]: [...(prev[activeTab]?.[activeCategory] || []), itemObj]
      }
    }));

    setNewItem({ name: '', price: '', emoji: '👔', category: 'Men', subCategory: 'tops' });
    setShowAddModal(false);
    success('Item Added', `${itemObj.name} added to ${activeTab} (${activeCategory}). Remember to Save Changes.`);
  };

  // Update KG Base Rates
  const handleKgRateChange = (serviceId, gender, newRate) => {
    setPricingConfig(prev => {
      const services = (prev.services || []).map(s => {
        if (s.id === serviceId) {
          return {
            ...s,
            baseRates: {
              ...s.baseRates,
              [gender]: Math.max(1, Number(newRate) || 1)
            }
          };
        }
        return s;
      });
      return { ...prev, services };
    });
  };

  // Update Standard Weight
  const handleWeightChange = (gender, itemId, newGrams) => {
    setPricingConfig(prev => {
      const list = (prev.weightStandards?.[gender] || []).map(w => {
        if (w.id === itemId) {
          const grams = Math.max(0, Number(newGrams) || 0);
          return {
            ...w,
            weightGrams: grams,
            weightKg: Number((grams / 1000).toFixed(3))
          };
        }
        return w;
      });
      return {
        ...prev,
        weightStandards: {
          ...prev.weightStandards,
          [gender]: list
        }
      };
    });
  };

  // Update Special Services
  const handleSpecialRateChange = (serviceKey, field, val) => {
    setPricingConfig(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: Number(val) || 0
      }
    }));
  };

  // Save All Changes to Firestore
  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      await pricingService.updatePricingConfig(pricingConfig);
      
      // Log audit
      try {
        await auditService.logAction({
          action: 'UPDATE_PRICING',
          entity: 'SettingsPricing',
          entityName: 'Master Rate Card',
          user: currentUser,
        });
      } catch (e) {}

      success('Pricing Saved!', 'All prices, rates, and weights synchronized to Firebase.');
    } catch (err) {
      error('Save Failed', err.message || 'Unable to update pricing in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('Reset all prices to official initial defaults? This will overwrite changes.')) {
      setPricingConfig(INITIAL_PRICING_CONFIG);
      success('Reset Applied', 'Click "Save Changes to Firebase" to commit.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <AdvancedLogoLoader size="md" text="Loading Rates from Firebase..." subtext="Syncing current wash, dry cleaning & express tariffs" />
      </div>
    );
  }

  const currentItemList = (pricingConfig[activeTab]?.[activeCategory] || []).filter(i =>
    !searchFilter || i.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Single Source of Truth</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-display">
            Master Pricing & Rate Card
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live prices across Dry Cleaning, Ironing, Per-KG rates, Curtain/Carpet sq.ft. rates, and weights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={RotateCcw}
            onClick={handleResetDefaults}
          >
            Reset Defaults
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Save}
            isLoading={isSaving}
            onClick={handleSaveToFirestore}
          >
            Save Changes to Firebase
          </Button>
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'dryCleaning', label: '🧺 Dry Cleaning (Per-Piece)', desc: 'Men, Women & Common' },
          { id: 'ironing', label: '👔 Ironing (Per-Piece)', desc: 'Steam pressing rates' },
          { id: 'perKg', label: '🫧 Per-KG Rates', desc: 'Wash & Iron / Fold' },
          { id: 'weights', label: '⚖️ Garment Weights', desc: 'Weight standards (g)' },
          { id: 'special', label: '🪟 Special Services', desc: 'Curtains, Shoes, Carpets' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setActiveCategory('men');
              setSearchFilter('');
            }}
            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap text-left border ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>{tab.label}</div>
            <div className={`text-[10px] font-normal mt-0.5 ${activeTab === tab.id ? 'text-brand-100' : 'text-slate-400'}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* 1. DRY CLEANING & IRONING ITEMIZED RATES                      */}
      {/* ============================================================ */}
      {(activeTab === 'dryCleaning' || activeTab === 'ironing') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            {/* Category Segment (Men / Women / Common) */}
            <div className="flex items-center gap-2">
              {[
                { id: 'men', label: '👨 Men\'s Wear' },
                { id: 'women', label: '👩 Women\'s & Kids' },
                ...(activeTab === 'dryCleaning' ? [{ id: 'common', label: '🧸 Common & Accessories' }] : []),
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Add button */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter garments..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setShowAddModal(true)}
              >
                Add Item
              </Button>
            </div>
          </div>

          {/* Item Price Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentItemList.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{item.emoji || '👔'}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.category || activeCategory}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1">
                    <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemPriceChange(activeTab, activeCategory, item.id, e.target.value)}
                      className="w-16 text-xs font-bold text-slate-900 text-right focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(activeTab, activeCategory, item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </Card>
      )}

      {/* ============================================================ */}
      {/* 2. PER-KG BASE RATES                                         */}
      {/* ============================================================ */}
      {activeTab === 'perKg' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Wash & Iron */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-2xl">🫧</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Wash & Iron Rates</h3>
                <p className="text-xs text-slate-500">Demineralized RO wash + steam press</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">👨 Men's Base Rate</span>
                  <span className="text-[11px] text-slate-400">Per Kilogram (Kg)</span>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricingConfig.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.men || 130}
                    onChange={(e) => handleKgRateChange('wash-and-iron', 'men', e.target.value)}
                    className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">👩 Women's Base Rate</span>
                  <span className="text-[11px] text-slate-400">Per Kilogram (Kg)</span>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricingConfig.services?.find(s => s.id === 'wash-and-iron')?.baseRates?.women || 160}
                    onChange={(e) => handleKgRateChange('wash-and-iron', 'women', e.target.value)}
                    className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Wash & Fold */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-2xl">👕</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Wash & Fold Rates</h3>
                <p className="text-xs text-slate-500">Hygienic wash + dry + hand fold</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">👨 Men's Base Rate</span>
                  <span className="text-[11px] text-slate-400">Per Kilogram (Kg)</span>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricingConfig.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.men || 100}
                    onChange={(e) => handleKgRateChange('wash-and-fold', 'men', e.target.value)}
                    className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">👩 Women's Base Rate</span>
                  <span className="text-[11px] text-slate-400">Per Kilogram (Kg)</span>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                  <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricingConfig.services?.find(s => s.id === 'wash-and-fold')?.baseRates?.women || 130}
                    onChange={(e) => handleKgRateChange('wash-and-fold', 'women', e.target.value)}
                    className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                </div>
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* ============================================================ */}
      {/* 3. CLOTHING WEIGHT STANDARDS (GRAMS)                         */}
      {/* ============================================================ */}
      {activeTab === 'weights' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-display">Approximate Garment Weights (in Grams)</h3>
            <p className="text-xs text-slate-500">Configured weights used to dynamically estimate KG load during customer booking.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Men Weights */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">👨 Men's Clothing Weights</span>
              {(pricingConfig.weightStandards?.men || []).map(w => (
                <div key={w.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{w.emoji}</span>
                    <span className="text-xs font-bold text-slate-900">{w.name}</span>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="unconfirmed"
                      value={w.weightGrams || ''}
                      onChange={(e) => handleWeightChange('men', w.id, e.target.value)}
                      className="w-16 text-xs font-bold text-slate-900 text-right focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 ml-1">g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Women Weights */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">👩 Women's Clothing Weights</span>
              {(pricingConfig.weightStandards?.women || []).map(w => (
                <div key={w.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{w.emoji}</span>
                    <span className="text-xs font-bold text-slate-900">{w.name}</span>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="unconfirmed"
                      value={w.weightGrams || ''}
                      onChange={(e) => handleWeightChange('women', w.id, e.target.value)}
                      className="w-16 text-xs font-bold text-slate-900 text-right focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 ml-1">g</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* 4. SPECIAL SERVICES (CURTAINS, SHOES, CARPETS, SAREES)        */}
      {/* ============================================================ */}
      {activeTab === 'special' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* Curtains */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="text-2xl">🪟</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Curtain Washing</h3>
                <p className="text-[11px] text-slate-400">Per Square Foot</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Rate / Sq. Ft:</span>
              <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1">
                <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  min="1"
                  value={pricingConfig.curtains?.ratePerSqFt || 30}
                  onChange={(e) => handleSpecialRateChange('curtains', 'ratePerSqFt', e.target.value)}
                  className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Shoes */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="text-2xl">👟</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shoe Washing</h3>
                <p className="text-[11px] text-slate-400">Per Pair Rate</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Rate / Pair:</span>
              <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1">
                <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  min="1"
                  value={pricingConfig.shoes?.ratePerPair || 350}
                  onChange={(e) => handleSpecialRateChange('shoes', 'ratePerPair', e.target.value)}
                  className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Carpets */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="text-2xl">🧶</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Carpet Washing</h3>
                <p className="text-[11px] text-slate-400">Per Square Foot</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Rate / Sq. Ft:</span>
              <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1">
                <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                <input
                  type="number"
                  min="1"
                  value={pricingConfig.carpets?.ratePerSqFt || 45}
                  onChange={(e) => handleSpecialRateChange('carpets', 'ratePerSqFt', e.target.value)}
                  className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                />
              </div>
            </div>
          </Card>

        </div>
      )}

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Add New Item to {activeTab === 'dryCleaning' ? 'Dry Cleaning' : 'Ironing'} ({activeCategory})
            </h3>

            <form onSubmit={handleAddNewItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silk Dupatta, Trench Coat"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="90"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="👔"
                    value={newItem.emoji}
                    onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add Item
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
