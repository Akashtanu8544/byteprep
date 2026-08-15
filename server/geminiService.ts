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

export interface SuggestSeriesTitlesRequest {
  subject?: string;
  theme?: string;
  targetAudience?: string;
}

export async function suggestSeriesTitlesWithGemini(params: SuggestSeriesTitlesRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback default rich templates if API key is not yet set
    return [
      {
        titleTemplate: "10 Sec Challenge #{n} | {subject} CS Quiz 🔥",
        description: "High-energy speed challenge perfect for YouTube Shorts & Instagram Reels.",
        category: "Speed Challenge",
        sampleFormatted: "10 Sec Challenge #1 | Operating Systems CS Quiz 🔥",
        tags: ["#shorts", "#csquiz", "#10secchallenge", "#gate2026", "#computerscience"]
      },
      {
        titleTemplate: "Day #{n}: Can You Solve This in 10 Seconds? ⚡ #{subject}",
        description: "Daily habit-forming streak title with high retention rate.",
        category: "Daily Streak",
        sampleFormatted: "Day #1: Can You Solve This in 10 Seconds? ⚡ #DBMS",
        tags: ["#dailystreak", "#csexam", "#dsssb", "#ugcnet", "#reels"]
      },
      {
        titleTemplate: "Computer Science PYQ #{n}: {topic} MCQ Challenge 🎯",
        description: "Exam-oriented title optimized for serious aspirants (GATE, UGC-NET, DSSSB).",
        category: "Exam Prep",
        sampleFormatted: "Computer Science PYQ #1: Virtual Memory MCQ Challenge 🎯",
        tags: ["#gatecse", "#ugcnetcs", "#dsssbpgt", "#kvs", "#quiz"]
      },
      {
        titleTemplate: "Only 1% Can Answer #{n}! {hook} 💡",
        description: "Viral curiosity gap title maximizing comment debate and shares.",
        category: "Viral Curiosity",
        sampleFormatted: "Only 1% Can Answer #1! Can You Find the Deadlock? 💡",
        tags: ["#viralreels", "#codingquiz", "#techquiz", "#brainteaser"]
      },
      {
        titleTemplate: "Rapid Fire CS #{n}: {subject} in 15s ⏱️",
        description: "Brisk pace series branding that emphasizes quick revision.",
        category: "Rapid Fire",
        sampleFormatted: "Rapid Fire CS #1: Computer Networks in 15s ⏱️",
        tags: ["#rapidfire", "#quickrevision", "#csinterview", "#byteprep"]
      },
      {
        titleTemplate: "Master {subject} in 60 Days: Episode #{n} 🚀",
        description: "Long-running episodic masterclass format that drives profile follows.",
        category: "Episodic Series",
        sampleFormatted: "Master Operating Systems in 60 Days: Episode #1 🚀",
        tags: ["#cstutorials", "#learncs", "#codingshorts", "#devcommunity"]
      }
    ];
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const subject = params.subject || 'Computer Science (GATE, UGC NET, DSSSB)';
  const prompt = `Generate 6 distinct, high-converting social media series title formulas for YouTube Shorts, Instagram Reels, and Facebook Reels about: "${subject}".
Each title formula MUST contain the increment placeholder "{n}" (representing the episode number e.g. #1, #2, #3), and can optionally use "{subject}", "{topic}", and "{hook}".

Categories needed:
1. Speed Challenge (e.g. 10 Sec Challenge #{n})
2. Daily Streak (e.g. Day #{n} of Daily CS Quiz)
3. Exam Master PYQ (e.g. GATE/UGC-NET PYQ #{n})
4. Viral Curiosity (e.g. 99% Fail #{n})
5. Rapid Fire (e.g. Rapid Fire CS #{n})
6. Episodic Masterclass (e.g. Master CS Series #{n})

Return valid JSON according to schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      systemInstruction: 'You are an expert viral social media strategist specializing in educational YouTube Shorts, Instagram Reels, and TikTok algorithms.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            titleTemplate: { type: Type.STRING, description: 'The title template string containing {n}' },
            description: { type: Type.STRING, description: 'Why this formula converts and works well' },
            category: { type: Type.STRING, description: 'Category name' },
            sampleFormatted: { type: Type.STRING, description: 'Sample preview of the title with episode #1 filled in' },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Recommended hashtags' },
          },
          required: ['titleTemplate', 'description', 'category', 'sampleFormatted', 'tags'],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('No suggestions generated');
  return JSON.parse(text);
}

export async function generatePostCaptionsWithGemini(params: {
  questionText: string;
  options: string[];
  correctAnswerText: string;
  explanation: string;
  subject: string;
  topic: string;
  seriesTitle: string;
  seriesNumber: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      youtubeTitle: `${params.seriesTitle} #Shorts #CSQuiz`,
      youtubeDescription: `🧠 Test your Computer Science knowledge with Episode #${params.seriesNumber}!\n\nQuestion: ${params.questionText}\n\nComment your answer below (A, B, C, or D) before time runs out!\n\nSubject: ${params.subject} | Topic: ${params.topic}\n\n#BytePrep #ComputerScience #Shorts #GATE2026 #UGCNET`,
      instagramCaption: `⚡ ${params.seriesTitle}\n\nCan you crack this ${params.subject} challenge? Drop your answer in the comments! 👇\n\nSave this reel for quick exam revision 🔖\n\n#BytePrep #ComputerScience #${params.subject.replace(/[^a-zA-Z0-9]/g, '')} #Reels #CSQuiz #GATECS #UGCNETCS`,
      facebookText: `🎯 ${params.seriesTitle}\n\n${params.questionText}\n\nWhat is the correct option? Let us know in the comments!\n\n#BytePrep #ComputerScience #DailyQuiz`,
      hashtags: ['#Shorts', '#Reels', '#ComputerScience', '#BytePrep', '#CSQuiz', '#GATE2026', '#UGCNET']
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `Write optimized, engaging social media post descriptions for YouTube Shorts, Instagram Reels, and Facebook Reels for this Computer Science MCQ video:
Episode: #${params.seriesNumber}
Series Title: ${params.seriesTitle}
Subject: ${params.subject}
Topic: ${params.topic}
Question: ${params.questionText}
Options: ${params.options.join(', ')}
Correct Answer: ${params.correctAnswerText}
Explanation summary: ${params.explanation}

Provide:
1. youtubeTitle: Catchy under 100 characters title with #Shorts.
2. youtubeDescription: Engaging description with question summary, comment prompt, and relevant tags.
3. instagramCaption: Viral Instagram Reels caption with emojis, hook, comment CTA, and hashtags.
4. facebookText: Clean Facebook post copy.
5. hashtags: 7-10 trending tags.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          youtubeTitle: { type: Type.STRING },
          youtubeDescription: { type: Type.STRING },
          instagramCaption: { type: Type.STRING },
          facebookText: { type: Type.STRING },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['youtubeTitle', 'youtubeDescription', 'instagramCaption', 'facebookText', 'hashtags'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('Failed to generate post captions');
  return JSON.parse(text);
}

