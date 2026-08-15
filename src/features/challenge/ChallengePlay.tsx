import React, { useState, useEffect, useRef } from 'react';
import { NormalizedQuestion, PlayResult, ChallengeSettings } from '../../types';
import { audioService } from '../../services/audioService';
import { hapticService } from '../../services/hapticService';
import { Clock, Zap, AlertCircle } from 'lucide-react';

interface ChallengePlayProps {
  question: NormalizedQuestion;
  settings: ChallengeSettings;
  onFinish: (result: PlayResult) => void;
}

export const ChallengePlay: React.FC<ChallengePlayProps> = ({
  question,
  settings,
  onFinish,
}) => {
  const timerDuration = settings.defaultTimer || 10;
  const [remainingTime, setRemainingTime] = useState<number>(timerDuration);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isTimesUp, setIsTimesUp] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSecRef = useRef<number>(timerDuration);

  // High-precision performance.now() timer loop
  useEffect(() => {
    audioService.setEnabled(settings.soundEnabled);
    hapticService.setEnabled(settings.hapticsEnabled);

    startTimeRef.current = performance.now();

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, timerDuration - elapsed);

      setRemainingTime(left);

      const secFloor = Math.ceil(left);
      if (secFloor < lastSecRef.current && secFloor > 0) {
        lastSecRef.current = secFloor;
        if (secFloor <= 3) {
          audioService.playUrgentTick();
          hapticService.medium();
        } else {
          audioService.playTick();
          hapticService.light();
        }
      }

      if (left <= 0) {
        // Time expired
        setIsTimesUp(true);
        audioService.playTimesUp();
        hapticService.timesUp();
        
        // Finalize
        setTimeout(() => {
          finalizePlay(null, left);
        }, 800);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [timerDuration, settings.soundEnabled, settings.hapticsEnabled]);

  const handleSelectOption = (index: number) => {
    if (isLocked || isTimesUp) return;

    setSelectedOption(index);
    setIsLocked(true);
    hapticService.light();

    // Small delay to show locked selection state before revealing result
    setTimeout(() => {
      const left = Math.max(0, remainingTime);
      finalizePlay(index, left);
    }, 400);
  };

  const finalizePlay = (userAns: number | null, timeRemaining: number) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const isCorrect = userAns !== null && userAns === question.correctAnswer;
    let score = 0;

    if (isCorrect) {
      score = 100;
      if (timeRemaining >= 8) score += 100; // Fast bonus
      else if (timeRemaining >= 5) score += 50;
    }

    if (isCorrect) {
      audioService.playCorrect();
      hapticService.correct();
    } else {
      audioService.playIncorrect();
      hapticService.incorrect();
    }

    onFinish({
      question,
      userAnswer: userAns,
      isCorrect,
      score,
      timeRemaining,
      timerDuration,
    });
  };

  const optionLetters = ['A', 'B', 'C', 'D'];
  const timerSec = Math.ceil(remainingTime);
  const timerPercent = (remainingTime / timerDuration) * 100;

  // Dynamic Color Transition: Green (>50%) -> Yellow (25-50%) -> Red (<25%)
  const getTimerColor = () => {
    if (timerPercent > 50) {
      return {
        stroke: 'stroke-emerald-400',
        text: 'text-emerald-400',
        badgeText: 'text-emerald-400',
        label: '⚡ SPEED BONUS ACTIVE',
      };
    } else if (timerPercent > 25) {
      return {
        stroke: 'stroke-amber-400',
        text: 'text-amber-400',
        badgeText: 'text-amber-400',
        label: '⚠️ HURRY UP!',
      };
    } else {
      return {
        stroke: 'stroke-rose-500',
        text: 'text-rose-500 animate-pulse',
        badgeText: 'text-rose-400',
        label: '🚨 TIME RUNNING OUT!',
      };
    }
  };

  const currentColor = getTimerColor();
  const isUrgent = timerPercent <= 25;

  return (
    <div className="min-h-[90vh] flex flex-col justify-between max-w-md mx-auto p-4 sm:p-6 text-slate-100 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sky-400 font-extrabold text-xs uppercase tracking-wider block">
            BYTEPREP TGT PGT CS
          </span>
          <span className="text-slate-400 text-[11px] font-semibold">
            {question.subject} • {question.topic}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{question.exam}</span>
        </div>
      </div>

      {/* Prominent Visual Timer */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* SVG Timer Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="62"
              className="stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="62"
              className={`transition-all duration-200 ${currentColor.stroke}`}
              strokeWidth="10"
              strokeDasharray={389.5}
              strokeDashoffset={389.5 - (389.5 * timerPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-5xl font-black tracking-tighter transition-colors duration-300 ${currentColor.text}`}
            >
              {String(timerSec).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              SECONDS
            </span>
          </div>
        </div>

        <span className={`font-extrabold text-xs tracking-wider mt-2 flex items-center gap-1 transition-colors ${currentColor.badgeText} ${isUrgent ? 'animate-bounce' : ''}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{currentColor.label}</span>
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-5 shadow-2xl mb-6 flex items-center justify-center min-h-[160px]">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 text-center leading-snug">
          {question.question}
        </h2>
      </div>

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {question.options.map((optionText, idx) => {
          const isSelected = selectedOption === idx;

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isLocked || isTimesUp}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-sky-400 bg-sky-500/20 text-white shadow-lg shadow-sky-500/10'
                  : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                  isSelected ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {optionLetters[idx]}
              </span>

              <span className="text-sm font-semibold leading-normal flex-1">
                {optionText}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="text-center pt-2 border-t border-slate-900">
        <span className="text-slate-500 text-xs font-bold tracking-widest uppercase">
          BYTEPREP CS • THINK FAST
        </span>
      </div>
    </div>
  );
};
