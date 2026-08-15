import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ShortConfig } from '../../types';
import {
  drawShortFrame,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  getTimelineDurations,
  buildLayoutCache,
  exportFrameSnapshot,
} from './videoRenderer';
import {
  Play,
  Pause,
  RotateCcw,
  Film,
  Download,
  Loader2,
  Camera,
  FastForward,
  Layers,
  XCircle,
} from 'lucide-react';

interface ShortsPreviewProps {
  config: ShortConfig;
  onRenderVideo: () => void;
  onCancelRender?: () => void;
  isRendering: boolean;
  renderingProgress: number;
  renderingStage: string;
}

export const ShortsPreview: React.FC<ShortsPreviewProps> = ({
  config,
  onRenderVideo,
  onCancelRender,
  isRendering,
  renderingProgress,
  renderingStage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [isCapturingFrame, setIsCapturingFrame] = useState<boolean>(false);

  const currentTimeRef = useRef<number>(0);
  const lastTimeUpdateRef = useRef<number>(0);

  const durations = getTimelineDurations(config);
  const totalDuration = durations.total;

  // Render loop with decoupled ref to prevent 60fps React re-renders
  useEffect(() => {
    let animFrame: number;
    let lastStamp: number | null = null;
    let layoutCache: any = null;

    const render = (timestamp: number) => {
      if (!lastStamp) lastStamp = timestamp;
      const delta = Math.min(0.1, (timestamp - lastStamp) / 1000);
      lastStamp = timestamp;

      if (isPlaying) {
        currentTimeRef.current += delta;
        if (currentTimeRef.current >= totalDuration) {
          currentTimeRef.current = 0;
        }

        // Throttle React state updates to ~10 times per second for smooth UI without CPU overload
        if (timestamp - lastTimeUpdateRef.current > 100) {
          setDisplayTime(currentTimeRef.current);
          lastTimeUpdateRef.current = timestamp;
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!layoutCache) {
            layoutCache = buildLayoutCache(ctx, CANVAS_WIDTH, config);
          }
          drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, currentTimeRef.current, config, layoutCache);
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, config, totalDuration]);

  const handleRestart = () => {
    currentTimeRef.current = 0;
    setDisplayTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    currentTimeRef.current = val;
    setDisplayTime(val);
  };

  const jumpToPhase = (phase: 'intro' | 'hook' | 'question' | 'reveal' | 'explanation' | 'cta') => {
    let time = 0;
    if (phase === 'intro') time = 0.5;
    else if (phase === 'hook') time = durations.intro + 0.5;
    else if (phase === 'question') time = durations.intro + durations.hook + 1.0;
    else if (phase === 'reveal') time = durations.intro + durations.hook + durations.question + 0.5;
    else if (phase === 'explanation') time = durations.intro + durations.hook + durations.question + durations.reveal + 0.5;
    else if (phase === 'cta') time = durations.total - 1.5;

    currentTimeRef.current = Math.min(durations.total - 0.1, time);
    setDisplayTime(currentTimeRef.current);
    setIsPlaying(false);
  };

  const handleQuickSnapshot = async () => {
    try {
      setIsCapturingFrame(true);
      const dataUrl = await exportFrameSnapshot(config, 'question');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `BytePrep_Short_Poster_${config.question.id}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to capture snapshot', err);
    } finally {
      setIsCapturingFrame(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
          <Film className="w-4 h-4" />
          <span>9:16 Video Preview ({totalDuration.toFixed(1)}s)</span>
          <span className="text-[10px] font-mono uppercase bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded-full">
            {config.durationMode || 'standard'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {displayTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>

      {/* 9:16 Vertical Screen Box */}
      <div className="relative w-[280px] h-[497px] sm:w-[320px] sm:h-[568px] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />

        {/* Overlay Progress Bar if Rendering */}
        {isRendering && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fadeIn">
            <div className="relative mb-3">
              <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                ⚡
              </span>
            </div>

            <p className="text-white font-black text-base mb-1 tracking-wide">Rendering Video</p>
            
            {/* Step Counter Badge */}
            <div className="bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-[11px] font-bold py-1 px-3 rounded-lg mb-3 max-w-full truncate shadow-inner">
              {renderingStage || 'Processing frames...'}
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden mb-2 border border-slate-700/80 p-0.5">
              <div
                className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-200 shadow-md shadow-sky-500/40"
                style={{ width: `${Math.max(6, renderingProgress)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between w-full text-[11px] px-1 text-slate-400 mb-5 font-mono font-bold">
              <span className="text-sky-400">{renderingProgress}%</span>
              <span className="text-emerald-400">🛡️ Anti-Hang Active</span>
            </div>

            {onCancelRender && (
              <button
                onClick={onCancelRender}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Cancel Render & Free Memory</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline Seek Bar */}
      <div className="w-full mt-3 flex flex-col gap-1.5">
        <input
          type="range"
          min="0"
          max={totalDuration}
          step="0.1"
          value={displayTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />

        {/* Phase Jump Pills */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-400 pt-1">
          <button
            onClick={() => jumpToPhase('intro')}
            className="px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
            title="Jump to Intro"
          >
            Intro
          </button>
          <button
            onClick={() => jumpToPhase('hook')}
            className="px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
            title="Jump to Hook"
          >
            Hook
          </button>
          <button
            onClick={() => jumpToPhase('question')}
            className="px-1.5 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-400 border border-sky-500/30 rounded cursor-pointer"
            title="Jump to Question + Timer"
          >
            MCQ
          </button>
          <button
            onClick={() => jumpToPhase('reveal')}
            className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/30 rounded cursor-pointer"
            title="Jump to Answer Reveal"
          >
            Reveal
          </button>
          <button
            onClick={() => jumpToPhase('explanation')}
            className="px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
            title="Jump to Solution"
          >
            Solution
          </button>
          <button
            onClick={() => jumpToPhase('cta')}
            className="px-1.5 py-0.5 bg-slate-800/80 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
            title="Jump to CTA"
          >
            CTA
          </button>
        </div>
      </div>

      {/* Video Preview Controls & Export Action */}
      <div className="flex items-center justify-between w-full mt-3 gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
            title={isPlaying ? 'Pause Preview' : 'Play Preview'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
            title="Restart Timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleQuickSnapshot}
            disabled={isCapturingFrame}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-xl transition-colors cursor-pointer"
            title="Instant Poster Snapshot (PNG)"
          >
            {isCapturingFrame ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={onRenderVideo}
          disabled={isRendering}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 cursor-pointer"
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>EXPORT SHORT</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
