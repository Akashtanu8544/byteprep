import React, { useState, useEffect, useRef } from 'react';
import {
  NormalizedQuestion,
  GeneratedContentPack,
  ShortTemplate,
  ShortTheme,
  BrandKitConfig,
  Difficulty,
} from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { ContentSelectionEngine, DiversityMode } from '../../services/contentSelectionEngine';
import { TemplateService } from '../../services/templateService';
import { SHORTS_THEMES } from '../shorts/themes';
import { BrandKitService } from '../../services/brandKitService';
import { AiContentEngine } from '../../services/aiContentEngine';
import { IndexedDbService } from '../../services/indexedDbService';
import { ExportService } from '../../services/exportService';
import {
  Layers,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Archive,
  Download,
  Check,
  ChevronRight,
  Filter,
  Volume2,
  Mic,
  Sliders,
} from 'lucide-react';

interface BatchGeneratorProps {
  onOpenContentPack?: (question: NormalizedQuestion) => void;
  onViewQueue?: () => void;
}

export interface BatchItemState {
  index: number;
  question: NormalizedQuestion;
  hook: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  pack?: GeneratedContentPack;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({ onOpenContentPack, onViewQueue }) => {
  const brandKit = BrandKitService.getBrandKit();
  const templates = TemplateService.getAllTemplates();
  const allQuestions = QuestionLoader.getAllQuestions();
  const subjects = ['All', ...QuestionLoader.getAllSubjects()];

  // Filter Configuration
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'mixed'>('mixed');
  const [diversityMode, setDiversityMode] = useState<DiversityMode>('balanced');
  const [batchCount, setBatchCount] = useState<number>(10);

  // Template & Theme
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('10s-challenge');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('byteprep-dark');
  const [includeSfx, setIncludeSfx] = useState<boolean>(true);
  const [includeVoice, setIncludeVoice] = useState<boolean>(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('Hinglish');

  // Batch Execution State
  const [batchItems, setBatchItems] = useState<BatchItemState[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  const isPausedRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  // Prepare batch queue based on smart selection
  const handlePrepareBatch = () => {
    const selected = ContentSelectionEngine.selectOptimalQuestions(allQuestions, {
      subject: selectedSubject,
      exam: selectedExam,
      difficulty: selectedDifficulty,
      mode: diversityMode,
      targetCount: batchCount,
    });

    const items: BatchItemState[] = selected.map((q, idx) => {
      const hooks = AiContentEngine.generateHooks(q);
      return {
        index: idx,
        question: q,
        hook: hooks[0]?.text || 'CAN YOU SOLVE THIS IN 10 SECONDS?',
        status: 'pending',
      };
    });

    setBatchItems(items);
    setCurrentIndex(0);
    setCompletedCount(0);
    setFailedCount(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  useEffect(() => {
    handlePrepareBatch();
  }, [selectedSubject, selectedExam, selectedDifficulty, diversityMode, batchCount]);

  // Start / Resume Batch Processing Loop
  const startBatchProcessing = async () => {
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;

    const tpl = TemplateService.getTemplateById(selectedTemplateId);

    for (let i = currentIndex; i < batchItems.length; i++) {
      if (isCancelledRef.current) break;

      while (isPausedRef.current) {
        await new Promise(r => setTimeout(r, 200));
        if (isCancelledRef.current) break;
      }
      if (isCancelledRef.current) break;

      setCurrentIndex(i);

      // Mark processing
      setBatchItems(prev =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing' } : item))
      );

      try {
        const item = batchItems[i];
        const { shortExplanation, detailedExplanation } = AiContentEngine.processExplanations(item.question);
        const copy = AiContentEngine.generateSocialCopy(item.question, item.hook, tpl, brandKit);

        const pack: GeneratedContentPack = {
          id: `batch_${Date.now()}_${item.question.id}`,
          questionId: item.question.id,
          question: item.question,
          hook: item.hook,
          shortExplanation,
          detailedExplanation,
          youtubeTitle: copy.youtubeTitle,
          youtubeDescription: copy.youtubeDescription,
          reelsCaption: copy.reelsCaption,
          telegramPostText: copy.telegramPostText,
          whatsappBroadcastText: copy.whatsappBroadcastText,
          hashtags: copy.hashtags,
          cta: copy.ctaText,
          templateId: selectedTemplateId,
          themeId: selectedThemeId,
          createdAt: new Date().toISOString(),
          status: 'READY',
          platforms: ['youtube', 'instagram', 'telegram'],
          postedAt: null,
        };

        // Save to IndexedDB
        await IndexedDbService.saveContentPack(pack);
        QuestionLoader.recordQuestionUsage(item.question.id, 'READY');

        // Small interval to prevent UI locking
        await new Promise(r => setTimeout(r, 120));

        setBatchItems(prev =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'completed', pack } : it))
        );
        setCompletedCount(prev => prev + 1);
      } catch (err: any) {
        console.error(`Error processing batch item #${i + 1}:`, err);
        setBatchItems(prev =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'failed', error: err.message } : it))
        );
        setFailedCount(prev => prev + 1);
      }
    }

