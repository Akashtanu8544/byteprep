import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { Footer } from './components/Footer';
import { CreatorDashboard } from './features/dashboard/CreatorDashboard';
import { ContentPackGenerator } from './features/content-pack/ContentPackGenerator';
import { BatchGenerator } from './features/batch/BatchGenerator';
import { ContentQueueView } from './features/queue/ContentQueueView';
import { ContentSeriesView } from './features/series/ContentSeriesView';
import { CreatorAnalyticsView } from './features/analytics/CreatorAnalyticsView';
import { BrandKitModal } from './features/brand/BrandKitModal';
import { ChallengePlay } from './features/challenge/ChallengePlay';
import { ChallengeResult } from './features/challenge/ChallengeResult';
import { ShareResultModal } from './features/challenge/ShareResultModal';
import { ShortsStudio } from './features/shorts/ShortsStudio';
import { SmartQuizGenerator } from './features/ai-quiz/SmartQuizGenerator';
import { QuestionBankView } from './features/questions/QuestionBankView';
import { DatasetReport } from './features/stats/DatasetReport';
import { SettingsModal } from './features/settings/SettingsModal';
import { PollPostMaker } from './features/polls/PollPostMaker';
import { FlashCardMaker } from './features/flashcards/FlashCardMaker';
import { IssueQueueView } from './features/issues/IssueQueueView';
import { QuestionEditorModal } from './features/questions/QuestionEditorModal';
import { StoryGeneratorView } from './features/story/StoryGeneratorView';
import { CarouselGeneratorView } from './features/carousel/CarouselGeneratorView';
import { CodeChallengeView } from './features/code-challenge/CodeChallengeView';
import { CampaignManagerView } from './features/campaigns/CampaignManagerView';
import { ContentGapFinderView } from './features/gap-finder/ContentGapFinderView';
import { ConversionTrackingView } from './features/conversion/ConversionTrackingView';
import { ContentFactoryView } from './features/factory/ContentFactoryView';
import { BackupStudioModal } from './features/backup/BackupStudioModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { QuestionLoader } from './services/questionLoader';
import { StorageService } from './services/storageService';
import {
  NormalizedQuestion,
  PlayResult,
  ChallengeSettings,
  UserStats,
} from './types';
import { Shuffle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  // App Settings & User Stats
  const [settings, setSettings] = useState<ChallengeSettings>(StorageService.getSettings());
  const [stats, setStats] = useState<UserStats>(StorageService.getStats());

  // Active targets
  const [selectedPackQuestion, setSelectedPackQuestion] = useState<NormalizedQuestion | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<NormalizedQuestion | null>(null);
  const [playResult, setPlayResult] = useState<PlayResult | null>(null);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [preselectedStudioQId, setPreselectedStudioQId] = useState<string | null>(null);
  const [dedicatedToolQ, setDedicatedToolQ] = useState<NormalizedQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<NormalizedQuestion | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState<boolean>(false);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  useEffect(() => {
    setSettings(StorageService.getSettings());
    setStats(StorageService.getStats());
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentView('questions');
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsBrandKitOpen(false);
        setIsBackupOpen(false);
        setIsShortcutsOpen(false);
        setIsShareOpen(false);
        setEditingQuestion(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenContentPack = (question: NormalizedQuestion) => {
    setSelectedPackQuestion(question);
    setCurrentView('content-pack');
  };

  const handleStartRandomPlay = (subject?: string) => {
    const q = QuestionLoader.getRandomQuestion({
      subject,
      difficulty: settings.preferredDifficulty as any,
      excludeIds: stats.recentQuestionIds,
    });
    setActiveQuestion(q);
    setIsDailyChallenge(false);
    setCurrentView('play');
  };

  const handleStartDailyPlay = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const { question } = QuestionLoader.getDailyQuestion(todayStr);
    setActiveQuestion(question);
    setIsDailyChallenge(true);
    setCurrentView('play');
  };

  const handlePlayFinish = (result: PlayResult) => {
    setPlayResult(result);
    const updatedStats = StorageService.recordPlayResult(
      result.question.id,
      result.isCorrect,
      result.score,
      isDailyChallenge
    );
    setStats(updatedStats);
    setCurrentView('result');
  };

  const handleNextQuestion = () => {
    handleStartRandomPlay();
  };

  const handlePlayAgain = () => {
    if (activeQuestion) {
      setCurrentView('play');
    } else {
      handleStartRandomPlay();
    }
  };

  const handleCreateShortFromQuestion = (questionId?: string) => {
    setPreselectedStudioQId(questionId || activeQuestion?.id || null);
    setCurrentView('studio');
  };

  const handleOpenPollsForQuestion = (questionId?: string) => {
    const q = questionId ? QuestionLoader.getQuestionById(questionId) : (activeQuestion || QuestionLoader.getRandomQuestion());
    if (q) setDedicatedToolQ(q);
    setCurrentView('polls');
  };

  const handleOpenFlashcardsForQuestion = (questionId?: string) => {
    const q = questionId ? QuestionLoader.getQuestionById(questionId) : (activeQuestion || QuestionLoader.getRandomQuestion());
    if (q) setDedicatedToolQ(q);
    setCurrentView('flashcards');
  };

  const handlePickRandomToolQuestion = () => {
    const q = QuestionLoader.getRandomQuestion();
    setDedicatedToolQ(q);
  };

  const handleSelectCustomForPlay = (q: NormalizedQuestion) => {
    setActiveQuestion(q);
    setIsDailyChallenge(false);
    setCurrentView('play');
  };

  const handleSelectCustomForStudio = (questionId: string) => {
    setPreselectedStudioQId(questionId);
    setCurrentView('studio');
  };

  const handleNav = (view: any) => {
    if (view === 'play-select') {
      handleStartRandomPlay();
    } else if (view === 'polls') {
      handleOpenPollsForQuestion();
    } else if (view === 'flashcards') {
      handleOpenFlashcardsForQuestion();
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950">
      <Header
        currentView={currentView}
        onNavigate={handleNav}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBrandKit={() => setIsBrandKitOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <main className="flex-1">
        {/* Creator Dashboard */}
        {currentView === 'home' && (
          <CreatorDashboard
            onNavigate={handleNav}
            onOpenContentPack={handleOpenContentPack}
            onOpenShortsStudio={handleCreateShortFromQuestion}
            onOpenBrandKit={() => setIsBrandKitOpen(true)}
          />
        )}

        {/* 1-to-Many Content Pack Hub */}
        {currentView === 'content-pack' && selectedPackQuestion && (
          <ContentPackGenerator
            question={selectedPackQuestion}
            onOpenShortsStudio={handleCreateShortFromQuestion}
            onOpenFlashcardMaker={handleOpenFlashcardsForQuestion}
            onOpenPollMaker={handleOpenPollsForQuestion}
            onBack={() => setCurrentView('questions')}
            onSaveToQueue={() => setCurrentView('queue')}
          />
        )}

        {/* 1-Click Content Factory (Batch Generation) */}
        {currentView === 'factory' && (
          <ContentFactoryView onOpenSinglePack={handleOpenContentPack} />
        )}

        {/* 9:16 Story Generator */}
        {currentView === 'story' && (
          <StoryGeneratorView
            initialQuestion={selectedPackQuestion || QuestionLoader.getRandomQuestion()}
            onBack={() => setCurrentView('home')}
          />
        )}

        {/* 4:5 Instagram Carousel Generator */}
        {currentView === 'carousel' && (
          <CarouselGeneratorView
            initialQuestion={selectedPackQuestion || QuestionLoader.getRandomQuestion()}
            onBack={() => setCurrentView('home')}
          />
        )}

        {/* Code & Bug Challenge Studio */}
        {currentView === 'code-challenge' && (
          <CodeChallengeView onBack={() => setCurrentView('home')} />
        )}

        {/* Marketing Campaigns Manager */}
        {currentView === 'campaigns' && (
          <CampaignManagerView
            onBack={() => setCurrentView('home')}
            onOpenContentPack={handleOpenContentPack}
          />
        )}

        {/* Content Gap Finder */}
        {currentView === 'gap-finder' && (
          <ContentGapFinderView
            onBack={() => setCurrentView('home')}
            onOpenContentPack={handleOpenContentPack}
          />
        )}

        {/* Social Conversion & UTM ROI Dashboard */}
        {currentView === 'conversion' && (
          <ConversionTrackingView onBack={() => setCurrentView('home')} />
        )}

        {/* Batch Content Generator */}
        {currentView === 'batch' && (
          <BatchGenerator
            onOpenContentPack={handleOpenContentPack}
            onViewQueue={() => setCurrentView('queue')}
          />
        )}

        {/* Content Queue & Pipeline */}
        {currentView === 'queue' && (
          <ContentQueueView
            onOpenContentPack={handleOpenContentPack}
            onOpenBatchGenerator={() => setCurrentView('batch')}
          />
        )}

        {/* Content Series Builder */}
        {currentView === 'series' && (
          <ContentSeriesView onOpenContentPack={handleOpenContentPack} />
        )}

        {/* Performance Analytics & Winning Engine */}
        {currentView === 'analytics' && (
          <CreatorAnalyticsView
            onOpenContentPack={handleOpenContentPack}
            onGenerateMoreLikeThis={(subject, topic) => {
              const q = QuestionLoader.getRandomQuestion({ subject, topic });
              handleOpenContentPack(q);
            }}
          />
        )}

        {/* Quality Queue */}
        {currentView === 'issues' && (
          <IssueQueueView onEditQuestion={q => setEditingQuestion(q)} />
        )}

        {/* Question Bank */}
        {currentView === 'questions' && (
          <QuestionBankView
            onSelectForContentPack={handleOpenContentPack}
            onSelectForStudio={handleSelectCustomForStudio}
            onSelectForPlay={handleSelectCustomForPlay}
            onSelectForPoll={handleOpenPollsForQuestion}
            onSelectForFlashcard={handleOpenFlashcardsForQuestion}
            onOpenAiQuiz={() => setCurrentView('ai-quiz')}
          />
        )}

        {/* AI Quiz Generator */}
        {currentView === 'ai-quiz' && (
          <SmartQuizGenerator
            onSelectForPlay={handleSelectCustomForPlay}
            onSelectForStudio={handleSelectCustomForStudio}
            onSelectForPoll={handleOpenPollsForQuestion}
            onSelectForFlashcard={handleOpenFlashcardsForQuestion}
          />
        )}

        {/* 10s Timer Challenge Play */}
        {currentView === 'play' && activeQuestion && (
          <ChallengePlay
            question={activeQuestion}
            settings={settings}
            onFinish={handlePlayFinish}
          />
        )}

        {/* Challenge Result Screen */}
        {currentView === 'result' && playResult && (
          <ChallengeResult
            result={playResult}
            onNextQuestion={handleNextQuestion}
            onPlayAgain={handlePlayAgain}
            onCreateShort={() => handleCreateShortFromQuestion(playResult.question.id)}
            onShare={() => setIsShareOpen(true)}
          />
        )}

        {/* Shorts Studio (9:16 Canvas Recording) */}
        {currentView === 'studio' && (
          <ShortsStudio
            onBack={() => setCurrentView('home')}
            preselectedQuestionId={preselectedStudioQId}
          />
        )}

        {/* Telegram Poll Maker */}
        {currentView === 'polls' && (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Poll Post & Telegram Quiz Maker</h1>
                  <p className="text-xs text-slate-400">1-Click push native quiz polls to Telegram or copy for YouTube & Facebook</p>
                </div>
              </div>

              <button
                onClick={handlePickRandomToolQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Next Question</span>
              </button>
            </div>

            {dedicatedToolQ ? (
              <PollPostMaker question={dedicatedToolQ} />
            ) : (
              <div className="p-8 text-center text-slate-400">No question selected. Click "Next Question" above.</div>
            )}
          </div>
        )}

        {/* Flashcard Maker */}
        {currentView === 'flashcards' && (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('home')}
                  className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">1-Click Study FlashCard Maker</h1>
                  <p className="text-xs text-slate-400">Render and download 1080x1080 HD question and answer cards for Instagram & Telegram</p>
                </div>
              </div>

              <button
                onClick={handlePickRandomToolQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Next Question</span>
              </button>
            </div>

            {dedicatedToolQ ? (
              <FlashCardMaker question={dedicatedToolQ} />
            ) : (
              <div className="p-8 text-center text-slate-400">No question selected. Click "Next Question" above.</div>
            )}
          </div>
        )}

        {/* Dataset Report */}
        {currentView === 'report' && (
          <div className="py-6">
            <DatasetReport onClose={() => setCurrentView('home')} />
          </div>
        )}
      </main>

      {currentView !== 'studio' && <Footer appUrl={settings.appUrl} />}

      {/* Brand Kit Modal */}
      <BrandKitModal
        isOpen={isBrandKitOpen}
        onClose={() => setIsBrandKitOpen(false)}
      />

      {/* Backup & Restore Modal */}
      <BackupStudioModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onRestoreComplete={() => window.location.reload()}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={updated => setSettings(updated)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Admin Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => setEditingQuestion(null)}
        />
      )}

      {/* Share Modal */}
      {isShareOpen && playResult && (
        <ShareResultModal
          result={playResult}
          streak={stats.currentStreak}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
