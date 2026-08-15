import { GoogleGenAI, Type } from '@google/genai';

export interface GenerateQuizRequest {
  topic: string;
  exam?: string;
  difficulty?: string;
  count?: number;
}

export async function generateQuizWithGemini(params: GenerateQuizRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const count = params.count || 10;
  const topic = params.topic || 'Computer Science General Core';
  const exam = params.exam || 'DSSSB TGT/PGT CS';
  const difficulty = params.difficulty || 'medium';

  const prompt = `Generate exactly ${count} multiple choice questions (MCQs) for the topic/syllabus keyword: "${topic}".
Target Exam: ${exam}
Target Difficulty: ${difficulty}

Rules:
1. Every question must be directly related to "${topic}" and relevant for Computer Science teacher & eligibility exams (DSSSB TGT/PGT CS, KVS PGT CS, NVS, EMRS, UGC NET, HTET, STET).
2. Provide exactly 4 distinct, plausible options per question (A, B, C, D) in the 'options' array.
3. 'correctAnswer' must be an integer index (0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D).
4. 'explanation' must be comprehensive, clear, and explain why the correct option is right and break down the underlying technical concept.
5. 'subject' must be the high-level CS branch (e.g. Operating Systems, Computer Networks, DBMS, Data Structures & Algorithms, Computer Organization & Architecture, Digital Electronics, Python / C++ Programming, Software Engineering, Discrete Mathematics).
6. 'topic' must be the specific subtopic or keyword (e.g. "${topic}").
7. 'exam' should be "${exam}".
8. 'difficulty' should be "${difficulty}".
9. 'year' can be "2024-2025 Predicted PYQ".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      systemInstruction: `You are an elite Computer Science educator and question paper creator specializing in Indian & International CS teacher eligibility exams (DSSSB TGT/PGT CS, KVS PGT CS, NVS PGT, EMRS, UGC NET, HTET, STET).
You construct high-yield, conceptual, and mathematically accurate MCQs with 4 options and rigorous explanations. Return only a valid JSON array matching the specified response schema.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            subject: { type: Type.STRING },
            topic: { type: Type.STRING },
            exam: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            year: { type: Type.STRING },
          },
          required: [
            'question',
            'options',
            'correctAnswer',
            'explanation',
            'subject',
            'topic',
            'exam',
            'difficulty',
          ],
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No content returned from Gemini model');
  }

  const rawQuestions = JSON.parse(text);
  
  // Normalize and assign unique IDs
  return rawQuestions.map((q: any, index: number) => {
    const cleanId = `ai_${Date.now()}_${index + 1}`;
    const opts = Array.isArray(q.options) && q.options.length === 4 
      ? q.options.map(String) 
      : ['Option A', 'Option B', 'Option C', 'Option D'];
    
    let correct = typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
      ? q.correctAnswer 
      : 0;

    return {
      id: cleanId,
      question: String(q.question || `Question on ${topic}`).trim(),
      options: opts,
      correctAnswer: correct,
      explanation: String(q.explanation || 'Detailed explanation will be provided upon review.').trim(),
      subject: String(q.subject || 'Computer Science').trim(),
      topic: String(q.topic || topic).trim(),
      exam: String(q.exam || exam).trim(),
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : difficulty) as 'easy' | 'medium' | 'hard',
      year: String(q.year || '2024-2025 Predicted'),
      source: 'ai_generated',
    };
  });
}
