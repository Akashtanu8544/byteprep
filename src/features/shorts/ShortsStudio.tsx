import React, { useState, useEffect } from 'react';
import { QuestionLoader } from '../../services/questionLoader';
import { StorageService } from '../../services/storageService';
import { NormalizedQuestion, ShortConfig, QueueItem } from '../../types';
import { SHORTS_THEMES } from './themes';
import { HOOK_TEMPLATES, getRandomHook } from './hooks';
import { ShortsPreview } from './ShortsPreview';
import { ThemePreviewCard } from './ThemePreviewCard';
import { ViralCaptionsCard } from './ViralCaptionsCard';
import { ThumbnailGenerator } from './ThumbnailGenerator';
import { ShortsQueue } from './ShortsQueue';
import { exportShortVideo } from './videoRenderer';
import { PollPostMaker } from '../polls/PollPostMaker';
import { FlashCardMaker } from '../flashcards/FlashCardMaker';
import {
  Video,
  Sparkles,
  Shuffle,
  Layers,
  Clock,
  Palette,
  MessageSquare,
  ListPlus,
  History,
  Download,
  ArrowLeft,
  CheckCircle2,
  Stars,
  Terminal,
  Share2,
  FileImage,
} from 'lucide-react';

interface ShortsStudioProps {
  onBack: () => void;
  preselectedQuestionId?: string | null;
}

