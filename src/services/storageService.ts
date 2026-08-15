import { ChallengeSettings, UserStats, DailyChallengeState, GeneratedShortRecord } from '../types';

const SETTINGS_KEY = 'BYTEPREP_CHALLENGE_SETTINGS';
const STATS_KEY = 'BYTEPREP_CHALLENGE_STATS';
const DAILY_KEY_PREFIX = 'BYTEPREP_DAILY_STATE_';
const SHORTS_KEY = 'BYTEPREP_SHORTS_METADATA';

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
      localStorage.setItem(`${DAILY_KEY_PREFIX}${state.date}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save daily state', e);
    }
  }

  public static getShortsRecords(): GeneratedShortRecord[] {
    try {
      const data = localStorage.getItem(SHORTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read shorts records', e);
    }
    return [];
  }

  public static recordShortGenerated(questionId: string, template: string, theme: string): GeneratedShortRecord[] {
    const records = this.getShortsRecords();
    const now = new Date().toISOString();
    const newRecord: GeneratedShortRecord = {
      id: `short-${Date.now()}`,
      questionId,
      template,
      templateId: template,
      theme,
      themeId: theme,
      hook: '',
      videoDuration: 30,
      createdAt: now,
      generatedAt: now,
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
}
