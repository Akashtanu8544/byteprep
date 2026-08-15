import React from 'react';
import {
  Video,
  Database,
  Settings,
  BookOpen,
  Home,
  Palette,
  Sparkles,
  Zap,
  Layers,
} from 'lucide-react';
import { BytePrepLogo } from './BytePrepLogo';

export type AppView =
  | 'home'
  | 'studio'
  | 'autopost'
  | 'questions'
  | 'play'
  | 'result';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: any) => void;
  onOpenSettings: () => void;
  onOpenBrandKit: () => void;
  onOpenBackup: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenBrandKit,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <BytePrepLogo size={36} showText={true} />
        </button>

        {/* Primary Clean Navigation */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-slate-800 text-white shadow-sm font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-md ${
              currentView === 'studio'
                ? 'bg-rose-500 text-white shadow-rose-500/25 font-black'
                : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
            }`}
          >
            <Video className="w-3.5 h-3.5 fill-current" />
            <span>Shorts Studio</span>
          </button>

          <button
            onClick={() => onNavigate('autopost')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'autopost'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Poster</span>
          </button>

          <button
            onClick={() => onNavigate('questions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'questions'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Question Bank</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenBrandKit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Brand Watermark & Settings"
          >
            <Palette className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Brand Kit</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
