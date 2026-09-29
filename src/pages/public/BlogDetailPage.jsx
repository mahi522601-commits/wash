import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cmsService } from '../../services/cmsService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { ArrowLeft, Clock, User, Calendar, Share2, Sparkles, MapPin } from 'lucide-react';
import { AdvancedLogoLoader } from '../../components/common/AdvancedLogoLoader';
import { SEOHead } from '../../components/seo/SEOHead';
import { BreadcrumbNav } from '../../components/public/BreadcrumbNav';
import { BASE_URL, BUSINESS_INFO } from '../../data/seoData';

const DEFAULT_ARTICLE_CONTENT = {
  'why-hard-water-destroys-delicate-fabrics': {
    title: 'Why Hard Water Destroys Clothes & How RO Soft Washing Extends Fabric Life',
    category: 'Fabric Science',
    author: 'Techwash Fabric Specialist',
    readTime: '5 min read',
    featuredImage: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          High mineral hardness in tap water (often exceeding 300–500 PPM TDS across Hyderabad neighborhoods like Manikonda, Puppalaguda, and Gachibowli) is the single biggest cause of fabric stiffening, dull color loss, and early garment fraying.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">1. The Chemical Impact of Calcium & Magnesium Salts</h2>
        <p>
          When detergent mixes with hard groundwater, dissolved calcium and magnesium ions bind with soap molecules to create insoluble scum residues. Instead of rinsing away cleanly, this microscopic mineral chalk coats fabric fibers, locking in perspiration stains and making cotton shirts feel rough against the skin.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">2. Why Domestic Washing Machines Cannot Fix Hard Water</h2>
        <p>
          Standard home washing machines recirculate hard tap water throughout the rinse cycle. Over time, salt deposits crystallize inside garment weaves, causing threads to snap under mechanical tension. Colors appear washed-out after just 5 to 10 washes.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">3. Techwash 0 PPM Demineralized RO Soft Water Solution</h2>
        <p>
          At Techwash Laundry, every wash cycle uses 100% demineralized 0 PPM RO soft water combined with bio-enzyme botanical cleansers in isolated single-customer drums. This preserves natural cotton oils, prevents collar yellowing, and extends garment lifespan by up to 3x.
        </p>

        <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F97316]" />
            <span>Looking for Soft Water Garment Care near Manikonda?</span>
          </h3>
          <p className="text-sm text-slate-600">
            Schedule a scheduled doorstep pickup for daily clothes and office wear:
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link 
              to="/areas/manikonda/wash-and-iron" 
              className="text-xs font-bold text-[#F97316] hover:underline bg-white px-3 py-1.5 rounded-lg border border-brand-200"
            >
              Wash & Iron Service in Manikonda →
            </Link>
            <Link 
              to="/areas/manikonda/laundry-service" 
              className="text-xs font-bold text-[#F97316] hover:underline bg-white px-3 py-1.5 rounded-lg border border-brand-200"
            >
              Laundry Service in Manikonda →
            </Link>
          </div>
        </div>
      </div>
    )
  },
  'the-complete-guide-to-silk-and-zari-dry-cleaning': {
    title: 'The Essential Guide to Caring for Bridal Silk Sarees and Wedding Sherwanis',
    category: 'Couture Care',
    author: 'Master Dry Cleaner',
    readTime: '6 min read',
    featuredImage: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          Traditional Kanchipuram silk sarees, Banarasi weaves, and heavy metallic zari sherwanis represent prized heritage wardrobes that demand specialized eco-friendly dry cleaning.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">1. Why PERC Chemicals Tarnishing Real Gold & Silver Zari</h2>
        <p>
          Conventional commercial dry cleaners often use perchloroethylene (PERC), a harsh chlorinated solvent. PERC strips natural silk proteins and oxidizes real silver and gold zari threads, leaving dark metallic spots and chemical odors on heritage sarees.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">2. Non-Toxic Hydrocarbon Solvents & Wooden Roller Pressing</h2>
        <p>
          Techwash employs certified 100% non-toxic European hydrocarbon solvents with zero PERC. Silk fibers remain soft, vibrant, and odorless. For sarees, smooth wooden cylinder roller polishing restores natural shine without flattening delicate zari embroidery.
        </p>

        <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F97316]" />
            <span>Schedule Silk & Couture Dry Cleaning in Manikonda</span>
          </h3>
          <p className="text-sm text-slate-600">
            Book protective hydrocarbon dry cleaning or traditional saree rolling:
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link 
              to="/areas/manikonda/dry-cleaning" 
              className="text-xs font-bold text-[#F97316] hover:underline bg-white px-3 py-1.5 rounded-lg border border-brand-200"
            >
              Dry Cleaning Service in Manikonda →
            </Link>
            <Link 
              to="/areas/manikonda/saree-rolling" 
              className="text-xs font-bold text-[#F97316] hover:underline bg-white px-3 py-1.5 rounded-lg border border-brand-200"
            >
              Saree Rolling Service in Manikonda →
            </Link>
          </div>
        </div>
      </div>
    )
  },
  'how-to-keep-white-sneakers-pristine': {
    title: 'Sneaker Spa 101: Midsole De-Yellowing and Suede Protection',
    category: 'Footwear Care',
    author: 'Sneaker Restoration Lab',
    readTime: '4 min read',
    featuredImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          White leather sneakers, canvas shoes, and premium suede trainers absorb street grime and undergo UV rubber oxidation, causing unsightly midsole yellowing.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">1. Why Machine Washing Ruins Sneakers</h2>
        <p>
          Throwing sneakers into a home washing machine dissolves internal shoe glues, distorts heel counters, and causes leather finish cracking. Suede uppers harden into rough sandpaper when soaked in water.
        </p>

        <h2 className="text-2xl font-black text-slate-900 font-display">2. Professional Ultrasonic Hand Scrubbing & Anti-Microbial UV Sterilization</h2>
        <p>
          At Techwash Sneaker Spa, every pair is hand-scrubbed using soft-bristle horsehair brushes and material-specific bio-cleaners. Mid-soles undergo optical de-yellowing, followed by 360° UV-C anti-bacterial sterilization to eliminate odor-causing bacteria.
        </p>

        <div className="p-6 rounded-2xl bg-brand-50 border border-brand-200 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F97316]" />
            <span>Restore Your Shoes in Manikonda</span>
          </h3>
          <p className="text-sm text-slate-600">
            Professional doorstep sneaker and leather shoe deep cleaning:
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link 
              to="/areas/manikonda/shoe-cleaning" 
              className="text-xs font-bold text-[#F97316] hover:underline bg-white px-3 py-1.5 rounded-lg border border-brand-200"
            >
              Shoe Cleaning Service in Manikonda →
            </Link>
          </div>
        </div>
      </div>
    )
  }
};

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsService.getBlogBySlug(slug)
      .then((res) => {
        if (res) {
          setBlog(res);
        } else if (DEFAULT_ARTICLE_CONTENT[slug]) {
          setBlog({
            id: slug,
            slug: slug,
            ...DEFAULT_ARTICLE_CONTENT[slug],
            createdAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        if (DEFAULT_ARTICLE_CONTENT[slug]) {
          setBlog({
            id: slug,
            slug: slug,
            ...DEFAULT_ARTICLE_CONTENT[slug],
            createdAt: new Date().toISOString(),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[50vh] flex items-center justify-center">
        <AdvancedLogoLoader
          size="md"
          text="Loading Article & Garment Care Guide..."
          subtext="Techwash Knowledge Base"
        />
      </div>
    );
  }

  if (!blog) {
    return (
      <>
        <SEOHead 
          title="Article Not Found | Techwash" 
          description="The requested article was not found." 
          noindex={true} 
        />
        <div className="py-24 max-w-xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold text-slate-900 font-display">Article Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">This article may have been unlisted or moved.</p>
          <Link to="/blog">
            <Button variant="primary" size="md" icon={ArrowLeft}>
              Back to Blog
            </Button>
          </Link>
        </div>
      </>
    );
  }

  const defaultDetails = DEFAULT_ARTICLE_CONTENT[blog.slug] || {};
  const pageTitle = `${blog.title} | Techwash Blog`;
  const pageDesc = blog.excerpt || blog.summary || blog.title;
  const pageCanonical = `${BASE_URL}/blog/${blog.slug || blog.id}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${BASE_URL}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: blog.title,
            item: pageCanonical,
          },
        ],
      },
      {
        '@type': 'BlogPosting',
        headline: blog.title,
        description: pageDesc,
        image: blog.featuredImage || defaultDetails.featuredImage || `${BASE_URL}/techwashlogo.webp`,
        datePublished: blog.createdAt,
        dateModified: blog.updatedAt || blog.createdAt,
        author: {
          '@type': 'Person',
          name: blog.author || defaultDetails.author || 'Techwash Fabric Specialist',
        },
        publisher: {
          '@type': 'Organization',
          name: BUSINESS_INFO.name,
          logo: {
            '@type': 'ImageObject',
            url: BUSINESS_INFO.logo,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageCanonical,
        },
      },
    ],
  };

  const articleContent = defaultDetails.content || (
    <div className="whitespace-pre-line">
      {blog.content || blog.excerpt || 'Full article content available here.'}
    </div>
  );

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={pageCanonical}
        ogType="article"
        ogImage={blog.featuredImage || defaultDetails.featuredImage || `${BASE_URL}/techwashlogo.webp`}
        keywords={`${blog.category || 'fabric care'}, laundry hyderabad, dry cleaning tips`}
        structuredData={structuredData}
      />
      <article className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <BreadcrumbNav 
          items={[
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: blog.title }
          ]}
        />

        {/* Article Meta Header */}
        <div className="space-y-4 mb-8">
          <Badge variant="royal" size="md">{blog.category || defaultDetails.category || 'Fabric Care'}</Badge>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
            {blog.title}
          </h1>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 pt-2 border-b border-slate-200 pb-4">
            <span className="font-semibold text-slate-700">{blog.author || defaultDetails.author || 'Techwash Team'}</span>
            <span>•</span>
            <span>{formatDate(blog.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {blog.readTime || defaultDetails.readTime || '4 min read'}
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {(blog.featuredImage || defaultDetails.featuredImage) && (
          <div className="rounded-3xl overflow-hidden shadow-luxury border border-slate-200 mb-10 aspect-[16/9] bg-slate-900">
            <img
              src={blog.featuredImage || defaultDetails.featuredImage}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-sm leading-relaxed text-slate-700 text-sm sm:text-base space-y-4">
          {articleContent}
        </div>

        {/* Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-brand-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl font-bold font-display">Need Professional Garment Care?</h3>
            <p className="text-xs text-brand-200 mt-1">Let Techwash specialists treat your garments with laboratory precision.</p>
          </div>
          <Link to="/book-pickup">
            <Button variant="primary" size="md" icon={Calendar}>
              Book Pickup
            </Button>
          </Link>
        </div>

      </div>
    </article>
    </>
  );
};

