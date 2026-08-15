import React, { useRef, useEffect } from 'react';
import { ShortTheme, ShortConfig } from '../../types';
import { drawShortFrame } from './videoRenderer';
import { CheckCircle2 } from 'lucide-react';

interface ThemePreviewCardProps {
  theme: ShortTheme;
  isSelected: boolean;
  onSelect: () => void;
  config: ShortConfig;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({
  theme,
  isSelected,
  onSelect,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw static preview frame at t = 9.0s (Question phase with options & live timer ring)
    const themeConfig: ShortConfig = { ...config, themeId: theme.id as any };
    drawShortFrame(ctx, 1080, 1920, 9.0, themeConfig);
  }, [theme, config]);

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center p-2 rounded-2xl border-2 transition-all cursor-pointer group select-none ${
        isSelected
          ? 'border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/20'
          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      {/* Active Check Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-sky-400 text-slate-950 rounded-full p-0.5 z-10 shadow-md">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Mini 9:16 Canvas Live Theme Preview */}
      <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-2 relative shadow-inner">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full px-1 text-center">
        <span className={`text-xs font-bold block truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
          {theme.name}
        </span>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span
            className="w-2.5 h-2.5 rounded-full border border-slate-700"
            style={{ backgroundColor: theme.canvasBg }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-slate-700"
            style={{ backgroundColor: theme.accentColor }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-slate-700"
            style={{ backgroundColor: theme.timerColor }}
          />
        </div>
      </div>
    </div>
  );
};
