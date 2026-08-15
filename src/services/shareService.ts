import { PlayResult } from '../types';

export class ShareService {
  public static async shareResult(result: PlayResult, streak: number): Promise<{ success: boolean; method: 'web-share' | 'clipboard' }> {
    const text = `⚡ BytePrep CS — 10 Second Challenge!\n\n` +
      `Question: ${result.question.question.substring(0, 80)}...\n` +
      `Result: ${result.isCorrect ? '🏆 CORRECT' : '❌ INCORRECT'}\n` +
      `Score: ${result.score} pts\n` +
      `Streak: 🔥 ${streak} Days\n\n` +
      `Can you beat my score? Practice CS MCQs on BytePrep CS!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BytePrep CS 10 Second Challenge Result',
          text: text,
          url: window.location.origin,
        });
        return { success: true, method: 'web-share' };
      } catch (e) {
        // Fallback to clipboard if share dismissed or errored
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch (e) {
      return { success: false, method: 'clipboard' };
    }
  }

  public static async shareVideoFile(blob: Blob, filename: string): Promise<boolean> {
    const file = new File([blob], filename, { type: blob.type || 'video/webm' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'BytePrep CS 10 Second Challenge Short',
          text: 'Can you solve this BytePrep CS question in 10 seconds? ⚡',
          files: [file],
        });
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
}
