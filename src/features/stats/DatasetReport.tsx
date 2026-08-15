import React from 'react';
import { QuestionLoader } from '../../services/questionLoader';
import { Database, Layers, CheckCircle, HelpCircle, FileText, X } from 'lucide-react';

interface DatasetReportProps {
  onClose: () => void;
}

export const DatasetReport: React.FC<DatasetReportProps> = ({ onClose }) => {
  const stats = QuestionLoader.getDatasetStats();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Question Database Report</h2>
            <p className="text-slate-400 text-xs">Authoritative BytePrep CS MCQ Metadata</p>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-sky-400 block">{stats.totalQuestions}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total MCQs</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-emerald-400 block">{stats.subjectsCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subjects</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-indigo-400 block">{stats.topicsCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topics</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-amber-400 block">{stats.mocksCount}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JSON Files</span>
          </div>
        </div>

        {/* Explanation Coverage */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
            <span>Explanation Coverage</span>
            <span className="text-sky-400">
              {stats.withExplanations} / {stats.totalQuestions} (
              {Math.round((stats.withExplanations / stats.totalQuestions) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full"
              style={{ width: `${(stats.withExplanations / stats.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Subjects Breakdown */}
        <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Questions By Subject
          </h3>

          <div className="space-y-2">
            {Object.entries(stats.subjects).map(([subject, count]) => (
              <div
                key={subject}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-200">{subject}</span>
                <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 font-bold rounded-lg border border-sky-500/20">
                  {count} MCQs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
