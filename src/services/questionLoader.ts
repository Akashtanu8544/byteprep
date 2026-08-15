import { NormalizedQuestion, Difficulty, ContentStatus } from '../types';
import { normalizeQuestion } from './questionNormalizer';
import { IndexedDbService } from './indexedDbService';

// Import datasets statically so app works 100% offline without runtime network fetches
import cnQuestions from '../data/questions/computer_networks.json';
import dbmsQuestions from '../data/questions/dbms.json';
import osQuestions from '../data/questions/operating_systems.json';
import dsQuestions from '../data/questions/data_structures.json';
import dlCyberQuestions from '../data/questions/digital_logic_cyber.json';
import tgtMock01Questions from '../data/questions/tgt_cs_mock_01.json';

const rawDatasets: Array<{ fileName: string; data: any[] }> = [
  { fileName: 'computer_networks.json', data: cnQuestions },
  { fileName: 'dbms.json', data: dbmsQuestions },
  { fileName: 'operating_systems.json', data: osQuestions },
  { fileName: 'data_structures.json', data: dsQuestions },
  { fileName: 'digital_logic_cyber.json', data: dlCyberQuestions },
  { fileName: 'tgt_cs_mock_01.json', data: tgtMock01Questions },
];

const CUSTOM_QUESTIONS_STORAGE_KEY = 'BYTEPREP_CUSTOM_USER_QUESTIONS';
const EDITED_QUESTIONS_STORAGE_KEY = 'BYTEPREP_EDITED_QUESTIONS_OVERRIDE';

let cachedNormalizedQuestions: NormalizedQuestion[] | null = null;

