import { ShortConfig } from '../../types';
import { SHORTS_THEMES } from './themes';
import { drawCanvasBytePrepLogo } from '../../components/BytePrepLogo';

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export interface RenderCallbacks {
  onProgress: (progress: number, stage: string, currentFrame?: number, totalFrames?: number) => void;
  onComplete: (blob: Blob, videoUrl: string) => void;
  onError: (error: string) => void;
}

export interface RenderControl {
  cancel: () => void;
}

export interface TimelineDurations {
  intro: number;
  hook: number;
  question: number;
  reveal: number;
  explanation: number;
  cta: number;
  total: number;
}

/**
 * Computes exact timeline phase durations based on ShortConfig and durationMode.
 * Supports:
 * - 'viral' / 'fast': ~18s (Ultra high retention, fast export)
 * - 'standard': ~25s (Balanced default)
 * - 'extended': ~34s (Deep dive with long explanation)
 */
export function getTimelineDurations(config: ShortConfig): TimelineDurations {
  const mode = config.durationMode || 'standard';

  if (config.phaseDurations) {
    const intro = config.phaseDurations.intro ?? (mode === 'viral' ? 1.0 : mode === 'standard' ? 2.0 : 2.5);
    const hook = config.phaseDurations.hook ?? (mode === 'viral' ? 2.0 : mode === 'standard' ? 2.5 : 3.0);
    const question = config.phaseDurations.question ?? (config.timerSeconds || (mode === 'viral' ? 5.0 : 10.0));
    const reveal = config.phaseDurations.reveal ?? (mode === 'viral' ? 2.0 : mode === 'standard' ? 3.0 : 4.0);
    const explanation = config.phaseDurations.explanation ?? (mode === 'viral' ? 2.5 : mode === 'standard' ? 4.5 : 7.5);
    const cta = config.phaseDurations.cta ?? (mode === 'viral' ? 1.5 : mode === 'standard' ? 2.0 : 3.0);

    const total = +(intro + hook + question + reveal + explanation + cta).toFixed(1);
    return {
      intro,
      hook,
      question,
      reveal,
      explanation,
      cta,
      total,
    };
  }

  if (mode === 'viral') {
    // ⚡ 14-Second Fast Viral Short (1.0s + 2.0s + 5.0s + 2.0s + 2.5s + 1.5s = 14.0s)
    const intro = 1.0;
    const hook = 2.0;
    const question = config.timerSeconds ? Math.min(config.timerSeconds, 6) : 5.0;
    const reveal = 2.0;
    const explanation = 2.5;
    const cta = 1.5;
    const total = +(intro + hook + question + reveal + explanation + cta).toFixed(1);
    return {
      intro,
      hook,
      question,
      reveal,
      explanation,
      cta,
      total,
    };
  }

  if (mode === 'extended') {
    // 🎥 32-Second In-Depth Short (2.5s + 3.0s + 12.0s + 4.0s + 7.5s + 3.0s = 32.0s)
    const intro = 2.5;
    const hook = 3.0;
    const question = config.timerSeconds || 12.0;
    const reveal = 4.0;
    const explanation = 7.5;
    const cta = 3.0;
    const total = +(intro + hook + question + reveal + explanation + cta).toFixed(1);
    return {
      intro,
      hook,
      question,
      reveal,
      explanation,
      cta,
      total,
    };
  }

  // 🎬 24-Second Standard Short Default (2.0s + 2.5s + 10.0s + 3.0s + 4.5s + 2.0s = 24.0s)
  const intro = 2.0;
  const hook = 2.5;
  const question = config.timerSeconds || 10.0;
  const reveal = 3.0;
  const explanation = 4.5;
  const cta = 2.0;
  const total = +(intro + hook + question + reveal + explanation + cta).toFixed(1);
  return {
    intro,
    hook,
    question,
    reveal,
    explanation,
    cta,
    total,
  };
}

/**
 * Precomputes and caches text layout lines to avoid repeated measureText calls across 1000+ frames.
 */
export interface RenderLayoutCache {
  badgeText: string;
  badgeW: number;
  questionLines: string[];
  hookLines: string[];
  explanationLines: string[];
  optionWraps: { line1: string; line2?: string; isSingle: boolean }[];
  statusLabelW: number;
}

export function buildLayoutCache(
  ctx: CanvasRenderingContext2D,
  width: number,
  config: ShortConfig
): RenderLayoutCache {
  const { question, hookText } = config;
  const boxW = width - 160;

  // 1. Badge metrics
  const badgeText = `${question.subject.toUpperCase()} • ${question.exam.toUpperCase()}`;
  ctx.font = 'bold 20px sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = Math.min(width - 160, badgeMetrics.width + 56);

  // 2. Question lines
  ctx.font = question.question.length > 120 ? '700 32px sans-serif' : '700 36px sans-serif';
  const questionLines = computeWrappedLines(ctx, question.question, boxW - 60);

  // 3. Hook lines
  ctx.font = '900 46px sans-serif';
  const hookLines = computeWrappedLines(ctx, hookText, boxW - 80);

  // 4. Explanation lines
  ctx.font = question.explanation.length > 350 ? '500 30px sans-serif' : '500 34px sans-serif';
  const explanationLines = computeWrappedLines(ctx, question.explanation, boxW - 90);

  // 5. Options wraps
  const optionWraps = question.options.map((optText: string) => {
    ctx.font = '600 32px sans-serif';
    const maxW = boxW - 150;
    if (ctx.measureText(optText).width <= maxW) {
      return { line1: optText, isSingle: true };
    }
    const words = optText.split(' ');
    const mid = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, mid).join(' '),
      line2: words.slice(mid).join(' '),
      isSingle: false,
    };
  });

  ctx.font = 'bold 20px sans-serif';
  const statusLabelW = ctx.measureText('🚨 TIME IS RUNNING OUT!').width + 36;

  return {
    badgeText,
    badgeW,
    questionLines,
    hookLines,
    explanationLines,
    optionWraps,
    statusLabelW,
  };
}

function computeWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[n];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draws a single frame of the 9:16 vertical short at time `currentTime` (in seconds).
 * Pixel-perfect alignment and safe zone compliance for YouTube Shorts, Instagram Reels, and TikTok.
 */
export function drawShortFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  config: ShortConfig,
  layoutCache?: RenderLayoutCache
) {
  const theme = SHORTS_THEMES[config.themeId] || SHORTS_THEMES['byteprep-dark'];
  const { question, timerSeconds, hookText, appUrl, backgroundStyle = 'auto' } = config;
  const durations = getTimelineDurations(config);

  const { intro, hook, question: qDuration, reveal, explanation } = durations;

  // 1. Live Animated Dynamic Background
  drawLiveBackground(ctx, width, height, currentTime, question, theme, backgroundStyle);

  // 2. Safe Header Brand Tag (Standardized across all frames)
  ctx.save();
  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('BytePrep TGT PGT CS', width / 2, 120);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 24px sans-serif';
  ctx.fillText(`⚡ ${Math.round(qDuration)} SECONDS MCQ CHALLENGE`, width / 2, 172);

  // Subject & Exam Badge Pill
  const badgeText = layoutCache?.badgeText ?? `${question.subject.toUpperCase()} • ${question.exam.toUpperCase()}`;
  const badgeW = layoutCache?.badgeW ?? Math.min(width - 160, 480);
  const badgeX = (width - badgeW) / 2;
  const badgeY = 215;
  const badgeH = 42;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 21);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = theme.textColor;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2);
  ctx.restore();

  // 3. Render Timeline Segment
  const t = currentTime;

  if (t < intro) {
    // PHASE 1: INTRO FRAME
    drawIntroPhase(ctx, width, height, t, intro, question, theme);
  } else if (t < intro + hook) {
    // PHASE 2: HOOK
    drawHookPhase(ctx, width, height, t - intro, hookText, theme, layoutCache);
  } else if (t < intro + hook + qDuration) {
    // PHASE 3: QUESTION + COUNTDOWN TIMER
    const elapsedInQ = t - (intro + hook);
    const remainingTimer = Math.max(0, Math.ceil(timerSeconds * (1 - elapsedInQ / qDuration)));
    drawQuestionPhase(ctx, width, height, question, remainingTimer, timerSeconds, theme, layoutCache);
  } else if (t < intro + hook + qDuration + reveal) {
    // PHASE 4: TIME'S UP + ANSWER REVEAL
    const elapsedInAns = t - (intro + hook + qDuration);
    drawAnswerRevealPhase(ctx, width, height, question, elapsedInAns, theme, layoutCache);
  } else if (t < intro + hook + qDuration + reveal + explanation) {
    // PHASE 5: EXPLANATION
    drawExplanationPhase(ctx, width, height, question, theme, layoutCache);
  } else {
    // PHASE 6: OUTRO CTA
    drawCtaPhase(ctx, width, height, appUrl || 'dsssbpyq.online', theme);
  }

  // 4. Footer Safe Banner on EVERY Frame
  ctx.save();
  const footerW = width - 160; // 920px width
  const footerX = 80;
  const footerY = height - 185;
  const footerH = 96;

  // Background Container
  ctx.fillStyle = 'rgba(10, 17, 40, 0.96)';
  fillRoundedRect(ctx, footerX, footerY, footerW, footerH, 24);
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Logo Left
  drawCanvasBytePrepLogo(ctx, footerX + 56, footerY + footerH / 2, 64);

  // Center Text Line 1
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Search BytePrep TGT PGT CS on Play Store', width / 2, footerY + 32);

  // Center Text Line 2
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Visit Website : dsssbpyq.online', width / 2, footerY + 65);

  // Logo Right
  drawCanvasBytePrepLogo(ctx, footerX + footerW - 56, footerY + footerH / 2, 64);

  ctx.restore();
}

/**
 * Renders dynamic animated backgrounds
 */
function drawLiveBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  question: any,
  theme: any,
  style: 'auto' | 'stars' | 'matrix' | 'sql' | 'network' | 'os' | 'grid' | 'terminal' | 'cyber'
) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, theme.bgGradient[0]);
  grad.addColorStop(0.5, theme.bgGradient[1] || theme.bgGradient[0]);
  grad.addColorStop(1, theme.bgGradient[2] || theme.bgGradient[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  let effectiveStyle = style;
  if (style === 'auto') {
    const subj = (question?.subject || '').toLowerCase();
    if (subj.includes('network')) effectiveStyle = 'network';
    else if (subj.includes('dbms') || subj.includes('sql') || subj.includes('database')) effectiveStyle = 'sql';
    else if (subj.includes('operating') || subj.includes('os')) effectiveStyle = 'os';
    else if (subj.includes('data structure') || subj.includes('algo') || subj.includes('program')) effectiveStyle = 'matrix';
    else effectiveStyle = 'stars';
  }

  if (effectiveStyle === 'stars') {
    const starCount = 45; // Optimized count for speed
    for (let i = 0; i < starCount; i++) {
      const speed = 60 + (i % 5) * 45;
      const x = (i * 137.5 + i * 29) % width;
      const y = ((time * speed + i * 190) % (height + 100)) - 50;
      const size = 1.5 + (i % 4) * 1.2;
      const alpha = 0.3 + 0.6 * Math.abs(Math.sin(time * 2 + i));

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (effectiveStyle === 'matrix') {
    ctx.font = 'bold 20px monospace';
    const cols = 12;
    const colSpacing = width / cols;
    const characters = '010101XYZ{}[]<>=/+#$%&~*';

    for (let c = 0; c < cols; c++) {
      const x = c * colSpacing + 20;
      const speed = 80 + (c % 4) * 35;
      const yHead = ((time * speed + c * 210) % (height + 300)) - 100;

      for (let row = 0; row < 10; row++) {
        const charY = yHead - row * 26;
        if (charY > 0 && charY < height) {
          const charIndex = (Math.floor(time * 10) + c * 3 + row) % characters.length;
          const char = characters[charIndex];
          const opacity = Math.max(0, 1 - row / 10);
          ctx.fillStyle = row === 0 ? '#ffffff' : `rgba(34, 197, 94, ${opacity * 0.4})`;
          ctx.fillText(char, x, charY);
        }
      }
    }
  } else if (effectiveStyle === 'sql') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.font = '20px monospace';
    const queries = [
      'SELECT question, answer FROM tgt_pgt_cs_pyq;',
      'CREATE INDEX idx_subject ON questions(subject);',
      'INNER JOIN mock_tests ON tests.id = q.mock_id',
      'SELECT COUNT(*) FROM pyq WHERE score >= 90;',
      'ALTER TABLE computer_science ADD COLUMN rank INT;',
      'COMMIT; -- BytePrep 10s MCQ Speed Engine',
    ];
    queries.forEach((q, idx) => {
      const y = (time * 45 + idx * 280) % height;
      ctx.fillText(q, 50, y);
    });
  } else {
    // Default network grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1.5;
    const offset = (time * 40) % 140;
    for (let y = 0; y < height; y += 160) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(width, y + offset);
      ctx.stroke();
    }
  }

  // Atmospheric soft gradient
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, height * 0.8);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Phase 1: Intro Frame
 */
function drawIntroPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  introDuration: number,
  question: any,
  theme: any
) {
  ctx.save();
  const remainingIntro = Math.max(1, Math.ceil(introDuration - time));

  const boxW = width - 160;
  const boxH = 680;
  const boxX = (width - boxW) / 2;
  const boxY = 460;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 5;
  fillRoundedRect(ctx, boxX, boxY, boxW, boxH, 32);
  ctx.stroke();

  // App Logo Centered
  drawCanvasBytePrepLogo(ctx, width / 2, boxY + 120, 140);

  // Title
  ctx.fillStyle = theme.textColor;
  ctx.font = '900 46px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BytePrep TGT PGT CS', width / 2, boxY + 230);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 32px sans-serif';
  ctx.fillText('10 SECONDS MCQ CHALLENGE', width / 2, boxY + 285);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '700 28px sans-serif';
  ctx.fillText(`Subject: ${question.subject}`, width / 2, boxY + 360);
  ctx.fillText(`Topic: ${question.topic}`, width / 2, boxY + 410);

  // Countdown Pill
  const pillW = 420;
  const pillH = 80;
  const pillX = (width - pillW) / 2;
  const pillY = boxY + 490;

  ctx.fillStyle = theme.accentColor;
  fillRoundedRect(ctx, pillX, pillY, pillW, pillH, 40);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`GET READY! ${remainingIntro}s`, width / 2, pillY + pillH / 2);

  ctx.restore();
}

/**
 * Phase 2: Hook Phase
 */
function drawHookPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  hookText: string,
  theme: any,
  layoutCache?: RenderLayoutCache
) {
  ctx.save();
  const progress = Math.min(1, time / 0.3);
  const scale = 0.94 + 0.06 * Math.sin((progress * Math.PI) / 2);

  const boxW = width - 160;
  const boxH = 580;
  const boxX = (width - boxW) / 2;
  const boxY = 500;

  ctx.translate(width / 2, boxY + boxH / 2);
  ctx.scale(scale, scale);

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 5;
  fillRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 32);
  ctx.stroke();

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎯', 0, -boxH / 2 + 100);

  ctx.fillStyle = theme.textColor;
  ctx.font = '900 46px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (layoutCache?.hookLines) {
    const lines = layoutCache.hookLines;
    const lineHeight = 62;
    const startY = -20 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, idx) => {
      ctx.fillText(line, 0, startY + idx * lineHeight);
    });
  } else {
    wrapTextDirect(ctx, hookText, 0, -20, boxW - 80, 62, true);
  }

  // Callout Pill
  const pillW = 540;
  const pillH = 68;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  fillRoundedRect(ctx, -pillW / 2, boxH / 2 - 110, pillW, pillH, 34);
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 26px sans-serif';
  ctx.fillText('⚡ CAN YOU SOLVE IN 10 SECONDS?', 0, boxH / 2 - 76);

  ctx.restore();
}

/**
 * Phase 3: Question + Live Countdown Timer
 */
function drawQuestionPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  timerVal: number,
  timerMax: number,
  theme: any,
  layoutCache?: RenderLayoutCache
) {
  ctx.save();

  // 1. Timer Circular Gauge
  const timerY = 345;
  const timerRadius = 68;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(width / 2, timerY, timerRadius, 0, Math.PI * 2);
  ctx.stroke();

  const pct = Math.max(0, Math.min(1, timerVal / timerMax));
  let timerColorHex = '#10b981';
  let statusLabel = '⚡ SPEED BONUS ACTIVE';

  if (pct <= 0.25) {
    timerColorHex = '#f43f5e';
    statusLabel = '🚨 TIME IS RUNNING OUT!';
  } else if (pct <= 0.5) {
    timerColorHex = '#fbbf24';
    statusLabel = '⚠️ HURRY UP!';
  }

  // Active Progress Ring
  ctx.strokeStyle = timerColorHex;
  ctx.beginPath();
  ctx.arc(width / 2, timerY, timerRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct, false);
  ctx.stroke();

  // Timer Digits Centered
  ctx.fillStyle = timerColorHex;
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(timerVal).padStart(2, '0'), width / 2, timerY + 3);

  // Status Label Pill
  ctx.font = 'bold 20px sans-serif';
  const pillW = layoutCache?.statusLabelW ?? 320;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  fillRoundedRect(ctx, (width - pillW) / 2, timerY + 80, pillW, 36, 18);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = timerColorHex;
  ctx.fillText(statusLabel, width / 2, timerY + 98);

  // 2. Question Card
  const qCardY = 485;
  const qCardW = width - 160;
  const qCardH = question.question.length > 120 ? 270 : 230;
  const qCardX = (width - qCardW) / 2;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 3;
  fillRoundedRect(ctx, qCardX, qCardY, qCardW, qCardH, 24);
  ctx.stroke();

  ctx.fillStyle = theme.textColor;
  ctx.font = question.question.length > 120 ? '700 32px sans-serif' : '700 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (layoutCache?.questionLines) {
    const lines = layoutCache.questionLines;
    const lineHeight = 44;
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, qCardY + 28 + idx * lineHeight);
    });
  } else {
    wrapTextDirect(ctx, question.question, width / 2, qCardY + 28, qCardW - 60, 44, true);
  }

  // 3. Options Cards (A, B, C, D)
  const optionLetters = ['A', 'B', 'C', 'D'];
  const startY = qCardY + qCardH + 25;
  const optionH = 120;
  const gap = 20;

  question.options.forEach((optionText: string, idx: number) => {
    const optY = startY + idx * (optionH + gap);
    const optW = width - 160;
    const optX = (width - optW) / 2;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 2.5;
    fillRoundedRect(ctx, optX, optY, optW, optionH, 22);
    ctx.stroke();

    const circleX = optX + 65;
    const circleY = optY + optionH / 2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(circleX, circleY, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.accentColor;
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(optionLetters[idx], circleX, circleY + 2);

    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const wrap = layoutCache?.optionWraps[idx];
    if (wrap) {
      if (wrap.isSingle) {
        ctx.font = '600 32px sans-serif';
        ctx.fillText(wrap.line1, optX + 125, circleY);
      } else {
        ctx.font = optionText.length > 50 ? '600 25px sans-serif' : '600 28px sans-serif';
        const lineHeight = optionText.length > 50 ? 32 : 36;
        ctx.fillText(wrap.line1, optX + 125, circleY - lineHeight / 2 + 2);
        if (wrap.line2) {
          ctx.fillText(wrap.line2, optX + 125, circleY + lineHeight / 2 - 2);
        }
      }
    } else {
      renderOptionTextWithAutoWrap(ctx, optionText, optX + 125, circleY, optW - 150);
    }
  });

  ctx.restore();
}

/**
 * Phase 4: Time's Up + Answer Reveal
 */
function drawAnswerRevealPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  elapsedInAns: number,
  theme: any,
  layoutCache?: RenderLayoutCache
) {
  ctx.save();

  ctx.fillStyle = theme.timerColor;
  ctx.font = '900 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText("⏰ TIME'S UP!", width / 2, 330);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('CORRECT ANSWER REVEAL', width / 2, 400);

  // Question Card
  const qCardY = 485;
  const qCardW = width - 160;
  const qCardH = question.question.length > 120 ? 270 : 230;
  const qCardX = (width - qCardW) / 2;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2.5;
  fillRoundedRect(ctx, qCardX, qCardY, qCardW, qCardH, 24);
  ctx.stroke();

  ctx.fillStyle = theme.textColor;
  ctx.font = question.question.length > 120 ? '700 32px sans-serif' : '700 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (layoutCache?.questionLines) {
    const lines = layoutCache.questionLines;
    const lineHeight = 44;
    lines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, qCardY + 28 + idx * lineHeight);
    });
  } else {
    wrapTextDirect(ctx, question.question, width / 2, qCardY + 28, qCardW - 60, 44, true);
  }

  // 4 Option Cards
  const optionLetters = ['A', 'B', 'C', 'D'];
  const startY = qCardY + qCardH + 25;
  const optionH = 120;
  const gap = 20;

  question.options.forEach((optionText: string, idx: number) => {
    const optY = startY + idx * (optionH + gap);
    const optW = width - 160;
    const optX = (width - optW) / 2;
    const isCorrect = idx === question.correctAnswer;

    if (isCorrect) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 5;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
    }

    fillRoundedRect(ctx, optX, optY, optW, optionH, 22);
    ctx.stroke();

    const circleX = optX + 65;
    const circleY = optY + optionH / 2;

    ctx.fillStyle = isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(circleX, circleY, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCorrect ? '✓' : optionLetters[idx], circleX, circleY + 2);

    ctx.fillStyle = isCorrect ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const wrap = layoutCache?.optionWraps[idx];
    if (wrap) {
      if (wrap.isSingle) {
        ctx.font = '600 32px sans-serif';
        ctx.fillText(wrap.line1, optX + 125, circleY);
      } else {
        ctx.font = optionText.length > 50 ? '600 25px sans-serif' : '600 28px sans-serif';
        const lineHeight = optionText.length > 50 ? 32 : 36;
        ctx.fillText(wrap.line1, optX + 125, circleY - lineHeight / 2 + 2);
        if (wrap.line2) {
          ctx.fillText(wrap.line2, optX + 125, circleY + lineHeight / 2 - 2);
        }
      }
    } else {
      renderOptionTextWithAutoWrap(ctx, optionText, optX + 125, circleY, optW - 150);
    }

    if (isCorrect) {
      const correctBadgeW = 150;
      const correctBadgeH = 34;
      const badgeRightX = optX + optW - correctBadgeW - 20;
      const badgeRightY = optY + (optionH - correctBadgeH) / 2;

      ctx.fillStyle = '#10b981';
      fillRoundedRect(ctx, badgeRightX, badgeRightY, correctBadgeW, correctBadgeH, 17);
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CORRECT', badgeRightX + correctBadgeW / 2, badgeRightY + correctBadgeH / 2);
    }
  });

  ctx.restore();
}

