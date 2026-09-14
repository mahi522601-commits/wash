import React, { useState, useEffect } from 'react';
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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { ServicePreviewModal } from '../../components/public/ServicePreviewModal';
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
  Image as ImageIcon 
} from 'lucide-react';

const EDITOR_TABS = [
  { id: 'basic', label: 'Basic Info', icon: Sliders },
  { id: 'pricing', label: 'Pricing & Units', icon: DollarSign },
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
  shortDescription: '',
  detailedDescription: '',
  pricingType: 'per piece',
  startingPrice: 99,
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

  const handleOpenEdit = (srv) => {
    setCurrentService(JSON.parse(JSON.stringify(srv)));
    setActiveTab('basic');
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

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Service',
        entityId: saved.id,
        entityName: saved.title,
        newValue: saved,
        user: currentUser,
      });

      success('Service Saved', `${saved.title} saved successfully.`);
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

  const columns = [
    {
      title: 'Service',
      key: 'title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.heroImage ? (
            <img src={row.heroImage} alt={val} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
              TW
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
            <div className="text-[11px] text-slate-400 font-mono">/services/{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (val) => <Badge variant="royal" size="sm">{val}</Badge>,
    },
    {
      title: 'Pricing Model',
      key: 'startingPrice',
      render: (price, row) => (
        <div>
          <span className="font-bold text-xs text-slate-900">{price ? formatCurrency(price) : 'Quote'}</span>
          <span className="text-[11px] text-slate-400 block">{row.pricingType}</span>
        </div>
      ),
    },
    {
      title: 'Process Stages',
      key: 'processSteps',
      render: (steps) => (
        <span className="text-xs font-semibold text-slate-600">
          {steps ? `${steps.length} Stages` : '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Actions',
      key: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100"
            title="Edit Service"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDuplicate(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-royal-600 hover:bg-slate-100"
            title="Duplicate Service"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
        subtitle="Manage dynamic public service pages, 6-stage garment roadmaps, YouTube embeds, and pricing models."
        actionLabel="Create New Service"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      {/* Sync & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="md">
            {services.length} Services Configured
          </Badge>
          <span className="text-xs text-slate-500 hidden sm:inline">
            • All 8 official garment care offerings synchronized with Firebase
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={Sparkles}
          onClick={handleSeedServices}
          className="text-xs"
        >
          Sync / Restore 8 Default Services
        </Button>
      </div>

      {/* Services Table */}
      <Table
        columns={columns}
        data={services}
        isLoading={loading}
        emptyMessage="No services created yet. Click 'Create New Service' to add your first garment care offering."
      />

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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* TAB 3: MEDIA & COVERS */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                <Input
                  label="Hero Desktop Banner Image URL"
                  placeholder="https://... or choose from Media Library"
                  value={currentService.heroImage}
                  onChange={(e) => setCurrentService({ ...currentService, heroImage: e.target.value })}
                />

                <Input
                  label="Mobile Optimized Image URL (Optional)"
                  placeholder="https://..."
                  value={currentService.mobileImage}
                  onChange={(e) => setCurrentService({ ...currentService, mobileImage: e.target.value })}
                />

                {currentService.heroImage && (
                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Image Preview</span>
                    <img
                      src={currentService.heroImage}
                      alt="Hero preview"
                      className="w-full h-48 rounded-2xl object-cover border border-slate-200"
                    />
                  </div>
                )}
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
