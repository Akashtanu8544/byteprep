import { ShortConfig } from '../../types';
import { SHORTS_THEMES } from './themes';
import { drawCanvasBytePrepLogo } from '../../components/BytePrepLogo';

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

export interface RenderCallbacks {
  onProgress: (progress: number, stage: string) => void;
  onComplete: (blob: Blob, videoUrl: string) => void;
  onError: (error: string) => void;
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
  config: ShortConfig
) {
  const theme = SHORTS_THEMES[config.themeId] || SHORTS_THEMES['byteprep-dark'];
  const { question, timerSeconds, hookText, appUrl, backgroundStyle = 'auto' } = config;

  // Timeline segment Durations (in seconds)
  const introDuration = 5.0; // Phase 1: Intro Frame (0 - 5s)
  const hookDuration = 3.0; // Phase 2: Hook (5 - 8s)
  const questionDuration = timerSeconds; // Phase 3: Question + Live Timer (8 - 18s)
  const answerRevealDuration = 5.0; // Phase 4: Time's Up + Reveal (18 - 23s)
  const explanationDuration = 8.0; // Phase 5: Detailed Explanation (23 - 31s)
  const ctaDuration = 4.0; // Phase 6: Outro CTA (31 - 35s)

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
  ctx.fillText('⚡ 10 SECONDS MCQ CHALLENGE', width / 2, 172);

  // Subject & Exam Badge Pill
  const badgeText = `${question.subject.toUpperCase()} • ${question.exam.toUpperCase()}`;
  ctx.font = 'bold 20px sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = Math.min(width - 160, badgeMetrics.width + 56);
  const badgeX = (width - badgeW) / 2;
  const badgeY = 215;
  const badgeH = 42;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  fillRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 21);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2);
  ctx.restore();

  // 3. Render Timeline Segment
  const t = currentTime;

  if (t < introDuration) {
    // PHASE 1: INTRO FRAME (0s - 5s)
    drawIntroPhase(ctx, width, height, t, question, theme);
  } else if (t < introDuration + hookDuration) {
    // PHASE 2: HOOK (5s - 8s)
    drawHookPhase(ctx, width, height, t - introDuration, hookText, theme);
  } else if (t < introDuration + hookDuration + questionDuration) {
    // PHASE 3: QUESTION + COUNTDOWN TIMER (8s - 18s)
    const elapsedInQ = t - (introDuration + hookDuration);
    const remainingTimer = Math.max(0, Math.ceil(timerSeconds - elapsedInQ));
    drawQuestionPhase(ctx, width, height, question, remainingTimer, timerSeconds, theme);
  } else if (t < introDuration + hookDuration + questionDuration + answerRevealDuration) {
    // PHASE 4: TIME'S UP + ANSWER REVEAL (18s - 23s)
    const elapsedInAns = t - (introDuration + hookDuration + questionDuration);
    drawAnswerRevealPhase(ctx, width, height, question, elapsedInAns, theme);
  } else if (t < introDuration + hookDuration + questionDuration + answerRevealDuration + explanationDuration) {
    // PHASE 5: EXPLANATION (23s - 31s)
    drawExplanationPhase(ctx, width, height, question, theme);
  } else {
    // PHASE 6: OUTRO CTA (31s - 35s)
    drawCtaPhase(ctx, width, height, appUrl || 'dsssbpyq.online', theme);
  }

  // 4. Footer Safe Banner on EVERY Frame (Perfect 2-Line Alignment + Start/End Logos)
  ctx.save();
  const footerW = width - 160; // 920px width
  const footerX = 80;
  const footerY = height - 185; // Sits comfortably above bottom social media overlay
  const footerH = 96;

  // Background Container
  ctx.fillStyle = 'rgba(10, 17, 40, 0.96)';
  fillRoundedRect(ctx, footerX, footerY, footerW, footerH, 24);
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Logo in STARTING (Left)
  drawCanvasBytePrepLogo(ctx, footerX + 56, footerY + footerH / 2, 64);

  // Center Text Line 1: Search BytePrep TGT PGT CS on Play Store
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Search BytePrep TGT PGT CS on Play Store',
    width / 2,
    footerY + 32
  );

  // Center Text Line 2: Visit Website : dsssbpyq.online
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Visit Website : dsssbpyq.online',
    width / 2,
    footerY + 65
  );

  // Logo in ENDING (Right)
  drawCanvasBytePrepLogo(ctx, footerX + footerW - 56, footerY + footerH / 2, 64);

  ctx.restore();
}

