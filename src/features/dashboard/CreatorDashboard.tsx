import React, { useState, useEffect } from 'react';
import {
  NormalizedQuestion,
  GeneratedContentPack,
  BrandKitConfig,
} from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { ContentSelectionEngine } from '../../services/contentSelectionEngine';
import { IndexedDbService } from '../../services/indexedDbService';
import { BrandKitService } from '../../services/brandKitService';
import {
  Sparkles,
  Layers,
  Video,
  Plus,
  Send,
  BarChart2,
  Calendar,
  Database,
  Palette,
  ChevronRight,
  Eye,
  CheckCircle2,
  TrendingUp,
  Archive,
  BookOpen,
  Zap,
  Smartphone,
  Code2,
  Megaphone,
  PieChart,
} from 'lucide-react';
import { BytePrepLogo } from '../../components/BytePrepLogo';

interface CreatorDashboardProps {
  onNavigate: (tab: any) => void;
  onOpenContentPack: (question: NormalizedQuestion) => void;
  onOpenShortsStudio: (questionId?: string) => void;
  onOpenBrandKit: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onNavigate,
  onOpenContentPack,
  onOpenShortsStudio,
  onOpenBrandKit,
}) => {
  const brandKit = BrandKitService.getBrandKit();
  const allQuestions = QuestionLoader.getAllQuestions();
  const datasetStats = QuestionLoader.getDatasetStats();

  const [recentPacks, setRecentPacks] = useState<GeneratedContentPack[]>([]);
  const [dailyQuestion, setDailyQuestion] = useState<NormalizedQuestion | null>(null);

  useEffect(() => {
    IndexedDbService.getAllContentPacks().then(packs => {
      packs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentPacks(packs.slice(0, 5));

      // Calculate recommended question
      const rec = ContentSelectionEngine.getRecommendedDailyCreatorQuestion(allQuestions, packs);
      setDailyQuestion(rec);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>BYTEPREP CONTENT FACTORY PRO</span>
              </span>
              <button
                onClick={onOpenBrandKit}
                className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Palette className="w-3 h-3 text-sky-400" />
                <span>{brandKit.brandName}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Personal Content & Growth Engine
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Automate high-converting Instagram Reels, 9:16 Stories, 4:5 Carousels, YouTube Shorts, Code Challenges, and Telegram Quizzes to promote <strong className="text-sky-400 font-black">{brandKit.brandName}</strong>.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-sky-400">{datasetStats.totalQuestions}</div>
              <div className="text-[11px] text-slate-400 font-semibold">Total CS Questions</div>
            </div>
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{datasetStats.unusedCount}</div>
              <div className="text-[11px] text-slate-400 font-semibold">Unused Fresh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Question of the Day Banner */}
      {dailyQuestion && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10 border-2 border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-black uppercase">
                  ⭐ RECOMMENDED FOR TODAY'S POST
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                  {dailyQuestion.subject} • {dailyQuestion.topic}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug pt-1">
                {dailyQuestion.question}
              </h3>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onOpenContentPack(dailyQuestion)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Content Pack</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Creator Pro Studio Tools Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          Creator Studio Pro Engines
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. 1-Click Content Factory */}
          <div
            onClick={() => onNavigate('factory')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Content Factory (1-Click Batch)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Automated 5-20 question production with Content IDs and AI Fact-Checking.
              </p>
            </div>
          </div>

          {/* 2. 9:16 Vertical Stories */}
          <div
            onClick={() => onNavigate('story')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
                <Smartphone className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">9:16 Story Sequence Studio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate 1080x1920 5-frame vertical stories (Hook → Question → Timer → Answer → CTA).
              </p>
            </div>
          </div>

          {/* 3. 4:5 Instagram Carousels */}
          <div
            onClick={() => onNavigate('carousel')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                <Layers className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">4:5 Instagram Carousel Studio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Multi-slide swipeable carousels with retention traps and branded solution slides.
              </p>
            </div>
          </div>

          {/* 4. Code & Bug Hunting Challenges */}
          <div
            onClick={() => onNavigate('code-challenge')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                <Code2 className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Code & Bug Hunt Studio</h3>
              <p className="text-xs text-slate-400 mt-1">
                Syntax-highlighted code output & debug challenges with 10s countdown timer.
              </p>
            </div>
          </div>

          {/* 5. Campaign Manager */}
          <div
            onClick={() => onNavigate('campaigns')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                <Megaphone className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Campaign Manager</h3>
              <p className="text-xs text-slate-400 mt-1">
                Launch 30-Day DSSSB / KVS revision sprints with goals & progress trackers.
              </p>
            </div>
          </div>

          {/* 6. Content Gap Finder */}
          <div
            onClick={() => onNavigate('gap-finder')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <PieChart className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Content Gap & Audience Intel</h3>
              <p className="text-xs text-slate-400 mt-1">
                Discover underrepresented CS topics and generate content to fill coverage gaps.
              </p>
            </div>
          </div>

          {/* 7. Social Conversion & UTM Tracking */}
          <div
            onClick={() => onNavigate('conversion')}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Conversion & UTM Tracker</h3>
              <p className="text-xs text-slate-400 mt-1">
                Build tagged links, track clicks, and attribute Play Store app downloads.
              </p>
            </div>
          </div>

          {/* 8. Shorts Video Studio */}
          <div
            onClick={() => onOpenShortsStudio()}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all cursor-pointer space-y-3 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                <Video className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Shorts Studio (9:16 Video)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Record animated vertical video with 12 dynamic themes, timers, and SFX.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Generated Packages Table */}
      {recentPacks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Recent Content Packages</h3>
            <button
              onClick={() => onNavigate('queue')}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              View All in Queue →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentPacks.map(pack => (
              <div
                key={pack.id}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-sky-400 rounded">
                      {pack.contentId || pack.question.id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {pack.question.subject}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {pack.hook || pack.question.question}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenContentPack(pack.question)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
