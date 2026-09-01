import React, { useState, useEffect, useRef } from 'react';
import { mediaService } from '../../services/mediaService';
import { COMPRESSION_TARGETS } from '../../services/imageCompressor';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { 
  Image as ImageIcon, 
  Upload, 
  Copy, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Eye, 
  Filter 
} from 'lucide-react';

export const AdminMediaPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContext, setSelectedContext] = useState('gallery');

  // Upload Progress & Stats State
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);
  
  // Modals
  const [previewMedia, setPreviewMedia] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMedia = async () => {
    try {
      const data = await mediaService.getMediaList({ category: selectedCategory, search: searchQuery });
      setMediaList(data);
    } catch (e) {
      console.warn("Failed to load media:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [selectedCategory, searchQuery]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setCompressionStats(null);

    try {
      const result = await mediaService.uploadAsset(file, {
        category: selectedCategory === 'all' ? 'general' : selectedCategory,
        context: selectedContext,
      });

      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savingsPercent: result.savingsPercent,
      });

      await auditService.logAction({
        action: 'CREATE',
        entity: 'Media',
        entityId: result.id,
        entityName: result.title,
        user: currentUser,
      });

      success(
        'Image Uploaded & Compressed!',
        `Saved ${result.savingsPercent}% (Original: ${formatFileSize(result.originalSize)} → Compressed: ${formatFileSize(result.compressedSize)})`
      );

      loadMedia();
    } catch (err) {
      error('Upload Failed', err.message || 'Image upload error');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    success('URL Copied', 'Asset URL copied to clipboard for CMS reuse.');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await mediaService.deleteAsset(deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Media',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Asset Deleted', 'Media file was removed.');
      setDeleteTarget(null);
      loadMedia();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Central Media Library"
        subtitle="Upload, optimize, and reuse compressed WebP assets across all CMS modules without duplicating storage."
      />

      {/* Upload Zone Card */}
      <Card variant="luxury" className="p-6 sm:p-8 bg-white border-2 border-dashed border-brand-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Web Worker Compression</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Upload New High-Resolution Image
            </h3>
            <p className="text-xs text-slate-500 max-w-lg">
              Select an image type context. Our pipeline compresses it on the client side preserving crystal clarity before CDN delivery.
            </p>
          </div>

          {/* Context Selector & Upload Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-brand-500"
            >
              {Object.entries(COMPRESSION_TARGETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />

            <Button
              variant="primary"
              size="md"
              icon={Upload}
              isLoading={isCompressing}
              onClick={() => fileInputRef.current?.click()}
            >
              Select & Upload Image
            </Button>
          </div>
        </div>

        {/* Compression Feedback Banner if recent */}
        {compressionStats && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Optimization Result: Original {formatFileSize(compressionStats.originalSize)} → Compressed{' '}
                <strong>{formatFileSize(compressionStats.compressedSize)}</strong>
              </span>
            </span>
            <Badge variant="emerald" size="sm">
              Saved {compressionStats.savingsPercent}%
            </Badge>
          </div>
        )}
      </Card>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {['all', 'general', 'services', 'banners', 'gallery', 'blog', 'stores'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="aspect-square bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No media assets in this category</h4>
          <p className="text-xs text-slate-400">Upload your first compressed asset using the upload box above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((item) => (
            <Card
              key={item.id}
              variant="luxury"
              className="overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative aspect-square bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setPreviewMedia(item)}>
                <img
                  src={item.thumbUrl || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="p-2 rounded-xl bg-white/90 text-slate-900 shadow-md">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>

                <div className="absolute top-2 left-2">
                  <Badge variant="slate" size="sm">{item.category}</Badge>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {item.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatFileSize(item.compressedSize)}</span>
                  {item.savingsPercent > 0 && (
                    <span className="text-emerald-600 font-bold">-{item.savingsPercent}%</span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    icon={Copy}
                    onClick={() => copyUrl(item.url)}
                  >
                    Copy URL
                  </Button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
        maxWidth="max-w-3xl"
        title={previewMedia?.title || 'Media Preview'}
      >
        {previewMedia && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-[60vh] flex items-center justify-center">
              <img
                src={previewMedia.url}
                alt={previewMedia.title}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Asset URL:</span>
                <span className="font-mono text-brand-700 truncate max-w-sm">{previewMedia.url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Size:</span>
                <span>{formatFileSize(previewMedia.originalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Optimized WebP Size:</span>
                <span className="font-bold text-emerald-600">{formatFileSize(previewMedia.compressedSize)} (Saved {previewMedia.savingsPercent}%)</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Media Asset "${deleteTarget?.title}"?`}
        message="This image will be removed from your central library. Any pages using this URL directly will lose their background asset."
        isLoading={isDeleting}
      />

    </div>
  );
};
