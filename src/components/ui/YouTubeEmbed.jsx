import React, { useState } from 'react';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube';
import { Play, AlertCircle } from 'lucide-react';

export const YouTubeEmbed = ({
  url,
  title = 'Tech Wash Service Demonstration',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(url, { autoplay: true });
  const thumbnailUrl = getYouTubeThumbnail(url, 'hqdefault');

  if (!url || !embedUrl) {
    return null;
  }

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-luxury border border-slate-200/80 bg-slate-900 ${className}`}>
      {!isPlaying ? (
        <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-sm text-slate-400">Video Preview</span>
            </div>
          )}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] group-hover:bg-slate-950/30 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/95 text-brand-600 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all">
              <Play className="w-7 h-7 ml-1 fill-current" />
            </div>
          </div>
          {title && (
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950/80 to-transparent text-white text-xs sm:text-sm font-semibold truncate">
              {title}
            </div>
          )}
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      )}
    </div>
  );
};
