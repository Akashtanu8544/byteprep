import React, { useState } from 'react';
import { X, Sparkles, Download, Clock, BookOpen, AlertCircle, Check, Smartphone, CheckSquare, Square, FileCode } from 'lucide-react';
import { Question } from '../../types';
import { HtmlQuizService } from '../../services/htmlQuizService';
import { StorageService } from '../../services/storageService';

interface HtmlQuizMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: Question[];
}

export const HtmlQuizMakerModal: React.FC<HtmlQuizMakerModalProps> = ({
  isOpen,
  onClose,
  allQuestions,
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>(allQuestions.slice(0, 10));
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [subject, setSubject] = useState<string>('Computer Science');
  const [fileName, setFileName] = useState<string>('computer_science_interactive_quiz');
  const [playStoreUrl, setPlayStoreUrl] = useState<string>(
    StorageService.getSettings().appUrl || 'https://play.google.com/store/apps/details?id=com.byteprep'
  );
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Filter list of questions for selecting
  const filtered = allQuestions.filter(q => {
    const qText = q.question.toLowerCase();
    const qSub = (q.subject || '').toLowerCase();
    const qTopic = (q.topic || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return qText.includes(query) || qSub.includes(query) || qTopic.includes(query);
  });

  const toggleSelect = (q: Question) => {
    if (selectedQuestions.some(item => item.id === q.id)) {
      setSelectedQuestions(selectedQuestions.filter(item => item.id !== q.id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  const selectAll = () => {
    setSelectedQuestions(filtered);
  };

  const selectNone = () => {
    setSelectedQuestions([]);
  };

  const handleDownload = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least 1 question.');
      return;
    }

    const htmlContent = HtmlQuizService.generateHtmlQuiz(
      selectedQuestions,
      subject,
      timerSeconds,
      playStoreUrl
    );

    // Compute sanitized filename
    let cleanName = (fileName.trim() || `${subject.toLowerCase().replace(/\s+/g, '_')}_interactive_quiz`)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!cleanName.endsWith('.html')) {
      cleanName += '.html';
    }

    // Create a blob and trigger browser download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', cleanName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsGenerated(true);
    setTimeout(() => setIsGenerated(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                <span>HTML Interactive Quiz Maker</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
                  Mobile + Web Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Generates a single-file interactive mock test with score history & Play Store auto-redirects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Details */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Subject Header
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={e => {
                  setSubject(e.target.value);
                  // update default filename if it was default
                  const currentDefault = `${subject.toLowerCase().replace(/\s+/g, '_')}_interactive_quiz`;
                  if (!fileName || fileName === currentDefault) {
                    setFileName(`${e.target.value.toLowerCase().replace(/\s+/g, '_')}_interactive_quiz`);
                  }
                }}
                placeholder="Computer Science"
                className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
              />
              <BookOpen className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Download File Name
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="file_name"
                className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl pl-3 py-2 pr-12 text-xs text-white outline-none focus:border-sky-500 font-mono font-bold"
              />
              <span className="absolute right-2 text-[10px] text-sky-400 font-mono font-bold pointer-events-none bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                .html
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Timer Per Question
            </label>
            <div className="relative">
              <select
                value={timerSeconds}
                onChange={e => setTimerSeconds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold cursor-pointer appearance-none"
              >
                <option value={10}>10 Seconds (Speedrun)</option>
                <option value={15}>15 Seconds</option>
                <option value={20}>20 Seconds</option>
                <option value={30}>30 Seconds (Recommended)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (Detailed)</option>
              </select>
              <Clock className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              5s Redirect URL
            </label>
            <input
              type="text"
              value={playStoreUrl}
              onChange={e => setPlayStoreUrl(e.target.value)}
              placeholder="Google Play Store Link"
              className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500 font-bold"
            />
          </div>
        </div>

        {/* Question Selector List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-white font-bold text-xs">
                Select Questions ({selectedQuestions.length} Selected)
              </h4>
              <p className="text-[10px] text-slate-500">
                Selected questions will be bundled into the compiled single-file HTML applet
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-extrabold px-2 py-1 rounded-lg"
              >
                Select All ({filtered.length})
              </button>
              <button
                onClick={selectNone}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-extrabold px-2 py-1 rounded-lg"
              >
                Clear Selected
              </button>
            </div>
          </div>

          {/* Search bar inside */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter list by subject, topic or statement..."
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-500"
          />

          <div className="space-y-2">
            {filtered.map((q, idx) => {
              const isChecked = selectedQuestions.some(item => item.id === q.id);
              return (
                <div
                  key={q.id || idx}
                  onClick={() => toggleSelect(q)}
                  className={`p-3 border rounded-2xl flex items-start gap-3 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-sky-500/10 border-sky-500/40 hover:border-sky-500/50'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 hover:bg-slate-950/60'
                  }`}
                >
                  <div className="mt-0.5 text-sky-400">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 fill-sky-500/10" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-white leading-relaxed select-none">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-500">
                      <span className="px-1.5 py-0.2 bg-slate-800 rounded uppercase">
                        {q.subject}
                      </span>
                      <span>•</span>
                      <span>{q.topic}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Interactive scoreboard stores user mock score history in localStorage.</span>
          </div>

          <button
            onClick={handleDownload}
            disabled={selectedQuestions.length === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs cursor-pointer shadow-lg transition-all ${
              selectedQuestions.length > 0
                ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 shadow-sky-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isGenerated ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Quiz Generated Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>Compile & Download Interactive HTML</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
