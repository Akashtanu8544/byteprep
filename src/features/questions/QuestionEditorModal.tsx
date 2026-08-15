import React, { useState } from 'react';
import { NormalizedQuestion, Difficulty } from '../../types';
import { QuestionLoader } from '../../services/questionLoader';
import { AiContentEngine } from '../../services/aiContentEngine';
import { Edit3, Check, X, Sparkles, AlertCircle, Save } from 'lucide-react';

interface QuestionEditorModalProps {
  question: NormalizedQuestion;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: NormalizedQuestion) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  question,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [edited, setEdited] = useState<NormalizedQuestion>({ ...question });
  const [qualityScore, setQualityScore] = useState<number>(100);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleValidate = () => {
    const report = AiContentEngine.validateQuestionQuality(edited);
    setQualityScore(report.score);
    setWarnings(report.warnings);
  };

  const handleSave = () => {
    QuestionLoader.updateQuestion(edited);
    setSaveToast(true);
    onSaved(edited);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...edited.options];
    newOpts[idx] = val;
    setEdited({ ...edited, options: newOpts });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Admin Question Editor</h2>
              <p className="text-xs text-slate-400">ID: {edited.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Fields */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          {/* Question Text */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Question Statement</label>
            <textarea
              rows={3}
              value={edited.question}
              onChange={e => setEdited({ ...edited, question: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-sky-500"
            />
          </div>

          {/* 4 Options & Correct Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              Options (Select Radio for Correct Answer):
            </label>
            <div className="space-y-2">
              {edited.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswerOption"
                    checked={edited.correctAnswer === idx}
                    onChange={() => setEdited({ ...edited, correctAnswer: idx })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <span className="w-6 text-xs font-black text-slate-400">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Detailed Technical Explanation</label>
            <textarea
              rows={4}
              value={edited.explanation}
              onChange={e => setEdited({ ...edited, explanation: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 font-medium leading-relaxed"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Subject</label>
              <input
                type="text"
                value={edited.subject}
                onChange={e => setEdited({ ...edited, subject: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Topic</label>
              <input
                type="text"
                value={edited.topic}
                onChange={e => setEdited({ ...edited, topic: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Target Exam</label>
              <input
                type="text"
                value={edited.exam}
                onChange={e => setEdited({ ...edited, exam: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Difficulty</label>
              <select
                value={edited.difficulty}
                onChange={e => setEdited({ ...edited, difficulty: e.target.value as Difficulty })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleValidate}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Quality Check</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              {saveToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
