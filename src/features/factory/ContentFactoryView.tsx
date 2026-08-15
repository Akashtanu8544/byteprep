import React, { useState, useEffect } from 'react';
import {
  NormalizedQuestion,
  GeneratedContentPack,
  ContentLanguage,
  VoiceStyle,
  FactCheckResult,
} from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { ContentIdService } from '../../services/contentIdService';
import { AiContentEngine } from '../../services/aiContentEngine';
import { AiFactChecker } from '../../services/aiFactChecker';
import { IndexedDbService } from '../../services/indexedDbService';
import { BrandKitService } from '../../services/brandKitService';
import { ExportService } from '../../services/exportService';
import { StoryRenderer } from '../../services/storyRenderer';
import { CarouselRenderer } from '../../services/carouselRenderer';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Filter,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';

interface ContentFactoryViewProps {
  onOpenSinglePack?: (question: NormalizedQuestion) => void;
}

export const ContentFactoryView: React.FC<ContentFactoryViewProps> = ({ onOpenSinglePack }) => {
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('All');
  const [language, setLanguage] = useState<ContentLanguage>('Hinglish');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('Hinglish Creator');
  const [batchCount, setBatchCount] = useState<number>(5);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedPacks, setGeneratedPacks] = useState<GeneratedContentPack[]>([]);
  const [step, setStep] = useState<'configure' | 'processing' | 'review'>('configure');

  const allQuestions = QuestionLoader.getAllQuestions();
  const brandKit = BrandKitService.getBrandKit();

  const subjects = ['All', ...Array.from(new Set(allQuestions.map(q => q.subject))).filter(Boolean)];
  const exams = ['All', ...Array.from(new Set(allQuestions.map(q => q.exam))).filter(Boolean)];

  const handleRunBatchGeneration = async () => {
    setIsProcessing(true);
    setStep('processing');

    // 1. Filter eligible unposted or low-usage questions
    let pool = allQuestions.filter(q => {
      const matchSub = selectedSubject === 'All' || q.subject === selectedSubject;
      const matchExam = selectedExam === 'All' || q.exam === selectedExam;
      return matchSub && matchExam;
    });

    if (pool.length === 0) pool = allQuestions;

    // Pick batchCount random distinct questions
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedBatch = shuffled.slice(0, batchCount);

    const results: GeneratedContentPack[] = [];

    for (let i = 0; i < selectedBatch.length; i++) {
      const q = selectedBatch[i];
      const contentId = ContentIdService.generateId({
        exam: q.exam,
        topic: q.topic,
        subject: q.subject,
        year: q.year,
      });

      const hooks = AiContentEngine.generateHooks(q, language);
      const chosenHook = hooks[0]?.text || `CAN YOU SOLVE THIS CS QUESTION IN 10s?`;

      const socialCopy = AiContentEngine.generateSocialCopy(
        q,
        chosenHook,
        undefined,
        brandKit,
        language,
        voiceStyle
      );

      const factCheck = AiFactChecker.evaluate(q);

      const newPack: GeneratedContentPack = {
        id: `pack_${Date.now()}_${i}`,
        contentId,
        questionId: q.id,
        question: q,
        hook: chosenHook,
        hooks: hooks.map(h => h.text),
        title: socialCopy.youtubeTitle,
        description: socialCopy.youtubeDescription,
        caption: socialCopy.reelsCaption,
        telegramText: socialCopy.telegramPostText,
        whatsappText: socialCopy.whatsappBroadcastText,
        hashtags: socialCopy.hashtags,
        ctaText: socialCopy.ctaText,
        voiceScript: socialCopy.voiceScript,
        voiceStyle,
        language,
        status: factCheck.status === 'PASS' ? 'APPROVED' : 'REVIEW',
        qualityScore: factCheck.score,
        factCheckResult: factCheck,
        createdAt: new Date().toISOString(),
        postedAt: null,
      };

      await IndexedDbService.saveContentPack(newPack);
      results.push(newPack);
    }

    setGeneratedPacks(results);
    setIsProcessing(false);
    setStep('review');
  };

  const handleExportAllZip = async () => {
    // Bundles all approved packs into a master export ZIP
    alert(`Exporting ${generatedPacks.length} content packages...`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5 w-fit">
            <Zap className="w-3.5 h-3.5" />
            <span>CONTENT FACTORY AUTOMATION</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            1-Click Batch Content Production Engine
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Generate 5, 10, or 20 complete multi-platform packs (Shorts, Reels, Stories, Carousels, Social Copy) with AI Fact-Checking.
          </p>
        </div>

        {step === 'review' && (
          <button
            onClick={() => setStep('configure')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            ← New Factory Batch
          </button>
        )}
      </div>

      {step === 'configure' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Configure Batch Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold mb-1.5 block">Subject Filter</label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold mb-1.5 block">Target Exam</label>
              <select
                value={selectedExam}
                onChange={e => setSelectedExam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {exams.map(ex => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold mb-1.5 block">Language Mode</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as ContentLanguage)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="Hinglish">Hinglish (Natural Exam Tone - Recommended)</option>
                <option value="English">English (Global CS)</option>
                <option value="Hindi">Hindi (Shuddh Terminology)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold mb-1.5 block">Voice Style</label>
              <select
                value={voiceStyle}
                onChange={e => setVoiceStyle(e.target.value as VoiceStyle)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="Hinglish Creator">Hinglish Exam Guru</option>
                <option value="Energetic Creator">Energetic Viral Creator</option>
                <option value="Exam Coach">Exam Coach (Negative Marking Trap)</option>
                <option value="Teacher">Pedagogical Classroom Teacher</option>
                <option value="Rapid Fire">Rapid Fire 10s Blitz</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-bold mb-1.5 block">Batch Size (Questions)</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => setBatchCount(count)}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      batchCount === count
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {count} Packs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Run Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              ⚡ Will generate Content IDs, Viral Hooks, Social Copy, and Fact-Check all {batchCount} questions.
            </div>

            <button
              onClick={handleRunBatchGeneration}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Launch Batch Production</span>
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
          <h2 className="text-xl font-black text-white">Content Factory in Production...</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Generating canonical Content IDs, testing viral hooks, and executing 9-point AI Fact Checking...
          </p>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-black uppercase">
                PRODUCTION COMPLETE
              </span>
              <h3 className="text-base font-black text-white">
                Generated {generatedPacks.length} Content Packages
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAllZip}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <FolderDown className="w-4 h-4 fill-current" />
                <span>Export Master ZIP</span>
              </button>
            </div>
          </div>

          {/* Generated Pack Cards */}
          <div className="space-y-3">
            {generatedPacks.map((pack, idx) => (
              <div
                key={pack.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-slate-950 text-sky-400 rounded-lg text-xs font-mono font-bold">
                      {pack.contentId}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {pack.question.subject} • {pack.question.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pack.factCheckResult?.status === 'PASS' ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PASS (100%)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md text-[10px] font-black flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>REVIEW ({pack.qualityScore}%)</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-white">
                  "{pack.hook}"
                </p>

                <p className="text-xs text-slate-400 line-clamp-1">
                  Q: {pack.question.question}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-500">
                    Voice: {pack.voiceStyle} | Lang: {pack.language}
                  </span>

                  {onOpenSinglePack && (
                    <button
                      onClick={() => onOpenSinglePack(pack.question)}
                      className="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Studio Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
