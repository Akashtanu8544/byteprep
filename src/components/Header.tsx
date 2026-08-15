import React, { useState, useEffect } from 'react';
import {
  Video,
  Database,
  BarChart3,
  BookOpen,
  Settings,
  Palette,
  Sparkles,
  Zap,
  Layers,
  Youtube,
  LogIn,
  LogOut,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Puzzle,
} from 'lucide-react';
import { BytePrepLogo } from './BytePrepLogo';
import {
  initAuth,
  signInWithGoogle,
  logoutGoogle,
  getCurrentUser,
} from '../services/authService';
import { YouTubeService, YouTubeChannelInfo } from '../services/youtubeService';
import { StorageService } from '../services/storageService';

export type AppView =
  | 'home'
  | 'studio'
  | 'autopost'
  | 'questions';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenBrandKit: () => void;
  onOpenSocialLogin?: () => void;
  onOpenExtensionModal?: () => void;
  onOpenBackup?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenBrandKit,
  onOpenSocialLogin,
  onOpenExtensionModal,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(getCurrentUser());
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [socialAccounts, setSocialAccounts] = useState(StorageService.getSocialAccounts());

  useEffect(() => {
    const checkAccounts = () => {
      setSocialAccounts(StorageService.getSocialAccounts());
    };
    checkAccounts();

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        if (token) {
          try {
            const channel = await YouTubeService.getMyChannel(token);
            if (channel) setChannelInfo(channel);
          } catch (e) {
            // non-fatal
          }
        }
      },
      () => {
        setGoogleUser(null);
        setChannelInfo(null);
      }
    );

    window.addEventListener('storage', checkAccounts);
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', checkAccounts);
    };
  }, []);

  const loggedInCount = socialAccounts.filter(a => a.connected).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
            <BytePrepLogo size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white group-hover:text-rose-400 transition-colors">
                BytePrep
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Creator
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Daily CS 10s MCQ Shorts Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('studio')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-rose-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
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

        {/* Right Actions: Social Extension, Logins, Brand Kit, Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chrome Extension & Posting Methods Button */}
          <button
            onClick={onOpenExtensionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/30 hover:to-purple-500/30 text-rose-300 border border-rose-500/40 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-black"
            title="Download Chrome Extension & Posting Methods"
          >
            <Puzzle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Chrome Extension</span>
          </button>

          {/* Social Logins & Access Pill */}
          <button
            onClick={onOpenSocialLogin}
            className="flex items-center gap-2 p-1 pl-2.5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl transition-all cursor-pointer group shadow-sm"
            title="Log in to Social Media & Manage Permissions"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Share2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-[11px] font-black">
                {loggedInCount > 0 ? `Social Access (${loggedInCount})` : 'Social Login'}
              </span>
              {loggedInCount > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-normal">
                  Login
                </span>
              )}
            </div>
          </button>

          <button
            onClick={onOpenBrandKit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Brand Watermark & Settings"
          >
            <Palette className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">Brand Kit</span>
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
