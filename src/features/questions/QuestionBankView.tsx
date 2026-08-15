import React, { useState, useRef } from 'react';
import { NormalizedQuestion } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { QuestionEditorModal } from './QuestionEditorModal';
import { IssueReportModal } from '../issues/IssueReportModal';
import {
  Upload,
  FileCode,
  Download,
  Plus,
  Trash2,
  Play,
  Video,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Code2,
  Copy,
  Check,
  BookOpen,
  Share2,
  Layers,
  Edit3,
  Flag,
  Zap,
} from 'lucide-react';

interface QuestionBankViewProps {
  onSelectForContentPack?: (question: NormalizedQuestion) => void;
  onSelectForStudio: (questionId: string) => void;
  onSelectForPlay: (question: NormalizedQuestion) => void;
  onSelectForPoll?: (questionId: string) => void;
  onSelectForFlashcard?: (questionId: string) => void;
  onOpenAiQuiz?: () => void;
}

const SAMPLE_JSON_TEMPLATE = [
  {
    "question": "Which of the following layers of the OSI model is responsible for end-to-end communication?",
    "options": [
      "Network Layer",
      "Transport Layer",
      "Data Link Layer",
      "Session Layer"
    ],
    "correctAnswer": 1,
    "explanation": "The Transport layer (Layer 4) provides transparent transfer of data between end users, providing reliable end-to-end data communication services.",
    "subject": "Computer Networks",
    "topic": "OSI Reference Model",
    "difficulty": "easy",
    "exam": "DSSSB TGT CS"
  },
  {
    "question": "What is the worst-case time complexity of QuickSort algorithm?",
    "options": [
      "O(n log n)",
      "O(n)",
      "O(n²)",
      "O(log n)"
    ],
    "correctAnswer": 2,
    "explanation": "QuickSort worst case happens when the pivot chosen is always the smallest or largest element, leading to O(n²) comparisons.",
    "subject": "Data Structures",
    "topic": "Sorting Algorithms",
    "difficulty": "medium",
    "exam": "KVS PGT CS"
  }
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  onSelectForContentPack,
  onSelectForStudio,
  onSelectForPlay,
  onSelectForPoll,
  onSelectForFlashcard,
  onOpenAiQuiz,
}) => {
  const [questions, setQuestions] = useState<NormalizedQuestion[]>(QuestionLoader.getAllQuestions());
  const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'paste'>('browse');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyCustom, setOnlyCustom] = useState<boolean>(false);
  const [mergeStrategy, setMergeStrategy] = useState<'ADD' | 'SKIP_DUPLICATES' | 'REPLACE'>('ADD');

  // Modals state
  const [editingQuestion, setEditingQuestion] = useState<NormalizedQuestion | null>(null);
  const [reportingQuestion, setReportingQuestion] = useState<NormalizedQuestion | null>(null);

  // Paste JSON State
  const [jsonText, setJsonText] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSample, setCopiedSample] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshQuestions = () => {
    setQuestions(QuestionLoader.getAllQuestions());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const data = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
        const result = QuestionLoader.addCustomQuestions(data, file.name, mergeStrategy);

        if (result.successCount > 0) {
          setUploadStatus({
            success: true,
            message: `Successfully imported ${result.successCount} questions from "${file.name}"! (${result.duplicateCount} duplicates handled)`,
          });
          refreshQuestions();
          setActiveTab('browse');
        } else {
          setUploadStatus({
            success: false,
            message: `Failed to import questions. Errors: ${result.errors.join(', ')}`,
          });
        }
      } catch (err: any) {
        setUploadStatus({
          success: false,
          message: `Invalid JSON syntax: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSubmit = () => {
    if (!jsonText.trim()) return;

    try {
      const parsed = JSON.parse(jsonText);
      const data = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
      const result = QuestionLoader.addCustomQuestions(data, 'pasted_custom_batch.json', mergeStrategy);

      if (result.successCount > 0) {
        setUploadStatus({
          success: true,
          message: `Successfully added ${result.successCount} questions to your collection!`,
        });
        setJsonText('');
        refreshQuestions();
        setActiveTab('browse');
      } else {
        setUploadStatus({
          success: false,
          message: `Could not parse valid questions. Errors: ${result.errors.join(', ')}`,
        });
      }
    } catch (err: any) {
      setUploadStatus({
        success: false,
        message: `Invalid JSON: ${err.message}`,
      });
    }
  };

  const handleDeleteCustom = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom question?')) {
      QuestionLoader.removeCustomQuestion(id);
      refreshQuestions();
    }
  };

  const handleExportJson = () => {
    const exportData = questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      exam: q.exam,
      year: q.year,
      timesUsed: q.timesUsed,
      posted: q.posted,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `byteprep_questions_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const subjects = ['All', ...QuestionLoader.getAllSubjects()];

  const filteredQuestions = questions.filter(q => {
    const matchesSubject = filterSubject === 'All' || q.subject.toLowerCase() === filterSubject.toLowerCase();
    const matchesCustom = !onlyCustom || q.sourceFile.includes('custom') || q.sourceFile.includes('upload');
    const matchesSearch =
      searchQuery.trim() === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.exam.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Unused' && (!q.timesUsed || q.timesUsed === 0)) ||
      (filterStatus === 'Posted' && q.posted) ||
      (filterStatus === 'Ready' && q.contentStatus === 'READY');

    return matchesSubject && matchesCustom && matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-sky-400 uppercase font-black">Knowledge Base</span>
            <span>•</span>
            <span>{questions.length} Verified CS Questions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Question Bank & Admin Studio
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAiQuiz && (
            <button
              onClick={onOpenAiQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Quiz Generator</span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'browse'
              ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Browse Questions ({questions.length})
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'upload'
              ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload JSON</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'paste'
              ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Paste JSON</span>
        </button>
      </div>

      {/* Status Alert Banner */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-medium ${
            uploadStatus.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {uploadStatus.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <div className="flex-1">{uploadStatus.message}</div>
          <button onClick={() => setUploadStatus(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* BROWSE TAB */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by keyword, topic, subject, or explanation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-sky-500 pl-10"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
              >
                {subjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="All">All Questions</option>
                <option value="Unused">Unused / Fresh</option>
                <option value="Posted">Posted on Socials</option>
                <option value="Ready">Ready in Queue</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyCustom}
                  onChange={e => setOnlyCustom(e.target.checked)}
                  className="w-3.5 h-3.5 accent-sky-500"
                />
                <span>Custom Uploads Only</span>
              </label>
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">No questions match your filter.</p>
                <p className="text-xs">Try clearing filters or search query.</p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isCustom = q.sourceFile.includes('custom') || q.sourceFile.includes('upload');
                const isUnused = !q.timesUsed || q.timesUsed === 0;

                return (
                  <div
                    key={q.id || idx}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 transition-all shadow-lg space-y-4"
                  >
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md text-[10px] font-black uppercase">
                          {q.subject}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                          {q.topic}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-bold">
                          {q.exam}
                        </span>

                        {isUnused ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-black">
                            ⚡ FRESH / UNUSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-bold">
                            Used {q.timesUsed}x {q.posted && '• POSTED'}
                          </span>
                        )}
                      </div>

                      {/* Admin Quick Tools */}
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-1.5 hover:text-sky-400 transition-colors cursor-pointer"
                          title="Admin Edit Question"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReportingQuestion(q)}
                          className="p-1.5 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Report Question Issue"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        {isCustom && (
                          <button
                            onClick={() => handleDeleteCustom(q.id)}
                            className="p-1.5 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Custom Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Statement */}
                    <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {q.question}
                    </h3>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswer;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-slate-950 border-slate-800/80 text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                        <span className="font-bold text-amber-400">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="text-[11px] text-slate-500 font-mono">
                        ID: {q.id.slice(0, 24)}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 1-to-Many Content Pack Button */}
                        {onSelectForContentPack && (
                          <button
                            onClick={() => onSelectForContentPack(q)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>Generate Content Pack (1-to-Many)</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSelectForStudio(q.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Shorts Studio</span>
                        </button>

                        {onSelectForFlashcard && (
                          <button
                            onClick={() => onSelectForFlashcard(q.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Flashcard</span>
                          </button>
                        )}

                        {onSelectForPoll && (
                          <button
                            onClick={() => onSelectForPoll(q.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Telegram Poll</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSelectForPlay(q)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>10s Test</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-14 h-14 bg-sky-500/20 text-sky-400 rounded-3xl flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">Upload Question Dataset (.JSON)</h3>
            <p className="text-xs text-slate-400">
              Bulk import hundreds of Computer Science PYQ & MCQ questions into your Studio bank.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-3 text-left">
            <label className="text-xs font-bold text-slate-400">Merge Strategy</label>
            <select
              value={mergeStrategy}
              onChange={e => setMergeStrategy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ADD">Add All (Rename Duplicate IDs)</option>
              <option value="SKIP_DUPLICATES">Skip Existing Duplicate Questions</option>
              <option value="REPLACE">Overwrite Existing Matching Questions</option>
            </select>
          </div>

          <div className="max-w-md mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-3xl bg-slate-950/60 cursor-pointer transition-all space-y-2"
            >
              <FileJson className="w-8 h-8 text-sky-400" />
              <span className="text-xs font-black text-white">Click to Browse JSON File</span>
              <span className="text-[11px] text-slate-500 font-semibold">Supports standard BytePrep schema</span>
            </label>
          </div>
        </div>
      )}

      {/* PASTE TAB */}
      {activeTab === 'paste' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Paste JSON Payload</h3>
              <p className="text-xs text-slate-400">
                Directly paste JSON arrays from external scraping or AI generation tools.
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2));
                setCopiedSample(true);
                setTimeout(() => setCopiedSample(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-700 transition-all"
            >
              {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSample ? 'Copied Template!' : 'Copy Sample JSON'}</span>
            </button>
          </div>

          <textarea
            rows={12}
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            placeholder="Paste valid JSON array here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none focus:border-sky-500"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setJsonText('')}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={handlePasteSubmit}
              disabled={!jsonText.trim()}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              Import Pasted Questions
            </button>
          </div>
        </div>
      )}

      {/* Admin Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => {
            refreshQuestions();
            setEditingQuestion(null);
          }}
        />
      )}

      {/* Issue Report Modal */}
      {reportingQuestion && (
        <IssueReportModal
          question={reportingQuestion}
          isOpen={true}
          onClose={() => setReportingQuestion(null)}
        />
      )}
    </div>
  );
};
