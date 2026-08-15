import React from 'react';

interface BytePrepLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

/**
 * High-fidelity Vector SVG rendition of BytePrep CS Logo
 * (Dark squircle icon, glowing neon blue-purple book badge, yellow graduation cap, 'B.', 'BytePrep', '• CS •')
 */
export const BytePrepLogo: React.FC<BytePrepLogoProps> = ({
  size = 40,
  showText = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md rounded-2xl"
      >
        <defs>
          <linearGradient id="bpBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1128" />
            <stop offset="50%" stopColor="#0c183a" />
            <stop offset="100%" stopColor="#070c1e" />
          </linearGradient>

          <linearGradient id="bpBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          <linearGradient id="bpCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="bpBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* Outer squircle container */}
        <rect
          x="4"
          y="4"
          width="192"
          height="192"
          rx="44"
          fill="url(#bpBgGrad)"
          stroke="url(#bpBorderGrad)"
          strokeWidth="6"
        />

        {/* Inner Card Screen */}
        <rect
          x="38"
          y="34"
          width="124"
          height="132"
          rx="24"
          fill="url(#bpCardGrad)"
          stroke="url(#bpBorderGrad)"
          strokeWidth="4"
        />

        {/* Top Dots on Screen */}
        <circle cx="62" cy="48" r="4" fill="#38bdf8" />
        <circle cx="76" cy="48" r="4" fill="#818cf8" />
        <circle cx="90" cy="48" r="4" fill="#facc15" />
        <circle cx="104" cy="48" r="4" fill="#facc15" />

        {/* Big Bold 'B.' */}
        <text
          x="100"
          y="126"
          fill="url(#bpBGrad)"
          fontSize="82"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
        >
          B<tspan fill="#a855f7">.</tspan>
        </text>

        {/* Golden Graduation Cap Mortarboard (Top Right Corner) */}
        <g transform="translate(115, 16) scale(0.68)">
          {/* Diamond Cap */}
          <polygon
            points="50,10 95,30 50,50 5,30"
            fill="url(#capGrad)"
            stroke="#a16207"
            strokeWidth="3"
          />
          {/* Cap Base */}
          <path
            d="M 24,38 Q 50,56 76,38 L 76,52 Q 50,68 24,52 Z"
            fill="#eab308"
            stroke="#a16207"
            strokeWidth="2"
          />
          {/* Tassel Button */}
          <circle cx="50" cy="30" r="4" fill="#fef08a" />
          {/* Dangling Tassel */}
          <path
            d="M 50,30 Q 82,36 86,58"
            fill="none"
            stroke="#fde047"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="86" cy="60" r="3.5" fill="#ca8a04" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center text-lg font-black tracking-tight leading-none">
            <span className="text-white">Byte</span>
            <span className="text-sky-400">Prep</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-widest text-slate-300 mt-0.5">
            <span className="text-amber-400">•</span>
            <span className="text-sky-300">CS</span>
            <span className="text-amber-400">•</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper to draw BytePrep Logo on HTML5 Canvas (for video frames, intro/outro, thumbnails, footer)
 */
export function drawCanvasBytePrepLogo(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number
) {
  ctx.save();
  ctx.translate(centerX - size / 2, centerY - size / 2);
  const scale = size / 200;
  ctx.scale(scale, scale);

  // Outer background squircle
  ctx.beginPath();
  roundRect(ctx, 4, 4, 192, 192, 44);
  const bgGrad = ctx.createLinearGradient(0, 0, 200, 200);
  bgGrad.addColorStop(0, '#0a1128');
  bgGrad.addColorStop(0.5, '#0c183a');
  bgGrad.addColorStop(1, '#070c1e');
  ctx.fillStyle = bgGrad;
  ctx.fill();

  const borderGrad = ctx.createLinearGradient(0, 0, 200, 200);
  borderGrad.addColorStop(0, '#38bdf8');
  borderGrad.addColorStop(0.5, '#818cf8');
  borderGrad.addColorStop(1, '#c084fc');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner Card
  ctx.beginPath();
  roundRect(ctx, 38, 34, 124, 132, 24);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Screen top dots
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(62, 48, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#818cf8';
  ctx.beginPath(); ctx.arc(76, 48, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath(); ctx.arc(90, 48, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(104, 48, 4, 0, Math.PI * 2); ctx.fill();

  // B. Letter
  const bGrad = ctx.createLinearGradient(60, 60, 140, 140);
  bGrad.addColorStop(0, '#38bdf8');
  bGrad.addColorStop(0.6, '#60a5fa');
  bGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = bGrad;
  ctx.font = '900 82px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('B.', 100, 126);

  // Graduation Cap on Top Right
  ctx.save();
  ctx.translate(115, 16);
  ctx.scale(0.68, 0.68);

  ctx.fillStyle = '#eab308';
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 10);
  ctx.lineTo(95, 30);
  ctx.lineTo(50, 50);
  ctx.lineTo(5, 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cap Base
  ctx.beginPath();
  ctx.moveTo(24, 38);
  ctx.quadraticCurveTo(50, 56, 76, 38);
  ctx.lineTo(76, 52);
  ctx.quadraticCurveTo(50, 68, 24, 52);
  ctx.closePath();
  ctx.fillStyle = '#ca8a04';
  ctx.fill();
  ctx.stroke();

  // Tassel
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, 30);
  ctx.quadraticCurveTo(82, 36, 86, 58);
  ctx.stroke();
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath(); ctx.arc(86, 60, 3.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  ctx.restore();
}

function roundRect(
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
}