export const ShortsStudio: React.FC<ShortsStudioProps> = ({ onBack, preselectedQuestionId }) => {
  const allSubjects = ['All', ...QuestionLoader.getAllSubjects()];
  const allTopics = ['All', ...QuestionLoader.getAllTopics()];
  const allMocks = ['All', ...QuestionLoader.getAllMocks()];

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedMock, setSelectedMock] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('mixed');

  const [questionList, setQuestionList] = useState<NormalizedQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion | null>(null);

  const [timerSeconds, setTimerSeconds] = useState<number>(10);
  const [hookText, setHookText] = useState<string>(HOOK_TEMPLATES[0]);
  const [themeId, setThemeId] = useState<string>('byteprep-dark');
  const [backgroundStyle, setBackgroundStyle] = useState<'auto' | 'stars' | 'matrix' | 'sql' | 'network' | 'os'>('auto');

  // Video Export States
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingProgress, setRenderingProgress] = useState<number>(0);
  const [renderingStage, setRenderingStage] = useState<string>('');
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  // Queue & Bulk Generation
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [bulkCount, setBulkCount] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'video' | 'poll' | 'flashcard' | 'history'>('video');

  useEffect(() => {
    const questions = QuestionLoader.getAllQuestions();
    setQuestionList(questions);

    if (preselectedQuestionId) {
      const q = QuestionLoader.getQuestionById(preselectedQuestionId);
      if (q) {
        setCurrentQuestion(q);
        return;
      }
    }

    if (questions.length > 0) {
      setCurrentQuestion(questions[0]);
    }
  }, [preselectedQuestionId]);

  // Handle Filter Change
  useEffect(() => {
    let pool = QuestionLoader.getAllQuestions();
    if (selectedSubject !== 'All') {
      pool = pool.filter(q => q.subject.toLowerCase() === selectedSubject.toLowerCase());
    }
    if (selectedTopic !== 'All') {
      pool = pool.filter(q => q.topic.toLowerCase() === selectedTopic.toLowerCase());
    }
    if (selectedMock !== 'All') {
      pool = pool.filter(q => q.sourceFile.toLowerCase() === selectedMock.toLowerCase());
    }
    if (selectedDifficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === selectedDifficulty);
    }

    setQuestionList(pool);
    if (pool.length > 0) {
      setCurrentQuestion(pool[0]);
    }
  }, [selectedSubject, selectedTopic, selectedMock, selectedDifficulty]);

  const handleRandomQuestion = () => {
    const q = QuestionLoader.getRandomQuestion({
      subject: selectedSubject,
      topic: selectedTopic,
      difficulty: selectedDifficulty as any,
      mockId: selectedMock,
    });
    setCurrentQuestion(q);
  };

  const currentConfig: ShortConfig = {
    question: currentQuestion || {
      id: 'placeholder',
      question: 'Which protocol is connection-oriented?',
      options: ['UDP', 'TCP', 'IP', 'ARP'],
      correctAnswer: 1,
      explanation: 'TCP provides reliable connection-oriented delivery.',
      subject: 'Computer Networks',
      topic: 'Transport Protocols',
      difficulty: 'easy',
      exam: 'TGT CS',
      sourceFile: 'cn.json',
    },
    timerSeconds,
    hookText,
    themeId: themeId as any,
    backgroundStyle,
    includeAudio: true,
    ctaEnabled: true,
    appUrl: StorageService.getSettings().appUrl,
  };

  const handleRenderSingleVideo = () => {
    if (!currentQuestion) return;
    setIsRendering(true);
    setRenderingProgress(0);
    setRenderingStage('Initializing canvas...');

    exportShortVideo(currentConfig, {
      onProgress: (progress, stage) => {
        setRenderingProgress(progress);
        setRenderingStage(stage);
      },
      onComplete: (blob, videoUrl) => {
        setIsRendering(false);
        setRenderedBlob(blob);
        setRenderedVideoUrl(videoUrl);
        StorageService.recordShortGenerated(currentQuestion.id, hookText, themeId);
      },
      onError: err => {
        setIsRendering(false);
        alert(`Render Error: ${err}`);
      },
    });
  };

  const handleDownloadVideo = () => {
    if (!renderedBlob || !currentQuestion) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(renderedBlob);
    link.download = `BytePrepCS_10SecondChallenge_${currentQuestion.id}.webm`;
    link.click();
    StorageService.recordShortDownloaded(currentQuestion.id);
  };

  const handleGenerateQueue = () => {
    if (questionList.length === 0) return;

    const count = Math.min(bulkCount, questionList.length);
    const selectedQuestions = [...questionList].sort(() => 0.5 - Math.random()).slice(0, count);

    const newItems: QueueItem[] = selectedQuestions.map((q, idx) => ({
      id: `queue_${q.id}_${Date.now()}_${idx}`,
      question: q,
      config: {
        question: q,
        timerSeconds,
        hookText: getRandomHook(),
        themeId: themeId as any,
        backgroundStyle,
        includeAudio: true,
        ctaEnabled: true,
        appUrl: StorageService.getSettings().appUrl,
      },
      status: 'pending',
      progress: 0,
    }));

    setQueue(prev => [...prev, ...newItems]);
  };

  const historyRecords = StorageService.getShortsRecords();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🎬 SHORTS STUDIO</span>
                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-full">
                  9:16 Creator
                </span>
              </h1>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Turn BytePrep CS MCQs into high-converting Instagram Reels & YouTube Shorts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Shorts Video</span>
          </button>
          <button
            onClick={() => setActiveTab('poll')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'poll'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Poll / Quiz Post</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flashcard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileImage className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click FlashCard</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyRecords.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'poll' && currentQuestion ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs">
              <span className="text-slate-400">Selected Question: </span>
              <span className="text-white font-bold">{currentQuestion.question}</span>
            </div>
            <button
              onClick={handleRandomQuestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold shrink-0 ml-3"
            >
              <Shuffle className="w-3 h-3" />
              <span>Next Q</span>
            </button>
          </div>
          <PollPostMaker question={currentQuestion} />
        </div>
      ) : activeTab === 'flashcard' && currentQuestion ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs">
              <span className="text-slate-400">Selected Question: </span>
              <span className="text-white font-bold">{currentQuestion.question}</span>
            </div>
            <button
              onClick={handleRandomQuestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold shrink-0 ml-3"
            >
              <Shuffle className="w-3 h-3" />
              <span>Next Q</span>
            </button>
          </div>
          <FlashCardMaker question={currentQuestion} />
        </div>
      ) : activeTab === 'history' ? (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            <span>Generated Shorts History</span>
          </h2>
          {historyRecords.length === 0 ? (
            <p className="text-slate-400 text-sm italic">No shorts generated yet.</p>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((rec, idx) => {
                const q = QuestionLoader.getQuestionById(rec.questionId);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">{q?.question || rec.questionId}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="text-sky-400">{q?.subject}</span>
                        <span>•</span>
                        <span>Hook: {rec.template}</span>
                        <span>•</span>
                        <span>{new Date(rec.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {rec.downloaded && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Downloaded</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Controls Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Question Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Select Question Source</span>
                </h3>
                <button
                  onClick={handleRandomQuestion}
                  className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Random Question</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {allSubjects.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Topic
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={e => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {allTopics.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mock File
                  </label>
                  <select
                    value={selectedMock}
                    onChange={e => setSelectedMock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {allMocks.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="mixed">Mixed Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pick Specific Question ({questionList.length} Available)
                </label>
                <select
                  value={currentQuestion?.id || ''}
                  onChange={e => {
                    const q = questionList.find(item => item.id === e.target.value);
                    if (q) setCurrentQuestion(q);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer truncate"
                >
                  {questionList.map(q => (
                    <option key={q.id} value={q.id}>
                      [{q.subject}] {q.question.substring(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Customization (Hook, Theme, Timer) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                <span>Short Customization</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Content Hook Template
                </label>
                <select
                  value={hookText}
                  onChange={e => setHookText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-sky-500 cursor-pointer"
                >
                  {HOOK_TEMPLATES.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Theme Previews */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select Visual Theme (Live 9:16 Previews)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(SHORTS_THEMES).map(t => (
                    <ThemePreviewCard
                      key={t.id}
                      theme={t}
                      isSelected={themeId === t.id}
                      onSelect={() => setThemeId(t.id)}
                      config={currentConfig}
                    />
                  ))}
                </div>
              </div>

              {/* Live Background Animation Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stars className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Animated Background</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'stars', name: '✨ Falling Stars', desc: 'Glowing Meteors' },
                    { id: 'matrix', name: '💻 Matrix Code', desc: 'Digital Green Rain' },
                    { id: 'sql', name: '🗄️ SQL Queries', desc: 'Database Streams' },
                    { id: 'network', name: '🌐 Network Nodes', desc: 'Packet Routing' },
                    { id: 'os', name: '⚙️ CPU & OS', desc: 'Process Scheduling' },
                    { id: 'auto', name: '⚡ Subject Auto', desc: 'Auto by Topic' },
                  ].map(b => (
                    <button
                      key={b.id}
                      onClick={() => setBackgroundStyle(b.id as any)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        backgroundStyle === b.id
                          ? 'border-sky-400 bg-sky-500/10 text-white font-bold shadow-md shadow-sky-500/10'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="block truncate font-bold text-slate-200">{b.name}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Timer Duration
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 15, 20, 30].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setTimerSeconds(sec)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        timerSeconds === sec
                          ? 'border-sky-400 bg-sky-500 text-slate-950 shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Auto Short Generator Queue Builder */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>⚡ Auto Short Generator</span>
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Bulk generate up to 50 shorts in sequential batch queue
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Number of videos:</span>
                {[1, 5, 10, 20, 50].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setBulkCount(cnt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bulkCount === cnt
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}

                <button
                  onClick={handleGenerateQueue}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>GENERATE QUEUE</span>
                </button>
              </div>
            </div>

            {/* Queue Component */}
            <ShortsQueue queue={queue} setQueue={setQueue} />
          </div>

          {/* Right Preview Column */}
          <div className="lg:col-span-5 space-y-6">
            <ShortsPreview
              config={currentConfig}
              onRenderVideo={handleRenderSingleVideo}
              isRendering={isRendering}
              renderingProgress={renderingProgress}
              renderingStage={renderingStage}
            />

            {renderedVideoUrl && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Video Ready for Download!</span>
                </div>
                <button
                  onClick={handleDownloadVideo}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD VIDEO (.WEBM)</span>
                </button>
              </div>
            )}

            {currentQuestion && (
              <ViralCaptionsCard
                question={currentQuestion}
                hookText={hookText}
              />
            )}

            {currentQuestion && (
              <ThumbnailGenerator
                question={currentQuestion}
                hookText={hookText}
                themeId={themeId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
