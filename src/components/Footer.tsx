import React from 'react';
import { CheckCircle2, ExternalLink, Smartphone } from 'lucide-react';
import { BytePrepLogo } from './BytePrepLogo';

interface FooterProps {
  appUrl?: string;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="mt-12 border-t border-slate-900 bg-slate-950/90 py-8 px-4 text-center">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Practice / Download CTA Banner */}
        <a
          href="https://dsssbpyq.online"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-slate-900 hover:to-slate-900 border border-sky-500/30 hover:border-sky-400 rounded-3xl transition-all shadow-xl cursor-pointer"
        >
          {/* Starting Logo */}
          <BytePrepLogo size={42} />

          {/* Perfectly Aligned 2 Lines */}
          <div className="flex-1 text-center space-y-0.5">
            <div className="text-white font-black text-sm sm:text-base tracking-tight flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Search BytePrep TGT PGT CS on Play Store</span>
            </div>
            <div className="text-sky-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1">
              <span>Visit Website : dsssbpyq.online</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
          </div>

          {/* Ending Logo */}
          <BytePrepLogo size={42} />
        </a>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>OFFLINE MODE READY</span>
          </span>
          <span>•</span>
          <span>DSSSB / KVS / NVS / STET Computer Science</span>
        </div>
      </div>
    </footer>
  );
};
