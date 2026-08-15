import React, { useState, useEffect } from 'react';
import { GeneratedContentPack, NormalizedQuestion } from '../../types';
import { IndexedDbService } from '../../services/indexedDbService';
import { QuestionLoader } from '../../services/questionLoader';
import {
  BarChart2,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users,
  Sparkles,
  Trophy,
  Zap,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

interface CreatorAnalyticsViewProps {
  onGenerateMoreLikeThis: (subject: string, topic?: string) => void;
  onOpenContentPack: (question: NormalizedQuestion) => void;
}

export const CreatorAnalyticsView: React.FC<CreatorAnalyticsViewProps> = ({
  onGenerateMoreLikeThis,
  onOpenContentPack,
}) => {
  const [contentPacks, setContentPacks] = useState<GeneratedContentPack[]>([]);
  const datasetStats = QuestionLoader.getDatasetStats();

  useEffect(() => {
    IndexedDbService.getAllContentPacks().then(packs => {
      setContentPacks(packs);
    });
  }, []);

  // Aggregations
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalFollowers = 0;

  const topicPerformance: Record<string, { views: number; count: number; subject: string }> = {};
  const templatePerformance: Record<string, { views: number; count: number }> = {};

  contentPacks.forEach(p => {
    const v = p.views || 0;
    totalViews += v;
    totalLikes += p.likes || 0;
    totalComments += p.comments || 0;
    totalShares += p.shares || 0;
    totalSaves += p.saves || 0;
    totalFollowers += p.followersGained || 0;

    const topic = p.question.topic || 'General';
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { views: 0, count: 0, subject: p.question.subject };
    }
    topicPerformance[topic].views += v;
    topicPerformance[topic].count += 1;

    const tpl = p.templateId || '10s-challenge';
    if (!templatePerformance[tpl]) {
      templatePerformance[tpl] = { views: 0, count: 0 };
    }
    templatePerformance[tpl].views += v;
    templatePerformance[tpl].count += 1;
  });

  // Calculate best topic
  let bestTopic = Object.keys(topicPerformance)[0] || 'Database Management Systems';
  let maxViews = -1;
  Object.entries(topicPerformance).forEach(([top, data]) => {
    if (data.views > maxViews) {
      maxViews = data.views;
      bestTopic = top;
    }
  });

  const bestSubject = topicPerformance[bestTopic]?.subject || 'Database Management Systems';

  // Calculate best template
  let bestTemplate = '10s-challenge';
  let maxTplViews = -1;
  Object.entries(templatePerformance).forEach(([tpl, data]) => {
    if (data.views > maxTplViews) {
      maxTplViews = data.views;
      bestTemplate = tpl;
    }
  });

  const postedCount = contentPacks.filter(p => p.status === 'POSTED').length;
  const readyCount = contentPacks.filter(p => p.status === 'READY').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="text-sky-400 font-black uppercase">Growth & Performance</span>
          <span>•</span>
          <span>Creator Intelligence Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Creator Performance Analytics
        </h1>
      </div>

      {/* WINNING CONTENT ENGINE HERO BANNER */}
      <div className="bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-indigo-500/20 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Winning Content Intelligence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Top Converting Topic: <span className="text-sky-400">{bestTopic}</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Your {bestTopic} content and "{bestTemplate}" template drive the highest engagement and Play Store app conversions. Replicate this winning pattern with fresh questions.
            </p>
          </div>

          <button
            onClick={() => onGenerateMoreLikeThis(bestSubject, bestTopic)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all cursor-pointer shrink-0"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Generate More Like This (Winning Topic)</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Total Views</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalViews.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Total Likes</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLikes.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Comments</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalComments.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Shares</span>
            <Share2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalShares.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Saves</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalSaves.toLocaleString()}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">Followers</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">+{totalFollowers.toLocaleString()}</div>
        </div>
      </div>

      {/* Production Pipeline & Question Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Question Bank Utilization</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Unused Fresh Questions</span>
              <span className="text-sky-400 font-extrabold">{datasetStats.unusedCount} / {datasetStats.totalQuestions}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-sky-500"
                style={{ width: `${Math.round((datasetStats.unusedCount / datasetStats.totalQuestions) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pt-2">
              <span>Published / Posted Content</span>
              <span className="text-emerald-400 font-extrabold">{postedCount} Posts</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Ready in Content Queue</span>
              <span className="text-amber-400 font-extrabold">{readyCount} Packages</span>
            </div>
          </div>
        </div>

        {/* Best Performing Topics Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Topic Engagement Rankings</span>
          </h3>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {Object.entries(topicPerformance).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Log analytics on generated content packages to see topic ranking breakdowns.
              </p>
            ) : (
              Object.entries(topicPerformance)
                .sort((a, b) => b[1].views - a[1].views)
                .map(([topic, data], idx) => (
                  <div
                    key={topic}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-slate-500">#{idx + 1}</span>
                      <span className="font-bold text-white">{topic}</span>
                    </div>
                    <div className="text-right font-mono font-bold text-sky-400">
                      {data.views} views ({data.count} packs)
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
