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
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  Tv,
} from 'lucide-react';
import { SocialAccountConfig } from '../../types';
import { StorageService } from '../../services/storageService';
import {
  initAuth,
  signInWithGoogle,
  logoutGoogle,
  getCachedAccessToken,
  getCurrentUser,
} from '../../services/authService';
import { YouTubeService, YouTubeChannelInfo } from '../../services/youtubeService';

interface ConnectedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

export const ConnectedAccountsModal: React.FC<ConnectedAccountsModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>(
    StorageService.getSocialAccounts()
  );
  const [googleUser, setGoogleUser] = useState<any>(getCurrentUser());
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        if (token) {
          try {
            const channel = await YouTubeService.getMyChannel(token);
            if (channel) {
              setChannelInfo(channel);
              // Update local state and storage with genuine channel title
              const ytAcc = StorageService.getSocialAccounts().find(a => a.id === 'youtube');
              if (ytAcc) {
                const updated = StorageService.saveSocialAccount({
                  ...ytAcc,
                  connected: true,
                  username: channel.customUrl || channel.title,
                  channelTitle: channel.title,
                  avatarUrl: channel.thumbnailUrl,
                });
                setAccounts([...updated]);
              }
            }
          } catch (e) {
            console.warn('Channel fetch note:', e);
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

  const handleGoogleConnect = async () => {
    setIsAuthenticating(true);
    setTestResult(null);
    try {
      const authResult = await signInWithGoogle();
      setGoogleUser(authResult.user);

      // Fetch authentic YouTube Channel details
      const channel = await YouTubeService.getMyChannel(authResult.accessToken);
      if (channel) {
        setChannelInfo(channel);
      }

      // Mark YouTube as genuinely connected
      const ytAcc = accounts.find(a => a.id === 'youtube');
      if (ytAcc) {
        const updated = StorageService.saveSocialAccount({
          ...ytAcc,
          connected: true,
          username: channel?.customUrl || `@${authResult.user.displayName?.replace(/\s+/g, '') || 'User'}`,
          channelTitle: channel?.title || authResult.user.displayName || 'My YouTube Channel',
          avatarUrl: channel?.thumbnailUrl || authResult.user.photoURL || undefined,
        });
        setAccounts([...updated]);
      }

      setTestResult({
        id: 'youtube',
        success: true,
        message: `Connected genuinely as ${channel?.title || authResult.user.displayName}! Ready to upload Shorts.`,
      });

      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setTestResult({
        id: 'youtube',
        success: false,
        message: err.message || 'Failed to authenticate with Google YouTube OAuth.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setChannelInfo(null);
    const updated = StorageService.toggleAccountConnection('youtube', false);
    setAccounts([...updated]);
    if (onAccountsUpdated) onAccountsUpdated();
  };

  const handleToggle = (account: SocialAccountConfig) => {
    if (account.id === 'youtube' && !account.connected) {
      handleGoogleConnect();
      return;
    } else if (account.id === 'youtube' && account.connected) {
      handleGoogleDisconnect();
      return;
    }

    const updated = StorageService.toggleAccountConnection(account.id, !account.connected);
    setAccounts([...updated]);
    if (onAccountsUpdated) onAccountsUpdated();
  };

  const handleUpdateField = (id: string, field: keyof SocialAccountConfig, value: any) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    const updatedAccount = { ...account, [field]: value };
    const saved = StorageService.saveSocialAccount(updatedAccount);
    setAccounts([...saved]);
    if (onAccountsUpdated) onAccountsUpdated();
  };

  const handleTestConnection = async (account: SocialAccountConfig) => {
    setTestingId(account.id);
    setTestResult(null);

    if (account.id === 'youtube') {
      try {
        const token = getCachedAccessToken();
        if (!token) {
          throw new Error('Please click "Sign in with Google" to grant live YouTube access.');
        }
        const channel = await YouTubeService.getMyChannel(token);
        if (channel) {
          setChannelInfo(channel);
          setTestResult({
            id: 'youtube',
            success: true,
            message: `Verified live connection with channel "${channel.title}" (${channel.subscriberCount || 0} subscribers).`,
          });
        } else {
          setTestResult({
            id: 'youtube',
            success: true,
            message: 'Connected with YouTube account successfully!',
          });
        }
      } catch (err: any) {
        setTestResult({
          id: 'youtube',
          success: false,
          message: err.message || 'Could not verify YouTube account permissions.',
        });
      } finally {
        setTestingId(null);
      }
      return;
    }

    try {
      const res = await fetch('/api/social/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: account.platform,
          webhookUrl: account.webhookUrl,
          apiToken: account.apiToken,
          pageId: account.pageId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          id: account.id,
          success: true,
          message: data.message || `Successfully connected to ${account.name}!`,
        });
        if (!account.connected) {
          const updated = StorageService.toggleAccountConnection(account.id, true);
          setAccounts([...updated]);
        }
      } else {
        setTestResult({
          id: account.id,
          success: false,
          message: data.error || 'Connection check returned an issue',
        });
      }
    } catch (err: any) {
      setTestResult({
        id: account.id,
        success: false,
        message: err.message || 'Network error testing connection',
      });
    } finally {
      setTestingId(null);
    }
  };

  const isYouTubeConnected = accounts.find(a => a.id === 'youtube')?.connected && (!!googleUser || !!getCachedAccessToken());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Connect Social Media Accounts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Genuine OAuth Access
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authorize your genuine channels to auto-publish 9:16 CS Shorts directly.
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

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Trust Banner */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-300">Official Google / YouTube OAuth Authorization</p>
              <p className="text-slate-400 mt-0.5">
                Sign in with Google securely with the YouTube Upload & Read permissions to post your CS challenge videos directly to your channel as genuine Shorts.
              </p>
            </div>
          </div>

          {/* Social Channels List */}
          <div className="space-y-4">
            {/* 1. YOUTUBE CHANNEL (AUTHENTIC GOOGLE OAUTH) */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isYouTubeConnected
                ? 'bg-slate-950/90 border-red-500/40 shadow-lg shadow-red-500/5'
                : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 font-bold overflow-hidden shrink-0">
                    {channelInfo?.thumbnailUrl || googleUser?.photoURL ? (
                      <img
                        src={channelInfo?.thumbnailUrl || googleUser?.photoURL}
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
                      {isYouTubeConnected ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Live OAuth Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          Requires Auth
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {channelInfo?.title || googleUser?.displayName || 'Sign in to connect genuine channel'}
                    </p>
                    {channelInfo && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {channelInfo.customUrl || channelInfo.id} • {channelInfo.subscriberCount || 0} subs
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isYouTubeConnected ? (
                    <>
                      <button
                        onClick={() => handleTestConnection(accounts.find(a => a.id === 'youtube')!)}
                        disabled={testingId === 'youtube'}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingId === 'youtube' ? 'animate-spin' : ''}`} />
                        <span>Check</span>
                      </button>
                      <button
                        onClick={handleGoogleDisconnect}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleGoogleConnect}
                      disabled={isAuthenticating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isAuthenticating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* YouTube Specific Settings */}
              {isYouTubeConnected && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Target Channel Name:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={channelInfo?.title || googleUser?.displayName || 'Connected Account'}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Default Upload Privacy:
                    </label>
                    <select
                      value={accounts.find(a => a.id === 'youtube')?.defaultPrivacy || 'public'}
                      onChange={e => handleUpdateField('youtube', 'defaultPrivacy', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-red-500"
                    >
                      <option value="public">🌐 Public (Instant Shorts Feed Reach)</option>
                      <option value="unlisted">🔗 Unlisted (Review via link first)</option>
                      <option value="private">🔒 Private (Only you can view)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Feedback Note for YouTube */}
              {testResult && testResult.id === 'youtube' && (
                <div
                  className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* OTHER PLATFORMS: INSTAGRAM, FACEBOOK, WEBHOOK */}
            {accounts
              .filter(a => a.id !== 'youtube')
              .map(acc => {
                const isTesting = testingId === acc.id;
                const hasTestResult = testResult && testResult.id === acc.id;

                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      acc.connected
                        ? 'bg-slate-950/80 border-slate-800'
                        : 'bg-slate-950/30 border-slate-800/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            acc.id === 'instagram'
                              ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                              : acc.id === 'facebook'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {acc.id === 'instagram' && <Instagram className="w-5 h-5" />}
                          {acc.id === 'facebook' && <Facebook className="w-5 h-5" />}
                          {acc.id === 'webhook' && <Webhook className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{acc.name}</span>
                            {acc.connected ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Connected
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                Disconnected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {acc.username || acc.channelTitle || 'No account set'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestConnection(acc)}
                          disabled={isTesting}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Test'}</span>
                        </button>

                        <button
                          onClick={() => handleToggle(acc)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            acc.connected
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black'
                          }`}
                        >
                          {acc.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>

                    {/* Account Settings / Handle Configuration */}
                    {acc.connected && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">
                            Channel / Account Handle:
                          </label>
                          <input
                            type="text"
                            value={acc.username || ''}
                            onChange={e => handleUpdateField(acc.id, 'username', e.target.value)}
                            placeholder="@BytePrepCS"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-rose-500"
                          />
                        </div>

                        {acc.id === 'webhook' && (
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">
                              Webhook Endpoint URL (Make.com, Zapier, Buffer, or Custom Bot):
                            </label>
                            <input
                              type="url"
                              value={acc.webhookUrl || ''}
                              onChange={e => handleUpdateField(acc.id, 'webhookUrl', e.target.value)}
                              placeholder="https://hook.eu1.make.com/your-autopost-webhook"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-purple-500"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback Message */}
                    {hasTestResult && (
                      <div
                        className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {accounts.filter(a => a.connected).length} of {accounts.length} Platforms Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
          >
            Done & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
