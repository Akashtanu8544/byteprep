import React, { useState, useEffect } from 'react';
import { NormalizedQuestion } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { BrandKitService } from '../../services/brandKitService';
import { ExportService } from '../../services/exportService';
import {
  Code2,
  Bug,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Shuffle,
  Terminal,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';

interface CodeChallengeViewProps {
  onBack?: () => void;
}

type ChallengeType = 'output' | 'debug';
type SupportedLang = 'c' | 'cpp' | 'java' | 'python' | 'javascript' | 'sql';

interface SampleCodeProblem {
  id: string;
  type: ChallengeType;
  title: string;
  language: SupportedLang;
  hook: string;
  code: string;
  options: string[];
  correctAnswer: number;
  expectedOutput: string;
  buggyLine?: number;
  correctedCode?: string;
  explanation: string;
}

const SAMPLE_CODE_PROBLEMS: SampleCodeProblem[] = [
  {
    id: 'code_py_01',
    type: 'output',
    title: 'Python Mutable Default Arguments Trap',
    language: 'python',
    hook: 'WHAT IS THE OUTPUT OF THIS PYTHON CODE? 90% GET THIS WRONG! 🐍',
    code: `def append_item(item, lst=[]):\n    lst.append(item)\n    return lst\n\nprint(append_item(1))\nprint(append_item(2))`,
    options: ['[1] and [2]', '[1] and [1, 2]', '[1, 2] and [1, 2]', 'Error'],
    correctAnswer: 1,
    expectedOutput: '[1]\n[1, 2]',
    explanation:
      'In Python, default arguments are evaluated only once when the function definition is executed. The list lst retains modifications across calls.',
  },
  {
    id: 'code_c_01',
    type: 'output',
    title: 'C Post-Increment & Precedence Trap',
    language: 'c',
    hook: 'CAN YOU PREDICT THE OUTPUT OF THIS C POINTER & POST-INCREMENT MCQ? ⏱️',
    code: `#include <stdio.h>\nint main() {\n    int a = 5;\n    int b = a++ + ++a;\n    printf("%d", b);\n    return 0;\n}`,
    options: ['12', '11', '13', 'Undefined Behavior / Compiler dependent'],
    correctAnswer: 3,
    expectedOutput: 'Undefined Behavior (Sequence Point Violation)',
    explanation:
      'Modifying a variable multiple times without an intervening sequence point causes undefined behavior in standard C/C++.',
  },
  {
    id: 'code_sql_01',
    type: 'output',
    title: 'SQL NULL Comparison & COUNT Trap',
    language: 'sql',
    hook: 'DSSSB CS EXAM TRAP: SQL NULL COMPARISON & COUNT(*) ⚠️',
    code: `SELECT COUNT(*), COUNT(salary)\nFROM Employees\nWHERE salary = NULL;`,
    options: ['0, 0', 'Count of rows, Count of rows', 'NULL, NULL', 'Syntax Error'],
    correctAnswer: 0,
    expectedOutput: '0, 0',
    explanation:
      'In SQL, salary = NULL evaluates to UNKNOWN/FALSE for all rows. To check for NULL values, IS NULL must be used. Therefore 0 rows match the WHERE clause.',
  },
  {
    id: 'code_debug_01',
    type: 'debug',
    title: 'Find The Bug: Binary Search Integer Overflow',
    language: 'java',
    hook: 'CAN YOU SPOT THE BUG IN THIS BINARY SEARCH IMPLEMENTATION? 🐛',
    code: `public int binarySearch(int[] arr, int target) {\n    int low = 0, high = arr.length - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2; // Line 4\n        if (arr[mid] == target) return mid;\n        else if (arr[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`,
    options: ['Line 4: Integer overflow in (low + high)', 'Line 2: while loop condition should be <', 'Line 5: return mid is wrong', 'Line 6: high should be mid'],
    correctAnswer: 0,
    expectedOutput: 'int mid = low + (high - low) / 2;',
    buggyLine: 4,
    correctedCode: `int mid = low + (high - low) / 2;`,
    explanation:
      'In Line 4, (low + high) can overflow standard 32-bit signed integer if the sum exceeds 2^31 - 1, producing a negative number.',
  },
];

export const CodeChallengeView: React.FC<CodeChallengeViewProps> = ({ onBack }) => {
  const [problems, setProblems] = useState<SampleCodeProblem[]>(SAMPLE_CODE_PROBLEMS);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [activeType, setActiveType] = useState<ChallengeType>('output');
  const [selectedLang, setSelectedLang] = useState<SupportedLang>('python');
  const [timerSeconds, setTimerSeconds] = useState<number>(10);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeProblem = problems[selectedIdx] || problems[0];
  const brandKit = BrandKitService.getBrandKit();

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(t => t - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      setShowAnswer(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = () => {
    setTimerSeconds(10);
    setShowAnswer(false);
    setIsTimerRunning(true);
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setTimerSeconds(10);
    setShowAnswer(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeProblem.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
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
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>CODE OUTPUT & DEBUG STUDIO</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Code Output & Bug Hunting Challenge
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Engaging programming challenges for C, C++, Java, Python, JavaScript & SQL with 10s countdown timer.
          </p>
        </div>

        {/* Switch Output vs Debug Mode */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveType('output');
              const found = problems.findIndex(p => p.type === 'output');
              if (found >= 0) setSelectedIdx(found);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === 'output'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Code Output</span>
          </button>

          <button
            onClick={() => {
              setActiveType('debug');
              const found = problems.findIndex(p => p.type === 'debug');
              if (found >= 0) setSelectedIdx(found);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === 'debug'
                ? 'bg-rose-500 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Find The Bug</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Code Editor / Snippet View */}
        <div className="lg:col-span-7 space-y-6">
          {/* Problem Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {problems
              .filter(p => p.type === activeType)
              .map((p, idx) => {
                const actualIdx = problems.findIndex(item => item.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedIdx(actualIdx);
                      handleReset();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      selectedIdx === actualIdx
                        ? 'bg-slate-800 border-sky-500 text-sky-400 shadow-md ring-1 ring-sky-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="uppercase text-[10px] font-black text-slate-500 mr-1.5">
                      {p.language}
                    </span>
                    <span>{p.title}</span>
                  </button>
                );
              })}
          </div>

          {/* Hook Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md text-[10px] font-black uppercase">
                VIRAL HOOK
              </span>
              <span className="text-xs font-bold text-white">{activeProblem.hook}</span>
            </div>
          </div>

          {/* Code Box with Syntax Styling */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 ml-2 uppercase">
                  {activeProblem.language} snippet
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto bg-slate-950/90">
              <pre>
                <code>{activeProblem.code}</code>
              </pre>
            </div>

            {/* Code Disclaimer Notice */}
            <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Output should be reviewed before publishing.</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">BytePrep Code Engine</span>
            </div>
          </div>
        </div>

        {/* Right Side: 10s Timer & Option Reveal Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timer Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                10-Second Timer Challenge
              </span>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div
                  className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all ${
                    isTimerRunning
                      ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse'
                      : 'border-slate-700'
                  }`}
                >
                  <span className="text-4xl font-black text-white font-mono">
                    {timerSeconds}s
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartTimer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 10s Countdown</span>
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Timer</span>
                </button>
              )}

              <button
                onClick={() => setShowAnswer(prev => !prev)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                {showAnswer ? 'Hide Solution' : 'Reveal Solution'}
              </button>
            </div>
          </div>

          {/* Options Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Options
            </h3>

            <div className="space-y-2">
              {activeProblem.options.map((opt, idx) => {
                const isCorrect = idx === activeProblem.correctAnswer;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-3 transition-all ${
                      showAnswer && isCorrect
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                        showAnswer && isCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-mono">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution & Explanation Panel */}
          {showAnswer && (
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-sky-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-emerald-300 uppercase">
                  Verified Output & Solution
                </h4>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 text-xs font-mono text-emerald-400">
                <pre>{activeProblem.expectedOutput}</pre>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeProblem.explanation}
              </p>

              {activeProblem.correctedCode && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-sky-400 uppercase mb-1">
                    Corrected Code:
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-sky-500/30 text-xs font-mono text-sky-300">
                    <code>{activeProblem.correctedCode}</code>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 text-[11px] font-semibold text-slate-400">
                🚀 Practice 500+ Code MCQ Challenges in <strong className="text-sky-400">{brandKit.brandName}</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