export class QuestionLoader {
  private static getCustomQuestionsFromStorage(): NormalizedQuestion[] {
    try {
      const data = localStorage.getItem(CUSTOM_QUESTIONS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read custom questions from localStorage', e);
    }
    return [];
  }

  private static getEditedOverrides(): Record<string, Partial<NormalizedQuestion>> {
    try {
      const data = localStorage.getItem(EDITED_QUESTIONS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {};
  }

  public static getCustomQuestions(): NormalizedQuestion[] {
    return this.getCustomQuestionsFromStorage();
  }

  public static addCustomQuestions(
    rawQuestions: any[],
    sourceFileName: string = 'custom_upload.json',
    mergeStrategy: 'ADD' | 'SKIP_DUPLICATES' | 'REPLACE' = 'ADD'
  ): { successCount: number; totalCount: number; duplicateCount: number; errors: string[] } {
    const errors: string[] = [];
    const normalizedList: NormalizedQuestion[] = [];
    const currentCustom = this.getCustomQuestionsFromStorage();
    const existingIds = new Set(this.getAllQuestions().map(q => q.id));
    const existingQuestionsNormalized = new Set(
      this.getAllQuestions().map(q => q.question.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    let duplicateCount = 0;

    if (!Array.isArray(rawQuestions)) {
      return { successCount: 0, totalCount: 0, duplicateCount: 0, errors: ['Input is not an array of questions.'] };
    }

    rawQuestions.forEach((item, index) => {
      try {
        const norm = normalizeQuestion(item, {
          sourceFile: sourceFileName,
          index,
        });

        const normText = norm.question.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (existingQuestionsNormalized.has(normText) || existingIds.has(norm.id)) {
          duplicateCount++;
          if (mergeStrategy === 'SKIP_DUPLICATES') {
            return;
          }
          if (mergeStrategy === 'ADD') {
            norm.id = `${norm.id}_custom_${Date.now()}_${index}`;
          }
        }

        existingIds.add(norm.id);
        existingQuestionsNormalized.add(normText);
        norm.contentStatus = norm.contentStatus || 'READY';
        norm.timesUsed = norm.timesUsed || 0;
        normalizedList.push(norm);
      } catch (err: any) {
        errors.push(`Item #${index + 1}: ${err.message || 'Invalid format'}`);
      }
    });

    if (normalizedList.length > 0) {
      const updated = [...currentCustom, ...normalizedList];
      try {
        localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
        cachedNormalizedQuestions = null;

        // Async sync to IndexedDB for safety
        IndexedDbService.putBatch('questions', normalizedList).catch(err =>
          console.warn('Async IndexedDB batch sync warning:', err)
        );
      } catch (e: any) {
        errors.push(`Storage Error: ${e.message}`);
      }
    }

    return {
      successCount: normalizedList.length,
      totalCount: rawQuestions.length,
      duplicateCount,
      errors,
    };
  }

  public static updateQuestion(updated: NormalizedQuestion): boolean {
    try {
      const overrides = this.getEditedOverrides();
      overrides[updated.id] = updated;
      localStorage.setItem(EDITED_QUESTIONS_STORAGE_KEY, JSON.stringify(overrides));

      // Also check if in custom questions
      const custom = this.getCustomQuestionsFromStorage();
      const cIdx = custom.findIndex(q => q.id === updated.id);
      if (cIdx >= 0) {
        custom[cIdx] = updated;
        localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(custom));
      }

      cachedNormalizedQuestions = null;
      IndexedDbService.put('questions', updated).catch(() => {});
      return true;
    } catch (e) {
      console.warn('Failed to update question', e);
      return false;
    }
  }

  public static recordQuestionUsage(id: string, newStatus?: ContentStatus): void {
    const q = this.getQuestionById(id);
    if (!q) return;

    q.timesUsed = (q.timesUsed || 0) + 1;
    q.lastUsedAt = new Date().toISOString();
    if (newStatus) {
      q.contentStatus = newStatus;
    }
    this.updateQuestion(q);
  }

  public static markQuestionPosted(id: string): void {
    const q = this.getQuestionById(id);
    if (!q) return;

    q.posted = true;
    q.postedAt = new Date().toISOString();
    q.contentStatus = 'POSTED';
    this.updateQuestion(q);
  }

  public static removeCustomQuestion(id: string): boolean {
    try {
      const current = this.getCustomQuestionsFromStorage();
      const updated = current.filter(q => q.id !== id);
      localStorage.setItem(CUSTOM_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
      cachedNormalizedQuestions = null;
      return true;
    } catch (e) {
      return false;
    }
  }

  public static clearAllCustomQuestions(): void {
    try {
      localStorage.removeItem(CUSTOM_QUESTIONS_STORAGE_KEY);
      localStorage.removeItem(EDITED_QUESTIONS_STORAGE_KEY);
      cachedNormalizedQuestions = null;
    } catch (e) {
      console.warn(e);
    }
  }

  public static getAllQuestions(): NormalizedQuestion[] {
    if (cachedNormalizedQuestions) {
      return cachedNormalizedQuestions;
    }

    const all: NormalizedQuestion[] = [];
    const seenIds = new Set<string>();
    const overrides = this.getEditedOverrides();

    // 1. Built-in datasets
    for (const dataset of rawDatasets) {
      const items = Array.isArray(dataset.data) ? dataset.data : [];
      items.forEach((item, index) => {
        const normalized = normalizeQuestion(item, {
          sourceFile: dataset.fileName,
          index,
        });

        let finalId = normalized.id;
        if (seenIds.has(finalId)) {
          finalId = `${finalId}_${dataset.fileName.replace('.json', '')}`;
          normalized.id = finalId;
        }
        seenIds.add(finalId);

        // Apply override if user previously edited
        if (overrides[finalId]) {
          Object.assign(normalized, overrides[finalId]);
        }

        normalized.contentStatus = normalized.contentStatus || 'READY';
        normalized.timesUsed = normalized.timesUsed || 0;
        all.push(normalized);
      });
    }

    // 2. Custom User Uploaded Questions
    const customList = this.getCustomQuestionsFromStorage();
    customList.forEach(q => {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        if (overrides[q.id]) {
          Object.assign(q, overrides[q.id]);
        }
        q.contentStatus = q.contentStatus || 'READY';
        q.timesUsed = q.timesUsed || 0;
        all.unshift(q); // Custom questions visible at top
      }
    });

    cachedNormalizedQuestions = all;
    return all;
  }

  public static getQuestionById(id: string): NormalizedQuestion | null {
    const questions = this.getAllQuestions();
    return questions.find(q => q.id === id) || null;
  }

  public static getQuestionsBySubject(subject: string): NormalizedQuestion[] {
    if (!subject || subject === 'All') return this.getAllQuestions();
    return this.getAllQuestions().filter(q => q.subject.toLowerCase() === subject.toLowerCase());
  }

  public static getQuestionsByTopic(topic: string): NormalizedQuestion[] {
    if (!topic || topic === 'All') return this.getAllQuestions();
    return this.getAllQuestions().filter(q => q.topic.toLowerCase() === topic.toLowerCase());
  }

  public static getQuestionsByDifficulty(difficulty: Difficulty | 'mixed'): NormalizedQuestion[] {
    if (!difficulty || difficulty === 'mixed') return this.getAllQuestions();
    return this.getAllQuestions().filter(q => q.difficulty === difficulty);
  }

  public static getQuestionsByMock(mockId: string): NormalizedQuestion[] {
    if (!mockId || mockId === 'All') return this.getAllQuestions();
    return this.getAllQuestions().filter(q => q.sourceFile.toLowerCase().includes(mockId.toLowerCase()));
  }

  public static filterQuestions(filters?: {
    subject?: string;
    topic?: string;
    difficulty?: Difficulty | 'mixed';
    mockId?: string;
  }): NormalizedQuestion[] {
    let pool = this.getAllQuestions();
    if (!filters) return pool;

    if (filters.subject && filters.subject !== 'All') {
      pool = pool.filter(q => q.subject.toLowerCase() === filters.subject!.toLowerCase());
    }
    if (filters.topic && filters.topic !== 'All') {
      pool = pool.filter(q => q.topic.toLowerCase() === filters.topic!.toLowerCase());
    }
    if (filters.difficulty && filters.difficulty !== 'mixed') {
      pool = pool.filter(q => q.difficulty === filters.difficulty);
    }
    if (filters.mockId && filters.mockId !== 'All') {
      pool = pool.filter(q => q.sourceFile.toLowerCase().includes(filters.mockId!.toLowerCase()));
    }
    return pool;
  }

  public static getRandomQuestion(filters?: {
    subject?: string;
    topic?: string;
    difficulty?: Difficulty | 'mixed';
    mockId?: string;
    excludeIds?: string[];
  }): NormalizedQuestion {
    let pool = this.getAllQuestions();

    if (filters) {
      if (filters.subject && filters.subject !== 'All') {
        pool = pool.filter(q => q.subject.toLowerCase() === filters.subject!.toLowerCase());
      }
      if (filters.topic && filters.topic !== 'All') {
        pool = pool.filter(q => q.topic.toLowerCase() === filters.topic!.toLowerCase());
      }
      if (filters.difficulty && filters.difficulty !== 'mixed') {
        pool = pool.filter(q => q.difficulty === filters.difficulty);
      }
      if (filters.mockId && filters.mockId !== 'All') {
        pool = pool.filter(q => q.sourceFile.toLowerCase().includes(filters.mockId!.toLowerCase()));
      }
      if (filters.excludeIds && filters.excludeIds.length > 0) {
        const excludeSet = new Set(filters.excludeIds);
        const filteredPool = pool.filter(q => !excludeSet.has(q.id));
        if (filteredPool.length > 0) {
          pool = filteredPool;
        }
      }
    }

    if (pool.length === 0) {
      pool = this.getAllQuestions();
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  public static getDailyQuestion(dateStr: string): { question: NormalizedQuestion; dayNumber: number } {
    const questions = this.getAllQuestions();
    if (questions.length === 0) {
      throw new Error('No questions available in database');
    }

    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = (hash * 31 + dateStr.charCodeAt(i)) % 1000000;
    }

    const index = Math.abs(hash) % questions.length;
    const startDate = new Date('2026-01-01').getTime();
    const targetDate = new Date(dateStr).getTime();
    const diffDays = Math.max(1, Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24)) + 1);

    return {
      question: questions[index],
      dayNumber: diffDays,
    };
  }

  public static getAllSubjects(): string[] {
    const subjects = new Set<string>();
    this.getAllQuestions().forEach(q => subjects.add(q.subject));
    return Array.from(subjects).sort();
  }

  public static getAllTopics(): string[] {
    const topics = new Set<string>();
    this.getAllQuestions().forEach(q => topics.add(q.topic));
    return Array.from(topics).sort();
  }

  public static getAllMocks(): string[] {
    const mocks = new Set<string>();
    this.getAllQuestions().forEach(q => mocks.add(q.sourceFile));
    return Array.from(mocks).sort();
  }

  public static getDatasetStats() {
    const questions = this.getAllQuestions();
    const subjectsMap: Record<string, number> = {};
    const topicsMap: Record<string, number> = {};
    const mocksMap: Record<string, number> = {};
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    let withExplanations = 0;
    let unusedCount = 0;
    let postedCount = 0;

    questions.forEach(q => {
      subjectsMap[q.subject] = (subjectsMap[q.subject] || 0) + 1;
      topicsMap[q.topic] = (topicsMap[q.topic] || 0) + 1;
      mocksMap[q.sourceFile] = (mocksMap[q.sourceFile] || 0) + 1;
      if (q.difficulty === 'easy') easyCount++;
      else if (q.difficulty === 'hard') hardCount++;
      else mediumCount++;

      if (q.explanation && !q.explanation.includes('not available')) {
        withExplanations++;
      }

      if (!q.timesUsed || q.timesUsed === 0) {
        unusedCount++;
      }
      if (q.posted) {
        postedCount++;
      }
    });

    return {
      totalQuestions: questions.length,
      unusedCount,
      postedCount,
      subjectsCount: Object.keys(subjectsMap).length,
      topicsCount: Object.keys(topicsMap).length,
      mocksCount: Object.keys(mocksMap).length,
      subjects: subjectsMap,
      topics: topicsMap,
      mocks: mocksMap,
      easyCount,
      mediumCount,
      hardCount,
      withExplanations,
    };
  }
}
