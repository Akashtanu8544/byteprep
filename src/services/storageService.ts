import {
  ChallengeSettings,
  UserStats,
  DailyChallengeState,
  GeneratedShortRecord,
  SocialAccountConfig,
  SeriesTitleConfig,
  ScheduledPostItem,
  AutoPilotScheduleSettings,
  NormalizedQuestion
} from '../types';

export type ShortRecord = GeneratedShortRecord & {
  title?: string;
  subject?: string;
  duration?: number;
  quality?: string;
  timestamp?: number;
  thumbnailUrl?: string;
};

const SETTINGS_KEY = 'BYTEPREP_CHALLENGE_SETTINGS';
const STATS_KEY = 'BYTEPREP_CHALLENGE_STATS';
const DAILY_KEY_PREFIX = 'BYTEPREP_DAILY_STATE_';
const SHORTS_KEY = 'BYTEPREP_SHORTS_METADATA';
const SOCIAL_ACCOUNTS_KEY = 'BYTEPREP_SOCIAL_ACCOUNTS';
const SERIES_CONFIG_KEY = 'BYTEPREP_SERIES_CONFIG';
const SCHEDULED_QUEUE_KEY = 'BYTEPREP_SCHEDULED_QUEUE';
const AUTOPILOT_SETTINGS_KEY = 'BYTEPREP_AUTOPILOT_SETTINGS';

export const DEFAULT_SOCIAL_ACCOUNTS: SocialAccountConfig[] = [
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    platform: 'youtube',
    connected: true,
    username: '@BytePrepCS',
    channelTitle: 'BytePrep CS - 10s MCQ Prep',
    accountType: 'creator',
    lastSyncAt: new Date().toISOString(),
    defaultPrivacy: 'public',
    autoAddHashtags: true,
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    platform: 'instagram',
    connected: true,
    username: 'byteprep.cs',
    channelTitle: 'BytePrep CS Reels',
    accountType: 'business',
    lastSyncAt: new Date().toISOString(),
    autoAddHashtags: true,
  },
  {
    id: 'facebook',
    name: 'Facebook Reels & Page',
    platform: 'facebook',
    connected: true,
    username: 'BytePrep Computer Science',
    channelTitle: 'BytePrep CS Official Page',
    accountType: 'business',
    lastSyncAt: new Date().toISOString(),
    autoAddHashtags: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok Creator',
    platform: 'tiktok',
    connected: true,
    username: '@byteprep_cs',
    channelTitle: 'BytePrep CS TikTok',
    accountType: 'creator',
    lastSyncAt: new Date().toISOString(),
    autoAddHashtags: true,
  },
  {
    id: 'webhook',
    name: 'Auto-Post Webhook (Zapier / Make / Buffer)',
    platform: 'webhook',
    connected: false,
    webhookUrl: '',
    accountType: 'creator',
  }
];

export const DEFAULT_SERIES_CONFIG: SeriesTitleConfig = {
  template: '10 Sec Challenge #{n} | {subject} CS Quiz 🔥',
  currentNumber: 1,
  zeroPadding: 1,
  autoIncrement: true,
  customHashtags: '#BytePrep #Shorts #Reels #CSQuiz #GATE2026 #UGCNET #10SecChallenge',
  includeSubjectInTitle: true,
  includeHookInTitle: false,
};

export const DEFAULT_AUTOPILOT_SETTINGS: AutoPilotScheduleSettings = {
  enabled: false,
  postIntervalHours: 24,
  preferredTimeOfDay: '18:00',
  targetPlatforms: ['youtube', 'instagram', 'facebook'],
  seriesConfig: DEFAULT_SERIES_CONFIG,
  autoRenderOnSchedule: true,
  notifyOnPublish: true,
};

export const DEFAULT_SETTINGS: ChallengeSettings = {
  defaultTimer: 10,
  soundEnabled: true,
  hapticsEnabled: true,
  showExplanation: true,
  autoNext: false,
  preferredDifficulty: 'mixed',
  defaultShortTheme: 'byteprep-dark',
  defaultShortHook: 'Can You Solve This in 10 Seconds?',
  ctaEnabled: true,
  appUrl: 'https://byteprep.cs/app',
};

export const DEFAULT_STATS: UserStats = {
  challengesAttempted: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  totalScore: 0,
  bestScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastChallengeDate: null,
  dailyChallengesCompleted: 0,
  recentQuestionIds: [],
  shortsGenerated: 0,
  shortsDownloaded: 0,
};

