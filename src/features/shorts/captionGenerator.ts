import { NormalizedQuestion } from '../../types';

export interface ViralContentPackage {
  titles: string[];
  selectedTitle: string;
  youtubeCaption: string;
  reelsCaption: string;
  whatsappCaption: string;
  hashtags: string[];
  hashtagString: string;
}

export function generateViralContent(
  question: NormalizedQuestion,
  hookText: string
): ViralContentPackage {
  const subject = question.subject || 'Computer Science';
  const topic = question.topic || 'CS Fundamentals';
  const exam = question.exam || 'TGT/PGT CS';
  const correctLetter = String.fromCharCode(65 + question.correctAnswer);
  const correctOptionText = question.options[question.correctAnswer] || '';

  // 1. Generate catchy, high-CTR viral titles
  const titles = [
    `Only 5% CS Aspirants Get This Right! 🤯 ${subject} Challenge`,
    `Can You Solve in 10s? ⏱️ ${subject}: ${topic} (${exam})`,
    `⚠️ DSSSB / TGT CS Trap Question! Don't Make This Mistake 😱`,
    `🔥 Repeat PYQ Alert: ${topic} MCQ | 10s Timer Challenge`,
    `Top 1% Score Challenge 🏆 ${subject} MCQ for ${exam}`,
    `⚡ 10-Second Speed Quiz: ${question.question.slice(0, 45)}...`,
  ];

  const selectedTitle = titles[0];

  // 2. Curated Trending Hashtags
  const baseSubjectTag = subject.replace(/[^a-zA-Z0-9]/g, '');
  const baseTopicTag = topic.replace(/[^a-zA-Z0-9]/g, '');
  
  const hashtags = [
    '#BytePrepCS',
    '#TGTCS',
    '#PGTCS',
    '#DSSSB2026',
    '#ComputerScience',
    '#CSQuiz',
    '#KVSCS',
    '#NVSCS',
    '#STETCS',
    '#10sChallenge',
    '#Shorts',
    '#Reels',
    '#MCQPractice',
    `#${baseSubjectTag}`,
    baseTopicTag ? `#${baseTopicTag}` : '#CodingQuiz',
    '#CSEducation',
    '#GovtExamPrep',
    '#TechExam',
    '#PyqPrep',
    '#DailyQuiz',
  ];

  const hashtagString = hashtags.join(' ');

  // 3. YouTube Shorts Optimized Caption / Description
  const youtubeCaption = `⚡ 10-Second MCQ Challenge: ${subject} (${topic})
Exam Target: ${exam} | DSSSB / KVS / NVS / STET TGT & PGT Computer Science

❓ Question: ${question.question}
A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

✅ Correct Answer: Option (${correctLetter}) - ${correctOptionText}
💡 Explanation: ${question.explanation}

🚀 Want 1,000+ Topic-wise & Mock Exam PYQs with instant timer tests?
👉 Search "BytePrep TGT PGT CS" on Google Play Store
👉 Practice online on Website: https://dsssbpyq.online

Drop your answer & score in the comments below! 👇

${hashtagString}`;

  // 4. Instagram Reels Optimized Caption
  const reelsCaption = `🎯 ${hookText.toUpperCase()}

Can you solve this ${exam} Computer Science question before the timer hits 0? ⏱️

📚 Subject: ${subject}
🏷️ Topic: ${topic}

Question:
${question.question}

A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

👇 Comment your answer BEFORE watching the reveal! 

✅ Correct Answer: (${correctLetter}) ${correctOptionText}
💡 Why: ${question.explanation}

📲 Practice 1,000+ Subject & Mock PYQs:
🔍 Search "BytePrep TGT PGT CS" on Play Store to Download App
🌐 Visit: dsssbpyq.online

Follow @BytePrepCS for daily 10-second CS challenges! 🚀

${hashtagString}`;

  // 5. WhatsApp & Telegram Status / Broadcast Message
  const whatsappCaption = `⚡ *BytePrep TGT PGT CS - 10s MCQ Challenge* ⚡
🎯 *${subject}* | *${topic}*

*Q:* ${question.question}

A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

⏱️ _Can you answer in 10 seconds?_

✅ *Correct Answer:* Option (${correctLetter}) - ${correctOptionText}
💡 *Explanation:* ${question.explanation}

📲 Download App: Search *BytePrep TGT PGT CS* on Play Store
🌐 Website Practice: https://dsssbpyq.online`;

  return {
    titles,
    selectedTitle,
    youtubeCaption,
    reelsCaption,
    whatsappCaption,
    hashtags,
    hashtagString,
  };
}
