import React, { useState, useEffect } from 'react';
import { cmsService } from '../../services/cmsService';
import { Modal } from '../ui/Modal';
import { Sparkles, Eye, ArrowUpRight, X } from 'lucide-react';

export const GallerySection = ({ gallery = [] }) => {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxItem, setLightboxItem] = useState(null);

  useEffect(() => {
    if (gallery.length > 0) {
      setItems(gallery);
    } else {
      cmsService.getItems('gallery', { filterActive: true })
        .then((data) => {
          if (data && data.length > 0) {
            setItems(data);
          } else {
            // Default transformation photos
            setItems([
              {
                id: 'g-1',
                title: 'Bridal Kanjeevaram Saree Roll Polish',
                category: 'Couture',
                imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
                description: 'Restoration of intricate 24k gold zari threads with zero chemical dullness.',
              },
              {
                id: 'g-2',
                title: 'Italian Wool 2-Piece Blazer Dry Clean',
                category: 'Suits',
                imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
                description: 'Hydrocarbon solvent extraction with crisp collar crease retention.',
              },
              {
                id: 'g-3',
                title: 'Designer Suede & Mesh Sneakers',
                category: 'Footwear',
                imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
                description: 'Ultrasonic stain lift and anti-microbial ozone deodorization.',
              },
              {
                id: 'g-4',
                title: '3D Tension Steam Finishing',
                category: 'Steam Iron',
                imageUrl: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=800&q=80',
                description: 'Gentle form steam press without shiny heat marks or seam burns.',
              }
            ]);
          }
        })
        .catch(() => {});
    }
  }, [gallery]);

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-100">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-100 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Craftsmanship Portfolio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-navy-800 leading-tight">
              Before & After <br />
              <span className="text-[#F97316]">Transformations</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:text-brand-700 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* MASONRY ASYMMETRIC GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
          {filtered.map((item, idx) => {
            // Asymmetric col spanning: items 0 and 3 are 7-wide, others are 5-wide
            const colSpan = idx % 3 === 0 ? 'lg:col-span-7' : 'lg:col-span-5';

            return (
              <div
                key={item.id || idx}
                onClick={() => setLightboxItem(item)}
                className={`${colSpan} group relative rounded-[36px] overflow-hidden bg-navy-950 shadow-luxury hover:shadow-luxury-hover cursor-pointer border border-brand-200/80 transition-all duration-500 transform hover:-translate-y-1`}
              >
                <div className="aspect-[16/11] sm:aspect-[16/10] overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Category Pill Tag */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-navy-800 shadow">
                      {item.category}
                    </span>
                  </div>

                  {/* Zoom Action Icon */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-navy-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Eye className="w-5 h-5" />
                  </div>

                  {/* Caption Details */}
                  <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl glass-card-dark text-white space-y-1">
                    <h3 className="text-sm font-bold font-display">{item.title}</h3>
                    <p className="text-[11px] text-[#FED7AA] line-clamp-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-navy-900 rounded-[36px] overflow-hidden border border-brand-500/40 shadow-2xl space-y-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-2">
              <span className="text-sm font-bold text-white font-display">{lightboxItem.title}</span>
              <button
                onClick={() => setLightboxItem(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <p className="text-xs text-brand-100 px-4 pb-2">
              {lightboxItem.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
