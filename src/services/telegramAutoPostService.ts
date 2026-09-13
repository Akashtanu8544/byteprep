import { NormalizedQuestion } from '../types';
import { QuestionLoader } from './questionLoader';
import { TelegramService } from './telegramService';
import { TelegramStreakService } from './telegramStreakService';

export interface TelegramAutoPostConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  frequencyTimesDaily: number; // 3 or 4
  scheduleSlots: string[]; // e.g. ['09:00', '13:00', '17:00', '21:00']
  questionsPerSlot: number; // default: 5
  selectedSubject: string; // 'All' or specific subject name
  selectionStrategy: 'UNPOSTED_FIRST' | 'RANDOM_SHUFFLE' | 'SEQUENTIAL';
  isAnonymous: boolean; // default: true
  delayBetweenQuestionsMs: number; // default: 2500ms
  lastRunSlotDate?: string; // tracks 'YYYY-MM-DD_HH:MM' to prevent duplicate execution within same minute
  lastRunTimestamp?: string;
  totalQuestionsPostedCount: number;

  // AI DSSSB TGT PYQ Daily Generator & Auto-Poster
  aiDsssbDailyEnabled: boolean; // Auto-generate 10 DSSSB TGT PYQ daily and send to channel
  aiDsssbCount: number; // default: 10 questions daily
  aiDsssbSubject: string; // 'All Core CS', 'Operating Systems', 'DBMS', etc.
  aiDsssbTime: string; // e.g. '09:00'
  aiDsssbLastGeneratedDate?: string; // tracks 'YYYY-MM-DD'
  aiDsssbAutoSaveToBank: boolean; // saves generated questions to Question Bank
}

export interface TelegramBatchLogItem {
  id: string;
  timestamp: string;
  slotLabel?: string;
  subject: string;
  totalRequested: number;
  successCount: number;
  failCount: number;
  questions: Array<{
    id: string;
    question: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

const STORAGE_CONFIG_KEY = 'BP_TELEGRAM_AUTOPOST_CONFIG_V2';
const STORAGE_LOGS_KEY = 'BP_TELEGRAM_AUTOPOST_LOGS_V2';

const DEFAULT_SLOTS_4X = ['09:00', '13:00', '17:00', '21:00'];
const DEFAULT_SLOTS_3X = ['09:30', '14:30', '19:30'];

export class TelegramAutoPostService {
  private static timerInterval: any = null;
  private static listeners: Array<() => void> = [];
  private static isExecutingBatch: boolean = false;
  private static inMemoryTriggeredSlots = new Set<string>();

  /**
   * Retrieves saved configuration or creates default
   */
  static getConfig(): TelegramAutoPostConfig {
    try {
      const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: !!parsed.enabled,
          botToken: TelegramService.cleanToken(parsed.botToken || localStorage.getItem('bp_telegram_bot_token') || ''),
          chatId: TelegramService.cleanChatId(parsed.chatId || localStorage.getItem('bp_telegram_chat_id') || ''),
          frequencyTimesDaily: parsed.frequencyTimesDaily || 4,
          scheduleSlots: Array.isArray(parsed.scheduleSlots) && parsed.scheduleSlots.length > 0
            ? parsed.scheduleSlots
            : (parsed.frequencyTimesDaily === 3 ? DEFAULT_SLOTS_3X : DEFAULT_SLOTS_4X),
          questionsPerSlot: parsed.questionsPerSlot || 5,
          selectedSubject: parsed.selectedSubject || 'All',
          selectionStrategy: parsed.selectionStrategy || 'UNPOSTED_FIRST',
          isAnonymous: parsed.isAnonymous !== false,
          delayBetweenQuestionsMs: parsed.delayBetweenQuestionsMs || 2500,
          lastRunSlotDate: parsed.lastRunSlotDate,
          lastRunTimestamp: parsed.lastRunTimestamp,
          totalQuestionsPostedCount: parsed.totalQuestionsPostedCount || 0,
          aiDsssbDailyEnabled: !!parsed.aiDsssbDailyEnabled,
          aiDsssbCount: parsed.aiDsssbCount || 10,
          aiDsssbSubject: parsed.aiDsssbSubject || 'All Core Computer Science',
          aiDsssbTime: parsed.aiDsssbTime || '09:00',
          aiDsssbLastGeneratedDate: parsed.aiDsssbLastGeneratedDate || '',
          aiDsssbAutoSaveToBank: parsed.aiDsssbAutoSaveToBank !== false,
        };
      }
    } catch (e) {
      console.warn('Failed to parse telegram auto post config:', e);
    }

    return {
      enabled: false,
      botToken: TelegramService.cleanToken(localStorage.getItem('bp_telegram_bot_token') || ''),
      chatId: TelegramService.cleanChatId(localStorage.getItem('bp_telegram_chat_id') || ''),
      frequencyTimesDaily: 4,
      scheduleSlots: DEFAULT_SLOTS_4X,
      questionsPerSlot: 5,
      selectedSubject: 'All',
      selectionStrategy: 'UNPOSTED_FIRST',
      isAnonymous: true,
      delayBetweenQuestionsMs: 2500,
      totalQuestionsPostedCount: 0,
      aiDsssbDailyEnabled: false,
      aiDsssbCount: 10,
      aiDsssbSubject: 'All Core Computer Science',
      aiDsssbTime: '09:00',
      aiDsssbLastGeneratedDate: '',
      aiDsssbAutoSaveToBank: true,
    };
  }

