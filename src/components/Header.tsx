import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Download,
  Bot,
  Flame,
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
import { PwaService } from '../services/pwaService';
import { TelegramStreakService } from '../services/telegramStreakService';

export type AppView =
  | 'studio'
  | 'questions'
  | 'telegram'
  | 'brand'
  | 'settings'
  | 'accounts'
  | 'post-methods';

interface HeaderProps {
  currentView?: AppView;
  onNavigate?: (view: AppView) => void;
  onOpenSettings: () => void;
  onOpenBrandKit: () => void;
  onOpenSocialLogin?: () => void;
  onOpenExtensionModal?: () => void;
  onOpenBackup?: () => void;
  onOpenShortcuts?: () => void;
  onOpenTelegramModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenBrandKit,
  onOpenSocialLogin,
  onOpenExtensionModal,
  onOpenTelegramModal,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(getCurrentUser());
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [socialAccounts, setSocialAccounts] = useState(StorageService.getSocialAccounts());
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(TelegramStreakService.getStreakInfo().currentStreak);

  useEffect(() => {
    const checkAccounts = () => {
      setSocialAccounts(StorageService.getSocialAccounts());
    };
    checkAccounts();

    const unsubStreak = TelegramStreakService.subscribe(() => {
      setCurrentStreak(TelegramStreakService.getStreakInfo().currentStreak);
    });

    const unsubscribePwa = PwaService.subscribeInstallPrompt((ready) => {
      setCanInstallPwa(ready);
    });

    const unsubscribeAuth = initAuth(
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
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribePwa) unsubscribePwa();
      if (unsubStreak) unsubStreak();
      window.removeEventListener('storage', checkAccounts);
    };
  }, []);

  const handleInstallApp = async () => {
    await PwaService.triggerInstall();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate?.('studio')}
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
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Daily CS 10s MCQ Shorts Engine
            </p>
          </div>
        </div>

        {/* Right Actions: PWA Install, Telegram, Brand Kit, Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {canInstallPwa && (
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-95"
              title="Install BytePrep as App"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          <button
            onClick={() => onNavigate ? onNavigate('telegram') : onOpenTelegramModal?.()}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              currentView === 'telegram'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
            }`}
            title="Telegram Auto-Post Center (Full Page)"
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Auto-Telegram</span>
            {currentStreak > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                <Flame className="w-2.5 h-2.5 fill-current" />
                {currentStreak}d
              </span>
            )}
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
