import React, { useState, useEffect } from 'react';
import { NormalizedQuestion, CarouselSlide, BrandKitConfig } from '../../types';
import { CarouselRenderer } from '../../services/carouselRenderer';
import { BrandKitService } from '../../services/brandKitService';
import { QuestionLoader } from '../../services/questionLoader';
import { ExportService } from '../../services/exportService';
import {
  Layers,
  Download,
  Shuffle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  FolderDown,
  Image as ImageIcon,
} from 'lucide-react';

interface CarouselGeneratorViewProps {
  initialQuestion?: NormalizedQuestion | null;
  onBack?: () => void;
}

export const CarouselGeneratorView: React.FC<CarouselGeneratorViewProps> = ({
  initialQuestion,
  onBack,
}) => {
  const [question, setQuestion] = useState<NormalizedQuestion>(
    initialQuestion || QuestionLoader.getRandomQuestion()
  );
  const [hookText, setHookText] = useState<string>(
    `95% OF CS STUDENTS GET THIS ${question.topic || 'CS'} QUESTION WRONG!`
  );
  const [slideCount, setSlideCount] = useState<4 | 5 | 7>(7);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const brandKit = BrandKitService.getBrandKit();

  useEffect(() => {
    const generated = CarouselRenderer.generateSlides(question, hookText, slideCount, brandKit);
    setSlides(generated);
    setActiveSlideIndex(0);
  }, [question, hookText, slideCount]);

  useEffect(() => {
    if (slides.length > 0 && slides[activeSlideIndex]) {
      const canvas = CarouselRenderer.renderSlideToCanvas(
        slides[activeSlideIndex],
        question,
        slides.length,
        brandKit
      );
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    }
  }, [slides, activeSlideIndex, question]);

  const handlePickRandomQuestion = () => {
    const q = QuestionLoader.getRandomQuestion();
    setQuestion(q);
    setHookText(`95% OF CS STUDENTS GET THIS ${q.topic || 'CS'} QUESTION WRONG!`);
  };

  const handleDownloadActiveSlide = () => {
    if (!slides[activeSlideIndex]) return;
    const canvas = CarouselRenderer.renderSlideToCanvas(
      slides[activeSlideIndex],
      question,
      slides.length,
      brandKit
    );
    canvas.toBlob(blob => {
      if (blob) {
        ExportService.triggerDownload(
          blob,
          `BytePrep_Carousel_Slide_0${slides[activeSlideIndex].slideIndex}_${question.id.slice(-4)}.png`
        );
      }
    });
  };

  const handleDownloadAllZip = async () => {
    setIsExporting(true);
    try {
      await CarouselRenderer.exportCarouselZip(question, hookText, slideCount, brandKit);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
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
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>4:5 INSTAGRAM CAROUSEL STUDIO</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Instagram Multi-Slide Carousel Generator
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            High-retention 1080x1350 carousels (Hook → Question → Options → Pause → Solution → CTA).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePickRandomQuestion}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-purple-400" />
            <span>Random Question</span>
          </button>
          <button
            onClick={handleDownloadAllZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <FolderDown className="w-4 h-4 fill-current" />
            <span>{isExporting ? 'Exporting ZIP...' : 'Export All Slides ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Carousel Slide Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Question Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-bold">
                {question.subject} • {question.topic}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {question.id}</span>
            </div>
            <p className="text-sm font-semibold text-white leading-snug">
              {question.question}
            </p>
          </div>

          {/* Config Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Carousel Structure & Settings</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Slide 1 Hook Headline
              </label>
              <input
                type="text"
                value={hookText}
                onChange={e => setHookText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Number of Slides
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 4 as const, label: '4 Slides (Short)' },
                  { count: 5 as const, label: '5 Slides (Standard)' },
                  { count: 7 as const, label: '7 Slides (Full Master)' },
                ].map(item => (
                  <button
                    key={item.count}
                    onClick={() => setSlideCount(item.count)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      slideCount === item.count
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Deck Tabs */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Carousel Slide Deck ({slides.length})</span>
              <span className="text-purple-400 font-bold">Active: Slide #{activeSlideIndex + 1}</span>
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    activeSlideIndex === idx
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[9px] font-black uppercase truncate">{s.type}</div>
                  <div className="text-xs font-bold mt-0.5">#{idx + 1}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: 4:5 Square/Portrait Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-[340px] aspect-[4/5] bg-slate-950 rounded-2xl p-2 border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Carousel Slide Preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                Rendering 4:5 Slide...
              </div>
            )}

            {/* Slide Index Badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-full text-[10px] font-black text-purple-300">
              {activeSlideIndex + 1} / {slides.length}
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl cursor-pointer disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadActiveSlide}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Download Slide #{activeSlideIndex + 1} PNG</span>
            </button>

            <button
              onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={activeSlideIndex === slides.length - 1}
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
