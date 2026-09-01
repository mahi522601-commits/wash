import React from 'react';

export const ImageFocalEditor = ({
  imageUrl,
  focalX = 50,
  focalY = 50,
  zoom = 100,
  onChange,
}) => {
  if (!imageUrl) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 text-center">
        Enter or upload an image URL above to preview and adjust focal point cropping.
      </div>
    );
  }

  const handleContainerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange({
      focalX: Math.max(0, Math.min(100, x)),
      focalY: Math.max(0, Math.min(100, y)),
      zoom,
    });
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-brand-50/50 border border-brand-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-navy-800 font-display">
          Visual Crop & Focal Point Adjuster
        </span>
        <span className="text-[11px] font-mono text-brand-700">
          X: {focalX}% | Y: {focalY}% | Zoom: {zoom}%
        </span>
      </div>

      {/* Interactive Focal Click Preview */}
      <div
        onClick={handleContainerClick}
        className="relative w-full h-44 rounded-2xl overflow-hidden bg-navy-950 cursor-crosshair border border-slate-300 shadow-inner group"
        title="Click anywhere to set focal center point"
      >
        <img
          src={imageUrl}
          alt="Crop preview"
          style={{
            objectPosition: `${focalX}% ${focalY}%`,
            transform: `scale(${zoom / 100})`,
          }}
          className="w-full h-full object-cover transition-all duration-200"
        />

        {/* Pin Target Marker */}
        <div
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
          className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-cyan-400 border-2 border-white shadow-lg pointer-events-none animate-ping"
        />
        <div
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
          className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-cyan-500 border-2 border-white shadow-lg pointer-events-none"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        💡 Click on the image above to position the focal center so faces and garments remain perfectly framed across mobile and desktop devices.
      </p>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Horizontal (X): {focalX}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={focalX}
            onChange={(e) => onChange({ focalX: Number(e.target.value), focalY, zoom })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Vertical (Y): {focalY}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={focalY}
            onChange={(e) => onChange({ focalX, focalY: Number(e.target.value), zoom })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Zoom Scale: {zoom}%
          </label>
          <input
            type="range"
            min="100"
            max="160"
            value={zoom}
            onChange={(e) => onChange({ focalX, focalY, zoom: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
      </div>
    </div>
  );
};
