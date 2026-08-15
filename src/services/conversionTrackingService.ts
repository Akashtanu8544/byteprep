/**
 * BytePrep Conversion & Campaign Performance Service
 * Tracks views, likes, shares, comments, saves, followers gained, UTM link generation, and Play Store attribution.
 */

import { GeneratedContentPack, PlatformTarget } from '../types';
import { IndexedDbService } from './indexedDbService';

export interface UtmParams {
  source: string; // e.g. instagram, youtube, telegram
  medium: string; // e.g. reel, short, story, poll, bio
  campaign: string; // e.g. dsssb_dbms, kvs_cs_marathon
  contentId: string; // e.g. BP-DSSSB-DBMS-2026-001
}

export class ConversionTrackingService {
  /**
   * Generates a fully tagged UTM link for BytePrep promotions
   */
  public static buildUtmUrl(baseUrl: string, params: UtmParams): string {
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    url.searchParams.set('utm_source', params.source);
    url.searchParams.set('utm_medium', params.medium);
    url.searchParams.set('utm_campaign', params.campaign.replace(/\s+/g, '_').toLowerCase());
    url.searchParams.set('utm_content', params.contentId);
    return url.toString();
  }

  /**
   * Aggregates conversion metrics across all generated & posted content packs
   */
  public static aggregateMetrics(packs: GeneratedContentPack[]): {
    totalPacks: number;
    postedPacks: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalFollowersGained: number;
    totalClicks: number;
    totalPlayStoreVisits: number;
    totalWebsiteVisits: number;
    totalAppInstalls: number;
    platformBreakdown: Record<PlatformTarget, { views: number; engagements: number; clicks: number }>;
  } {
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let totalFollowersGained = 0;
    let totalClicks = 0;
    let totalPlayStoreVisits = 0;
    let totalWebsiteVisits = 0;
    let totalAppInstalls = 0;
    let postedPacks = 0;

    const platformBreakdown: Record<PlatformTarget, { views: number; engagements: number; clicks: number }> = {
      youtube: { views: 0, engagements: 0, clicks: 0 },
      instagram: { views: 0, engagements: 0, clicks: 0 },
      telegram: { views: 0, engagements: 0, clicks: 0 },
      facebook: { views: 0, engagements: 0, clicks: 0 },
      whatsapp: { views: 0, engagements: 0, clicks: 0 },
      other: { views: 0, engagements: 0, clicks: 0 },
      all: { views: 0, engagements: 0, clicks: 0 },
    };

    packs.forEach(p => {
      if (p.status === 'POSTED' || p.postedAt) {
        postedPacks++;
      }
      const v = p.views || 0;
      const l = p.likes || 0;
      const c = p.comments || 0;
      const s = p.shares || 0;
      const sv = p.saves || 0;
      const f = p.followersGained || 0;
      const cl = p.clicks || 0;
      const pv = p.playStoreVisits || 0;
      const wv = p.websiteVisits || 0;
      const ins = p.appInstalls || 0;

      totalViews += v;
      totalLikes += l;
      totalComments += c;
      totalShares += s;
      totalSaves += sv;
      totalFollowersGained += f;
      totalClicks += cl;
      totalPlayStoreVisits += pv;
      totalWebsiteVisits += wv;
      totalAppInstalls += ins;

      const platforms = p.platforms && p.platforms.length > 0 ? p.platforms : (['instagram'] as PlatformTarget[]);
      platforms.forEach(plat => {
        if (platformBreakdown[plat]) {
          platformBreakdown[plat].views += v;
          platformBreakdown[plat].engagements += l + c + s + sv;
          platformBreakdown[plat].clicks += cl;
        }
      });
    });

    return {
      totalPacks: packs.length,
      postedPacks,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalSaves,
      totalFollowersGained,
      totalClicks,
      totalPlayStoreVisits,
      totalWebsiteVisits,
      totalAppInstalls,
      platformBreakdown,
    };
  }

  /**
   * Updates performance log for a specific content pack and persists to IndexedDB
   */
  public static async logPerformance(
    packId: string,
    metrics: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      saves?: number;
      followersGained?: number;
      clicks?: number;
      playStoreVisits?: number;
      websiteVisits?: number;
      appInstalls?: number;
      postUrl?: string;
      notes?: string;
    }
  ): Promise<GeneratedContentPack | null> {
    const pack = await IndexedDbService.getById<GeneratedContentPack>('contentItems', packId);
    if (!pack) return null;

    if (metrics.views !== undefined) pack.views = metrics.views;
    if (metrics.likes !== undefined) pack.likes = metrics.likes;
    if (metrics.comments !== undefined) pack.comments = metrics.comments;
    if (metrics.shares !== undefined) pack.shares = metrics.shares;
    if (metrics.saves !== undefined) pack.saves = metrics.saves;
    if (metrics.followersGained !== undefined) pack.followersGained = metrics.followersGained;
    if (metrics.clicks !== undefined) pack.clicks = metrics.clicks;
    if (metrics.playStoreVisits !== undefined) pack.playStoreVisits = metrics.playStoreVisits;
    if (metrics.websiteVisits !== undefined) pack.websiteVisits = metrics.websiteVisits;
    if (metrics.appInstalls !== undefined) pack.appInstalls = metrics.appInstalls;
    if (metrics.postUrl !== undefined) pack.postUrl = metrics.postUrl;
    if (metrics.notes !== undefined) pack.notes = metrics.notes;

    pack.status = 'POSTED';
    if (!pack.postedAt) pack.postedAt = new Date().toISOString();

    await IndexedDbService.saveContentPack(pack);
    return pack;
  }
}
