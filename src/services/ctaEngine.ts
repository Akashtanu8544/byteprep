/**
 * BytePrep Smart CTA Rotation & Management Engine
 * Manages balanced, random, and performance-based Call-to-Actions for promoting BytePrep TGT PGT CS.
 */

import { CtaEntry, PlatformTarget } from '../types';

const CTA_STORAGE_KEY = 'BYTEPREP_CREATOR_CTA_LIBRARY';

const DEFAULT_CTA_LIBRARY: CtaEntry[] = [
  {
    ctaId: 'cta_practice_general',
    text: 'Practice 1,000+ Computer Science PYQ Mock Tests with BytePrep TGT PGT CS.',
    platform: 'all',
    enabled: true,
    usageCount: 14,
    clicks: 128,
    performanceRating: 5,
    category: 'practice',
  },
  {
    ctaId: 'cta_dsssb_target',
    text: 'Prepare for DSSSB, KVS, NVS & STET Computer Science exams with BytePrep.',
    platform: 'all',
    enabled: true,
    usageCount: 19,
    clicks: 210,
    performanceRating: 5,
    category: 'exam_prep',
  },
  {
    ctaId: 'cta_playstore_download',
    text: 'Download BytePrep TGT PGT CS on Google Play Store & start practicing now!',
    platform: 'all',
    enabled: true,
    usageCount: 22,
    clicks: 340,
    performanceRating: 5,
    category: 'download',
  },
  {
    ctaId: 'cta_score_higher',
    text: 'Think you can score higher? Test yourself on BytePrep TGT PGT CS.',
    platform: 'all',
    enabled: true,
    usageCount: 9,
    clicks: 85,
    performanceRating: 4,
    category: 'practice',
  },
  {
    ctaId: 'cta_pyq_mock_tests',
    text: 'More CS PYQs, official answer keys & topic-wise mock tests available on BytePrep.',
    platform: 'all',
    enabled: true,
    usageCount: 11,
    clicks: 145,
    performanceRating: 4,
    category: 'mock_tests',
  },
  {
    ctaId: 'cta_telegram_daily',
    text: 'Join our official Telegram community for daily free CS mock quizzes & PDF notes.',
    platform: 'telegram',
    enabled: true,
    usageCount: 8,
    clicks: 95,
    performanceRating: 4,
    category: 'practice',
  },
  {
    ctaId: 'cta_speed_challenge',
    text: 'Level up your CS speed & accuracy. Install BytePrep TGT PGT CS app today.',
    platform: 'all',
    enabled: true,
    usageCount: 7,
    clicks: 72,
    performanceRating: 4,
    category: 'download',
  },
];

export class CtaEngine {
  private static loadLibrary(): CtaEntry[] {
    try {
      const raw = localStorage.getItem(CTA_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return DEFAULT_CTA_LIBRARY;
  }

  private static saveLibrary(library: CtaEntry[]): void {
    try {
      localStorage.setItem(CTA_STORAGE_KEY, JSON.stringify(library));
    } catch {}
  }

  public static getAllCtas(): CtaEntry[] {
    return this.loadLibrary();
  }

  public static addCta(cta: Omit<CtaEntry, 'ctaId' | 'usageCount'>): CtaEntry {
    const library = this.loadLibrary();
    const newEntry: CtaEntry = {
      ...cta,
      ctaId: `cta_custom_${Date.now()}`,
      usageCount: 0,
      clicks: 0,
      performanceRating: 3,
    };
    library.push(newEntry);
    this.saveLibrary(library);
    return newEntry;
  }

  public static updateCta(updated: CtaEntry): void {
    const library = this.loadLibrary();
    const idx = library.findIndex(c => c.ctaId === updated.ctaId);
    if (idx >= 0) {
      library[idx] = updated;
      this.saveLibrary(library);
    }
  }

  public static deleteCta(ctaId: string): void {
    const library = this.loadLibrary();
    const filtered = library.filter(c => c.ctaId !== ctaId);
    this.saveLibrary(filtered);
  }

  /**
   * Smart CTA Selector
   * mode: 'balanced' (least used), 'performance' (highest clicks/rating), 'random'
   */
  public static selectSmartCta(
    platform?: PlatformTarget,
    mode: 'balanced' | 'performance' | 'random' = 'balanced'
  ): CtaEntry {
    const library = this.loadLibrary().filter(c => c.enabled);
    if (library.length === 0) {
      return DEFAULT_CTA_LIBRARY[0];
    }

    const eligible = library.filter(
      c => !platform || c.platform === 'all' || c.platform === platform
    );
    const pool = eligible.length > 0 ? eligible : library;

    if (mode === 'performance') {
      const sorted = [...pool].sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
      return sorted[0];
    }

    if (mode === 'random') {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // Default 'balanced': pick the least frequently used
    const sorted = [...pool].sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));
    return sorted[0];
  }

  public static recordCtaUsage(ctaId: string): void {
    const library = this.loadLibrary();
    const item = library.find(c => c.ctaId === ctaId);
    if (item) {
      item.usageCount = (item.usageCount || 0) + 1;
      this.saveLibrary(library);
    }
  }

  public static recordCtaClick(ctaId: string): void {
    const library = this.loadLibrary();
    const item = library.find(c => c.ctaId === ctaId);
    if (item) {
      item.clicks = (item.clicks || 0) + 1;
      this.saveLibrary(library);
    }
  }
}
