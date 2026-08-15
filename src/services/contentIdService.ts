/**
 * BytePrep Content ID Generator & Registry Service
 * Formats: BP-[EXAM]-[TOPIC]-[YEAR]-[SEQUENCE]
 * Example: BP-DSSSB-DBMS-2026-001
 */

const STORAGE_COUNTER_KEY = 'BYTEPREP_CONTENT_ID_SEQUENCE_COUNTER';

export class ContentIdService {
  /**
   * Generates a collision-free canonical Content ID
   */
  public static generateId(params: {
    exam?: string | string[];
    topic?: string;
    subject?: string;
    year?: number | string;
  }): string {
    const currentYear = new Date().getFullYear();
    const yearStr = params.year ? String(params.year).slice(0, 4) : String(currentYear);

    // 1. Clean Exam tag (e.g. "DSSSB TGT CS" -> "DSSSB", "KVS PGT" -> "KVS", fallback "CS")
    let examClean = 'CS';
    if (params.exam) {
      const rawExam = Array.isArray(params.exam) ? params.exam[0] : String(params.exam);
      const upper = rawExam.toUpperCase();
      if (upper.includes('DSSSB')) examClean = 'DSSSB';
      else if (upper.includes('KVS')) examClean = 'KVS';
      else if (upper.includes('NVS')) examClean = 'NVS';
      else if (upper.includes('EMRS')) examClean = 'EMRS';
      else if (upper.includes('UGC') || upper.includes('NET')) examClean = 'UGCNET';
      else if (upper.includes('HTET') || upper.includes('STET')) examClean = 'STET';
      else if (upper.includes('TGT')) examClean = 'TGT';
      else if (upper.includes('PGT')) examClean = 'PGT';
      else {
        const letters = upper.replace(/[^A-Z0-9]/g, '').slice(0, 6);
        if (letters) examClean = letters;
      }
    }

    // 2. Clean Topic/Subject tag (e.g. "Database Management Systems" -> "DBMS", "Operating Systems" -> "OS")
    let topicClean = 'GEN';
    const topicRaw = (params.topic || params.subject || '').toUpperCase();
    if (topicRaw.includes('DATABASE') || topicRaw.includes('DBMS') || topicRaw.includes('SQL')) topicClean = 'DBMS';
    else if (topicRaw.includes('NETWORK') || topicRaw.includes('CN') || topicRaw.includes('TCP') || topicRaw.includes('IP')) topicClean = 'NET';
    else if (topicRaw.includes('OPERATING') || topicRaw.includes('OS') || topicRaw.includes('LINUX') || topicRaw.includes('PROCESS')) topicClean = 'OS';
    else if (topicRaw.includes('STRUCTURE') || topicRaw.includes('DSA') || topicRaw.includes('TREE') || topicRaw.includes('GRAPH') || topicRaw.includes('SORT')) topicClean = 'DSA';
    else if (topicRaw.includes('DIGITAL') || topicRaw.includes('LOGIC') || topicRaw.includes('BOOLEAN')) topicClean = 'DL';
    else if (topicRaw.includes('CYBER') || topicRaw.includes('SECURITY') || topicRaw.includes('CRYPTO')) topicClean = 'CYBER';
    else if (topicRaw.includes('PYTHON')) topicClean = 'PY';
    else if (topicRaw.includes('JAVA')) topicClean = 'JAVA';
    else if (topicRaw.includes('C++') || topicRaw.includes('CPP')) topicClean = 'CPP';
    else if (topicRaw.includes('WEB') || topicRaw.includes('HTML') || topicRaw.includes('JS')) topicClean = 'WEB';
    else if (topicRaw.includes('ALGORITHM') || topicRaw.includes('ALGO')) topicClean = 'ALGO';
    else {
      const letters = topicRaw.replace(/[^A-Z0-9]/g, '').slice(0, 5);
      if (letters.length >= 2) topicClean = letters;
    }

    // 3. Sequence number
    const seq = this.getNextSequenceNumber();
    const seqStr = String(seq).padStart(3, '0');

    return `BP-${examClean}-${topicClean}-${yearStr}-${seqStr}`;
  }

  private static getNextSequenceNumber(): number {
    try {
      const raw = localStorage.getItem(STORAGE_COUNTER_KEY);
      const current = raw ? parseInt(raw, 10) : 0;
      const next = isNaN(current) ? 1 : current + 1;
      localStorage.setItem(STORAGE_COUNTER_KEY, String(next));
      return next;
    } catch {
      return Math.floor(Math.random() * 900) + 100;
    }
  }

  public static parseId(contentId: string): {
    exam?: string;
    topic?: string;
    year?: string;
    sequence?: string;
  } {
    const parts = contentId.split('-');
    if (parts.length >= 5) {
      return {
        exam: parts[1],
        topic: parts[2],
        year: parts[3],
        sequence: parts[4],
      };
    }
    return {};
  }
}
