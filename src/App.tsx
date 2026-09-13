import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CreatorDashboard } from './features/dashboard/CreatorDashboard';
import { ShortsStudio } from './features/shorts/ShortsStudio';
import { AutoPosterHub } from './features/autopost/AutoPosterHub';
import { QuestionBankView } from './features/questions/QuestionBankView';
import { BrandKitModal } from './features/brand/BrandKitModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { QuestionEditorModal } from './features/questions/QuestionEditorModal';
import { ConnectedAccountsModal } from './features/autopost/ConnectedAccountsModal';
import { SocialPostMethodsModal } from './features/extension/SocialPostMethodsModal';
import { TelegramBotQuizModal } from './features/questions/TelegramBotQuizModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { StorageService } from './services/storageService';
import { QuestionLoader } from './services/questionLoader';
import { TelegramAutoPostService } from './services/telegramAutoPostService';
import { NormalizedQuestion, ChallengeSettings } from './types';
import { Video, BookOpen, Bot, Settings, Palette } from 'lucide-react';

export type AppView =
  | 'studio'
  | 'questions'
  | 'telegram'
  | 'brand'
  | 'settings'
  | 'accounts'
  | 'post-methods';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('studio');

  // App Settings
  const [settings, setSettings] = useState<ChallengeSettings>(StorageService.getSettings());

  // Active targets for Studio
  const [preselectedStudioQId, setPreselectedStudioQId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<NormalizedQuestion | null>(null);

  useEffect(() => {
    setSettings(StorageService.getSettings());
    // Start background auto-post scheduler check
    TelegramAutoPostService.initScheduler();
  }, []);

  const handleOpenStudio = (questionId?: string) => {
    setPreselectedStudioQId(questionId || null);
    setCurrentView('studio');
  };

  const allQuestions = QuestionLoader.getAllQuestions();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-rose-500 selection:text-white pb-14 sm:pb-0">
      <Header
        currentView={currentView}
        onNavigate={view => setCurrentView(view as AppView)}
        onOpenSettings={() => setCurrentView('settings')}
        onOpenBrandKit={() => setCurrentView('brand')}
        onOpenSocialLogin={() => setCurrentView('accounts')}
        onOpenExtensionModal={() => setCurrentView('post-methods')}
        onOpenTelegramModal={() => setCurrentView('telegram')}
        onOpenBackup={() => {}}
        onOpenShortcuts={() => {}}
      />

      <main className="flex-1">
        {/* Core Shorts Studio */}
        {currentView === 'studio' && (
          <ShortsStudio
            onBack={() => setCurrentView('questions')}
            preselectedQuestionId={preselectedStudioQId}
          />
        )}

        {/* Question Bank */}
        {currentView === 'questions' && (
          <QuestionBankView
            onSelectForContentPack={q => handleOpenStudio(q.id)}
            onSelectForStudio={qId => handleOpenStudio(qId)}
            onSelectForPlay={q => handleOpenStudio(q.id)}
            onSelectForPoll={qId => handleOpenStudio(qId)}
            onSelectForFlashcard={qId => handleOpenStudio(qId)}
            onOpenAiQuiz={() => handleOpenStudio()}
          />
        )}

        {/* Telegram Auto-Quiz Center (Full Page) */}
        {currentView === 'telegram' && (
          <TelegramBotQuizModal
            isOpen={true}
            isFullPage={true}
            onClose={() => setCurrentView('studio')}
            allQuestions={allQuestions}
          />
        )}

        {/* Brand Kit (Full Page) */}
        {currentView === 'brand' && (
          <BrandKitModal
            isOpen={true}
            isFullPage={true}
            onClose={() => setCurrentView('studio')}
          />
        )}

        {/* Settings (Full Page) */}
        {currentView === 'settings' && (
          <SettingsModal
            settings={settings}
            isFullPage={true}
            onSave={updated => setSettings(updated)}
            onClose={() => setCurrentView('studio')}
          />
        )}

        {/* Social Accounts (Full Page) */}
        {currentView === 'accounts' && (
          <ConnectedAccountsModal
            isOpen={true}
            isFullPage={true}
            onClose={() => setCurrentView('studio')}
            onAccountsUpdated={() => {}}
          />
        )}

        {/* Post Methods (Full Page) */}
        {currentView === 'post-methods' && (
          <SocialPostMethodsModal
            isOpen={true}
            isFullPage={true}
            onClose={() => setCurrentView('studio')}
          />
        )}
      </main>

      {currentView !== 'studio' && currentView !== 'telegram' && <Footer appUrl={settings.appUrl} />}

      {/* Mobile PWA Install Prompt Banner */}
      <PwaInstallPrompt />

      {/* Mobile Bottom Navigation Bar (PWA Thumb-friendly) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setCurrentView('studio')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'studio' ? 'text-rose-400 font-black' : 'text-slate-400'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>Shorts</span>
        </button>

        <button
          onClick={() => setCurrentView('questions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'questions' ? 'text-sky-400 font-black' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Subjects</span>
        </button>

        <button
          onClick={() => setCurrentView('telegram')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'telegram' ? 'text-sky-400 font-black' : 'text-slate-400'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span>Telegram</span>
        </button>

        <button
          onClick={() => setCurrentView('brand')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'brand' ? 'text-rose-400 font-black' : 'text-slate-400'
          }`}
        >
          <Palette className="w-5 h-5" />
          <span>Brand</span>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
            currentView === 'settings' ? 'text-sky-400 font-black' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Admin Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditorModal
          question={editingQuestion}
          isOpen={true}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}
