import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/formatters';
import { BookOpen, ArrowRight, Clock, User } from 'lucide-react';

export const BlogSection = ({ blogs = [] }) => {
  const displayBlogs = blogs.length > 0 ? blogs.filter(b => b.status === 'published') : [
    {
      id: 'blog-1',
      slug: 'why-hard-water-destroys-delicate-fabrics',
      title: 'Why Hard Water Destroys Clothes & How RO Washing Extends Fabric Life',
      category: 'Fabric Science',
      author: 'Tech Wash Care Team',
      createdAt: new Date().toISOString(),
      readTime: '4 min read',
      featuredImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Discover why standard tap water leads to stiff shirts, yellowed collars, and fading colors—and how softened mineral-free water preserves textile brilliance.',
    },
    {
      id: 'blog-2',
      slug: 'the-complete-guide-to-silk-and-zari-dry-cleaning',
      title: 'The Essential Guide to Caring for Bridal Silk Sarees and Wedding Sherwanis',
      category: 'Couture Care',
      author: 'Master Dry Cleaner',
      createdAt: new Date().toISOString(),
      readTime: '5 min read',
      featuredImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Learn the difference between harsh PERC dry cleaning and modern eco-friendly hydrocarbon technology for gold zari and delicate embroidery.',
    },
    {
      id: 'blog-3',
      slug: 'how-to-keep-white-sneakers-pristine',
      title: 'Sneaker Spa 101: Midsole De-Yellowing and Suede Protection',
      category: 'Footwear Care',
      author: 'Sneaker Restoration Lab',
      createdAt: new Date().toISOString(),
      readTime: '3 min read',
      featuredImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      excerpt: 'Step-by-step science of restoring yellowed soles, removing salt stains, and applying breathable hydrophobic nano coatings.',
    }
  ];

  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Garment Knowledge</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Expert Fabric Care Guides
            </h2>
          </div>

          <Link to="/blog">
            <Button variant="secondary" size="md" icon={ArrowRight} iconPosition="right">
              View All Articles
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayBlogs.slice(0, 3).map((blog) => (
            <Card
              key={blog.id}
              variant="luxury"
              className="overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={blog.featuredImage || 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="royal" size="sm">
                      {blog.category || 'Garment Care'}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {blog.readTime || '4 min read'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(blog.createdAt)}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display group-hover:text-brand-600 transition-colors leading-snug mb-2">
                    <Link to={`/blog/${blog.slug || blog.id}`}>
                      {blog.title}
                    </Link>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {blog.excerpt || blog.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  to={`/blog/${blog.slug || blog.id}`}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 inline-flex items-center gap-1.5"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
};
