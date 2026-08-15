import { NormalizedQuestion, RawQuestion, Difficulty } from '../types';

export function normalizeQuestion(raw: RawQuestion, sourceMeta: { sourceFile: string; index: number }): NormalizedQuestion {
  // Extract question text
  const questionText = (raw.question || raw.q || '').trim() || 'Question text not available.';

  // Extract options array
  const rawOptions = raw.options || raw.choices || [];
  const options = Array.isArray(rawOptions) ? rawOptions.map(opt => String(opt).trim()) : [];

  // Extract correct answer index (0-based)
  let correctAnswer = 0;
  const rawAns = raw.correctAnswer !== undefined ? raw.correctAnswer : (raw.answer !== undefined ? raw.answer : raw.ansIndex);
  
  if (typeof rawAns === 'number') {
    correctAnswer = Math.max(0, Math.min(rawAns, options.length - 1));
  } else if (typeof rawAns === 'string') {
    // If it's 'A', 'B', 'C', 'D'
    const cleanAns = rawAns.trim().toUpperCase();
    if (cleanAns === 'A' || cleanAns === '0') correctAnswer = 0;
    else if (cleanAns === 'B' || cleanAns === '1') correctAnswer = 1;
    else if (cleanAns === 'C' || cleanAns === '2') correctAnswer = 2;
    else if (cleanAns === 'D' || cleanAns === '3') correctAnswer = 3;
    else {
      // Try matching text with options
      const foundIdx = options.findIndex(opt => opt.toLowerCase() === cleanAns.toLowerCase());
      if (foundIdx !== -1) correctAnswer = foundIdx;
    }
  }

  // Extract explanation
  const explanation = (raw.explanation || raw.exp || '').trim() || 
    (options[correctAnswer] ? `The correct answer is ${options[correctAnswer]}.` : 'Explanation not available.');

  // Extract ID or create stable ID
  const cleanSourceFile = sourceMeta.sourceFile.replace(/\.json$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
  const fallbackId = `${cleanSourceFile}_q${sourceMeta.index + 1}`;
  const id = (raw.id && String(raw.id).trim()) ? String(raw.id).trim() : fallbackId;

  // Metadata
  const subject = (raw.subject || 'Computer Science').trim();
  const topic = (raw.topic || 'General').trim();
  const examRaw = raw.exam ? (Array.isArray(raw.exam) ? raw.exam.join(', ') : String(raw.exam)) : 'TGT CS';
  const exam = examRaw.trim();
  
  let difficulty: Difficulty = 'medium';
  if (raw.difficulty) {
    const diffLower = String(raw.difficulty).toLowerCase();
    if (diffLower === 'easy') difficulty = 'easy';
    else if (diffLower === 'hard') difficulty = 'hard';
  }

  return {
    id,
    question: questionText,
    options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer,
    explanation,
    subject,
    topic,
    difficulty,
    exam,
    sourceFile: sourceMeta.sourceFile,
    sourceQuestionNumber: sourceMeta.index + 1
  };
}
