import React, { useState, useRef } from 'react';
import { storageService } from '../../services/storageService';
import { 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  Check, 
  Sparkles, 
  RefreshCw,
  Eye,
  FolderOpen
} from 'lucide-react';

const PRESET_CARE_IMAGES = [
  {
    name: 'Eco Dry Cleaning',
    category: 'Dry Cleaning',
    url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Steam Iron & Press',
    category: 'Ironing',
    url: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'RO Soft Water Wash',
    category: 'Wash & Iron',
    url: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Store-Style Folded Clothes',
    category: 'Wash & Fold',
    url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Silk Saree & Traditional',
    category: 'Saree Care',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Curtain & Drapery Wash',
    category: 'Curtains',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Sneaker & Shoe Spa',
    category: 'Footwear',
    url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Carpet & Rug Shampoo',
    category: 'Household',
    url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80'
  }
];

export const ImageUpload = ({
  label = 'Service Cover Image',
  value = '',
  onChange,
  serviceSlug = 'service',
  helperText = 'Upload a photo from your computer, choose from library presets, or paste a URL.',
  aspectRatio = 'aspect-[16/10]',
}) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [customUrl, setCustomUrl] = useState(value || '');
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP, SVG)');
      return;
    }

    setIsUploading(true);
    try {
      const resultUrl = await storageService.uploadServiceImage(file, serviceSlug);
      onChange(resultUrl);
      setCustomUrl(resultUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setCustomUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChange(customUrl.trim());
    }
  };

  return (
    <div className="space-y-3">
      {/* Label and Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'preset' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'url' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Local File Drag & Drop Upload */}
      {activeTab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
            onChange={(e) => handleFileChange(e.target.files[0])}
            className="hidden"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver 
                ? 'border-brand-500 bg-brand-50/60 shadow-md' 
                : 'border-slate-300 hover:border-brand-400 bg-slate-50/70 hover:bg-white'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs border border-brand-100">
              {isUploading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              ) : (
                <FolderOpen className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isUploading ? 'Processing & Compressing Image...' : 'Click to browse or drag & drop image'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports PNG, JPG, WebP, SVG (Auto-compressed for fast loading)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Preset Library Photos */}
      {activeTab === 'preset' && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
            Choose from Curated Tech Wash Care Photos:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {PRESET_CARE_IMAGES.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.name}
                  onClick={() => { onChange(preset.url); setCustomUrl(preset.url); }}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    isSelected ? 'border-brand-600 ring-2 ring-brand-200 shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                      {preset.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 3: Direct URL Input */}
      {activeTab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Apply URL
          </button>
        </div>
      )}

      {/* Image Preview & Current Selection */}
      {value && (
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-brand-600" />
              <span>Current Live Preview</span>
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>

          <div className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group`}>
            <img
              src={value}
              alt="Uploaded service visual"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90">
              <span className="truncate max-w-[200px] font-mono opacity-80">{value.startsWith('data:') ? 'Local Base64 Image' : value}</span>
              <span className="bg-black/50 px-2 py-0.5 rounded-full font-bold">Live Visual</span>
            </div>
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
