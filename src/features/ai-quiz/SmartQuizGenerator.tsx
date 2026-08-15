import React, { useState } from 'react';
import { NormalizedQuestion } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import {
  Sparkles,
  Bot,
  Layers,
  Video,
  Share2,
  Play,
  Download,
  Copy,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Flame,
  Search,
} from 'lucide-react';

interface SmartQuizGeneratorProps {
  onSelectForPlay: (question: NormalizedQuestion) => void;
  onSelectForStudio: (questionId: string) => void;
  onSelectForPoll: (questionId: string) => void;
  onSelectForFlashcard: (questionId: string) => void;
  onPlayFullGeneratedSet?: (questions: NormalizedQuestion[]) => void;
}

const SYLLABUS_PRESETS = [
  { label: 'Subnetting & CIDR', subject: 'Computer Networks' },
  { label: 'TCP 3-Way Handshake & OSI', subject: 'Computer Networks' },
  { label: 'Deadlocks & Banker’s Algorithm', subject: 'Operating Systems' },
  { label: 'CPU Scheduling (Round Robin/SJF)', subject: 'Operating Systems' },
  { label: 'Normalization (1NF to BCNF)', subject: 'DBMS' },
  { label: 'SQL Joins & Indexing (B+ Trees)', subject: 'DBMS' },
  { label: 'Binary Search Trees & AVL', subject: 'Data Structures' },
  { label: 'Graph BFS, DFS & Dijkstra', subject: 'Data Structures' },
  { label: 'Cache Memory & Pipelining', subject: 'Computer Architecture' },
  { label: 'Logic Gates & K-Maps', subject: 'Digital Electronics' },
  { label: 'Python OOP, Lists & Decorators', subject: 'Programming' },
  { label: 'Software Testing & SDLC Models', subject: 'Software Engineering' },
];

