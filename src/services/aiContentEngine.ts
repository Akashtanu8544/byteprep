/**
 * BytePrep AI Content & Hook Engine
 * Generates high-CTR hooks, short & detailed explanations, social captions, titles, hashtags, and runs quality validation.
 * Supports English, Hindi, and Hinglish content modes with technical term preservation.
 */

import {
  NormalizedQuestion,
  BrandKitConfig,
  ShortTemplate,
  ContentLanguage,
  VoiceStyle,
} from '../types';
import { BrandKitService } from './brandKitService';
import { CtaEngine } from './ctaEngine';

export interface GeneratedHookOption {
  text: string;
  category: 'curiosity' | 'challenge' | 'exam' | 'pyq' | 'mistake' | 'speed' | 'concept' | 'code' | 'debug';
  badge: string;
  language: ContentLanguage;
}

export interface GeneratedSocialCopy {
  youtubeTitle: string;
  youtubeDescription: string;
  reelsCaption: string;
  telegramPostText: string;
  whatsappBroadcastText: string;
  hashtags: string[];
  hashtagString: string;
  ctaText: string;
  voiceScript: string;
}

export interface LanguageSettings {
  hookLang?: ContentLanguage;
  explanationLang?: ContentLanguage;
  captionLang?: ContentLanguage;
  ctaLang?: ContentLanguage;
  voiceLang?: ContentLanguage;
}

export class AiContentEngine {
  /**
   * Generates 8-12 diverse, category-tagged hooks for any question across English, Hindi, and natural Hinglish.
   * Hinglish preserves technical terms (TCP, IP, Normalization, Deadlock, BST, SQL) without awkward translation.
   */
  public static generateHooks(
    question: NormalizedQuestion,
    language: ContentLanguage = 'Hinglish'
  ): GeneratedHookOption[] {
    const subject = question.subject || 'Computer Science';
    const topic = question.topic || 'CS Core';
    const exam = question.exam || 'DSSSB / KVS CS';

    if (language === 'Hinglish') {
      return [
        {
          text: `KYA AAP YEH ${exam.toUpperCase()} CS QUESTION 10s MEIN SOLVE KAR SAKTE HAIN? ⚡`,
          category: 'challenge',
          badge: '⚡ SPEED CHALLENGE',
          language: 'Hinglish',
        },
        {
          text: `95% CS ASPIRANTS IS ${topic.toUpperCase()} QUESTION MEIN CONFUSE HOTE HAIN! 🤯`,
          category: 'mistake',
          badge: '🤯 MISTAKE TRAP',
          language: 'Hinglish',
        },
        {
          text: `⚠️ REPEAT PYQ ALERT: ${exam.toUpperCase()} KA MOST IMPORTANT ${topic.toUpperCase()} MCQ!`,
          category: 'pyq',
          badge: '🎯 OFFICIAL PYQ',
          language: 'Hinglish',
        },
        {
          text: `STOP SCROLLING! APNE ${subject.toUpperCase()} CONCEPTS TEST KARO 🧠`,
          category: 'curiosity',
          badge: '🔍 BRAIN TEASER',
          language: 'Hinglish',
        },
        {
          text: `DSSSB / KVS CS EXAM TRAP: IS OPTION SE NEGATIVE MARKING HOGI! ⚠️`,
          category: 'exam',
          badge: '⚠️ EXAM TRAP',
          language: 'Hinglish',
        },
        {
          text: `TIMER KHATAM HONE SE PEHLE SAHI OPTION COMMENT KARO! 👇⏱️`,
          category: 'speed',
          badge: '⏱️ TIMER TEST',
          language: 'Hinglish',
        },
        {
          text: `MASTER THIS ${topic.toUpperCase()} CONCEPT IN 30 SECONDS! 💡`,
          category: 'concept',
          badge: '💡 CORE CONCEPT',
          language: 'Hinglish',
        },
        {
          text: `CAN YOU FIND THE BUG IN THIS CODE? 🐛`,
          category: 'debug',
          badge: '🐛 BUG HUNT',
          language: 'Hinglish',
        },
      ];
    }

    if (language === 'Hindi') {
      return [
        {
          text: `क्या आप इस ${exam} कंप्यूटर साइंस प्रश्न को 10 सेकंड में हल कर सकते हैं? ⚡`,
          category: 'challenge',
          badge: '⚡ SPEED CHALLENGE',
          language: 'Hindi',
        },
        {
          text: `95% अभ्यर्थी इस ${topic} प्रश्न में गलती करते हैं! 🤯`,
          category: 'mistake',
          badge: '🤯 MISTAKE TRAP',
          language: 'Hindi',
        },
        {
          text: `⚠️ महत्वपूर्ण परीक्षा प्रश्न: ${topic} का बार-बार पूछा जाने वाला MCQ!`,
          category: 'pyq',
          badge: '🎯 OFFICIAL PYQ',
          language: 'Hindi',
        },
        {
          text: `समय समाप्त होने से पहले अपना उत्तर कमेंट करें! 👇⏱️`,
          category: 'speed',
          badge: '⏱️ TIMER TEST',
          language: 'Hindi',
        },
        {
          text: `30 सेकंड में समझें ${topic} का मुख्य सिद्धांत! 💡`,
          category: 'concept',
          badge: '💡 CORE CONCEPT',
          language: 'Hindi',
        },
      ];
    }

    // Default English
    return [
      {
        text: `CAN YOU SOLVE THIS ${exam.toUpperCase()} CS QUESTION IN 10s? ⚡`,
        category: 'challenge',
        badge: '⚡ SPEED CHALLENGE',
        language: 'English',
      },
      {
        text: `95% OF ${exam.toUpperCase()} ASPIRANTS GET THIS WRONG! 🤯`,
        category: 'mistake',
        badge: '🤯 MISTAKE TRAP',
        language: 'English',
      },
      {
        text: `⚠️ REPEAT PYQ ALERT: ${topic.toUpperCase()} MCQ`,
        category: 'pyq',
        badge: '🎯 OFFICIAL PYQ',
        language: 'English',
      },
      {
        text: `STOP SCROLLING! TEST YOUR ${subject.toUpperCase()} CONCEPTS 🧠`,
        category: 'curiosity',
        badge: '🔍 BRAIN TEASER',
        language: 'English',
      },
      {
        text: `DON'T FALL FOR THIS CONFUSING OPTION IN ${topic}! ⚠️`,
        category: 'exam',
        badge: '⚠️ EXAM TRAP',
        language: 'English',
      },
      {
        text: `CAN YOU SPOT THE CORRECT OPTION BEFORE THE TIMER ENDS? ⏱️`,
        category: 'speed',
        badge: '⏱️ TIMER TEST',
        language: 'English',
      },
      {
        text: `CORE CS CONCEPT: ${topic.toUpperCase()} IN 30 SECONDS! 💡`,
        category: 'concept',
        badge: '💡 CORE CONCEPT',
        language: 'English',
      },
      {
        text: `CAN YOU FIND THE BUG IN THIS CODE SNIPPET? 🐛`,
        category: 'debug',
        badge: '🐛 BUG HUNT',
        language: 'English',
      },
    ];
  }

