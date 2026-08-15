/**
 * BytePrep Brand Kit Service
 * Provides centralized branding parameters for all video, graphic, poll, and social copy generators.
 */

import { BrandKitConfig } from '../types';

const BRAND_KIT_KEY = 'BYTEPREP_BRAND_KIT_CONFIG';

export const DEFAULT_BRAND_KIT: BrandKitConfig = {
  brandName: 'BytePrep TGT PGT CS',
  brandTagline: 'Top 1% Computer Science Teacher Exam Preparation',
  websiteUrl: 'https://dsssbpyq.online',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.byteprep.tgtpgtcs',
  telegramUrl: 'https://t.me/BytePrepCS',
  instagramHandle: '@byteprep_cs',
  youtubeHandle: '@BytePrepCS',
  primaryColor: '#38bdf8', // sky-400
  secondaryColor: '#6366f1', // indigo-500
  accentColor: '#f59e0b', // amber-500
  fontFamily: 'Inter, system-ui, sans-serif',
  showWatermark: true,
  watermarkPosition: 'top-right',
  defaultCtaText: 'Practice more Computer Science questions with BytePrep TGT PGT CS.',
  defaultOutroDuration: 4,
};

export class BrandKitService {
  private static cachedConfig: BrandKitConfig | null = null;

  public static getBrandKit(): BrandKitConfig {
    if (this.cachedConfig) return this.cachedConfig;
    try {
      const data = localStorage.getItem(BRAND_KIT_KEY);
      if (data) {
        this.cachedConfig = { ...DEFAULT_BRAND_KIT, ...JSON.parse(data) };
        return this.cachedConfig;
      }
    } catch (e) {
      console.warn('Failed to load Brand Kit from localStorage', e);
    }
    this.cachedConfig = DEFAULT_BRAND_KIT;
    return DEFAULT_BRAND_KIT;
  }

  public static saveBrandKit(config: Partial<BrandKitConfig>): BrandKitConfig {
    const current = this.getBrandKit();
    const updated = { ...current, ...config };
    try {
      localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(updated));
      this.cachedConfig = updated;
    } catch (e) {
      console.warn('Failed to save Brand Kit', e);
    }
    return updated;
  }

  public static resetToDefault(): BrandKitConfig {
    try {
      localStorage.removeItem(BRAND_KIT_KEY);
    } catch (e) {}
    this.cachedConfig = DEFAULT_BRAND_KIT;
    return DEFAULT_BRAND_KIT;
  }
}
