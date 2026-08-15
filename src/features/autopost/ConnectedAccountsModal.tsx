import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  Instagram,
  Facebook,
  Webhook,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  LogIn,
  LogOut,
  Key,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Unlock,
  Check,
  Share2,
} from 'lucide-react';
import { SocialAccountConfig } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  initAuth,
  signInWithGoogle,
  signInWithFacebook,
  signInWithInstagram,
  signInWithTikTok,
  grantAccessToAllPlatforms,
  logoutSocialPlatform,
  getCachedAccessToken,
  getCurrentUser,
} from '../../services/authService';
import { YouTubeService, YouTubeChannelInfo } from '../../services/youtubeService';

interface SocialLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

export const ConnectedAccountsModal: React.FC<SocialLoginModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>(
    StorageService.getSocialAccounts()
  );
  const [googleUser, setGoogleUser] = useState<any>(getCurrentUser());
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ id: string; success: boolean; text: string } | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  // Load accounts and initial auth listener
  useEffect(() => {
    if (!isOpen) return;

    setAccounts(StorageService.getSocialAccounts());

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        if (token) {
          try {
            const channel = await YouTubeService.getMyChannel(token);
            if (channel) {
              setChannelInfo(channel);
              const ytAcc = StorageService.getSocialAccounts().find(a => a.id === 'youtube');
              if (ytAcc) {
                const updated = StorageService.saveSocialAccount({
                  ...ytAcc,
                  connected: true,
                  username: channel.customUrl || channel.title,
                  channelTitle: channel.title,
                  avatarUrl: channel.thumbnailUrl,
                  lastSyncAt: new Date().toISOString(),
                });
                setAccounts([...updated]);
              }
            }
          } catch (e) {
            console.warn('YouTube channel fetch notice:', e);
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
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Log in with Google / YouTube
  const handleGoogleLogin = async () => {
    setLoadingPlatform('youtube');
    setStatusMessage(null);
    try {
      const authResult = await signInWithGoogle();
      setGoogleUser(authResult.user);

      const channel = await YouTubeService.getMyChannel(authResult.accessToken);
      if (channel) {
        setChannelInfo(channel);
      }

      const ytAcc = accounts.find(a => a.id === 'youtube');
      if (ytAcc) {
        const updated = StorageService.saveSocialAccount({
          ...ytAcc,
          connected: true,
          username: channel?.customUrl || `@${authResult.user.displayName?.replace(/\s+/g, '') || 'BytePrepCreator'}`,
          channelTitle: channel?.title || authResult.user.displayName || 'BytePrep Shorts Channel',
          avatarUrl: channel?.thumbnailUrl || authResult.user.photoURL || undefined,
          lastSyncAt: new Date().toISOString(),
        });
        setAccounts([...updated]);
      }

      setStatusMessage({
        id: 'youtube',
        success: true,
        text: `Logged in as ${channel?.title || authResult.user.displayName}! Full YouTube Shorts upload access granted.`,
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      setStatusMessage({
        id: 'youtube',
        success: false,
        text: err.message || 'Sign in was cancelled. Click Log In whenever you are ready.',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  // 2. Log in with Facebook
  const handleFacebookLogin = async () => {
    setLoadingPlatform('facebook');
    setStatusMessage(null);
    try {
      await signInWithFacebook();
      setAccounts(StorageService.getSocialAccounts());
      setStatusMessage({
        id: 'facebook',
        success: true,
        text: 'Logged in to Facebook! Full Reels publishing & Page access granted.',
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      setStatusMessage({
        id: 'facebook',
        success: false,
        text: err.message || 'Facebook login error',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  // 3. Log in with Instagram
  const handleInstagramLogin = async () => {
    setLoadingPlatform('instagram');
    setStatusMessage(null);
    try {
      await signInWithInstagram();
      setAccounts(StorageService.getSocialAccounts());
      setStatusMessage({
        id: 'instagram',
        success: true,
        text: 'Logged in to Instagram! Full Instagram Reels publishing access granted.',
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      setStatusMessage({
        id: 'instagram',
        success: false,
        text: err.message || 'Instagram login error',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  // 4. Log in with TikTok
  const handleTikTokLogin = async () => {
    setLoadingPlatform('tiktok');
    setStatusMessage(null);
    try {
      await signInWithTikTok();
      setAccounts(StorageService.getSocialAccounts());
      setStatusMessage({
        id: 'tiktok',
        success: true,
        text: 'Logged in to TikTok! Video upload & creator publishing access granted.',
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      setStatusMessage({
        id: 'tiktok',
        success: false,
        text: err.message || 'TikTok login error',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  // 5. Grant Access to All Platforms in 1-Click
  const handleGrantAccessToAll = async () => {
    setLoadingPlatform('all');
    setStatusMessage(null);
    try {
      const updated = await grantAccessToAllPlatforms(
        googleUser?.displayName || 'BytePrep CS Creator',
        googleUser?.photoURL || channelInfo?.thumbnailUrl
      );
      setAccounts([...updated]);
      setStatusMessage({
        id: 'all',
        success: true,
        text: '🎉 All Social Media Accounts Logged In & Full Publishing Access Granted!',
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      setStatusMessage({
        id: 'all',
        success: false,
        text: err.message || 'Failed to grant all permissions.',
      });
    } finally {
      setLoadingPlatform(null);
    }
  };

  // Logout individual platform
  const handleLogout = async (platformId: string) => {
    setLoadingPlatform(platformId);
    try {
      const updated = await logoutSocialPlatform(platformId);
      setAccounts([...updated]);
      if (platformId === 'youtube') {
        setGoogleUser(null);
        setChannelInfo(null);
      }
      setStatusMessage({
        id: platformId,
        success: true,
        text: `Logged out from ${platformId}.`,
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleUpdateHandle = (platformId: string, value: string) => {
    const acc = accounts.find(a => a.id === platformId);
    if (!acc) return;
    const updated = StorageService.saveSocialAccount({
      ...acc,
      username: value,
      channelTitle: value,
    });
    setAccounts([...updated]);
    if (onAccountsUpdated) onAccountsUpdated();
  };

  const isYouTubeLoggedIn = (accounts.find(a => a.id === 'youtube')?.connected && (!!googleUser || !!getCachedAccessToken('youtube')));
  const isFbLoggedIn = accounts.find(a => a.id === 'facebook')?.connected;
  const isIgLoggedIn = accounts.find(a => a.id === 'instagram')?.connected;
  const isTtLoggedIn = accounts.find(a => a.id === 'tiktok')?.connected;
  const isWebhookActive = accounts.find(a => a.id === 'webhook')?.connected;

  const totalLoggedIn = [isYouTubeLoggedIn, isFbLoggedIn, isIgLoggedIn, isTtLoggedIn, isWebhookActive].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Social Media Login & Access</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {totalLoggedIn} of 5 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log in to your social accounts to grant publishing access for YouTube Shorts, IG Reels, FB Reels & TikTok.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Quick 1-Click "Log In & Grant Access to All" Banner */}
          <div className="p-4.5 bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-indigo-950/40 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-white">1-Click Fast Pass: Authorize All Platforms</p>
                <p className="text-xs text-slate-300">
                  Instantly log in and grant full video publishing access to YouTube, Instagram, Facebook, and TikTok.
                </p>
              </div>
            </div>
            <button
              onClick={handleGrantAccessToAll}
              disabled={loadingPlatform === 'all'}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-500 hover:from-rose-400 hover:to-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loadingPlatform === 'all' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>Grant Full Access to All</span>
            </button>
          </div>

          {/* Status Message Feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                statusMessage.success
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {statusMessage.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Social Platforms Login Cards */}
          <div className="space-y-3.5">
            {/* 1. YOUTUBE / GOOGLE LOGIN */}
            {(() => {
              const ytAcc = accounts.find(a => a.id === 'youtube');
              const isLoading = loadingPlatform === 'youtube';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isYouTubeLoggedIn
                      ? 'bg-slate-950/90 border-red-500/40 shadow-lg shadow-red-500/5'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 font-bold overflow-hidden shrink-0">
                        {channelInfo?.thumbnailUrl || googleUser?.photoURL || ytAcc?.avatarUrl ? (
                          <img
                            src={channelInfo?.thumbnailUrl || googleUser?.photoURL || ytAcc?.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Youtube className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">YouTube Shorts</span>
                          {isYouTubeLoggedIn ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Logged In • Full Access
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Not Logged In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {channelInfo?.title || googleUser?.displayName || ytAcc?.channelTitle || 'Google & YouTube Creator Account'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {channelInfo?.customUrl || ytAcc?.username || '@BytePrepCS'} • Permissions: <span className="text-slate-400">youtube.upload, readonly</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isYouTubeLoggedIn ? (
                        <button
                          onClick={() => handleLogout('youtube')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>Log In with Google</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. FACEBOOK LOGIN */}
            {(() => {
              const fbAcc = accounts.find(a => a.id === 'facebook');
              const isLoading = loadingPlatform === 'facebook';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isFbLoggedIn
                      ? 'bg-slate-950/90 border-blue-500/40 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold overflow-hidden shrink-0">
                        {fbAcc?.avatarUrl ? (
                          <img src={fbAcc.avatarUrl} alt="FB Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Facebook className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Facebook Pages & Reels</span>
                          {isFbLoggedIn ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Logged In • Full Access
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Not Logged In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {fbAcc?.channelTitle || 'Facebook Creator Page'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {fbAcc?.username || 'BytePrep Computer Science'} • Permissions: <span className="text-slate-400">pages_manage_posts, reels_publish</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isFbLoggedIn ? (
                        <button
                          onClick={() => handleLogout('facebook')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleFacebookLogin}
                          disabled={isLoading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>Log In with Facebook</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. INSTAGRAM LOGIN */}
            {(() => {
              const igAcc = accounts.find(a => a.id === 'instagram');
              const isLoading = loadingPlatform === 'instagram';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isIgLoggedIn
                      ? 'bg-slate-950/90 border-pink-500/40 shadow-lg shadow-pink-500/5'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold overflow-hidden shrink-0">
                        {igAcc?.avatarUrl ? (
                          <img src={igAcc.avatarUrl} alt="IG Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Instagram className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Instagram Reels</span>
                          {isIgLoggedIn ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Logged In • Full Access
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Not Logged In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {igAcc?.channelTitle || 'Instagram Professional Account'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {igAcc?.username || '@byteprep.cs'} • Permissions: <span className="text-slate-400">instagram_content_publish</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isIgLoggedIn ? (
                        <button
                          onClick={() => handleLogout('instagram')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleInstagramLogin}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-black rounded-xl shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>Log In with Instagram</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. TIKTOK LOGIN */}
            {(() => {
              const ttAcc = accounts.find(a => a.id === 'tiktok');
              const isLoading = loadingPlatform === 'tiktok';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isTtLoggedIn
                      ? 'bg-slate-950/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold overflow-hidden shrink-0">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">TikTok Creator</span>
                          {isTtLoggedIn ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Logged In • Full Access
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Not Logged In
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {ttAcc?.channelTitle || 'TikTok Creator Profile'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {ttAcc?.username || '@byteprep_cs'} • Permissions: <span className="text-slate-400">video.upload, video.publish</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isTtLoggedIn ? (
                        <button
                          onClick={() => handleLogout('tiktok')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleTikTokLogin}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span>Log In with TikTok</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 5. WEBHOOK / BUFFER AUTOMATION */}
            {(() => {
              const webhookAcc = accounts.find(a => a.id === 'webhook')!;
              const isLoading = loadingPlatform === 'webhook';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isWebhookActive
                      ? 'bg-slate-950/90 border-purple-500/40 shadow-lg shadow-purple-500/5'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold overflow-hidden shrink-0">
                        <Webhook className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Webhook & Buffer Automation</span>
                          {isWebhookActive ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Logged In • Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          Make.com, Zapier, Buffer, or Custom Bot Relay
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {webhookAcc.webhookUrl || 'https://byteprep-gamma.vercel.app/api/social/publish'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isWebhookActive ? (
                        <button
                          onClick={() => handleLogout('webhook')}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = StorageService.toggleAccountConnection('webhook', true);
                            setAccounts([...updated]);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Activate Webhook</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Account Handles & Customization Details (Collapsible) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs">
            <button
              onClick={() => setExpandedDetails(expandedDetails ? null : 'handles')}
              className="w-full flex items-center justify-between font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Customize Channel Handles & Display Names</span>
              </div>
              {expandedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedDetails === 'handles' && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block capitalize">
                      {acc.name} Handle:
                    </label>
                    <input
                      type="text"
                      value={acc.username || ''}
                      onChange={e => handleUpdateHandle(acc.id, e.target.value)}
                      placeholder={`@${acc.id}_handle`}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-rose-500 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {totalLoggedIn} of 5 Social Media Platforms Logged In & Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
          >
            Done & Save Access
          </button>
        </div>
      </div>
    </div>
  );
};
