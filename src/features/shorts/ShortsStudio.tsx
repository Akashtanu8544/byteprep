import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QuestionLoader } from '../../services/questionLoader';
import { StorageService } from '../../services/storageService';
import { BrandKitService } from '../../services/brandKitService';
import { NormalizedQuestion, ShortConfig } from '../../types';
import {
  exportShortVideo,
  RenderControl,
  STUDY_BGM_TRACKS,
} from './videoRenderer';
import {
  Video,
  Sparkles,
  Shuffle,
  ChevronRight,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Music,
  Check,
} from 'lucide-react';

interface ShortsStudioProps {
  onBack?: () => void;
  preselectedQuestionId?: string | null;
}

export const ShortsStudio: React.FC<ShortsStudioProps> = ({
  onBack,
  preselectedQuestionId,
}) => {
  // Load questions
  const allQuestions = useMemo(() => QuestionLoader.getAllQuestions(), []);

  // Available subjects
  const availableSubjects = useMemo(() => {
    const subs = Array.from(new Set(allQuestions.map(q => q.subject || 'General CS'))).filter(Boolean);
    return subs.sort();
  }, [allQuestions]);

  // Selected Subject & Topic states
  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || 'Data Structures');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  // Available topics for chosen subject
  const availableTopics = useMemo(() => {
    const filtered = allQuestions.filter(q => (q.subject || 'General CS') === selectedSubject);
    const topics = Array.from(new Set(filtered.map(q => q.topic).filter(Boolean))) as string[];
    return ['All', ...topics.sort()];
  }, [allQuestions, selectedSubject]);

  // Questions matching subject & topic
  const matchingQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const matchSub = (q.subject || 'General CS') === selectedSubject;
      const matchTopic = selectedTopic === 'All' || q.topic === selectedTopic;
      return matchSub && matchTopic;
    });
  }, [allQuestions, selectedSubject, selectedTopic]);

  // Current Question Index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Initialize preselected question if provided
  useEffect(() => {
    if (preselectedQuestionId) {
      const q = allQuestions.find(item => item.id === preselectedQuestionId);
      if (q) {
        if (q.subject) setSelectedSubject(q.subject);
        if (q.topic) setSelectedTopic(q.topic);
        const idx = matchingQuestions.findIndex(item => item.id === preselectedQuestionId);
        if (idx !== -1) setCurrentIndex(idx);
      }
    }
  }, [preselectedQuestionId, allQuestions, matchingQuestions]);

  // Reset current index if questions list changes
  useEffect(() => {
    if (currentIndex >= matchingQuestions.length) {
      setCurrentIndex(0);
    }
  }, [matchingQuestions.length, currentIndex]);

  const activeQuestion: NormalizedQuestion | undefined = matchingQuestions[currentIndex] || matchingQuestions[0];

  // App settings & Brand Kit
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [brandKit, setBrandKit] = useState(BrandKitService.getBrandKit());

  useEffect(() => {
    const handleStorage = () => {
      setSettings(StorageService.getSettings());
      setBrandKit(BrandKitService.getBrandKit());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Rendering & Export State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStage, setRenderStage] = useState<string>('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [exportedSuccess, setExportedSuccess] = useState<boolean>(false);

  const renderControlRef = useRef<RenderControl | null>(null);

  // Clean up object URL when component unmounts or new video is generated
  useEffect(() => {
    return () => {
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
    };
  }, [renderedVideoUrl]);

  // Navigation handlers
  const handleNextQuestion = () => {
    if (matchingQuestions.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % matchingQuestions.length);
    // Reset any previously rendered video
    if (renderedVideoUrl) {
      URL.revokeObjectURL(renderedVideoUrl);
      setRenderedVideoUrl(null);
      setRenderedBlob(null);
    }
  };

  const handleShuffleQuestion = () => {
    if (matchingQuestions.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * matchingQuestions.length);
    if (nextIdx === currentIndex) {
      nextIdx = (nextIdx + 1) % matchingQuestions.length;
    }
    setCurrentIndex(nextIdx);
    if (renderedVideoUrl) {
      URL.revokeObjectURL(renderedVideoUrl);
      setRenderedVideoUrl(null);
      setRenderedBlob(null);
    }
  };

  // Generate Video with mobile device optimization
  const handleGenerateVideo = () => {
    if (!activeQuestion) {
      setRenderError('No question available to generate video.');
      return;
    }

    // Refresh latest settings & brand
    const freshSettings = StorageService.getSettings();
    const freshBrand = BrandKitService.getBrandKit();
    setSettings(freshSettings);
    setBrandKit(freshBrand);

    setIsRendering(true);
    setRenderProgress(0);
    setRenderStage('Initializing video engine...');
    setRenderError(null);
    setExportedSuccess(false);

    if (renderedVideoUrl) {
      URL.revokeObjectURL(renderedVideoUrl);
      setRenderedVideoUrl(null);
      setRenderedBlob(null);
    }

    const isMobileDevice = typeof navigator !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (Boolean((navigator as any).userAgentData?.mobile)) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1 && window.innerWidth < 1024) ||
      (typeof window !== 'undefined' && window.innerWidth < 768)
    );

    // Dynamic config: 720p 30fps on mobile for rock-solid stability; 1080p 60fps on desktop
    const shortConfig: ShortConfig = {
      question: activeQuestion,
      timerSeconds: 10,
      hookText: '', // Removed viral hooks
      themeId: 'byteprep-dark', // Fixed single sleek dark theme
      includeAudio: true,
      ctaEnabled: true,
      appUrl: freshSettings.appUrl || 'https://byteprep.app',
      durationMode: 'standard',
      renderQuality: isMobileDevice ? '720p' : '1080p',
      exportFormat: 'mp4',
      fps: isMobileDevice ? 30 : 60,
      audioTrackId: freshSettings.bgmTrackId || 'lofi-focus',
      customAudioDataUrl: freshSettings.customBgmDataUrl || undefined,
      watermarkType: freshBrand.showWatermark !== false ? 'logo' : 'none',
      watermarkLogoUrl: freshBrand.logoDataUrl || undefined,
      watermarkText: freshBrand.brandName || '@BytePrep',
      watermarkPosition: (freshBrand.watermarkPosition as any) || 'bottom-right',
    };

    try {
      const control = exportShortVideo(shortConfig, {
        onProgress: (progress, stage) => {
          setRenderProgress(Math.round(progress));
          setRenderStage(stage);
        },
        onComplete: (blob, videoUrl) => {
          setIsRendering(false);
          setRenderedBlob(blob);
          setRenderedVideoUrl(videoUrl);
          setRenderStage('Rendering complete!');
        },
        onError: (err) => {
          setIsRendering(false);
          setRenderError(err || 'Failed to render video.');
        },
      });

      renderControlRef.current = control;
    } catch (err: any) {
      setIsRendering(false);
      setRenderError(err.message || 'Failed to start video rendering.');
    }
  };

  const handleCancelRender = () => {
    if (renderControlRef.current) {
      renderControlRef.current.cancel();
      renderControlRef.current = null;
    }
    setIsRendering(false);
    setRenderStage('Rendering cancelled.');
  };

  const handleExportVideo = async () => {
    if (!renderedBlob && !renderedVideoUrl) return;

    try {
      const isMp4 = renderedBlob?.type.includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const subClean = (selectedSubject || 'CS').replace(/[^a-zA-Z0-9]/g, '_');
      const topicClean = (selectedTopic !== 'All' ? selectedTopic : 'Quiz').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `BytePrep_${subClean}_${topicClean}_${Date.now()}.${ext}`;

      // On mobile devices, attempt Web Share API for saving directly to Camera Roll/Files
      if (renderedBlob && typeof navigator !== 'undefined' && (navigator as any).canShare) {
        try {
          const file = new File([renderedBlob], filename, { type: renderedBlob.type || 'video/mp4' });
          if ((navigator as any).canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'BytePrep CS Short',
              text: `${activeQuestion?.question || 'BytePrep Quiz Short'} - dsssbpyq.online`,
            });
            setExportedSuccess(true);
            setTimeout(() => setExportedSuccess(false), 4000);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return; // User simply closed share sheet
          console.warn('Native share failed or dismissed, proceeding with direct download:', shareErr);
        }
      }

      const url = renderedVideoUrl || URL.createObjectURL(renderedBlob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExportedSuccess(true);
      setTimeout(() => setExportedSuccess(false), 4000);
    } catch (err: any) {
      setRenderError('Export failed: ' + (err.message || 'Could not download video file.'));
    }
  };

  // Find track label
  const currentBgmLabel = useMemo(() => {
    if (settings.customBgmDataUrl) return 'Custom Uploaded Track';
    const found = STUDY_BGM_TRACKS.find(t => t.id === settings.bgmTrackId);
    return found ? found.name : 'Lo-Fi Focus Beat';
  }, [settings]);

  return (
    <div className="w-full max-w-4xl mx-auto py-5 px-3 sm:px-6 space-y-5 animate-fadeIn">
      {/* Studio Header */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white">
                Shorts Studio
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                1080p
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5">
        {/* Subject & Topic Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Subject & Topic</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                {matchingQuestions.length > 0 ? currentIndex + 1 : 0} / {matchingQuestions.length}
              </span>
              <button
                type="button"
                onClick={handleShuffleQuestion}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                title="Shuffle Question"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                title="Next Question"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Subject Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Subject
              </span>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('All');
                  setCurrentIndex(0);
                }}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-2xl px-3.5 py-2.5 text-sm text-white outline-none font-semibold transition-colors cursor-pointer"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-slate-900 text-white">
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Topic
              </span>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setCurrentIndex(0);
                }}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-2xl px-3.5 py-2.5 text-sm text-white outline-none font-semibold transition-colors cursor-pointer"
              >
                {availableTopics.map((top) => (
                  <option key={top} value={top} className="bg-slate-900 text-white">
                    {top === 'All' ? 'All Topics' : top}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Specs Badges */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Specs
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Resolution</div>
              <div className="font-black text-rose-400">1080 × 1920</div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Theme</div>
              <div className="font-black text-slate-200">Dark High-Contrast</div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Music className="w-3 h-3 text-sky-400" />
                <span>Auto BGM</span>
              </div>
              <div className="font-bold text-sky-300 truncate" title={currentBgmLabel}>
                {settings.bgmEnabled !== false ? currentBgmLabel : 'Disabled'}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Watermark</div>
              <div className="font-bold text-emerald-300 truncate" title={brandKit.brandName || '@BytePrep'}>
                {brandKit.brandName || '@BytePrep'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {renderError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="flex-1">{renderError}</div>
            <button
              type="button"
              onClick={() => setRenderError(null)}
              className="p-1 hover:text-white cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls & Video Output */}
        <div className="space-y-4 pt-2">
          {/* While Rendering */}
          {isRendering && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                  <span className="text-white">{renderStage || 'Rendering...'}</span>
                </div>
                <span className="text-rose-400 font-mono font-black">{renderProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Rendering 1080p 60fps...
                </span>
                <button
                  type="button"
                  onClick={handleCancelRender}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rendered Video Player */}
          {renderedVideoUrl && !isRendering && (
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-3xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">
                    Video Ready
                  </span>
                </div>
                {exportedSuccess && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    Downloaded!
                  </span>
                )}
              </div>

              {/* Video Player */}
              <div className="w-full max-w-xs mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <video
                  src={renderedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Primary Buttons: Generate Video & Export */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Generate Video Button */}
            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={isRendering || matchingQuestions.length === 0}
              className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRendering ? 'Rendering...' : 'Generate Video'}</span>
            </button>

            {/* Export Video Button */}
            {renderedVideoUrl && (
              <button
                type="button"
                onClick={handleExportVideo}
                className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98] animate-fadeIn"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Export MP4</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
