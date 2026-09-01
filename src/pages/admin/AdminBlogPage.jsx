import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { BookOpen, Plus, Edit3, Trash2 } from 'lucide-react';

const INITIAL_BLOG = {
  title: '',
  slug: '',
  category: 'Fabric Science',
  author: 'Tech Wash Team',
  readTime: '4 min read',
  featuredImage: '',
  excerpt: '',
  content: '',
  seoTitle: '',
  seoDescription: '',
  status: 'published',
};

export const AdminBlogPage = () => {
  const { currentUser } = useAuth();
  const { success, error } = useToast();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(INITIAL_BLOG);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await cmsService.getItems('blogs');
      setBlogs(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setCurrentBlog({ ...INITIAL_BLOG, id: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setCurrentBlog({ ...b });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentBlog.title.trim() || !currentBlog.content.trim()) {
      error('Fields Required', 'Please provide a title and article body.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = !currentBlog.id;
      const saved = await cmsService.saveItem('blogs', currentBlog);

      await auditService.logAction({
        action: isNew ? 'CREATE' : 'UPDATE',
        entity: 'Blog',
        entityId: saved.id,
        entityName: saved.title,
        user: currentUser,
      });

      success('Article Saved', `${saved.title} saved.`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      error('Save Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await cmsService.deleteItem('blogs', deleteTarget.id);
      await auditService.logAction({
        action: 'DELETE',
        entity: 'Blog',
        entityId: deleteTarget.id,
        entityName: deleteTarget.title,
        user: currentUser,
      });
      success('Article Deleted', 'Blog article removed.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      error('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: 'Article',
      key: 'title',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.featuredImage && (
            <img src={row.featuredImage} alt={val} className="w-12 h-10 rounded-lg object-cover" />
          )}
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{val}</div>
            <div className="text-[11px] text-slate-400 font-mono">/blog/{row.slug}</div>
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
      title: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (val) => <span className="text-xs text-slate-500">{formatDate(val)}</span>,
    },
    {
      title: 'Actions',
      key: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-slate-100"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
        title="Blog & Fabric Care Guides CMS"
        subtitle="Manage educational articles, textile care advice, and organic search SEO content."
        actionLabel="Write New Article"
        actionIcon={Plus}
        onAction={handleOpenCreate}
      />

      <Table
        columns={columns}
        data={blogs}
        isLoading={loading}
        emptyMessage="No blog articles written yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-3xl"
        title={currentBlog.id ? 'Edit Article' : 'Write New Article'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Article Title *"
              required
              placeholder="e.g. Why RO Soft Water Protects Fabric Fibers"
              value={currentBlog.title}
              onChange={(e) => setCurrentBlog({ ...currentBlog, title: e.target.value })}
            />
            <Input
              label="URL Slug"
              placeholder="why-ro-soft-water-protects-fabric-fibers"
              value={currentBlog.slug}
              onChange={(e) => setCurrentBlog({ ...currentBlog, slug: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Category"
              value={currentBlog.category}
              onChange={(e) => setCurrentBlog({ ...currentBlog, category: e.target.value })}
            />
            <Input
              label="Author Name"
              value={currentBlog.author}
              onChange={(e) => setCurrentBlog({ ...currentBlog, author: e.target.value })}
            />
            <Input
              label="Read Time"
              placeholder="e.g. 4 min read"
              value={currentBlog.readTime}
              onChange={(e) => setCurrentBlog({ ...currentBlog, readTime: e.target.value })}
            />
          </div>

          <Input
            label="Featured Image URL"
            placeholder="https://..."
            value={currentBlog.featuredImage}
            onChange={(e) => setCurrentBlog({ ...currentBlog, featuredImage: e.target.value })}
          />

          <Textarea
            label="Short Excerpt Summary *"
            required
            rows={2}
            value={currentBlog.excerpt}
            onChange={(e) => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })}
          />

          <Textarea
            label="Full Article Body Content *"
            required
            rows={8}
            placeholder="Write complete article paragraphs here..."
            value={currentBlog.content}
            onChange={(e) => setCurrentBlog({ ...currentBlog, content: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Publication Status
              </label>
              <select
                value={currentBlog.status}
                onChange={(e) => setCurrentBlog({ ...currentBlog, status: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs"
              >
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Article
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete Article "${deleteTarget?.title}"?`}
        message="This article will be permanently removed."
        isLoading={isDeleting}
      />
    </div>
  );
};
