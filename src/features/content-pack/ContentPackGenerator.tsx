import React, { useState, useEffect, useRef } from 'react';
import {
  NormalizedQuestion,
  GeneratedContentPack,
  ShortTemplate,
  ShortTheme,
  BrandKitConfig,
  ContentLanguage,
  VoiceStyle,
  FactCheckResult,
} from '../../types';
import { AiContentEngine, GeneratedHookOption, GeneratedSocialCopy } from '../../services/aiContentEngine';
import { ContentSelectionEngine, DuplicateCheckResult } from '../../services/contentSelectionEngine';
import { TemplateService } from '../../services/templateService';
import { SHORTS_THEMES } from '../shorts/themes';
import { BrandKitService } from '../../services/brandKitService';
import { ExportService } from '../../services/exportService';
import { IndexedDbService } from '../../services/indexedDbService';
import { QuestionLoader } from '../../services/questionLoader';
import { ContentIdService } from '../../services/contentIdService';
import { AiFactChecker } from '../../services/aiFactChecker';
import { VoiceService, VOICE_STYLES } from '../../services/voiceService';
import {
  Sparkles,
  Layers,
  Video,
  Download,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  Send,
  Instagram,
  Youtube,
  FileText,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Eye,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BytePrepLogo } from '../../components/BytePrepLogo';

interface ContentPackGeneratorProps {
  question: NormalizedQuestion;
  onOpenShortsStudio?: (questionId: string) => void;
  onOpenFlashcardMaker?: (questionId: string) => void;
  onOpenPollMaker?: (questionId: string) => void;
  onBack?: () => void;
  onSaveToQueue?: (pack: GeneratedContentPack) => void;
}

