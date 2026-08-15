import React, { useState, useEffect } from 'react';
import { ContentIssueReport, NormalizedQuestion } from '../../types';
import { IndexedDbService } from '../../services/indexedDbService';
import { QuestionLoader } from '../../services/questionLoader';
import { Flag, CheckCircle2, Trash2, Edit3, AlertCircle } from 'lucide-react';

interface IssueQueueViewProps {
  onEditQuestion: (question: NormalizedQuestion) => void;
}

export const IssueQueueView: React.FC<IssueQueueViewProps> = ({ onEditQuestion }) => {
  const [issues, setIssues] = useState<ContentIssueReport[]>([]);

  const loadIssues = async () => {
    const list = await IndexedDbService.getAllIssues();
    list.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    setIssues(list);
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleResolve = async (issue: ContentIssueReport) => {
    const updated = { ...issue, resolved: true, resolvedAt: new Date().toISOString() };
    await IndexedDbService.saveIssue(updated);
    setIssues(prev => prev.map(i => (i.id === issue.id ? updated : i)));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span className="text-rose-400 font-black uppercase">Quality Control</span>
          <span>•</span>
          <span>Admin Moderation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Reported Questions & Quality Queue
        </h1>
      </div>

      {issues.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Question Issues Resolved!</h3>
          <p className="text-xs text-slate-400">
            No active reports in the quality review queue. All {QuestionLoader.getAllQuestions().length} questions verified.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => {
            const question = QuestionLoader.getQuestionById(issue.questionId);
            return (
              <div
                key={issue.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 ${
                  issue.resolved
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : 'bg-slate-900 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-black uppercase">
                      {issue.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {issue.questionId}</span>
                    <span className="text-[11px] text-slate-500">
                      Reported: {new Date(issue.reportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {!issue.resolved ? (
                    <button
                      onClick={() => handleResolve(issue)}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-500/30"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">✓ Resolved</span>
                  )}
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-400">Moderator Note:</span>
                  <p className="text-slate-200">{issue.comment}</p>
                </div>

                {question && (
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400 line-clamp-1 flex-1 pr-4">
                      "{question.question}"
                    </p>
                    <button
                      onClick={() => onEditQuestion(question)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shrink-0 shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Question</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
