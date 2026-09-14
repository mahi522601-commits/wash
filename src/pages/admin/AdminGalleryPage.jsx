import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Search, 
  CheckCircle2, 
  Layers, 
  ArrowLeftRight 
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Couture & Ethnic',
  'Suits & Blazers',
  'Footwear & Shoes',
  'Steam Ironing',
  'Stain Removal',
  'Silk & Sarees',
  'Household & Curtains',
  'Leather Care',
  'Casual & Formals',
];

const INITIAL_TRANSFORMATION = {
  title: '',
  category: 'Couture & Ethnic',
  imageUrl: '',
  beforeImageUrl: '',
  description: '',
  active: true,
  order: 1,
};

const DEFAULT_PORTFOLIO_ITEMS = [
  {
    id: 'g-1',
    title: 'Bridal Kanjeevaram Saree Roll Polish',
    category: 'Couture & Ethnic',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    beforeImageUrl: '',
    description: 'Restoration of intricate 24k gold zari threads with zero chemical dullness.',
    active: true,
    order: 1,
  },
  {
    id: 'g-2',
    title: 'Italian Wool 2-Piece Blazer Dry Clean',
    category: 'Suits & Blazers',
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
    beforeImageUrl: '',
    description: 'Hydrocarbon solvent extraction with crisp collar crease retention.',
    active: true,
    order: 2,
  },
  {
    id: 'g-3',
    title: 'Designer Suede & Mesh Sneakers Restoration',
    category: 'Footwear & Shoes',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    beforeImageUrl: '',
    description: 'Ultrasonic stain lift and anti-microbial ozone deodorization.',
    active: true,
    order: 3,
  },
  {
    id: 'g-4',
    title: '3D Tension Steam Finishing',
    category: 'Steam Ironing',
    imageUrl: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=800&q=80',
    beforeImageUrl: '',
    description: 'Gentle form steam press without shiny heat marks or seam burns.',
    active: true,
    order: 4,
  }
];

