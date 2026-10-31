import React from 'react';
import { GameLang, TRANSLATIONS } from '../game/i18n';
import { GoldRing3DIcon } from './ArcadeIcons';
import { getStageParTime } from './SplashAndLoopModals';

interface GoldVictoryToastProps {
  isOpen: boolean;
  levelNumber: number;
  score: number;
  clearTime?: number;
  bestTime?: number | null;
  isNewRecord?: boolean;
  earnedStars?: number;
  collectedRings?: number;
  totalRings?: number;
  lang: GameLang;
  onNext: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

export const GoldVictoryToast: React.FC<GoldVictoryToastProps> = ({
  isOpen,
  levelNumber,
  score,
  clearTime,
  bestTime,
  isNewRecord,
  earnedStars = 3,
  collectedRings = 0,
  totalRings = 0,
  lang,
  onNext,
  onReplay,
  onMenu,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const parTime = getStageParTime(levelNumber);
  const displayTime = clearTime ?? bestTime ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto modal-juice-pop">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-950/95 via-slate-950/98 to-slate-950 p-5 sm:p-6 shadow-[0_0_50px_rgba(251,191,36,0.35)] text-white overflow-hidden text-center">
        {/* Radiant Gold Ring Halo Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

        {/* Floating Gold Ring Icon Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-200 border-2 border-amber-200 flex items-center justify-center shadow-[0_0_25px_rgba(252,211,77,0.6)] mb-3 animate-bounce">
          <GoldRing3DIcon className="w-10 h-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Victory Title */}
        <div className="text-xs uppercase font-black tracking-widest text-amber-400 mb-0.5">
          {t.stageWord} {levelNumber} {lang === 'id' ? 'SELESAI!' : 'CLEARED!'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight drop-shadow-md mb-2">
          {t.titleStageClear(levelNumber)}
        </h2>

        {/* 1-3 Star Rating Display */}
        <div className="flex items-center justify-center gap-2 my-2">
          {[1, 2, 3].map((starIdx) => {
            const active = starIdx <= earnedStars;
            return (
              <div
                key={starIdx}
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl transition-transform ${
                  active
                    ? 'bg-amber-400/25 border-amber-300 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.45)] scale-105'
                    : 'bg-slate-900/80 border-white/10 text-slate-600'
                }`}
              >
                ★
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-300 mb-2">
          {earnedStars === 3
            ? lang === 'id'
              ? '★★★ Sempurna! Waktu cepat & sisa nyawa terjaga!'
              : '★★★ Perfect! Fast clear time & lives preserved!'
            : earnedStars === 2
            ? lang === 'id'
              ? `★★ Bagus! Selesaikan ≤ ${parTime}s dengan ≥2 nyawa untuk 3★`
              : `★★ Great! Clear in ≤ ${parTime}s with ≥2 lives for 3★`
            : lang === 'id'
            ? `★ Lulus! Capai waktu ≤ ${parTime}s untuk meraih 3★`
            : `★ Cleared! Beat ${parTime}s par time to earn 3★`}
        </div>

        {/* New Record Banner if applicable */}
        {isNewRecord && (
          <div className="inline-block px-3 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-2">
            ★ {lang === 'id' ? 'REKOR WAKTU TERCEPAT!' : 'NEW SPEEDRUN RECORD!'} ★
          </div>
        )}

        {/* Stats Grid: Score, Clear Time, Rings */}
        <div className="grid grid-cols-3 gap-2 my-3 bg-slate-900/80 border border-amber-400/30 rounded-2xl p-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'SKOR' : 'SCORE'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-amber-300 tabular-nums mt-0.5">
              {String(score).padStart(6, '0')}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'WAKTU' : 'TIME'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-emerald-300 tabular-nums mt-0.5">
              {displayTime !== null ? `${displayTime}s` : '--'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'CINCIN' : 'RINGS'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-sky-300 tabular-nums mt-0.5">
              {totalRings > 0 ? `${collectedRings}/${totalRings}` : '100%'}
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="button"
            onClick={onNext}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.5)] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>{t.nextStageBtn(levelNumber + 1)}</span>
            <span>▶</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="w-full min-h-[38px] py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-amber-400/40 text-amber-300 font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              {t.retryStageBtn(levelNumber)}
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="w-full min-h-[38px] py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/15 text-slate-300 font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              {t.mainMenuBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

