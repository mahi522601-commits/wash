import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { isValidYouTubeUrl } from '../../utils/youtube';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ServicePreviewModal } from '../../components/public/ServicePreviewModal';
import { EmojiPicker } from '../../components/common/EmojiPicker';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { pricingService, isBuiltInStandardService } from '../../services/pricingConfig';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  CheckCircle2, 
  Play, 
  Layers, 
  HelpCircle, 
  Search, 
  Sliders, 
  DollarSign, 
  Image as ImageIcon,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const EDITOR_TABS = [
  { id: 'basic', label: 'Basic Info', icon: Sliders },
  { id: 'pricing', label: 'Pricing & Units', icon: DollarSign },
  { id: 'subservices', label: 'Sub-Services & Tariffs', icon: Layers },
  { id: 'media', label: 'Media & Covers', icon: ImageIcon },
  { id: 'video', label: 'YouTube Video', icon: Play },
  { id: 'features', label: 'Features & Benefits', icon: CheckCircle2 },
  { id: 'process', label: 'Process Steps', icon: Layers },
  { id: 'faqs', label: 'Service FAQs', icon: HelpCircle },
  { id: 'seo', label: 'SEO & Slug', icon: Search },
];

const INITIAL_SERVICE_STATE = {
  title: '',
  slug: '',
  category: 'Dry Cleaning',
  emoji: '🧺',
  icon: '🧺',
  shortDescription: '',
  detailedDescription: '',
  pricingType: 'per piece',
  startingPrice: 99,
  subServices: [],
  heroImage: '',
  mobileImage: '',
  youtubeUrl: '',
  youtubeTitle: '',
  youtubeDescription: '',
  features: ['Fabric-safe cleaning', 'Hygienic processing', '3D steam finishing', 'Doorstep pickup'],
  benefits: ['Preserves fabric luster', 'Zero chemical odor', 'Crisp crease retention'],
  processSteps: [
    {
      stepNumber: '01',
      title: 'Inspection & Sorting',
      bullets: ['Fabric sensitivity analysis', 'Optical pre-spotting inspection']
    },
    {
      stepNumber: '02',
      title: 'Eco Cleaning & Soft Wash',
      bullets: ['RO softened water cycle', 'Gentle bio-enzyme detergents']
    },
    {
      stepNumber: '03',
      title: '3D Steam Finishing & QC',
      bullets: ['Tension form steam pressing', '10-point checklist packaging']
    }
  ],
  faqs: [
    { q: 'What is the turnaround time for this service?', a: 'Standard turnaround is 48 hours. 24-hour express options are available at checkout.' }
  ],
  status: 'published',
  featured: false,
  order: 1,
  seoTitle: '',
  seoDescription: '',
};