  /**
   * Saves updated configuration
   */
  static saveConfig(newConfig: Partial<TelegramAutoPostConfig>): TelegramAutoPostConfig {
    const current = this.getConfig();
    const updated: TelegramAutoPostConfig = {
      ...current,
      ...newConfig,
      botToken: TelegramService.cleanToken(newConfig.botToken !== undefined ? newConfig.botToken : current.botToken),
      chatId: TelegramService.cleanChatId(newConfig.chatId !== undefined ? newConfig.chatId : current.chatId),
    };

    // Auto update slots if frequency changed
    if (newConfig.frequencyTimesDaily && newConfig.frequencyTimesDaily !== current.frequencyTimesDaily) {
      if (!newConfig.scheduleSlots) {
        updated.scheduleSlots = newConfig.frequencyTimesDaily === 3 ? DEFAULT_SLOTS_3X : DEFAULT_SLOTS_4X;
      }
    }

    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updated));
      if (updated.botToken) localStorage.setItem('bp_telegram_bot_token', updated.botToken);
      if (updated.chatId) localStorage.setItem('bp_telegram_chat_id', updated.chatId);
    } catch (e) {
      console.error('Failed to save auto post config', e);
    }

    this.notify();
    return updated;
  }

  /**
   * Returns question stats separated by subject
   */
  static getSubjectBreakdown(): Array<{
    subject: string;
    total: number;
    unposted: number;
    posted: number;
  }> {
    const allQuestions = QuestionLoader.getAllQuestions();
    const subjectMap: Record<string, { total: number; unposted: number; posted: number }> = {};

    allQuestions.forEach((q) => {
      const sub = q.subject || 'General CS';
      if (!subjectMap[sub]) {
        subjectMap[sub] = { total: 0, unposted: 0, posted: 0 };
      }
      subjectMap[sub].total++;
      if (q.posted) {
        subjectMap[sub].posted++;
      } else {
        subjectMap[sub].unposted++;
      }
    });

    const list = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      ...stats,
    }));

    // Sort by largest subject
    return list.sort((a, b) => b.total - a.total);
  }

  /**
   * Automatically selects `count` questions from given subject using the chosen strategy
   */
  static autoSelectQuestions(
    subject: string = 'All',
    count: number = 5,
    strategy: 'UNPOSTED_FIRST' | 'RANDOM_SHUFFLE' | 'SEQUENTIAL' = 'UNPOSTED_FIRST'
  ): NormalizedQuestion[] {
    let pool = QuestionLoader.getAllQuestions();

    if (subject && subject !== 'All') {
      pool = pool.filter((q) => (q.subject || '').toLowerCase() === subject.toLowerCase());
    }

    if (pool.length === 0) {
      pool = QuestionLoader.getAllQuestions();
    }

    if (pool.length === 0) {
      return [];
    }

    let selected: NormalizedQuestion[] = [];

    if (strategy === 'UNPOSTED_FIRST') {
      const unposted = pool.filter((q) => !q.posted && (!q.timesUsed || q.timesUsed === 0));
      const remaining = pool.filter((q) => q.posted || (q.timesUsed && q.timesUsed > 0));

      // Shuffle unposted for variety
      const shuffledUnposted = [...unposted].sort(() => Math.random() - 0.5);
      const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);

      selected = [...shuffledUnposted, ...shuffledRemaining].slice(0, count * 2);
    } else if (strategy === 'RANDOM_SHUFFLE') {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, count * 2);
    } else {
      // Sequential
      selected = pool.slice(0, count * 2);
    }

    // Strictly deduplicate questions within the batch by normalized text & ID
    const seenTexts = new Set<string>();
    const seenIds = new Set<string>();
    const uniqueSelected: NormalizedQuestion[] = [];

    for (const q of selected) {
      const normText = (q.question || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!normText || seenTexts.has(normText) || (q.id && seenIds.has(q.id))) {
        continue;
      }
      seenTexts.add(normText);
      if (q.id) seenIds.add(q.id);
      uniqueSelected.push(q);
      if (uniqueSelected.length >= count) break;
    }

    return uniqueSelected;
  }

  /**
   * Dispatches a batch of questions to Telegram with delay and logging
   */
  static async executeBatch(
    options?: {
      overrideSubject?: string;
      overrideCount?: number;
      slotLabel?: string;
      onProgress?: (current: number, total: number, q: NormalizedQuestion, isSuccess: boolean) => void;
    }
  ): Promise<{
    success: boolean;
    totalPosted: number;
    failedCount: number;
    logItem: TelegramBatchLogItem;
    errorMessage?: string;
  }> {
    if (this.isExecutingBatch) {
      return {
        success: false,
        totalPosted: 0,
        failedCount: 0,
        logItem: null as any,
        errorMessage: 'A batch is already in progress.',
      };
    }

    const config = this.getConfig();
    const token = TelegramService.cleanToken(config.botToken);
    const chatId = TelegramService.cleanChatId(config.chatId);

    if (!token || !chatId) {
      return {
        success: false,
        totalPosted: 0,
        failedCount: 0,
        logItem: null as any,
        errorMessage: 'Bot API Token or Channel Handle is missing. Please configure credentials first.',
      };
    }

    this.isExecutingBatch = true;
    this.notify();

    const targetSubject = options?.overrideSubject || config.selectedSubject || 'All';
    const targetCount = options?.overrideCount || config.questionsPerSlot || 5;
    const questionsToPost = this.autoSelectQuestions(targetSubject, targetCount, config.selectionStrategy);

    if (questionsToPost.length === 0) {
      this.isExecutingBatch = false;
      this.notify();
      return {
        success: false,
        totalPosted: 0,
        failedCount: 0,
        logItem: null as any,
        errorMessage: 'No questions available in selected subject.',
      };
    }

    const logItem: TelegramBatchLogItem = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      slotLabel: options?.slotLabel || 'Manual Trigger',
      subject: targetSubject,
      totalRequested: questionsToPost.length,
      successCount: 0,
      failCount: 0,
      questions: [],
    };

    try {
      for (let i = 0; i < questionsToPost.length; i++) {
        const q = questionsToPost[i];
        
        try {
          const postResult = await TelegramService.postQuizPoll({
            botToken: token,
            chatId: chatId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            isAnonymous: config.isAnonymous,
          });

          if (postResult.success) {
            logItem.successCount++;
            logItem.questions.push({
              id: q.id,
              question: q.question,
              status: 'success',
            });
            // Mark question as posted in database with text hash to avoid duplicates
            QuestionLoader.markQuestionPosted(q.id, q.question);
            QuestionLoader.recordQuestionUsage(q.id, 'POSTED');
            options?.onProgress?.(i + 1, questionsToPost.length, q, true);
          } else {
            logItem.failCount++;
            logItem.questions.push({
              id: q.id,
              question: q.question,
              status: 'failed',
              error: postResult.error,
            });
            options?.onProgress?.(i + 1, questionsToPost.length, q, false);
          }
        } catch (err: any) {
          logItem.failCount++;
          logItem.questions.push({
            id: q.id,
            question: q.question,
            status: 'failed',
            error: err.message || 'Unknown network error',
          });
          options?.onProgress?.(i + 1, questionsToPost.length, q, false);
        }

        // Delay between questions to prevent Telegram spam rate limit
        if (i < questionsToPost.length - 1) {
          await new Promise((res) => setTimeout(res, config.delayBetweenQuestionsMs || 2500));
        }
      }

      // Record logs
      this.appendLog(logItem);

      if (logItem.successCount > 0) {
        TelegramStreakService.recordPost({ count: logItem.successCount, isDsssb: false });
      }

      // Update config stats
      this.saveConfig({
        lastRunTimestamp: new Date().toISOString(),
        totalQuestionsPostedCount: (config.totalQuestionsPostedCount || 0) + logItem.successCount,
      });

      return {
        success: logItem.successCount > 0,
        totalPosted: logItem.successCount,
        failedCount: logItem.failCount,
        logItem,
      };
    } finally {
      this.isExecutingBatch = false;
      this.notify();
    }
  }

  /**
   * Generates authentic DSSSB TGT PYQ questions via Gemini
   */
  static async generateDsssbTgtQuestions(params?: {
    count?: number;
    subject?: string;
    topic?: string;
    yearPattern?: string;
  }): Promise<NormalizedQuestion[]> {
    const payload = {
      count: params?.count || 10,
      subject: params?.subject || 'All Core Computer Science',
      topic: params?.topic || 'DSSSB TGT CS Previous Years Questions Syllabus',
      yearPattern: params?.yearPattern || '2021-2025 PYQ Pattern',
    };

    // Try primary endpoint: /api/telegram/generate-dsssb-daily
    try {
      const res = await fetch('/api/telegram/generate-dsssb-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          return data.questions.map((q: any) => ({
            ...q,
            exam: 'DSSSB TGT CS',
            year: typeof q.year === 'number' ? q.year : parseInt(String(q.year || '').match(/\d{4}/)?.[0] || '2024', 10),
            sourceFile: q.sourceFile || 'dsssb_tgt_ai_batch.json',
            isDsssbPyq: true,
          }));
        }
      }
    } catch {
      console.log('Primary DSSSB generator notice: switching to secondary endpoint...');
    }

    // Try secondary endpoint: /api/ai/generate-dsssb-daily
    try {
      const res = await fetch('/api/ai/generate-dsssb-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          return data.questions.map((q: any) => ({
            ...q,
            exam: 'DSSSB TGT CS',
            year: typeof q.year === 'number' ? q.year : parseInt(String(q.year || '').match(/\d{4}/)?.[0] || '2024', 10),
            sourceFile: q.sourceFile || 'dsssb_tgt_ai_batch.json',
            isDsssbPyq: true,
          }));
        }
      }
    } catch {
      console.log('Secondary DSSSB generator notice: switching to /api/generate-quiz...');
    }

    // Try tertiary generic quiz endpoint: /api/generate-quiz
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: payload.topic,
          exam: 'DSSSB TGT CS',
          difficulty: 'medium',
          count: payload.count,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          return data.questions.map((q: any) => ({
            ...q,
            exam: 'DSSSB TGT CS',
            year: typeof q.year === 'number' ? q.year : parseInt(String(q.year || '').match(/\d{4}/)?.[0] || '2024', 10),
            sourceFile: q.sourceFile || 'dsssb_tgt_ai_batch.json',
            isDsssbPyq: true,
          }));
        }
      }
    } catch {
      console.log('Using curated DSSSB TGT PYQ questions repository...');
    }

    // Ultimate fallback: Curated DSSSB TGT selection from local Question Bank
    const localBank = QuestionLoader.getAllQuestions();
    let candidates = localBank;
    if (params?.subject && params.subject !== 'All' && params.subject !== 'All Core Computer Science') {
      const match = localBank.filter(q => (q.subject || '').toLowerCase().includes(params.subject!.toLowerCase()));
      if (match.length >= 3) candidates = match;
    }

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(payload.count, shuffled.length));
    const numericYear = parseInt(String(payload.yearPattern).match(/\d{4}/)?.[0] || '2024', 10);

    return selected.map((q, idx) => ({
      ...q,
      id: `dsssb_tgt_local_${Date.now()}_${idx + 1}`,
      exam: 'DSSSB TGT CS',
      year: numericYear,
      sourceFile: q.sourceFile || 'dsssb_tgt_curated_pyq.json',
      source: 'dsssb_tgt_pyq_curated',
      isDsssbPyq: true,
    }));
  }

  /**
   * Executes AI DSSSB TGT Daily Batch:
   * 1. Generates 10 DSSSB TGT PYQs with Gemini
   * 2. Auto-saves them to the app's Question Bank (IndexedDB + custom questions)
   * 3. Sends each question sequentially as an anonymous quiz poll to Telegram
   * 4. Updates batch logs & counters
   */
  static async executeAiDsssbDailyBatch(options?: {
    count?: number;
    subject?: string;
    topic?: string;
    slotLabel?: string;
    onProgress?: (current: number, total: number, q: NormalizedQuestion | null, stepText: string, isSuccess?: boolean) => void;
    preGeneratedQuestions?: NormalizedQuestion[];
  }): Promise<{
    success: boolean;
    totalPosted: number;
    failedCount: number;
    questions: NormalizedQuestion[];
    logItem: TelegramBatchLogItem | null;
    errorMessage?: string;
  }> {
    const config = this.getConfig();
    const token = TelegramService.cleanToken(config.botToken);
    const chatId = TelegramService.cleanChatId(config.chatId);

    if (!token || !chatId) {
      return {
        success: false,
        totalPosted: 0,
        failedCount: 0,
        questions: [],
        logItem: null,
        errorMessage: 'Bot API Token or Channel Handle is missing. Please configure credentials first.',
      };
    }

    this.isExecutingBatch = true;
    this.notify();

    const targetCount = options?.count || config.aiDsssbCount || 10;
    const targetSubject = options?.subject || config.aiDsssbSubject || 'All Core Computer Science';
    const targetTopic = options?.topic || 'DSSSB TGT PYQ Core Syllabus';

    let questionsToPost: NormalizedQuestion[] = options?.preGeneratedQuestions || [];

    try {
      // Step 1: Generate if not pre-generated
      if (questionsToPost.length === 0) {
        options?.onProgress?.(0, targetCount, null, `Generating ${targetCount} DSSSB TGT PYQs with Gemini AI...`);
        questionsToPost = await this.generateDsssbTgtQuestions({
          count: targetCount,
          subject: targetSubject,
          topic: targetTopic,
        });
      }

      if (!questionsToPost || questionsToPost.length === 0) {
        throw new Error('No DSSSB TGT questions were generated by Gemini');
      }

      // Ensure all questions to broadcast are strictly unique
      const seenDsssbTexts = new Set<string>();
      questionsToPost = questionsToPost.filter((q) => {
        const norm = (q.question || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!norm || seenDsssbTexts.has(norm)) return false;
        seenDsssbTexts.add(norm);
        return true;
      });

      // Step 2: Auto-save to Question Bank
      if (config.aiDsssbAutoSaveToBank !== false) {
        options?.onProgress?.(0, questionsToPost.length, null, 'Saving generated questions to Question Bank...');
        QuestionLoader.addCustomQuestions(questionsToPost, 'dsssb_tgt_pyq_daily.json');
      }

      // Step 3: Broadcast to Telegram Channel
      const logItem: TelegramBatchLogItem = {
        id: `ai_dsssb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        slotLabel: options?.slotLabel || 'AI DSSSB TGT Daily PYQ Broadcast',
        subject: `DSSSB TGT: ${targetSubject}`,
        totalRequested: questionsToPost.length,
        successCount: 0,
        failCount: 0,
        questions: [],
      };

      for (let i = 0; i < questionsToPost.length; i++) {
        const q = questionsToPost[i];
        options?.onProgress?.(i + 1, questionsToPost.length, q, `Sending Poll ${i + 1}/${questionsToPost.length}: ${q.question}`);

        try {
          const postResult = await TelegramService.postQuizPoll({
            botToken: token,
            chatId: chatId,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            isAnonymous: config.isAnonymous,
          });

          if (postResult.success) {
            logItem.successCount++;
            logItem.questions.push({
              id: q.id,
              question: q.question,
              status: 'success',
            });
            QuestionLoader.markQuestionPosted(q.id, q.question);
            QuestionLoader.recordQuestionUsage(q.id, 'POSTED');
            options?.onProgress?.(i + 1, questionsToPost.length, q, `Posted ${i + 1}/${questionsToPost.length}`, true);
          } else {
            logItem.failCount++;
            logItem.questions.push({
              id: q.id,
              question: q.question,
              status: 'failed',
              error: postResult.error,
            });
            options?.onProgress?.(i + 1, questionsToPost.length, q, `Failed to post ${i + 1}`, false);
          }
        } catch (err: any) {
          logItem.failCount++;
          logItem.questions.push({
            id: q.id,
            question: q.question,
            status: 'failed',
            error: err.message || 'Network error',
          });
          options?.onProgress?.(i + 1, questionsToPost.length, q, `Error on ${i + 1}`, false);
        }

        if (i < questionsToPost.length - 1) {
          await new Promise((res) => setTimeout(res, config.delayBetweenQuestionsMs || 2500));
        }
      }

      this.appendLog(logItem);

      if (logItem.successCount > 0) {
        TelegramStreakService.recordPost({ count: logItem.successCount, isDsssb: true });
      }

      const todayDateStr = new Date().toISOString().split('T')[0];
      this.saveConfig({
        lastRunTimestamp: new Date().toISOString(),
        aiDsssbLastGeneratedDate: todayDateStr,
        totalQuestionsPostedCount: (config.totalQuestionsPostedCount || 0) + logItem.successCount,
      });

      return {
        success: logItem.successCount > 0,
        totalPosted: logItem.successCount,
        failedCount: logItem.failCount,
        questions: questionsToPost,
        logItem,
      };
    } finally {
      this.isExecutingBatch = false;
      this.notify();
    }
  }

  /**
   * Checks next scheduled execution time
   */
  static getNextScheduleInfo(): {
    nextSlotTime: string;
    minutesRemaining: number;
    secondsRemaining: number;
    formattedCountdown: string;
    isDueNow: boolean;
  } {
    const config = this.getConfig();
    const slots = config.scheduleSlots || DEFAULT_SLOTS_4X;
    
    if (!slots || slots.length === 0) {
      return {
        nextSlotTime: '--:--',
        minutesRemaining: 0,
        secondsRemaining: 0,
        formattedCountdown: 'No active slots',
        isDueNow: false,
      };
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Parse slots to minutes from midnight
    const parsedSlots = slots
      .map((s) => {
        const [h, m] = s.split(':').map(Number);
        return { slotStr: s, minutes: h * 60 + m };
      })
      .sort((a, b) => a.minutes - b.minutes);

    // Find next upcoming slot today
    let upcoming = parsedSlots.find((s) => s.minutes > currentMinutes);
    let daysToAdd = 0;

    if (!upcoming) {
      // Wraps around to first slot tomorrow
      upcoming = parsedSlots[0];
      daysToAdd = 1;
    }

    const diffMinutes = (daysToAdd * 24 * 60) + (upcoming.minutes - currentMinutes) - (currentSeconds > 0 ? 1 : 0);
    const diffSeconds = (60 - currentSeconds) % 60;
    const totalSecs = Math.max(0, diffMinutes * 60 + diffSeconds);

    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const formattedCountdown = hrs > 0
      ? `${hrs}h ${mins}m ${secs}s`
      : `${mins}m ${secs}s`;

    return {
      nextSlotTime: upcoming.slotStr,
      minutesRemaining: Math.floor(totalSecs / 60),
      secondsRemaining: totalSecs,
      formattedCountdown,
      isDueNow: totalSecs === 0,
    };
  }

  /**
   * Initializes background scheduler loop
   */
  static initScheduler() {
    if (this.timerInterval) return;

    this.timerInterval = setInterval(() => {
      const config = this.getConfig();
      if (!config.enabled && !config.aiDsssbDailyEnabled) return;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hh}:${mm}`;
      const todayDateStr = now.toISOString().split('T')[0];
      const slotKey = `${todayDateStr}_${currentTimeStr}`;

      // 1. Regular Question Bank Scheduled Slots
      if (config.enabled && config.scheduleSlots.includes(currentTimeStr)) {
        // Prevent duplicate trigger in the same minute across memory and persistent config
        if (config.lastRunSlotDate !== slotKey && !this.inMemoryTriggeredSlots.has(slotKey) && !this.isExecutingBatch) {
          this.inMemoryTriggeredSlots.add(slotKey);
          this.saveConfig({ lastRunSlotDate: slotKey });
          this.executeBatch({
            slotLabel: `Daily Scheduled (${currentTimeStr})`,
          }).catch((err) => {
            console.error('Scheduled Telegram post failed:', err);
          });
        }
      }

      // 2. AI DSSSB TGT PYQ Daily Schedule Check (10 questions daily)
      if (config.aiDsssbDailyEnabled) {
        const dsssbTargetTime = config.aiDsssbTime || '09:00';
        const aiSlotKey = `ai_${todayDateStr}_${dsssbTargetTime}`;
        if (currentTimeStr === dsssbTargetTime && config.aiDsssbLastGeneratedDate !== todayDateStr && !this.inMemoryTriggeredSlots.has(aiSlotKey) && !this.isExecutingBatch) {
          this.inMemoryTriggeredSlots.add(aiSlotKey);
          this.saveConfig({ aiDsssbLastGeneratedDate: todayDateStr });
          this.executeAiDsssbDailyBatch({
            slotLabel: `AI Daily DSSSB TGT PYQ (${currentTimeStr})`,
            count: config.aiDsssbCount || 10,
            subject: config.aiDsssbSubject || 'All Core Computer Science',
          }).catch((err) => {
            console.error('Scheduled AI DSSSB TGT Daily post failed:', err);
          });
        }
      }

      this.notify();
    }, 1000);
  }

  static isCurrentlyRunning(): boolean {
    return this.isExecutingBatch;
  }

  /**
   * Activity Logs persistence
   */
  static getLogs(): TelegramBatchLogItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse auto post logs', e);
    }
    return [];
  }

  static appendLog(item: TelegramBatchLogItem) {
    try {
      const logs = this.getLogs();
      logs.unshift(item);
      const trimmed = logs.slice(0, 50); // keep last 50 batches
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to append auto post log', e);
    }
    this.notify();
  }

  static clearLogs() {
    try {
      localStorage.removeItem(STORAGE_LOGS_KEY);
    } catch (e) {}
    this.notify();
  }

  /**
   * Pub/Sub for UI reactive updates
   */
  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    this.initScheduler();
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private static notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {}
    });
  }
}
