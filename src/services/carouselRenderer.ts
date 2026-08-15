/**
 * BytePrep Instagram Carousel Generator (1080 x 1350)
 * Generates 4, 5, or 7 high-conversion carousel slides with unified branding.
 */

import { NormalizedQuestion, CarouselSlide, BrandKitConfig } from '../types';
import { BrandKitService } from './brandKitService';
import JSZip from 'jszip';
import { ExportService } from './exportService';

export class CarouselRenderer {
  /**
   * Generates structured 7-slide carousel structure
   */
  public static generateSlides(
    question: NormalizedQuestion,
    hookText: string,
    slideCount: 4 | 5 | 7 = 7,
    brandKit?: BrandKitConfig
  ): CarouselSlide[] {
    const kit = brandKit || BrandKitService.getBrandKit();
    const correctLetter = String.fromCharCode(65 + question.correctAnswer);
    const correctOption = question.options[question.correctAnswer];
    const subject = question.subject || 'Computer Science';
    const topic = question.topic || 'CS Fundamentals';
    const exam = question.exam || 'DSSSB / KVS CS';

    const fullSlides: CarouselSlide[] = [
      // Slide 1: Strong Hook
      {
        slideIndex: 1,
        title: '⚡ SPEED CHALLENGE',
        badge: `${exam.toUpperCase()} PYQ`,
        content: hookText,
        subtext: `Test your ${subject} knowledge! Swipe left to view question 👉`,
        type: 'hook',
      },
      // Slide 2: Question
      {
        slideIndex: 2,
        title: `Q. ${subject} (${topic})`,
        badge: 'EXAM QUESTION',
        content: question.question,
        subtext: 'Read carefully before picking your option 👉',
        type: 'question',
      },
      // Slide 3: Options
      {
        slideIndex: 3,
        title: 'FOUR OPTIONS',
        badge: 'OPTIONS',
        content: `A) ${question.options[0]}\nB) ${question.options[1]}\nC) ${question.options[2]}\nD) ${question.options[3]}`,
        subtext: 'Which one is 100% correct? Lock your answer!',
        type: 'options',
      },
      // Slide 4: Pause / Think before swiping
      {
        slideIndex: 4,
        title: '🧠 THINK BEFORE SWIPING',
        badge: 'WAIT!',
        content: 'Lock your answer in your mind or drop it in the comments below!',
        subtext: 'Next slide reveals the official answer & trap breakdown 👉',
        type: 'pause',
      },
      // Slide 5: Correct Answer
      {
        slideIndex: 5,
        title: '✅ OFFICIAL ANSWER',
        badge: 'CORRECT OPTION',
        content: `Option (${correctLetter}): ${correctOption}`,
        subtext: 'Did you get it right? Swipe for technical explanation 👉',
        type: 'answer',
        highlight: `(${correctLetter})`,
      },
      // Slide 6: Explanation
      {
        slideIndex: 6,
        title: '💡 CONCEPT BREAKDOWN',
        badge: 'DETAILED EXPLANATION',
        content: question.explanation,
        subtext: 'Save this post for your exam revision! 📌',
        type: 'explanation',
      },
      // Slide 7: BytePrep CTA
      {
        slideIndex: 7,
        title: '🚀 BOOST YOUR CS SCORE',
        badge: kit.brandName.toUpperCase(),
        content: `${kit.defaultCtaText}\n\nSearch "${kit.brandName}" on Google Play Store.\nWebsite: ${kit.websiteUrl}`,
        subtext: `Follow ${kit.instagramHandle} for daily Computer Science PYQ carousels!`,
        type: 'cta',
      },
    ];

    if (slideCount === 4) {
      return [fullSlides[0], fullSlides[1], fullSlides[4], fullSlides[6]].map((s, idx) => ({
        ...s,
        slideIndex: idx + 1,
      }));
    }

    if (slideCount === 5) {
      return [fullSlides[0], fullSlides[1], fullSlides[2], fullSlides[4], fullSlides[6]].map((s, idx) => ({
        ...s,
        slideIndex: idx + 1,
      }));
    }

    return fullSlides;
  }