export const AdminServicesPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [currentService, setCurrentService] = useState(INITIAL_SERVICE_STATE);
  const [isSaving, setIsSaving] = useState(false);
  
  // Search, filter & view modes
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Bullet input temp state for process steps
  const [newBulletText, setNewBulletText] = useState({});
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newBenefitText, setNewBenefitText] = useState('');

  const loadServices = async () => {
    try {
      const list = await serviceService.getServices({ publishedOnly: false });
      setServices(list);
    } catch (e) {
      console.warn("Failed to load services:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenCreate = () => {
    setCurrentService({
      ...INITIAL_SERVICE_STATE,
      id: null,
      order: services.length + 1,
    });
    setActiveTab('basic');
    setEditorOpen(true);
  };

  const handleOpenEdit = (srv, targetTab = 'basic') => {
    if (!srv) return;
    const cloned = JSON.parse(JSON.stringify(srv));
    setCurrentService({
      ...INITIAL_SERVICE_STATE,
      ...cloned,
      subServices: Array.isArray(cloned.subServices) ? cloned.subServices : [],
      features: Array.isArray(cloned.features) ? cloned.features : INITIAL_SERVICE_STATE.features,
      benefits: Array.isArray(cloned.benefits) ? cloned.benefits : INITIAL_SERVICE_STATE.benefits,
      processSteps: Array.isArray(cloned.processSteps) ? cloned.processSteps : INITIAL_SERVICE_STATE.processSteps,
      faqs: Array.isArray(cloned.faqs) ? cloned.faqs : INITIAL_SERVICE_STATE.faqs,
    });
    setActiveTab(targetTab);
    setEditorOpen(true);
  };

  const handleSeedServices = async () => {
    try {
      setLoading(true);
      const seeded = await serviceService.seedAllDefaultServices();
      setServices(seeded);
      success('Services Synced!', 'All 8 standard services synchronized to Firebase.');
    } catch (err) {
      error('Sync Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (srv) => {
    const duplicated = {
      ...srv,
      id: null,
      title: `${srv.title} (Copy)`,
      slug: `${srv.slug}-copy`,
      order: services.length + 1,
      status: 'draft',
    };
    try {
      const saved = await serviceService.saveService(duplicated);
      await auditService.logAction({
        action: 'CREATE',
        entity: 'Service',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });
      success('Service Duplicated', `Created draft copy: ${saved.title}`);
      loadServices();
    } catch (err) {
      error('Duplicate Error', err.message);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();

    if (!currentService.title.trim()) {
      error('Title Required', 'Please provide a service title.');
      setActiveTab('basic');
      return;
    }

    if (currentService.youtubeUrl && !isValidYouTubeUrl(currentService.youtubeUrl)) {
      error('Invalid YouTube Link', 'Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=XXXX).');
      setActiveTab('video');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !currentService.id;
      const saved = await serviceService.saveService(currentService);

      // Sync custom service / sub-services to pricingConfig ONLY for genuine custom services
      try {
        if (!isBuiltInStandardService(saved)) {
          const currentConfig = await pricingService.getPricingConfig();
          let customList = Array.isArray(currentConfig.customServices) ? currentConfig.customServices : [];
          const srvId = saved.id;
          const existingIdx = customList.findIndex(c => c.id === srvId || c.id === srvId.replace(/^srv-/, ''));

          const customObj = {
            id: srvId,
            name: saved.title || saved.name,
            title: saved.title || saved.name,
            slug: saved.slug,
            startingPrice: Number(saved.startingPrice || 99),
            pricingType: saved.pricingType === 'per kg' ? 'per_kg' : 'per_item',
            emoji: saved.emoji || saved.icon || '✨',
            icon: saved.emoji || saved.icon || '✨',
            categoryTag: saved.category || 'Special Care',
            shortDescription: saved.shortDescription || '',
            subServices: Array.isArray(saved.subServices) ? saved.subServices : [],
          };

          if (existingIdx >= 0) {
            customList[existingIdx] = { ...customList[existingIdx], ...customObj };
          } else {
            customList.push(customObj);
          }

          await pricingService.updatePricingConfig({
            ...currentConfig,
            customServices: customList,
          });
        }
      } catch (e) {
        console.warn("Pricing config sync error:", e);
      }

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Service',
        entityId: saved.id,
        entityName: saved.title,
        newValue: saved,
        user: currentUser,
      });

      success('Service & Sub-Services Saved', `"${saved.title}" saved successfully across Services & POS Billing.`);
      setEditorOpen(false);
      loadServices();
    } catch (err) {
      error('Save Error', err.message || 'Failed to save service.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await serviceService.deleteService(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Service',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Service Deleted', `${deleteTarget.title} was removed.`);
      setDeleteTarget(null);
      loadServices();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Process Step Modifiers
  const addProcessStep = () => {
    const nextNum = currentService.processSteps.length + 1;
    const formattedNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setCurrentService({
      ...currentService,
      processSteps: [
        ...currentService.processSteps,
        {
          stepNumber: formattedNum,
          title: `Step ${nextNum} Title`,
          bullets: ['Add step description detail']
        }
      ]
    });
  };

  const removeProcessStep = (stepIdx) => {
    const updated = currentService.processSteps.filter((_, idx) => idx !== stepIdx);
    setCurrentService({ ...currentService, processSteps: updated });
  };

  const addBulletToStep = (stepIdx) => {
    const text = newBulletText[stepIdx]?.trim();
    if (!text) return;
    const updated = [...currentService.processSteps];
    updated[stepIdx].bullets = [...(updated[stepIdx].bullets || []), text];
    setCurrentService({ ...currentService, processSteps: updated });
    setNewBulletText({ ...newBulletText, [stepIdx]: '' });
  };

  const removeBulletFromStep = (stepIdx, bulletIdx) => {
    const updated = [...currentService.processSteps];
    updated[stepIdx].bullets = updated[stepIdx].bullets.filter((_, bIdx) => bIdx !== bulletIdx);
    setCurrentService({ ...currentService, processSteps: updated });
  };

  // Filtering services
  const filteredServices = services.filter((srv) => {
    const matchesSearch = !searchQuery || 
      (srv.title && srv.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.category && srv.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (srv.slug && srv.slug.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || srv.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...new Set(services.map(s => s.category).filter(Boolean))];

  const columns = [
    {
      title: 'Service & Slug',
      key: 'title',
      className: 'min-w-[240px]',
      render: (val, row) => (
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => handleOpenEdit(row)}
          title="Click to edit service"
        >
          {row.heroImage ? (
            <img src={row.heroImage} alt={val} className="w-11 h-11 rounded-2xl object-cover shadow-2xs group-hover:ring-2 ring-brand-500 transition-all shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              {row.emoji || '🧺'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 flex items-center gap-1.5 transition-colors">
              <span>{val}</span>
              <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-brand-100 text-brand-700 font-bold px-1.5 py-0.5 rounded-md transition-opacity">
                Edit ✏️
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">/services/{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      className: 'min-w-[130px]',
      render: (val) => <Badge variant="royal" size="sm">{val}</Badge>,
    },
    {
      title: 'Starting Rate',
      key: 'startingPrice',
      className: 'min-w-[130px]',
      render: (price, row) => (
        <div>
          <span className="font-bold text-xs text-slate-900">{price ? formatCurrency(price) : 'Quote'}</span>
          <span className="text-[11px] text-slate-400 block capitalize">{row.pricingType || 'per piece'}</span>
        </div>
      ),
    },
    {
      title: 'Sub-Services & Tariffs',
      key: 'subServices',
      className: 'min-w-[150px]',
      render: (subs, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(row, 'subservices');
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          title="Click to view and edit sub-services & tariffs"
        >
          <Layers className="w-3.5 h-3.5 text-brand-600" />
          <span>{Array.isArray(subs) ? `${subs.length} Options` : '0 Options'}</span>
        </button>
      ),
    },
    {
      title: 'Process Stages',
      key: 'processSteps',
      className: 'min-w-[120px]',
      render: (steps, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEdit(row, 'process');
          }}
          className="text-xs font-semibold text-slate-600 hover:text-brand-600 cursor-pointer"
          title="Click to edit 6-stage roadmap"
        >
          {steps ? `${steps.length} Stages` : '—'}
        </button>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      className: 'min-w-[110px]',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Actions',
      key: 'id',
      headerClassName: 'sticky right-0 bg-slate-50/95 backdrop-blur-xs text-right pr-6 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] min-w-[180px]',
      className: 'sticky right-0 bg-white/95 backdrop-blur-xs text-right pr-6 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] min-w-[180px]',
      render: (id, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Edit Service & Tariffs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(row);
            }}
            className="p-1.5 rounded-xl text-slate-500 hover:text-royal-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Duplicate Service"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Service"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Services & Process CMS"
        subtitle="Manage dynamic public service pages, 6-stage garment roadmaps, YouTube embeds, sub-services, and pricing models."
        actionLabel="Create New Service"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Cross-Link Banner between Services CMS and Pricing Master */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            ✨
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Services CMS & Sub-Service Tariffs
            </div>
            <p className="text-[11px] text-slate-600">
              Click <span className="font-bold text-brand-700">"Edit"</span> or click on any row below to configure covers, sub-services, YouTube embeds, and 6-stage care workflows.
            </p>
          </div>
        </div>
        <Link
          to="/admin/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-white px-3.5 py-2 rounded-xl border border-brand-200 shadow-2xs hover:shadow-xs transition-all shrink-0"
        >
          <DollarSign className="w-3.5 h-3.5 text-brand-600" />
          <span>Open Pricing Master (Per-Garment Rates)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Controls Bar: Search, Category Filter, and View Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search services (e.g. Dry Cleaning, Ironing)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle and Restore Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={handleSeedServices}
            className="text-xs"
          >
            Sync 8 Defaults
          </Button>
        </div>
      </div>

      {/* Services Content: TABLE VIEW */}
      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredServices}
          isLoading={loading}
          onRowClick={(row) => handleOpenEdit(row)}
          emptyMessage="No matching services found. Click 'Create New Service' or change your filter."
        />
      ) : (
        /* Services Content: CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((srv) => (
            <Card
              key={srv.id || srv.slug}
              className="p-5 bg-white border border-slate-200/90 rounded-3xl hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-3">
                {/* Card Top: Image / Avatar + Badges */}
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60">
                  {srv.heroImage ? (
                    <img
                      src={srv.heroImage}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-brand-50 text-brand-600">
                      {srv.emoji || '🧺'}
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge variant="royal" size="xs">
                      {srv.category}
                    </Badge>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={srv.status} />
                  </div>
                </div>

                {/* Card Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{srv.emoji || '🧺'}</span>
                    <h3 className="font-bold text-slate-900 text-sm font-display truncate">
                      {srv.title}
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    /services/{srv.slug}
                  </div>
                  {srv.shortDescription && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {srv.shortDescription}
                    </p>
                  )}
                </div>

                {/* Rates & Badges Summary */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">Starting Rate</span>
                    <span className="font-bold text-slate-900">
                      {srv.startingPrice ? formatCurrency(srv.startingPrice) : 'Quote'}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1 capitalize">({srv.pricingType})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(srv, 'subservices')}
                    className="px-2.5 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-bold border border-brand-200 transition-colors"
                    title="Edit sub-services"
                  >
                    {Array.isArray(srv.subServices) ? `${srv.subServices.length} Sub-Services` : '0 Sub-Services'}
                  </button>
                </div>
              </div>

              {/* Card Footer: Prominent Edit Button & Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => handleOpenEdit(srv)}
                  className="w-full justify-center shadow-xs"
                >
                  Edit Service & Tariffs
                </Button>

                <div className="flex items-center justify-between gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Eye}
                    onClick={() => {
                      setCurrentService(srv);
                      setPreviewOpen(true);
                    }}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Copy}
                    onClick={() => handleDuplicate(srv)}
                    className="text-slate-500 hover:text-royal-600"
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Trash2}
                    onClick={() => setDeleteTarget(srv)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TABBED SERVICE EDITOR MODAL */}
      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        maxWidth="max-w-4xl"
        title={currentService.id ? `Edit Service: ${currentService.title}` : 'Create New Garment Service'}
        subtitle="Configure public display, process roadmaps, YouTube video, and pricing rules."
      >
        <div className="space-y-6">
          
          {/* Top Tabs */}
          <Tabs
            tabs={EDITOR_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <form onSubmit={handleSaveService} className="space-y-6">
            
            {/* TAB 1: BASIC INFO */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Service Title *"
                    required
                    placeholder="e.g. Premium Silk Dry Cleaning"
                    value={currentService.title}
                    onChange={(e) => setCurrentService({ ...currentService, title: e.target.value })}
                  />
                  <Input
                    label="URL Slug"
                    placeholder="e.g. premium-silk-dry-cleaning"
                    value={currentService.slug}
                    onChange={(e) => setCurrentService({ ...currentService, slug: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Category
                    </label>
                    <select
                      value={currentService.category}
                      onChange={(e) => setCurrentService({ ...currentService, category: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800"
                    >
                      <option value="Laundry">Laundry</option>
                      <option value="Steam Iron">Steam Iron</option>
                      <option value="Stains Remover">Stains Remover</option>
                      <option value="Dry Cleaning">Dry Cleaning</option>
                      <option value="Apparel Care">Apparel Care</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Household">Household</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Special Care">Special Care</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Status
                    </label>
                    <select
                      value={currentService.status}
                      onChange={(e) => setCurrentService({ ...currentService, status: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800"
                    >
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Hidden)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <Input
                    label="Display Order"
                    type="number"
                    value={currentService.order}
                    onChange={(e) => setCurrentService({ ...currentService, order: Number(e.target.value) })}
                  />

                  <div>
                    <EmojiPicker
                      label="Service Emoji"
                      value={currentService.emoji || currentService.icon || '🧺'}
                      onChange={(val) => setCurrentService({ ...currentService, emoji: val, icon: val })}
                    />
                  </div>
                </div>

                <Textarea
                  label="Short Card Summary Description *"
                  required
                  rows={2}
                  placeholder="Appears on homepage cards and search results..."
                  value={currentService.shortDescription}
                  onChange={(e) => setCurrentService({ ...currentService, shortDescription: e.target.value })}
                />

                <Textarea
                  label="Detailed Service Page Description"
                  rows={4}
                  placeholder="Full in-depth narrative of fabric care, chemistry, and benefits..."
                  value={currentService.detailedDescription}
                  onChange={(e) => setCurrentService({ ...currentService, detailedDescription: e.target.value })}
                />
              </div>
            )}

            {/* TAB 2: PRICING & UNITS */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Starting / Base Price (₹) *"
                    type="number"
                    required
                    value={currentService.startingPrice}
                    onChange={(e) => setCurrentService({ ...currentService, startingPrice: Number(e.target.value) })}
                  />

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Pricing Unit Model *
                    </label>
                    <select
                      value={currentService.pricingType}
                      onChange={(e) => setCurrentService({ ...currentService, pricingType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800"
                    >
                      <option value="per piece">Per Piece</option>
                      <option value="per kg">Per Kg</option>
                      <option value="per pair">Per Pair</option>
                      <option value="starting at">Starting At</option>
                      <option value="fixed package">Fixed Package</option>
                      <option value="custom quote">Custom Quote</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SUB-SERVICES & TARIFFS */}
            {activeTab === 'subservices' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">Sub-Services & Specific Tariffs</h4>
                    <p className="text-xs text-slate-500">
                      Add granular service options (e.g. Dry Cleaning ₹200, Wash & Iron ₹150, Steam Press ₹60).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      const subs = Array.isArray(currentService.subServices) ? currentService.subServices : [];
                      const newSub = {
                        id: `sub-${Date.now()}`,
                        name: 'New Sub-Service Option',
                        price: currentService.startingPrice || 99,
                        emoji: currentService.emoji || '✨',
                        desc: '',
                      };
                      setCurrentService({ ...currentService, subServices: [...subs, newSub] });
                    }}
                  >
                    Add Sub-Service Option
                  </Button>
                </div>

                {(currentService.subServices || []).length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-500 font-medium">
                      No sub-services attached yet to "{currentService.title || 'this service'}".
                    </p>
                    <p className="text-[11px] text-slate-400">
                      This service will use its base rate (₹{currentService.startingPrice || 0}). Click "Add Sub-Service Option" above to create sub-options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {currentService.subServices.map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-brand-300 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-bold text-slate-400">#{sIdx + 1}</span>
                            <input
                              type="text"
                              placeholder="Sub-Service Name (e.g. Silk Polish / Shoe Scrub)"
                              value={sub.name}
                              onChange={(e) => {
                                const subs = [...currentService.subServices];
                                subs[sIdx].name = e.target.value;
                                setCurrentService({ ...currentService, subServices: subs });
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1">
                              <span className="text-xs font-bold text-slate-400 mr-1">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={sub.price}
                                onChange={(e) => {
                                  const subs = [...currentService.subServices];
                                  subs[sIdx].price = Number(e.target.value);
                                  setCurrentService({ ...currentService, subServices: subs });
                                }}
                                className="w-16 text-xs font-bold text-slate-900 text-right focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              title="Delete sub-service"
                              onClick={() => {
                                const subs = currentService.subServices.filter((_, idx) => idx !== sIdx);
                                setCurrentService({ ...currentService, subServices: subs });
                              }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Short description / highlight note (optional)..."
                            value={sub.desc || ''}
                            onChange={(e) => {
                              const subs = [...currentService.subServices];
                              subs[sIdx].desc = e.target.value;
                              setCurrentService({ ...currentService, subServices: subs });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700"
                          />

                          <EmojiPicker
                            label=""
                            value={sub.emoji || '✨'}
                            onChange={(val) => {
                              const subs = [...currentService.subServices];
                              subs[sIdx].emoji = val;
                              setCurrentService({ ...currentService, subServices: subs });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MEDIA & COVERS */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <ImageUpload
                  label="Service Hero Cover Image (Desktop & Cards) *"
                  value={currentService.heroImage}
                  onChange={(newUrl) => setCurrentService({ ...currentService, heroImage: newUrl })}
                  serviceSlug={currentService.slug || 'service'}
                  helperText="Upload an image from your computer / local storage, pick a curated care preset photo, or paste an external URL."
                />

                <div className="pt-4 border-t border-slate-200">
                  <ImageUpload
                    label="Mobile Optimized Cover Image (Optional)"
                    value={currentService.mobileImage}
                    onChange={(newUrl) => setCurrentService({ ...currentService, mobileImage: newUrl })}
                    serviceSlug={`${currentService.slug || 'service'}-mobile`}
                    helperText="Optional vertical / compact image for smartphone views."
                    aspectRatio="aspect-[4/3]"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: YOUTUBE VIDEO */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <Input
                  label="YouTube Video Link (Requirement #13)"
                  placeholder="e.g. https://www.youtube.com/watch?v=XXXX or https://youtu.be/XXXX"
                  value={currentService.youtubeUrl}
                  onChange={(e) => setCurrentService({ ...currentService, youtubeUrl: e.target.value })}
                />

                <Input
                  label="Video Showcase Heading"
                  placeholder="e.g. Behind the Scenes: How We Clean Silk Sarees"
                  value={currentService.youtubeTitle}
                  onChange={(e) => setCurrentService({ ...currentService, youtubeTitle: e.target.value })}
                />

                <Textarea
                  label="Video Description"
                  rows={2}
                  placeholder="Short description under the video player..."
                  value={currentService.youtubeDescription}
                  onChange={(e) => setCurrentService({ ...currentService, youtubeDescription: e.target.value })}
                />
              </div>
            )}

            {/* TAB 5: FEATURES & BENEFITS */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Key Features Checklist
                  </h4>
                  <div className="space-y-2 mb-3">
                    {currentService.features?.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-800">{f}</span>
                        <button
                          type="button"
                          onClick={() => setCurrentService({ ...currentService, features: currentService.features.filter((_, i) => i !== idx) })}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add new feature bullet (e.g. Ultrasonic pre-spotting)"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (newFeatureText.trim()) {
                          setCurrentService({ ...currentService, features: [...(currentService.features || []), newFeatureText.trim()] });
                          setNewFeatureText('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: STRUCTURED PROCESS STEPS WITH DYNAMIC BULLETS */}
            {activeTab === 'process' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">
                      Structured Step-by-Step Care Roadmap
                    </h4>
                    <p className="text-xs text-slate-500">
                      Requirement #14 & #15: Individual steps with title and dynamic bullet points.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" icon={Plus} onClick={addProcessStep}>
                    Add Step
                  </Button>
                </div>

                <div className="space-y-4">
                  {currentService.processSteps?.map((step, sIdx) => (
                    <div key={sIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-black font-mono bg-brand-600 text-white px-2 py-1 rounded-lg">
                            {step.stepNumber}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...currentService.processSteps];
                              updated[sIdx].title = e.target.value;
                              setCurrentService({ ...currentService, processSteps: updated });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                            placeholder="Step Title"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProcessStep(sIdx)}
                          className="text-xs text-rose-600 hover:underline font-bold"
                        >
                          Delete Step
                        </button>
                      </div>

                      {/* Bullets List */}
                      <div className="space-y-1.5 pl-6 border-l-2 border-brand-200 ml-3">
                        {step.bullets?.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-700">• {b}</span>
                            <button
                              type="button"
                              onClick={() => removeBulletFromStep(sIdx, bIdx)}
                              className="text-[11px] text-rose-500 hover:text-rose-700"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {/* Add Bullet to this step */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="+ Add bullet point to this stage..."
                            value={newBulletText[sIdx] || ''}
                            onChange={(e) => setNewBulletText({ ...newBulletText, [sIdx]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                          />
                          <Button variant="outline" size="sm" onClick={() => addBulletToStep(sIdx)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: FAQS */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Service Specific FAQs
                  </h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentService({
                      ...currentService,
                      faqs: [...(currentService.faqs || []), { question: 'New question?', answer: 'Answer detail.' }]
                    })}
                  >
                    + Add FAQ
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentService.faqs?.map((faq, fIdx) => (
                    <div key={fIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">FAQ #{fIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setCurrentService({
                            ...currentService,
                            faqs: currentService.faqs.filter((_, i) => i !== fIdx)
                          })}
                          className="text-xs text-rose-500"
                        >
                          Remove
                        </button>
                      </div>
                      <Input
                        placeholder="Question"
                        value={faq.question || faq.q || ''}
                        onChange={(e) => {
                          const updated = [...currentService.faqs];
                          updated[fIdx] = {
                            ...updated[fIdx],
                            question: e.target.value,
                            q: e.target.value
                          };
                          setCurrentService({ ...currentService, faqs: updated });
                        }}
                      />
                      <Textarea
                        placeholder="Answer"
                        rows={2}
                        value={faq.answer || faq.a || ''}
                        onChange={(e) => {
                          const updated = [...currentService.faqs];
                          updated[fIdx] = {
                            ...updated[fIdx],
                            answer: e.target.value,
                            a: e.target.value
                          };
                          setCurrentService({ ...currentService, faqs: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <Input
                  label="SEO Meta Title"
                  placeholder="e.g. Premium Silk Saree Dry Cleaning in Hyderabad | Tech Wash"
                  value={currentService.seoTitle}
                  onChange={(e) => setCurrentService({ ...currentService, seoTitle: e.target.value })}
                />
                <Textarea
                  label="SEO Meta Description"
                  rows={3}
                  placeholder="Search engine snippet description..."
                  value={currentService.seoDescription}
                  onChange={(e) => setCurrentService({ ...currentService, seoDescription: e.target.value })}
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                icon={Eye}
                onClick={() => setPreviewOpen(true)}
              >
                Live Preview
              </Button>

              <div className="flex items-center gap-3">
                <Button variant="ghost" size="md" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                >
                  Save & Publish Service
                </Button>
              </div>
            </div>

          </form>
        </div>
      </Modal>

      {/* LIVE PREVIEW MODAL */}
      <ServicePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        service={currentService}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This action will remove the service from the public menu and archived catalogs. This cannot be undone."
        isLoading={isDeleting}
      />

    </div>
  );
};
