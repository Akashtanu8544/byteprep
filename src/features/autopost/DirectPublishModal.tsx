import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Youtube,
  Instagram,
  Facebook,
  Webhook,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  ExternalLink,
  Loader2,
  Hash,
  Share2,
  Sliders,
} from 'lucide-react';
import {
  NormalizedQuestion,
  ShortConfig,
  SocialAccountConfig,
  SeriesTitleConfig,
  ScheduledPostItem,
} from '../../types';
import { StorageService } from '../../services/storageService';

interface DirectPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: NormalizedQuestion;
  shortConfig: ShortConfig;
  videoBlob?: Blob;
  videoUrl?: string;
  onPostSuccess?: (item: ScheduledPostItem) => void;
}

export const DirectPublishModal: React.FC<DirectPublishModalProps> = ({
  isOpen,
  onClose,
  question,
  shortConfig,
  videoBlob,
  videoUrl,
  onPostSuccess,
}) => {
  const [accounts, setAccounts] = useState<SocialAccountConfig[]>([]);
  const [seriesConfig, setSeriesConfig] = useState<SeriesTitleConfig>(
    StorageService.getSeriesConfig()
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'youtube',
    'instagram',
    'facebook',
  ]);
  const [formattedTitle, setFormattedTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('18:00');
  const [mode, setMode] = useState<'instant' | 'schedule'>('instant');

  useEffect(() => {
    if (!isOpen) return;
    const accs = StorageService.getSocialAccounts();
    setAccounts(accs);

    // Filter to connected platforms by default
    const connectedIds = accs.filter(a => a.connected).map(a => a.id);
    setSelectedPlatforms(connectedIds.length > 0 ? connectedIds : ['youtube', 'instagram', 'facebook']);

    const series = StorageService.getSeriesConfig();
    setSeriesConfig(series);

    const title = StorageService.formatSeriesTitle(
      series.template,
      series.currentNumber,
      series.zeroPadding,
      question,
      shortConfig.hookText
    );
    setFormattedTitle(title);
    setHashtags(series.customHashtags);

    // Set default schedule date to today / tomorrow
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setScheduleDate(dateStr);

    // Trigger AI metadata generation
    generateAiPostData(title, series.currentNumber);
  }, [isOpen, question]);

  const generateAiPostData = async (title: string, currentNum: number) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-post-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.question,
          options: question.options,
          correctAnswerText: question.options[question.correctAnswer],
          explanation: question.explanation,
          subject: question.subject,
          topic: question.topic,
          seriesTitle: title,
          seriesNumber: currentNum,
        }),
      });
      const data = await res.json();
      if (data.success && data.metadata) {
        setCaption(data.metadata.instagramCaption || data.metadata.youtubeDescription);
        if (Array.isArray(data.metadata.hashtags)) {
          setHashtags(data.metadata.hashtags.join(' '));
        }
      }
    } catch (err) {
      console.warn('AI caption fetch failed, using fallback:', err);
      setCaption(
        `🧠 ${title}\n\nCan you solve this ${question.subject} question in 10 seconds? Drop your option below!\n\n#BytePrep #ComputerScience #Shorts`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handleInstantPublish = async () => {
    if (selectedPlatforms.length === 0) return;
    setIsPublishing(true);

    try {
      const webhookAcc = accounts.find(a => a.id === 'webhook');
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          formattedTitle,
          caption,
          hashtags: hashtags.split(' ').filter(Boolean),
          seriesNumber: seriesConfig.currentNumber,
          questionId: question.id,
          webhookUrl: webhookAcc?.webhookUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPublishSuccess(data.results);

        // Auto increment series number if enabled
        if (seriesConfig.autoIncrement) {
          StorageService.incrementSeriesNumber();
        }

        const scheduledItem: ScheduledPostItem = {
          id: `post-${Date.now()}`,
          questionId: question.id,
          question,
          shortConfig,
          seriesNumber: seriesConfig.currentNumber,
          formattedTitle,
          caption,
          hashtags: hashtags.split(' ').filter(Boolean),
          targetPlatforms: selectedPlatforms as any,
          scheduledTime: new Date().toISOString(),
          status: 'published',
          publishedAt: new Date().toISOString(),
          videoUrl,
          blob: videoBlob,
        };
        StorageService.addToScheduledQueue(scheduledItem);
        if (onPostSuccess) onPostSuccess(scheduledItem);
      }
    } catch (err: any) {
      console.error('Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedulePost = () => {
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    const scheduledItem: ScheduledPostItem = {
      id: `post-${Date.now()}`,
      questionId: question.id,
      question,
      shortConfig,
      seriesNumber: seriesConfig.currentNumber,
      formattedTitle,
      caption,
      hashtags: hashtags.split(' ').filter(Boolean),
      targetPlatforms: selectedPlatforms as any,
      scheduledTime: scheduledDateTime,
      status: 'scheduled',
      videoUrl,
      blob: videoBlob,
    };
    StorageService.addToScheduledQueue(scheduledItem);

    // Auto increment for next one
    if (seriesConfig.autoIncrement) {
      StorageService.incrementSeriesNumber();
    }

    if (onPostSuccess) onPostSuccess(scheduledItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>1-Click Auto-Publisher</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  FB • YouTube • IG
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Post across all connected channels with automated #{seriesConfig.currentNumber} series title.
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Post Published Success Screen */}
          {publishSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Successfully Published!</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">"{formattedTitle}"</p>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-left text-xs">
                {Object.entries(publishSuccess).map(([plat, res]: [string, any]) => (
                  <div key={plat} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60">
                    <span className="font-bold capitalize text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {plat} Shorts/Reels
                    </span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      View Live <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Select Channels */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Target Social Platforms:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'youtube', name: 'YouTube Shorts', icon: Youtube, color: 'text-red-400' },
                    { id: 'instagram', name: 'Instagram Reels', icon: Instagram, color: 'text-pink-400' },
                    { id: 'facebook', name: 'Facebook Reels', icon: Facebook, color: 'text-blue-400' },
                    { id: 'webhook', name: 'Webhook / Bot', icon: Webhook, color: 'text-purple-400' },
                  ].map(plat => {
                    const isSelected = selectedPlatforms.includes(plat.id);
                    const Icon = plat.icon;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-rose-500/60 shadow-md shadow-rose-500/10'
                            : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? plat.color : 'text-slate-600'}`} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {plat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Increment Formula */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Series Title (#{seriesConfig.currentNumber}):</span>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Auto-Numbered
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formattedTitle}
                  onChange={e => setFormattedTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-amber-300 font-bold outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              {/* Post Caption / Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Social Post Caption & Description:</label>
                  {isAiLoading && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin" /> Gemini writing caption...
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Can you solve this CS challenge in 10 seconds? Drop your answer below!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 outline-none focus:border-rose-500 custom-scrollbar"
                />
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Hashtags:</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-sky-300 font-mono outline-none focus:border-sky-500"
                />
              </div>

              {/* Publishing Mode: Instant or Schedule */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Publishing Mode:</label>
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setMode('instant')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        mode === 'instant' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🚀 Instant 1-Click
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('schedule')}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        mode === 'schedule' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📅 Schedule Time
                    </button>
                  </div>
                </div>

                {mode === 'schedule' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Post Date:</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Post Time:</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!publishSuccess && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            {mode === 'instant' ? (
              <button
                onClick={handleInstantPublish}
                disabled={isPublishing || selectedPlatforms.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to {selectedPlatforms.length} Channels...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>POST TO {selectedPlatforms.length} CHANNELS NOW</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSchedulePost}
                disabled={!scheduleDate || !scheduleTime || selectedPlatforms.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>ADD TO SCHEDULE QUEUE</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