/**
 * Phase 5: Explanation Phase
 */
function drawExplanationPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  theme: any,
  layoutCache?: RenderLayoutCache
) {
  ctx.save();

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('💡 DETAILED SOLUTION & CONCEPT', width / 2, 310);

  // Correct Option Summary Pill
  const correctLetter = String.fromCharCode(65 + question.correctAnswer);
  const correctOptText = question.options[question.correctAnswer] || '';
  const correctText = `✅ Correct: Option (${correctLetter}) - ${correctOptText}`;

  ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  const pillW = width - 160;
  const pillH = 70;
  fillRoundedRect(ctx, (width - pillW) / 2, 385, pillW, pillH, 35);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = correctText.length > 55 ? 'bold 24px sans-serif' : 'bold 27px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(correctText, width / 2, 385 + pillH / 2);

  // Explanation Card Box
  const boxY = 480;
  const boxW = width - 160;
  const boxH = 980;
  const boxX = (width - boxW) / 2;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 3;
  fillRoundedRect(ctx, boxX, boxY, boxW, boxH, 28);
  ctx.stroke();

  // Explanation text
  ctx.fillStyle = theme.textColor;
  ctx.font = question.explanation.length > 350 ? '500 30px sans-serif' : '500 34px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  if (layoutCache?.explanationLines) {
    const lines = layoutCache.explanationLines;
    const lineHeight = 50;
    lines.forEach((line, idx) => {
      ctx.fillText(line, boxX + 45, boxY + 45 + idx * lineHeight);
    });
  } else {
    wrapTextDirect(ctx, question.explanation, boxX + 45, boxY + 45, boxW - 90, 50, false);
  }

  ctx.restore();
}

/**
 * Phase 6: CTA Outro Phase
 */
function drawCtaPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  appUrl: string,
  theme: any
) {
  ctx.save();

  const boxW = width - 160;
  const boxH = 680;
  const boxX = (width - boxW) / 2;
  const boxY = 460;

  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.accentColor;
  ctx.lineWidth = 5;
  fillRoundedRect(ctx, boxX, boxY, boxW, boxH, 32);
  ctx.stroke();

  // App Logo
  drawCanvasBytePrepLogo(ctx, width / 2, boxY + 120, 140);

  ctx.fillStyle = theme.textColor;
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BytePrep TGT PGT CS', width / 2, boxY + 230);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 34px sans-serif';
  ctx.fillText('WANT TO PRACTICE MORE PYQs?', width / 2, boxY + 295);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px sans-serif';
  ctx.fillText('Visit Website : dsssbpyq.online', width / 2, boxY + 365);

  // Play Store Button
  const btnW = boxW - 80;
  const btnH = 92;
  const btnX = boxX + 40;
  const btnY = boxY + 440;

  ctx.fillStyle = theme.accentColor;
  fillRoundedRect(ctx, btnX, btnY, btnW, btnH, 46);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 28px sans-serif';
  ctx.fillText('Search BytePrep TGT PGT CS on Play Store', width / 2, btnY + btnH / 2);

  ctx.restore();
}

/**
 * Synthesizes audio sounds (Timer Beeps, Reveal Chime) into a Web Audio Destination Stream.
 */
function createAudioTrack(durations: TimelineDurations, includeAudio: boolean): { stream: MediaStream | null; cleanup: () => void } {
  if (!includeAudio) return { stream: null, cleanup: () => {} };

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return { stream: null, cleanup: () => {} };

    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();

    const { intro, hook, question, reveal } = durations;
    const startTime = audioCtx.currentTime + 0.05;

    // 1. Question Countdown Beeps (Every second of question phase)
    const qStartTime = startTime + intro + hook;
    for (let sec = 0; sec < question; sec++) {
      const beepTime = qStartTime + sec;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const isLast3 = sec >= question - 3;
      osc.type = isLast3 ? 'square' : 'sine';
      osc.frequency.setValueAtTime(isLast3 ? 1200 : 800, beepTime);

      gain.gain.setValueAtTime(0, beepTime);
      gain.gain.linearRampToValueAtTime(0.12, beepTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, beepTime + 0.12);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(beepTime);
      osc.stop(beepTime + 0.15);
    }

    // 2. Victory Chime Chord on Reveal
    const revealTime = startTime + intro + hook + question;
    const chordFreqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    chordFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, revealTime + idx * 0.06);

      gain.gain.setValueAtTime(0, revealTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, revealTime + idx * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, revealTime + idx * 0.06 + 1.2);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(revealTime + idx * 0.06);
      osc.stop(revealTime + idx * 0.06 + 1.3);
    });

    return {
      stream: dest.stream,
      cleanup: () => {
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    return { stream: null, cleanup: () => {} };
  }
}

/**
 * Render and record a short video to WebM blob using high-speed non-blocking HTML5 Canvas + MediaRecorder.
 * Supports:
 * - Anti-hang watchdog protection
 * - Fast timeline duration modes
 * - 720p / 1080p quality scaling
 * - Audio track synthesis (countdown ticks & victory chime)
 * - Immediate abort / cancel support
 */
