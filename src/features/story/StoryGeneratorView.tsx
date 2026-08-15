import React, { useState, useEffect, useRef } from 'react';
import { NormalizedQuestion, StoryFrame, BrandKitConfig } from '../../types';
import { StoryRenderer } from '../../services/storyRenderer';
import { BrandKitService } from '../../services/brandKitService';
import { QuestionLoader } from '../../services/questionLoader';
import { ExportService } from '../../services/exportService';
import {
  Smartphone,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shuffle,
  Layers,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Sliders,
  FolderDown,
} from 'lucide-react';

interface StoryGeneratorViewProps {
  initialQuestion?: NormalizedQuestion | null;
  onBack?: () => void;
  onSelectAnotherQuestion?: () => void;
}

export const StoryGeneratorView: React.FC<StoryGeneratorViewProps> = ({
  initialQuestion,
  onBack,
  onSelectAnotherQuestion,
}) => {
  const [question, setQuestion] = useState<NormalizedQuestion>(
    initialQuestion || QuestionLoader.getRandomQuestion()
  );
  const [hookText, setHookText] = useState<string>(
    `CAN YOU SOLVE THIS ${question.exam || 'TGT CS'} QUESTION IN 10s?`
  );
  const [storyCount, setStoryCount] = useState<1 | 3 | 5>(5);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [frames, setFrames] = useState<StoryFrame[]>([]);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const brandKit = BrandKitService.getBrandKit();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const generated = StoryRenderer.generateFrames(question, hookText, brandKit);
    const sliced = storyCount === 1 ? [generated[0]] : storyCount === 3 ? [generated[0], generated[1], generated[3]] : generated;
    setFrames(sliced);
    setActiveFrameIndex(0);
  }, [question, hookText, storyCount]);

  useEffect(() => {
    if (frames.length > 0 && frames[activeFrameIndex]) {
      const canvas = StoryRenderer.renderFrameToCanvas(frames[activeFrameIndex], question, brandKit);
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    }
  }, [frames, activeFrameIndex, question]);

  const handlePickRandomQuestion = () => {
    const q = QuestionLoader.getRandomQuestion();
    setQuestion(q);
    setHookText(`CAN YOU SOLVE THIS ${q.exam || 'CS'} QUESTION IN 10s?`);
  };

  const handleDownloadActiveFrame = () => {
    if (!frames[activeFrameIndex]) return;
    const canvas = StoryRenderer.renderFrameToCanvas(frames[activeFrameIndex], question, brandKit);
    canvas.toBlob(blob => {
      if (blob) {
        ExportService.triggerDownload(
          blob,
          `BytePrep_Story_Frame_0${frames[activeFrameIndex].frameIndex}_${question.id.slice(-4)}.png`
        );
      }
    });
  };

  const handleDownloadAllZip = async () => {
    setIsExporting(true);
    try {
      await StoryRenderer.exportStoryZip(question, hookText, brandKit);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 VERTICAL STORY STUDIO</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Instagram & WhatsApp Story Generator
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Generate 1080x1920 multi-frame vertical stories (Hook → Question → Timer → Answer → CTA).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePickRandomQuestion}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-sky-400" />
            <span>Random Question</span>
          </button>
          <button
            onClick={handleDownloadAllZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <FolderDown className="w-4 h-4 fill-current" />
            <span>{isExporting ? 'Exporting ZIP...' : 'Export All Frames ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Phone Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Story Frame Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Question Meta Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md text-[10px] font-bold">
                {question.subject} • {question.topic}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {question.id}</span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug">
              {question.question}
            </p>
          </div>

          {/* Config options */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>Story Sequence Settings</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Hook Headline (Slide 1)
              </label>
              <input
                type="text"
                value={hookText}
                onChange={e => setHookText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Story Length (Frames)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 1 as const, label: '1 Story (Hook Only)' },
                  { count: 3 as const, label: '3 Stories (Essential)' },
                  { count: 5 as const, label: '5 Stories (Full Flow)' },
                ].map(item => (
                  <button
                    key={item.count}
                    onClick={() => setStoryCount(item.count)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      storyCount === item.count
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Navigation Thumbnails */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Story Frames ({frames.length})</span>
              <span className="text-sky-400 font-bold">Active: Frame #{activeFrameIndex + 1}</span>
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {frames.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFrameIndex(idx)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    activeFrameIndex === idx
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase">{f.type}</div>
                  <div className="text-xs font-bold mt-1">#{idx + 1}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: 9:16 Phone Mockup View */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-[320px] aspect-[9/16] bg-slate-950 rounded-[36px] p-3.5 border-4 border-slate-800 shadow-2xl ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
            {/* Phone Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20" />

            {/* Canvas Preview Image */}
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Story Preview"
                className="w-full h-full object-cover rounded-[24px]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                Rendering Story Frame...
              </div>
            )}

            {/* Frame Indicator Pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-full text-[10px] font-black text-sky-400 z-20">
              FRAME {activeFrameIndex + 1} OF {frames.length}
            </div>
          </div>

          {/* Frame Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFrameIndex(prev => Math.max(0, prev - 1))}
              disabled={activeFrameIndex === 0}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadActiveFrame}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Frame #{activeFrameIndex + 1} PNG</span>
            </button>

            <button
              onClick={() => setActiveFrameIndex(prev => Math.min(frames.length - 1, prev + 1))}
              disabled={activeFrameIndex === frames.length - 1}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