export const AdminGalleryPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(INITIAL_TRANSFORMATION);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      let data = await cmsService.getItems('gallery');
      if (!data || data.length === 0) {
        // Seed default items if empty
        data = DEFAULT_PORTFOLIO_ITEMS;
        for (const it of DEFAULT_PORTFOLIO_ITEMS) {
          await cmsService.saveItem('gallery', it);
        }
      }
      setItems(data);
    } catch (e) {
      console.warn("Error loading gallery items:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setCurrentItem({
      ...INITIAL_TRANSFORMATION,
      id: null,
      order: items.length + 1,
    });
    setEditorOpen(true);
  };

  const handleOpenEdit = (it) => {
    setCurrentItem({
      ...it,
      category: it.category || 'Couture & Ethnic',
      beforeImageUrl: it.beforeImageUrl || '',
      imageUrl: it.imageUrl || it.afterImageUrl || '',
      active: it.active !== false,
      order: it.order || 1,
    });
    setEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!currentItem.title.trim()) {
      error('Title Required', 'Please enter a title for this transformation.');
      return;
    }

    if (!currentItem.imageUrl && !currentItem.afterImageUrl) {
      error('Image Required', 'Please upload or provide at least the main transformed image.');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !currentItem.id;
      const payload = {
        ...currentItem,
        imageUrl: currentItem.imageUrl || currentItem.afterImageUrl,
        afterImageUrl: currentItem.imageUrl || currentItem.afterImageUrl,
        beforeImageUrl: currentItem.beforeImageUrl || '',
        order: Number(currentItem.order) || 1,
        active: Boolean(currentItem.active),
      };

      const saved = await cmsService.saveItem('gallery', payload);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Gallery Transformation',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success(
        isNew ? 'Transformation Added!' : 'Transformation Updated!',
        `"${saved.title}" has been saved and will appear in the home section.`
      );

      setEditorOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      error('Save Failed', err.message || 'Could not save transformation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await cmsService.deleteItem('gallery', deleteTarget.id);

      await auditService.logAction({
        action: 'DELETE',
        entity: 'Gallery Transformation',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });

      success('Transformation Deleted', `Removed "${deleteTarget.title}"`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      error('Delete Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const updated = { ...item, active: !item.active };
      await cmsService.saveItem('gallery', updated);
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      success('Status Updated', `"${item.title}" is now ${updated.active ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      error('Update Failed', err.message);
    }
  };

  const categories = ['ALL', ...new Set(items.map((i) => i.category).filter(Boolean))];

  const filteredItems = items.filter((it) => {
    const matchesCat = selectedCategory === 'ALL' || it.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      (it.title && it.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (it.category && it.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <AdminPageHeader
        title="Before & After Transformations"
        description="Upload and manage customer fabric transformation images shown on the Home Page and Gallery showcase. Uploaded images are compressed to crystal-clear HD under 100 KB."
        action={
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            Add Transformation
          </Button>
        }
      />

      {/* 2. STATS & CONTROL BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{items.length}</div>
            <div className="text-xs font-semibold text-slate-500">Total Transformations</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">
              {items.filter((i) => i.active !== false).length}
            </div>
            <div className="text-xs font-semibold text-slate-500">Live on Home Page</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">
              {new Set(items.map((i) => i.category)).size}
            </div>
            <div className="text-xs font-semibold text-slate-500">Active Categories</div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, description, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TRANSFORMATIONS TABLE / GRID */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading gallery items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No transformations found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `No items match "${searchQuery}". Try clearing your search.`
              : 'Click "Add Transformation" to upload your first before/after photo from local storage or presets.'}
          </p>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            Add Transformation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Photo Preview Container */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  <img
                    src={item.imageUrl || item.afterImageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-extrabold text-slate-900 shadow-xs">
                      {item.category || 'Transformation'}
                    </span>
                  </div>

                  {/* Dual Image Indicator */}
                  {item.beforeImageUrl && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Before & After</span>
                    </div>
                  )}

                  {/* Order Badge */}
                  <div className="absolute bottom-3 left-3 text-[11px] font-bold text-white/90">
                    Order #{item.order || idx + 1}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                        item.active !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {item.active !== false ? 'Live' : 'Hidden'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>

                  {/* Before photo small strip if available */}
                  {item.beforeImageUrl && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                      <img
                        src={item.beforeImageUrl}
                        alt="Before"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <span className="font-semibold text-slate-700">Before treatment photo included</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit3}
                  onClick={() => handleOpenEdit(item)}
                  className="flex-1 mr-2"
                >
                  Edit Photo
                </Button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  title="Delete transformation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD / EDIT TRANSFORMATION MODAL */}
      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={currentItem.id ? 'Edit Transformation' : 'Add New Transformation'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transformation Title *"
              required
              placeholder="e.g. Bridal Kanjeevaram Saree Roll Polish"
              value={currentItem.title}
              onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={currentItem.category}
                onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary / After Transformed Image */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Primary / Transformed Image (After Care) *</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Auto-Compressed to HD ≤ 100 KB
              </span>
            </div>
            
            <ImageUpload
              label="Transformed Image"
              value={currentItem.imageUrl || currentItem.afterImageUrl || ''}
              onChange={(url) => setCurrentItem({ ...currentItem, imageUrl: url, afterImageUrl: url })}
              serviceSlug={currentItem.category?.toLowerCase() || 'gallery'}
              helperText="Upload high-res photo from your computer (auto-compressed to HD < 100 KB), choose curated presets, or paste a URL."
            />
          </div>

          {/* Optional Before Processing Image */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                <span>Before Processing Image (Optional)</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                Enables Before & After Dual Comparison
              </span>
            </div>

            <ImageUpload
              label="Before Treatment Photo"
              value={currentItem.beforeImageUrl || ''}
              onChange={(url) => setCurrentItem({ ...currentItem, beforeImageUrl: url })}
              serviceSlug="before_gallery"
              helperText="Upload the item condition prior to cleaning (e.g. stains, wrinkles, dust). Compressed to HD < 100 KB."
            />
          </div>

          {/* Short Description */}
          <Textarea
            label="Restoration & Craftsmanship Details"
            rows={2}
            placeholder="e.g. Ultrasonic stain lift, RO soft water fiber rinse, and computerized tension steam finishing."
            value={currentItem.description}
            onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
          />

          {/* Order & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Input
              label="Display Order"
              type="number"
              min="1"
              value={currentItem.order}
              onChange={(e) => setCurrentItem({ ...currentItem, order: parseInt(e.target.value) || 1 })}
            />

            <div className="pt-5">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={currentItem.active}
                  onChange={(e) => setCurrentItem({ ...currentItem, active: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Visible on Home Page & Gallery Showcase
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
              icon={CheckCircle2}
            >
              {currentItem.id ? 'Update Transformation' : 'Save Transformation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Transformation?"
        message={`Are you sure you want to remove "${deleteTarget?.title}"? This photo will be removed from the Home Page and Gallery showcase.`}
        confirmText="Yes, Delete Photo"
        variant="danger"
      />
    </div>
  );
};
