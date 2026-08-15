/**
 * BytePrep Story Sequence Generator (1080 x 1920)
 * Generates 4-5 high-impact vertical story frames for Instagram Stories / WhatsApp Status / YouTube Stories.
 */

import { NormalizedQuestion, StoryFrame, BrandKitConfig } from '../types';
import { BrandKitService } from './brandKitService';
import JSZip from 'jszip';
import { ExportService } from './exportService';

export class StoryRenderer {
  /**
   * Builds the 5 structured frames from a single question
   */
  public static generateFrames(
    question: NormalizedQuestion,
    hookText: string,
    brandKit?: BrandKitConfig
  ): StoryFrame[] {
    const kit = brandKit || BrandKitService.getBrandKit();
    const correctLetter = String.fromCharCode(65 + question.correctAnswer);
    const correctOption = question.options[question.correctAnswer];
    const subject = question.subject || 'Computer Science';
    const topic = question.topic || 'CS Core';
    const exam = question.exam || 'DSSSB / KVS CS';

    return [
      // Frame 1: HOOK
      {
        frameIndex: 1,
        type: 'hook',
        title: '⚡ SPEED CHALLENGE',
        badge: `${exam.toUpperCase()} PYQ`,
        headline: hookText,
        subtext: `Test your ${subject} concepts before the timer ends! Swipe up for the question 👉`,
        ctaText: 'Swipe to Start ▶',
      },
      // Frame 2: QUESTION + OPTIONS
      {
        frameIndex: 2,
        type: 'question',
        title: `Q. ${subject} • ${topic}`,
        badge: 'QUESTION',
        headline: question.question,
        options: question.options,
        subtext: 'Choose your option (A, B, C, or D)',
        ctaText: 'Think & Swipe ▶',
      },
      // Frame 3: COUNTDOWN / GUESS
      {
        frameIndex: 3,
        type: 'timer',
        title: '⏱️ 10 SECONDS ON THE CLOCK',
        badge: 'LOCK YOUR ANSWER',
        headline: 'What is your final choice?',
        subtext: 'Reply to this story with your answer before checking the solution!',
        ctaText: 'Swipe for Answer Reveal ▶',
      },
      // Frame 4: CORRECT ANSWER REVEAL
      {
        frameIndex: 4,
        type: 'answer',
        title: '✅ OFFICIAL ANSWER',
        badge: 'VERIFIED SOLUTION',
        headline: `Correct Answer: Option (${correctLetter})`,
        subtext: `${correctOption}`,
        options: question.options,
        correctOptionIndex: question.correctAnswer,
        ctaText: 'Swipe for Explanation ▶',
      },
      // Frame 5: EXPLANATION + BYTEPREP CTA
      {
        frameIndex: 5,
        type: 'cta',
        title: '💡 CONCEPT BREAKDOWN',
        badge: 'BYTEPREP CS PREP',
        headline: 'Detailed Explanation',
        explanation: question.explanation,
        subtext: `🚀 ${kit.defaultCtaText}`,
        ctaText: `Download ${kit.brandName} App on Google Play Store`,
      },
    ];
  }

  /**
   * Renders a single story frame on high-resolution 1080x1920 HTML Canvas
   */
  public static renderFrameToCanvas(
    frame: StoryFrame,
    question: NormalizedQuestion,
    brandKit?: BrandKitConfig
  ): HTMLCanvasElement {
    const kit = brandKit || BrandKitService.getBrandKit();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 1. Base Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Subtle Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 0; y < 1920; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Glowing Neon Orbs
    const radGrad = ctx.createRadialGradient(540, 400, 10, 540, 400, 600);
    radGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    radGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Top Header Badge
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    this.roundRect(ctx, 80, 100, 920, 120, 24, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 80, 100, 920, 120, 24, false, true);

    // Header text
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(kit.brandName.toUpperCase(), 120, 172);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`STORY ${frame.frameIndex} / 5`, 960, 172);

    // Category Tag Pill
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    this.roundRect(ctx, 80, 260, 360, 60, 16, true, false);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(frame.badge, 260, 302);

    // Main Content Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    this.roundRect(ctx, 80, 350, 920, 1200, 36, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 80, 350, 920, 1200, 36, false, true);

