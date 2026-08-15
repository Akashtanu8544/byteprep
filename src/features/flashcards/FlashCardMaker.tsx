import React, { useState, useEffect, useRef } from 'react';
import { NormalizedQuestion } from '../../types';
import { drawCanvasBytePrepLogo } from '../../components/BytePrepLogo';
import {
  Download,
  RotateCw,
  Sparkles,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Palette,
  Share2,
  Eye,
  FileImage,
} from 'lucide-react';

interface FlashCardMakerProps {
  question: NormalizedQuestion;
}

type FlashCardTheme = 'dark-navy' | 'cyber-purple' | 'amber-gold' | 'clean-light';

export const FlashCardMaker: React.FC<FlashCardMakerProps> = ({ question }) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [theme, setTheme] = useState<FlashCardTheme>('dark-navy');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const correctLetter = String.fromCharCode(65 + question.correctAnswer);
  const correctOptionText = question.options[question.correctAnswer] || '';

  // Themes config
  const THEME_CONFIGS: Record<
    FlashCardTheme,
    {
      name: string;
      bg: [string, string];
      border: string;
      cardBg: string;
      textPrimary: string;
      textSecondary: string;
      accent: string;
      badgeBg: string;
      badgeText: string;
      correctBg: string;
      correctBorder: string;
    }
  > = {
    'dark-navy': {
      name: '🌙 BytePrep Dark Navy',
      bg: ['#0a1128', '#070c1e'],
      border: '#38bdf8',
      cardBg: '#0f172a',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      accent: '#38bdf8',
      badgeBg: '#1e293b',
      badgeText: '#38bdf8',
      correctBg: 'rgba(16, 185, 129, 0.15)',
      correctBorder: '#10b981',
    },
    'cyber-purple': {
      name: '🔮 Cyber Violet',
      bg: ['#1e1035', '#0f051d'],
      border: '#a855f7',
      cardBg: '#1e1138',
      textPrimary: '#ffffff',
      textSecondary: '#c084fc',
      accent: '#c084fc',
      badgeBg: '#2e1065',
      badgeText: '#f472b6',
      correctBg: 'rgba(168, 85, 247, 0.2)',
      correctBorder: '#a855f7',
    },
    'amber-gold': {
      name: '👑 Exam Gold',
      bg: ['#1c1300', '#0a0800'],
      border: '#f59e0b',
      cardBg: '#261b05',
      textPrimary: '#ffffff',
      textSecondary: '#fde68a',
      accent: '#facc15',
      badgeBg: '#451a03',
      badgeText: '#facc15',
      correctBg: 'rgba(234, 179, 8, 0.2)',
      correctBorder: '#eab308',
    },
    'clean-light': {
      name: '☀️ Crisp Study Light',
      bg: ['#f8fafc', '#f1f5f9'],
      border: '#0284c7',
      cardBg: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      accent: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
      correctBg: '#ecfdf5',
      correctBorder: '#059669',
    },
  };

  // Render Flashcard onto Canvas
  const renderCanvas = (
    side: 'front' | 'back',
    canvas: HTMLCanvasElement | null
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const cfg = THEME_CONFIGS[theme];

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, cfg.bg[0]);
    bgGrad.addColorStop(1, cfg.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative subtle grid / glowing lines
    ctx.save();
    ctx.strokeStyle = `${cfg.accent}15`;
    ctx.lineWidth = 2;
    for (let i = 80; i < width; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 80; j < height; j += 80) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }
    ctx.restore();

    // Main Card Border Container
    const cardPad = 60;
    const cardW = width - cardPad * 2;
    const cardH = height - cardPad * 2;
    const cardX = cardPad;
    const cardY = cardPad;

    ctx.save();
    ctx.fillStyle = cfg.cardBg;
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 36);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Top Header: BytePrep Logo + Exam & Subject Pills
    drawCanvasBytePrepLogo(ctx, cardX + 70, cardY + 70, 76);

    // Brand Name
    ctx.fillStyle = cfg.textPrimary;
    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('BytePrep TGT PGT CS', cardX + 125, cardY + 60);

    ctx.fillStyle = cfg.accent;
    ctx.font = '800 20px sans-serif';
    ctx.fillText('CS REVISION FLASHCARD', cardX + 125, cardY + 90);

    // Exam / Topic Badge Pill on Top Right
    const badgeText = `${question.exam} • ${question.subject}`;
    ctx.font = 'bold 22px sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 36;
    const badgeX = cardX + cardW - badgeW - 30;
    const badgeY = cardY + 45;

    ctx.fillStyle = cfg.badgeBg;
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 44, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 22);

    // Top Divider Line
    ctx.strokeStyle = `${cfg.border}40`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 30, cardY + 130);
    ctx.lineTo(cardX + cardW - 30, cardY + 130);
    ctx.stroke();

    // SIDE SPECIFIC RENDERING
    if (side === 'front') {
      // 1. Question Statement
      ctx.fillStyle = cfg.textPrimary;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const words = question.question.split(' ');
      let line = '';
      let qY = cardY + 160;
      const maxQWidth = cardW - 70;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxQWidth && i > 0) {
          ctx.fillText(line.trim(), cardX + 35, qY);
          line = words[i] + ' ';
          qY += 48;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), cardX + 35, qY);

      // 2. Options Grid (4 Options)
      const optStartY = Math.max(qY + 70, cardY + 380);
      const optH = 80;
      const optGap = 20;

      question.options.forEach((opt, idx) => {
        const oY = optStartY + idx * (optH + optGap);
        const letter = String.fromCharCode(65 + idx);

        ctx.fillStyle = cfg.badgeBg;
        ctx.strokeStyle = `${cfg.border}50`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX + 35, oY, cardW - 70, optH, 20);
        ctx.fill();
        ctx.stroke();

        // Option Letter Circle
        ctx.fillStyle = cfg.accent;
        ctx.beginPath();
        ctx.arc(cardX + 80, oY + optH / 2, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a1128';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, cardX + 80, oY + optH / 2);

        // Option Text
        ctx.fillStyle = cfg.textPrimary;
        ctx.font = '600 26px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(opt.slice(0, 55), cardX + 125, oY + optH / 2);
      });
    } else {
      // BACK SIDE: Correct Answer Reveal + Full Explanation + Key Note
      // 1. "CORRECT ANSWER" Banner
      const ansBoxY = cardY + 160;
      ctx.fillStyle = cfg.correctBg;
      ctx.strokeStyle = cfg.correctBorder;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX + 35, ansBoxY, cardW - 70, 110, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cfg.correctBorder;
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('✅ CORRECT ANSWER', cardX + 65, ansBoxY + 20);

      ctx.fillStyle = cfg.textPrimary;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(
        `Option ${correctLetter} : ${correctOptionText}`,
        cardX + 65,
        ansBoxY + 56
      );

      // 2. Explanation / Why Section
      const expStartY = ansBoxY + 140;
      ctx.fillStyle = cfg.accent;
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📖 DETAILED EXPLANATION & CONCEPT:', cardX + 35, expStartY);

      ctx.fillStyle = cfg.textSecondary;
      ctx.font = '500 26px sans-serif';
      const expWords = (question.explanation || 'Refer standard CS syllabus.').split(' ');
      let expLine = '';
      let expY = expStartY + 45;
      const maxExpW = cardW - 70;

      for (let i = 0; i < expWords.length; i++) {
        const testExp = expLine + expWords[i] + ' ';
        if (ctx.measureText(testExp).width > maxExpW && i > 0) {
          ctx.fillText(expLine.trim(), cardX + 35, expY);
          expLine = expWords[i] + ' ';
          expY += 40;
        } else {
          expLine = testExp;
        }
      }
      ctx.fillText(expLine.trim(), cardX + 35, expY);

      // 3. Exam Takeaway Box
      const noteY = Math.max(expY + 60, cardY + 540);
      ctx.fillStyle = cfg.badgeBg;
      ctx.strokeStyle = `${cfg.border}60`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX + 35, noteY, cardW - 70, 130, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cfg.accent;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('⚡ EXAM REVISION TIP:', cardX + 60, noteY + 25);

      ctx.fillStyle = cfg.textPrimary;
      ctx.font = '600 22px sans-serif';
      ctx.fillText(
        `Topic '${question.topic}' carries frequent weightage in ${question.exam}.`,
        cardX + 60,
        noteY + 60
      );
      ctx.fillStyle = cfg.textSecondary;
      ctx.font = '500 18px sans-serif';
      ctx.fillText(
        'Revise related time complexities, definitions, and protocol standards.',
        cardX + 60,
        noteY + 92
      );
    }

    // BOTTOM FOOTER: Two-Line perfectly aligned text with BytePrep logos
    const footerW = cardW - 70;
    const footerX = cardX + 35;
    const footerY = cardY + cardH - 120;
    const footerH = 90;

    ctx.fillStyle = cfg.badgeBg;
    ctx.strokeStyle = `${cfg.border}80`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(footerX, footerY, footerW, footerH, 24);
    ctx.fill();
    ctx.stroke();

    // Start Logo
    drawCanvasBytePrepLogo(ctx, footerX + 45, footerY + footerH / 2, 60);

    // Two lines in center
    ctx.fillStyle = cfg.textPrimary;
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Search BytePrep TGT PGT CS on Play Store', width / 2, footerY + 28);

    ctx.fillStyle = cfg.accent;
    ctx.font = '800 20px sans-serif';
    ctx.fillText('Visit Website : dsssbpyq.online', width / 2, footerY + 58);

    // End Logo
    drawCanvasBytePrepLogo(ctx, footerX + footerW - 45, footerY + footerH / 2, 60);
  };

  useEffect(() => {
    renderCanvas('front', frontCanvasRef.current);
    renderCanvas('back', backCanvasRef.current);
  }, [question, theme]);

  const downloadCanvasImage = (side: 'front' | 'back' | 'both') => {
    setIsGenerating(true);
    try {
      if (side === 'front' && frontCanvasRef.current) {
        const link = document.createElement('a');
        link.download = `BytePrep_Flashcard_Front_${question.id}.png`;
        link.href = frontCanvasRef.current.toDataURL('image/png');
        link.click();
      } else if (side === 'back' && backCanvasRef.current) {
        const link = document.createElement('a');
        link.download = `BytePrep_Flashcard_Answer_${question.id}.png`;
        link.href = backCanvasRef.current.toDataURL('image/png');
        link.click();
      } else if (side === 'both') {
        // Download both front and back
        if (frontCanvasRef.current) {
          const l1 = document.createElement('a');
          l1.download = `BytePrep_Flashcard_1_Question_${question.id}.png`;
          l1.href = frontCanvasRef.current.toDataURL('image/png');
          l1.click();
        }
        setTimeout(() => {
          if (backCanvasRef.current) {
            const l2 = document.createElement('a');
            l2.download = `BytePrep_Flashcard_2_Answer_${question.id}.png`;
            l2.href = backCanvasRef.current.toDataURL('image/png');
            l2.click();
          }
        }, 500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyFlashcardMarkdown = () => {
    const md = `📚 **BYTEPREP CS REVISION FLASHCARD**
────────────────────────────
🎯 **Exam:** ${question.exam} | **Subject:** ${question.subject}
📖 **Topic:** ${question.topic}

❓ **QUESTION:**
${question.question}

${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
💡 **CORRECT ANSWER:** Option ${correctLetter} (${correctOptionText})

📘 **EXPLANATION:**
${question.explanation}

⚡ **Powered By BytePrep TGT PGT CS**
📲 Search **BytePrep TGT PGT CS** on Play Store | https://dsssbpyq.online`;

    navigator.clipboard.writeText(md);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-white font-black text-base sm:text-lg tracking-tight">
              1-Click Study FlashCard Maker
            </h3>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black">
              1080x1080 HD PNG
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Generate high-resolution Question & Answer Flashcards for quick study, Instagram carousels, and Telegram study channels.
          </p>
        </div>

        {/* 1-Click Download Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadCanvasImage('front')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Question (PNG)</span>
          </button>

          <button
            onClick={() => downloadCanvasImage('back')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Answer (PNG)</span>
          </button>

          <button
            onClick={() => downloadCanvasImage('both')}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>1-CLICK DOWNLOAD BOTH</span>
          </button>
        </div>
      </div>

      {/* Theme Picker */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-300">Visual Theme:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(THEME_CONFIGS) as FlashCardTheme[]).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                theme === t
                  ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {THEME_CONFIGS[t].name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Flip Card Preview */}
      <div className="flex flex-col items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sky-400 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg"
          >
            <RotateCw className="w-4 h-4" />
            <span>{isFlipped ? 'Show Question (Front)' : 'Flip to Reveal Answer (Back)'}</span>
          </button>

          <button
            onClick={copyFlashcardMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied Text' : 'Copy Text'}</span>
          </button>
        </div>

        {/* 3D Preview Frame */}
        <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800">
          <canvas
            ref={frontCanvasRef}
            className={`w-full h-full object-contain transition-all duration-500 absolute inset-0 ${
              isFlipped ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'
            }`}
          />
          <canvas
            ref={backCanvasRef}
            className={`w-full h-full object-contain transition-all duration-500 absolute inset-0 ${
              isFlipped ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'
            }`}
          />

          <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-full text-[10px] text-slate-300 font-bold pointer-events-none flex items-center gap-1">
            <Eye className="w-3 h-3 text-sky-400" />
            <span>{isFlipped ? 'ANSWER REVEAL' : 'QUESTION CARD'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