export const ContentPackGenerator: React.FC<ContentPackGeneratorProps> = ({
  question,
  onOpenShortsStudio,
  onOpenFlashcardMaker,
  onOpenPollMaker,
  onBack,
  onSaveToQueue,
}) => {
  const brandKit: BrandKitConfig = BrandKitService.getBrandKit();
  const templates: ShortTemplate[] = TemplateService.getAllTemplates();

  // Content ID
  const [contentId, setContentId] = useState<string>(
    ContentIdService.generateId({
      exam: question.exam,
      topic: question.topic,
      subject: question.subject,
      year: question.year,
    })
  );

  // Language & Voice
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>('Hinglish');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('Hinglish Creator');
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);

  // Template & Theme selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('10s-challenge');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('byteprep-dark');

  // Hooks state
  const [availableHooks, setAvailableHooks] = useState<GeneratedHookOption[]>([]);
  const [selectedHook, setSelectedHook] = useState<string>('');

  // Fact check results
  const [factCheck, setFactCheck] = useState<FactCheckResult>(AiFactChecker.evaluate(question));

  // Generated social copy
  const [socialCopy, setSocialCopy] = useState<GeneratedSocialCopy | null>(null);
  const [activeCopyTab, setActiveCopyTab] = useState<'instagram' | 'youtube' | 'telegram' | 'whatsapp' | 'voice' | 'hashtags'>('instagram');

  // Copy status
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Duplicate check
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState<boolean>(false);

  // Canvas refs
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashcardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const squarePostCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize hooks, fact-check and duplicate check
  useEffect(() => {
    const hooks = AiContentEngine.generateHooks(question, contentLanguage);
    setAvailableHooks(hooks);
    setSelectedHook(hooks[0]?.text || 'CAN YOU SOLVE THIS IN 10 SECONDS?');

    setFactCheck(AiFactChecker.evaluate(question));

    IndexedDbService.getAllContentPacks().then(packs => {
      const dup = ContentSelectionEngine.checkDuplicates(question, packs);
      setDuplicateResult(dup);
    });
  }, [question, contentLanguage]);

  // Recalculate copy when hook, template or language changes
  useEffect(() => {
    if (!selectedHook) return;
    const tpl = TemplateService.getTemplateById(selectedTemplateId);
    const copy = AiContentEngine.generateSocialCopy(
      question,
      selectedHook,
      tpl,
      brandKit,
      contentLanguage,
      voiceStyle
    );
    setSocialCopy(copy);
  }, [question, selectedHook, selectedTemplateId, selectedThemeId, contentLanguage, voiceStyle]);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePlayVoicePreview = async () => {
    if (!socialCopy?.voiceScript) return;
    setIsPlayingVoice(true);
    await VoiceService.playSpeechPreview(socialCopy.voiceScript, voiceStyle);
    setIsPlayingVoice(false);
  };

  const handleStopVoice = () => {
    VoiceService.stopSpeech();
    setIsPlayingVoice(false);
  };

  const handleSaveToQueueAndDb = async () => {
    if (!socialCopy) return;
    const { shortExplanation, detailedExplanation } = AiContentEngine.processExplanations(
      question,
      contentLanguage
    );

    const pack: GeneratedContentPack = {
      id: `pack_${Date.now()}_${question.id}`,
      contentId,
      questionId: question.id,
      question,
      hook: selectedHook,
      hooks: availableHooks.map(h => h.text),
      shortExplanation,
      detailedExplanation,
      youtubeTitle: socialCopy.youtubeTitle,
      youtubeDescription: socialCopy.youtubeDescription,
      reelsCaption: socialCopy.reelsCaption,
      telegramPostText: socialCopy.telegramPostText,
      whatsappBroadcastText: socialCopy.whatsappBroadcastText,
      hashtags: socialCopy.hashtags,
      cta: socialCopy.ctaText,
      voiceScript: socialCopy.voiceScript,
      voiceStyle,
      language: contentLanguage,
      templateId: selectedTemplateId,
      themeId: selectedThemeId,
      createdAt: new Date().toISOString(),
      status: factCheck.status === 'PASS' ? 'APPROVED' : 'REVIEW',
      qualityScore: factCheck.score,
      factCheckResult: factCheck,
      platforms: ['youtube', 'instagram', 'telegram'],
      postedAt: null,
    };

    await IndexedDbService.saveContentPack(pack);
    QuestionLoader.recordQuestionUsage(question.id, 'READY');

    setSaveSuccess(true);
    if (onSaveToQueue) onSaveToQueue(pack);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDownloadFullZip = async () => {
    if (!socialCopy) return;
    setIsExportingZip(true);

    try {
      const { shortExplanation, detailedExplanation } = AiContentEngine.processExplanations(
        question,
        contentLanguage
      );
      const pack: GeneratedContentPack = {
        id: `pack_${Date.now()}_${question.id}`,
        contentId,
        questionId: question.id,
        question,
        hook: selectedHook,
        hooks: availableHooks.map(h => h.text),
        shortExplanation,
        detailedExplanation,
        youtubeTitle: socialCopy.youtubeTitle,
        youtubeDescription: socialCopy.youtubeDescription,
        reelsCaption: socialCopy.reelsCaption,
        telegramPostText: socialCopy.telegramPostText,
        whatsappBroadcastText: socialCopy.whatsappBroadcastText,
        hashtags: socialCopy.hashtags,
        cta: socialCopy.ctaText,
        voiceScript: socialCopy.voiceScript,
        voiceStyle,
        language: contentLanguage,
        templateId: selectedTemplateId,
        themeId: selectedThemeId,
        createdAt: new Date().toISOString(),
        status: 'EXPORTED',
        qualityScore: factCheck.score,
        factCheckResult: factCheck,
        platforms: ['youtube', 'instagram', 'telegram'],
        postedAt: null,
      };

      const thumbnailDataUrl = thumbnailCanvasRef.current?.toDataURL('image/png');
      const squarePostDataUrl = squarePostCanvasRef.current?.toDataURL('image/png');

      const zipBlob = await ExportService.createContentPackZip(pack, {
        thumbnailDataUrl,
        squarePostDataUrl,
      });

      ExportService.triggerDownload(
        zipBlob,
        `BytePrep_ContentPack_${contentId}.zip`
      );

      await IndexedDbService.saveContentPack(pack);
      QuestionLoader.recordQuestionUsage(question.id, 'EXPORTED');
    } catch (e: any) {
      console.error('ZIP Export failed', e);
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            {onBack && (
              <button
                onClick={onBack}
                className="hover:text-sky-400 cursor-pointer transition-colors"
              >
                ← Back to Selection
              </button>
            )}
            <span>•</span>
            <span className="text-sky-400 font-extrabold uppercase">{question.subject}</span>
            <span>•</span>
            <span>{question.topic}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Content Pack Studio
            </h1>
            <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-sky-400 rounded-xl font-mono text-xs font-bold">
              ID: {contentId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveToQueueAndDb}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved to Content Queue!</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Save to Content Queue</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadFullZip}
            disabled={isExportingZip}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isExportingZip ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Building ZIP...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Download Full Content Pack (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Fact-Checker Shield Alert */}
      <div
        className={`p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          factCheck.status === 'PASS'
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : factCheck.status === 'REVIEW'
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            className={`w-6 h-6 shrink-0 mt-0.5 ${
              factCheck.status === 'PASS'
                ? 'text-emerald-400'
                : factCheck.status === 'REVIEW'
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">
                AI Fact Check Shield: {factCheck.status} ({factCheck.score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {factCheck.status === 'PASS'
                ? 'Technical accuracy, option structure, and answer mappings passed all 9 quality checks.'
                : factCheck.reasons.join(' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-400">
            {factCheck.passedChecks.length} checks passed
          </span>
        </div>
      </div>

      {/* Duplicate Content Warning Banner */}
      {duplicateResult?.isDuplicate && !ignoreDuplicateWarning && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-300 text-xs shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-black text-sm text-white">Duplicate / Similar Content Warning</p>
              <p className="mt-0.5">{duplicateResult.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Choose Another Question
              </button>
            )}
            <button
              onClick={() => setIgnoreDuplicateWarning(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black rounded-lg cursor-pointer"
            >
              Generate Anyway
            </button>
          </div>
        </div>
      )}

      {/* Core Question Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md text-[10px] font-black uppercase">
                {question.subject}
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                {question.topic}
              </span>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold">
                {question.exam}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug pt-1">
              {question.question}
            </h2>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-xs font-black text-emerald-400">
              Answer: Option ({String.fromCharCode(65 + question.correctAnswer)})
            </span>
          </div>
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.correctAnswer;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  isCorrect
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language & Voice Style Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Language Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
            Content Language Mode
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['Hinglish', 'English', 'Hindi'] as ContentLanguage[]).map(lang => (
              <button
                key={lang}
                onClick={() => setContentLanguage(lang)}
                className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  contentLanguage === lang
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Style Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Voice-Over Persona & Style
            </label>
            <button
              onClick={isPlayingVoice ? handleStopVoice : handlePlayVoicePreview}
              className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              {isPlayingVoice ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Stop Speech</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Preview Voice</span>
                </>
              )}
            </button>
          </div>

          <select
            value={voiceStyle}
            onChange={e => setVoiceStyle(e.target.value as VoiceStyle)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
          >
            {VOICE_STYLES.map(v => (
              <option key={v.id} value={v.id}>
                {v.badge} - {v.description.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STEP 1: AI Hook Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">1. Select High-CTR Viral Hook</h3>
          </div>
          <button
            onClick={() => {
              const fresh = AiContentEngine.generateHooks(question, contentLanguage);
              setAvailableHooks(fresh);
            }}
            className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Hooks</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableHooks.map((h, i) => {
            const isSelected = selectedHook === h.text;
            return (
              <div
                key={i}
                onClick={() => setSelectedHook(h.text)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {h.badge}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </div>
                <p className="text-xs font-black text-white">{h.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Multi-Platform Social Copy Tabs */}
      {socialCopy && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">2. Multi-Platform Social Assets</h3>
              <p className="text-xs text-slate-400">
                Ready-to-post copy for Instagram, YouTube, Telegram, WhatsApp & Voice Scripts.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
              <button
                onClick={() => setActiveCopyTab('instagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCopyTab === 'instagram' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram Reels</span>
              </button>

              <button
                onClick={() => setActiveCopyTab('youtube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCopyTab === 'youtube' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube Shorts</span>
              </button>

              <button
                onClick={() => setActiveCopyTab('telegram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCopyTab === 'telegram' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram Quiz</span>
              </button>

              <button
                onClick={() => setActiveCopyTab('voice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCopyTab === 'voice' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Voice Script</span>
              </button>

              <button
                onClick={() => setActiveCopyTab('hashtags')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCopyTab === 'hashtags' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span># Hashtags</span>
              </button>
            </div>
          </div>

          {/* Copy Panel */}
          <div>
            {activeCopyTab === 'instagram' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Reels Caption with Formatting:</span>
                  <button
                    onClick={() => handleCopyText(socialCopy.reelsCaption, 'instagram')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {copiedKey === 'instagram' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'instagram' ? 'Copied!' : 'Copy Caption'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  readOnly
                  value={socialCopy.reelsCaption}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none leading-relaxed"
                />
              </div>
            )}

            {activeCopyTab === 'youtube' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">YouTube Video Title:</span>
                    <button
                      onClick={() => handleCopyText(socialCopy.youtubeTitle, 'yt-title')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-xs text-slate-200 font-bold rounded-lg cursor-pointer"
                    >
                      {copiedKey === 'yt-title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Title</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={socialCopy.youtubeTitle}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">YouTube Shorts Description:</span>
                    <button
                      onClick={() => handleCopyText(socialCopy.youtubeDescription, 'yt-desc')}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 text-xs text-slate-200 font-bold rounded-lg cursor-pointer"
                    >
                      {copiedKey === 'yt-desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Description</span>
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    readOnly
                    value={socialCopy.youtubeDescription}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {activeCopyTab === 'telegram' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Telegram Channel Broadcast Message:</span>
                  <button
                    onClick={() => handleCopyText(socialCopy.telegramPostText, 'telegram')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {copiedKey === 'telegram' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'telegram' ? 'Copied!' : 'Copy Telegram Text'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  readOnly
                  value={socialCopy.telegramPostText}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none leading-relaxed"
                />
              </div>
            )}

            {activeCopyTab === 'voice' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Voice-Over Script ({voiceStyle}):</span>
                  <button
                    onClick={() => handleCopyText(socialCopy.voiceScript, 'voice')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {copiedKey === 'voice' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'voice' ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  readOnly
                  value={socialCopy.voiceScript}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none leading-relaxed"
                />
              </div>
            )}

            {activeCopyTab === 'hashtags' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Curated Hashtags:</span>
                  <button
                    onClick={() => handleCopyText(socialCopy.hashtagString, 'hashtags')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    {copiedKey === 'hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'hashtags' ? 'Copied!' : 'Copy All Hashtags'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap gap-2">
                  {socialCopy.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-sky-400 rounded-lg text-xs font-mono font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Studio Direct Launch Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {onOpenShortsStudio && (
          <div
            onClick={() => onOpenShortsStudio(question.id)}
            className="p-5 bg-gradient-to-br from-slate-900 to-rose-950/40 border border-rose-500/30 hover:border-rose-500 rounded-3xl transition-all cursor-pointer space-y-2 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <Video className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-black text-white">Record 9:16 Shorts Video</h4>
            <p className="text-[11px] text-slate-400">
              Animated canvas recording with 12 dynamic themes, timers, and SFX.
            </p>
          </div>
        )}

        {onOpenFlashcardMaker && (
          <div
            onClick={() => onOpenFlashcardMaker(question.id)}
            className="p-5 bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/30 hover:border-amber-500 rounded-3xl transition-all cursor-pointer space-y-2 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-black text-white">1080x1080 Flashcards</h4>
            <p className="text-[11px] text-slate-400">
              Export HD square study cards for Instagram feeds and study notes.
            </p>
          </div>
        )}

        {onOpenPollMaker && (
          <div
            onClick={() => onOpenPollMaker(question.id)}
            className="p-5 bg-gradient-to-br from-slate-900 to-sky-950/40 border border-sky-500/30 hover:border-sky-500 rounded-3xl transition-all cursor-pointer space-y-2 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="text-sm font-black text-white">Telegram Quiz Poll Maker</h4>
            <p className="text-[11px] text-slate-400">
              Push single-answer quiz polls directly into your Telegram channel.
            </p>
          </div>
        )}
      </div>

      {/* Hidden Canvases */}
      <div className="hidden">
        <canvas ref={thumbnailCanvasRef} />
        <canvas ref={squarePostCanvasRef} />
        <canvas ref={flashcardCanvasRef} />
      </div>
    </div>
  );
};
