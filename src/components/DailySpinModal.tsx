import React, { useState } from 'react';
import { I18nStrings } from '../game/i18n';
import { soundFX } from '../game/audio';
import { ArcadeIconTile, FortuneWheel3DIcon } from './ArcadeIcons';

interface DailySpinModalProps {
  t: I18nStrings;
  canSpin: boolean;
  onSpinResult: (rewardCoins: number, rewardLabel: string) => void;
  onClose: () => void;
}

const SPIN_SECTORS = [
  { label: '+100 Cincin', coins: 100, color: '#f59e0b' },
  { label: '+1 Bola Nyawa', coins: 50, color: '#10b981' },
  { label: '+250 Cincin', coins: 250, color: '#3b82f6' },
  { label: 'Coba Lagi Besok', coins: 0, color: '#ef4444' },
  { label: '+500 Cincin Emas!', coins: 500, color: '#8b5cf6' },
  { label: '+50 Cincin', coins: 50, color: '#ec4899' },
];

export const DailySpinModal: React.FC<DailySpinModalProps> = ({
  t,
  canSpin,
  onSpinResult,
  onClose,
}) => {
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  const handleSpin = () => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    soundFX.playRingCollect();

    const randomIdx = Math.floor(Math.random() * SPIN_SECTORS.length);
    const degreesPerSector = 360 / SPIN_SECTORS.length;
    const targetDeg = 360 * 5 + (SPIN_SECTORS.length - randomIdx) * degreesPerSector - degreesPerSector / 2;

    setRotation(targetDeg);

    setTimeout(() => {
      setSpinning(false);
      const prize = SPIN_SECTORS[randomIdx];
      setWonPrize(prize.label);
      soundFX.playWinTune();
      onSpinResult(prize.coins, prize.label);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 p-5 shadow-[0_0_35px_rgba(251,191,36,0.22)] flex flex-col items-center text-center relative modal-juice-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          ✕
        </button>

        {/* 3D Fortune Wheel Header Icon */}
        <ArcadeIconTile glowColor="amber" className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 mb-2">
          <FortuneWheel3DIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </ArcadeIconTile>

        <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-400">
          Putar Roda Keberuntungan
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 mb-3">
          Putar setiap hari gratis untuk memenangkan koin cincin & hadiah menarik!
        </p>

        {/* High-Fidelity 3D-Styled SVG Wheel */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 my-2 flex items-center justify-center">
          {/* Top Golden Pointer */}
          <div className="absolute -top-3.5 z-20 flex flex-col items-center">
            <div className="w-5 h-6 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 clip-triangle shadow-lg drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]" />
            <div className="w-3 h-3 rounded-full bg-yellow-200 border border-amber-500 -mt-2 shadow" />
          </div>

          {/* Rotating Wheel Container */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.4)] relative overflow-hidden transition-all duration-[3200ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <radialGradient id="goldHub" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#854d0e" />
                </radialGradient>
              </defs>

              {/* 6 Vibrant Conic Sectors */}
              <path d="M100,100 L100,0 A100,100 0 0,1 186.6,50 Z" fill="#f59e0b" />
              <path d="M100,100 L186.6,50 A100,100 0 0,1 186.6,150 Z" fill="#10b981" />
              <path d="M100,100 L186.6,150 A100,100 0 0,1 100,200 Z" fill="#3b82f6" />
              <path d="M100,100 L100,200 A100,100 0 0,1 13.4,150 Z" fill="#ef4444" />
              <path d="M100,100 L13.4,150 A100,100 0 0,1 13.4,50 Z" fill="#8b5cf6" />
              <path d="M100,100 L13.4,50 A100,100 0 0,1 100,0 Z" fill="#ec4899" />

              {/* Sector Divider Rays */}
              <line x1="100" y1="100" x2="100" y2="0" stroke="#fef08a" strokeWidth="2.5" />
              <line x1="100" y1="100" x2="186.6" y2="50" stroke="#fef08a" strokeWidth="2.5" />
              <line x1="100" y1="100" x2="186.6" y2="150" stroke="#fef08a" strokeWidth="2.5" />
              <line x1="100" y1="100" x2="100" y2="200" stroke="#fef08a" strokeWidth="2.5" />
              <line x1="100" y1="100" x2="13.4" y2="150" stroke="#fef08a" strokeWidth="2.5" />
              <line x1="100" y1="100" x2="13.4" y2="50" stroke="#fef08a" strokeWidth="2.5" />

              {/* Sector Labels */}
              <text x="125" y="42" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(30,125,42)">+100</text>
              <text x="152" y="105" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(90,152,105)">+1 Nyawa</text>
              <text x="125" y="165" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(150,125,165)">+250</text>
              <text x="65" y="165" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(210,65,165)">Zonk</text>
              <text x="35" y="105" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(270,35,105)">+500</text>
              <text x="65" y="42" fill="#ffffff" fontSize="10" fontWeight="900" transform="rotate(330,65,42)">+50</text>

              {/* Center Golden Metallic Hub */}
              <circle cx="100" cy="100" r="24" fill="url(#goldHub)" stroke="#ffffff" strokeWidth="2" />
              <circle cx="100" cy="100" r="10" fill="#0f172a" />
            </svg>
          </div>
        </div>

        {wonPrize ? (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-xs animate-bounce">
            🎉 Selamat! Anda Mendapatkan: {wonPrize}
          </div>
        ) : canSpin ? (
          <button
            type="button"
            disabled={spinning}
            onClick={handleSpin}
            className="mt-3 w-full py-2.5 px-4 rounded-xl btn-3d-amber text-slate-950 font-black text-xs tracking-wider cursor-pointer uppercase shadow-lg"
          >
            {spinning ? 'Memutar...' : 'Putar Sekarang!'}
          </button>
        ) : (
          <div className="mt-3 text-xs text-slate-400 font-bold p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            ⏳ Anda sudah memutar roda hari ini. Kembali lagi besok!
          </div>
        )}
      </div>
    </div>
  );
};
