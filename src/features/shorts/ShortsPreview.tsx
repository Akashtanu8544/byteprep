import React, { useRef, useEffect, useState } from 'react';
import { ShortConfig } from '../../types';
import { drawShortFrame, CANVAS_WIDTH, CANVAS_HEIGHT } from './videoRenderer';
import { Play, Pause, RotateCcw, Film, Download, Loader2 } from 'lucide-react';

interface ShortsPreviewProps {
  config: ShortConfig;
  onRenderVideo: () => void;
  isRendering: boolean;
  renderingProgress: number;
  renderingStage: string;
}

export const ShortsPreview: React.FC<ShortsPreviewProps> = ({
  config,
  onRenderVideo,
  isRendering,
  renderingProgress,
  renderingStage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const totalDuration = 5.0 + 3.0 + config.timerSeconds + 5.0 + 8.0 + 4.0; // ~35s

  useEffect(() => {
    let animFrame: number;
    let lastStamp: number | null = null;

    const render = (timestamp: number) => {
      if (!lastStamp) lastStamp = timestamp;
      const delta = (timestamp - lastStamp) / 1000;
      lastStamp = timestamp;

      if (isPlaying) {
        setCurrentTime(prev => {
          const next = prev + delta;
          return next >= totalDuration ? 0 : next;
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, currentTime, config);
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, currentTime, config, totalDuration]);

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  return (
    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
          <Film className="w-4 h-4" />
          <span>9:16 Video Preview ({Math.round(totalDuration)}s)</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {currentTime.toFixed(1)}s / {Math.round(totalDuration)}s
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
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <Loader2 className="w-12 h-12 text-sky-400 animate-spin mb-4" />
            <p className="text-white font-bold text-lg mb-1">Rendering Short Video</p>
            <p className="text-sky-300 text-xs font-mono mb-4">{renderingStage}</p>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-2 border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${renderingProgress}%` }}
              />
            </div>
            <span className="text-slate-400 text-xs font-bold">{renderingProgress}% Completed</span>
          </div>
        )}
      </div>

      {/* Timeline Seek Bar */}
      <div className="w-full mt-4 flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={totalDuration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
      </div>

      {/* Video Preview Controls */}
      <div className="flex items-center justify-between w-full mt-4 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onRenderVideo}
          disabled={isRendering}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 cursor-pointer"
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
