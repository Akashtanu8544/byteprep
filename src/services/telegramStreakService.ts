/**
 * Service to track daily posting streaks and 30-day performance analytics
 * for Telegram quizzes and video engagement.
 */

export interface DailyActivityMetric {
  date: string; // 'YYYY-MM-DD'
  formattedDate: string; // 'Sep 11'
  dayOfWeek: string; // 'Fri'
  quizzesPosted: number;
  dsssbCount: number;
  standardCount: number;
  pollVotes: number; // Student votes / poll interaction
  videoViews: number; // Shorts / Reels video views
  videoLikes: number;
  videoShares: number;
  videoComments: number;
  videoEngagementRate: number; // Percentage, e.g. 8.4%
  isPosted: boolean;
}

export interface PostingStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDaysPosted: number;
  totalQuizzesPosted: number;
  lastPostDate: string | null;
  isPostedToday: boolean;
  streakStatus: 'ACTIVE_TODAY' | 'AT_RISK' | 'INACTIVE';
  recentDays: Array<{
    date: string;
    dayLabel: string;
    posted: boolean;
    quizzesCount: number;
    isToday: boolean;
  }>;
  monthConsistencyPercent: number;
  nextMilestoneDays: number;
  milestoneTitle: string;
}

const STREAK_STORAGE_KEY = 'BP_TELEGRAM_STREAK_DATA_V2';
const METRICS_STORAGE_KEY = 'BP_TELEGRAM_30D_METRICS_V2';

export class TelegramStreakService {
  private static listeners: Array<() => void> = [];

