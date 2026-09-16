import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { ArrowLeft, Clock, User, Calendar, Share2, Sparkles } from 'lucide-react';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsService.getBlogBySlug(slug)
      .then(setBlog)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[50vh] flex items-center justify-center">
        <AdvancedLogoLoader
          size="md"
          text="Loading Article & Garment Care Guide..."
          subtext="Tech Wash Knowledge Base"
        />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="py-24 max-w-xl mx-auto text-center px-4">
        <h2 className="text-2xl font-bold text-slate-900 font-display">Article Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">This article may have been unlisted or moved.</p>
        <Link to="/blog">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        {/* Article Meta Header */}
        <div className="space-y-4 mb-8">
          <Badge variant="royal" size="md">{blog.category || 'Fabric Care'}</Badge>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 pt-2 border-b border-slate-200 pb-4">
            <span className="font-semibold text-slate-700">{blog.author || 'Tech Wash Team'}</span>
            <span>•</span>
            <span>{formatDate(blog.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {blog.readTime || '4 min read'}
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="rounded-3xl overflow-hidden shadow-luxury border border-slate-200 mb-10 aspect-[16/9] bg-slate-900">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-slate max-w-none bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm leading-relaxed text-slate-700 text-sm sm:text-base whitespace-pre-line space-y-4">
          {blog.content || blog.excerpt || 'Full article content available here.'}
        </div>

        {/* Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold font-display">Need Professional Garment Care?</h3>
            <p className="text-xs text-brand-200 mt-1">Let Tech Wash specialists treat your garments with laboratory precision.</p>
          </div>
          <Link to="/book-pickup">
            <Button variant="primary" size="md" icon={Calendar}>
              Book Pickup
            </Button>
          </Link>
        </div>

      </div>
    </article>
  );
};
