/**
 * BytePrep Content Selection Engine & Duplicate Detection System
 * Intelligent scoring and diversity filtering to optimize batch creation and prevent repetition.
 */

import { NormalizedQuestion, Difficulty, GeneratedContentPack } from '../types';

export type DiversityMode =
  | 'balanced'
  | 'topic-focus'
  | 'exam-focus'
  | 'fresh-questions'
  | 'best-performing'
  | 'random-weighted';

export interface SelectionFilterOptions {
  subject?: string;
  topic?: string;
  exam?: string;
  difficulty?: Difficulty | 'mixed';
  mode?: DiversityMode;
  targetCount?: number;
  excludeIds?: string[];
  recentHistoryIds?: string[];
  bestPerformingTopics?: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  severity: 'none' | 'exact' | 'normalized' | 'high_similarity';
  similarityPercentage: number;
  matchedContent?: {
    id: string;
    question: string;
    topic: string;
    createdAt?: string;
    status?: string;
    templateId?: string;
  };
  message?: string;
}

export class ContentSelectionEngine {
  /**
   * Normalizes question text for robust comparison
   */
  public static normalizeQuestionText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Calculates word token Jaccard similarity (0 to 100%)
   */
  public static calculateTokenSimilarity(strA: string, strB: string): number {
    const tokensA = new Set(strA.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
    const tokensB = new Set(strB.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersectionCount = 0;
    tokensA.forEach(token => {
      if (tokensB.has(token)) intersectionCount++;
    });

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return Math.round((intersectionCount / unionCount) * 100);
  }

  /**
   * Checks if a question has already been generated or posted
   */
  public static checkDuplicates(
    question: NormalizedQuestion,
    existingContent: GeneratedContentPack[]
  ): DuplicateCheckResult {
    const normTarget = this.normalizeQuestionText(question.question);

    for (const item of existingContent) {
      // Level 1: Exact question ID match
      if (item.questionId === question.id) {
        return {
          isDuplicate: true,
          severity: 'exact',
          similarityPercentage: 100,
          matchedContent: {
            id: item.id,
            question: item.question.question,
            topic: item.question.topic,
            createdAt: item.createdAt,
            status: item.status,
            templateId: item.templateId,
          },
          message: 'Exact question was already generated in Content Pack history.',
        };
      }

      // Level 2: Normalized exact string match
      const normExisting = this.normalizeQuestionText(item.question.question);
      if (normExisting === normTarget) {
        return {
          isDuplicate: true,
          severity: 'normalized',
          similarityPercentage: 100,
          matchedContent: {
            id: item.id,
            question: item.question.question,
            topic: item.question.topic,
            createdAt: item.createdAt,
            status: item.status,
            templateId: item.templateId,
          },
          message: 'Identical question text was already used with a different ID.',
        };
      }

      // Level 3 & 4: High Semantic/Token Similarity (> 75%)
      const similarity = this.calculateTokenSimilarity(question.question, item.question.question);
      if (similarity >= 75) {
        return {
          isDuplicate: true,
          severity: 'high_similarity',
          similarityPercentage: similarity,
          matchedContent: {
            id: item.id,
            question: item.question.question,
            topic: item.question.topic,
            createdAt: item.createdAt,
            status: item.status,
            templateId: item.templateId,
          },
          message: `High similarity (${similarity}%) with previously generated content.`,
        };
      }
    }

    return {
      isDuplicate: false,
      severity: 'none',
      similarityPercentage: 0,
    };
  }

  /**
   * Scores questions using weighted criteria to pick the optimal question pool
   */
  public static scoreQuestion(
    q: NormalizedQuestion,
    options: SelectionFilterOptions,
    recentTopicCounts: Record<string, number> = {}
  ): number {
    let score = 50; // base score

    // 1. Freshness & Unused Bonus
    const timesUsed = q.timesUsed || 0;
    if (timesUsed === 0 && !q.posted) {
      score += 40; // High bonus for completely fresh questions
    } else {
      score -= Math.min(30, timesUsed * 10); // Penalty for over-used questions
    }

    // 2. Recent usage penalty
    if (options.recentHistoryIds && options.recentHistoryIds.includes(q.id)) {
      const idx = options.recentHistoryIds.indexOf(q.id);
      score -= Math.max(10, 40 - idx * 2);
    }

    // 3. Topic Diversity Balancing (penalize currently saturated topics)
    const topicSaturation = recentTopicCounts[q.topic] || 0;
    score -= topicSaturation * 15;

    // 4. Performance priority for winning topics
    if (options.bestPerformingTopics && options.bestPerformingTopics.includes(q.topic)) {
      score += 25;
    }

    // 5. Exam matching priority
    if (options.exam && options.exam !== 'All') {
      if (q.exam.toLowerCase().includes(options.exam.toLowerCase())) {
        score += 20;
      }
    }

    // 6. Difficulty alignment
    if (options.difficulty && options.difficulty !== 'mixed') {
      if (q.difficulty === options.difficulty) {
        score += 15;
      }
    }

    // 7. Explanations quality bonus
    if (q.explanation && q.explanation.length > 50) {
      score += 10;
    }

    return Math.max(1, score);
  }

  /**
   * Selects an ordered, diverse list of questions for batch production
   */
  public static selectOptimalQuestions(
    allQuestions: NormalizedQuestion[],
    options: SelectionFilterOptions
  ): NormalizedQuestion[] {
    let pool = [...allQuestions];

    // Filter by subject
    if (options.subject && options.subject !== 'All') {
      pool = pool.filter(q => q.subject.toLowerCase() === options.subject!.toLowerCase());
    }

    // Filter by topic
    if (options.topic && options.topic !== 'All') {
      pool = pool.filter(q => q.topic.toLowerCase() === options.topic!.toLowerCase());
    }

    // Filter by difficulty
    if (options.difficulty && options.difficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === options.difficulty);
    }

    // Filter by explicit exclusions
    if (options.excludeIds && options.excludeIds.length > 0) {
      const excludeSet = new Set(options.excludeIds);
      pool = pool.filter(q => !excludeSet.has(q.id));
    }

    if (pool.length === 0) {
      pool = [...allQuestions];
    }

    const mode = options.mode || 'balanced';
    const targetCount = options.targetCount || 10;

    // Build topic tracking map to enforce diversity in loop
    const selected: NormalizedQuestion[] = [];
    const selectedIds = new Set<string>();
    const recentTopicCounts: Record<string, number> = {};

    for (let i = 0; i < targetCount && pool.length > 0; i++) {
      // Score available candidates in remaining pool
      const scoredCandidates = pool
        .filter(q => !selectedIds.has(q.id))
        .map(q => ({
          question: q,
          score: this.scoreQuestion(q, options, recentTopicCounts),
        }))
        .sort((a, b) => b.score - a.score);

      if (scoredCandidates.length === 0) break;

      // Select highest scored or top-tier weighted
      let chosen = scoredCandidates[0].question;

      if (mode === 'random-weighted') {
        const topPool = scoredCandidates.slice(0, Math.min(5, scoredCandidates.length));
        chosen = topPool[Math.floor(Math.random() * topPool.length)].question;
      }

      selected.push(chosen);
      selectedIds.add(chosen.id);

      // Increment topic saturation count for subsequent rounds
      recentTopicCounts[chosen.topic] = (recentTopicCounts[chosen.topic] || 0) + 1;
    }

    return selected;
  }

  /**
   * Generates a recommended daily creator question
   */
  public static getRecommendedDailyCreatorQuestion(
    allQuestions: NormalizedQuestion[],
    existingContent: GeneratedContentPack[]
  ): NormalizedQuestion {
    const postedIds = new Set(existingContent.filter(c => c.status === 'POSTED').map(c => c.questionId));
    const recentTopicMap: Record<string, number> = {};
    existingContent.slice(0, 10).forEach(c => {
      recentTopicMap[c.question.topic] = (recentTopicMap[c.question.topic] || 0) + 1;
    });

    const candidates = allQuestions
      .filter(q => !postedIds.has(q.id))
      .map(q => ({
        question: q,
        score: this.scoreQuestion(q, { mode: 'balanced' }, recentTopicMap),
      }))
      .sort((a, b) => b.score - a.score);

    return candidates.length > 0 ? candidates[0].question : allQuestions[0];
  }
}