export const SmartQuizGenerator: React.FC<SmartQuizGeneratorProps> = ({
  onSelectForPlay,
  onSelectForStudio,
  onSelectForPoll,
  onSelectForFlashcard,
  onPlayFullGeneratedSet,
}) => {
  const [topic, setTopic] = useState<string>('Deadlocks and Process Synchronization');
  const [exam, setExam] = useState<string>('DSSSB TGT/PGT CS');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<NormalizedQuestion[]>([]);
  const [savedToBank, setSavedToBank] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a Computer Science topic or syllabus keyword.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSavedToBank(false);
    setGenerationStage('Connecting to Gemini 3.7 Flash model...');

    try {
      // Step simulation for crisp feedback
      setTimeout(() => {
        setGenerationStage(`Generating 10 conceptual MCQs for "${topic}"...`);
      }, 700);

      setTimeout(() => {
        setGenerationStage('Crafting 4 distinct options & technical explanations...');
      }, 1600);

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          exam,
          difficulty,
          count: questionCount,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned by Gemini API.');
      }

      setGeneratedQuestions(data.questions);
      // Auto expand first question explanation
      setExpandedExplanations({ [data.questions[0].id]: true });
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      setError(err.message || 'Failed to generate quiz with Gemini API. Please check your topic and try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const toggleExplanation = (qId: string) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSaveAllToBank = () => {
    if (generatedQuestions.length === 0) return;
    QuestionLoader.addCustomQuestions(generatedQuestions);
    setSavedToBank(true);
  };

  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(generatedQuestions, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(generatedQuestions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BytePrep_Quiz_${topic.replace(/[^a-zA-Z0-9]/g, '_')}_10Q.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>POWERED BY GEMINI 3.7 FLASH API</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Smart Quiz & MCQ Generator
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Enter any Computer Science syllabus topic or concept keyword to instantly generate 
              <strong className="text-sky-300"> 10 high-yield, exam-targeted MCQs </strong> 
              with 4 options, verified correct answers, and thorough step-by-step explanations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-amber-400">10 MCQs</div>
              <div className="text-[11px] text-slate-400 font-semibold">1-Click Generation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Generator Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="space-y-4">
          <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
            1. Enter Topic or Syllabus Keyword
          </label>

          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Subnetting & CIDR, Deadlock Prevention, B+ Trees, SQL Joins, Pipelining..."
              className="w-full bg-slate-950 border-2 border-slate-700 focus:border-sky-500 text-white font-bold text-base px-4 py-3.5 rounded-2xl outline-none transition-all placeholder:text-slate-600 pl-11"
              onKeyDown={e => {
                if (e.key === 'Enter') handleGenerate();
              }}
            />
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick Syllabus Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400">Popular Exam Syllabus Presets:</span>
            <div className="flex flex-wrap gap-2">
              {SYLLABUS_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => setTopic(preset.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    topic === preset.label
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-md shadow-sky-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Target Exam */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Target Examination</label>
            <select
              value={exam}
              onChange={e => setExam(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="DSSSB TGT/PGT CS">DSSSB TGT/PGT CS</option>
              <option value="KVS PGT CS">KVS PGT CS</option>
              <option value="NVS PGT CS">NVS PGT CS</option>
              <option value="EMRS PGT CS">EMRS PGT CS</option>
              <option value="UGC NET CS">UGC NET CS</option>
              <option value="State TET / STET CS">State TET / STET CS</option>
              <option value="General CS Teacher Exam">General CS Teacher Exam</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Question Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="easy">Easy (Direct & Factual)</option>
              <option value="medium">Medium (Standard Exam PYQ Level)</option>
              <option value="hard">Hard (Advanced Numerical & Conceptual)</option>
            </select>
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Question Count</label>
            <select
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value={10}>10 Questions (Standard Set)</option>
              <option value={5}>5 Questions (Quick Test)</option>
              <option value={15}>15 Questions (Full Mock)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>{generationStage || 'Generating 10 Smart MCQs...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>GENERATE 10 SMART MCQs WITH GEMINI</span>
            </>
          )}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Quiz Generation Failed</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Generated Questions View */}
      {generatedQuestions.length > 0 && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black">
                  10 QUESTIONS READY
                </span>
                <span className="text-xs text-slate-400 font-semibold">{topic}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">Generated Question Set</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Save to Bank */}
              <button
                onClick={handleSaveAllToBank}
                disabled={savedToBank}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  savedToBank
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                }`}
              >
                {savedToBank ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved to Question Bank</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All to Question Bank</span>
                  </>
                )}
              </button>

              {/* Copy JSON */}
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              {/* Download JSON */}
              <button
                onClick={handleDownloadJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* List of 10 Question Cards */}
          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => {
              const isExpanded = !!expandedExplanations[q.id];
              return (
                <div
                  key={q.id || idx}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition-all space-y-4 shadow-lg"
                >
                  {/* Top Question Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        Q{idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                            {q.subject}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            {q.topic}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {q.difficulty}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                          {q.question}
                        </h3>
                      </div>
                    </div>

                    {/* Action Hub per question */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => onSelectForPlay(q)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Play 10-Second MCQ Challenge"
                      >
                        <Play className="w-3 h-3" />
                        <span>Play 10s</span>
                      </button>

                      <button
                        onClick={() => {
                          QuestionLoader.addCustomQuestions([q]);
                          onSelectForStudio(q.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Create 9:16 Short Video"
                      >
                        <Video className="w-3 h-3" />
                        <span>Short</span>
                      </button>

                      <button
                        onClick={() => {
                          QuestionLoader.addCustomQuestions([q]);
                          onSelectForPoll(q.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Make Telegram & Social Media Poll"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Poll</span>
                      </button>

                      <button
                        onClick={() => {
                          QuestionLoader.addCustomQuestions([q]);
                          onSelectForFlashcard(q.id);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Make 1-Click FlashCard"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Card</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctAnswer;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2.5 transition-all ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                              Correct ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Collapsible Explanation */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleExplanation(q.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Detailed Solution' : 'View Detailed Solution & Concept'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300 leading-relaxed">
                        <div className="font-bold text-white flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Correct Answer: Option ({String.fromCharCode(65 + q.correctAnswer)}) -{' '}
                            {q.options[q.correctAnswer]}
                          </span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-line">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
