import React, { useState, useEffect } from 'react';
import { pricingService, INITIAL_PRICING_CONFIG, DEFAULT_PER_KG_SUB_SERVICES, DEFAULT_WEIGHED_GARMENTS } from '../../services/pricingConfig';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import { EmojiPicker } from '../../components/common/EmojiPicker';
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
  Layers,
  FolderPlus
} from 'lucide-react';

export const AdminPricingPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [pricingConfig, setPricingConfig] = useState(INITIAL_PRICING_CONFIG);
  const [activeTab, setActiveTab] = useState('dryCleaning'); // 'dryCleaning' | 'ironing' | 'starch-and-iron' | 'perKg' | 'weights' | 'special' | 'customServices'
  const [activeCategory, setActiveCategory] = useState('men'); // 'men' | 'women' | 'common'
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New item draft state
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '👔', category: 'Men', subCategory: 'tops' });
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit item draft state
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState({
    serviceType: '',
    category: '',
    id: '',
    name: '',
    price: '',
    emoji: '👔',
    subCategory: 'tops',
  });

  // Per-KG Sub-Services draft state
  const [showAddPerKgModal, setShowAddPerKgModal] = useState(false);
  const [newPerKgSubService, setNewPerKgSubService] = useState({
    serviceId: 'wash-and-fold',
    name: '',
    price: '',
    emoji: '👕',
    description: '',
  });

  const [showEditPerKgModal, setShowEditPerKgModal] = useState(false);
  const [editingPerKgSubService, setEditingPerKgSubService] = useState({
    id: '',
    serviceId: 'wash-and-fold',
    name: '',
    price: '',
    emoji: '👕',
    description: '',
  });

  // Weighed Garments (Clothes Sub-Services) draft state
  const [weighedGroupFilter, setWeighedGroupFilter] = useState('ALL'); // 'ALL' | 'MEN' | 'WOMEN' | 'HOUSEHOLD' | 'KIDS'
  const [weighedSearchFilter, setWeighedSearchFilter] = useState('');
  const [showAddWeighedModal, setShowAddWeighedModal] = useState(false);
  const [newWeighedGarment, setNewWeighedGarment] = useState({
    name: '',
    emoji: '👕',
    group: 'MEN',
    category: "Men's Wear",
    targetService: 'all',
  });

  const [showEditWeighedModal, setShowEditWeighedModal] = useState(false);
  const [editingWeighedGarment, setEditingWeighedGarment] = useState({
    id: '',
    name: '',
    emoji: '👕',
    group: 'MEN',
    category: "Men's Wear",
    targetService: 'all',
  });

  // Custom Service & Sub-Services draft state
  const [showAddCustomServiceModal, setShowAddCustomServiceModal] = useState(false);
  const [newCustomService, setNewCustomService] = useState({
    name: '',
    emoji: '✨',
    startingPrice: '',
    pricingType: 'per_item',
    category: 'Custom Care',
    description: '',
  });

  // Edit Custom Service Category draft state
  const [showEditCustomServiceModal, setShowEditCustomServiceModal] = useState(false);
  const [editingCustomService, setEditingCustomService] = useState({
    id: '',
    name: '',
    emoji: '✨',
    startingPrice: '',
    pricingType: 'per_item',
    category: 'Custom Care',
    description: '',
  });

  // Add Sub-Service draft state
  const [showAddSubServiceModal, setShowAddSubServiceModal] = useState(false);
  const [targetCustomServiceId, setTargetCustomServiceId] = useState(null);
  const [newSubService, setNewSubService] = useState({
    name: '',
    price: '',
    emoji: '✨',
    desc: '',
  });

  // Edit Sub-Service draft state
  const [showEditSubServiceModal, setShowEditSubServiceModal] = useState(false);
  const [editingSubService, setEditingSubService] = useState({
    serviceId: '',
    subId: '',
    name: '',
    price: '',
    emoji: '✨',
    desc: '',
  });

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

  // Helper for resolving starch-and-iron tab key
  const resolveTabKey = (tab) => {
    if (tab === 'starch-and-iron' || tab === 'starchAndIron') return 'starch-and-iron';
    return tab;
  };

  // Update Itemized Price
  const handleItemPriceChange = (serviceType, category, itemId, newPrice) => {
    setHasUnsavedChanges(true);
    const tabKey = resolveTabKey(serviceType);
    setPricingConfig(prev => {
      const currentList = prev[tabKey]?.[category] || prev.starchAndIron?.[category] || [];
      const updatedList = currentList.map(item => {
        if (item.id === itemId) {
          return { ...item, price: Math.max(0, Number(newPrice) || 0) };
        }
        return item;
      });
      return {
        ...prev,
        [tabKey]: {
          ...(prev[tabKey] || {}),
          [category]: updatedList
        }
      };
    });
  };

  // Delete Itemized Price item
  const handleDeleteItem = (serviceType, category, itemId) => {
    if (!window.confirm('Remove this garment item from rate card?')) return;
    setHasUnsavedChanges(true);
    const tabKey = resolveTabKey(serviceType);
    setPricingConfig(prev => {
      const currentList = prev[tabKey]?.[category] || prev.starchAndIron?.[category] || [];
      const updatedList = currentList.filter(item => item.id !== itemId);
      return {
        ...prev,
        [tabKey]: {
          ...(prev[tabKey] || {}),
          [category]: updatedList
        }
      };
    });
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (serviceType, category, item) => {
    setEditingItem({
      serviceType,
      category,
      id: item.id,
      name: item.name || '',
      price: item.price !== undefined ? item.price : 0,
      emoji: item.emoji || '👔',
      subCategory: item.subCategory || 'tops',
    });
    setShowEditItemModal(true);
  };

  // Save Edit Item
  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editingItem.name.trim()) {
      error('Name Required', 'Please enter an item name.');
      return;
    }
    setHasUnsavedChanges(true);
    const tabKey = resolveTabKey(editingItem.serviceType);
    setPricingConfig(prev => {
      const currentList = prev[tabKey]?.[editingItem.category] || prev.starchAndIron?.[editingItem.category] || [];
      const updatedList = currentList.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: editingItem.name.trim(),
            price: Math.max(0, Number(editingItem.price) || 0),
            emoji: editingItem.emoji || '👔',
            subCategory: editingItem.subCategory || 'tops',
          };
        }
        return item;
      });
      return {
        ...prev,
        [tabKey]: {
          ...(prev[tabKey] || {}),
          [editingItem.category]: updatedList
        }
      };
    });
    setShowEditItemModal(false);
    success('Item Updated', `"${editingItem.name}" updated. Click Save to broadcast live.`);
  };

  // Add Itemized Price item
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || newItem.price === '' || newItem.price === undefined) {
      error('Name & Price Required', 'Please enter both item name and valid price.');
      return;
    }

    const tabKey = resolveTabKey(activeTab);
    const prefix = tabKey === 'dryCleaning' ? 'dc' : tabKey === 'ironing' ? 'ir' : 'si';
    const itemObj = {
      id: `${prefix}-${activeCategory[0]}-${Date.now()}`,
      name: newItem.name.trim(),
      price: Math.max(0, Number(newItem.price) || 0),
      emoji: newItem.emoji || '👔',
      category: activeCategory === 'men' ? 'Men' : activeCategory === 'women' ? 'Women' : 'Common',
      subCategory: newItem.subCategory || 'tops',
      gender: activeCategory,
    };

    setPricingConfig(prev => {
      const targetCategoryList = prev[tabKey]?.[activeCategory] || (tabKey === 'starch-and-iron' ? (prev.starchAndIron?.[activeCategory] || []) : []);
      return {
        ...prev,
        [tabKey]: {
          ...(prev[tabKey] || {}),
          [activeCategory]: [...targetCategoryList, itemObj]
        }
      };
    });

    setHasUnsavedChanges(true);
    setNewItem({ name: '', price: '', emoji: '👔', category: 'Men', subCategory: 'tops' });
    setShowAddModal(false);
    success('Item Added', `"${itemObj.name}" added to ${tabKey} (${activeCategory}). Remember to click "Save Changes to Firebase" to broadcast live.`);
  };

  // Update KG Base Rates
  const handleKgRateChange = (serviceId, gender, newRate) => {
    setHasUnsavedChanges(true);
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

  // Update Per-KG Sub-Service Price inline
  const handlePerKgSubPriceChange = (subId, newPrice) => {
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.perKgSubServices) ? prev.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES;
      const updatedList = currentList.map(s => {
        if (s.id === subId) {
          return { ...s, price: Math.max(0, Number(newPrice) || 0) };
        }
        return s;
      });
      return { ...prev, perKgSubServices: updatedList };
    });
  };

  // Add Per-KG Sub-Service
  const handleAddPerKgSubService = (e) => {
    e.preventDefault();
    if (!newPerKgSubService.name.trim() || newPerKgSubService.price === '') {
      error('Name & Price Required', 'Please enter sub-service name and rate per Kg.');
      return;
    }
    const newSub = {
      id: `sub-${Date.now()}`,
      serviceId: newPerKgSubService.serviceId || 'wash-and-fold',
      name: newPerKgSubService.name.trim(),
      price: Math.max(0, Number(newPerKgSubService.price) || 0),
      unit: 'Kg',
      emoji: newPerKgSubService.emoji || (newPerKgSubService.serviceId === 'wash-and-fold' ? '👕' : '🫧'),
      description: newPerKgSubService.description || '',
    };

    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.perKgSubServices) ? prev.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES;
      return { ...prev, perKgSubServices: [...currentList, newSub] };
    });

    setHasUnsavedChanges(true);
    setShowAddPerKgModal(false);
    setNewPerKgSubService({ serviceId: 'wash-and-fold', name: '', price: '', emoji: '👕', description: '' });
    success('Sub-Service Added', `"${newSub.name}" added to rate card.`);
  };

  // Open Edit Per-KG Sub-Service Modal
  const handleOpenEditPerKg = (sub) => {
    setEditingPerKgSubService({
      id: sub.id,
      serviceId: sub.serviceId,
      name: sub.name || '',
      price: sub.price !== undefined ? sub.price : 0,
      emoji: sub.emoji || '👕',
      description: sub.description || '',
    });
    setShowEditPerKgModal(true);
  };

  // Save Edit Per-KG Sub-Service
  const handleSaveEditPerKg = (e) => {
    e.preventDefault();
    if (!editingPerKgSubService.name.trim()) {
      error('Name Required', 'Sub-service name cannot be empty.');
      return;
    }
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.perKgSubServices) ? prev.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES;
      const updatedList = currentList.map(s => {
        if (s.id === editingPerKgSubService.id) {
          return {
            ...s,
            name: editingPerKgSubService.name.trim(),
            price: Math.max(0, Number(editingPerKgSubService.price) || 0),
            emoji: editingPerKgSubService.emoji || '👕',
            description: editingPerKgSubService.description || '',
          };
        }
        return s;
      });
      return { ...prev, perKgSubServices: updatedList };
    });
    setShowEditPerKgModal(false);
    success('Sub-Service Updated', `"${editingPerKgSubService.name}" saved.`);
  };

  // Delete Per-KG Sub-Service
  const handleDeletePerKgSub = (subId) => {
    if (!window.confirm('Remove this per-KG sub-service rate?')) return;
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.perKgSubServices) ? prev.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES;
      return {
        ...prev,
        perKgSubServices: currentList.filter(s => s.id !== subId)
      };
    });
    success('Sub-Service Removed', 'Click "Save Changes to Firebase" to broadcast.');
  };

  // Add Weighed Garment Sub-Service
  const handleAddWeighedGarment = (e) => {
    e.preventDefault();
    if (!newWeighedGarment.name.trim()) {
      error('Name Required', 'Please enter a clothes sub-service name.');
      return;
    }
    const newGarment = {
      id: `wg-custom-${Date.now()}`,
      name: newWeighedGarment.name.trim(),
      emoji: newWeighedGarment.emoji || '👕',
      group: newWeighedGarment.group || 'MEN',
      category: newWeighedGarment.category || (newWeighedGarment.group === 'MEN' ? "Men's Wear" : newWeighedGarment.group === 'WOMEN' ? "Women's Wear" : newWeighedGarment.group === 'HOUSEHOLD' ? "Household" : "Kids Wear"),
      targetService: newWeighedGarment.targetService || 'all',
    };

    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.weighedGarments) && prev.weighedGarments.length > 0
        ? prev.weighedGarments
        : DEFAULT_WEIGHED_GARMENTS;
      return { ...prev, weighedGarments: [...currentList, newGarment] };
    });

    setHasUnsavedChanges(true);
    setShowAddWeighedModal(false);
    setNewWeighedGarment({ name: '', emoji: '👕', group: 'MEN', category: "Men's Wear", targetService: 'all' });
    success('Clothes Sub-Service Added', `"${newGarment.name}" added to weighed catalog.`);
  };

  // Open Edit Weighed Garment Modal
  const handleOpenEditWeighed = (garment) => {
    setEditingWeighedGarment({
      id: garment.id,
      name: garment.name || '',
      emoji: garment.emoji || '👕',
      group: garment.group || 'MEN',
      category: garment.category || "Men's Wear",
      targetService: garment.targetService || 'all',
    });
    setShowEditWeighedModal(true);
  };

  // Save Edit Weighed Garment Sub-Service
  const handleSaveEditWeighed = (e) => {
    e.preventDefault();
    if (!editingWeighedGarment.name.trim()) {
      error('Name Required', 'Clothes sub-service name cannot be empty.');
      return;
    }
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.weighedGarments) && prev.weighedGarments.length > 0
        ? prev.weighedGarments
        : DEFAULT_WEIGHED_GARMENTS;
      const updatedList = currentList.map(g => {
        if (g.id === editingWeighedGarment.id) {
          return {
            ...g,
            name: editingWeighedGarment.name.trim(),
            emoji: editingWeighedGarment.emoji || '👕',
            group: editingWeighedGarment.group || 'MEN',
            category: editingWeighedGarment.category || (editingWeighedGarment.group === 'MEN' ? "Men's Wear" : editingWeighedGarment.group === 'WOMEN' ? "Women's Wear" : editingWeighedGarment.group === 'HOUSEHOLD' ? "Household" : "Kids Wear"),
            targetService: editingWeighedGarment.targetService || 'all',
          };
        }
        return g;
      });
      return { ...prev, weighedGarments: updatedList };
    });
    setShowEditWeighedModal(false);
    success('Clothes Sub-Service Updated', `"${editingWeighedGarment.name}" updated.`);
  };

  // Delete Weighed Garment Sub-Service
  const handleDeleteWeighedGarment = (garmentId) => {
    if (!window.confirm('Remove this clothes sub-service from weighed catalog?')) return;
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const currentList = Array.isArray(prev.weighedGarments) && prev.weighedGarments.length > 0
        ? prev.weighedGarments
        : DEFAULT_WEIGHED_GARMENTS;
      return {
        ...prev,
        weighedGarments: currentList.filter(g => g.id !== garmentId)
      };
    });
    success('Sub-Service Removed', 'Click "Save Changes to Firebase" to broadcast live.');
  };

  // Update Standard Weight
  const handleWeightChange = (gender, itemId, newGrams) => {
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
    setPricingConfig(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        [field]: Number(val) || 0
      }
    }));
  };

  // Add Custom Service Category
  const handleAddCustomService = (e) => {
    e.preventDefault();
    if (!newCustomService.name.trim()) {
      error('Name Required', 'Please enter a name for the custom service category.');
      return;
    }
    const cleanId = `srv-${Date.now()}`;
    const startPrice = Math.max(0, Number(newCustomService.startingPrice) || 0);
    const serviceObj = {
      id: cleanId,
      name: newCustomService.name.trim(),
      title: newCustomService.name.trim(),
      emoji: newCustomService.emoji || '✨',
      icon: newCustomService.emoji || '✨',
      startingPrice: startPrice,
      startingPriceDisplay: startPrice > 0 ? `Starts at ₹${startPrice}` : 'Price on request',
      defaultPrice: startPrice,
      pricingType: newCustomService.pricingType || 'per_item',
      category: newCustomService.category || 'Custom Care',
      shortDescription: newCustomService.description || '',
      subServices: [],
      active: true,
      status: 'published',
    };

    setPricingConfig(prev => ({
      ...prev,
      customServices: [...(Array.isArray(prev.customServices) ? prev.customServices : []), serviceObj]
    }));

    setHasUnsavedChanges(true);
    setNewCustomService({ name: '', emoji: '✨', startingPrice: '', pricingType: 'per_item', category: 'Custom Care', description: '' });
    setShowAddCustomServiceModal(false);
    success('Service Category Created', `"${serviceObj.name}" added to Master Rate Card. Click "Save Changes to Firebase" to broadcast live.`);
  };

  // Open Edit Custom Service Category Modal
  const handleOpenEditCustomService = (service) => {
    setEditingCustomService({
      id: service.id,
      name: service.name || service.title || '',
      emoji: service.emoji || service.icon || '✨',
      startingPrice: service.startingPrice !== undefined ? service.startingPrice : (service.defaultPrice || 0),
      pricingType: service.pricingType || 'per_item',
      category: service.category || 'Custom Care',
      description: service.shortDescription || service.description || '',
    });
    setShowEditCustomServiceModal(true);
  };

  // Save Edit Custom Service Category
  const handleSaveEditCustomService = (e) => {
    e.preventDefault();
    if (!editingCustomService.name.trim()) {
      error('Name Required', 'Category name cannot be empty.');
      return;
    }
    setHasUnsavedChanges(true);
    const startPrice = Math.max(0, Number(editingCustomService.startingPrice) || 0);
    setPricingConfig(prev => {
      const updated = (Array.isArray(prev.customServices) ? prev.customServices : []).map(s => {
        if (s.id === editingCustomService.id) {
          return {
            ...s,
            name: editingCustomService.name.trim(),
            title: editingCustomService.name.trim(),
            emoji: editingCustomService.emoji || '✨',
            icon: editingCustomService.emoji || '✨',
            startingPrice: startPrice,
            startingPriceDisplay: startPrice > 0 ? `Starts at ₹${startPrice}` : 'Price on request',
            defaultPrice: startPrice,
            pricingType: editingCustomService.pricingType || 'per_item',
            category: editingCustomService.category || 'Custom Care',
            shortDescription: editingCustomService.description || '',
          };
        }
        return s;
      });
      return { ...prev, customServices: updated };
    });
    setShowEditCustomServiceModal(false);
    success('Category Updated', `"${editingCustomService.name}" updated. Save to broadcast live.`);
  };

  // Delete Custom Service
  const handleDeleteCustomService = (serviceId) => {
    if (!window.confirm('Are you sure you want to remove this custom service category?')) return;
    setHasUnsavedChanges(true);
    setPricingConfig(prev => ({
      ...prev,
      customServices: (Array.isArray(prev.customServices) ? prev.customServices : []).filter(s => s.id !== serviceId)
    }));
    success('Service Category Removed', 'Click "Save Changes to Firebase" to commit.');
  };

  // Add Sub-Service to Custom Service
  const handleAddSubService = (e) => {
    e.preventDefault();
    if (!newSubService.name.trim() || !targetCustomServiceId) {
      error('Name Required', 'Please enter a sub-service name.');
      return;
    }
    const subObj = {
      id: `sub-${Date.now()}`,
      name: newSubService.name.trim(),
      price: Math.max(0, Number(newSubService.price) || 0),
      emoji: newSubService.emoji || '✨',
      desc: newSubService.desc || '',
    };

    setPricingConfig(prev => {
      const updated = (Array.isArray(prev.customServices) ? prev.customServices : []).map(s => {
        if (s.id === targetCustomServiceId) {
          const subs = Array.isArray(s.subServices) ? s.subServices : [];
          return {
            ...s,
            subServices: [...subs, subObj]
          };
        }
        return s;
      });
      return { ...prev, customServices: updated };
    });

    setHasUnsavedChanges(true);
    setNewSubService({ name: '', price: '', emoji: '✨', desc: '' });
    setShowAddSubServiceModal(false);
    setTargetCustomServiceId(null);
    success('Sub-Service Added', `"${subObj.name}" added successfully.`);
  };

  // Open Edit Sub-Service Modal
  const handleOpenEditSubService = (serviceId, sub) => {
    setEditingSubService({
      serviceId,
      subId: sub.id,
      name: sub.name || '',
      price: sub.price !== undefined ? sub.price : 0,
      emoji: sub.emoji || '✨',
      desc: sub.desc || '',
    });
    setShowEditSubServiceModal(true);
  };

  // Save Edit Sub-Service
  const handleSaveEditSubService = (e) => {
    e.preventDefault();
    if (!editingSubService.name.trim()) {
      error('Name Required', 'Sub-service name cannot be empty.');
      return;
    }
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const updated = (Array.isArray(prev.customServices) ? prev.customServices : []).map(s => {
        if (s.id === editingSubService.serviceId) {
          return {
            ...s,
            subServices: (Array.isArray(s.subServices) ? s.subServices : []).map(sub => {
              if (sub.id === editingSubService.subId) {
                return {
                  ...sub,
                  name: editingSubService.name.trim(),
                  price: Math.max(0, Number(editingSubService.price) || 0),
                  emoji: editingSubService.emoji || '✨',
                  desc: editingSubService.desc || '',
                };
              }
              return sub;
            })
          };
        }
        return s;
      });
      return { ...prev, customServices: updated };
    });
    setShowEditSubServiceModal(false);
    success('Sub-Service Updated', `"${editingSubService.name}" updated.`);
  };

  // Delete Sub-Service from Custom Service
  const handleDeleteSubService = (serviceId, subId) => {
    if (!window.confirm('Remove this sub-service?')) return;
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const updated = (Array.isArray(prev.customServices) ? prev.customServices : []).map(s => {
        if (s.id === serviceId) {
          return {
            ...s,
            subServices: (Array.isArray(s.subServices) ? s.subServices : []).filter(sub => sub.id !== subId)
          };
        }
        return s;
      });
      return { ...prev, customServices: updated };
    });
  };

  // Update Sub-Service Price
  const handleUpdateSubServicePrice = (serviceId, subId, newPrice) => {
    setHasUnsavedChanges(true);
    setPricingConfig(prev => {
      const updated = (Array.isArray(prev.customServices) ? prev.customServices : []).map(s => {
        if (s.id === serviceId) {
          return {
            ...s,
            subServices: (Array.isArray(s.subServices) ? s.subServices : []).map(sub => {
              if (sub.id === subId) {
                return { ...sub, price: Math.max(0, Number(newPrice) || 0) };
              }
              return sub;
            })
          };
        }
        return s;
      });
      return { ...prev, customServices: updated };
    });
  };

  // Save All Changes to Firestore
  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      await pricingService.updatePricingConfig(pricingConfig);
      setHasUnsavedChanges(false);
      
      // Log audit
      try {
        await auditService.logAction({
          action: 'UPDATE_PRICING',
          entity: 'SettingsPricing',
          entityName: 'Master Rate Card',
          user: currentUser,
        });
      } catch (e) {}

      success('Pricing Saved & Broadcasted!', 'All prices, rates, and newly added items synchronized in real-time across website (/pricing, /book-pickup) and all POS counters.');
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
      setHasUnsavedChanges(true);
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

  const tabKey = resolveTabKey(activeTab);
  const currentCategoryList = pricingConfig[tabKey]?.[activeCategory] || (tabKey === 'starch-and-iron' ? (pricingConfig.starchAndIron?.[activeCategory] || []) : []);
  const currentItemList = currentCategoryList.filter(i =>
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
            Manage live prices across Dry Cleaning, Ironing, Starch & Finishing, Per-KG rates, Curtains, Shoes, Carpets, and custom Service Categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={FolderPlus}
            onClick={() => {
              setActiveTab('customServices');
              setShowAddCustomServiceModal(true);
            }}
            className="border-brand-300 text-brand-700 hover:bg-brand-50 font-bold"
          >
            + Add Service Category
          </Button>

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
          { id: 'starch-and-iron', label: '✨ Starch & Iron', desc: 'Starching & form press' },
          { id: 'perKg', label: '🫧 Per-KG Rates', desc: 'Wash & Iron / Fold' },
          { id: 'weights', label: '⚖️ Garment Weights', desc: 'Weight standards (g)' },
          { id: 'special', label: '🪟 Special Services', desc: 'Curtains, Shoes, Carpets, Sarees' },
          { id: 'customServices', label: '⚡ Custom Services', desc: 'Custom categories & sub-items' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setActiveCategory('men');
              setSearchFilter('');
            }}
            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap text-left border cursor-pointer ${
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
      {/* 1. DRY CLEANING, IRONING & STARCH ITEMIZED RATES              */}
      {/* ============================================================ */}
      {(activeTab === 'dryCleaning' || activeTab === 'ironing' || activeTab === 'starch-and-iron') && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            {/* Category Segment (Men / Women / Common) */}
            <div className="flex items-center gap-2">
              {[
                { id: 'men', label: '👨 Men\'s Wear' },
                { id: 'women', label: '👩 Women\'s & Kids' },
                ...(activeTab === 'dryCleaning' || activeTab === 'starch-and-iron' ? [{ id: 'common', label: '🧸 Common & Linens' }] : []),
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

          {/* Item Price Grid with Edit capability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentItemList.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-brand-300 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{item.emoji || '👔'}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.category || activeCategory}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 shadow-2xs">
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
                    title="Edit item details"
                    onClick={() => handleOpenEditItem(activeTab, activeCategory, item)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    title="Remove item"
                    onClick={() => handleDeleteItem(activeTab, activeCategory, item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
      {/* 2. PER-KG SUB-SERVICES & RATE CARDS                          */}
      {/* ============================================================ */}
      {activeTab === 'perKg' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Wash & Fold Sub-Services */}
            <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">👕</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">Wash & Fold Sub-Services</h3>
                    <p className="text-xs text-slate-500">Add, edit, or delete per-KG rates for Wash & Fold</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setNewPerKgSubService({ serviceId: 'wash-and-fold', name: '', price: '', emoji: '👕', description: '' });
                    setShowAddPerKgModal(true);
                  }}
                >
                  + Add Sub-Service
                </Button>
              </div>

              <div className="space-y-3">
                {(Array.isArray(pricingConfig.perKgSubServices) ? pricingConfig.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES)
                  .filter(s => s.serviceId === 'wash-and-fold')
                  .map(sub => (
                    <div key={sub.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-brand-300 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{sub.emoji || '👕'}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">{sub.name}</span>
                          {sub.description && <span className="text-[10px] text-slate-400 block truncate">{sub.description}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
                          <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={sub.price}
                            onChange={(e) => handlePerKgSubPriceChange(sub.id, e.target.value)}
                            className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                          />
                          <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                        </div>

                        <button
                          type="button"
                          title="Edit sub-service"
                          onClick={() => handleOpenEditPerKg(sub)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Remove sub-service"
                          onClick={() => handleDeletePerKgSub(sub.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Wash & Steam Iron Sub-Services */}
            <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🫧</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">Wash & Steam Iron Sub-Services</h3>
                    <p className="text-xs text-slate-500">Add, edit, or delete per-KG rates for Wash & Steam Iron</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setNewPerKgSubService({ serviceId: 'wash-and-iron', name: '', price: '', emoji: '🫧', description: '' });
                    setShowAddPerKgModal(true);
                  }}
                >
                  + Add Sub-Service
                </Button>
              </div>

              <div className="space-y-3">
                {(Array.isArray(pricingConfig.perKgSubServices) ? pricingConfig.perKgSubServices : DEFAULT_PER_KG_SUB_SERVICES)
                  .filter(s => s.serviceId === 'wash-and-iron')
                  .map(sub => (
                    <div key={sub.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-brand-300 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{sub.emoji || '🫧'}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">{sub.name}</span>
                          {sub.description && <span className="text-[10px] text-slate-400 block truncate">{sub.description}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
                          <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={sub.price}
                            onChange={(e) => handlePerKgSubPriceChange(sub.id, e.target.value)}
                            className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                          />
                          <span className="text-xs text-slate-400 ml-1">/ Kg</span>
                        </div>

                        <button
                          type="button"
                          title="Edit sub-service"
                          onClick={() => handleOpenEditPerKg(sub)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Remove sub-service"
                          onClick={() => handleDeletePerKgSub(sub.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

          </div>

          {/* Weighed Clothes Sub-Services Catalog (Tagging & Receipt items for Wash & Fold and Wash & Steam Iron) */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-brand-50 rounded-2xl border border-brand-200 shrink-0">
                  🧺
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Wash & Fold & Wash & Steam Iron Clothes Sub-Services (Tagging & Receipt Catalog)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add, edit, or delete individual garments tallied for clothes tagging & receipts during weighed billing. Synchronizes in real-time to POS & Website.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowAddWeighedModal(true)}
              >
                + Add Clothes Sub-Service
              </Button>
            </div>

            {/* Category Filter Chips & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'ALL', label: 'All Items' },
                  { id: 'MEN', label: '👨 Men\'s Wear' },
                  { id: 'WOMEN', label: '👩 Women\'s Wear' },
                  { id: 'HOUSEHOLD', label: '🏠 Linen & Household' },
                  { id: 'KIDS', label: '👶 Kids Wear' },
                ].map(grp => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setWeighedGroupFilter(grp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      weighedGroupFilter === grp.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search sub-services (e.g. Shirt, Saree)..."
                  value={weighedSearchFilter}
                  onChange={(e) => setWeighedSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>
            </div>

            {/* Weighed Clothes Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(Array.isArray(pricingConfig.weighedGarments) && pricingConfig.weighedGarments.length > 0
                ? pricingConfig.weighedGarments
                : DEFAULT_WEIGHED_GARMENTS
              )
                .filter(g => weighedGroupFilter === 'ALL' || (g.group || 'MEN') === weighedGroupFilter)
                .filter(g => !weighedSearchFilter || g.name.toLowerCase().includes(weighedSearchFilter.toLowerCase()) || (g.category || '').toLowerCase().includes(weighedSearchFilter.toLowerCase()))
                .map(garment => (
                  <div
                    key={garment.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-brand-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{garment.emoji || '👕'}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{garment.name}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded-md bg-white border border-slate-200 truncate">
                            {garment.group || 'MEN'}
                          </span>
                          <span className="text-[10px] text-brand-600 font-medium px-1.5 py-0.5 rounded-md bg-brand-50 truncate">
                            {garment.targetService === 'wash-and-fold' ? 'Fold Only' : garment.targetService === 'wash-and-iron' ? 'Iron Only' : 'Both (All)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit sub-service"
                        onClick={() => handleOpenEditWeighed(garment)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Remove sub-service"
                        onClick={() => handleDeleteWeighedGarment(garment.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
        <div className="space-y-6">
          
          {/* Curtains 4 Sub-Services */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🪟</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Curtain Service (4 Official Sub-Services)</h3>
                  <p className="text-xs text-slate-500">Live per-panel rates across all 4 curtain care treatments</p>
                </div>
              </div>
              <Badge variant="brand">4 Sub-Services</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Dry Cleaning */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧺</span>
                    <span className="text-xs font-bold text-slate-900">Dry Cleaning</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Delicate hydrocarbon solvent cleaning for sheer & blackout curtains</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-600">Rate / Panel:</span>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pricingConfig.curtains?.dryCleaning !== undefined ? pricingConfig.curtains.dryCleaning : 200}
                      onChange={(e) => handleSpecialRateChange('curtains', 'dryCleaning', e.target.value)}
                      className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Wash & Iron */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🫧</span>
                    <span className="text-xs font-bold text-slate-900">Wash & Iron</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Demineralized RO wash + vertical steam hanging press</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-600">Rate / Panel:</span>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pricingConfig.curtains?.washAndIron !== undefined ? pricingConfig.curtains.washAndIron : 150}
                      onChange={(e) => handleSpecialRateChange('curtains', 'washAndIron', e.target.value)}
                      className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Iron */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="text-xs font-bold text-slate-900">Iron</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">High-pressure vertical steam press & crease removal</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-600">Rate / Panel:</span>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pricingConfig.curtains?.iron !== undefined ? pricingConfig.curtains.iron : 60}
                      onChange={(e) => handleSpecialRateChange('curtains', 'iron', e.target.value)}
                      className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Wash & Fold */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👕</span>
                    <span className="text-xs font-bold text-slate-900">Wash & Fold</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Hygienic drum laundry wash, drying & precision fold</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-600">Rate / Panel:</span>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1.5">
                    <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={pricingConfig.curtains?.washAndFold !== undefined ? pricingConfig.curtains.washAndFold : 100}
                      onChange={(e) => handleSpecialRateChange('curtains', 'washAndFold', e.target.value)}
                      className="w-16 text-xs font-black text-slate-900 text-right focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* Shoes, Carpets & Sarees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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

            {/* Saree Rolling & Polishing */}
            <Card className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <span className="text-2xl">🥻</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Saree Rolling & Polish</h3>
                  <p className="text-[11px] text-slate-400">Per Saree Rate</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Rate / Saree:</span>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-3 py-1">
                  <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={pricingConfig.sareeRolling?.rate || 150}
                    onChange={(e) => handleSpecialRateChange('sareeRolling', 'rate', e.target.value)}
                    className="w-14 text-xs font-bold text-slate-900 text-right focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CUSTOM SERVICE CATEGORIES & SUB-SERVICES CATALOG          */}
      {/* ============================================================ */}
      {activeTab === 'customServices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <span>⚡</span> Custom Service Categories & Dynamic Sub-Services
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create bespoke service categories (e.g. VIP Couture, Bag Spa, Leather Treatment) with custom pricing & sub-services. Synchronizes in real-time to POS counters and Public Website.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={FolderPlus}
              onClick={() => setShowAddCustomServiceModal(true)}
            >
              + Create Service Category
            </Button>
          </div>

          {/* List of Custom Services */}
          {(pricingConfig.customServices || []).length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xs">
                ✨
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">No Custom Service Categories Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button below to create your first custom service category (like "Gopi Care", "Shoe & Sneaker Spa", or "Leather Treatment") and attach its sub-services.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowAddCustomServiceModal(true)}
              >
                Create First Custom Category
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {(pricingConfig.customServices || []).map(service => (
                <Card key={service.id} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-5">
                  
                  {/* Custom Service Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2.5 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
                        {service.emoji || '✨'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 font-display">
                            {service.name || service.title}
                          </h4>
                          <Badge variant="brand">
                            {service.pricingType === 'per_kg' ? 'Per-KG' : 'Itemized'}
                          </Badge>
                          <Badge variant="neutral">
                            {service.category || 'Custom Care'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Base rate: <span className="font-bold text-slate-900">₹{service.startingPrice !== undefined ? service.startingPrice : (service.defaultPrice || 0)}</span> {service.pricingType === 'per_kg' ? '/ Kg' : ''} • {service.subServices?.length || 0} Sub-Services
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Plus}
                        onClick={() => {
                          setTargetCustomServiceId(service.id);
                          setShowAddSubServiceModal(true);
                        }}
                      >
                        Add Sub-Service
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit3}
                        onClick={() => handleOpenEditCustomService(service)}
                      >
                        Edit Category
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteCustomService(service.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Sub-Services Table/Grid */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Sub-Services & Tariffs
                    </div>

                    {(service.subServices || []).length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        No sub-services attached yet. This service will be billed at its base rate (₹{service.startingPrice || 0}). Click "Add Sub-Service" to add specialized options.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {service.subServices.map(sub => (
                          <div
                            key={sub.id}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 group hover:border-brand-300 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{sub.emoji || service.emoji || '✨'}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">{sub.name}</div>
                                {sub.desc && <div className="text-[10px] text-slate-400 truncate">{sub.desc}</div>}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1">
                                <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sub.price}
                                  onChange={(e) => handleUpdateSubServicePrice(service.id, sub.id, e.target.value)}
                                  className="w-16 text-xs font-bold text-slate-900 text-right focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                title="Edit sub-service"
                                onClick={() => handleOpenEditSubService(service.id, sub)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete sub-service"
                                onClick={() => handleDeleteSubService(service.id, sub.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Add Custom Service Category Modal */}
      {showAddCustomServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>⚡</span> Create New Service Category
            </h3>

            <form onSubmit={handleAddCustomService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Service Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Bridal Spa, Gopi Special Care, Leather Spa"
                  value={newCustomService.name}
                  onChange={(e) => setNewCustomService({ ...newCustomService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Starting Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="150"
                    value={newCustomService.startingPrice}
                    onChange={(e) => setNewCustomService({ ...newCustomService, startingPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={newCustomService.emoji}
                    onChange={(val) => setNewCustomService({ ...newCustomService, emoji: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Pricing Model</label>
                  <select
                    value={newCustomService.pricingType}
                    onChange={(e) => setNewCustomService({ ...newCustomService, pricingType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  >
                    <option value="per_item">Itemized (Per Piece)</option>
                    <option value="per_kg">Weighed (Per Kg)</option>
                    <option value="custom">Fixed Treatment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category Tag</label>
                  <input
                    type="text"
                    placeholder="Special Care"
                    value={newCustomService.category}
                    onChange={(e) => setNewCustomService({ ...newCustomService, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Short Description</label>
                <textarea
                  rows="2"
                  placeholder="Specialized treatment for delicate items..."
                  value={newCustomService.description}
                  onChange={(e) => setNewCustomService({ ...newCustomService, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddCustomServiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Custom Service Category Modal */}
      {showEditCustomServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>✏️</span> Edit Service Category
            </h3>

            <form onSubmit={handleSaveEditCustomService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCustomService.name}
                  onChange={(e) => setEditingCustomService({ ...editingCustomService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Starting Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingCustomService.startingPrice}
                    onChange={(e) => setEditingCustomService({ ...editingCustomService, startingPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={editingCustomService.emoji}
                    onChange={(val) => setEditingCustomService({ ...editingCustomService, emoji: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Pricing Model</label>
                  <select
                    value={editingCustomService.pricingType}
                    onChange={(e) => setEditingCustomService({ ...editingCustomService, pricingType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  >
                    <option value="per_item">Itemized (Per Piece)</option>
                    <option value="per_kg">Weighed (Per Kg)</option>
                    <option value="custom">Fixed Treatment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category Tag</label>
                  <input
                    type="text"
                    value={editingCustomService.category}
                    onChange={(e) => setEditingCustomService({ ...editingCustomService, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Short Description</label>
                <textarea
                  rows="2"
                  value={editingCustomService.description}
                  onChange={(e) => setEditingCustomService({ ...editingCustomService, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowEditCustomServiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sub-Service Modal */}
      {showAddSubServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>➕</span> Add Sub-Service / Option
            </h3>

            <form onSubmit={handleAddSubService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Conditioning, Gold Polish"
                  value={newSubService.name}
                  onChange={(e) => setNewSubService({ ...newSubService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="120"
                    value={newSubService.price}
                    onChange={(e) => setNewSubService({ ...newSubService, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={newSubService.emoji}
                    onChange={(val) => setNewSubService({ ...newSubService, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hand scrub with organic conditioner"
                  value={newSubService.desc}
                  onChange={(e) => setNewSubService({ ...newSubService, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddSubServiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add Sub-Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sub-Service Modal */}
      {showEditSubServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>✏️</span> Edit Sub-Service
            </h3>

            <form onSubmit={handleSaveEditSubService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service Name *</label>
                <input
                  type="text"
                  required
                  value={editingSubService.name}
                  onChange={(e) => setEditingSubService({ ...editingSubService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingSubService.price}
                    onChange={(e) => setEditingSubService({ ...editingSubService, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={editingSubService.emoji}
                    onChange={(val) => setEditingSubService({ ...editingSubService, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={editingSubService.desc}
                  onChange={(e) => setEditingSubService({ ...editingSubService, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowEditSubServiceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Sub-Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Add New Garment Item to {activeTab === 'dryCleaning' ? 'Dry Cleaning' : activeTab === 'ironing' ? 'Ironing' : 'Starch & Iron'} ({activeCategory})
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

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="90"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={newItem.emoji}
                    onChange={(val) => setNewItem({ ...newItem, emoji: val })}
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

      {/* Edit Item Modal */}
      {showEditItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>✏️</span> Edit Garment Item Details
            </h3>

            <form onSubmit={handleSaveEditItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={editingItem.emoji}
                    onChange={(val) => setEditingItem({ ...editingItem, emoji: val })}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowEditItemModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Per-KG Sub-Service Modal */}
      {showAddPerKgModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>➕</span> Add Per-KG Sub-Service Rate ({newPerKgSubService.serviceId === 'wash-and-fold' ? 'Wash & Fold' : 'Wash & Steam Iron'})
            </h3>

            <form onSubmit={handleAddPerKgSubService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blankets & Heavy Wear, Household Linens, Express 24h"
                  value={newPerKgSubService.name}
                  onChange={(e) => setNewPerKgSubService({ ...newPerKgSubService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rate per Kg (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="120"
                    value={newPerKgSubService.price}
                    onChange={(e) => setNewPerKgSubService({ ...newPerKgSubService, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={newPerKgSubService.emoji}
                    onChange={(val) => setNewPerKgSubService({ ...newPerKgSubService, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bedsheets, Blankets, Heavy Loads"
                  value={newPerKgSubService.description}
                  onChange={(e) => setNewPerKgSubService({ ...newPerKgSubService, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddPerKgModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add Sub-Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Per-KG Sub-Service Modal */}
      {showEditPerKgModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>✏️</span> Edit Per-KG Sub-Service Details
            </h3>

            <form onSubmit={handleSaveEditPerKg} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service Name *</label>
                <input
                  type="text"
                  required
                  value={editingPerKgSubService.name}
                  onChange={(e) => setEditingPerKgSubService({ ...editingPerKgSubService, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rate per Kg (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPerKgSubService.price}
                    onChange={(e) => setEditingPerKgSubService({ ...editingPerKgSubService, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold h-10"
                  />
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={editingPerKgSubService.emoji}
                    onChange={(val) => setEditingPerKgSubService({ ...editingPerKgSubService, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={editingPerKgSubService.description}
                  onChange={(e) => setEditingPerKgSubService({ ...editingPerKgSubService, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowEditPerKgModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Weighed Garment Sub-Service Modal */}
      {showAddWeighedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>🧺</span> Add Weighed Clothes Sub-Service
            </h3>

            <form onSubmit={handleAddWeighedGarment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Shirt, Silk Saree, Kids Frock"
                  value={newWeighedGarment.name}
                  onChange={(e) => setNewWeighedGarment({ ...newWeighedGarment, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Garment Group *</label>
                  <select
                    value={newWeighedGarment.group}
                    onChange={(e) => setNewWeighedGarment({
                      ...newWeighedGarment,
                      group: e.target.value,
                      category: e.target.value === 'MEN' ? "Men's Wear" : e.target.value === 'WOMEN' ? "Women's Wear" : e.target.value === 'HOUSEHOLD' ? "Household" : "Kids Wear"
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium h-10"
                  >
                    <option value="MEN">👨 Men's Wear</option>
                    <option value="WOMEN">👩 Women's Wear</option>
                    <option value="HOUSEHOLD">🏠 Linen & Household</option>
                    <option value="KIDS">👶 Kids Wear</option>
                  </select>
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={newWeighedGarment.emoji}
                    onChange={(val) => setNewWeighedGarment({ ...newWeighedGarment, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Service</label>
                <select
                  value={newWeighedGarment.targetService}
                  onChange={(e) => setNewWeighedGarment({ ...newWeighedGarment, targetService: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                >
                  <option value="all">All (Wash & Fold + Wash & Steam Iron)</option>
                  <option value="wash-and-fold">Wash & Fold Only</option>
                  <option value="wash-and-iron">Wash & Steam Iron Only</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddWeighedModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Add Sub-Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Weighed Garment Sub-Service Modal */}
      {showEditWeighedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span>✏️</span> Edit Weighed Clothes Sub-Service
            </h3>

            <form onSubmit={handleSaveEditWeighed} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sub-Service / Item Name *</label>
                <input
                  type="text"
                  required
                  value={editingWeighedGarment.name}
                  onChange={(e) => setEditingWeighedGarment({ ...editingWeighedGarment, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Garment Group *</label>
                  <select
                    value={editingWeighedGarment.group}
                    onChange={(e) => setEditingWeighedGarment({
                      ...editingWeighedGarment,
                      group: e.target.value,
                      category: e.target.value === 'MEN' ? "Men's Wear" : e.target.value === 'WOMEN' ? "Women's Wear" : e.target.value === 'HOUSEHOLD' ? "Household" : "Kids Wear"
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium h-10"
                  >
                    <option value="MEN">👨 Men's Wear</option>
                    <option value="WOMEN">👩 Women's Wear</option>
                    <option value="HOUSEHOLD">🏠 Linen & Household</option>
                    <option value="KIDS">👶 Kids Wear</option>
                  </select>
                </div>

                <div>
                  <EmojiPicker
                    label="Emoji Icon"
                    value={editingWeighedGarment.emoji}
                    onChange={(val) => setEditingWeighedGarment({ ...editingWeighedGarment, emoji: val })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Target Service</label>
                <select
                  value={editingWeighedGarment.targetService}
                  onChange={(e) => setEditingWeighedGarment({ ...editingWeighedGarment, targetService: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                >
                  <option value="all">All (Wash & Fold + Wash & Steam Iron)</option>
                  <option value="wash-and-fold">Wash & Fold Only</option>
                  <option value="wash-and-iron">Wash & Steam Iron Only</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowEditWeighedModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Sticky Save Bar on Unsaved Changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4 animate-bounce-subtle">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border-2 border-brand-500/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">⚠️</span>
              <div>
                <div className="text-xs font-black tracking-wide text-amber-400">Unsaved Price Changes</div>
                <div className="text-[11px] text-slate-300">Click Save to broadcast live across Website & all POS Counters</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={isSaving}
              onClick={handleSaveToFirestore}
              className="bg-brand-500 hover:bg-brand-600 text-white font-black shadow-lg shadow-brand-500/30"
            >
              Save Now
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
