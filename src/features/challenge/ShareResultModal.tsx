import React, { useRef, useEffect } from 'react';
import { PlayResult } from '../../types';
import { ShareService } from '../../services/shareService';
import { Share2, Download, X, Award, CheckCircle2, Sparkles } from 'lucide-react';

interface ShareResultModalProps {
  result: PlayResult;
  streak: number;
  onClose: () => void;
}

export const ShareResultModal: React.FC<ShareResultModalProps> = ({
  result,
  streak,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1080; // Square card for post/story
    canvas.width = w;
    canvas.height = h;

    // Dark Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid accent
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BYTEPREP CS', w / 2, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('⚡ 10 SECOND CHALLENGE RESULT', w / 2, 140);

    // Big Result Card
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.strokeStyle = result.isCorrect ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(80, 210, w - 160, 660, 36);
    ctx.fill();
    ctx.stroke();

    // Subject Badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(result.question.subject.toUpperCase(), w / 2, 260);

    // Result Status
    ctx.fillStyle = result.isCorrect ? '#10b981' : '#f43f5e';
    ctx.font = '900 64px sans-serif';
    ctx.fillText(result.isCorrect ? '🏆 CORRECT!' : '❌ INCORRECT', w / 2, 330);

    // Score & Streak
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px sans-serif';
    ctx.fillText(`SCORE: ${result.score} PTS`, w / 2, 430);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`🔥 ${streak} DAY STREAK`, w / 2, 500);

    // Question excerpt
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 32px sans-serif';
    const qExcerpt = `Q: "${result.question.question.substring(0, 90)}..."`;
    ctx.fillText(qExcerpt, w / 2, 590);

    // CTA
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 36px sans-serif';
    ctx.fillText('CAN YOU BEAT MY SCORE?', w / 2, 740);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 24px sans-serif';
    ctx.fillText('BYTEPREP CS • PRACTICE MORE CS MCQs', w / 2, h - 70);

  }, [result, streak]);

  const handleShare = async () => {
    const res = await ShareService.shareResult(result, streak);
    if (res.method === 'clipboard') {
      alert('Result copied to clipboard!');
    }
  };

  const handleDownloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `BytePrepCS_Result_${result.question.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <span>Share Challenge Card</span>
        </h3>

        {/* Canvas Result Card Preview */}
        <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl mb-6 bg-slate-950">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE</span>
          </button>

          <button
            onClick={handleDownloadCard}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
