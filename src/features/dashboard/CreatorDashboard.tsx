import React, { useState, useEffect } from 'react';
import { NormalizedQuestion } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { StorageService, ShortRecord } from '../../services/storageService';
import { BrandKitService } from '../../services/brandKitService';
import {
  Video,
  Sparkles,
  Zap,
  BookOpen,
  Play,
  Download,
  Copy,
  Check,
  Plus,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { BytePrepLogo } from '../../components/BytePrepLogo';

interface CreatorDashboardProps {
  onNavigate: (tab: any) => void;
  onOpenShortsStudio: (questionId?: string) => void;
  onOpenBrandKit: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onNavigate,
  onOpenShortsStudio,
  onOpenBrandKit,
}) => {
  const brandKit = BrandKitService.getBrandKit();
  const allQuestions = QuestionLoader.getAllQuestions();
  const datasetStats = QuestionLoader.getDatasetStats();
  const allSubjects = QuestionLoader.getAllSubjects();

  const [dailyQuestion, setDailyQuestion] = useState<NormalizedQuestion | null>(null);
  const [historyRecords, setHistoryRecords] = useState<ShortRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const { question } = QuestionLoader.getDailyQuestion(todayStr);
    setDailyQuestion(question);
    setHistoryRecords(StorageService.getShortsRecords());
  }, []);

  const handleCopyCaption = (record: ShortRecord) => {
    const text = `${record.title}\n\nCan you solve this question? Comment your answer below! 👇\n\n#BytePrep #ComputerScience #DSSSB #TGTCS #PGTCS #PYQ #CodingQuiz #TechShorts`;
    navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.deleteShortRecord(id);
    setHistoryRecords(StorageService.getShortsRecords());
  };

  const handleQuickSubjectShort = (subject: string) => {
    const q = QuestionLoader.getRandomQuestion({ subject });
    if (q) {
      onOpenShortsStudio(q.id);
    }
  };

  const handleQuickRandomShort = () => {
    const q = QuestionLoader.getRandomQuestion();
    if (q) {
      onOpenShortsStudio(q.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Clean Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full text-xs font-black tracking-wide flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 fill-current" />
                <span>BYTEPREP SHORTS VIDEO STUDIO</span>
              </span>
              <button
                onClick={onOpenBrandKit}
                className="px-3 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Brand: <strong className="text-white">{brandKit.brandName}</strong>
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Create Viral 9:16 Video Shorts in Seconds
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Transform {datasetStats.totalQuestions} Computer Science PYQ exam questions into high-retention vertical videos with animated timers, sound effects, custom themes & brand watermarks.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-2xl font-black text-rose-400">{datasetStats.totalQuestions}</div>
              <div className="text-[11px] text-slate-400 font-bold">CS Questions</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[110px]">
              <div className="text-2xl font-black text-emerald-400">{historyRecords.length}</div>
              <div className="text-[11px] text-slate-400 font-bold">Videos Created</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Video of the Day Banner */}
      {dailyQuestion && (
        <div className="bg-gradient-to-r from-rose-500/10 via-slate-900 to-sky-500/10 border-2 border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                  🔥 RECOMMENDED VIDEO FOR TODAY
                </span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                  {dailyQuestion.subject} • {dailyQuestion.topic}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
                {dailyQuestion.question}
              </h3>
            </div>

            <button
              onClick={() => onOpenShortsStudio(dailyQuestion.id)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer shrink-0"
            >
              <Video className="w-4 h-4 fill-current" />
              <span>Create Video Short</span>
            </button>
          </div>
        </div>
      )}

      {/* Core Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Shorts Studio (Main Editor) */}
        <div
          onClick={() => onOpenShortsStudio()}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-3xl transition-all cursor-pointer space-y-4 group shadow-xl hover:shadow-rose-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
              <Video className="w-5 h-5 fill-current" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Shorts Studio</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              9:16 Video Editor with animated timers, sound & themes.
            </p>
          </div>
        </div>

        {/* 2. Auto-Poster & Series Incrementer */}
        <div
          onClick={() => onNavigate('autopost')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl transition-all cursor-pointer space-y-4 group shadow-xl hover:shadow-amber-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              #1, #2 Series
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Social Auto-Poster</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              1-Click post to FB, YouTube, IG with auto # series and queue.
            </p>
          </div>
        </div>

        {/* 3. 1-Click Instant Random Video */}
        <div
          onClick={handleQuickRandomShort}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition-all cursor-pointer space-y-4 group shadow-xl hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Instant Random Short</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Picks a random high-impact PYQ and launches generator.
            </p>
          </div>
        </div>

        {/* 4. Question Bank */}
        <div
          onClick={() => onNavigate('questions')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-3xl transition-all cursor-pointer space-y-4 group shadow-xl hover:shadow-sky-500/10"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Question Bank</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Browse {datasetStats.totalQuestions} questions by subject & exam.
            </p>
          </div>
        </div>
      </div>

      {/* Subject Quick Video Generators */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate by Subject</span>
          </h3>
          <span className="text-xs text-slate-400">1-click to create video</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {allSubjects.slice(0, 6).map(sub => {
            const count = allQuestions.filter(q => q.subject === sub).length;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => handleQuickSubjectShort(sub)}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-rose-400 truncate">
                  {sub}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {count} questions
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated Videos History */}
      {historyRecords.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">Generated Video Library</h3>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-md">
                {historyRecords.length}
              </span>
            </div>
            <button
              onClick={() => onOpenShortsStudio()}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              + Create New Video
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {historyRecords.slice(0, 6).map((record, idx) => (
              <div
                key={`${record.id}-${idx}`}
                onClick={() => onOpenShortsStudio(record.questionId)}
                className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {record.thumbnailUrl ? (
                    <img
                      src={record.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-12 h-16 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <span className="text-rose-400">{record.subject}</span>
                      <span>•</span>
                      <span>{record.duration.toFixed(1)}s</span>
                      <span>•</span>
                      <span>{record.quality}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-300">
                      {record.title}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {new Date(record.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleCopyCaption(record);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Copy Caption & Hashtags"
                  >
                    {copiedId === record.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={e => handleDeleteRecord(record.id, e)}
                    className="p-2 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
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
