import React, { useState, useEffect } from 'react';
import {
  ArcadeIconTile,
  GoldRing3DIcon,
  GoldCoin3DIcon,
  Stopwatch3DIcon,
  EmeraldGem3DIcon,
  GreenCheckmark3DIcon,
  GlowingRedLock3DIcon,
  TrophyCrest3DIcon,
} from './ArcadeIcons';
import { ArcadeAssetIcon } from './ArcadeAssetManager';
import {
  getLoginStreakData,
  recordLoginStreakClaim,
  LoginStreakInfo,
} from '../services/authService';

export interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (rings: number, keys: number, day: number, isChestReward?: boolean) => void;
  onOpenChestModal: () => void;
  userRings: number;
  playerUid?: string;
}

interface StreakDayConfig {
  day: number;
  rings: number;
  keys: number;
  label: string;
  isSpecial?: boolean;
  iconType: 'ring' | 'coin' | 'stopwatch' | 'gem' | 'chest';
}

const STREAK_DAYS: StreakDayConfig[] = [
  { day: 1, rings: 100, keys: 0, label: '100 Cincin', iconType: 'ring' },
  { day: 2, rings: 250, keys: 1, label: '250 Cincin + 🗝️1 Kunci', iconType: 'ring' },
  { day: 3, rings: 500, keys: 1, label: '500 Cincin + 🗝️1 Kunci', iconType: 'stopwatch' },
  { day: 4, rings: 750, keys: 1, label: '750 Cincin + 🗝️1 Kunci', iconType: 'coin' },
  { day: 5, rings: 1000, keys: 2, label: '1.000 Cincin + 🗝️2 Kunci', iconType: 'gem' },
  { day: 6, rings: 1500, keys: 2, label: '1.500 Cincin + 🗝️2 Kunci', iconType: 'coin' },
  {
    day: 7,
    rings: 3000,
    keys: 3,
    label: 'PETI HARTA EMAS SUPER + 🗝️3 KUNCI',
    isSpecial: true,
    iconType: 'chest',
  },
];

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
  onOpenChestModal,
  playerUid = 'guest_local',
}) => {
  const [streakInfo, setStreakInfo] = useState<LoginStreakInfo>(() =>
    getLoginStreakData(playerUid)
  );

  useEffect(() => {
    setStreakInfo(getLoginStreakData(playerUid));
  }, [playerUid]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateString();
  const hasClaimedToday = streakInfo.lastLoginDate === todayStr;

  // Calculate current target day to claim
  const currentTargetDay = streakInfo.claimedDays.length >= 7 
    ? 7 
    : streakInfo.claimedDays.length + 1;

  const handleClaim = async (dayConfig: StreakDayConfig) => {
    if (hasClaimedToday && dayConfig.day === currentTargetDay) {
      setToastMessage('Anda sudah mengklaim bonus hari ini! Kembali lagi besok.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (dayConfig.day !== currentTargetDay) {
      if (streakInfo.claimedDays.includes(dayConfig.day)) {
        setToastMessage(`Bonus Kalender Hari ke-${dayConfig.day} sudah diklaim!`);
      } else {
        setToastMessage(`Selesaikan klaim Hari ke-${currentTargetDay} terlebih dahulu!`);
      }
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Process claim & record in authService
    const updated = await recordLoginStreakClaim(
      playerUid,
      dayConfig.day,
      dayConfig.rings,
      dayConfig.keys
    );
    setStreakInfo(updated);

    if (dayConfig.isSpecial || dayConfig.iconType === 'chest') {
      // Day 7 Chest Special Trigger
      onClaimReward(dayConfig.rings, dayConfig.keys, dayConfig.day, true);
      onClose();
      onOpenChestModal();
    } else {
      onClaimReward(dayConfig.rings, dayConfig.keys, dayConfig.day, false);
      setToastMessage(
        `Selamat! +${dayConfig.rings} Cincin ${
          dayConfig.keys > 0 ? `& +${dayConfig.keys} Kunci Peti 🗝️` : ''
        } berhasil diklaim!`
      );
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const renderIconForDay = (cfg: StreakDayConfig) => {
    if (cfg.iconType === 'chest' || cfg.day === 7) {
      // Use existing ArcadeAssetIcon for 7th Day Glossy Gold Chest Icon
      return (
        <ArcadeAssetIcon
          iconKey="chest"
          className="w-10 h-10 sm:w-12 sm:h-12 filter drop-shadow-md"
        />
      );
    }
    switch (cfg.iconType) {
      case 'stopwatch':
        return <Stopwatch3DIcon className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'coin':
        return <GoldCoin3DIcon className="w-8 h-8 sm:w-10 sm:h-10" />;
      case 'gem':
        return <EmeraldGem3DIcon className="w-8 h-8 sm:w-10 sm:h-10" />;
      default:
        return <GoldRing3DIcon className="w-8 h-8 sm:w-10 sm:h-10" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 border-2 border-teal-500/50 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] p-4 sm:p-6 text-white flex flex-col justify-between">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-sm pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-teal-800/50">
          <div className="flex items-center gap-3">
            <ArcadeIconTile className="w-12 h-12 sm:w-14 sm:h-14" glowColor="amber">
              <TrophyCrest3DIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            </ArcadeIconTile>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Kalender Bonus Harian
              </h2>
              <p className="text-xs sm:text-sm text-teal-200/90 font-medium">
                Masuk setiap hari untuk Cincin, Kunci Peti 🗝️ & Peti Emas Hari ke-7!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800/80 border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-700/80 transition-all flex items-center justify-center font-bold text-lg shadow-md cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="my-2 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs sm:text-sm text-center font-semibold animate-bounce shadow-md">
            {toastMessage}
          </div>
        )}

        {/* Current Streak Summary Badge */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-teal-900/60 via-slate-900/80 to-teal-900/60 border border-teal-400/30 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-xs text-teal-300 font-bold uppercase tracking-wider">
                Streak Login Berturut-Turut
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {streakInfo.claimedDays.length} / 7 Hari Diklaim
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1">
              <span>🗝️</span>
              <span>{streakInfo.chestKeys} Kunci Peti</span>
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm">
              {hasClaimedToday ? 'Hari Ini Selesai ✓' : 'Klaim Siap!'}
            </span>
          </div>
        </div>

        {/* 7-Day Grid Layout */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 my-2">
          {STREAK_DAYS.map((cfg) => {
            const isClaimed = streakInfo.claimedDays.includes(cfg.day);
            const isCurrentTarget = cfg.day === currentTargetDay && !hasClaimedToday;
            const isLocked = cfg.day > currentTargetDay || (cfg.day === currentTargetDay && hasClaimedToday);

            if (cfg.isSpecial) {
              // Day 7 Special Banner Card (Spans across bottom)
              return (
                <div
                  key={cfg.day}
                  onClick={() => handleClaim(cfg)}
                  className={`col-span-3 sm:col-span-2 relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    isClaimed
                      ? 'bg-emerald-950/40 border-emerald-500/60 opacity-80'
                      : isCurrentTarget
                      ? 'bg-gradient-to-r from-amber-900/80 via-yellow-950/90 to-amber-900/80 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                      : 'bg-slate-900/70 border-amber-500/30 opacity-75'
                  }`}
                >
                  <ArcadeIconTile className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" glowColor="amber">
                    {renderIconForDay(cfg)}
                  </ArcadeIconTile>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                        HARI 7 SUPER
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-amber-200 mt-1 truncate">
                      Peti Emas Harta Super
                    </div>
                    <div className="text-[11px] text-amber-300/80 font-medium">
                      3.000 Cincin + 🗝️3 Kunci + Skin Bola Emas
                    </div>
                  </div>
                  {isClaimed ? (
                    <GreenCheckmark3DIcon className="w-7 h-7 shrink-0" />
                  ) : isLocked ? (
                    <GlowingRedLock3DIcon className="w-6 h-6 shrink-0" />
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase shadow-md shrink-0">
                      BUKA!
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={cfg.day}
                onClick={() => handleClaim(cfg)}
                className={`relative p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                  isClaimed
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : isCurrentTarget
                    ? 'bg-gradient-to-b from-teal-900/90 to-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-102'
                    : 'bg-slate-900/60 border-teal-800/40 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Day Badge */}
                <span
                  className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-1 ${
                    isClaimed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isCurrentTarget
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 text-teal-300'
                  }`}
                >
                  Hari {cfg.day}
                </span>

                {/* 3D Icon */}
                <div className="my-1 flex items-center justify-center relative">
                  {renderIconForDay(cfg)}
                  {isClaimed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-xl">
                      <GreenCheckmark3DIcon className="w-7 h-7" />
                    </div>
                  )}
                </div>

                {/* Reward Title */}
                <div className="text-[11px] sm:text-xs font-bold text-teal-100 mt-1 leading-tight">
                  {cfg.label}
                </div>

                {/* Status Indicator */}
                <div className="mt-1.5 w-full">
                  {isClaimed ? (
                    <span className="text-[10px] text-emerald-400 font-bold block">✓ Selesai</span>
                  ) : isCurrentTarget ? (
                    <span className="text-[10px] text-amber-300 font-extrabold block uppercase tracking-wider animate-pulse">
                      ▲ KLAIM
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium block">Terkunci</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action Bar */}
        <div className="mt-4 pt-3 border-t border-teal-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-teal-300/80 text-center sm:text-left">
            *Streak tercatat di profil & tersinkronisasi ke cloud.
          </div>
          <button
            onClick={() => {
              const currentCfg = STREAK_DAYS.find((d) => d.day === currentTargetDay);
              if (currentCfg) {
                handleClaim(currentCfg);
              }
            }}
            disabled={hasClaimedToday}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              hasClaimedToday
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-2 border-yellow-200 shadow-[0_6px_20px_rgba(245,158,11,0.5)] active:scale-95'
            }`}
          >
            {hasClaimedToday
              ? '✓ BONUS HARI INI SUDAH DIKLAIM'
              : `KLAIM REWARD HARI KE-${currentTargetDay} NOW!`}
          </button>
        </div>
      </div>
    </div>
  );
};
