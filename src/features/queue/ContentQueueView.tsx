import React, { useState, useEffect } from 'react';
import { GeneratedContentPack, ContentStatus, PlatformTarget, NormalizedQuestion } from '../../types';
import { IndexedDbService } from '../../services/indexedDbService';
import { ExportService } from '../../services/exportService';
import { QuestionLoader } from '../../services/questionLoader';
import {
  Layers,
  CheckCircle2,
  Share2,
  Trash2,
  ExternalLink,
  Download,
  Search,
  Filter,
  Eye,
  Send,
  Instagram,
  Youtube,
  BarChart2,
  Calendar,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface ContentQueueViewProps {
  onOpenContentPack: (question: NormalizedQuestion) => void;
  onOpenBatchGenerator?: () => void;
}

const STATUS_COLUMNS: { key: ContentStatus; label: string; color: string }[] = [
  { key: 'IDEA', label: 'Ideas', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { key: 'READY', label: 'Ready', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { key: 'GENERATED', label: 'Generated', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { key: 'REVIEW', label: 'Review', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'EXPORTED', label: 'Exported', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'POSTED', label: 'Posted', color: 'bg-green-500/20 text-green-300 border-green-500/40' },
];

export const ContentQueueView: React.FC<ContentQueueViewProps> = ({
  onOpenContentPack,
  onOpenBatchGenerator,
}) => {
  const [contentPacks, setContentPacks] = useState<GeneratedContentPack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Mark as posted modal
  const [postingPack, setPostingPack] = useState<GeneratedContentPack | null>(null);
  const [postPlatform, setPostPlatform] = useState<PlatformTarget>('youtube');
  const [postUrl, setPostUrl] = useState<string>('');

  // Performance metrics modal
  const [metricsPack, setMetricsPack] = useState<GeneratedContentPack | null>(null);
  const [views, setViews] = useState<number>(0);
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<number>(0);
  const [shares, setShares] = useState<number>(0);
  const [saves, setSaves] = useState<number>(0);
  const [followersGained, setFollowersGained] = useState<number>(0);

  const loadContentPacks = async () => {
    setIsLoading(true);
    const packs = await IndexedDbService.getAllContentPacks();
    // Sort by createdAt desc
    packs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setContentPacks(packs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContentPacks();
  }, []);

  const handleStatusChange = async (pack: GeneratedContentPack, newStatus: ContentStatus) => {
    const updated = { ...pack, status: newStatus };
    await IndexedDbService.saveContentPack(updated);
    setContentPacks(prev => prev.map(p => (p.id === pack.id ? updated : p)));
  };

  const handleDelete = async (packId: string) => {
    if (window.confirm('Delete this Content Pack from the queue?')) {
      await IndexedDbService.deleteContentPack(packId);
      setContentPacks(prev => prev.filter(p => p.id !== packId));
    }
  };

  const handleSavePosted = async () => {
    if (!postingPack) return;
    const updated: GeneratedContentPack = {
      ...postingPack,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postUrl: postUrl.trim() || undefined,
      platforms: [postPlatform, ...postingPack.platforms.filter(p => p !== postPlatform)],
    };

    await IndexedDbService.saveContentPack(updated);
    QuestionLoader.markQuestionPosted(postingPack.questionId);
    setContentPacks(prev => prev.map(p => (p.id === postingPack.id ? updated : p)));
    setPostingPack(null);
    setPostUrl('');
  };

  const handleSaveMetrics = async () => {
    if (!metricsPack) return;
    const updated: GeneratedContentPack = {
      ...metricsPack,
      views,
      likes,
      comments,
      shares,
      saves,
      followersGained,
    };

    await IndexedDbService.saveContentPack(updated);
    setContentPacks(prev => prev.map(p => (p.id === metricsPack.id ? updated : p)));
    setMetricsPack(null);
  };

  const filteredPacks = contentPacks.filter(p => {
    const matchesSearch =
      p.question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.question.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hook.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-sky-400 uppercase font-black">Production Pipeline</span>
            <span>•</span>
            <span>{contentPacks.length} Total Content Packages</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Content Queue & Pipeline</h1>
        </div>

        <div className="flex items-center gap-3">
          {onOpenBatchGenerator && (
            <button
              onClick={onOpenBatchGenerator}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Batch Generator</span>
            </button>
          )}

          <button
            onClick={loadContentPacks}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pipeline Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_COLUMNS.map(col => {
          const count = contentPacks.filter(p => p.status === col.key).length;
          return (
            <div
              key={col.key}
              onClick={() => setSelectedStatusFilter(col.key)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedStatusFilter === col.key
                  ? 'bg-slate-800 border-sky-400 shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">{col.label}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${col.color}`}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search queue by question, topic, subject, or hook..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500 pl-10"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="All">All Statuses ({contentPacks.length})</option>
            {STATUS_COLUMNS.map(col => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Pack Cards List */}
      {filteredPacks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Content Packages in this View</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Use the Batch Generator or select any question from the Question Bank to create high-yielding content packs.
          </p>
          {onOpenBatchGenerator && (
            <button
              onClick={onOpenBatchGenerator}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Generate First Batch
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPacks.map(pack => {
            const isPosted = pack.status === 'POSTED';
            return (
              <div
                key={pack.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all shadow-lg space-y-4"
              >
                {/* Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md text-[10px] font-black uppercase">
                      {pack.question.subject}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                      {pack.question.topic}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-bold">
                      Template: {pack.templateId}
                    </span>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={pack.status}
                      onChange={e => handleStatusChange(pack, e.target.value as ContentStatus)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-black text-white outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {STATUS_COLUMNS.map(col => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDelete(pack.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Content Pack"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Content Info */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hook: "{pack.hook}"</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {pack.question.question}
                  </h3>
                </div>

                {/* Actions & Analytics Hub */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Inspect Pack */}
                    <button
                      onClick={() => onOpenContentPack(pack.question)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Pack & Copy</span>
                    </button>

                    {/* Mark as Posted */}
                    {!isPosted ? (
                      <button
                        onClick={() => {
                          setPostingPack(pack);
                          setPostPlatform('youtube');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Posted</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Posted on {pack.platforms?.[0] || 'Social Media'}</span>
                      </div>
                    )}

                    {/* Log Performance Analytics */}
                    <button
                      onClick={() => {
                        setMetricsPack(pack);
                        setViews(pack.views || 0);
                        setLikes(pack.likes || 0);
                        setComments(pack.comments || 0);
                        setShares(pack.shares || 0);
                        setSaves(pack.saves || 0);
                        setFollowersGained(pack.followersGained || 0);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        {pack.views ? `${pack.views} Views` : 'Log Analytics'}
                      </span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-semibold">
                    Created: {new Date(pack.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark As Posted Modal */}
      {postingPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">Record Post Publishing</h3>
            <p className="text-xs text-slate-400">
              Track where and when this BytePrep content package was published.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Target Platform</label>
                <select
                  value={postPlatform}
                  onChange={e => setPostPlatform(e.target.value as PlatformTarget)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="youtube">YouTube Shorts</option>
                  <option value="instagram">Instagram Reels</option>
                  <option value="telegram">Telegram Channel Quiz</option>
                  <option value="whatsapp">WhatsApp Community</option>
                  <option value="facebook">Facebook Group</option>
                  <option value="other">Other Platform</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Live Post URL (Optional)</label>
                <input
                  type="text"
                  value={postUrl}
                  onChange={e => setPostUrl(e.target.value)}
                  placeholder="https://youtube.com/shorts/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPostingPack(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePosted}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Confirm Posted
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics Entry Modal */}
      {metricsPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-white">Log Performance Metrics</h3>
            <p className="text-xs text-slate-400">
              Input metrics to help the studio identify winning templates and high-converting CS topics.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Views</label>
                <input
                  type="number"
                  min={0}
                  value={views}
                  onChange={e => setViews(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Likes</label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={e => setLikes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Comments</label>
                <input
                  type="number"
                  min={0}
                  value={comments}
                  onChange={e => setComments(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Shares</label>
                <input
                  type="number"
                  min={0}
                  value={shares}
                  onChange={e => setShares(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Saves</label>
                <input
                  type="number"
                  min={0}
                  value={saves}
                  onChange={e => setSaves(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Followers Gained</label>
                <input
                  type="number"
                  min={0}
                  value={followersGained}
                  onChange={e => setFollowersGained(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMetricsPack(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetrics}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Save Metrics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
