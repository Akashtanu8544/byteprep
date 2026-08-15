import React, { useState } from 'react';
import { NormalizedQuestion, ContentIssueReport } from '../../types';
import { IndexedDbService } from '../../services/indexedDbService';
import { Flag, Check, X, AlertTriangle } from 'lucide-react';

interface IssueReportModalProps {
  question: NormalizedQuestion;
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
}

export const IssueReportModal: React.FC<IssueReportModalProps> = ({
  question,
  isOpen,
  onClose,
  onReported,
}) => {
  const [type, setType] = useState<ContentIssueReport['type']>('wrong_answer');
  const [comment, setComment] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const issue: ContentIssueReport = {
      id: `issue_${Date.now()}_${question.id}`,
      questionId: question.id,
      type,
      comment: comment.trim() || 'No additional comment provided.',
      reportedAt: new Date().toISOString(),
      resolved: false,
    };

    await IndexedDbService.saveIssue(issue);
    setIsSuccess(true);
    if (onReported) onReported();
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Flag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-white">Report Question Issue</h3>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="font-bold text-slate-400">Target Question:</span>
            <p className="text-white font-semibold line-clamp-2">{question.question}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Issue Category</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="wrong_answer">Incorrect Answer Key Option</option>
              <option value="wrong_explanation">Incorrect or Ambiguous Explanation</option>
              <option value="typo">Typo / Syntax Formatting Glitch</option>
              <option value="duplicate">Duplicate Question in Bank</option>
              <option value="ambiguous">Question is Ambiguous / Multiple Correct</option>
              <option value="wrong_exam">Wrong Subject or Exam Classification</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Explanation / Correction Notes</label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="e.g. Correct answer should be option C because in 3NF transitive dependency is removed..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
          >
            {isSuccess ? <Check className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
            <span>{isSuccess ? 'Reported!' : 'Submit Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
