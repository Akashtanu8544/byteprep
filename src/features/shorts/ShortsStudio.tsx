import React, { useState, useEffect, useRef } from 'react';
import { QuestionLoader } from '../../services/questionLoader';
import { StorageService } from '../../services/storageService';
import { NormalizedQuestion, ShortConfig, QueueItem } from '../../types';
import { SHORTS_THEMES } from './themes';
import { HOOK_TEMPLATES, getRandomHook } from './hooks';
import { ShortsPreview } from './ShortsPreview';
import { ThemePreviewCard } from './ThemePreviewCard';
import { ViralCaptionsCard } from './ViralCaptionsCard';
import { ShortsQueue } from './ShortsQueue';
import { DirectPublishModal } from '../autopost/DirectPublishModal';
import { SocialPostMethodsModal } from '../extension/SocialPostMethodsModal';
import { exportShortVideo, exportFrameSnapshot, getTimelineDurations, calculateAutoSyncedPhases, RenderControl } from './videoRenderer';
import {
  Video,
  Sparkles,
  Shuffle,
  Layers,
  Clock,
  Palette,
  ListPlus,
  Download,
  ArrowLeft,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Camera,
  XCircle,
  RotateCcw,
  Image as ImageIcon,
  Music,
  Upload,
  Trash2,
  Type,
  Stamp,
  Play,
  Volume2,
  VolumeX,
  AlertCircle,
  Copy,
  Check,
  Puzzle,
} from 'lucide-react';

interface ShortsStudioProps {
  onBack: () => void;
  preselectedQuestionId?: string | null;
}

const AUTOSAVE_KEY = 'byteprep_shorts_studio_autosave_state';
const WATERMARK_LOGO_KEY = 'byteprep_watermark_logo_storage';
const WATERMARK_TEXT_KEY = 'byteprep_watermark_text_storage';
const WATERMARK_TYPE_KEY = 'byteprep_watermark_type_storage';
const WATERMARK_POS_KEY = 'byteprep_watermark_pos_storage';
const WATERMARK_OPACITY_KEY = 'byteprep_watermark_opacity_storage';
const WATERMARK_SCALE_KEY = 'byteprep_watermark_scale_storage';

