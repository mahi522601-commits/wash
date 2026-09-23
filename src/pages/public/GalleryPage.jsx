import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Sparkles, Eye, X } from 'lucide-react';
import { SEOHead } from '../../components/seo/SEOHead';
import { BASE_URL } from '../../data/seoData';

export const GalleryPage = () => {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultItems = [
    {
      id: 'g1',
      title: 'Silk Lehenga Dry Cleaning & Gold Foil Preservation',
      category: 'Couture & Ethnic',
      imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80',
      description: 'Zero stain residue on raw silk fabric with delicate gold zari embroidery preserved perfectly.'
    },
    {
      id: 'g2',
      title: '3D Form Steam Pressed Woolen Suit',
      category: 'Steam Ironing',
      imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80',
      description: 'Structured shoulder lapel finishing using computerized tension steam mannequins.'
    },
    {
      id: 'g3',
      title: 'Luxury Leather & Suede Sneaker Restoration',
      category: 'Footwear Care',
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80',
      description: 'Midsole de-yellowing, horsehair foam scrub, and UV-C chamber deodorization.'
    },
    {
      id: 'g4',
      title: 'RO Soft Water Daily Cotton Wash',
      category: 'Laundry',
      imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80',
      description: 'Crisp white shirts washed with bio-enzyme detergents and soft mineral-controlled water.'
    }
  ];

  useEffect(() => {
    cmsService.getItems('gallery', { filterActive: true })
      .then((data) => {
        if (data && data.length > 0) setItems(data);
        else setItems(defaultItems);
      })
      .catch(() => setItems(defaultItems))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category || 'General Care')))];

  const filtered = selectedCategory === 'ALL'
    ? items
    : items.filter(i => (i.category || 'General Care') === selectedCategory);

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
            name: 'Transformation Gallery',
            item: `${BASE_URL}/gallery`,
          },
        ],
      },
      {
        '@type': 'ImageGallery',
        name: 'Tech Wash Garment Care Transformations',
        description: 'Before and after dry cleaning, sneaker restoration, and steam pressing gallery from Tech Wash Hyderabad.',
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Garment Transformation & Dry Cleaning Gallery | Tech Wash Hyderabad"
        description="View real before & after transformations of dry cleaned silk lehengas, suits, restored sneakers, and curtains by Tech Wash Hyderabad."
        canonicalUrl={`${BASE_URL}/gallery`}
        keywords="laundry gallery, dry cleaning before after hyderabad, shoe restoration photos"
        structuredData={structuredData}
      />
      <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fabric Transformation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-display tracking-tight">
            Our Work & Gallery
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Witness the craftsmanship and precision delivered by Tech Wash garment technicians.
          </p>
        </div>

        {/* Categories Bar */}
        {categories.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item) => {
            const mainImg = item.imageUrl || item.afterImageUrl || item.url;
            const hasBefore = Boolean(item.beforeImageUrl);

            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 shadow-luxury hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <img
                  src={mainImg}
                  alt={item.title || 'Tech Wash Gallery item'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge variant="brand" size="md">{item.category || 'Showcase'}</Badge>
                  {hasBefore && (
                    <span className="px-2.5 py-1 rounded-full bg-[#F97316] text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                      Before & After
                    </span>
                  )}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                  <h3 className="text-base font-bold font-display line-clamp-2">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={!!activeItem}
        onClose={() => setActiveItem(null)}
        maxWidth="max-w-4xl"
        className="p-0 overflow-hidden bg-slate-950 text-white"
      >
        {activeItem && (
          <div>
            <div className="relative aspect-[16/10] bg-slate-900 flex items-center justify-center">
              <img
                src={activeItem.imageUrl || activeItem.afterImageUrl || activeItem.url}
                alt={activeItem.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-6 bg-slate-900">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="brand" size="sm">{activeItem.category || 'Showcase'}</Badge>
                {activeItem.beforeImageUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                    Before & After
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold font-display text-white">{activeItem.title}</h3>
              {activeItem.description && (
                <p className="text-sm text-slate-300 mt-2">{activeItem.description}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      </div>
    </>
  );
};
