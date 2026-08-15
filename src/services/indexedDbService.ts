/**
 * IndexedDB Persistent Storage Service for BytePrep Content Studio
 * Stores questions, content packages, queue items, content history, series, and analytics.
 */

import {
  NormalizedQuestion,
  GeneratedContentPack,
  ContentSeries,
  CalendarEntry,
  ContentIssueReport,
} from '../types';

const DB_NAME = 'BytePrepContentStudioDB';
const DB_VERSION = 1;

export class IndexedDbService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db: IDBDatabase = event.target.result;

        // 1. Questions Store
        if (!db.objectStoreNames.contains('questions')) {
          const qStore = db.createObjectStore('questions', { keyPath: 'id' });
          qStore.createIndex('subject', 'subject', { unique: false });
          qStore.createIndex('topic', 'topic', { unique: false });
          qStore.createIndex('contentStatus', 'contentStatus', { unique: false });
          qStore.createIndex('timesUsed', 'timesUsed', { unique: false });
        }

        // 2. AI Drafts Store
        if (!db.objectStoreNames.contains('aiDrafts')) {
          db.createObjectStore('aiDrafts', { keyPath: 'id' });
        }

        // 3. Content Packs & Queue Store
        if (!db.objectStoreNames.contains('contentItems')) {
          const cStore = db.createObjectStore('contentItems', { keyPath: 'id' });
          cStore.createIndex('status', 'status', { unique: false });
          cStore.createIndex('questionId', 'questionId', { unique: false });
          cStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 4. Content Series Store
        if (!db.objectStoreNames.contains('series')) {
          db.createObjectStore('series', { keyPath: 'id' });
        }

        // 5. Calendar Planning Store
        if (!db.objectStoreNames.contains('calendar')) {
          const calStore = db.createObjectStore('calendar', { keyPath: 'id' });
          calStore.createIndex('date', 'date', { unique: false });
        }

        // 6. Issues & Reports Store
        if (!db.objectStoreNames.contains('issues')) {
          db.createObjectStore('issues', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Generic Helpers
  public static async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB getAll error on ${storeName}:`, e);
      return [];
    }
  }

  public static async getById<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB getById error on ${storeName}:`, e);
      return null;
    }
  }

  public static async put<T>(storeName: string, item: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  public static async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async delete(storeName: string, id: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  public static async clearStore(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Domain-specific methods
  public static async saveContentPack(pack: GeneratedContentPack): Promise<GeneratedContentPack> {
    return this.put<GeneratedContentPack>('contentItems', pack);
  }

  public static async getAllContentPacks(): Promise<GeneratedContentPack[]> {
    return this.getAll<GeneratedContentPack>('contentItems');
  }

  public static async deleteContentPack(id: string): Promise<boolean> {
    return this.delete('contentItems', id);
  }

  public static async saveSeries(series: ContentSeries): Promise<ContentSeries> {
    return this.put<ContentSeries>('series', series);
  }

  public static async getAllSeries(): Promise<ContentSeries[]> {
    return this.getAll<ContentSeries>('series');
  }

  public static async deleteSeries(id: string): Promise<boolean> {
    return this.delete('series', id);
  }

  public static async saveCalendarEntry(entry: CalendarEntry): Promise<CalendarEntry> {
    return this.put<CalendarEntry>('calendar', entry);
  }

  public static async getAllCalendarEntries(): Promise<CalendarEntry[]> {
    return this.getAll<CalendarEntry>('calendar');
  }

  public static async saveIssue(issue: ContentIssueReport): Promise<ContentIssueReport> {
    return this.put<ContentIssueReport>('issues', issue);
  }

  public static async getAllIssues(): Promise<ContentIssueReport[]> {
    return this.getAll<ContentIssueReport>('issues');
  }

  public static async saveAiDrafts(drafts: NormalizedQuestion[]): Promise<void> {
    return this.putBatch<NormalizedQuestion>('aiDrafts', drafts);
  }

  public static async getAllAiDrafts(): Promise<NormalizedQuestion[]> {
    return this.getAll<NormalizedQuestion>('aiDrafts');
  }

  public static async deleteAiDraft(id: string): Promise<boolean> {
    return this.delete('aiDrafts', id);
  }
}
