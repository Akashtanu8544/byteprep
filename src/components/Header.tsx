import React, { useState, useEffect } from 'react';
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
  Youtube,
  LogIn,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { BytePrepLogo } from './BytePrepLogo';
import {
  initAuth,
  signInWithGoogle,
  logoutGoogle,
  getCurrentUser,
} from '../services/authService';
import { YouTubeService, YouTubeChannelInfo } from '../services/youtubeService';

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
  const [googleUser, setGoogleUser] = useState<any>(getCurrentUser());
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      const ch = await YouTubeService.getMyChannel(res.accessToken);
      if (ch) setChannelInfo(ch);
    } catch (e) {
      console.error('Sign in error:', e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setChannelInfo(null);
  };
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
          {/* Official Google / YouTube Auth Pill */}
          {googleUser ? (
            <div className="flex items-center gap-2 p-1 pl-2.5 bg-slate-900 border border-red-500/30 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="hidden md:inline max-w-[120px] truncate text-[11px]">
                  {channelInfo?.title || googleUser.displayName || 'Channel'}
                </span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <button
                onClick={handleSignOut}
                title="Disconnect YouTube Account"
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-md shadow-red-600/25 transition-all cursor-pointer disabled:opacity-50"
              title="Connect Genuine YouTube Channel via Google OAuth"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLoggingIn ? 'Connecting...' : 'Connect YouTube'}</span>
            </button>
          )}

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
