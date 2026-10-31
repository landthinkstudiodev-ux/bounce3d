import React, { useState, useEffect } from 'react';
import {
  ArcadeIconTile,
  TreasureChest3DIcon,
  GoldRing3DIcon,
  GoldCoin3DIcon,
  EmeraldGem3DIcon,
  RedBall3DIcon,
} from './ArcadeIcons';

export interface ChestUnboxingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimRewards: (rings: number) => void;
  chestTitle?: string;
  rewardRings?: number;
}

export const ChestUnboxingModal: React.FC<ChestUnboxingModalProps> = ({
  isOpen,
  onClose,
  onClaimRewards,
  chestTitle = 'PETI HARTA EMAS SUPER',
  rewardRings = 3000,
}) => {
  const [stage, setStage] = useState<'closed' | 'opening' | 'revealed'>('closed');

  useEffect(() => {
    if (isOpen) {
      setStage('closed');
    }
  }, [isOpen]);

  const handleOpenChest = () => {
    setStage('opening');
    setTimeout(() => {
      setStage('revealed');
    }, 1200);
  };

  const handleClaimAll = () => {
    onClaimRewards(rewardRings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 border-2 border-amber-400/80 shadow-[0_25px_70px_rgba(245,158,11,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] p-6 text-white text-center flex flex-col items-center justify-between overflow-hidden">
        {/* Background Radial Light Rays */}
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-teal-500/10 to-transparent pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-amber-500/30">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-400 text-slate-950 shadow-md">
            UNBOXING HARTA 3D
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-teal-300 hover:text-white hover:bg-slate-700 transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Stage 1: Closed Chest */}
        {stage === 'closed' && (
          <div className="relative z-10 my-8 flex flex-col items-center">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 uppercase tracking-wide mb-2">
              {chestTitle}
            </h2>
            <p className="text-xs text-teal-200 mb-6 max-w-xs">
              Ketuk peti di bawah ini untuk membongkar ganjaran eksklusif milikmu!
            </p>

            <div
              onClick={handleOpenChest}
              className="group cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-300 relative"
            >
              {/* Pulsing Aura */}
              <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl animate-ping pointer-events-none" />

              <ArcadeIconTile className="w-32 h-32 sm:w-40 sm:h-40" glowColor="amber">
                <div className="animate-bounce">
                  <TreasureChest3DIcon className="w-24 h-24 sm:w-28 sm:h-28" />
                </div>
              </ArcadeIconTile>
            </div>

            <button
              onClick={handleOpenChest}
              className="mt-8 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_6px_20px_rgba(245,158,11,0.6)] border-2 border-yellow-200 hover:scale-105 active:scale-95 transition-all"
            >
              ✨ BUKA PETI SEKARANG!
            </button>
          </div>
        )}

        {/* Stage 2: Opening Animation */}
        {stage === 'opening' && (
          <div className="relative z-10 my-10 flex flex-col items-center justify-center animate-pulse">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-3xl animate-spin" />
              <TreasureChest3DIcon className="w-28 h-28 animate-spin" />
            </div>
            <h3 className="mt-6 text-xl font-black text-amber-300 tracking-wider uppercase animate-bounce">
              MEMBONGKAR PETI HARTA...
            </h3>
          </div>
        )}

        {/* Stage 3: Revealed Rewards */}
        {stage === 'revealed' && (
          <div className="relative z-10 my-6 flex flex-col items-center w-full animate-fadeIn">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
              🎉 SELAMAT! ANTAK DAPATKAN:
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-md mb-6">
              HADIAH PETI SUPER
            </h2>

            {/* Revealed Items Grid */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
              {/* Item 1: Rings */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-400/50 flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform">
                <GoldRing3DIcon className="w-12 h-12 mb-1" />
                <span className="text-xs font-black text-amber-300">+{rewardRings}</span>
                <span className="text-[10px] text-teal-200 font-medium">Cincin Emas</span>
              </div>

              {/* Item 2: Gems */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-400/50 flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform">
                <EmeraldGem3DIcon className="w-12 h-12 mb-1" />
                <span className="text-xs font-black text-emerald-300">+5 Gem</span>
                <span className="text-[10px] text-teal-200 font-medium">Batu Mulia</span>
              </div>

              {/* Item 3: Special Skin */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-rose-400/50 flex flex-col items-center shadow-lg transform hover:scale-105 transition-transform">
                <RedBall3DIcon className="w-12 h-12 mb-1" />
                <span className="text-xs font-black text-rose-300">Golden Skin</span>
                <span className="text-[10px] text-teal-200 font-medium">Akses Skin</span>
              </div>
            </div>

            <button
              onClick={handleClaimAll}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_6px_20px_rgba(16,185,129,0.5)] border-2 border-emerald-200 hover:scale-105 active:scale-95 transition-all"
            >
              ✓ KLAIM SEMUA HADIAH (+{rewardRings} CINCIN)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
