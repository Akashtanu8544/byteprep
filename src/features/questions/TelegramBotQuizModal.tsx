import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Shuffle,
  Search,
  Calendar,
  Clock,
  PlusCircle,
  Check,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Layers,
  Zap,
  Play,
  History,
  Trash2,
  Sliders,
  Bell,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Clipboard,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Brain,
  GraduationCap,
  Flame,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { Question } from '../../types';
import { TelegramService } from '../../services/telegramService';
import {
  TelegramAutoPostService,
  TelegramAutoPostConfig,
  TelegramBatchLogItem,
} from '../../services/telegramAutoPostService';
import {
  TelegramStreakService,
  PostingStreakInfo,
} from '../../services/telegramStreakService';
import { TelegramPerformanceDashboard } from '../telegram/TelegramPerformanceDashboard';
import { QuestionLoader } from '../../services/questionLoader';

interface TelegramBotQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: Question[];
  initialSubject?: string;
  isFullPage?: boolean;
}

export const TelegramBotQuizModal: React.FC<TelegramBotQuizModalProps> = ({
  isOpen,
  onClose,
  allQuestions,
  initialSubject = 'All',
  isFullPage = false,
}) => {
  // Tabs: 'autopost' vs 'ai_dsssb' (10 Qs daily) vs 'analytics' vs 'single' vs 'logs'
  const [activeTab, setActiveTab] = useState<'autopost' | 'ai_dsssb' | 'analytics' | 'single' | 'logs'>('autopost');

  // Daily Posting Streak State
  const [streakInfo, setStreakInfo] = useState<PostingStreakInfo>(TelegramStreakService.getStreakInfo());

  // AI DSSSB TGT PYQ Generator & Auto-Post State
  const [isGeneratingDsssb, setIsGeneratingDsssb] = useState<boolean>(false);
  const [isBroadcastingDsssb, setIsBroadcastingDsssb] = useState<boolean>(false);
  const [dsssbPreviewQuestions, setDsssbPreviewQuestions] = useState<Question[]>([]);
  const [dsssbProgress, setDsssbProgress] = useState<{ current: number; total: number; stepText: string; isSuccess?: boolean } | null>(null);
  const [dsssbBatchResult, setDsssbBatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dsssbCustomTopic, setDsssbCustomTopic] = useState<string>('DSSSB TGT CS Previous Year Questions (PYQ)');
  const [dsssbSelectedSubject, setDsssbSelectedSubject] = useState<string>('All Core Computer Science');
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

  // Auto-Post Config State
  const [config, setConfig] = useState<TelegramAutoPostConfig>(TelegramAutoPostService.getConfig());
  const [countdown, setCountdown] = useState<string>('');
  const [nextSlotTime, setNextSlotTime] = useState<string>('');
  const [subjectStats, setSubjectStats] = useState(TelegramAutoPostService.getSubjectBreakdown());
  const [logs, setLogs] = useState<TelegramBatchLogItem[]>(TelegramAutoPostService.getLogs());

  // Batch runner state
  const [isExecutingBatch, setIsExecutingBatch] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; question: string; isSuccess?: boolean } | null>(null);
  const [batchResult, setBatchResult] = useState<{ success: boolean; message: string } | null>(null);

  // Single post mode states
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState<boolean>(false);
  const [singleSubjectFilter, setSingleSubjectFilter] = useState<string>(initialSubject);

  // Credentials & testing states
  const [botToken, setBotToken] = useState<string>(config.botToken || '');
  const [chatId, setChatId] = useState<string>(config.chatId || '');
  const [showBotToken, setShowBotToken] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string; botName?: string; chatTitle?: string } | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState<boolean>(false);
  const [isConfigDropdownOpen, setIsConfigDropdownOpen] = useState<boolean>(false);

  // Sync state on open and subscribe to scheduler timer
  useEffect(() => {
    if (!isOpen) return;

    const currentConfig = TelegramAutoPostService.getConfig();
    setConfig(currentConfig);
    setBotToken(currentConfig.botToken || '');
    setChatId(currentConfig.chatId || '');
    setSubjectStats(TelegramAutoPostService.getSubjectBreakdown());
    setLogs(TelegramAutoPostService.getLogs());

    // Auto-open config dropdown if credentials are not yet set
    if (!currentConfig.botToken || !currentConfig.chatId) {
      setIsConfigDropdownOpen(true);
    }

    if (initialSubject && initialSubject !== 'All') {
      setSingleSubjectFilter(initialSubject);
    }

    if (allQuestions && allQuestions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(allQuestions[0]);
    }

    // Subscribe to periodic timer updates
    const unsubscribe = TelegramAutoPostService.subscribe(() => {
      const updatedConfig = TelegramAutoPostService.getConfig();
      setConfig(updatedConfig);
      setLogs(TelegramAutoPostService.getLogs());
      setSubjectStats(TelegramAutoPostService.getSubjectBreakdown());
      setIsExecutingBatch(TelegramAutoPostService.isCurrentlyRunning());

      const info = TelegramAutoPostService.getNextScheduleInfo();
      setCountdown(info.formattedCountdown);
      setNextSlotTime(info.nextSlotTime);
    });

    // Subscribe to daily streak & performance metrics updates
    const unsubStreak = TelegramStreakService.subscribe(() => {
      setStreakInfo(TelegramStreakService.getStreakInfo());
    });

    const info = TelegramAutoPostService.getNextScheduleInfo();
    setCountdown(info.formattedCountdown);
    setNextSlotTime(info.nextSlotTime);

    return () => {
      unsubscribe();
      unsubStreak();
    };
  }, [isOpen, allQuestions, initialSubject]);

  if (!isOpen) return null;

  // Filtered list for single question post tab
  const filteredSingleList = allQuestions.filter((q) => {
    const matchesSub = singleSubjectFilter === 'All' || (q.subject || '').toLowerCase() === singleSubjectFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query ||
      q.question.toLowerCase().includes(query) ||
      (q.topic || '').toLowerCase().includes(query) ||
      (q.subject || '').toLowerCase().includes(query);
    return matchesSub && matchesQuery;
  });

  const handleSaveCredentials = (tokOverride?: string, chOverride?: string) => {
    const rawTok = tokOverride !== undefined ? tokOverride : botToken;
    const rawCh = chOverride !== undefined ? chOverride : chatId;
    const cleanTok = TelegramService.cleanToken(rawTok);
    const cleanCh = TelegramService.cleanChatId(rawCh);
    
    setBotToken(cleanTok);
    setChatId(cleanCh);
    
    const updated = TelegramAutoPostService.saveConfig({
      botToken: cleanTok,
      chatId: cleanCh,
    });
    setConfig(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handlePasteToken = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = TelegramService.cleanToken(text);
          setBotToken(clean);
          handleSaveCredentials(clean, chatId);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handlePasteChatId = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = TelegramService.cleanChatId(text);
          setChatId(clean);
          handleSaveCredentials(botToken, clean);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleTestConnection = async () => {
    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!cleanTok) {
      setError('Please enter your Telegram Bot API Token first.');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestStatus(null);

    try {
      const res = await TelegramService.testConnection(cleanTok, cleanCh);

      if (res.success) {
        if (res.chatError) {
          setTestStatus({
            success: false,
            message: `Bot ${res.bot?.username} verified! Channel Notice: ${res.chatError}`,
            botName: res.bot?.username,
          });
        } else {
          setTestStatus({
            success: true,
            message: `Connected! Bot: ${res.bot?.username}${res.chat?.title ? ` → Channel: ${res.chat.title}` : ' (Ready)'}`,
            botName: res.bot?.username,
            chatTitle: res.chat?.title,
          });
        }
        handleSaveCredentials(cleanTok, cleanCh);
      } else {
        setError(res.error || 'Connection test failed. Please check your Bot Token.');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying connection to Telegram.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleAutoPost = () => {
    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!config.enabled && (!cleanTok || !cleanCh)) {
      setError('Please provide Bot Token and Channel Handle before enabling auto-post schedule.');
      return;
    }

    const updated = TelegramAutoPostService.saveConfig({
      enabled: !config.enabled,
      botToken: cleanTok,
      chatId: cleanCh,
    });
    setConfig(updated);
    setError(null);
  };

  const handleSetFrequency = (times: number) => {
    const updated = TelegramAutoPostService.saveConfig({
      frequencyTimesDaily: times,
    });
    setConfig(updated);
  };

  const handleSetSubject = (sub: string) => {
    const updated = TelegramAutoPostService.saveConfig({
      selectedSubject: sub,
    });
    setConfig(updated);
  };

  const handleSetQuestionsPerSlot = (count: number) => {
    const updated = TelegramAutoPostService.saveConfig({
      questionsPerSlot: count,
    });
    setConfig(updated);
  };

  const handleSetSlotTime = (index: number, newTime: string) => {
    const slots = [...config.scheduleSlots];
    slots[index] = newTime;
    slots.sort();
    const updated = TelegramAutoPostService.saveConfig({
      scheduleSlots: slots,
    });
    setConfig(updated);
  };

  const handleRunBatchNow = async () => {
    if (isExecutingBatch) return;

    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!cleanTok || !cleanCh) {
      setError('Please enter and verify your Bot Token & Channel handle before running batch.');
      return;
    }

    handleSaveCredentials();
    setError(null);
    setBatchResult(null);
    setIsExecutingBatch(true);
    setBatchProgress({ current: 0, total: config.questionsPerSlot || 5, question: 'Initializing batch...' });

    try {
      const result = await TelegramAutoPostService.executeBatch({
        overrideSubject: config.selectedSubject,
        overrideCount: config.questionsPerSlot || 5,
        slotLabel: 'Manual Instant Broadcast',
        onProgress: (current, total, q, isSuccess) => {
          setBatchProgress({
            current,
            total,
            question: q.question,
            isSuccess,
          });
        },
      });

      if (result.success) {
        setBatchResult({
          success: true,
          message: `Successfully posted ${result.totalPosted} question${result.totalPosted > 1 ? 's' : ''} to Telegram!`,
        });
      } else {
        setError(result.errorMessage || `Failed to post questions. Errors in ${result.failedCount} items.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during batch execution.');
    } finally {
      setIsExecutingBatch(false);
      setTimeout(() => {
        setBatchProgress(null);
      }, 3000);
    }
  };

  const handleToggleAiDsssb = () => {
    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!config.aiDsssbDailyEnabled && (!cleanTok || !cleanCh)) {
      setError('Please provide Bot Token and Channel Handle before enabling AI DSSSB TGT auto-post.');
      return;
    }

    const updated = TelegramAutoPostService.saveConfig({
      aiDsssbDailyEnabled: !config.aiDsssbDailyEnabled,
      botToken: cleanTok,
      chatId: cleanCh,
    });
    setConfig(updated);
    setError(null);
  };

  const handleSetAiDsssbTime = (time: string) => {
    const updated = TelegramAutoPostService.saveConfig({
      aiDsssbTime: time,
    });
    setConfig(updated);
  };

  const handleSetAiDsssbSubject = (subject: string) => {
    setDsssbSelectedSubject(subject);
    const updated = TelegramAutoPostService.saveConfig({
      aiDsssbSubject: subject,
    });
    setConfig(updated);
  };

  const handleGenerateDsssbPreview = async () => {
    setError(null);
    setDsssbBatchResult(null);
    setIsGeneratingDsssb(true);

    try {
      const generated = await TelegramAutoPostService.generateDsssbTgtQuestions({
        count: 10,
        subject: dsssbSelectedSubject,
        topic: dsssbCustomTopic || 'DSSSB TGT CS Previous Year Questions (PYQ)',
      });

      setDsssbPreviewQuestions(generated);
      setDsssbBatchResult({
        success: true,
        message: `Generated 10 DSSSB TGT PYQ questions successfully! Review them below or broadcast directly to your Telegram channel.`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate DSSSB TGT questions with Gemini.');
    } finally {
      setIsGeneratingDsssb(false);
    }
  };

  const handleBroadcastDsssbNow = async (questionsToUse?: Question[]) => {
    if (isBroadcastingDsssb) return;

    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!cleanTok || !cleanCh) {
      setError('Please enter and verify your Bot Token & Channel handle before running batch.');
      return;
    }

    handleSaveCredentials();
    setError(null);
    setDsssbBatchResult(null);
    setIsBroadcastingDsssb(true);
    setDsssbProgress({ current: 0, total: 10, stepText: 'Initializing AI DSSSB TGT batch...' });

    try {
      const result = await TelegramAutoPostService.executeAiDsssbDailyBatch({
        count: 10,
        subject: dsssbSelectedSubject,
        topic: dsssbCustomTopic || 'DSSSB TGT CS Previous Year Questions (PYQ)',
        slotLabel: 'Instant AI DSSSB TGT Broadcast',
        preGeneratedQuestions: (questionsToUse && questionsToUse.length > 0) ? questionsToUse : (dsssbPreviewQuestions.length > 0 ? dsssbPreviewQuestions : undefined),
        onProgress: (current, total, q, stepText, isSuccess) => {
          setDsssbProgress({
            current,
            total,
            stepText,
            isSuccess,
          });
        },
      });

      if (result.success) {
        if (result.questions && result.questions.length > 0) {
          setDsssbPreviewQuestions(result.questions);
        }
        setDsssbBatchResult({
          success: true,
          message: `Successfully posted ${result.totalPosted} DSSSB TGT PYQ question${result.totalPosted > 1 ? 's' : ''} to Telegram!`,
        });
      } else {
        setError(result.errorMessage || `Failed to post questions. Errors in ${result.failedCount} items.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during AI DSSSB TGT batch broadcast.');
    } finally {
      setIsBroadcastingDsssb(false);
      setTimeout(() => {
        setDsssbProgress(null);
      }, 4000);
    }
  };

  const handlePostSingle = async () => {
    if (isSubmittingSingle) return;

    if (!selectedQuestion) {
      setError('Please select a question to post.');
      return;
    }

    const cleanTok = TelegramService.cleanToken(botToken);
    const cleanCh = TelegramService.cleanChatId(chatId);

    if (!cleanTok || !cleanCh) {
      setError('Both Bot Token and Channel Handle are required.');
      return;
    }

    handleSaveCredentials();
    setIsSubmittingSingle(true);
    setError(null);
    setSingleSuccess(false);

    try {
      const res = await TelegramService.postQuizPoll({
        botToken: cleanTok,
        chatId: cleanCh,
        question: selectedQuestion.question,
        options: selectedQuestion.options,
        correctAnswer: selectedQuestion.correctAnswer,
        explanation: selectedQuestion.explanation || '',
        isAnonymous: config.isAnonymous,
      });

      if (res.success) {
        TelegramStreakService.recordPost({ count: 1, isDsssb: false });
        QuestionLoader.markQuestionPosted(selectedQuestion.id, selectedQuestion.question);
        QuestionLoader.recordQuestionUsage(selectedQuestion.id, 'POSTED');
        setSingleSuccess(true);
        setTimeout(() => setSingleSuccess(false), 4000);
      } else {
        setError(res.error || 'Failed to post quiz to Telegram.');
      }
    } catch (err: any) {
      setError(err.message || 'Error posting quiz.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  return (
    <div className={isFullPage ? "w-full max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 animate-fadeIn" : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"}>
      <div className={isFullPage ? "bg-slate-900 border border-slate-800 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden" : "bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            {isFullPage && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer mr-1"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">
                  Telegram Auto-Post
                </h1>
                {config.enabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                    Paused
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={isFullPage ? "Back" : "Close"}
          >
            {isFullPage ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('autopost')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'autopost'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Post Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_dsssb')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_dsssb'
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-amber-400/90 hover:text-amber-300 bg-amber-950/20 border border-amber-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI DSSSB TGT (10 Daily)</span>
            {config.aiDsssbDailyEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500 text-slate-950 font-black shadow-md'
                : 'text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/20 border border-emerald-500/30'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>30D Performance</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-slate-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 fill-current text-amber-400" />
              {streakInfo.currentStreak}d
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'single'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Single Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Logs ({logs.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Notifications & Status Banner */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-2xl flex items-start gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {testStatus && (
            <div className={`p-3 border text-xs font-bold rounded-2xl flex items-start gap-2 ${
              testStatus.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              {testStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              <span>{testStatus.message}</span>
            </div>
          )}

          {batchResult && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{batchResult.message}</span>
            </div>
          )}

          {singleSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-black rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Quiz posted to Telegram</span>
            </div>
          )}

          {/* User Daily Posting Streak Card */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md shadow-amber-500/20">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white">
                    {streakInfo.currentStreak} Day Posting Streak
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    streakInfo.isPostedToday
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : streakInfo.streakStatus === 'AT_RISK'
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {streakInfo.isPostedToday ? 'Today Secured 🔥' : streakInfo.streakStatus === 'AT_RISK' ? 'At Risk Today ⚡' : 'Start Today'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Best: <strong className="text-white">{streakInfo.longestStreak}d</strong> • {streakInfo.monthConsistencyPercent}% Consistency)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {streakInfo.isPostedToday
                    ? 'Broadcasting streak active! Your students receive consistent daily CS practice.'
                    : 'Post a quiz today to keep your daily Telegram publishing streak alive!'}
                </p>
              </div>
            </div>

            {/* 7-Day Mini Dots & Shortcut to Analytics */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
              <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2 py-1 rounded-xl">
                {streakInfo.recentDays.map((d, i) => (
                  <div
                    key={i}
                    title={`${d.date}: ${d.posted ? `${d.quizzesCount} Qs posted` : 'No post'}`}
                    className={`w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-black transition-all ${
                      d.posted
                        ? 'bg-amber-500 text-slate-950'
                        : d.isToday
                        ? 'border border-dashed border-amber-500/60 text-amber-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {d.dayLabel[0]}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">30D Metrics</span>
              </button>
            </div>
          </div>

          {/* Bot Credentials Box */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-lg transition-all">
            <div
              onClick={() => setIsConfigDropdownOpen(!isConfigDropdownOpen)}
              className="flex items-center justify-between flex-wrap gap-2 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                      Bot Config
                    </span>
                    {botToken.trim() && chatId.trim() ? (
                      <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        ✓ {chatId}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        Setup Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestConnection();
                  }}
                  disabled={isTesting || !botToken.trim()}
                  className="text-[11px] bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Checking...' : 'Check'}</span>
                </button>

                <div className="flex items-center gap-1 text-xs font-bold text-sky-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
                  <span>{isConfigDropdownOpen ? 'Hide' : 'Edit'}</span>
                  {isConfigDropdownOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>

            {isConfigDropdownOpen && (
              <div className="mt-3 pt-3 border-t border-slate-900 space-y-3 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Bot API Token Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Bot Token
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePasteToken}
                          className="text-[10px] text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Clipboard className="w-3 h-3" />
                          <span>Paste</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBotToken(!showBotToken)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-900 px-2 py-0.5 rounded flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {showBotToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={showBotToken ? 'text' : 'password'}
                        value={botToken}
                        onChange={(e) => {
                          setBotToken(e.target.value);
                          setError(null);
                        }}
                        onBlur={() => handleSaveCredentials()}
                        placeholder="e.g. 7812345678:AAHAbc..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Channel ID / Username Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Channel Username / ID
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteChatId}
                        className="text-[10px] text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => {
                          setChatId(e.target.value);
                          setError(null);
                        }}
                        onBlur={() => handleSaveCredentials()}
                        placeholder="e.g. @my_channel"
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: AUTO-POST SCHEDULER */}
          {activeTab === 'autopost' && (
            <div className="space-y-4">
              {/* Active Scheduler Controls Banner */}
              <div className="bg-gradient-to-r from-sky-950/40 via-blue-950/40 to-slate-950 border border-sky-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-white">
                      Auto-Post Schedule
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {config.questionsPerSlot} questions • {config.frequencyTimesDaily}x daily • {config.selectedSubject}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoPost}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                      config.enabled
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    {config.enabled ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Enable</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Countdown & Next Slot Tracker */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Next</span>
                    <p className="text-xs font-black text-white mt-0.5">Slot: {nextSlotTime || 'Upcoming'}</p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Remaining</span>
                    <p className="text-xs font-black text-sky-400 mt-0.5">{countdown || 'Calculating...'}</p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Posted</span>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">{config.totalQuestionsPostedCount || 0} Total</p>
                  </div>
                </div>
              </div>

              {/* AI DSSSB TGT 10 Questions Daily Feature Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">AI DSSSB TGT 10 Questions Daily</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        config.aiDsssbDailyEnabled
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {config.aiDsssbDailyEnabled ? `Active at ${config.aiDsssbTime || '09:00'}` : 'Paused'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Gemini generates 10 authentic DSSSB TGT PYQ questions daily and broadcasts them to your Telegram channel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai_dsssb')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <span>Open AI DSSSB Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subject Selector */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-300 block">
                  Subject
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetSubject('All')}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      config.selectedSubject === 'All'
                        ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">All</span>
                      {config.selectedSubject === 'All' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{allQuestions.length} MCQs</span>
                  </button>

                  {subjectStats.map((st) => {
                    const isSelected = config.selectedSubject.toLowerCase() === st.subject.toLowerCase();
                    return (
                      <button
                        key={st.subject}
                        type="button"
                        onClick={() => handleSetSubject(st.subject)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black truncate text-white">{st.subject}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{st.total} MCQs</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Frequency & Time Slots Config */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-white">Daily Frequency</span>
                  <div className="flex items-center gap-1.5">
                    {[3, 4].map(times => (
                      <button
                        key={times}
                        type="button"
                        onClick={() => handleSetFrequency(times)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          config.frequencyTimesDaily === times
                            ? 'bg-sky-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {times}x Daily
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions per slot */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-xs font-bold text-white">Batch Size</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSetQuestionsPerSlot(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          config.questionsPerSlot === num
                            ? 'bg-sky-500 text-slate-950 font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot Times Editor */}
                <div className="pt-2 border-t border-slate-900 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Time Slots
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {config.scheduleSlots.map((slot, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-2 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 block">
                          Slot #{idx + 1}
                        </span>
                        <input
                          type="time"
                          value={slot}
                          onChange={(e) => handleSetSlotTime(idx, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-white outline-none focus:border-sky-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Run Batch Now */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-white">Manual Broadcast</h3>
                  <p className="text-[11px] text-slate-400">Post {config.questionsPerSlot} questions now</p>
                </div>

                <button
                  type="button"
                  onClick={handleRunBatchNow}
                  disabled={isExecutingBatch}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isExecutingBatch ? 'animate-spin' : ''}`} />
                  <span>{isExecutingBatch ? 'Posting...' : 'Run Now'}</span>
                </button>
              </div>

              {/* Live Batch Execution Progress */}
              {batchProgress && (
                <div className="p-3.5 bg-sky-950/40 border border-sky-500/40 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Posting {batchProgress.current}/{batchProgress.total}...
                    </span>
                    <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">{batchProgress.question}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI DSSSB TGT PYQ (10 QUESTIONS DAILY) */}
          {activeTab === 'ai_dsssb' && (
            <div className="space-y-4">
              {/* Feature Hero Card */}
              <div className="p-4 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl relative overflow-hidden shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        DSSSB TGT Daily AI Quiz Engine
                        <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                          10 Qs / Day
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Generates 10 authentic Computer Science MCQs daily matching real DSSSB TGT CS Previous Year Question (PYQ) patterns and broadcasts them to your Telegram channel as interactive quiz polls.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleAiDsssb}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                        config.aiDsssbDailyEnabled
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${config.aiDsssbDailyEnabled ? 'fill-current' : ''}`} />
                      <span>{config.aiDsssbDailyEnabled ? 'Daily Auto-Post Active' : 'Enable 10 Daily Auto-Post'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daily Broadcast Time:</span>
                    <input
                      type="time"
                      value={config.aiDsssbTime || '09:00'}
                      onChange={(e) => handleSetAiDsssbTime(e.target.value)}
                      className="bg-slate-950 border border-amber-500/40 text-amber-300 font-bold font-mono px-2 py-0.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      Last Generated: <span className="text-slate-200 font-bold">{config.aiDsssbLastGeneratedDate || 'None yet today'}</span>
                    </span>
                    <span className={`text-[11px] border px-2 py-0.5 rounded-full font-bold ${
                      config.aiDsssbDailyEnabled
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      {config.aiDsssbDailyEnabled ? '🟢 Daily Loop Active' : '⚪ Standby'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject Focus & Topic Configuration */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    DSSSB TGT Subject Coverage (10 MCQs)
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">PYQ Aligned: 2021–2025 Trend</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    'All Core Computer Science',
                    'Operating Systems & Linux',
                    'DBMS, SQL & Normalization',
                    'Computer Networks & Security',
                    'Data Structures & Algorithms',
                    'C++ & Python Programming',
                    'Digital Logic & Architecture',
                    'Web Technologies & HTML/CSS/JS',
                  ].map((subj) => {
                    const isSelected = dsssbSelectedSubject === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleSetAiDsssbSubject(subj)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate">{subj}</span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Specific Topic input & Question Bank auto-save */}
                <div className="pt-2 border-t border-slate-900 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      Exam Paper Keyword / Topic Focus
                    </label>
                    <input
                      type="text"
                      value={dsssbCustomTopic}
                      onChange={(e) => setDsssbCustomTopic(e.target.value)}
                      placeholder="e.g. DSSSB TGT CS 2021 PYQ, Page Replacement, Normal forms, IPv4 Subnetting"
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-[11px] font-bold text-slate-400">Save to App Question Bank</label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = TelegramAutoPostService.saveConfig({
                          aiDsssbAutoSaveToBank: config.aiDsssbAutoSaveToBank === false ? true : false,
                        });
                        setConfig(updated);
                      }}
                      className="h-[38px] px-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer bg-slate-900 border-slate-800 text-slate-300"
                    >
                      <span>Auto-Save to Bank</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                        config.aiDsssbAutoSaveToBank !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {config.aiDsssbAutoSaveToBank !== false ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Generate & Broadcast vs Preview */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBroadcastDsssbNow()}
                  disabled={isBroadcastingDsssb || isGeneratingDsssb}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Send className={`w-4 h-4 ${isBroadcastingDsssb ? 'animate-pulse' : ''}`} />
                  <span>
                    {isBroadcastingDsssb ? 'Generating & Broadcasting 10 Qs...' : '⚡ Generate & Broadcast 10 Questions Now'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateDsssbPreview}
                  disabled={isGeneratingDsssb || isBroadcastingDsssb}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Eye className={`w-4 h-4 ${isGeneratingDsssb ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingDsssb ? 'Generating with Gemini...' : 'Generate & Preview 10 Qs'}</span>
                </button>
              </div>

              {/* Feedback Banners */}
              {dsssbBatchResult && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  dsssbBatchResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{dsssbBatchResult.message}</span>
                </div>
              )}

              {/* Live Progress Bar for AI generation & Posting */}
              {dsssbProgress && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      {dsssbProgress.stepText}
                    </span>
                    <span>
                      {dsssbProgress.total > 0 ? `${Math.round((dsssbProgress.current / dsssbProgress.total) * 100)}%` : 'Working...'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
                      style={{
                        width: `${dsssbProgress.total > 0 ? (dsssbProgress.current / dsssbProgress.total) * 100 : 30}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Preview of Generated 10 Questions */}
              {dsssbPreviewQuestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Generated DSSSB TGT PYQs ({dsssbPreviewQuestions.length} Questions)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleBroadcastDsssbNow(dsssbPreviewQuestions)}
                      disabled={isBroadcastingDsssb}
                      className="text-xs font-black px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-lg flex items-center gap-1 hover:brightness-110 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post All {dsssbPreviewQuestions.length} to Telegram</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                    {dsssbPreviewQuestions.map((q, idx) => {
                      return (
                        <div
                          key={q.id || idx}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 transition-all hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-sky-300 px-2 py-0.5 rounded font-semibold">
                                {q.subject || 'DSSSB TGT CS'}
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-400/90 font-mono">
                              Correct: Opt {typeof q.correctAnswer === 'number' ? q.correctAnswer + 1 : q.correctAnswer}
                            </span>
                          </div>

                          <p className="text-xs text-white font-medium leading-snug">{q.question}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctAnswer;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-1.5 px-2 rounded-lg text-[11px] border flex items-center gap-1.5 ${
                                    isCorrect
                                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-bold'
                                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 leading-tight">
                              <span className="text-amber-400 font-bold">PYQ Insight: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: 30-DAY PERFORMANCE & ENGAGEMENT DASHBOARD */}
          {activeTab === 'analytics' && (
            <TelegramPerformanceDashboard
              onOpenAutoPostTab={() => setActiveTab('autopost')}
              onOpenAiDsssbTab={() => setActiveTab('ai_dsssb')}
            />
          )}

          {/* TAB 2: MANUAL SINGLE QUIZ POST */}
          {activeTab === 'single' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-white">Select Question</span>
                <select
                  value={singleSubjectFilter}
                  onChange={(e) => setSingleSubjectFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1 outline-none"
                >
                  <option value="All">All ({allQuestions.length})</option>
                  {subjectStats.map((st) => (
                    <option key={st.subject} value={st.subject}>
                      {st.subject} ({st.total})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-sky-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Question list */}
              <div className="max-h-[240px] overflow-y-auto border border-slate-800 rounded-2xl divide-y divide-slate-850 bg-slate-950/60 custom-scrollbar">
                {filteredSingleList.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">No questions found</p>
                ) : (
                  filteredSingleList.map((q, idx) => {
                    const isSelected = selectedQuestion?.id === q.id;
                    return (
                      <div
                        key={q.id || idx}
                        onClick={() => setSelectedQuestion(q)}
                        className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-sky-500/15 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isSelected ? 'bg-sky-400 animate-ping' : 'bg-slate-700'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2 leading-relaxed">{q.question}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-1 uppercase">
                            <span className="text-sky-400">{q.subject}</span>
                            <span>•</span>
                            <span>{q.topic || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Single Post Action */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handlePostSingle}
                  disabled={isSubmittingSingle || !selectedQuestion}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingSingle ? 'Posting...' : 'Post Quiz'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BROADCAST LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Broadcast Logs</span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => TelegramAutoPostService.clearLogs()}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-400 text-xs">
                  No logs yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{log.slotLabel || 'Scheduled'}</span>
                          <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-sky-300">
                            {log.subject}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-emerald-400 font-bold">
                          ✓ {log.successCount} Posted
                        </span>
                        {log.failCount > 0 && (
                          <span className="text-rose-400 font-bold">
                            ✕ {log.failCount} Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
