import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const AnnouncementBar = () => {
  const { settings } = useSettings();
  const website = settings?.website || {};

  if (!website.announcementBarEnabled || !website.announcementText) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white text-xs py-2 px-4 text-center relative z-40 border-b border-brand-500/20 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1 font-medium text-brand-300">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>Special Announcement:</span>
        </span>
        <span className="text-slate-200">{website.announcementText}</span>
        {website.announcementLink && (
          <Link
            to={website.announcementLink}
            className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:text-white underline underline-offset-2 ml-1"
          >
            <span>Learn More</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
};
