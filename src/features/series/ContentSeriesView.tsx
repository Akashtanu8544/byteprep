import React, { useState, useEffect } from 'react';
import { ContentSeries, NormalizedQuestion } from '../../types';
import { IndexedDbService } from '../../services/indexedDbService';
import { QuestionLoader } from '../../services/questionLoader';
import { TemplateService } from '../../services/templateService';
import { SHORTS_THEMES } from '../shorts/themes';
import {
  Layers,
  Plus,
  Play,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface ContentSeriesViewProps {
  onOpenContentPack: (question: NormalizedQuestion) => void;
}

export const ContentSeriesView: React.FC<ContentSeriesViewProps> = ({ onOpenContentPack }) => {
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [isCreatingModal, setIsCreatingModal] = useState<boolean>(false);
  const allQuestions = QuestionLoader.getAllQuestions();
  const subjects = QuestionLoader.getAllSubjects();
  const templates = TemplateService.getAllTemplates();

  // Create Form State
  const [name, setName] = useState<string>('30 Days of DBMS Mastery');
  const [description, setDescription] = useState<string>('Daily 10-second high-yield DBMS questions for DSSSB & KVS CS.');
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || 'Database Management Systems');
  const [totalPosts, setTotalPosts] = useState<number>(30);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('10s-challenge');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('dbms-sql');

  const loadSeries = async () => {
    const list = await IndexedDbService.getAllSeries();
    setSeriesList(list);
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleCreateSeries = async () => {
    // Select non-repeating questions for this subject
    const subjectQuestions = allQuestions.filter(
      q => q.subject.toLowerCase() === selectedSubject.toLowerCase()
    );
    const chosenQuestions = subjectQuestions.slice(0, totalPosts);

    const newSeries: ContentSeries = {
      id: `series_${Date.now()}`,
      name,
      description,
      subject: selectedSubject,
      totalPosts: chosenQuestions.length || totalPosts,
      currentDay: 1,
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'daily',
      templateId: selectedTemplateId,
      themeId: selectedThemeId,
      questionIds: chosenQuestions.map(q => q.id),
      active: true,
    };

    await IndexedDbService.saveSeries(newSeries);
    setSeriesList(prev => [newSeries, ...prev]);
    setIsCreatingModal(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this Content Series?')) {
      await IndexedDbService.deleteSeries(id);
      setSeriesList(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="text-sky-400 font-black uppercase">Content Architecture</span>
            <span>•</span>
            <span>Multi-Day Series Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Creator Content Series
          </h1>
        </div>

        <button
          onClick={() => setIsCreatingModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Series</span>
        </button>
      </div>

      {/* Series Cards */}
      {seriesList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Content Series Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Build high-converting series like "30 Days of DBMS", "100 DSSSB CS PYQs", or "10 Second CS Challenge" to build follower loyalty and daily watch habits.
          </p>
          <button
            onClick={() => setIsCreatingModal(true)}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
          >
            Create Your First Series
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map(s => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[10px] font-black uppercase">
                      {s.subject}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">
                      Day {s.currentDay} / {s.totalPosts}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{s.name}</h3>
                  <p className="text-xs text-slate-400">{s.description}</p>
                </div>

                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Series Completion</span>
                  <span>{Math.round((s.currentDay / s.totalPosts) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500"
                    style={{ width: `${(s.currentDay / s.totalPosts) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question list shortcut */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">
                  {s.questionIds.length} Linked Questions
                </span>

                {s.questionIds[0] && (
                  <button
                    onClick={() => {
                      const q = QuestionLoader.getQuestionById(s.questionIds[0]);
                      if (q) onOpenContentPack(q);
                    }}
                    className="flex items-center gap-1 text-xs font-black text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    <span>Generate Day {s.currentDay}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Series Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <h3 className="text-xl font-black text-white">Create New Creator Series</h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Series Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {subjects.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Total Days / Posts</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={totalPosts}
                    onChange={e => setTotalPosts(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Theme</label>
                  <select
                    value={selectedThemeId}
                    onChange={e => setSelectedThemeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {Object.values(SHORTS_THEMES).map(th => (
                      <option key={th.id} value={th.id}>
                        {th.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSeries}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Create Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
