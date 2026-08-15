import React, { useState, useMemo } from 'react';
import { NormalizedQuestion } from '../../types';
import { generateViralContent } from './captionGenerator';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  Youtube,
  Instagram,
  MessageCircle,
  Hash,
  Shuffle,
  Flame,
} from 'lucide-react';

interface ViralCaptionsCardProps {
  question: NormalizedQuestion;
  hookText: string;
}

export const ViralCaptionsCard: React.FC<ViralCaptionsCardProps> = ({
  question,
  hookText,
}) => {
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'whatsapp'>('youtube');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number>(0);

  const content = useMemo(() => {
    return generateViralContent(question, hookText);
  }, [question, hookText, shuffleSeed]);

  const activeTitle = content.titles[selectedTitleIndex % content.titles.length];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const getActiveCaption = () => {
    switch (platform) {
      case 'youtube':
        return `${activeTitle}\n\n${content.youtubeCaption}`;
      case 'instagram':
        return `${activeTitle}\n\n${content.reelsCaption}`;
      case 'whatsapp':
        return content.whatsappCaption;
      default:
        return content.youtubeCaption;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 rounded-xl text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm flex items-center gap-1.5">
              <span>🚀 Auto Viral Titles & Captions</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-500/40">
                1-CLICK COPY
              </span>
            </h3>
            <p className="text-slate-400 text-xs">
              Instant high-converting titles, descriptions & trending hashtags
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShuffleSeed(prev => prev + 1);
            setSelectedTitleIndex(prev => (prev + 1) % 6);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle Titles</span>
        </button>
      </div>

      {/* 1. Viral Titles Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          🔥 Viral Titles (Select or Click to Copy)
        </label>
        <div className="space-y-1.5">
          {content.titles.map((title, idx) => {
            const isSelected = (selectedTitleIndex % content.titles.length) === idx;
            const isCopied = copiedKey === `title-${idx}`;

            return (
              <div
                key={idx}
                onClick={() => setSelectedTitleIndex(idx)}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/10 text-white font-bold'
                    : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-amber-400 font-mono text-[11px]">#{idx + 1}</span>
                  <span className="truncate">{title}</span>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleCopy(title, `title-${idx}`);
                  }}
                  className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Copy this title"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Platform Tabs & Full Copy */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Platform buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPlatform('youtube')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                platform === 'youtube'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Shorts</span>
            </button>
            <button
              onClick={() => setPlatform('instagram')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                platform === 'instagram'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram Reels</span>
            </button>
            <button
              onClick={() => setPlatform('whatsapp')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                platform === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Quick Action Copy Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleCopy(content.hashtagString, 'hashtags')}
              className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                copiedKey === 'hashtags'
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                  : 'bg-slate-950 border-slate-800 text-sky-400 hover:border-slate-700'
              }`}
            >
              {copiedKey === 'hashtags' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Hash className="w-3.5 h-3.5" />
              )}
              <span>Copy Tags</span>
            </button>

            <button
              onClick={() => handleCopy(getActiveCaption(), 'full-caption')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
                copiedKey === 'full-caption'
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 border-transparent'
              }`}
            >
              {copiedKey === 'full-caption' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY FULL CAPTION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Caption Preview Box */}
        <div className="relative">
          <textarea
            readOnly
            value={getActiveCaption()}
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-sky-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
