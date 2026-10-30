import React, { useState, useEffect } from 'react';
import { I18nStrings } from '../game/i18n';
import { soundFX } from '../game/audio';
import { RedBall3DIcon } from './ArcadeIcons';

interface RewardedAdModalProps {
  t: I18nStrings;
  onRewardClaimed: () => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  t,
  onRewardClaimed,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [adMuted, setAdMuted] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanClaim(true);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          soundFX.playRingCollect(); // Chime when ad reward unlocks
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleClaim = () => {
    soundFX.playExtraLife();
    onRewardClaimed();
  };

  const handleAttemptClose = () => {
    if (canClaim) {
      handleClaim();
    } else {
      setShowExitConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 p-4 sm:p-5 shadow-[0_0_35px_rgba(251,191,36,0.22)] flex flex-col justify-between overflow-hidden relative modal-juice-pop">
        {/* Ad Video Top Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
              {t.adPlaying}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              {canClaim ? '🎁 Hadiah Siap!' : `⏱️ ${secondsLeft}s`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdMuted(!adMuted)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
            >
              {adMuted ? '🔇' : '🔊'}
            </button>
            <button
              type="button"
              onClick={handleAttemptClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Video Simulation Screen */}
        <div className="my-3 relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center">
          {/* Animated decorative shapes */}
          <div className="absolute w-24 h-24 bg-red-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
          <div className="absolute w-20 h-20 bg-amber-400/20 rounded-full blur-xl -bottom-4 -right-4 pointer-events-none" />

          <div className="relative z-10">
            <RedBall3DIcon className="w-12 h-12 mx-auto filter drop-shadow-[0_0_12px_rgba(239,68,68,0.6)] mb-2" />
            <h4 className="text-sm font-black text-white tracking-wide">
              Bounce Champions: Arcade 3D
            </h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Mainkan 11 Babak Seru & Raih Posisi #1 di Papan Skor Dunia!
            </p>
          </div>

          {/* Bottom Countdown Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - secondsLeft) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Prompt & Action */}
        <div className="text-center">
          <p className="text-xs text-slate-300 mb-3">
            {canClaim
              ? 'Selamat! Iklan selesai ditonton. Klaim +1 Bola untuk melanjutkan!'
              : t.adModalDesc}
          </p>

          {canClaim ? (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full py-2.5 px-4 rounded-xl btn-3d-green text-white font-display text-sm tracking-wider cursor-pointer flex items-center justify-center gap-2 uppercase"
            >
              <span>🎁</span>
              <span>{t.adSkipBtn}</span>
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Menyelesaikan iklan ({secondsLeft}s)...</span>
            </div>
          )}
        </div>

        {/* Exit Early Warning Modal */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20">
            <span className="text-3xl mb-2">⚠️</span>
            <h5 className="text-sm font-bold text-white mb-1">
              Lewati Iklan?
            </h5>
            <p className="text-xs text-slate-300 mb-4 px-2">
              Jika Anda menutup sekarang, Anda tidak akan mendapatkan +1 Bola tambahan.
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Lanjut Nonton
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