export function exportShortVideo(
  config: ShortConfig,
  callbacks: RenderCallbacks
): RenderControl {
  let isCancelled = false;
  let mediaRecorder: MediaRecorder | null = null;
  let audioCleanup: (() => void) | null = null;
  let streamTracks: MediaStreamTrack[] = [];
  let watchdogTimeout: any = null;
  let animFrameId: any = null;
  let intervalTimer: any = null;

  const cancel = () => {
    isCancelled = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (intervalTimer) clearInterval(intervalTimer);
    if (watchdogTimeout) clearTimeout(watchdogTimeout);
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch {
      // ignore
    }
    streamTracks.forEach(t => t.stop());
    if (audioCleanup) audioCleanup();
    callbacks.onError('Rendering was cancelled by user');
  };

  (async () => {
    try {
      callbacks.onProgress(2, 'Initializing Precision Video Engine...');

      const quality = config.renderQuality || '1080p';
      const is720p = quality === '720p' || quality === 'fast';
      const targetW = is720p ? 720 : CANVAS_WIDTH;
      const targetH = is720p ? 1280 : CANVAS_HEIGHT;
      const scaleFactor = targetW / CANVAS_WIDTH;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas 2D Context not available');
      }

      const durations = getTimelineDurations(config);
      const totalDuration = durations.total;
      const fps = config.fps || (is720p ? 24 : 30);
      const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

      // Build Layout Cache ONCE for maximum performance
      callbacks.onProgress(5, 'Precomputing typography layout cache...');
      ctx.save();
      if (scaleFactor !== 1.0) {
        ctx.scale(scaleFactor, scaleFactor);
      }
      const layoutCache = buildLayoutCache(ctx, CANVAS_WIDTH, config);
      ctx.restore();

      // Audio setup (ticks & chime synthesized via Web Audio)
      const audio = createAudioTrack(durations, config.includeAudio);
      audioCleanup = audio.cleanup;

      // Draw initial frame at t = 0 to prime the canvas buffer
      ctx.save();
      if (scaleFactor !== 1.0) {
        ctx.scale(scaleFactor, scaleFactor);
      }
      drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, 0, config, layoutCache);
      ctx.restore();

      const canvasStream = canvas.captureStream(fps);
      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      if (audio.stream && audio.stream.getAudioTracks().length > 0) {
        combinedTracks.push(...audio.stream.getAudioTracks());
      }

      streamTracks = combinedTracks;
      const stream = new MediaStream(combinedTracks);

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const bitrate = is720p ? 3000000 : 6000000;
      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onerror = (err: any) => {
        if (isCancelled) return;
        callbacks.onError(err.message || 'MediaRecorder encountered an error');
      };

      const finalizeExport = () => {
        if (isCancelled) return;
        if (watchdogTimeout) clearTimeout(watchdogTimeout);

        callbacks.onProgress(98, 'Finalizing video file...');
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);

        streamTracks.forEach(t => t.stop());
        if (audioCleanup) audioCleanup();

        callbacks.onProgress(100, `Video Ready (${totalDuration.toFixed(1)}s)!`);
        callbacks.onComplete(blob, videoUrl);
      };

      mediaRecorder.onstop = () => {
        finalizeExport();
      };

      // Start recording chunks
      mediaRecorder.start(100);
      callbacks.onProgress(10, `Recording short: 0.0s / ${totalDuration.toFixed(1)}s (0%)`, 0, totalFrames);

      const renderStartTime = performance.now();
      let lastReportedTenth = -1;
      let hasCompleted = false;

      const finishRecording = () => {
        if (hasCompleted || isCancelled) return;
        hasCompleted = true;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (intervalTimer) clearInterval(intervalTimer);

        callbacks.onProgress(96, `Encoding ${totalDuration.toFixed(1)}s video stream...`, totalFrames, totalFrames);

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          try {
            mediaRecorder.requestData();
          } catch {
            // ignore
          }
          mediaRecorder.stop();

          // Anti-hang Watchdog: If onstop doesn't fire within 3000ms, force finalization
          watchdogTimeout = setTimeout(() => {
            if (chunks.length > 0) {
              finalizeExport();
            } else {
              callbacks.onError('Video encoding timed out. Please try Fast 720p mode.');
            }
          }, 3000);
        } else {
          finalizeExport();
        }
      };

      const tick = () => {
        if (isCancelled || hasCompleted) return;

        const now = performance.now();
        const elapsedSec = (now - renderStartTime) / 1000;
        const currentSec = Math.min(totalDuration, elapsedSec);

        ctx.save();
        if (scaleFactor !== 1.0) {
          ctx.scale(scaleFactor, scaleFactor);
        }
        drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, currentSec, config, layoutCache);
        ctx.restore();

        const currentFrameIndex = Math.min(totalFrames, Math.floor(currentSec * fps));
        const currentTenth = Math.floor(currentSec * 2) / 2; // Every 0.5s

        if (currentTenth !== lastReportedTenth || currentSec >= totalDuration) {
          lastReportedTenth = currentTenth;
          const pct = Math.min(95, Math.floor(10 + (currentSec / totalDuration) * 85));
          callbacks.onProgress(
            pct,
            `Recording video: ${currentSec.toFixed(1)}s / ${totalDuration.toFixed(1)}s (${pct}%)`,
            currentFrameIndex,
            totalFrames
          );
        }

        if (currentSec >= totalDuration) {
          finishRecording();
        }
      };

      // Real-time animation loop for high precision 30/60fps capture
      const runRaf = () => {
        if (isCancelled || hasCompleted) return;
        tick();
        if (!hasCompleted) {
          animFrameId = requestAnimationFrame(runRaf);
        }
      };
      animFrameId = requestAnimationFrame(runRaf);

      // Background tab safety interval (in case browser throttles rAF)
      intervalTimer = setInterval(() => {
        if (isCancelled || hasCompleted) {
          clearInterval(intervalTimer);
          return;
        }
        tick();
      }, 40);
    } catch (err: any) {
      if (!isCancelled) {
        callbacks.onError(err.message || 'Failed to render short video');
      }
    }
  })();

  return { cancel };
}