  /**
   * Generates a date string 'YYYY-MM-DD' taking into account offset days from today
   */
  public static getDateString(offsetDays: number = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  /**
   * Formats date string into readable short format 'Sep 11'
   */
  public static formatShortDate(dateStr: string): string {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (e) {}
    return dateStr;
  }

  /**
   * Formats day of week 'Mon', 'Tue', etc.
   */
  public static formatDayOfWeek(dateStr: string): string {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }
    } catch (e) {}
    return '';
  }

  /**
   * Initializes or loads persistent daily records map
   */
  public static getDailyRecords(): Record<string, DailyActivityMetric> {
    try {
      const raw = localStorage.getItem(METRICS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse telegram 30d metrics', e);
    }

    // Generate baseline 30-day metrics history if empty
    const initialRecords = this.generateBaseline30DayData();
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(initialRecords));
    } catch (e) {}
    return initialRecords;
  }

  /**
   * Generates realistic baseline data for the past 30 days
   * to provide immediate visual insights.
   */
  private static generateBaseline30DayData(): Record<string, DailyActivityMetric> {
    const records: Record<string, DailyActivityMetric> = {};
    const today = new Date();

    // Past 30 days (from -29 to 0)
    for (let i = -29; i <= 0; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Create realistic consistent posting activity with occasional variance
      // Days 0 to -14: high consistency (active streak)
      // Earlier days: minor gap at day -18
      const isRestDay = i === -18;
      const isPosted = !isRestDay;

      let quizzesPosted = 0;
      let dsssbCount = 0;
      let standardCount = 0;
      let pollVotes = 0;
      let videoViews = 0;
      let videoLikes = 0;
      let videoShares = 0;
      let videoComments = 0;

      if (isPosted) {
        const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
        dsssbCount = 10; // AI DSSSB TGT PYQs
        standardCount = isWeekend ? 10 : 15; // 2 or 3 regular slots (5 Qs each)
        quizzesPosted = dsssbCount + standardCount; // 20-25 questions daily

        // Student responses and votes in Telegram channel
        const avgVotesPerPoll = 35 + Math.floor(Math.abs(Math.sin(i * 1.7)) * 45);
        pollVotes = quizzesPosted * avgVotesPerPoll;

        // Video views & engagement corresponding to shorts
        const baseViews = 1800 + Math.floor(Math.abs(Math.cos(i * 0.8)) * 2400) + (i > -7 ? 1200 : 0);
        videoViews = baseViews;
        videoLikes = Math.floor(videoViews * 0.075);
        videoShares = Math.floor(videoViews * 0.018);
        videoComments = Math.floor(videoViews * 0.012);
      } else {
        // Even without quizzes, baseline video views continue
        videoViews = 850;
        videoLikes = 45;
        videoShares = 12;
        videoComments = 6;
      }

      const totalEngage = videoLikes + videoShares + videoComments;
      const videoEngagementRate = videoViews > 0 ? Number(((totalEngage / videoViews) * 100).toFixed(1)) : 0;

      records[dateStr] = {
        date: dateStr,
        formattedDate,
        dayOfWeek,
        quizzesPosted,
        dsssbCount,
        standardCount,
        pollVotes,
        videoViews,
        videoLikes,
        videoShares,
        videoComments,
        videoEngagementRate,
        isPosted,
      };
    }

    return records;
  }

  /**
   * Records newly posted quizzes into today's metric
   */
  public static recordPost(params: {
    count: number;
    isDsssb?: boolean;
    date?: string;
  }) {
    const todayStr = params.date || this.getDateString(0);
    const records = this.getDailyRecords();
    const existing = records[todayStr] || {
      date: todayStr,
      formattedDate: this.formatShortDate(todayStr),
      dayOfWeek: this.formatDayOfWeek(todayStr),
      quizzesPosted: 0,
      dsssbCount: 0,
      standardCount: 0,
      pollVotes: 0,
      videoViews: 0,
      videoLikes: 0,
      videoShares: 0,
      videoComments: 0,
      videoEngagementRate: 0,
      isPosted: false,
    };

    existing.quizzesPosted += params.count;
    if (params.isDsssb) {
      existing.dsssbCount += params.count;
    } else {
      existing.standardCount += params.count;
    }
    existing.isPosted = true;

    // Approximate dynamic votes & video multiplier
    const incrementalVotes = params.count * 42;
    existing.pollVotes += incrementalVotes;

    if (existing.videoViews === 0) {
      existing.videoViews = 1500;
      existing.videoLikes = 110;
      existing.videoShares = 25;
      existing.videoComments = 18;
    } else {
      existing.videoViews += params.count * 60;
      existing.videoLikes += Math.floor(params.count * 4.5);
      existing.videoShares += Math.floor(params.count * 1.2);
      existing.videoComments += Math.floor(params.count * 0.8);
    }

    const totalEngage = existing.videoLikes + existing.videoShares + existing.videoComments;
    existing.videoEngagementRate = Number(((totalEngage / existing.videoViews) * 100).toFixed(1));

    records[todayStr] = existing;

    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to store daily records', e);
    }

    this.notify();
  }

  /**
   * Calculates current streak, longest streak, and recent 7/14 day activity
   */
  public static getStreakInfo(): PostingStreakInfo {
    const records = this.getDailyRecords();
    const todayStr = this.getDateString(0);
    const isPostedToday = Boolean(records[todayStr]?.isPosted && records[todayStr]?.quizzesPosted > 0);

    // Calculate current streak backwards from today (or yesterday)
    let currentStreak = 0;
    let checkOffset = isPostedToday ? 0 : -1;

    // If not posted today, check if yesterday was posted
    const yesterdayStr = this.getDateString(-1);
    const isYesterdayPosted = Boolean(records[yesterdayStr]?.isPosted && records[yesterdayStr]?.quizzesPosted > 0);

    let streakStatus: 'ACTIVE_TODAY' | 'AT_RISK' | 'INACTIVE' = 'INACTIVE';
    if (isPostedToday) {
      streakStatus = 'ACTIVE_TODAY';
    } else if (isYesterdayPosted) {
      streakStatus = 'AT_RISK';
    } else {
      streakStatus = 'INACTIVE';
    }

    // Count consecutive days backward
    while (true) {
      const dateToCheck = this.getDateString(checkOffset);
      const rec = records[dateToCheck];
      if (rec && rec.isPosted && rec.quizzesPosted > 0) {
        currentStreak++;
        checkOffset--;
      } else {
        break;
      }
    }

    // Compute longest streak across all tracked history
    let longestStreak = currentStreak;
    let tempStreak = 0;
    const sortedDates = Object.keys(records).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const rec = records[sortedDates[i]];
      if (rec && rec.isPosted && rec.quizzesPosted > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Total days posted & total quizzes in last 30 days
    let totalDaysPosted = 0;
    let totalQuizzesPosted = 0;
    let lastPostDate: string | null = null;

    Object.values(records).forEach((r) => {
      if (r.isPosted && r.quizzesPosted > 0) {
        totalDaysPosted++;
        totalQuizzesPosted += r.quizzesPosted;
        if (!lastPostDate || r.date > lastPostDate) {
          lastPostDate = r.date;
        }
      }
    });

    // Month consistency percentage (out of 30 days)
    const monthConsistencyPercent = Math.min(100, Math.round((totalDaysPosted / 30) * 100));

    // Next Milestone calculation
    let nextMilestoneDays = 7;
    let milestoneTitle = '7-Day Consistent Publisher';
    if (currentStreak >= 30) {
      nextMilestoneDays = 50;
      milestoneTitle = '50-Day Master Broadcaster';
    } else if (currentStreak >= 21) {
      nextMilestoneDays = 30;
      milestoneTitle = '30-Day Legend';
    } else if (currentStreak >= 14) {
      nextMilestoneDays = 21;
      milestoneTitle = '3-Week Champion';
    } else if (currentStreak >= 7) {
      nextMilestoneDays = 14;
      milestoneTitle = '2-Week Power Broadcaster';
    } else if (currentStreak >= 3) {
      nextMilestoneDays = 7;
      milestoneTitle = '7-Day Consistent Broadcaster';
    } else {
      nextMilestoneDays = 3;
      milestoneTitle = '3-Day Starter Streak';
    }

    // Recent 7 days for the mini heat dots
    const recentDays: Array<{
      date: string;
      dayLabel: string;
      posted: boolean;
      quizzesCount: number;
      isToday: boolean;
    }> = [];

    for (let i = -6; i <= 0; i++) {
      const dStr = this.getDateString(i);
      const rec = records[dStr];
      recentDays.push({
        date: dStr,
        dayLabel: this.formatDayOfWeek(dStr),
        posted: Boolean(rec?.isPosted && rec?.quizzesPosted > 0),
        quizzesCount: rec?.quizzesPosted || 0,
        isToday: i === 0,
      });
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalDaysPosted,
      totalQuizzesPosted,
      lastPostDate,
      isPostedToday,
      streakStatus,
      recentDays,
      monthConsistencyPercent,
      nextMilestoneDays,
      milestoneTitle,
    };
  }

  /**
   * Returns array of 30-day metrics formatted for Recharts
   */
  public static get30DayMetricsArray(): DailyActivityMetric[] {
    const records = this.getDailyRecords();
    const result: DailyActivityMetric[] = [];

    for (let i = -29; i <= 0; i++) {
      const dateStr = this.getDateString(i);
      const rec = records[dateStr] || {
        date: dateStr,
        formattedDate: this.formatShortDate(dateStr),
        dayOfWeek: this.formatDayOfWeek(dateStr),
        quizzesPosted: 0,
        dsssbCount: 0,
        standardCount: 0,
        pollVotes: 0,
        videoViews: 0,
        videoLikes: 0,
        videoShares: 0,
        videoComments: 0,
        videoEngagementRate: 0,
        isPosted: false,
      };
      result.push(rec);
    }

    return result;
  }

  /**
   * Resets/regenerates 30-day analytics baseline
   */
  public static resetBaseline() {
    const baseline = this.generateBaseline30DayData();
    try {
      localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(baseline));
    } catch (e) {}
    this.notify();
  }

  /**
   * Pub/Sub listener
   */
  public static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
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
