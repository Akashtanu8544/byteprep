import React, { useState, useEffect } from 'react';
import { NormalizedQuestion, GeneratedContentPack } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { IndexedDbService } from '../../services/indexedDbService';
import { GapFinderService, ContentGapAnalysis, TopicGapReport } from '../../services/gapFinderService';
import {
  PieChart,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  Flame,
} from 'lucide-react';

interface ContentGapFinderViewProps {
  onBack?: () => void;
  onOpenContentPack?: (question: NormalizedQuestion) => void;
}

export const ContentGapFinderView: React.FC<ContentGapFinderViewProps> = ({
  onBack,
  onOpenContentPack,
}) => {
  const [analysis, setAnalysis] = useState<ContentGapAnalysis | null>(null);
  const [selectedGap, setSelectedGap] = useState<TopicGapReport | null>(null);
  const [matchingQuestions, setMatchingQuestions] = useState<NormalizedQuestion[]>([]);

  const allQuestions = QuestionLoader.getAllQuestions();

  useEffect(() => {
    IndexedDbService.getAllContentPacks().then(packs => {
      const result = GapFinderService.analyze(allQuestions, packs);
      setAnalysis(result);
      if (result.topGaps.length > 0) {
        setSelectedGap(result.topGaps[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedGap) {
      const matched = GapFinderService.getQuestionsForGap(
        selectedGap.subject,
        selectedGap.topic,
        6
      );
      setMatchingQuestions(matched);
    }
  }, [selectedGap]);

  if (!analysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        Analyzing Question Bank coverage and posted content gaps...
      </div>
    );
  }

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
            <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              <span>CONTENT GAP & AUDIENCE INTELLIGENCE</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Content Gap Finder
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Identify neglected Computer Science topics, underrepresented PYQs, and instantly fill content gaps.
          </p>
        </div>

        {/* High-Level Coverage Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div>
            <div className="text-2xl font-black text-rose-400">{analysis.overallCoverage}%</div>
            <div className="text-[11px] font-semibold text-slate-400">Overall Bank Coverage</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-2xl font-black text-white">
              {analysis.totalQuestions - analysis.totalPosted}
            </div>
            <div className="text-[11px] font-semibold text-slate-400">Fresh Unposted Questions</div>
          </div>
        </div>
      </div>

      {/* Recommendations Alert Box */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider">
              Strategic Content Recommendations
            </h3>
          </div>
          <div className="space-y-1 text-xs text-slate-200">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Identified Gaps vs Instant Matching Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Top Identified Topic Gaps */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
            Top Underrepresented Topics
          </h2>

          <div className="space-y-2.5">
            {analysis.topGaps.map((gap, idx) => {
              const isSelected = selectedGap?.topic === gap.topic && selectedGap?.subject === gap.subject;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedGap(gap)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500/80 shadow-lg ring-1 ring-rose-500/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[10px] font-bold">
                        {gap.subject}
                      </span>
                      {gap.postedCount === 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[9px] font-black uppercase">
                          0 POSTS
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">{gap.topic}</div>
                    <div className="text-[11px] text-slate-400">
                      {gap.unpostedCount} unposted / {gap.totalQuestions} total ({gap.coveragePercentage}% posted)
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-rose-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Instant "Generate for this Gap" Question Pool */}
        <div className="lg:col-span-7 space-y-4">
          {selectedGap ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-black uppercase">
                    GAP FOCUS
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    {selectedGap.subject} → {selectedGap.topic}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedGap.recommendation}
                  </p>
                </div>
              </div>

              {/* Matching Questions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Unused Questions In Question Bank ({matchingQuestions.length})
                </h4>

                {matchingQuestions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 rounded-2xl text-slate-500 text-xs font-semibold">
                    No unposted questions found for this specific topic. You can add more in the Question Bank tab!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {matchingQuestions.map(q => (
                      <div
                        key={q.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{q.id}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {q.difficulty?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-2">
                            {q.question}
                          </p>
                        </div>

                        {onOpenContentPack && (
                          <button
                            onClick={() => onOpenContentPack(q)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>Generate Pack</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
              Select an underrepresented topic on the left to view matching raw questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