export type SocialCardAspectRatio = '9:16' | '1:1' | '16:9';
export type SocialCardVariant = 'question' | 'reveal' | 'explanation' | 'hook';

export interface SocialCardExportOptions {
  aspectRatio?: SocialCardAspectRatio;
  variant?: SocialCardVariant;
  format?: 'image/png' | 'image/jpeg';
  quality?: number;
}

/**
 * High-Quality Static Background Image Exporter:
 * Generates ready-to-share social media cards with question text overlaid across 9:16, 1:1, and 16:9 ratios.
 */
export async function exportStaticSocialCard(
  config: ShortConfig,
  options: SocialCardExportOptions = {}
): Promise<string> {
  const {
    aspectRatio = '9:16',
    variant = 'question',
    format = 'image/png',
    quality = 0.95,
  } = options;

  let width = 1080;
  let height = 1920;

  if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  } else if (aspectRatio === '16:9') {
    width = 1200;
    height = 675;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const theme = SHORTS_THEMES[config.themeId] || SHORTS_THEMES['byteprep-dark'];
  const { question, hookText } = config;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, theme.bgGradient[0]);
  grad.addColorStop(0.5, theme.bgGradient[1] || theme.bgGradient[0]);
  grad.addColorStop(1, theme.bgGradient[2] || theme.bgGradient[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle live background styling
  drawLiveBackground(ctx, width, height, 1.5, question, theme, config.backgroundStyle || 'auto');

  if (aspectRatio === '9:16') {
    // Render 9:16 using standard pipeline
    const layoutCache = buildLayoutCache(ctx, CANVAS_WIDTH, config);
    let targetTime = 8.5;
    if (variant === 'hook') targetTime = 2.5;
    else if (variant === 'reveal') targetTime = 16.0;
    else if (variant === 'explanation') targetTime = 22.0;

    drawShortFrame(ctx, width, height, targetTime, config, layoutCache);
  } else if (aspectRatio === '1:1') {
    // Custom 1:1 Layout for Instagram / Facebook Feed
    renderSquareSocialCard(ctx, width, height, config, variant, theme);
  } else {
    // Custom 16:9 Layout for Twitter / LinkedIn / YouTube Community
    renderLandscapeSocialCard(ctx, width, height, config, variant, theme);
  }

  return canvas.toDataURL(format, quality);
}

function renderSquareSocialCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ShortConfig,
  variant: SocialCardVariant,
  theme: any
) {
  const { question, hookText } = config;
  const pad = 60;
  const cardW = width - pad * 2;

  // Top Header Banner
  drawCanvasBytePrepLogo(ctx, pad + 36, 75, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BYTEPREP CS MCQ CHALLENGE', pad + 72, 75);

  // Subject Badge
  const badgeText = `${question.subject.toUpperCase()} • ${question.exam.toUpperCase()}`;
  ctx.font = 'bold 16px sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 32;
  const badgeX = width - pad - badgeW;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  fillRoundedRect(ctx, badgeX, 55, badgeW, 38, 19);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, 74);

  if (variant === 'explanation') {
    // Explanation Card Layout
    const qBoxH = 140;
    ctx.fillStyle = theme.cardBg;
    fillRoundedRect(ctx, pad, 130, cardW, qBoxH, 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapTextDirect(ctx, question.question, width / 2, 130 + qBoxH / 2, cardW - 60, 32, true);

    // Explanation Box
    const expY = 290;
    const expH = height - expY - 140;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    fillRoundedRect(ctx, pad, expY, cardW, expH, 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💡 DETAILED SOLUTION & CONCEPT:', pad + 30, expY + 36);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 22px sans-serif';
    wrapTextDirect(ctx, question.explanation, pad + 30, expY + 80, cardW - 60, 34, false);
  } else {
    // Question or Reveal Card Layout
    const qBoxH = 170;
    ctx.fillStyle = theme.cardBg;
    fillRoundedRect(ctx, pad, 130, cardW, qBoxH, 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapTextDirect(ctx, question.question, width / 2, 130 + qBoxH / 2, cardW - 60, 36, true);

    // Options A, B, C, D
    const optStartY = 325;
    const optH = 96;
    const optSpacing = 16;
    const letters = ['A', 'B', 'C', 'D'];

    question.options.forEach((opt: string, idx: number) => {
      const optY = optStartY + idx * (optH + optSpacing);
      const isCorrect = idx === question.correctAnswer;
      const showReveal = variant === 'reveal';

      ctx.fillStyle = showReveal && isCorrect ? 'rgba(16, 185, 129, 0.25)' : theme.optionBg;
      fillRoundedRect(ctx, pad, optY, cardW, optH, 18);
      ctx.strokeStyle = showReveal && isCorrect ? '#10b981' : theme.optionBorder;
      ctx.lineWidth = showReveal && isCorrect ? 3 : 1.5;
      ctx.stroke();

      // Letter circle
      ctx.fillStyle = showReveal && isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(pad + 48, optY + optH / 2, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = showReveal && isCorrect ? '#0f172a' : '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letters[idx], pad + 48, optY + optH / 2 + 1);

      // Option text
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(opt, pad + 92, optY + optH / 2);

      if (showReveal && isCorrect) {
        ctx.fillStyle = '#10b981';
        ctx.font = '900 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓ CORRECT ANSWER', width - pad - 24, optY + optH / 2);
      }
    });
  }

  // Footer Banner
  const footerY = height - 90;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  fillRoundedRect(ctx, pad, footerY, cardW, 60, 16);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚀 Prepare with BytePrep App & Web: dsssbpyq.online', width / 2, footerY + 30);
}

function renderLandscapeSocialCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: ShortConfig,
  variant: SocialCardVariant,
  theme: any
) {
  const { question } = config;
  const pad = 50;

  // Header
  drawCanvasBytePrepLogo(ctx, pad + 30, 55, 44);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BYTEPREP CS MOCK CHALLENGE', pad + 65, 55);

  const badgeText = `${question.subject.toUpperCase()} • ${question.exam.toUpperCase()}`;
  ctx.font = 'bold 15px sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 28;
  const badgeX = width - pad - badgeW;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  fillRoundedRect(ctx, badgeX, 40, badgeW, 34, 17);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, 57);

  // Left Column: Question Card (Width: 500px)
  const leftW = 490;
  const contentY = 105;
  const contentH = height - contentY - 80;

  ctx.fillStyle = theme.cardBg;
  fillRoundedRect(ctx, pad, contentY, leftW, contentH, 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('QUESTION', pad + 25, contentY + 35);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 23px sans-serif';
  wrapTextDirect(ctx, question.question, pad + 25, contentY + 75, leftW - 50, 32, false);

  // Right Column: Options or Explanation (Width: 570px)
  const rightX = pad + leftW + 30;
  const rightW = width - rightX - pad;

  if (variant === 'explanation') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    fillRoundedRect(ctx, rightX, contentY, rightW, contentH, 20);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💡 DETAILED SOLUTION:', rightX + 25, contentY + 35);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 19px sans-serif';
    wrapTextDirect(ctx, question.explanation, rightX + 25, contentY + 75, rightW - 50, 28, false);
  } else {
    const optH = 92;
    const optGap = 14;
    const letters = ['A', 'B', 'C', 'D'];

    question.options.forEach((opt: string, idx: number) => {
      const optY = contentY + idx * (optH + optGap);
      const isCorrect = idx === question.correctAnswer;
      const showReveal = variant === 'reveal';

      ctx.fillStyle = showReveal && isCorrect ? 'rgba(16, 185, 129, 0.25)' : theme.optionBg;
      fillRoundedRect(ctx, rightX, optY, rightW, optH, 16);
      ctx.strokeStyle = showReveal && isCorrect ? '#10b981' : theme.optionBorder;
      ctx.lineWidth = showReveal && isCorrect ? 2.5 : 1.5;
      ctx.stroke();

      ctx.fillStyle = showReveal && isCorrect ? '#10b981' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(rightX + 38, optY + optH / 2, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = showReveal && isCorrect ? '#0f172a' : '#ffffff';
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letters[idx], rightX + 38, optY + optH / 2 + 1);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 19px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(opt, rightX + 75, optY + optH / 2);

      if (showReveal && isCorrect) {
        ctx.fillStyle = '#10b981';
        ctx.font = '900 15px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓ CORRECT', rightX + rightW - 20, optY + optH / 2);
      }
    });
  }

  // Footer
  const footerY = height - 55;
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚀 Search BytePrep TGT PGT CS on Google Play Store • dsssbpyq.online', width / 2, footerY);
}