export const ShortsStudio: React.FC<ShortsStudioProps> = ({ onBack, preselectedQuestionId }) => {
  const allSubjects = ['All', ...QuestionLoader.getAllSubjects()];
  const allTopics = ['All', ...QuestionLoader.getAllTopics()];

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('mixed');

  const [questionList, setQuestionList] = useState<NormalizedQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion | null>(null);

  const [timerSeconds, setTimerSeconds] = useState<number>(10);
  const [hookText, setHookText] = useState<string>(HOOK_TEMPLATES[0]);
  const [themeId, setThemeId] = useState<string>('byteprep-dark');
  const [backgroundStyle, setBackgroundStyle] = useState<'auto' | 'stars' | 'matrix' | 'sql' | 'network' | 'os'>('auto');

  // Video Speed & Quality Settings
  const [durationMode, setDurationMode] = useState<'viral' | 'standard' | 'extended'>('viral');
  const [renderQuality, setRenderQuality] = useState<'720p' | '1080p'>('720p');
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);

  // Auto-Sync & Background Audio
  const [autoSyncAudio, setAutoSyncAudio] = useState<boolean>(true);
  const [audioTrackId, setAudioTrackId] = useState<string>('cyber-pulse');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [customAudioDuration, setCustomAudioDuration] = useState<number | null>(null);

  // Permanent Watermark & Logo Overlay
  const [watermarkType, setWatermarkType] = useState<'none' | 'logo' | 'text'>(() => {
    return (localStorage.getItem(WATERMARK_TYPE_KEY) as any) || 'text';
  });
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem(WATERMARK_LOGO_KEY) || null;
  });
  const [watermarkText, setWatermarkText] = useState<string>(() => {
    return localStorage.getItem(WATERMARK_TEXT_KEY) || '@BytePrepCS';
  });
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(() => {
    return (localStorage.getItem(WATERMARK_POS_KEY) as any) || 'bottom-right';
  });
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    const val = localStorage.getItem(WATERMARK_OPACITY_KEY);
    return val ? parseFloat(val) : 0.85;
  });
  const [watermarkScale, setWatermarkScale] = useState<number>(() => {
    const val = localStorage.getItem(WATERMARK_SCALE_KEY);
    return val ? parseFloat(val) : 1.0;
  });

  // Auto-Save Tracking
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Video Export States
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingProgress, setRenderingProgress] = useState<number>(0);
  const [renderingStage, setRenderingStage] = useState<string>('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const renderControlRef = useRef<RenderControl | null>(null);

  // Queue & Bulk Generation
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bulkCount, setBulkCount] = useState<number>(5);

  // 1. Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.selectedSubject) setSelectedSubject(parsed.selectedSubject);
        if (parsed.selectedTopic) setSelectedTopic(parsed.selectedTopic);
        if (parsed.selectedDifficulty) setSelectedDifficulty(parsed.selectedDifficulty);
        if (parsed.timerSeconds) setTimerSeconds(parsed.timerSeconds);
        if (parsed.hookText) setHookText(parsed.hookText);
        if (parsed.themeId) setThemeId(parsed.themeId);
        if (parsed.backgroundStyle) setBackgroundStyle(parsed.backgroundStyle);
        if (parsed.durationMode) setDurationMode(parsed.durationMode);
        if (parsed.renderQuality) setRenderQuality(parsed.renderQuality);
        if (typeof parsed.includeAudio === 'boolean') setIncludeAudio(parsed.includeAudio);
        if (parsed.bulkCount) setBulkCount(parsed.bulkCount);
        setIsDraftRestored(true);

        if (parsed.currentQuestionId && !preselectedQuestionId) {
          const q = QuestionLoader.getQuestionById(parsed.currentQuestionId);
          if (q) {
            setCurrentQuestion(q);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read autosave state', e);
    }
  }, [preselectedQuestionId]);

  // Load questions
  useEffect(() => {
    const questions = QuestionLoader.getAllQuestions();
    setQuestionList(questions);

    if (preselectedQuestionId) {
      const q = QuestionLoader.getQuestionById(preselectedQuestionId);
      if (q) {
        setCurrentQuestion(q);
        return;
      }
    }

    if (!currentQuestion && questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
  }, [preselectedQuestionId]);

  // Periodic Auto-Save
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const draft = {
          selectedSubject,
          selectedTopic,
          selectedDifficulty,
          currentQuestionId: currentQuestion?.id,
          timerSeconds,
          hookText,
          themeId,
          backgroundStyle,
          durationMode,
          renderQuality,
          includeAudio,
          bulkCount,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [
    selectedSubject,
    selectedTopic,
    selectedDifficulty,
    currentQuestion,
    timerSeconds,
    hookText,
    themeId,
    backgroundStyle,
    durationMode,
    renderQuality,
    includeAudio,
    bulkCount,
  ]);

  // Filter questions on subject/topic changes
  useEffect(() => {
    const filtered = QuestionLoader.filterQuestions({
      subject: selectedSubject !== 'All' ? selectedSubject : undefined,
      topic: selectedTopic !== 'All' ? selectedTopic : undefined,
      difficulty: selectedDifficulty !== 'mixed' ? (selectedDifficulty as any) : undefined,
    });

    setQuestionList(filtered);
    if (filtered.length > 0 && (!currentQuestion || !filtered.some(q => q.id === currentQuestion.id))) {
      setCurrentQuestion(filtered[0]);
    }
  }, [selectedSubject, selectedTopic, selectedDifficulty]);

  const handleRandomQuestion = () => {
    const q = QuestionLoader.getRandomQuestion({
      subject: selectedSubject !== 'All' ? selectedSubject : undefined,
      topic: selectedTopic !== 'All' ? selectedTopic : undefined,
      difficulty: selectedDifficulty !== 'mixed' ? (selectedDifficulty as any) : undefined,
    });
    if (q) {
      setCurrentQuestion(q);
      setHookText(getRandomHook());
      setRenderedBlob(null);
      setRenderedVideoUrl(null);
      setErrorMessage(null);
    }
  };

  const handleResetDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setSelectedSubject('All');
    setSelectedTopic('All');
    setSelectedDifficulty('mixed');
    setTimerSeconds(10);
    setHookText(HOOK_TEMPLATES[0]);
    setThemeId('byteprep-dark');
    setBackgroundStyle('auto');
    setDurationMode('viral');
    setRenderQuality('720p');
    setIncludeAudio(true);
    setAutoSyncAudio(true);
    setAudioTrackId('cyber-pulse');
    setIsDraftRestored(false);
  };

  const getAudioTrackDuration = (): number => {
    if (customAudioDuration) return customAudioDuration;
    switch (audioTrackId) {
      case 'synth-rush':
        return 12.0;
      case 'cyber-pulse':
        return 15.0;
      case 'quiz-clock':
        return 18.0;
      case 'quiz-intense':
        return 20.0;
      case 'lofi-focus':
        return 24.0;
      case 'exam-deep':
        return 30.0;
      default:
        return 15.0;
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomAudioName(file.name);
    const objectUrl = URL.createObjectURL(file);
    const audioEl = new Audio();
    audioEl.src = objectUrl;
    audioEl.onloadedmetadata = () => {
      const detectedSec = Math.round(audioEl.duration * 10) / 10;
      setCustomAudioDuration(detectedSec);
      if (autoSyncAudio) {
        const synced = calculateAutoSyncedPhases(detectedSec);
        setTimerSeconds(synced.question);
      }
    };

    const reader = new FileReader();
    reader.onload = () => {
      setCustomAudioUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setWatermarkLogoUrl(dataUrl);
      setWatermarkType('logo');
      try {
        localStorage.setItem(WATERMARK_LOGO_KEY, dataUrl);
        localStorage.setItem(WATERMARK_TYPE_KEY, 'logo');
      } catch (err) {
        console.warn('Storage quota limit for logo', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setWatermarkLogoUrl(null);
    localStorage.removeItem(WATERMARK_LOGO_KEY);
    setWatermarkType('text');
    localStorage.setItem(WATERMARK_TYPE_KEY, 'text');
  };

  const currentConfig: ShortConfig = {
    question: currentQuestion || {
      id: 'placeholder',
      question: 'Which protocol is connection-oriented?',
      options: ['UDP', 'TCP', 'IP', 'ARP'],
      correctAnswer: 1,
      explanation: 'TCP provides reliable connection-oriented delivery.',
      subject: 'Computer Networks',
      topic: 'Transport Protocols',
      difficulty: 'easy',
      exam: 'TGT CS',
      sourceFile: 'cn.json',
    },
    timerSeconds,
    hookText,
    themeId: themeId as any,
    backgroundStyle,
    includeAudio,
    ctaEnabled: true,
    durationMode,
    renderQuality,
    exportFormat,
    appUrl: StorageService.getSettings().appUrl,
    // Auto-Sync Audio
    autoSyncAudio,
    audioTrackId,
    audioTrackName: audioTrackId,
    audioTrackDuration: getAudioTrackDuration(),
    customAudioDataUrl: customAudioUrl || undefined,
    // Permanent Watermark & Logo Overlay
    watermarkType,
    watermarkLogoUrl: watermarkLogoUrl || undefined,
    watermarkText,
    watermarkPosition,
    watermarkOpacity,
    watermarkScale,
  };

  const handleRenderSingleVideo = () => {
    if (!currentQuestion || isRendering) return;
    setIsRendering(true);
    setRenderingProgress(0);
    setRenderingStage('Starting High-Speed Video Engine...');
    setErrorMessage(null);

    const control = exportShortVideo(currentConfig, {
      onProgress: (progress, stage) => {
        setRenderingProgress(progress);
        setRenderingStage(stage);
      },
      onComplete: (blob, videoUrl) => {
        setIsRendering(false);
        renderControlRef.current = null;
        setRenderedBlob(blob);
        setRenderedVideoUrl(videoUrl);
        StorageService.recordShortGenerated(currentQuestion.id, hookText, themeId);
      },
      onError: err => {
        setIsRendering(false);
        renderControlRef.current = null;
        if (!err.includes('cancelled')) {
          setErrorMessage(err || 'An error occurred during video rendering.');
        }
      },
    });

    renderControlRef.current = control;
  };

  const handleCancelRender = () => {
    if (renderControlRef.current) {
      renderControlRef.current.cancel();
      renderControlRef.current = null;
    }
    setIsRendering(false);
    setRenderingProgress(0);
    setRenderingStage('Render cancelled by user.');
  };

  const handleDownloadVideo = () => {
    if (!renderedBlob || !currentQuestion) return;
    const isMp4 = renderedBlob.type.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(renderedBlob);
    link.download = `BytePrepCS_${currentQuestion.id}_Short.${ext}`;
    link.click();
    StorageService.recordShortDownloaded(currentQuestion.id);
  };

  const handleGenerateQueue = () => {
    if (questionList.length === 0) return;

    const count = Math.min(bulkCount, questionList.length);
    const selectedQuestions = [...questionList].sort(() => 0.5 - Math.random()).slice(0, count);

    const themeList = Object.values(SHORTS_THEMES);
    const newItems: QueueItem[] = selectedQuestions.map((q, idx) => {
      const randomTheme = themeList[idx % themeList.length].id;
      const randomHook = getRandomHook();

      return {
        id: `q_${Date.now()}_${idx}`,
        question: q,
        config: {
          ...currentConfig,
          question: q,
          hookText: randomHook,
          themeId: randomTheme as any,
          timerSeconds: autoSyncAudio ? Math.round(getTimelineDurations(currentConfig).question) : timerSeconds,
        },
        status: 'pending',
        progress: 0,
      };
    });

    setQueue(prev => [...prev, ...newItems]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Video className="w-6 h-6 text-rose-500 fill-current" />
                <span>BytePrep Shorts Studio</span>
              </h1>
              <span className="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black rounded-full">
                9:16 HD
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> Fast WebM Engine
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              High-converting Computer Science MCQ vertical shorts with animated timers, sound effects & watermarks
            </p>
          </div>
        </div>

        {/* Reset Draft Button */}
        {isDraftRestored && (
          <button
            onClick={handleResetDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            title="Reset settings to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </button>
        )}
      </div>

      {/* In-App Error Notification Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-2 border-rose-500/50 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3 text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Video Rendering Notice</p>
              <p className="text-rose-300">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRenderQuality('720p');
              setIncludeAudio(false);
              setErrorMessage(null);
              setTimeout(() => handleRenderSingleVideo(), 100);
            }}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-md"
          >
            Retry in Fast Safe Mode
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Question Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Question Source</span>
              </h3>
              <button
                onClick={handleRandomQuestion}
                className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/25 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Random Question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                >
                  {allSubjects.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                >
                  {allTopics.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Question Display Box */}
            {currentQuestion && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md font-bold text-[11px]">
                    {currentQuestion.subject} • {currentQuestion.topic}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    ID: {currentQuestion.id}
                  </span>
                </div>
                <p className="text-white text-sm font-semibold leading-relaxed">
                  {currentQuestion.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded-xl border flex items-center gap-2 ${
                        i === currentQuestion.correctAnswer
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Viral Hook Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Viral Hook (Intro 2.5s)</span>
              </h3>
              <button
                onClick={() => setHookText(getRandomHook())}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Shuffle className="w-3 h-3" />
                <span>Random Hook</span>
              </button>
            </div>

            <input
              type="text"
              value={hookText}
              onChange={e => setHookText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl p-3 outline-none focus:border-amber-500 font-medium"
              placeholder="Enter catchy hook headline..."
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {HOOK_TEMPLATES.slice(0, 4).map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => setHookText(tpl)}
                  className="text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer truncate max-w-[240px]"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Visual Themes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Color Themes</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.values(SHORTS_THEMES).slice(0, 4).map(theme => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isSelected={themeId === theme.id}
                  onSelect={() => setThemeId(theme.id)}
                  config={currentConfig}
                />
              ))}
            </div>
          </div>

          {/* 4. Audio, Timing & Resolution Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span>Audio & Pacing</span>
              </h3>
              <button
                type="button"
                onClick={() => setIncludeAudio(!includeAudio)}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  includeAudio
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {includeAudio ? '🔊 Sound SFX & Music ON' : '🔇 Audio Muted'}
              </button>
            </div>

            {/* Auto-Sync Toggle & Soundtracks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Auto-Sync Slide Transitions</span>
                    <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded font-bold">
                      SMART
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Calibrates hook, countdown timer, and reveal to the music length.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSyncAudio(!autoSyncAudio)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoSyncAudio ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      autoSyncAudio ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Soundtrack Preset Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cyber-pulse', name: '⚡ Cyber Pulse', dur: '15.0s' },
                  { id: 'quiz-intense', name: '🔥 Intense Quiz', dur: '20.0s' },
                  { id: 'lofi-focus', name: '🎧 Lo-Fi Study', dur: '24.0s' },
                ].map(track => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      setAudioTrackId(track.id);
                      setCustomAudioUrl(null);
                      if (autoSyncAudio) {
                        const dur = track.id === 'cyber-pulse' ? 15.0 : track.id === 'quiz-intense' ? 20.0 : 24.0;
                        const synced = calculateAutoSyncedPhases(dur);
                        setTimerSeconds(synced.question);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      audioTrackId === track.id && !customAudioUrl
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="text-xs truncate">{track.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{track.dur}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Format Row */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Resolution:</label>
                <select
                  value={renderQuality}
                  onChange={e => setRenderQuality(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="720p">⚡ Fast 720p (720x1280 - Recommended)</option>
                  <option value="1080p">💎 Full HD 1080p (1080x1920)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Export Format:</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold rounded">
                      IG / YT Ready
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500">Instagram Reels & YouTube Shorts compatible</p>
                </div>
                <select
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="mp4">📱 MP4 (Instagram Reels, YouTube Shorts, TikTok)</option>
                  <option value="webm">🎬 WebM (Fixed Duration & Cues)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Permanent Brand Watermark */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Stamp className="w-4 h-4 text-rose-400" />
                <span>Brand Watermark Overlay</span>
              </h3>

              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border ${
                watermarkType !== 'none'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                {watermarkType === 'logo' ? '🖼️ PNG Logo' : watermarkType === 'text' ? '🔤 Text Handle' : 'Off'}
              </span>
            </div>

            {/* Watermark Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'No Watermark' },
                { id: 'text', label: '🔤 Text Handle' },
                { id: 'logo', label: '🖼️ Custom PNG Logo' },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    const t = type.id as any;
                    setWatermarkType(t);
                    localStorage.setItem(WATERMARK_TYPE_KEY, t);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    watermarkType === type.id
                      ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* If Text Watermark is Selected */}
            {watermarkType === 'text' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={e => {
                    setWatermarkText(e.target.value);
                    localStorage.setItem(WATERMARK_TEXT_KEY, e.target.value);
                  }}
                  placeholder="e.g. @BytePrepCS"
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 outline-none focus:border-rose-500 font-bold"
                />
              </div>
            )}

            {/* If PNG Logo is Selected */}
            {watermarkType === 'logo' && (
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {watermarkLogoUrl ? (
                    <img
                      src={watermarkLogoUrl}
                      alt="Watermark Logo"
                      className="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-slate-700 p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">
                      {watermarkLogoUrl ? 'PNG Logo Active' : 'Upload PNG Logo'}
                    </p>
                    <p className="text-[10px] text-slate-400">Transparent PNG recommended</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    <span>{watermarkLogoUrl ? 'Change' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {watermarkLogoUrl && (
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 6. Batch Queue Creator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-sky-400" />
                  <span>Batch Queue Generator</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate multiple shorts in bulk with automated themes & hooks
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[3, 5, 10].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setBulkCount(cnt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      bulkCount === cnt
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}

                <button
                  onClick={handleGenerateQueue}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>+ ADD TO QUEUE</span>
                </button>
              </div>
            </div>

            {/* Queue Component */}
            <ShortsQueue queue={queue} setQueue={setQueue} />
          </div>
        </div>

        {/* Right Preview & Export Column */}
        <div className="lg:col-span-5 space-y-5">
          <ShortsPreview
            config={currentConfig}
            onRenderVideo={handleRenderSingleVideo}
            onCancelRender={handleCancelRender}
            isRendering={isRendering}
            renderingProgress={renderingProgress}
            renderingStage={renderingStage}
          />

          {/* Rendered Video Player Banner */}
          {renderedVideoUrl && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Video Short Ready!</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {getTimelineDurations(currentConfig).total.toFixed(1)}s • {renderedBlob?.type.includes('mp4') ? '📱 MP4 (H.264)' : '🎬 WebM'}
                </span>
              </div>

              {/* Compatibility confirmation badges */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="flex items-center gap-1.5 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instagram Reels (9:16)</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>YouTube Shorts Ready</span>
                </div>
              </div>

              {/* In-App HTML5 Video Player */}
              <div className="w-full rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[9/16] max-h-[380px] flex items-center justify-center">
                <video
                  src={renderedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 1-Click Auto-Post to FB, YT, IG */}
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-rose-500/25 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>🚀 1-CLICK AUTO-POST (FB • YT • IG)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsExtensionModalOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-gradient-to-r from-purple-950/40 to-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-2xl transition-all border border-purple-500/30 cursor-pointer"
                >
                  <Puzzle className="w-4 h-4 text-purple-400" />
                  <span>CHROME EXTENSION</span>
                </button>

                <button
                  onClick={handleDownloadVideo}
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-2xl transition-all border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    DOWNLOAD {renderedBlob?.type.includes('mp4') ? 'MP4' : 'WEBM'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Viral Captions & Tags */}
          {currentQuestion && (
            <ViralCaptionsCard
              question={currentQuestion}
              hookText={hookText}
            />
          )}
        </div>
      </div>

      {/* Direct Auto-Publish Modal */}
      {currentQuestion && (
        <DirectPublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          question={currentQuestion}
          shortConfig={currentConfig}
          videoBlob={renderedBlob || undefined}
          videoUrl={renderedVideoUrl || undefined}
        />
      )}

      {/* Chrome Extension & Posting Methods Modal */}
      {currentQuestion && (
        <SocialPostMethodsModal
          isOpen={isExtensionModalOpen}
          onClose={() => setIsExtensionModalOpen(false)}
          currentTitle={`10 Sec CS Challenge: ${currentQuestion.question}`}
          currentCaption={`🧠 Can you solve this ${currentQuestion.subject} challenge in 10 seconds? Drop your answer below!`}
          currentHashtags="#BytePrep #ComputerScience #Shorts #CodingChallenge"
          videoBlob={renderedBlob || undefined}
          videoUrl={renderedVideoUrl || undefined}
        />
      )}
    </div>
  );
};