  /**
   * Renders a single slide onto a 1080x1350 HTML Canvas
   */
  public static renderSlideToCanvas(
    slide: CarouselSlide,
    question: NormalizedQuestion,
    totalSlides: number = 7,
    brandKit?: BrandKitConfig
  ): HTMLCanvasElement {
    const kit = brandKit || BrandKitService.getBrandKit();
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1350);
      ctx.stroke();
    }
    for (let y = 0; y < 1350; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Top Brand Bar
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    this.roundRect(ctx, 60, 60, 960, 90, 20, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 60, 60, 960, 90, 20, false, true);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(kit.brandName.toUpperCase(), 95, 116);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`SLIDE ${slide.slideIndex} / ${totalSlides}`, 980, 116);

    // Badge Pill
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    this.roundRect(ctx, 60, 180, 320, 50, 14, true, false);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slide.badge, 220, 214);

    // Main Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.roundRect(ctx, 60, 250, 960, 880, 32, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 60, 250, 960, 880, 32, false, true);

    // Slide Content Rendering
    if (slide.type === 'hook') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 56px sans-serif';
      ctx.textAlign = 'center';
      this.wrapText(ctx, slide.content, 540, 520, 840, 74);

      if (slide.subtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 32px sans-serif';
        this.wrapText(ctx, slide.subtext, 540, 880, 820, 48);
      }
    } else if (slide.type === 'question') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      this.wrapText(ctx, slide.content, 540, 480, 840, 58);

      if (slide.subtext) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 30px sans-serif';
        ctx.fillText(slide.subtext, 540, 950);
      }
    } else if (slide.type === 'options') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SELECT THE RIGHT OPTION', 540, 360);

      question.options.forEach((opt, idx) => {
        const optY = 430 + idx * 130;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        this.roundRect(ctx, 110, optY, 860, 105, 18, true, false);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        this.roundRect(ctx, 110, optY, 860, 105, 18, false, true);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`[${String.fromCharCode(65 + idx)}]`, 140, optY + 64);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 28px sans-serif';
        ctx.fillText(opt.length > 36 ? opt.slice(0, 34) + '...' : opt, 210, optY + 64);
      });
    } else if (slide.type === 'pause') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧠 HOLD ON!', 540, 480);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      this.wrapText(ctx, slide.content, 540, 600, 800, 54);

      if (slide.subtext) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 30px sans-serif';
        ctx.fillText(slide.subtext, 540, 900);
      }
    } else if (slide.type === 'answer') {
      ctx.fillStyle = '#10b981';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✅ OFFICIAL ANSWER', 540, 420);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      this.roundRect(ctx, 120, 500, 840, 240, 24, true, false);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      this.roundRect(ctx, 120, 500, 840, 240, 24, false, true);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      this.wrapText(ctx, slide.content, 540, 610, 780, 56);

      if (slide.subtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 28px sans-serif';
        ctx.fillText(slide.subtext, 540, 880);
      }
    } else if (slide.type === 'explanation') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💡 WHY THIS ANSWER IS CORRECT', 540, 380);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '500 32px sans-serif';
      this.wrapText(ctx, slide.content, 540, 480, 820, 48);
    } else if (slide.type === 'cta') {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀 ' + kit.brandName.toUpperCase(), 540, 420);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      this.wrapText(ctx, kit.defaultCtaText, 540, 540, 800, 52);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`Website: ${kit.websiteUrl}`, 540, 800);

      if (slide.subtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 26px sans-serif';
        ctx.fillText(slide.subtext, 540, 940);
      }
    }

    // Bottom Action Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    this.roundRect(ctx, 60, 1170, 960, 120, 20, true, false);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, 60, 1170, 960, 120, 20, false, true);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📲 Follow ${kit.instagramHandle}`, 95, 1242);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Swipe Next 👉', 980, 1242);

    return canvas;
  }

  /**
   * Bundles all carousel slides into a zip archive
   */
  public static async exportCarouselZip(
    question: NormalizedQuestion,
    hookText: string,
    slideCount: 4 | 5 | 7 = 7,
    brandKit?: BrandKitConfig
  ): Promise<void> {
    const slides = this.generateSlides(question, hookText, slideCount, brandKit);
    const zip = new JSZip();
    const folder = zip.folder(`BytePrep_Carousel_${question.id.slice(-6)}`) || zip;

    for (const slide of slides) {
      const canvas = this.renderSlideToCanvas(slide, question, slides.length, brandKit);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      folder.file(`carousel-slide-0${slide.slideIndex}.png`, base64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    ExportService.triggerDownload(zipBlob, `BytePrep_Carousel_Slides_${question.id.slice(-6)}.zip`);
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
