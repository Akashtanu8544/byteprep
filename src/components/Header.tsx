import React from 'react';
import {
  Play,
  Video,
  Database,
  Settings,
  BookOpen,
  Home,
  Share2,
  Layers,
  Sparkles,
  Zap,
  BarChart2,
  Palette,
  CheckCircle2,
  Smartphone,
  Code2,
  Megaphone,
  PieChart,
  TrendingUp,
  Keyboard,
} from 'lucide-react';
import { BytePrepLogo } from './BytePrepLogo';

export type AppView =
  | 'home'
  | 'play-select'
  | 'studio'
  | 'story'
  | 'carousel'
  | 'code-challenge'
  | 'campaigns'
  | 'gap-finder'
  | 'conversion'
  | 'factory'
  | 'ai-quiz'
  | 'polls'
  | 'flashcards'
  | 'questions'
  | 'report'
  | 'content-pack'
  | 'batch'
  | 'queue'
  | 'series'
  | 'analytics'
  | 'issues'
  | 'play'
  | 'result';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: AppView) => void;
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
  onOpenBackup,
  onOpenShortcuts,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <BytePrepLogo size={36} showText={true} />
        </button>

        {/* Primary Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 flex-wrap text-xs font-bold">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('questions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'questions'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => onNavigate('factory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'factory'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md font-black'
                : 'text-amber-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Content Factory</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Shorts Studio</span>
          </button>

          <button
            onClick={() => onNavigate('story')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'story'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-sky-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Stories</span>
          </button>

          <button
            onClick={() => onNavigate('carousel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'carousel'
                ? 'bg-purple-600 text-white shadow-md font-black'
                : 'text-purple-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4:5 Carousels</span>
          </button>

          <button
            onClick={() => onNavigate('code-challenge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'code-challenge'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Challenges</span>
          </button>

          <button
            onClick={() => onNavigate('campaigns')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'campaigns'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-amber-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campaigns</span>
          </button>

          <button
            onClick={() => onNavigate('gap-finder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'gap-finder'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-rose-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Gap Finder</span>
          </button>

          <button
            onClick={() => onNavigate('conversion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'conversion'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ROI & UTM</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenBrandKit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Brand Kit & App URLs"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Brand Kit</span>
          </button>

          <button
            onClick={onOpenBackup}
            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
            title="Backup & Restore Studio"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenShortcuts}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer hidden sm:block"
            title="Keyboard Shortcuts (Ctrl + /)"
          >
            <Keyboard className="w-4 h-4" />
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