    setIsRunning(false);
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleRetryFailed = () => {
    setBatchItems(prev =>
      prev.map(it => (it.status === 'failed' ? { ...it, status: 'pending', error: undefined } : it))
    );
    startBatchProcessing();
  };

  const progressPercent =
    batchItems.length > 0 ? Math.round(((completedCount + failedCount) / batchItems.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>BYTEPREP PRODUCTION FACTORY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Batch Content Generator
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Generate 10, 20, or 50 complete Content Packages (Shorts, Reels, Thumbnails, Captions, Hashtags, Telegram Polls) simultaneously using intelligent question scoring and topic diversity.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-sky-400">{allQuestions.length}</div>
              <div className="text-[11px] text-slate-400 font-semibold">Available Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Setup Configuration Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Batch Selection & Engine Settings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Batch Quantity</label>
            <select
              value={batchCount}
              onChange={e => setBatchCount(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
              <option value={50}>50 Questions (Full Series)</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              {subjects.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Diversity Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Content Diversity</label>
            <select
              value={diversityMode}
              onChange={e => setDiversityMode(e.target.value as DiversityMode)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="balanced">Balanced Cross-Domain</option>
              <option value="fresh-questions">Fresh / Unused Bonus</option>
              <option value="topic-focus">Topic Focus</option>
              <option value="best-performing">Best Performing Topics</option>
              <option value="random-weighted">Weighted Random</option>
            </select>
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Template</label>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Visual Theme</label>
            <select
              value={selectedThemeId}
              onChange={e => setSelectedThemeId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              {Object.values(SHORTS_THEMES).map(th => (
                <option key={th.id} value={th.id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio & Voice Controls */}
        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSfx}
              onChange={e => setIncludeSfx(e.target.checked)}
              className="w-4 h-4 accent-sky-500"
            />
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Include Synchronized Audio SFX</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVoice}
              onChange={e => setIncludeVoice(e.target.checked)}
              className="w-4 h-4 accent-sky-500"
            />
            <Mic className="w-4 h-4 text-purple-400" />
            <span>Voice-Over Narration (Optional)</span>
          </label>

          {includeVoice && (
            <select
              value={voiceLanguage}
              onChange={e => setVoiceLanguage(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-sky-500"
            >
              <option value="Hinglish">Hinglish (Exam Aspirant Natural)</option>
              <option value="English">English (Clear Academic)</option>
              <option value="Hindi">Hindi (Shuddh)</option>
            </select>
          )}
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center gap-3 pt-2">
          {!isRunning ? (
            <button
              onClick={startBatchProcessing}
              disabled={batchItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-5 h-5 text-slate-950 fill-current" />
              <span>START BATCH GENERATION ({batchItems.length} CONTENT PACKS)</span>
            </button>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              {!isPaused ? (
                <button
                  onClick={handlePause}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Generation</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Generation</span>
                </button>
              )}

              <button
                onClick={handleCancel}
                className="px-5 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-black text-sm rounded-xl border border-rose-500/30 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {failedCount > 0 && !isRunning && (
            <button
              onClick={handleRetryFailed}
              className="flex items-center gap-2 px-4 py-3.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry {failedCount} Failed</span>
            </button>
          )}

          {onViewQueue && (
            <button
              onClick={onViewQueue}
              className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              View Content Queue →
            </button>
          )}
        </div>
      </div>

      {/* Live Batch Progress Bar */}
      {(isRunning || completedCount > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                Batch Progress
              </span>
              <h3 className="text-lg font-black text-white">
                {completedCount + failedCount} of {batchItems.length} Content Packs Generated
              </h3>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-white">{progressPercent}%</span>
              <div className="text-[11px] text-emerald-400 font-bold">
                ✓ {completedCount} Done {failedCount > 0 && `• ❌ ${failedCount} Failed`}
              </div>
            </div>
          </div>

          {/* Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Batch Item List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Batch Queue Items ({batchItems.length})
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Auto-persisted to IndexedDB
          </span>
        </div>

        <div className="space-y-2.5">
          {batchItems.map((item, idx) => (
            <div
              key={item.question.id || idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.status === 'processing'
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-md'
                  : item.status === 'completed'
                  ? 'bg-slate-900 border-emerald-500/30'
                  : item.status === 'failed'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                    item.status === 'completed'
                      ? 'bg-emerald-500 text-slate-950'
                      : item.status === 'processing'
                      ? 'bg-sky-500 text-slate-950 animate-pulse'
                      : item.status === 'failed'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.status === 'completed' ? '✓' : idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                      {item.question.subject}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      {item.question.topic}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">
                      Hook: "{item.hook.slice(0, 35)}..."
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">
                    {item.question.question}
                  </p>
                  {item.error && <p className="text-[11px] text-rose-400 font-bold">{item.error}</p>}
                </div>
              </div>

              {/* Status indicator & preview button */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'completed' && onOpenContentPack && (
                  <button
                    onClick={() => onOpenContentPack(item.question)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <span>Inspect Pack</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.status === 'processing' && (
                  <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold">
                    <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}

                {item.status === 'pending' && (
                  <span className="text-xs text-slate-500 font-semibold">Queued</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