/**
 * Instant Frame Snapshot Export:
 * Exports a crisp PNG image poster in <50ms without waiting for video recording.
 */
export async function exportFrameSnapshot(
  config: ShortConfig,
  frameType: 'question' | 'reveal' | 'explanation' | 'thumbnail' | 'hook',
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const scale = width / CANVAS_WIDTH;
  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }

  const durations = getTimelineDurations(config);
  let targetTime = 0;

  switch (frameType) {
    case 'hook':
      targetTime = durations.intro + durations.hook * 0.5;
      break;
    case 'question':
      targetTime = durations.intro + durations.hook + durations.question * 0.5;
      break;
    case 'reveal':
      targetTime = durations.intro + durations.hook + durations.question + durations.reveal * 0.5;
      break;
    case 'explanation':
      targetTime = durations.intro + durations.hook + durations.question + durations.reveal + durations.explanation * 0.5;
      break;
    case 'thumbnail':
    default:
      targetTime = durations.intro + durations.hook + durations.question * 0.2;
      break;
  }

  const layoutCache = buildLayoutCache(ctx, CANVAS_WIDTH, config);
  drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, targetTime, config, layoutCache);

  return canvas.toDataURL('image/png', 0.95);
}

// Helpers
function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function wrapTextDirect(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  centered: boolean
) {
  const lines = computeWrappedLines(ctx, text, maxWidth);
  let curY = centered ? y - ((lines.length - 1) * lineHeight) / 2 : y;

  for (const line of lines) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
}

function renderOptionTextWithAutoWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  centerY: number,
  maxWidth: number
) {
  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) {
    ctx.font = '600 32px sans-serif';
    ctx.fillText(text, x, centerY);
  } else {
    const words = text.split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');

    ctx.font = text.length > 50 ? '600 25px sans-serif' : '600 28px sans-serif';
    const lineHeight = text.length > 50 ? 32 : 36;
    ctx.fillText(line1, x, centerY - lineHeight / 2 + 2);
    ctx.fillText(line2, x, centerY + lineHeight / 2 - 2);
  }
}
