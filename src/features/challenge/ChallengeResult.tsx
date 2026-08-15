import React from 'react';
import { PlayResult } from '../../types';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Video, Share2, Award, Sparkles, HelpCircle } from 'lucide-react';

interface ChallengeResultProps {
  result: PlayResult;
  onNextQuestion: () => void;
  onPlayAgain: () => void;
  onCreateShort: () => void;
  onShare: () => void;
}

export const ChallengeResult: React.FC<ChallengeResultProps> = ({
  result,
  onNextQuestion,
  onPlayAgain,
  onCreateShort,
  onShare,
}) => {
  const { question, userAnswer, isCorrect, score, timeRemaining } = result;
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-[90vh] max-w-md mx-auto p-4 sm:p-6 text-slate-100 flex flex-col justify-between">
      {/* Result Status Banner */}
      <div className="text-center space-y-2 mt-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          BYTEPREP CS • RESULT
        </span>

        {isCorrect ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-xl animate-bounce">
            <CheckCircle2 className="w-6 h-6" />
            <span>🏆 CORRECT ANSWER!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-xl">
            <XCircle className="w-6 h-6" />
            <span>⏰ {userAnswer === null ? "TIME'S UP!" : "INCORRECT"}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300 pt-1">
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Score: <strong className="text-white text-sm">{score}</strong> pts</span>
          </span>
          <span>•</span>
          <span>Time Left: <strong className="text-sky-400 text-sm">{timeRemaining.toFixed(1)}s</strong></span>
        </div>
      </div>

      {/* Question Summary */}
      <div className="my-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 text-sky-400">
          Question
        </p>
        <p className="text-slate-100 font-bold text-base leading-snug">
          {question.question}
        </p>
      </div>

      {/* Answers Comparison */}
      <div className="space-y-2.5 mb-5">
        {question.options.map((optionText, idx) => {
          const isCorrectAns = idx === question.correctAnswer;
          const isUserSelection = idx === userAnswer;

          let borderColor = 'border-slate-800';
          let bgColor = 'bg-slate-900/60';
          let textColor = 'text-slate-300';

          if (isCorrectAns) {
            borderColor = 'border-emerald-500';
            bgColor = 'bg-emerald-500/20';
            textColor = 'text-emerald-300 font-bold';
          } else if (isUserSelection && !isCorrect) {
            borderColor = 'border-rose-500';
            bgColor = 'bg-rose-500/20';
            textColor = 'text-rose-300 line-through';
          }

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between ${borderColor} ${bgColor} transition-all`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    isCorrectAns
                      ? 'bg-emerald-500 text-slate-950'
                      : isUserSelection
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {optionLetters[idx]}
                </span>
                <span className={`text-sm ${textColor}`}>{optionText}</span>
              </div>

              {isCorrectAns && (
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  ✓ Correct
                </span>
              )}
              {isUserSelection && !isCorrect && (
                <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  Your Selection
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* WHY? Explanation Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 shadow-xl mb-6">
        <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span># WHY? (EXPLANATION)</span>
        </div>
        <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
          {question.explanation}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onNextQuestion}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            <span>NEXT QUESTION</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onCreateShort}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>CREATE SHORT</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>SHARE RESULT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
