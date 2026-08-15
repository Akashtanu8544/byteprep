import React, { useState, useEffect, useRef } from 'react';
import { QuestionLoader } from '../../services/questionLoader';
import { StorageService } from '../../services/storageService';
import { NormalizedQuestion, ShortConfig, QueueItem } from '../../types';
import { SHORTS_THEMES } from './themes';
import { HOOK_TEMPLATES, getRandomHook } from './hooks';
import { ShortsPreview } from './ShortsPreview';
import { ThemePreviewCard } from './ThemePreviewCard';
import { ViralCaptionsCard } from './ViralCaptionsCard';
import { ThumbnailGenerator } from './ThumbnailGenerator';
import { ShortsQueue } from './ShortsQueue';
import { SocialPosterStudio } from './SocialPosterStudio';
import { exportShortVideo, exportFrameSnapshot, getTimelineDurations, calculateAutoSyncedPhases, RenderControl } from './videoRenderer';
import { PollPostMaker } from '../polls/PollPostMaker';
import { FlashCardMaker } from '../flashcards/FlashCardMaker';
import {
  Video,
  Sparkles,
  Shuffle,
  Layers,
  Clock,
  Palette,
  MessageSquare,
  ListPlus,
  History,
  Download,
  ArrowLeft,
  CheckCircle2,
  Stars,
  Terminal,
  Share2,
  FileImage,
  Zap,
  ShieldCheck,
  Camera,
  Sliders,
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
  const allMocks = ['All', ...QuestionLoader.getAllMocks()];

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedMock, setSelectedMock] = useState<string>('All');
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
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);

  // Auto-Sync & Background Audio
  const [autoSyncAudio, setAutoSyncAudio] = useState<boolean>(true);
  const [audioTrackId, setAudioTrackId] = useState<string>('cyber-pulse');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>('');
  const [customAudioDuration, setCustomAudioDuration] = useState<number | null>(null);

  // Permanent Watermark & Logo Overlay
  const [watermarkType, setWatermarkType] = useState<'none' | 'logo' | 'text'>(() => {
    return (localStorage.getItem(WATERMARK_TYPE_KEY) as any) || 'logo';
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
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);

  // Video Export States
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingProgress, setRenderingProgress] = useState<number>(0);
  const [renderingStage, setRenderingStage] = useState<string>('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const renderControlRef = useRef<RenderControl | null>(null);

  // Queue & Bulk Generation
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'video' | 'posters' | 'poll' | 'flashcard' | 'history'>('video');

  // 1. Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.selectedSubject) setSelectedSubject(parsed.selectedSubject);
        if (parsed.selectedTopic) setSelectedTopic(parsed.selectedTopic);
        if (parsed.selectedMock) setSelectedMock(parsed.selectedMock);
        if (parsed.selectedDifficulty) setSelectedDifficulty(parsed.selectedDifficulty);
        if (parsed.timerSeconds) setTimerSeconds(parsed.timerSeconds);
        if (parsed.hookText) setHookText(parsed.hookText);
        if (parsed.themeId) setThemeId(parsed.themeId);
        if (parsed.backgroundStyle) setBackgroundStyle(parsed.backgroundStyle);
        if (parsed.durationMode) setDurationMode(parsed.durationMode);
        if (parsed.renderQuality) setRenderQuality(parsed.renderQuality);
        if (typeof parsed.includeAudio === 'boolean') setIncludeAudio(parsed.includeAudio);
        if (parsed.bulkCount) setBulkCount(parsed.bulkCount);
        if (parsed.savedAt) setLastAutoSaved(new Date(parsed.savedAt));
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

  // 2. Periodic Auto-Save Every 5 Seconds to LocalStorage
  const draftStateRef = useRef({
    selectedSubject,
    selectedTopic,
    selectedMock,
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
  });

  draftStateRef.current = {
    selectedSubject,
    selectedTopic,
    selectedMock,
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
  };

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const payload = {
          ...draftStateRef.current,
          savedAt: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        setLastAutoSaved(new Date());
      } catch (err) {
        console.warn('Auto-save error', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleResetDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setSelectedSubject('All');
    setSelectedTopic('All');
    setSelectedMock('All');
    setSelectedDifficulty('mixed');
    setTimerSeconds(10);
    setHookText(HOOK_TEMPLATES[0]);
    setThemeId('byteprep-dark');
    setBackgroundStyle('auto');
    setDurationMode('viral');
    setRenderQuality('720p');
    setIncludeAudio(true);
    const questions = QuestionLoader.getAllQuestions();
    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
    setLastAutoSaved(null);
    setIsDraftRestored(false);
  };

  // Handle Filter Change
  useEffect(() => {
    let pool = QuestionLoader.getAllQuestions();
    if (selectedSubject !== 'All') {
      pool = pool.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());
    }
    if (selectedTopic !== 'All') {
      pool = pool.filter(q => q.topic.toLowerCase() === selectedTopic.toLowerCase());
    }
    if (selectedMock !== 'All') {
      pool = pool.filter(q => q.sourceFile.toLowerCase() === selectedMock.toLowerCase());
    }
    if (selectedDifficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === selectedDifficulty);
    }

    setQuestionList(pool);
    if (pool.length > 0 && !pool.some(q => q.id === currentQuestion?.id)) {
      setCurrentQuestion(pool[0]);
    }
  }, [selectedSubject, selectedTopic, selectedMock, selectedDifficulty]);

  const handleRandomQuestion = () => {
    const q = QuestionLoader.getRandomQuestion({
      subject: selectedSubject,
      topic: selectedTopic,
      difficulty: selectedDifficulty as any,
      mockId: selectedMock,
    });
    setCurrentQuestion(q);
  };

  const getAudioTrackDuration = (): number => {
    if (audioTrackId === 'custom' && customAudioDuration) return customAudioDuration;
    if (audioTrackId === 'synth-rush') return 12.0;
    if (audioTrackId === 'cyber-pulse') return 15.0;
    if (audioTrackId === 'epic-countdown') return 18.0;
    if (audioTrackId === 'quiz-intense') return 20.0;
    if (audioTrackId === 'lofi-focus') return 24.0;
    if (audioTrackId === 'extended-mastery') return 30.0;
    return 15.0;
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomAudioUrl(dataUrl);
      setCustomAudioName(file.name);
      setAudioTrackId('custom');

      // Detect exact duration
      const tempAudio = new Audio(dataUrl);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && isFinite(tempAudio.duration)) {
          setCustomAudioDuration(+tempAudio.duration.toFixed(1));
        } else {
          setCustomAudioDuration(15.0);
        }
      };
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
          alert(`Render Error: ${err}`);
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
    setRenderingStage('Render cancelled by user. Resources freed.');
  };

  const handleDownloadVideo = () => {
    if (!renderedBlob || !currentQuestion) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(renderedBlob);
    link.download = `BytePrepCS_10SecondChallenge_${currentQuestion.id}.webm`;
    link.click();
    StorageService.recordShortDownloaded(currentQuestion.id);
  };

  const handleQuickPosterDownload = async () => {
    if (!currentQuestion) return;
    try {
      const dataUrl = await exportFrameSnapshot(currentConfig, 'question');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `BytePrep_Poster_${currentQuestion.id}.png`;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateQueue = () => {
    if (questionList.length === 0) return;

    const count = Math.min(bulkCount, questionList.length);
    const selectedQuestions = [...questionList].sort(() => 0.5 - Math.random()).slice(0, count);

    const newItems: QueueItem[] = selectedQuestions.map((q, idx) => ({
      id: `queue_${q.id}_${Date.now()}_${idx}`,
      question: q,
      config: {
        question: q,
        timerSeconds,
        hookText: getRandomHook(),
        themeId: themeId as any,
        backgroundStyle,
        includeAudio,
        ctaEnabled: true,
        durationMode,
        renderQuality,
        appUrl: StorageService.getSettings().appUrl,
        autoSyncAudio,
        audioTrackId,
        audioTrackName: audioTrackId,
        audioTrackDuration: getAudioTrackDuration(),
        customAudioDataUrl: customAudioUrl || undefined,
        watermarkType,
        watermarkLogoUrl: watermarkLogoUrl || undefined,
        watermarkText,
        watermarkPosition,
        watermarkOpacity,
        watermarkScale,
      },
      status: 'pending',
      progress: 0,
    }));

    setQueue(prev => [...prev, ...newItems]);
  };

  const historyRecords = StorageService.getShortsRecords();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🎬 SHORTS STUDIO</span>
                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-full">
                  9:16 Creator
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Fast Render ⚡
                </span>
              </h1>

              {/* Auto-save Status Indicator */}
              <div className="flex items-center gap-2 ml-2">
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-saved (5s sync)</span>
                </span>
                {isDraftRestored && (
                  <button
                    onClick={handleResetDraft}
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Reset all settings to defaults and clear saved draft"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Draft</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Turn BytePrep CS MCQs into high-converting Instagram Reels, YouTube Shorts, & Social Image Posters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Shorts Video</span>
          </button>
          <button
            onClick={() => setActiveTab('posters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'posters'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-300" />
            <span>Social Posters (9:16, 1:1, 16:9)</span>
          </button>
          <button
            onClick={() => setActiveTab('poll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'poll'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Poll Post</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flashcard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            <span>FlashCard</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyRecords.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'posters' && currentQuestion ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs">
              <span className="text-slate-400">Selected Question: </span>
              <span className="text-white font-bold">{currentQuestion.question}</span>
            </div>
            <button
              onClick={handleRandomQuestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold shrink-0 ml-3 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>Next Q</span>
            </button>
          </div>
          <SocialPosterStudio config={currentConfig} />
        </div>
      ) : activeTab === 'poll' && currentQuestion ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs">
              <span className="text-slate-400">Selected Question: </span>
              <span className="text-white font-bold">{currentQuestion.question}</span>
            </div>
            <button
              onClick={handleRandomQuestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold shrink-0 ml-3 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>Next Q</span>
            </button>
          </div>
          <PollPostMaker question={currentQuestion} />
        </div>
      ) : activeTab === 'flashcard' && currentQuestion ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs">
              <span className="text-slate-400">Selected Question: </span>
              <span className="text-white font-bold">{currentQuestion.question}</span>
            </div>
            <button
              onClick={handleRandomQuestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold shrink-0 ml-3 cursor-pointer"
            >
              <Shuffle className="w-3 h-3" />
              <span>Next Q</span>
            </button>
          </div>
          <FlashCardMaker question={currentQuestion} />
        </div>
      ) : activeTab === 'history' ? (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>Generated Shorts History</span>
          </h2>
          {historyRecords.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No shorts generated yet.</p>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((rec, idx) => {
                const q = QuestionLoader.getQuestionById(rec.questionId);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">{q?.question || rec.questionId}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="text-sky-400">{q?.subject}</span>
                        <span>•</span>
                        <span>Hook: {rec.template || rec.hook}</span>
                        <span>•</span>
                        <span>{new Date(rec.generatedAt || rec.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {rec.downloaded && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Downloaded</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Question Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Select Question Source</span>
                </h3>
                <button
                  onClick={handleRandomQuestion}
                  className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mock File
                  </label>
                  <select
                    value={selectedMock}
                    onChange={e => setSelectedMock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {allMocks.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="mixed">Mixed Difficulties</option>
                    <option value="easy">Easy Only</option>
                    <option value="medium">Medium Only</option>
                    <option value="hard">Hard Only</option>
                  </select>
                </div>
              </div>

              {/* Current Question Display Box */}
              {currentQuestion && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-bold">
                      {currentQuestion.subject} • {currentQuestion.exam}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      ID: {currentQuestion.id}
                    </span>
                  </div>
                  <p className="text-white text-sm font-semibold leading-relaxed">
                    {currentQuestion.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {currentQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                          i === currentQuestion.correctAnswer
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0">
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Hook Headline (First 2.5s)</span>
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

            {/* 3. Theme & Background Style Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Visual Theme & Dynamic FX Background</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(SHORTS_THEMES).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      themeId === t.id
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accentColor }} />
                      <span className="text-xs font-bold text-white truncate">{t.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 capitalize">{t.backgroundAnimation || 'Dynamic'} Style</p>
                  </button>
                ))}
              </div>

              {/* Dynamic Live Background Pattern Selection */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stars className="w-3.5 h-3.5 text-sky-400" />
                  <span>Subject Motion Graphic Background</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'auto', label: 'Auto FX' },
                    { id: 'matrix', label: 'Matrix' },
                    { id: 'sql', label: 'SQL DB' },
                    { id: 'network', label: 'Network' },
                    { id: 'stars', label: 'Cyber Stars' },
                    { id: 'os', label: 'Processes' },
                  ].map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => setBackgroundStyle(bg.id as any)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        backgroundStyle === bg.id
                          ? 'bg-sky-500/15 border-sky-500 text-sky-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Speed, Duration & Auto-Sync Audio Engine Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Duration, Quality & Auto-Sync Audio Engine</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Total Video: {getTimelineDurations(currentConfig).total.toFixed(1)}s</span>
                  </span>
                </div>
              </div>

              {/* AUTO-SYNC TOGGLE BAR */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-sky-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white tracking-wide">AUTO-SYNC SLIDE TIMING</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                        autoSyncAudio ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {autoSyncAudio ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically adjusts Intro, Hook, MCQ Timer, Reveal & Explanation transitions to match audio track length.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAutoSyncAudio(!autoSyncAudio)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-1.5 ${
                    autoSyncAudio
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${autoSyncAudio ? 'fill-current' : ''}`} />
                  <span>{autoSyncAudio ? '⚡ AUTO-SYNC ON' : 'ENABLE AUTO-SYNC'}</span>
                </button>
              </div>

              {/* BACKGROUND AUDIO TRACK PICKER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-sky-400" />
                    <span>Background Audio Track & Soundtracks</span>
                  </label>
                  {autoSyncAudio && (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      ⚡ Slide transitions will sync to this track ({getAudioTrackDuration().toFixed(1)}s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cyber-pulse', label: '⚡ Cyber Pulse', duration: 15.0 },
                    { id: 'quiz-intense', label: '🔥 Intense Quiz', duration: 20.0 },
                    { id: 'lofi-focus', label: '🎧 Lo-Fi Focus', duration: 24.0 },
                    { id: 'synth-rush', label: '🚀 Sprint Beat', duration: 12.0 },
                    { id: 'epic-countdown', label: '⏱️ Exam Clock', duration: 18.0 },
                    { id: 'extended-mastery', label: '📚 In-Depth Beat', duration: 30.0 },
                    { id: 'custom', label: '🎵 Custom Audio', duration: customAudioDuration || 15.0 },
                  ].map(track => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setAudioTrackId(track.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        audioTrackId === track.id
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{track.label}</span>
                      <span className="text-[10px] font-mono text-slate-500 mt-1">
                        {track.duration.toFixed(1)}s duration
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Audio Upload input when 'custom' selected */}
                {audioTrackId === 'custom' && (
                  <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Music className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {customAudioName || 'Upload custom .mp3 or .wav track'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {customAudioDuration ? `Detected Length: ${customAudioDuration}s` : 'Audio length will be auto-detected'}
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{customAudioUrl ? 'Change Audio File' : 'Upload MP3/WAV'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* TIMELINE VISUAL BREAKDOWN (Dynamic Sync) */}
              {autoSyncAudio && (
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Auto-Synchronized Slide Phases:</span>
                    </span>
                    <span className="font-mono text-emerald-400">
                      Total: {getTimelineDurations(currentConfig).total.toFixed(1)}s
                    </span>
                  </div>

                  {(() => {
                    const dur = getTimelineDurations(currentConfig);
                    return (
                      <div className="grid grid-cols-6 gap-1 text-center">
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded">
                          <p className="text-[9px] text-slate-400">Intro</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{dur.intro}s</p>
                        </div>
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded">
                          <p className="text-[9px] text-slate-400">Hook</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{dur.hook}s</p>
                        </div>
                        <div className="p-1 bg-emerald-950/40 border border-emerald-500/30 rounded">
                          <p className="text-[9px] text-emerald-400">MCQ Timer</p>
                          <p className="text-xs font-mono font-bold text-emerald-300">{dur.question}s</p>
                        </div>
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded">
                          <p className="text-[9px] text-slate-400">Reveal</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{dur.reveal}s</p>
                        </div>
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded">
                          <p className="text-[9px] text-slate-400">Explain</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{dur.explanation}s</p>
                        </div>
                        <div className="p-1 bg-slate-900 border border-slate-800 rounded">
                          <p className="text-[9px] text-slate-400">CTA Outro</p>
                          <p className="text-xs font-mono font-bold text-slate-200">{dur.cta}s</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Standard Pacing Controls when Auto-Sync is OFF */}
              {!autoSyncAudio && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Manual Timeline Pacing
                    </label>
                    <select
                      value={durationMode}
                      onChange={e => {
                        const newMode = e.target.value as any;
                        setDurationMode(newMode);
                        if (newMode === 'viral' && timerSeconds > 5) {
                          setTimerSeconds(5);
                        } else if (newMode === 'standard' && timerSeconds < 8) {
                          setTimerSeconds(10);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-emerald-500 cursor-pointer font-medium"
                    >
                      <option value="viral">⚡ Viral Fast (14.0s Total)</option>
                      <option value="standard">⏱️ Standard (24.0s Total)</option>
                      <option value="extended">📚 Extended (32.0s Total)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      MCQ Timer Countdown
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[5, 8, 10, 15].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setTimerSeconds(sec)}
                          className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            timerSeconds === sec
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quality & Audio Ticks Row */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolution:</label>
                  <select
                    value={renderQuality}
                    onChange={e => setRenderQuality(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="720p">⚡ Fast 720p (720x1280)</option>
                    <option value="1080p">💎 Full HD 1080p (1080x1920)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-400">Sound Effects:</span>
                  <button
                    type="button"
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      includeAudio
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {includeAudio ? '🔊 Audio SFX ON' : '🔇 Audio Muted'}
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Permanent Watermark & Logo Overlay Studio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-rose-400" />
                    <span>Permanent Watermark & Custom Logo Overlay</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Embeds your brand PNG logo or handle watermark in the corner of all generated videos.
                  </p>
                </div>

                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                  watermarkType !== 'none'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                  {watermarkType === 'logo' ? '🖼️ PNG Logo Active' : watermarkType === 'text' ? '🔤 Text Active' : 'Off'}
                </span>
              </div>

              {/* Watermark Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'No Watermark' },
                  { id: 'logo', label: '🖼️ Custom PNG Logo' },
                  { id: 'text', label: '🔤 Custom Text Handle' },
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

              {/* If PNG Logo is Selected */}
              {watermarkType === 'logo' && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {watermarkLogoUrl ? (
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 p-1 flex items-center justify-center relative overflow-hidden">
                          <img
                            src={watermarkLogoUrl}
                            alt="Watermark Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-bold text-white">
                          {watermarkLogoUrl ? 'Custom PNG Logo Loaded' : 'Upload Channel PNG Logo'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Transparent PNG recommended • Auto-persisted for all future shorts
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{watermarkLogoUrl ? 'Replace Logo' : 'Upload PNG'}</span>
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
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                          title="Remove custom logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* If Text Watermark is Selected */}
              {watermarkType === 'text' && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Custom Text / Social Handle
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={e => {
                        setWatermarkText(e.target.value);
                        localStorage.setItem(WATERMARK_TEXT_KEY, e.target.value);
                      }}
                      placeholder="@BytePrepCS or DSSSB TGT CS"
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl p-2.5 outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Quick:</span>
                    {['@BytePrepCS', 'DSSSB CS 2026', 'TGT PGT Master', '#BytePrep'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setWatermarkText(preset);
                          localStorage.setItem(WATERMARK_TEXT_KEY, preset);
                        }}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Watermark Position & Opacity (Visible when logo or text is selected) */}
              {watermarkType !== 'none' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Corner Position
                    </label>
                    <select
                      value={watermarkPosition}
                      onChange={e => {
                        const pos = e.target.value as any;
                        setWatermarkPosition(pos);
                        localStorage.setItem(WATERMARK_POS_KEY, pos);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="bottom-right">↘ Bottom-Right (Recommended)</option>
                      <option value="bottom-left">↙ Bottom-Left</option>
                      <option value="top-right">↗ Top-Right</option>
                      <option value="top-left">↖ Top-Left</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Watermark Opacity: {Math.round(watermarkOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setWatermarkOpacity(val);
                        localStorage.setItem(WATERMARK_OPACITY_KEY, val.toString());
                      }}
                      className="w-full accent-rose-500 cursor-pointer mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Scale Size
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { scale: 0.75, label: 'Small' },
                        { scale: 1.0, label: 'Med' },
                        { scale: 1.25, label: 'Large' },
                      ].map(sc => (
                        <button
                          key={sc.scale}
                          type="button"
                          onClick={() => {
                            setWatermarkScale(sc.scale);
                            localStorage.setItem(WATERMARK_SCALE_KEY, sc.scale.toString());
                          }}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            watermarkScale === sc.scale
                              ? 'bg-rose-500 text-slate-950 font-black'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Bulk Generation Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-sky-400" />
                  <span>Batch Queue Creator</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate multiple shorts at once with randomized hooks & themes
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[3, 5, 10, 20].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setBulkCount(cnt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkCount === cnt
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}

                <button
                  onClick={handleGenerateQueue}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  title="Add selected count of questions to queue"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>+ ADD TO QUEUE</span>
                </button>

                <button
                  onClick={() => {
                    handleGenerateQueue();
                    // Auto-trigger render immediately
                    setTimeout(() => {
                      const renderAllBtn = document.getElementById('queue-render-all-btn');
                      if (renderAllBtn) renderAllBtn.click();
                    }, 100);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  title="Queue and immediately generate all videos"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>⚡ 1-CLICK GENERATE ALL</span>
                </button>
              </div>
            </div>

            {/* Queue Component */}
            <ShortsQueue queue={queue} setQueue={setQueue} />
          </div>

          {/* Right Preview Column */}
          <div className="lg:col-span-5 space-y-6">
            <ShortsPreview
              config={currentConfig}
              onRenderVideo={handleRenderSingleVideo}
              onCancelRender={handleCancelRender}
              isRendering={isRendering}
              renderingProgress={renderingProgress}
              renderingStage={renderingStage}
            />

            {/* Quick Actions Panel */}
            <div className="space-y-2">
              {isRendering && (
                <button
                  onClick={handleCancelRender}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>CANCEL RENDER & FREE MEMORY</span>
                </button>
              )}

              {/* Quick Instant Poster Snap Action */}
              <button
                onClick={handleQuickPosterDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span>⚡ Download Instant MCQ Poster (.PNG) in 0.1s</span>
              </button>
            </div>

            {renderedVideoUrl && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center gap-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Video Ready for Download!</span>
                </div>
                <button
                  onClick={handleDownloadVideo}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD VIDEO (.WEBM)</span>
                </button>
              </div>
            )}

            {currentQuestion && (
              <ViralCaptionsCard
                question={currentQuestion}
                hookText={hookText}
              />
            )}

            {currentQuestion && (
              <ThumbnailGenerator
                question={currentQuestion}
                hookText={hookText}
                themeId={themeId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