/**
 * Renders dynamic animated backgrounds (Falling Stars, Matrix Code, SQL, OS, Network)
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
  // Base background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, theme.bgGradient[0]);
  grad.addColorStop(0.5, theme.bgGradient[1] || theme.bgGradient[0]);
  grad.addColorStop(1, theme.bgGradient[2] || theme.bgGradient[0]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  // Determine effective style
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
    // 🌟 FALLING STARS & GLOWING METEORS ANIMATION
    const starCount = 65;
    for (let i = 0; i < starCount; i++) {
      const speed = 60 + (i % 5) * 45;
      const x = ((i * 137.5 + i * 29) % width);
      const y = ((time * speed + i * 190) % (height + 100)) - 50;
      const size = 1.5 + (i % 4) * 1.2;
      const alpha = 0.3 + 0.6 * Math.abs(Math.sin(time * 2 + i));

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      if (i % 4 === 0) {
        const tailGrad = ctx.createLinearGradient(x, y, x - 10, y - 35);
        tailGrad.addColorStop(0, `rgba(56, 189, 248, ${alpha * 0.8})`);
        tailGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y - 30);
        ctx.stroke();
      }
    }

    const meteorProgress = (time * 0.4) % 1;
    const meteorX = (meteorProgress * (width + 400)) - 200;
    const meteorY = meteorProgress * (height * 0.6) + 100;
    if (meteorX > 0 && meteorX < width && meteorY < height) {
      const meteorGrad = ctx.createLinearGradient(meteorX, meteorY, meteorX - 120, meteorY - 80);
      meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      meteorGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.6)');
      meteorGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.strokeStyle = meteorGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(meteorX, meteorY);
      ctx.lineTo(meteorX - 120, meteorY - 80);
      ctx.stroke();
    }
  } else if (effectiveStyle === 'matrix') {
    // 💻 LIVE MATRIX DIGITAL CODE RAIN
    ctx.font = 'bold 20px monospace';
    const cols = 14;
    const colSpacing = width / cols;
    const characters = '010101XYZ{}[]<>=/+#$%&~*';

    for (let c = 0; c < cols; c++) {
      const x = c * colSpacing + 20;
      const speed = 80 + (c % 4) * 35;
      const yHead = ((time * speed + c * 210) % (height + 300)) - 100;

      for (let row = 0; row < 12; row++) {
        const charY = yHead - row * 26;
        if (charY > 0 && charY < height) {
          const charIndex = (Math.floor(time * 10) + c * 3 + row) % characters.length;
          const char = characters[charIndex];
          const opacity = Math.max(0, 1 - row / 12);

          if (row === 0) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = `rgba(34, 197, 94, ${opacity * 0.4})`;
          }
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
      const y = ((time * 45 + idx * 280) % height);
      ctx.fillText(q, 50, y);
    });
  } else if (effectiveStyle === 'os') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.font = '18px monospace';
    const procs = [
      '[CPU CORE 0: 94% UTILIZED]',
      '[SCHEDULER: ROUND ROBIN Q=10ms]',
      '[PROCESS P1: RUNNING (PID 4096)]',
      '[MEMORY: 16GB / CACHE L1 HIT 98%]',
      '[THREAD T2: READY IN QUEUE]',
      '[BYTEPREP ENGINE: ACTIVE]',
    ];
    procs.forEach((p, idx) => {
      const x = (time * 40 + idx * 160) % (width - 150);
      const y = 280 + idx * 240;
      ctx.fillText(p, x, y);
    });
  } else if (effectiveStyle === 'network') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    const offset = (time * 50) % 140;
    for (let y = 0; y < height; y += 140) {
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(width, y + offset);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const px = (time * 110 + i * 150) % width;
      const py = (i * 200 + Math.sin(time * 1.5 + i) * 60) % height;
      ctx.fillStyle = theme.accentColor;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Soft atmospheric vignette
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.75);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Phase 1: Intro Frame (0s - 5s)
 */
function drawIntroPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  question: any,
  theme: any
) {
  ctx.save();
  const remainingIntro = Math.max(1, Math.ceil(5 - time));

  const boxW = width - 160; // 920px
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
 * Phase 2: Hook Phase (5s - 8s)
 */
function drawHookPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  hookText: string,
  theme: any
) {
  ctx.save();
  const progress = Math.min(1, time / 0.35);
  const scale = 0.92 + 0.08 * Math.sin((progress * Math.PI) / 2);

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
  wrapText(ctx, hookText, 0, -20, boxW - 80, 62, true);

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
 * Phase 3: Question + Live Countdown Timer (8s - 18s)
 */
function drawQuestionPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  timerVal: number,
  timerMax: number,
  theme: any
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

  const pct = timerVal / timerMax;
  let timerColorHex = '#10b981'; // Green (>50%)
  let statusLabel = '⚡ SPEED BONUS ACTIVE';

  if (pct <= 0.25) {
    timerColorHex = '#f43f5e'; // Red (<25%)
    statusLabel = '🚨 TIME IS RUNNING OUT!';
  } else if (pct <= 0.5) {
    timerColorHex = '#fbbf24'; // Yellow (25-50%)
    statusLabel = '⚠️ HURRY UP!';
  }

  // Active Progress Ring
  ctx.strokeStyle = timerColorHex;
  ctx.beginPath();
  ctx.arc(
    width / 2,
    timerY,
    timerRadius,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * pct,
    false
  );
  ctx.stroke();

  // Timer Digits Centered
  ctx.fillStyle = timerColorHex;
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(timerVal).padStart(2, '0'), width / 2, timerY + 3);

  // Status Label Pill under ring
  ctx.font = 'bold 20px sans-serif';
  const pillW = ctx.measureText(statusLabel).width + 36;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  fillRoundedRect(ctx, (width - pillW) / 2, timerY + 80, pillW, 36, 18);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = timerColorHex;
  ctx.fillText(statusLabel, width / 2, timerY + 98);

  // 2. Question Card
  const qCardY = 485;
  const qCardW = width - 160; // 920px
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
  wrapText(ctx, question.question, width / 2, qCardY + 28, qCardW - 60, 44, true);

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

    // Letter badge circle
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

    // Option text (Vertically auto-aligned so it never overlaps or touches border)
    ctx.fillStyle = theme.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    renderOptionTextWithAutoWrap(ctx, optionText, optX + 125, circleY, optW - 150);
  });

  ctx.restore();
}

/**
 * Phase 4: Time's Up + Answer Reveal (18s - 23s)
 * Exactly mirrors Phase 3 geometry so option boxes do not jump!
 */
function drawAnswerRevealPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  elapsedInAns: number,
  theme: any
) {
  ctx.save();

  // Top Title
  ctx.fillStyle = theme.timerColor;
  ctx.font = '900 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText("⏰ TIME'S UP!", width / 2, 330);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 28px sans-serif';
  ctx.fillText('CORRECT ANSWER REVEAL', width / 2, 400);

  // Question Card (Exact same dimensions as Phase 3)
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
  wrapText(ctx, question.question, width / 2, qCardY + 28, qCardW - 60, 44, true);

  // 4 Option Cards (Exact same startY and heights as Phase 3)
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
    renderOptionTextWithAutoWrap(ctx, optionText, optX + 125, circleY, optW - 150);

    // If correct, draw glowing check badge tag on right side
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
 * Phase 5: Explanation Phase (23s - 31s)
 */
function drawExplanationPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  question: any,
  theme: any
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
  wrapText(ctx, question.explanation, boxX + 45, boxY + 45, boxW - 90, 50, false);

  ctx.restore();
}

/**
 * Phase 6: CTA Outro Phase (31s - 35s)
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
 * Render and record a short video to WebM blob using HTML5 Canvas + MediaRecorder
 */
export async function exportShortVideo(
  config: ShortConfig,
  callbacks: RenderCallbacks
) {
  try {
    callbacks.onProgress(5, 'Preparing Canvas & Audio Pipeline...');

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D Context not available');
    }

    const fps = 30;
    const timerSeconds = config.timerSeconds;
    const totalDuration = 5.0 + 3.0 + timerSeconds + 5.0 + 8.0 + 4.0; // ~35s
    const totalFrames = Math.floor(totalDuration * fps);

    const stream = canvas.captureStream(fps);

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onerror = (err: any) => {
      callbacks.onError(err.message || 'MediaRecorder error occurred');
    };

    mediaRecorder.onstop = () => {
      callbacks.onProgress(98, 'Finalizing video file...');
      const blob = new Blob(chunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(blob);
      callbacks.onProgress(100, 'Video Ready!');
      callbacks.onComplete(blob, videoUrl);
    };

    mediaRecorder.start();

    let currentFrame = 0;

    const renderLoop = () => {
      if (currentFrame > totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const currentTime = currentFrame / fps;
      drawShortFrame(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, currentTime, config);

      if (currentFrame % 15 === 0) {
        const pct = Math.min(95, Math.floor((currentFrame / totalFrames) * 90) + 5);
        callbacks.onProgress(pct, `Rendering frame ${currentFrame}/${totalFrames}...`);
      }

      currentFrame++;
      setTimeout(renderLoop, 1000 / fps);
    };

    renderLoop();
  } catch (err: any) {
    callbacks.onError(err.message || 'Failed to render short video');
  }
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  centered: boolean
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      if (centered) {
        ctx.fillText(line.trim(), x, curY);
      } else {
        ctx.fillText(line.trim(), x, curY);
      }
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line.trim(), x, curY);
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
    // 2-line wrapped text
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
