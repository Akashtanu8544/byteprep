import React, { useRef, useEffect } from 'react';
import { NormalizedQuestion } from '../../types';
import { SHORTS_THEMES } from './themes';
import { Download, Sparkles } from 'lucide-react';
import { drawCanvasBytePrepLogo } from '../../components/BytePrepLogo';

interface ThumbnailGeneratorProps {
  question: NormalizedQuestion;
  hookText: string;
  themeId: string;
}

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({
  question,
  hookText,
  themeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const theme = SHORTS_THEMES[themeId] || SHORTS_THEMES['byteprep-dark'];

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, theme.bgGradient[0]);
    grad.addColorStop(0.5, theme.bgGradient[1] || theme.bgGradient[0]);
    grad.addColorStop(1, theme.bgGradient[2] || theme.bgGradient[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Grid Accents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Top Header
    ctx.fillStyle = theme.accentColor;
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BYTEPREP CS', width / 2, 120);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('⚡ 10 SECOND CHALLENGE', width / 2, 185);

    // Big Impact Hook Box
    const hookBoxY = 320;
    const hookBoxW = width - 120;
    const hookBoxH = 480;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect((width - hookBoxW) / 2, hookBoxY, hookBoxW, hookBoxH, 36);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.accentColor;
    ctx.font = '900 80px sans-serif';
    ctx.fillText('⚡', width / 2, hookBoxY + 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px sans-serif';
    
    // Word wrapping hook text
    const words = hookText.split(' ');
    let line = '';
    let curY = hookBoxY + 180;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i] + ' ';
      if (ctx.measureText(test).width > hookBoxW - 80 && i > 0) {
        ctx.fillText(line.trim(), width / 2, curY);
        line = words[i] + ' ';
        curY += 76;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), width / 2, curY);

    // Subject/Exam Badge
    ctx.fillStyle = theme.accentColor;
    ctx.beginPath();
    ctx.roundRect((width - 600) / 2, 860, 600, 80, 40);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 36px sans-serif';
    ctx.fillText(question.subject.toUpperCase(), width / 2, 908);

    // Question Box
    const qY = 1000;
    const qW = width - 120;
    const qH = 680;

    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect((width - qW) / 2, qY, qW, qH, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.textColor;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    
    // Wrap question
    const qWords = question.question.split(' ');
    let qLine = '';
    let qCurY = qY + 90;
    for (let i = 0; i < qWords.length; i++) {
      const test = qLine + qWords[i] + ' ';
      if (ctx.measureText(test).width > qW - 100 && i > 0) {
        ctx.fillText(qLine.trim(), width / 2, qCurY);
        qLine = qWords[i] + ' ';
        qCurY += 60;
      } else {
        qLine = test;
      }
    }
    ctx.fillText(qLine.trim(), width / 2, qCurY);

    // Footer Banner with Start/End Logo & 2 Lines
    const footerW = width - 120;
    const footerX = 60;
    const footerY = height - 160;
    const footerH = 90;

    ctx.fillStyle = 'rgba(10, 17, 40, 0.95)';
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(footerX, footerY, footerW, footerH, 24);
    ctx.fill();
    ctx.stroke();

    drawCanvasBytePrepLogo(ctx, footerX + 50, footerY + footerH / 2, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Search BytePrep TGT PGT CS on Play Store', width / 2, footerY + 30);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 20px sans-serif';
    ctx.fillText('Visit Website : dsssbpyq.online', width / 2, footerY + 60);

    drawCanvasBytePrepLogo(ctx, footerX + footerW - 50, footerY + footerH / 2, 60);

  }, [question, hookText, themeId]);

  const downloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `BytePrepCS_Thumbnail_${question.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Cover Thumbnail Generator</span>
        </div>
        <button
          onClick={downloadThumbnail}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PNG</span>
        </button>
      </div>

      <div className="w-44 h-80 rounded-xl overflow-hidden border-2 border-sky-500/30 shadow-xl bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};
