import React, { useState } from 'react';
import { UserStats, ChallengeSettings } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import {
  Zap,
  Flame,
  Award,
  Video,
  Settings,
  Database,
  Play,
  Calendar,
  Layers,
  Sparkles,
  Target,
  BarChart3,
  CheckCircle2,
  BookOpen,
  Upload,
  Share2,
  Send,
  FileImage,
  Bot,
} from 'lucide-react';

interface ChallengeHomeProps {
  stats: UserStats;
  settings: ChallengeSettings;
  onStartRandomPlay: (subject?: string) => void;
  onStartDailyPlay: () => void;
  onOpenStudio: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
  onOpenQuestions: () => void;
  onOpenPolls?: () => void;
  onOpenFlashcards?: () => void;
  onOpenAiQuiz?: () => void;
}

export const ChallengeHome: React.FC<ChallengeHomeProps> = ({
  stats,
  settings,
  onStartRandomPlay,
  onStartDailyPlay,
  onOpenStudio,
  onOpenReport,
  onOpenSettings,
  onOpenQuestions,
  onOpenPolls,
  onOpenFlashcards,
  onOpenAiQuiz,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const todayStr = new Date().toISOString().split('T')[0];
  const { question: dailyQ, dayNumber } = QuestionLoader.getDailyQuestion(todayStr);

  const subjects = ['All', ...QuestionLoader.getAllSubjects()];
  const accuracyPct =
    stats.challengesAttempted > 0
      ? Math.round((stats.correctAnswers / stats.challengesAttempted) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-slate-100 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">BYTEPREP CS</h1>
              <p className="text-sky-400 font-extrabold text-xs">⚡ 10 SECOND CHALLENGE</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenReport}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Database Report"
            >
              <Database className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-slate-300 text-sm font-semibold leading-relaxed mb-6">
          "Can you solve this CS exam MCQ before the timer hits zero?"
        </p>

        {/* Today's Daily Challenge Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Calendar className="w-4 h-4" />
              <span>TODAY'S DAILY CHALLENGE • DAY #{String(dayNumber).padStart(3, '0')}</span>
            </div>
            {stats.lastChallengeDate === todayStr && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>COMPLETED</span>
              </span>
            )}
          </div>

          <p className="text-white font-bold text-sm mb-3 line-clamp-2">
            {dailyQ.question}
          </p>

          <button
            onClick={onStartDailyPlay}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY TODAY'S DAILY CHALLENGE</span>
          </button>
        </div>

        {/* Streaks & Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold mb-1">
              <Flame className="w-4 h-4 fill-current" />
              <span>STREAK</span>
            </div>
            <span className="text-xl font-black text-white">{stats.currentStreak} Days</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-sky-400 text-xs font-bold mb-1">
              <Award className="w-4 h-4" />
              <span>BEST SCORE</span>
            </div>
            <span className="text-xl font-black text-white">{stats.bestScore}</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold mb-1">
              <Target className="w-4 h-4" />
              <span>ACCURACY</span>
            </div>
            <span className="text-xl font-black text-white">{accuracyPct}%</span>
          </div>
        </div>
      </div>

      {/* Quick Play Subject Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Select Practice Category</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {QuestionLoader.getAllQuestions().length} MCQs
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === s
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Play Now Main Button */}
        <button
          onClick={() => onStartRandomPlay(selectedSubject)}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-base rounded-2xl transition-all shadow-xl shadow-sky-500/25 cursor-pointer transform active:scale-98"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>START 10 SECOND CHALLENGE</span>
        </button>
      </div>

      {/* AI Smart Quiz Highlight Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-md">
                Gemini 3.7 Flash AI
              </span>
              <span className="text-xs text-amber-400 font-bold">10 MCQs Generator</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
              Smart Quiz Generator from Any Topic Keyword
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Type any topic like "Subnetting", "Deadlocks", "B+ Trees" or "SQL Joins" to auto-generate 10 exam-ready MCQs with solutions.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAiQuiz}
          className="shrink-0 flex items-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-500 hover:from-indigo-400 hover:to-sky-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
          <span>Generate 10 MCQs</span>
        </button>
      </div>

      {/* Creator Studio Hub - 4 Core Productivity Modules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>BytePrep Creator & Study Suite</span>
          </span>
          <span className="text-[11px] text-slate-500 font-semibold">4 Fast 1-Click Tools</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Shorts Video Studio */}
          <div className="bg-gradient-to-br from-rose-950/40 to-pink-950/30 border border-rose-500/30 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-rose-400 transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs mb-1">
                <Video className="w-4 h-4" />
                <span>SHORTS STUDIO</span>
              </div>
              <p className="text-slate-300 font-medium text-xs leading-relaxed">
                Render 9:16 vertical short videos with animated timer.
              </p>
            </div>

            <button
              onClick={onOpenStudio}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Video</span>
            </button>
          </div>

          {/* 2. Poll Post Maker */}
          <div className="bg-gradient-to-br from-sky-950/40 to-blue-950/30 border border-sky-500/30 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-sky-400 transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-sky-400 font-black text-xs mb-1">
                <Send className="w-4 h-4" />
                <span>POLL POST MAKER</span>
              </div>
              <p className="text-slate-300 font-medium text-xs leading-relaxed">
                Auto-push Telegram quiz polls & copy for YouTube/Facebook.
              </p>
            </div>

            <button
              onClick={onOpenPolls || onOpenStudio}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Create Poll Post</span>
            </button>
          </div>

          {/* 3. FlashCard Maker */}
          <div className="bg-gradient-to-br from-amber-950/40 to-yellow-950/30 border border-amber-500/30 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-amber-400 transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs mb-1">
                <FileImage className="w-4 h-4" />
                <span>FLASHCARD MAKER</span>
              </div>
              <p className="text-slate-300 font-medium text-xs leading-relaxed">
                1-Click download 1080x1080 study flashcards with solutions.
              </p>
            </div>

            <button
              onClick={onOpenFlashcards || onOpenStudio}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Make Flashcard</span>
            </button>
          </div>

          {/* 4. Question Bank & JSON Importer */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 rounded-3xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-emerald-400 transition-all">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs mb-1">
                <BookOpen className="w-4 h-4" />
                <span>JSON BANK</span>
              </div>
              <p className="text-slate-300 font-medium text-xs leading-relaxed">
                Import custom JSON questions & manage question pool.
              </p>
            </div>

            <button
              onClick={onOpenQuestions}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
