import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { Footer } from './components/Footer';
import { CreatorDashboard } from './features/dashboard/CreatorDashboard';
import { ShortsStudio } from './features/shorts/ShortsStudio';
import { AutoPosterHub } from './features/autopost/AutoPosterHub';
import { QuestionBankView } from './features/questions/QuestionBankView';
import { BrandKitModal } from './features/brand/BrandKitModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { QuestionEditorModal } from './features/questions/QuestionEditorModal';
import { StorageService } from './services/storageService';
import { NormalizedQuestion, ChallengeSettings } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');

  // App Settings
  const [settings, setSettings] = useState<ChallengeSettings>(StorageService.getSettings());

  // Active targets for Studio
  const [preselectedStudioQId, setPreselectedStudioQId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<NormalizedQuestion | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState<boolean>(false);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const handleOpenStudio = (questionId?: string) => {
    setPreselectedStudioQId(questionId || null);
    setCurrentView('studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      <Header
        currentView={currentView}
        onNavigate={view => setCurrentView(view)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBrandKit={() => setIsBrandKitOpen(true)}
        onOpenBackup={() => {}}
        onOpenShortcuts={() => {}}
      />

      <main className="flex-1">
        {/* Clean Focused Creator Dashboard */}
        {currentView === 'home' && (
          <CreatorDashboard
            onNavigate={view => setCurrentView(view)}
            onOpenShortsStudio={handleOpenStudio}
            onOpenBrandKit={() => setIsBrandKitOpen(true)}
          />
        )}

        {/* Core Shorts Studio (Full 9:16 Video Generator) */}
        {currentView === 'studio' && (
          <ShortsStudio
            onBack={() => setCurrentView('home')}
            preselectedQuestionId={preselectedStudioQId}
          />
        )}

        {/* Auto-Poster & Scheduler Hub */}
        {currentView === 'autopost' && (
          <AutoPosterHub
            onOpenShortsStudio={handleOpenStudio}
          />
        )}

        {/* Question Bank (Select & Create Videos) */}
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
      </main>

      {currentView !== 'studio' && <Footer appUrl={settings.appUrl} />}

      {/* Brand Kit Modal */}
      <BrandKitModal
        isOpen={isBrandKitOpen}
        onClose={() => setIsBrandKitOpen(false)}
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
    </div>
  );
}
