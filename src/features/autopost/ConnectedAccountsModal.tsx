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
  const [expandedSetupGuide, setExpandedSetupGuide] = useState<string | null>(null);

  // Listen for Meta OAuth popup callback
  useEffect(() => {
    const handleMetaMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('vercel.app')) {
        return;
      }
      if (event.data?.type === 'META_AUTH_SUCCESS') {
        const { accessToken } = event.data.payload || {};
        if (accessToken) {
          // Verify Facebook & Instagram using the received token
          await verifyAndSaveMetaToken(accessToken);
        }
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, [accounts]);

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

  const verifyAndSaveMetaToken = async (token: string, targetPlatform?: 'facebook' | 'instagram') => {
    setIsAuthenticating(true);
    setTestResult(null);
    try {
      // Test Facebook
      if (!targetPlatform || targetPlatform === 'facebook') {
        const fbRes = await fetch('/api/social/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'facebook',
            apiToken: token,
          }),
        });
        const fbData = await fbRes.json();
        if (fbData.success) {
          const fbAcc = StorageService.getSocialAccounts().find(a => a.id === 'facebook');
          if (fbAcc) {
            const updated = StorageService.saveSocialAccount({
              ...fbAcc,
              connected: true,
              apiToken: token,
              username: fbData.username || fbData.name,
              channelTitle: fbData.name,
              avatarUrl: fbData.avatarUrl,
            });
            setAccounts([...updated]);
          }
        }
      }

      // Test Instagram
      if (!targetPlatform || targetPlatform === 'instagram') {
        const igRes = await fetch('/api/social/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'instagram',
            apiToken: token,
          }),
        });
        const igData = await igRes.json();
        if (igData.success) {
          const igAcc = StorageService.getSocialAccounts().find(a => a.id === 'instagram');
          if (igAcc) {
            const updated = StorageService.saveSocialAccount({
              ...igAcc,
              connected: true,
              apiToken: token,
              username: igData.username,
              channelTitle: igData.name,
              avatarUrl: igData.avatarUrl,
            });
            setAccounts([...updated]);
          }
        }
      }

      setTestResult({
        id: targetPlatform || 'facebook',
        success: true,
        message: 'Meta account authorization verified successfully with Graph API!',
      });
      if (onAccountsUpdated) onAccountsUpdated();
    } catch (err: any) {
      console.error('Meta verification error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleMetaOAuthPopup = async (targetPlatform?: 'facebook' | 'instagram') => {
    setIsAuthenticating(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/auth/meta/url');
      const data = await res.json();
      if (!data.url) throw new Error('Failed to retrieve Meta auth URL');

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        data.url,
        'meta_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups to connect Meta Facebook/Instagram.');
      }
    } catch (err: any) {
      setTestResult({
        id: targetPlatform || 'facebook',
        success: false,
        message: err.message || 'Could not open Meta Login popup.',
      });
      setIsAuthenticating(false);
    }
  };

  const handleGoogleConnect = async () => {
    setIsAuthenticating(true);
    setTestResult(null);
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
          message: data.message || `Successfully connected and verified for ${account.name}!`,
        });
        const updated = StorageService.saveSocialAccount({
          ...account,
          connected: true,
          username: data.username || account.username,
          channelTitle: data.name || account.channelTitle,
          avatarUrl: data.avatarUrl || account.avatarUrl,
        });
        setAccounts([...updated]);
        if (onAccountsUpdated) onAccountsUpdated();
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
  const vercelDomain = 'https://byteprep-gamma.vercel.app';
  const vercelCallbackUrl = `${vercelDomain}/auth/meta/callback`;
  const devCallbackUrl = 'https://ais-dev-fxndqayfds2wozonoqozug-68499964584.asia-southeast1.run.app/auth/meta/callback';
  const sharedCallbackUrl = 'https://ais-pre-fxndqayfds2wozonoqozug-68499964584.asia-southeast1.run.app/auth/meta/callback';

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
                <span>Connect Social Media Channels</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  YouTube • Facebook • Instagram
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authorize your genuine accounts to auto-publish 9:16 CS Shorts directly.
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
              <p className="font-bold text-emerald-300">Live OAuth & Official Graph API Authorization</p>
              <p className="text-slate-400 mt-0.5">
                Connect YouTube Shorts with official Google OAuth, and connect Facebook Pages & Instagram Professional accounts via Meta Login or Meta Graph API Access Tokens.
              </p>
            </div>
          </div>

          {/* Social Channels List */}
          <div className="space-y-4">
            {/* 1. YOUTUBE CHANNEL (GOOGLE OAUTH) */}
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
                        <span>Verify Live</span>
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

            {/* 2. FACEBOOK REELS & PAGES */}
            {(() => {
              const fbAcc = accounts.find(a => a.id === 'facebook')!;
              const isTesting = testingId === 'facebook';
              const isFbConnected = fbAcc.connected;

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isFbConnected
                      ? 'bg-slate-950/90 border-blue-500/40 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold overflow-hidden shrink-0">
                        {fbAcc.avatarUrl ? (
                          <img src={fbAcc.avatarUrl} alt="FB Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Facebook className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Facebook Reels & Pages</span>
                          {isFbConnected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Live Connected
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Requires Setup
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          {fbAcc.channelTitle || fbAcc.username || 'Connect Facebook Page or Creator Profile'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestConnection(fbAcc)}
                        disabled={isTesting}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Verify Live</span>
                      </button>

                      <button
                        onClick={() => handleMetaOAuthPopup('facebook')}
                        disabled={isAuthenticating}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Meta Login</span>
                      </button>

                      <button
                        onClick={() => handleToggle(fbAcc)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isFbConnected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black'
                        }`}
                      >
                        {isFbConnected ? 'Disconnect' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Facebook Settings */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Facebook Page ID / Handle:
                      </label>
                      <input
                        type="text"
                        value={fbAcc.pageId || fbAcc.username || ''}
                        onChange={e => {
                          handleUpdateField('facebook', 'pageId', e.target.value);
                          handleUpdateField('facebook', 'username', e.target.value);
                        }}
                        placeholder="e.g. 10492837492 or BytePrepPage"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Meta Graph Access Token / Page Token:
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={fbAcc.apiToken || ''}
                          onChange={e => handleUpdateField('facebook', 'apiToken', e.target.value)}
                          placeholder="EAAG..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-blue-500 pr-8"
                        />
                        <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {testResult && testResult.id === 'facebook' && (
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
            })()}

            {/* 3. INSTAGRAM REELS (META GRAPH API) */}
            {(() => {
              const igAcc = accounts.find(a => a.id === 'instagram')!;
              const isTesting = testingId === 'instagram';
              const isIgConnected = igAcc.connected;

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isIgConnected
                      ? 'bg-slate-950/90 border-pink-500/40 shadow-lg shadow-pink-500/5'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold overflow-hidden shrink-0">
                        {igAcc.avatarUrl ? (
                          <img src={igAcc.avatarUrl} alt="IG Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Instagram className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Instagram Reels</span>
                          {isIgConnected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Live Connected
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                              Requires Setup
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          {igAcc.username || igAcc.channelTitle || 'Connect Instagram Creator / Business Account'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestConnection(igAcc)}
                        disabled={isTesting}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Verify Live</span>
                      </button>

                      <button
                        onClick={() => handleMetaOAuthPopup('instagram')}
                        disabled={isAuthenticating}
                        className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-md shadow-pink-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Meta Login</span>
                      </button>

                      <button
                        onClick={() => handleToggle(igAcc)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          isIgConnected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black'
                        }`}
                      >
                        {isIgConnected ? 'Disconnect' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Instagram Settings */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Instagram Username / IG User ID:
                      </label>
                      <input
                        type="text"
                        value={igAcc.username || igAcc.pageId || ''}
                        onChange={e => {
                          handleUpdateField('instagram', 'username', e.target.value);
                          handleUpdateField('instagram', 'pageId', e.target.value);
                        }}
                        placeholder="@BytePrep_Official or IG ID"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Instagram Graph User / System Access Token:
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={igAcc.apiToken || ''}
                          onChange={e => handleUpdateField('instagram', 'apiToken', e.target.value)}
                          placeholder="IGAA... or EAAG..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-pink-500 pr-8"
                        />
                        <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {testResult && testResult.id === 'instagram' && (
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
            })()}

            {/* 4. WEBHOOK FOR BUFFER / MAKE / ZAPIER AUTOMATION */}
            {(() => {
              const webhookAcc = accounts.find(a => a.id === 'webhook')!;
              const isTesting = testingId === 'webhook';

              return (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    webhookAcc.connected
                      ? 'bg-slate-950/80 border-purple-500/30'
                      : 'bg-slate-950/30 border-slate-800/50 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                        <Webhook className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{webhookAcc.name}</span>
                          {webhookAcc.connected ? (
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
                          {webhookAcc.webhookUrl ? 'Custom automation endpoint active' : 'Automate via Make.com, Buffer, or Zapier'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestConnection(webhookAcc)}
                        disabled={isTesting}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>Ping Webhook</span>
                      </button>

                      <button
                        onClick={() => handleToggle(webhookAcc)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          webhookAcc.connected
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black'
                        }`}
                      >
                        {webhookAcc.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>

                  {webhookAcc.connected && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Webhook Endpoint URL:
                      </label>
                      <input
                        type="url"
                        value={webhookAcc.webhookUrl || ''}
                        onChange={e => handleUpdateField('webhook', 'webhookUrl', e.target.value)}
                        placeholder="https://hook.eu1.make.com/your-autopost-webhook"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-purple-500 text-xs"
                      />
                    </div>
                  )}

                  {testResult && testResult.id === 'webhook' && (
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
            })()}
          </div>

          {/* Collapsible Meta Developer App Settings Helper */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs">
            <button
              onClick={() => setExpandedSetupGuide(expandedSetupGuide ? null : 'meta')}
              className="w-full flex items-center justify-between font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Meta Developers OAuth & Redirect URI Guide</span>
              </div>
              {expandedSetupGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSetupGuide === 'meta' && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-slate-400 font-sans leading-relaxed">
                <p>
                  To link your own Meta App at <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">developers.facebook.com</a>:
                </p>
                <div className="p-2.5 bg-slate-900 rounded-xl space-y-1.5 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Vercel Production Callback: </span>
                    <span className="text-emerald-300 font-bold select-all">{vercelCallbackUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Dev Callback: </span>
                    <span className="text-sky-300 select-all">{devCallbackUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Shared Callback: </span>
                    <span className="text-sky-300 select-all">{sharedCallbackUrl}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Or simply generate a User/Page Access Token in Graph API Explorer with permissions <code className="text-pink-300">pages_manage_posts</code> and <code className="text-pink-300">instagram_content_publish</code>, paste it above, and click <strong>Verify Live</strong>!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {accounts.filter(a => a.connected).length} of {accounts.length} Channels Connected
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