    // Frame Specific Rendering
    if (frame.type === 'hook') {
      // Big Hook Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px sans-serif';
      ctx.textAlign = 'center';
      this.wrapText(ctx, frame.headline, 540, 650, 820, 84);

      if (frame.subtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 36px sans-serif';
        this.wrapText(ctx, frame.subtext, 540, 1100, 800, 56);
      }
    } else if (frame.type === 'question') {
      // Question text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      this.wrapText(ctx, frame.headline, 540, 480, 820, 60);

      // Options list
      if (frame.options) {
        frame.options.forEach((opt, idx) => {
          const optY = 820 + idx * 160;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
          this.roundRect(ctx, 130, optY, 820, 125, 20, true, false);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          this.roundRect(ctx, 130, optY, 820, 125, 20, false, true);

          // Option Letter
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`[${String.fromCharCode(65 + idx)}]`, 165, optY + 76);

          // Option text
          ctx.fillStyle = '#f8fafc';
          ctx.font = '600 32px sans-serif';
          ctx.fillText(opt.length > 32 ? opt.slice(0, 30) + '...' : opt, 245, optY + 76);
        });
      }
    } else if (frame.type === 'timer') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 56px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⏳ 10s GUESS TIME', 540, 550);

      // Big Glowing Timer Ring
      ctx.beginPath();
      ctx.arc(540, 850, 180, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 20;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(540, 850, 180, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 20;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 110px sans-serif';
      ctx.fillText('10s', 540, 885);

      if (frame.subtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 36px sans-serif';
        this.wrapText(ctx, frame.subtext, 540, 1220, 800, 54);
      }
    } else if (frame.type === 'answer') {
      ctx.fillStyle = '#10b981';
      ctx.font = '900 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(frame.headline, 540, 480);

      // Options showing highlighted correct answer
      if (frame.options && frame.correctOptionIndex !== undefined) {
        frame.options.forEach((opt, idx) => {
          const optY = 600 + idx * 170;
          const isCorrect = idx === frame.correctOptionIndex;

          ctx.fillStyle = isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.4)';
          this.roundRect(ctx, 130, optY, 820, 135, 20, true, false);
          ctx.strokeStyle = isCorrect ? '#10b981' : 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = isCorrect ? 4 : 1;
          this.roundRect(ctx, 130, optY, 820, 135, 20, false, true);

          ctx.fillStyle = isCorrect ? '#10b981' : '#64748b';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`[${String.fromCharCode(65 + idx)}]`, 165, optY + 80);

          ctx.fillStyle = isCorrect ? '#ffffff' : '#94a3b8';
          ctx.font = isCorrect ? 'bold 34px sans-serif' : '500 30px sans-serif';
          ctx.fillText(opt.length > 32 ? opt.slice(0, 30) + '...' : opt, 245, optY + 80);
        });
      }
    } else if (frame.type === 'cta') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💡 DETAILED EXPLANATION', 540, 480);

      if (frame.explanation) {
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '500 34px sans-serif';
        this.wrapText(ctx, frame.explanation, 540, 580, 800, 54);
      }

      // Promotional Box
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      this.roundRect(ctx, 130, 1050, 820, 380, 24, true, false);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 130, 1050, 820, 380, 24, false, true);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('🚀 ' + kit.brandName.toUpperCase(), 540, 1140);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 30px sans-serif';
      this.wrapText(ctx, kit.defaultCtaText, 540, 1220, 740, 46);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(kit.websiteUrl, 540, 1370);
    }

    // Bottom Navigation Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.roundRect(ctx, 80, 1600, 920, 200, 28, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 80, 1600, 920, 200, 28, false, true);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(frame.ctaText || 'Swipe up for next slide 👉', 540, 1715);

    return canvas;
  }

  /**
   * Bundles all rendered frames into a single downloadable zip file
   */
  public static async exportStoryZip(
    question: NormalizedQuestion,
    hookText: string,
    brandKit?: BrandKitConfig
  ): Promise<void> {
    const frames = this.generateFrames(question, hookText, brandKit);
    const zip = new JSZip();
    const folder = zip.folder(`BytePrep_Story_${question.id.slice(-6)}`) || zip;

    for (const frame of frames) {
      const canvas = this.renderFrameToCanvas(frame, question, brandKit);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      folder.file(`story-frame-0${frame.frameIndex}.png`, base64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    ExportService.triggerDownload(zipBlob, `BytePrep_Story_Frames_${question.id.slice(-6)}.zip`);
  }

  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: boolean,
    stroke: boolean
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  private static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }
}
