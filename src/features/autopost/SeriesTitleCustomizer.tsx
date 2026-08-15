import React, { useState } from 'react';
import {
  Hash,
  Sparkles,
  RefreshCw,
  Check,
  Flame,
  Zap,
  TrendingUp,
  Tag,
  HelpCircle,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { SeriesTitleConfig, NormalizedQuestion } from '../../types';
import { StorageService } from '../../services/storageService';

interface SeriesTitleCustomizerProps {
  config: SeriesTitleConfig;
  onChange: (updated: SeriesTitleConfig) => void;
  sampleQuestion?: NormalizedQuestion;
}

export const SeriesTitleCustomizer: React.FC<SeriesTitleCustomizerProps> = ({
  config,
  onChange,
  sampleQuestion,
}) => {
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);

  const sampleQ = sampleQuestion || {
    id: 'sample-1',
    question: 'Which scheduling algorithm is non-preemptive?',
    options: ['Round Robin', 'FCFS', 'SRTF', 'Priority (Preemptive)'],
    correctAnswer: 1,
    explanation: 'First-Come, First-Served (FCFS) is inherently non-preemptive.',
    subject: 'Operating Systems',
    topic: 'CPU Scheduling',
    difficulty: 'easy' as const,
    exam: 'GATE / DSSSB CS',
    sourceFile: 'sample.json',
  };

  const handleUpdate = (field: keyof SeriesTitleConfig, value: any) => {
    const updated = { ...config, [field]: value };
    StorageService.saveSeriesConfig(updated);
    onChange(updated);
  };

  const handleFetchAiSuggestions = async () => {
    setIsAiLoading(true);
    setShowAiDrawer(true);
    try {
      const res = await fetch('/api/ai/suggest-series-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: sampleQ.subject || 'Computer Science Core',
          theme: '10 Second Challenge Speed Quiz',
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.warn('Could not fetch AI suggestions:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiTemplate = (suggestion: any) => {
    const updated = {
      ...config,
      template: suggestion.titleTemplate,
      customHashtags: suggestion.tags ? suggestion.tags.join(' ') : config.customHashtags,
    };
    StorageService.saveSeriesConfig(updated);
    onChange(updated);
  };

  const next1 = StorageService.formatSeriesTitle(
    config.template,
    config.currentNumber,
    config.zeroPadding,
    sampleQ
  );
  const next2 = StorageService.formatSeriesTitle(
    config.template,
    config.currentNumber + 1,
    config.zeroPadding,
    sampleQ
  );
  const next3 = StorageService.formatSeriesTitle(
    config.template,
    config.currentNumber + 2,
    config.zeroPadding,
    sampleQ
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
      {/* Title & AI Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Auto-Increment Series Title</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                #{config.currentNumber} Next
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Each post automatically increments #{'{n}'} (e.g. 10 Sec Challenge #1, #2, #3...)
            </p>
          </div>
        </div>

        <button
          onClick={handleFetchAiSuggestions}
          disabled={isAiLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'Gemini AI Thinking...' : '✨ Suggest Titles with AI'}</span>
        </button>
      </div>

      {/* Template Formula Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>Series Title Formula Pattern:</span>
            <span className="text-[11px] font-normal text-slate-500">
              (Use <code className="text-amber-400 font-mono">{'{n}'}</code> for episode #)
            </span>
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {'{subject}'}, {'{topic}'}, {'{hook}'}
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={config.template}
            onChange={e => handleUpdate('template', e.target.value)}
            placeholder="10 Sec Challenge #{n} | {subject} CS Quiz 🔥"
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-slate-100 font-medium outline-none pr-10 shadow-inner"
          />
          <Hash className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
        </div>
      </div>

      {/* Number Controls & Padding */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Next Series Number */}
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
            Next Episode Number:
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdate('currentNumber', Math.max(1, config.currentNumber - 1))}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={config.currentNumber}
              onChange={e => handleUpdate('currentNumber', Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 text-center font-black text-sm text-amber-400 outline-none"
            />
            <button
              onClick={() => handleUpdate('currentNumber', config.currentNumber + 1)}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Number Format / Padding */}
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
          <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
            Number Digits Style:
          </label>
          <select
            value={config.zeroPadding}
            onChange={e => handleUpdate('zeroPadding', parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold outline-none cursor-pointer"
          >
            <option value={1}>#1, #2, #10 (Standard)</option>
            <option value={2}>#01, #02, #10 (2-Digit Padded)</option>
            <option value={3}>#001, #002, #010 (3-Digit Master)</option>
          </select>
        </div>

        {/* Auto Increment Switch */}
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-400 block mb-1">
            Auto-Increment on Post:
          </label>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={config.autoIncrement}
              onChange={e => handleUpdate('autoIncrement', e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-bold text-emerald-400">
              {config.autoIncrement ? 'Enabled (+1 each post)' : 'Manual counter'}
            </span>
          </label>
        </div>
      </div>

      {/* Live Preview Box showing #1, #2, #3 */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Live Dynamic Series Preview
          </span>
          <span className="text-emerald-400">Ready for FB / YT / IG</span>
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-amber-500/20 text-amber-300 flex items-center gap-2 font-bold">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">NEXT POST</span>
            <span className="truncate">{next1}</span>
          </div>
          <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">THEN</span>
            <span className="truncate">{next2}</span>
          </div>
          <div className="p-2 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">THEN</span>
            <span className="truncate">{next3}</span>
          </div>
        </div>
      </div>

      {/* AI Suggestions Drawer */}
      {showAiDrawer && aiSuggestions.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini AI High-CTR Series Formulas</span>
            </h4>
            <button
              onClick={() => setShowAiDrawer(false)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSuggestions.map((sug, idx) => (
              <div
                key={idx}
                onClick={() => applyAiTemplate(sug)}
                className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all group text-left"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {sug.category || 'Formula'}
                  </span>
                  <span className="text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Use Formula <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                  {sug.titleTemplate}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sug.description}</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400/90 truncate bg-slate-900/80 px-2 py-1 rounded-lg">
                  Example: {sug.sampleFormatted}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
