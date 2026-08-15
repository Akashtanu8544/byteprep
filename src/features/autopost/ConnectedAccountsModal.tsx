import React, { useState } from 'react';
import {
  X,
  Youtube,
  Instagram,
  Facebook,
  Webhook,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SocialAccountConfig } from '../../types';
import { StorageService } from '../../services/storageService';

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
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleToggle = (account: SocialAccountConfig) => {
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
        // Auto-enable if test succeeds
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
                <span>Connect Social Accounts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Connect Once & Auto-Post
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authorize your channels once to post videos in 1-click or on automated schedule.
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
              <p className="font-bold text-emerald-300">Secure Direct Multi-Publishing</p>
              <p className="text-slate-400 mt-0.5">
                Your credentials are stored locally in your browser. All videos export in 100% compliant 9:16 MP4 format ready for Instagram Reels, YouTube Shorts, and Facebook.
              </p>
            </div>
          </div>

          {/* Social Channels List */}
          <div className="space-y-4">
            {accounts.map(acc => {
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
                          acc.id === 'youtube'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : acc.id === 'instagram'
                            ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                            : acc.id === 'facebook'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {acc.id === 'youtube' && <Youtube className="w-5 h-5" />}
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

                      {acc.id === 'youtube' && (
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">
                            Default Privacy:
                          </label>
                          <select
                            value={acc.defaultPrivacy || 'public'}
                            onChange={e => handleUpdateField(acc.id, 'defaultPrivacy', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-rose-500"
                          >
                            <option value="public">🌐 Public (Instant Viral Reach)</option>
                            <option value="unlisted">🔗 Unlisted</option>
                            <option value="private">🔒 Private (Review first)</option>
                          </select>
                        </div>
                      )}

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
