import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { 
  Upload, 
  Sparkles, 
  Link as LinkIcon, 
  Trash2, 
  Check, 
  RefreshCw,
  Eye,
  FolderOpen,
  CheckCircle2,
  AlertCircle
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
  helperText = 'Upload a photo from your computer (auto-compressed to HD < 100 KB), choose presets, or paste a URL.',
  aspectRatio = 'aspect-[16/10]',
}) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [customUrl, setCustomUrl] = useState(value || '');
  const [compressStats, setCompressStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // Sync internal custom URL state when external value changes
  useEffect(() => {
    if (value && value !== customUrl) {
      setCustomUrl(value);
    }
  }, [value]);

  const handleProcessFile = async (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);
    try {
      const result = await storageService.uploadServiceImage(file, serviceSlug);
      
      setCompressStats({
        sizeKb: result.sizeKb,
        originalSizeKb: result.originalSizeKb,
        width: result.width,
        height: result.height,
        savedPercent: result.originalSizeKb > result.sizeKb 
          ? Math.round(((result.originalSizeKb - result.sizeKb) / result.originalSizeKb) * 100) 
          : 0
      });

      onChange(result.url);
      setCustomUrl(result.url);
    } catch (err) {
      console.error('Image compression error:', err);
      setErrorMessage(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        handleProcessFile(file);
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setCustomUrl('');
    setCompressStats(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setCompressStats(null);
    }
  };

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      {/* Top Header & Tab Controls */}
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
            <span>Upload File (Local)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'preset' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Preset Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'url' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image Link</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Local File Drag & Drop + Browse */}
      {activeTab === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleProcessFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver 
                ? 'border-brand-500 bg-brand-50/70 shadow-md scale-[1.01]' 
                : 'border-slate-300 hover:border-brand-400 bg-slate-50/70 hover:bg-white'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs border border-brand-100">
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
              ) : (
                <FolderOpen className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isProcessing ? 'Optimizing Image to HD (< 100 KB)...' : 'Click to select photo or drag file here'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
                <span>PNG, JPG, WebP</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target: &lt; 100 KB HD
                </span>
                <span>•</span>
                <span>Paste with Ctrl+V</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Preset Care Photos */}
      {activeTab === 'preset' && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
            Select high-resolution Tech Wash service image:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {PRESET_CARE_IMAGES.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.name}
                  onClick={() => { 
                    onChange(preset.url); 
                    setCustomUrl(preset.url);
                    setCompressStats(null);
                  }}
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

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Compression Stats Badge */}
      {compressStats && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>HD Compressed:</strong> {compressStats.sizeKb} KB ({compressStats.width}×{compressStats.height}px)
            </span>
          </div>
          {compressStats.savedPercent > 0 && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-900">
              Saved {compressStats.savedPercent}% ({compressStats.originalSizeKb} KB → {compressStats.sizeKb} KB)
            </span>
          )}
        </div>
      )}

      {/* Live Visual Preview Box */}
      {value && (
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-brand-600" />
              <span>Current Service Image Preview</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                Change Photo
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group`}>
            <img
              src={value}
              alt="Service visual"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/90">
              <span className="truncate max-w-[240px] font-mono opacity-80">
                {value.startsWith('data:') ? 'HD WebP Compressed (Under 100KB)' : value}
              </span>
              <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                Live & Active
              </span>
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
