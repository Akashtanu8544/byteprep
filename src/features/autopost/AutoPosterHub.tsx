import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Clock,
  Youtube,
  Instagram,
  Facebook,
  Webhook,
  Plus,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Radio,
  ExternalLink,
  ShieldCheck,
  Hash,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Video,
} from 'lucide-react';
import {
  SocialAccountConfig,
  SeriesTitleConfig,
  ScheduledPostItem,
  AutoPilotScheduleSettings,
  NormalizedQuestion,
  ShortConfig,
} from '../../types';
import { StorageService } from '../../services/storageService';
import { QuestionLoader } from '../../services/questionLoader';
import { SeriesTitleCustomizer } from './SeriesTitleCustomizer';
import { ConnectedAccountsModal } from './ConnectedAccountsModal';
import { YouTubeService } from '../../services/youtubeService';
import { getCachedAccessToken } from '../../services/authService';

interface AutoPosterHubProps {
  onOpenShortsStudio?: (questionId?: string) => void;
}

export const AutoPosterHub: React.FC<AutoPosterHubProps> = ({ onOpenShortsStudio }) => {
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>([]);
  const [seriesConfig, setSeriesConfig] = useState<SeriesTitleConfig>(
    StorageService.getSeriesConfig()
  );
  const [autopilot, setAutopilot] = useState<AutoPilotScheduleSettings>(
    StorageService.getAutoPilotSettings()
  );
  const [queue, setQueue] = useState<ScheduledPostItem[]>([]);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState<boolean>(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'series' | 'autopilot'>('queue');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setAccounts(StorageService.getSocialAccounts());
    setSeriesConfig(StorageService.getSeriesConfig());
    setAutopilot(StorageService.getAutoPilotSettings());
    setQueue(StorageService.getScheduledQueue());
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Publish Single Queued Item
  const handlePublishItem = async (item: ScheduledPostItem) => {
    setPublishingId(item.id);
    try {
      const webhookAcc = accounts.find(a => a.id === 'webhook');
      const ytAcc = accounts.find(a => a.id === 'youtube');
      const postUrls: Record<string, string> = {};

      // Check if genuine YouTube upload is possible
      if (item.targetPlatforms.includes('youtube') && item.blob) {
        const token = getCachedAccessToken();
        if (token) {
          try {
            const ytResult = await YouTubeService.uploadShortVideo({
              videoBlob: item.blob,
              title: item.formattedTitle,
              description: `${item.caption}\n\n${item.hashtags.join(' ')}`,
              tags: item.hashtags,
              privacyStatus: ytAcc?.defaultPrivacy || 'public',
              accessToken: token,
            });
            postUrls.youtube = ytResult.videoUrl;
          } catch (ytErr) {
            console.warn('YouTube direct upload fallback:', ytErr);
          }
        }
      }

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: item.targetPlatforms,
          formattedTitle: item.formattedTitle,
          caption: item.caption,
          hashtags: item.hashtags,
          seriesNumber: item.seriesNumber,
          questionId: item.questionId,
          webhookUrl: webhookAcc?.webhookUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        StorageService.updateScheduledPost(item.id, {
          status: 'published',
          publishedAt: new Date().toISOString(),
          postUrls: {
            youtube: postUrls.youtube || data.results?.youtube?.url,
            instagram: data.results?.instagram?.url,
            facebook: data.results?.facebook?.url,
          },
        });
        refreshData();
        showToast('success', `Published #${item.seriesNumber} "${item.formattedTitle}" to social channels!`);
      } else {
        showToast('error', data.error || 'Failed to publish post');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Publishing error');
    } finally {
      setPublishingId(null);
    }
  };

  // 1-Click Publish All Pending Scheduled Items
  const handlePublishAllPending = async () => {
    const pending = queue.filter(q => q.status === 'scheduled');
    if (pending.length === 0) {
      showToast('error', 'No pending scheduled items in the queue.');
      return;
    }
    setIsProcessingQueue(true);
    let count = 0;
    for (const item of pending) {
      await handlePublishItem(item);
      count++;
      await new Promise(r => setTimeout(r, 600)); // Stagger calls cleanly
    }
    setIsProcessingQueue(false);
    showToast('success', `Successfully published ${count} queued shorts!`);
  };

  // Bulk Auto-Generate 5 Daily Challenge Posts into Queue
  const handleBulkGenerateQueue = (count: number = 5) => {
    let currentSeriesNum = seriesConfig.currentNumber;
    const existingQIds = new Set(queue.map(q => q.questionId));
    const allQuestions = QuestionLoader.getAllQuestions();
    const availableQuestions = allQuestions.filter(
      q => !existingQIds.has(q.id)
    );

    if (availableQuestions.length === 0) {
      showToast('error', 'All questions are already queued!');
      return;
    }

    const selectedQuestions = availableQuestions.slice(0, count);
    const updatedQueue: ScheduledPostItem[] = [...queue];

    const connectedPlatforms = accounts.filter(a => a.connected).map(a => a.id);
    const targetPlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : (['youtube', 'instagram', 'facebook'] as any);

    const now = new Date();
    selectedQuestions.forEach((question, idx) => {
      const scheduledDate = new Date(now.getTime() + (idx + 1) * 24 * 60 * 60 * 1000); // 1 per day
      scheduledDate.setHours(18, 0, 0, 0); // 6:00 PM

      const formattedTitle = StorageService.formatSeriesTitle(
        seriesConfig.template,
        currentSeriesNum,
        seriesConfig.zeroPadding,
        question
      );

      const newItem: ScheduledPostItem = {
        id: `auto_post_${Date.now()}_${idx}`,
        questionId: question.id,
        question,
        shortConfig: {
          question,
          timerSeconds: 10,
          templateId: 'hook-mcq-answer',
          themeId: 'byteprep-dark',
          hookText: 'Can You Solve This in 10 Seconds?',
          includeAudio: true,
          renderQuality: '720p',
          exportFormat: 'mp4',
          ctaEnabled: true,
          appUrl: 'https://byteprep.cs/app',
        },
        seriesNumber: currentSeriesNum,
        formattedTitle,
        caption: `⚡ ${formattedTitle}\n\nCan you solve this ${question.subject} question in 10 seconds? Drop your option below!\n\nSave for quick revision 🔖`,
        hashtags: seriesConfig.customHashtags.split(' ').filter(Boolean),
        targetPlatforms: targetPlatforms as any,
        scheduledTime: scheduledDate.toISOString(),
        status: 'scheduled',
      };

      updatedQueue.push(newItem);
      currentSeriesNum++;
    });

    StorageService.saveScheduledQueue(updatedQueue);
    StorageService.saveSeriesConfig({ currentNumber: currentSeriesNum });
    refreshData();
    showToast('success', `Added ${selectedQuestions.length} auto-numbered shorts to the scheduled queue!`);
  };

  const handleRemoveItem = (id: string) => {
    const updated = StorageService.removeScheduledPost(id);
    setQueue([...updated]);
    showToast('success', 'Post removed from queue.');
  };

  const handleClearCompleted = () => {
    const updated = StorageService.clearCompletedScheduledPosts();
    setQueue([...updated]);
    showToast('success', 'Cleared completed posts.');
  };

  const pendingItems = queue.filter(q => q.status === 'scheduled');
  const publishedItems = queue.filter(q => q.status === 'published');
  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950 border border-rose-500/40 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                1-Click Multi-Channel Publisher
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                YouTube • Instagram • Facebook
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Social Auto-Poster & Scheduler
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Connect accounts once, auto-increment title series (e.g. 10 Sec Challenge #1, #2...), and automatically post high-retention 9:16 Shorts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAccountsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl border border-slate-700 shadow-md transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>
                Connected Channels ({connectedCount})
              </span>
            </button>

            <button
              onClick={() => onOpenShortsStudio && onOpenShortsStudio()}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 fill-current" />
              <span>Create New Short</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Status & Series Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Connected Channels Pill */}
        <div
          onClick={() => setIsAccountsModalOpen(true)}
          className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold">Active Channels</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:text-white" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-xs">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 text-xs">
                <Instagram className="w-4 h-4" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs">
                <Facebook className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400">
              {connectedCount} Connected
            </span>
          </div>
        </div>

        {/* Current Series Counter */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold">Next Series Episode</span>
            <Hash className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              #{seriesConfig.currentNumber}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              {seriesConfig.template.split('|')[0] || '10 Sec Challenge'}
            </span>
          </div>
        </div>

        {/* Queued Items */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold">Scheduled in Queue</span>
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-400 font-mono">
              {pendingItems.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Ready to Auto-Post
            </span>
          </div>
        </div>

        {/* Total Published */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold">Total Published</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {publishedItems.length}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Live across Channels
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-rose-500 text-white font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Scheduled Queue ({pendingItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'series'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Series Title & AI Incrementer</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Published Posts History ({publishedItems.length})</span>
        </button>
      </div>

      {/* TAB 1: SCHEDULED QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Quick Generator:</span>
              <button
                onClick={() => handleBulkGenerateQueue(5)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-500/20"
              >
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>+ Add 5 Daily CS Challenges</span>
              </button>
              <button
                onClick={() => handleBulkGenerateQueue(10)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl transition-all cursor-pointer border border-amber-500/20"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add 10 PYQ Shorts</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {pendingItems.length > 0 && (
                <button
                  onClick={handlePublishAllPending}
                  disabled={isProcessingQueue}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                  <span>{isProcessingQueue ? 'Publishing All...' : '🚀 PUBLISH ALL PENDING NOW'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Queue List */}
          {pendingItems.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Scheduled Posts in Queue</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate 5 or 10 daily challenges with auto-incremented titles (#1, #2, #3...) or add directly from Shorts Studio.
              </p>
              <button
                onClick={() => handleBulkGenerateQueue(5)}
                className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                ⚡ Auto-Fill 5 Daily Shorts
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((item, idx) => {
                const isPublishing = publishingId === item.id;
                const dateObj = new Date(item.scheduledTime);
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Number Badge */}
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm font-mono shrink-0">
                        #{item.seriesNumber}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white truncate">
                            {item.formattedTitle}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {item.question.subject}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.question.question}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {isToday ? 'Today' : dateObj.toLocaleDateString()} at{' '}
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.targetPlatforms.includes('youtube') && (
                              <Youtube className="w-3.5 h-3.5 text-red-400" title="YouTube Shorts" />
                            )}
                            {item.targetPlatforms.includes('instagram') && (
                              <Instagram className="w-3.5 h-3.5 text-pink-400" title="Instagram Reels" />
                            )}
                            {item.targetPlatforms.includes('facebook') && (
                              <Facebook className="w-3.5 h-3.5 text-blue-400" title="Facebook Reels" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handlePublishItem(item)}
                        disabled={isPublishing}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Play className={`w-3 h-3 ${isPublishing ? 'animate-spin' : ''}`} />
                        <span>{isPublishing ? 'Posting...' : 'Post Now'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERIES TITLE INCREMENTER */}
      {activeTab === 'series' && (
        <div className="space-y-4">
          <SeriesTitleCustomizer
            config={seriesConfig}
            onChange={updated => setSeriesConfig(updated)}
            sampleQuestion={QuestionLoader.getAllQuestions()[0]}
          />
        </div>
      )}

      {/* TAB 3: PUBLISHED HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-300">
              Published Posts Log ({publishedItems.length})
            </h3>
            {publishedItems.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold"
              >
                Clear History
              </button>
            )}
          </div>

          {publishedItems.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl space-y-2">
              <p className="text-xs text-slate-400">No posts published yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publishedItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold font-mono">
                      #{item.seriesNumber}
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.formattedTitle}</p>
                      <p className="text-[11px] text-slate-400">
                        Published on {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Live
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connected Accounts Modal */}
      <ConnectedAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => {
          setIsAccountsModalOpen(false);
          refreshData();
        }}
        onAccountsUpdated={refreshData}
      />
    </div>
  );
};
