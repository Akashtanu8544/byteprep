import React, { useState, useEffect, useRef } from 'react';
import { NormalizedQuestion, ShortConfig } from '../../types';
import {
  exportStaticSocialCard,
  SocialCardAspectRatio,
  SocialCardVariant,
} from './videoRenderer';
import {
  Camera,
  Download,
  Copy,
  Check,
  Sparkles,
  Layers,
  Ratio,
  Maximize2,
  FileImage,
  Loader2,
  Eye,
} from 'lucide-react';

interface SocialPosterStudioProps {
  config: ShortConfig;
}

export const SocialPosterStudio: React.FC<SocialPosterStudioProps> = ({ config }) => {
  const [aspectRatio, setAspectRatio] = useState<SocialCardAspectRatio>('1:1');
  const [variant, setVariant] = useState<SocialCardVariant>('question');
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Generate preview whenever config, ratio, or variant changes
  useEffect(() => {
    let isCurrent = true;
    const generatePreview = async () => {
      setIsGenerating(true);
      try {
        const url = await exportStaticSocialCard(config, {
          aspectRatio,
          variant,
          format,
          quality: 0.95,
        });
        if (isCurrent) {
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate preview', err);
      } finally {
        if (isCurrent) {
          setIsGenerating(false);
        }
      }
    };

    generatePreview();
    return () => {
      isCurrent = false;
    };
  }, [config, aspectRatio, variant, format]);

  const handleDownload = async () => {
    if (!previewUrl) return;
    const ext = format === 'image/png' ? 'png' : 'jpg';
    const ratioTag = aspectRatio.replace(':', 'x');
    const filename = `BytePrep_${config.question.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${ratioTag}_${variant}_${config.question.id}.${ext}`;

    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = filename;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ [blob.type]: blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } else {
        handleDownload();
      }
    } catch (e) {
      console.warn('Clipboard copy not supported or permitted, falling back to download', e);
      handleDownload();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl text-slate-950 font-black text-sm">
              🎨
            </span>
            <h3 className="text-lg font-black text-white tracking-wide">
              STATIC SOCIAL MEDIA GRAPHIC EXPORTER
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export crisp, high-resolution graphics with question text overlaid for Instagram, Twitter, LinkedIn & Stories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            disabled={!previewUrl || isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="Copy image to clipboard"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-sky-400" />
                <span>Copy Image</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!previewUrl || isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD {format === 'image/png' ? 'PNG' : 'JPG'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Ratio & Variant Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aspect Ratio selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-sky-400" />
            <span>Aspect Ratio</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === '1:1'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1:1 Square
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9:16 Story
            </button>
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16:9 Banner
            </button>
          </div>
        </div>

        {/* Content Variant */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Card Layout</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setVariant('question')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                variant === 'question'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MCQ Quiz
            </button>
            <button
              onClick={() => setVariant('reveal')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                variant === 'reveal'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Answer ✓
            </button>
            <button
              onClick={() => setVariant('explanation')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                variant === 'explanation'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solution 💡
            </button>
          </div>
        </div>

        {/* Output Format */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-emerald-400" />
            <span>Image Format</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFormat('image/png')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                format === 'image/png'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PNG (Lossless)
            </button>
            <button
              onClick={() => setFormat('image/jpeg')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                format === 'image/jpeg'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JPEG (Web)
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Display Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
        {isGenerating && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs text-sky-300 font-mono">Generating high-res canvas...</span>
          </div>
        )}

        {previewUrl ? (
          <div
            className={`transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex items-center justify-center ${
              aspectRatio === '9:16'
                ? 'w-[200px] h-[355px] sm:w-[240px] sm:h-[426px]'
                : aspectRatio === '1:1'
                ? 'w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]'
                : 'w-[320px] h-[180px] sm:w-[480px] sm:h-[270px]'
            }`}
          >
            <img
              src={previewUrl}
              alt="Social Media Graphic Preview"
              className="w-full h-full object-contain bg-slate-900"
            />
          </div>
        ) : (
          <div className="text-slate-500 text-xs font-mono">Preparing image canvas...</div>
        )}

        <div className="mt-3 flex items-center justify-between w-full text-[11px] text-slate-400 font-mono px-2">
          <span>
            Resolution:{' '}
            {aspectRatio === '9:16'
              ? '1080 × 1920'
              : aspectRatio === '1:1'
              ? '1080 × 1080'
              : '1200 × 675'}
          </span>
          <span className="text-emerald-400 font-bold">✓ High-DPI Crisp Font Rendering</span>
        </div>
      </div>
    </div>
  );
};
