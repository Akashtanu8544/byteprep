/**
 * BytePrep Content Gap Finder Service
 * Identifies underrepresented CS subjects, topics, and exams in posted content.
 */

import { NormalizedQuestion, GeneratedContentPack } from '../types';
import { QuestionLoader } from './questionLoader';

export interface TopicGapReport {
  subject: string;
  topic: string;
  totalQuestions: number;
  postedCount: number;
  unpostedCount: number;
  coveragePercentage: number;
  status: 'critical_gap' | 'moderate' | 'well_covered';
  recommendation: string;
}

export interface ContentGapAnalysis {
  totalQuestions: number;
  totalPosted: number;
  overallCoverage: number;
  subjectBreakdown: Record<
    string,
    {
      total: number;
      posted: number;
      coverage: number;
    }
  >;
  topGaps: TopicGapReport[];
  recommendations: string[];
}

export class GapFinderService {
  /**
   * Runs comprehensive gap analysis comparing all questions against posted items
   */
  public static analyze(
    allQuestions: NormalizedQuestion[],
    postedPacks: GeneratedContentPack[]
  ): ContentGapAnalysis {
    const totalQuestions = allQuestions.length;
    const postedQuestionIds = new Set(
      postedPacks
        .filter(p => p.status === 'POSTED' || p.postedAt !== null)
        .map(p => p.questionId)
    );

    // Also consider questions marked as posted in their metadata
    allQuestions.forEach(q => {
      if (q.posted) postedQuestionIds.add(q.id);
    });

    const totalPosted = postedQuestionIds.size;
    const overallCoverage =
      totalQuestions > 0 ? Math.round((totalPosted / totalQuestions) * 100) : 0;

    const subjectMap: Record<string, { total: number; posted: number; coverage: number }> = {};
    const topicMap: Record<string, { subject: string; topic: string; total: number; posted: number }> = {};

    allQuestions.forEach(q => {
      const sub = q.subject || 'General CS';
      const top = q.topic || 'General';
      const key = `${sub}:::${top}`;
      const isPosted = postedQuestionIds.has(q.id);

      if (!subjectMap[sub]) {
        subjectMap[sub] = { total: 0, posted: 0, coverage: 0 };
      }
      subjectMap[sub].total++;
      if (isPosted) subjectMap[sub].posted++;

      if (!topicMap[key]) {
        topicMap[key] = { subject: sub, topic: top, total: 0, posted: 0 };
      }
      topicMap[key].total++;
      if (isPosted) topicMap[key].posted++;
    });

    // Calculate subject coverages
    Object.keys(subjectMap).forEach(sub => {
      const s = subjectMap[sub];
      s.coverage = s.total > 0 ? Math.round((s.posted / s.total) * 100) : 0;
    });

    // Generate topic gap reports
    const gapReports: TopicGapReport[] = Object.values(topicMap).map(t => {
      const unposted = t.total - t.posted;
      const coverage = t.total > 0 ? Math.round((t.posted / t.total) * 100) : 0;

      let status: 'critical_gap' | 'moderate' | 'well_covered' = 'well_covered';
      let rec = `${t.topic} is well represented.`;

      if (t.posted === 0) {
        status = 'critical_gap';
        rec = `Zero posts created for "${t.topic}". High priority for upcoming reels!`;
      } else if (coverage < 30) {
        status = 'critical_gap';
        rec = `Only ${coverage}% of "${t.topic}" questions posted. ${unposted} fresh questions waiting.`;
      } else if (coverage < 60) {
        status = 'moderate';
        rec = `Moderate coverage for "${t.topic}". Consider generating 2-3 reels this week.`;
      }

      return {
        subject: t.subject,
        topic: t.topic,
        totalQuestions: t.total,
        postedCount: t.posted,
        unpostedCount: unposted,
        coveragePercentage: coverage,
        status,
        recommendation: rec,
      };
    });

    // Sort by most critical gaps (highest unposted count with 0 or low coverage)
    gapReports.sort((a, b) => {
      if (a.coveragePercentage !== b.coveragePercentage) {
        return a.coveragePercentage - b.coveragePercentage;
      }
      return b.unpostedCount - a.unpostedCount;
    });

    // High-level recommendations
    const recommendations: string[] = [];
    const criticalTopics = gapReports.filter(g => g.status === 'critical_gap');
    if (criticalTopics.length > 0) {
      const top3 = criticalTopics.slice(0, 3).map(g => g.topic).join(', ');
      recommendations.push(`Urgent: Generate content for underrepresented topics: ${top3}.`);
    }

    const underrepresentedSubjects = Object.entries(subjectMap)
      .filter(([_, data]) => data.coverage < 20 && data.total >= 5)
      .map(([sub]) => sub);
    if (underrepresentedSubjects.length > 0) {
      recommendations.push(
        `Subject Gap: ${underrepresentedSubjects.join(', ')} has less than 20% social coverage.`
      );
    }

    return {
      totalQuestions,
      totalPosted,
      overallCoverage,
      subjectBreakdown: subjectMap,
      topGaps: gapReports.slice(0, 10),
      recommendations,
    };
  }

  /**
   * Matches questions from Question Bank specifically to fill a gap
   */
  public static getQuestionsForGap(
    subject: string,
    topic: string,
    limit: number = 5
  ): NormalizedQuestion[] {
    const all = QuestionLoader.getAllQuestions();
    const matching = all.filter(
      q =>
        q.subject.toLowerCase() === subject.toLowerCase() &&
        q.topic.toLowerCase() === topic.toLowerCase() &&
        (!q.timesUsed || q.timesUsed === 0)
    );

    if (matching.length >= limit) {
      return matching.slice(0, limit);
    }

    // Fallback to any unposted questions in subject
    const subjectMatches = all.filter(
      q => q.subject.toLowerCase() === subject.toLowerCase() && (!q.timesUsed || q.timesUsed === 0)
    );
    return subjectMatches.slice(0, limit);
  }
}