  /**
   * Derives crisp short explanation (for 9:16 video) and detailed explanation (for Telegram/study)
   */
  public static processExplanations(
    question: NormalizedQuestion,
    language: ContentLanguage = 'Hinglish'
  ): {
    shortExplanation: string;
    detailedExplanation: string;
  } {
    const full = question.explanation || 'Detailed explanation will be updated.';

    let shortExplanation = full;
    const sentences = full.split(/(?<=[.?!])\s+/);
    if (sentences.length > 1) {
      shortExplanation = sentences.slice(0, 2).join(' ');
    }
    if (shortExplanation.length > 220) {
      shortExplanation = shortExplanation.slice(0, 217) + '...';
    }

    if (language === 'Hinglish') {
      // Natural Hinglish framing keeping technical terms pristine
      shortExplanation = `${shortExplanation} (DSSSB & KVS exams ke liye yeh concept directly repeat hota hai).`;
    }

    return {
      shortExplanation,
      detailedExplanation: full,
    };
  }

  /**
   * Generates complete platform-specific copy tailored for YouTube, Instagram, Telegram, WhatsApp, and Voice Scripts.
   */
  public static generateSocialCopy(
    question: NormalizedQuestion,
    selectedHook: string,
    template?: ShortTemplate,
    brandKit?: BrandKitConfig,
    language: ContentLanguage = 'Hinglish',
    voiceStyle: VoiceStyle = 'Hinglish Creator',
    langSettings?: LanguageSettings
  ): GeneratedSocialCopy {
    const kit = brandKit || BrandKitService.getBrandKit();
    const smartCta = CtaEngine.selectSmartCta('all' as any, 'balanced');
    const ctaText = kit.defaultCtaText || smartCta.text;

    const subject = question.subject || 'Computer Science';
    const topic = question.topic || 'CS Fundamentals';
    const exam = question.exam || 'DSSSB / KVS / NVS TGT & PGT CS';
    const correctLetter = String.fromCharCode(65 + question.correctAnswer);
    const correctOptionText = question.options[question.correctAnswer] || '';
    const { shortExplanation, detailedExplanation } = this.processExplanations(question, language);

    // 1. YouTube Title
    const youtubeTitle = `⚡ ${selectedHook} | ${subject} (${topic}) PYQ #${question.id.slice(-4)}`;

    // 2. Curated Hashtags
    const cleanSub = subject.replace(/[^a-zA-Z0-9]/g, '');
    const cleanTop = topic.replace(/[^a-zA-Z0-9]/g, '');
    const cleanExam = exam.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

    const hashtags = [
      '#BytePrepCS',
      '#TGTCS',
      '#PGTCS',
      '#DSSSB2026',
      '#ComputerScience',
      '#KVSCS',
      '#NVSCS',
      '#UGCNETCS',
      '#CSQuiz',
      '#10sChallenge',
      '#Shorts',
      '#Reels',
      cleanSub ? `#${cleanSub}` : '#ComputerScience',
      cleanTop ? `#${cleanTop}` : '#CodingQuiz',
      cleanExam ? `#${cleanExam}` : '#GovtExam',
      '#TechExam',
    ];
    const hashtagString = hashtags.join(' ');

    // 3. YouTube Description
    const youtubeDescription = `⚡ 10-Second MCQ Challenge: ${subject} (${topic})
🎯 Target Exam: ${exam} (DSSSB / KVS / NVS / EMRS / UGC NET / STET Computer Science)

❓ Question:
${question.question}

[A] ${question.options[0]}
[B] ${question.options[1]}
[C] ${question.options[2]}
[D] ${question.options[3]}

⏱️ Comment your answer before the timer ends!

✅ Correct Answer: Option (${correctLetter}) - ${correctOptionText}
💡 Detailed Solution:
${detailedExplanation}

🚀 ${ctaText}
👉 Download App: Search "${kit.brandName}" on Google Play Store (${kit.playStoreUrl})
👉 Practice 1,000+ PYQ Mock Tests on Website: ${kit.websiteUrl}
👉 Join Telegram Channel for Daily Quizzes: ${kit.telegramUrl}

${hashtagString}`;

    // 4. Instagram Reels Caption
    const reelsCaption = `🎯 ${selectedHook}

Can you solve this ${exam} Computer Science question in 10 seconds? ⏱️

📚 Subject: ${subject}
🏷️ Topic: ${topic}

Question:
${question.question}

A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

👇 Comment your answer BEFORE the reveal!

✅ Correct Answer: (${correctLetter}) ${correctOptionText}
💡 Concept: ${shortExplanation}

📲 ${ctaText}
🔍 Search "${kit.brandName}" on Play Store to download the app!
🌐 Web practice: ${kit.websiteUrl}

Follow ${kit.instagramHandle} for daily 10-second CS challenges! 🚀

${hashtagString}`;

    // 5. Telegram Post
    const telegramPostText = `⚡ *BytePrep TGT PGT CS - Daily Quiz Challenge* ⚡
🎯 *${subject}* | *${topic}* (${exam})

*Q:* ${question.question}

A) ${question.options[0]}
B) ${question.options[1]}
C) ${question.options[2]}
D) ${question.options[3]}

⏱️ _Test your speed in 10 seconds!_

✅ *Correct Answer:* Option (${correctLetter}) - ${correctOptionText}
💡 *Explanation:* ${detailedExplanation}

📲 Practice 1,000+ Subject & Mock PYQs:
🔍 Search *BytePrep TGT PGT CS* on Play Store
🌐 Website: ${kit.websiteUrl}
📢 Channel: ${kit.telegramUrl}`;

    // 6. WhatsApp Broadcast
    const whatsappBroadcastText = `🔥 *BytePrep CS Challenge* 🔥
*${subject}* - *${topic}*

*Q:* ${question.question}

(A) ${question.options[0]}
(B) ${question.options[1]}
(C) ${question.options[2]}
(D) ${question.options[3]}

✅ *Answer:* Option (${correctLetter}) - ${correctOptionText}
💡 *Why:* ${shortExplanation}

🚀 Download *BytePrep TGT PGT CS* App on Play Store: ${kit.playStoreUrl || kit.websiteUrl}`;

    // 7. Voice Script
    const voiceScript = `${selectedHook} ... Question: ${question.question} ... Options: A, ${question.options[0]}. B, ${question.options[1]}. C, ${question.options[2]}. D, ${question.options[3]}. ... Sahi answer hai Option ${correctLetter}: ${correctOptionText}. ... ${shortExplanation} ... ${ctaText}`;

    return {
      youtubeTitle,
      youtubeDescription,
      reelsCaption,
      telegramPostText,
      whatsappBroadcastText,
      hashtags,
      hashtagString,
      ctaText,
      voiceScript,
    };
  }

  /**
   * Validates question quality, formatting, and technical soundness.
   */
  public static validateQuestionQuality(question: NormalizedQuestion | any): {
    score: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let score = 100;

    if (!question.question || question.question.trim().length < 10) {
      warnings.push('Question statement is too short or empty');
      score -= 30;
    }

    if (!question.options || question.options.length !== 4) {
      warnings.push('Question must have exactly 4 options (A, B, C, D)');
      score -= 40;
    } else {
      const emptyOpts = question.options.filter((o: string) => !o || o.trim().length === 0);
      if (emptyOpts.length > 0) {
        warnings.push(`${emptyOpts.length} option(s) are blank`);
        score -= 25;
      }
    }

    if (
      question.correctAnswer === undefined ||
      question.correctAnswer < 0 ||
      question.correctAnswer > 3
    ) {
      warnings.push('Correct answer index must be 0, 1, 2, or 3');
      score -= 40;
    }

    if (!question.explanation || question.explanation.trim().length < 15) {
      warnings.push('Explanation is too short. Provide clear rationale for learners.');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      warnings,
    };
  }
}
