/**
 * BytePrep Multi-Voice Style Service
 * Generates script variants for 9 voice styles and handles optional browser Web Speech synthesis.
 */

import { VoiceStyle, ContentLanguage, NormalizedQuestion } from '../types';

export interface VoiceStyleConfig {
  id: VoiceStyle;
  name: string;
  category: string;
  description: string;
  speed: number;
  pitch: number;
  badge: string;
}

export const VOICE_STYLES: VoiceStyleConfig[] = [
  {
    id: 'Teacher',
    name: 'Classroom Teacher',
    category: 'Educational',
    description: 'Clear, steady, pedagogical tone ideal for concept clarity',
    speed: 1.0,
    pitch: 1.0,
    badge: '👨‍🏫 TEACHER',
  },
  {
    id: 'Energetic Creator',
    name: 'Energetic Creator',
    category: 'Viral',
    description: 'High energy, fast-paced retention booster with upbeat pauses',
    speed: 1.15,
    pitch: 1.05,
    badge: '🔥 VIRAL CREATOR',
  },
  {
    id: 'Exam Coach',
    name: 'Exam Coach',
    category: 'Exam Prep',
    description: 'Direct, focused, emphasizing negative marking traps and exam tricks',
    speed: 1.05,
    pitch: 0.95,
    badge: '🎯 EXAM COACH',
  },
  {
    id: 'Calm Educator',
    name: 'Calm Educator',
    category: 'Deep Concept',
    description: 'Soothing, methodical pacing explaining step-by-step logic',
    speed: 0.92,
    pitch: 0.98,
    badge: '🌿 CALM EDUCATOR',
  },
  {
    id: 'Rapid Fire',
    name: 'Rapid Fire Blitz',
    category: 'Speed',
    description: 'Ultra fast 10-second rapid quiz countdown pacing',
    speed: 1.25,
    pitch: 1.1,
    badge: '⚡ RAPID FIRE',
  },
  {
    id: 'News/Announcement',
    name: 'PYQ News Anchor',
    category: 'Official',
    description: 'Formal, authoritative announcement tone for official PYQ questions',
    speed: 1.0,
    pitch: 1.0,
    badge: '📢 OFFICIAL ANCHOR',
  },
  {
    id: 'Hindi Teacher',
    name: 'Hindi CS Teacher',
    category: 'Regional',
    description: 'Shuddh Hindi terminology mixed with standard CS terms',
    speed: 1.0,
    pitch: 1.0,
    badge: '🇮🇳 HINDI TEACHER',
  },
  {
    id: 'English Teacher',
    name: 'English CS Educator',
    category: 'English',
    description: 'Crisp global English technical delivery',
    speed: 1.0,
    pitch: 1.0,
    badge: '🇬🇧 ENGLISH CS',
  },
  {
    id: 'Hinglish Creator',
    name: 'Hinglish Exam Guru',
    category: 'Hinglish',
    description: 'Natural bilingual Indian exam style preserving technical terms (TCP, Deadlock, DBMS)',
    speed: 1.1,
    pitch: 1.02,
    badge: '✨ HINGLISH GURU',
  },
];

export class VoiceService {
  /**
   * Generates a tailored voice-over script for video / reel based on question, language & voice style
   */
  public static generateScript(
    question: NormalizedQuestion,
    hook: string,
    voiceStyle: VoiceStyle = 'Hinglish Creator',
    language: ContentLanguage = 'Hinglish'
  ): {
    introScript: string;
    questionScript: string;
    countdownScript: string;
    revealScript: string;
    explanationScript: string;
    ctaScript: string;
    fullScript: string;
  } {
    const correctLetter = String.fromCharCode(65 + question.correctAnswer);
    const correctOption = question.options[question.correctAnswer];
    const explanation = question.explanation;

    let introScript = hook;
    let questionScript = question.question;
    let countdownScript = 'Timer shuru ho chuka hai, comment mein apna answer likhiye!';
    let revealScript = `Sahi answer hai Option ${correctLetter}: ${correctOption}!`;
    let explanationScript = explanation;
    let ctaScript = 'Aise aur CS questions ke liye BytePrep TGT PGT CS app install kijiye.';

    if (language === 'English') {
      countdownScript = '10 seconds on the clock! Comment your answer below!';
      revealScript = `The correct answer is Option ${correctLetter}: ${correctOption}!`;
      ctaScript = 'Download BytePrep TGT PGT CS for 1,000+ CS PYQ mock tests.';
    } else if (language === 'Hindi') {
      countdownScript = '10 second ka samay shuru ho chuka hai! Apna uttar comment karein!';
      revealScript = `Sahi uttar hai Vikalp ${correctLetter}: ${correctOption}!`;
      ctaScript = 'DSSSB aur KVS Computer Science ki taiyari ke liye BytePrep app download karein.';
    }

    if (voiceStyle === 'Rapid Fire') {
      introScript = `⚡ 10 Second CS Challenge! ${hook}`;
      countdownScript = '5... 4... 3... 2... 1... Time up!';
    } else if (voiceStyle === 'Exam Coach') {
      introScript = `⚠️ DSSSB & KVS aspirants dhyan se dekhiye! ${hook}`;
      ctaScript = 'Negative marking se bachne ke liye BytePrep app par daily mocks practice karein.';
    }

    const fullScript = `${introScript} ... ${questionScript} ... Options: A, ${question.options[0]}. B, ${question.options[1]}. C, ${question.options[2]}. D, ${question.options[3]}. ... ${countdownScript} ... ${revealScript} ... ${explanationScript} ... ${ctaScript}`;

    return {
      introScript,
      questionScript,
      countdownScript,
      revealScript,
      explanationScript,
      ctaScript,
      fullScript,
    };
  }

  /**
   * Browser Web Speech API Preview (Non-blocking, graceful fallback)
   */
  public static playSpeechPreview(text: string, voiceStyle: VoiceStyle = 'Hinglish Creator'): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not available');
        return resolve();
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const styleConfig = VOICE_STYLES.find(v => v.id === voiceStyle) || VOICE_STYLES[0];

      utterance.rate = styleConfig.speed;
      utterance.pitch = styleConfig.pitch;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  public static stopSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