export class StorageService {
  public static getSettings(): ChallengeSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: Partial<ChallengeSettings>): ChallengeSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
    return updated;
  }

  public static getStats(): UserStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read stats from localStorage', e);
    }
    return DEFAULT_STATS;
  }

  public static recordPlayResult(
    questionId: string,
    isCorrect: boolean,
    score: number,
    isDaily: boolean = false
  ): UserStats {
    const stats = this.getStats();
    
    stats.challengesAttempted += 1;
    if (isCorrect) {
      stats.correctAnswers += 1;
    } else {
      stats.incorrectAnswers += 1;
    }

    stats.totalScore += score;
    if (score > stats.bestScore) {
      stats.bestScore = score;
    }

    // Recent question history (keep last 20)
    stats.recentQuestionIds = [questionId, ...stats.recentQuestionIds.filter(id => id !== questionId)].slice(0, 20);

    // Today's date YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    if (isDaily) {
      stats.dailyChallengesCompleted += 1;
      this.updateStreak(stats, today);
    }

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats to localStorage', e);
    }

    return stats;
  }

  private static updateStreak(stats: UserStats, todayStr: string) {
    if (stats.lastChallengeDate === todayStr) {
      return; // Already completed today
    }

    if (!stats.lastChallengeDate) {
      stats.currentStreak = 1;
    } else {
      const last = new Date(stats.lastChallengeDate);
      const curr = new Date(todayStr);
      const diffTime = curr.getTime() - last.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        stats.currentStreak += 1;
      } else if (diffDays > 1) {
        stats.currentStreak = 1; // Streak broken
      }
    }

    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    stats.lastChallengeDate = todayStr;
  }

  public static getDailyState(dateStr: string): DailyChallengeState | null {
    try {
      const data = localStorage.getItem(`${DAILY_KEY_PREFIX}${dateStr}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read daily state', e);
    }
    return null;
  }

  public static saveDailyState(state: DailyChallengeState) {
    try {
      localStorage.setItem(`${DAILY_KEY_PREFIX}${state.date || state.dateStr}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save daily state', e);
    }
  }

  public static getShortsRecords(): ShortRecord[] {
    try {
      const data = localStorage.getItem(SHORTS_KEY);
      if (data) {
        const parsed: any[] = JSON.parse(data);
        const seenIds = new Set<string>();
        return parsed.map((p, idx) => {
          let uniqueId = p.id;
          if (!uniqueId || seenIds.has(uniqueId)) {
            uniqueId = `short-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          }
          seenIds.add(uniqueId);
          return {
            ...p,
            id: uniqueId,
            title: p.title || p.hook || `Short for ${p.questionId}`,
            subject: p.subject || 'Computer Science',
            duration: p.duration || p.videoDuration || 15.0,
            quality: p.quality || '720p',
            timestamp: p.timestamp || (p.createdAt ? new Date(p.createdAt).getTime() : Date.now()),
          };
        });
      }
    } catch (e) {
      console.warn('Failed to read shorts records', e);
    }
    return [];
  }

  public static recordShortGenerated(questionId: string, template: string, theme: string): ShortRecord[] {
    const records = this.getShortsRecords();
    const now = new Date().toISOString();
    const newRecord: ShortRecord = {
      id: `short-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      questionId,
      template,
      templateId: template,
      theme,
      themeId: theme,
      hook: template,
      title: template,
      subject: 'Computer Science',
      videoDuration: 15.0,
      duration: 15.0,
      quality: '720p',
      createdAt: now,
      generatedAt: now,
      timestamp: Date.now(),
      downloaded: false,
    };
    records.unshift(newRecord);
    try {
      localStorage.setItem(SHORTS_KEY, JSON.stringify(records));
      
      const stats = this.getStats();
      stats.shortsGenerated += 1;
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to record short generated', e);
    }
    return records;
  }

  public static deleteShortRecord(id: string): ShortRecord[] {
    const records = this.getShortsRecords().filter(r => r.id !== id);
    try {
      localStorage.setItem(SHORTS_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to delete short record', e);
    }
    return records;
  }

  public static recordShortDownloaded(questionId: string) {
    const records = this.getShortsRecords();
    const found = records.find(r => r.questionId === questionId);
    if (found) {
      found.downloaded = true;
      try {
        localStorage.setItem(SHORTS_KEY, JSON.stringify(records));
        
        const stats = this.getStats();
        stats.shortsDownloaded += 1;
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      } catch (e) {
        console.warn('Failed to update downloaded status', e);
      }
    }
  }

  // ==========================================
  // SOCIAL ACCOUNTS MANAGEMENT (CONNECT ONCE)
  // ==========================================
  public static getSocialAccounts(): SocialAccountConfig[] {
    try {
      const data = localStorage.getItem(SOCIAL_ACCOUNTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read social accounts', e);
    }
    return DEFAULT_SOCIAL_ACCOUNTS;
  }

  public static saveSocialAccount(updatedAccount: SocialAccountConfig): SocialAccountConfig[] {
    const current = this.getSocialAccounts();
    const index = current.findIndex(a => a.id === updatedAccount.id);
    if (index >= 0) {
      current[index] = { ...current[index], ...updatedAccount, lastSyncAt: new Date().toISOString() };
    } else {
      current.push(updatedAccount);
    }
    try {
      localStorage.setItem(SOCIAL_ACCOUNTS_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save social account', e);
    }
    return current;
  }

  public static toggleAccountConnection(accountId: string, connected: boolean): SocialAccountConfig[] {
    const accounts = this.getSocialAccounts().map(a => 
      a.id === accountId ? { ...a, connected, lastSyncAt: new Date().toISOString() } : a
    );
    try {
      localStorage.setItem(SOCIAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to toggle account connection', e);
    }
    return accounts;
  }

  // ==========================================
  // SERIES TITLE INCREMENT ENGINE (#1, #2, #3...)
  // ==========================================
  public static getSeriesConfig(): SeriesTitleConfig {
    try {
      const data = localStorage.getItem(SERIES_CONFIG_KEY);
      if (data) {
        return { ...DEFAULT_SERIES_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read series config', e);
    }
    return DEFAULT_SERIES_CONFIG;
  }

  public static saveSeriesConfig(config: Partial<SeriesTitleConfig>): SeriesTitleConfig {
    const current = this.getSeriesConfig();
    const updated = { ...current, ...config };
    try {
      localStorage.setItem(SERIES_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save series config', e);
    }
    return updated;
  }

  public static incrementSeriesNumber(): number {
    const current = this.getSeriesConfig();
    const nextNum = current.currentNumber + 1;
    this.saveSeriesConfig({ currentNumber: nextNum });
    return nextNum;
  }

  public static formatSeriesTitle(
    template: string,
    number: number,
    zeroPadding: number = 1,
    question?: Partial<NormalizedQuestion>,
    hookText?: string
  ): string {
    const numStr = zeroPadding > 1 ? String(number).padStart(zeroPadding, '0') : String(number);
    let title = template
      .replace(/\{n\}/gi, numStr)
      .replace(/\{number\}/gi, numStr)
      .replace(/\{subject\}/gi, question?.subject || 'Computer Science')
      .replace(/\{topic\}/gi, question?.topic || 'CS Core')
      .replace(/\{exam\}/gi, question?.exam || 'GATE / DSSSB')
      .replace(/\{difficulty\}/gi, question?.difficulty || 'Medium')
      .replace(/\{hook\}/gi, hookText || '10 Sec Challenge');

    return title.trim();
  }

  // ==========================================
  // SCHEDULED AUTO-POST QUEUE
  // ==========================================
  public static getScheduledQueue(): ScheduledPostItem[] {
    try {
      const data = localStorage.getItem(SCHEDULED_QUEUE_KEY);
      if (data) {
        const parsed: any[] = JSON.parse(data);
        const seenIds = new Set<string>();
        return parsed.map((item, idx) => {
          let uniqueId = item.id;
          if (!uniqueId || seenIds.has(uniqueId)) {
            uniqueId = `post-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
          }
          seenIds.add(uniqueId);
          return { ...item, id: uniqueId };
        });
      }
    } catch (e) {
      console.warn('Failed to read scheduled queue', e);
    }
    return [];
  }

  public static saveScheduledQueue(items: ScheduledPostItem[]): void {
    try {
      localStorage.setItem(SCHEDULED_QUEUE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save scheduled queue', e);
    }
  }

  public static addToScheduledQueue(item: ScheduledPostItem): ScheduledPostItem[] {
    const queue = this.getScheduledQueue();
    queue.push(item);
    this.saveScheduledQueue(queue);
    return queue;
  }

  public static updateScheduledPost(id: string, updates: Partial<ScheduledPostItem>): ScheduledPostItem[] {
    const queue = this.getScheduledQueue().map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    this.saveScheduledQueue(queue);
    return queue;
  }

  public static removeScheduledPost(id: string): ScheduledPostItem[] {
    const queue = this.getScheduledQueue().filter(item => item.id !== id);
    this.saveScheduledQueue(queue);
    return queue;
  }

  public static clearCompletedScheduledPosts(): ScheduledPostItem[] {
    const queue = this.getScheduledQueue().filter(item => item.status !== 'published');
    this.saveScheduledQueue(queue);
    return queue;
  }

  // ==========================================
  // AUTOPILOT SCHEDULER SETTINGS
  // ==========================================
  public static getAutoPilotSettings(): AutoPilotScheduleSettings {
    try {
      const data = localStorage.getItem(AUTOPILOT_SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_AUTOPILOT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read autopilot settings', e);
    }
    return DEFAULT_AUTOPILOT_SETTINGS;
  }

  public static saveAutoPilotSettings(settings: Partial<AutoPilotScheduleSettings>): AutoPilotScheduleSettings {
    const current = this.getAutoPilotSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(AUTOPILOT_SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save autopilot settings', e);
    }
    return updated;
  }
}

