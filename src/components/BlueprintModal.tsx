import React from 'react';
import { BOUNCE_LEVELS } from '../game/levels';
import { GameLang, TRANSLATIONS } from '../game/i18n';
import {
  GoldRing3DIcon,
  ArcadeIconTile,
  StageMap3DIcon,
  GlowingRedLock3DIcon,
} from './ArcadeIcons';
import {
  isStageUnlockedByZoneRules,
  getUnlockedStageCount,
} from './SplashAndLoopModals';

interface BlueprintModalProps {
  lang: GameLang;
  currentLevelNumber: number;
  unlockedMaxLevel: number;
  completedLevels: number[];
  stageStars?: Record<number, number>;
  onSelectLevel: (levelIndex: number) => void;
  onClose: () => void;
}

interface ZoneConfig {
  id: number;
  titleKey: string;
  defaultTitle: string;
  startStage: number;
  endStage: number;
  theme: 'amber' | 'emerald' | 'sky' | 'purple';
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({
  lang,
  currentLevelNumber,
  completedLevels,
  stageStars = {},
  onSelectLevel,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];
  const unlockedCount = getUnlockedStageCount(completedLevels);

  const zones: ZoneConfig[] = [
    {
      id: 1,
      titleKey: 'zone1Title',
      defaultTitle: 'Zona 1: Istana Klasik',
      startStage: 1,
      endStage: 11,
      theme: 'amber',
    },
    {
      id: 2,
      titleKey: 'zone2Title',
      defaultTitle: 'Zona 2: Hutan & Hewan',
      startStage: 12,
      endStage: 22,
      theme: 'emerald',
    },
    {
      id: 3,
      titleKey: 'zone3Title',
      defaultTitle: 'Zona 3: Es & Gletser',
      startStage: 23,
      endStage: 33,
      theme: 'sky',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3 sm:p-4 pointer-events-auto">
      <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 shadow-[0_0_35px_rgba(251,191,36,0.22)] text-white overflow-hidden modal-juice-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <ArcadeIconTile glowColor="amber" className="w-10 h-10 shrink-0">
              <StageMap3DIcon className="w-6 h-6" />
            </ArcadeIconTile>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-amber-300">
                {t.selectStageHeader}
              </h2>
              <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                {t.openedOfTotal(unlockedCount, BOUNCE_LEVELS.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Unified Zone Template Stage List */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex flex-col gap-5">
          {zones.map((zone) => {
            const zoneLevels = BOUNCE_LEVELS.filter(
              (lvl) =>
                lvl.levelNumber >= zone.startStage &&
                lvl.levelNumber <= zone.endStage
            );
            const zoneTitle =
              t[zone.titleKey as keyof typeof t] || zone.defaultTitle;

            const borderHeaderColor =
              zone.theme === 'emerald'
                ? 'border-emerald-500/40 text-emerald-300'
                : zone.theme === 'sky'
                ? 'border-sky-400/40 text-sky-300'
                : zone.theme === 'purple'
                ? 'border-purple-500/40 text-purple-300'
                : 'border-amber-400/30 text-amber-300';

            return (
              <div key={zone.id} className="flex flex-col gap-2.5">
                {/* Zone Badge Header */}
                <div
                  className={`flex items-center gap-2 pb-1.5 border-b ${borderHeaderColor}`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">
                    {String(zoneTitle)} ({t.stageWord} {zone.startStage}–
                    {zone.endStage})
                  </span>
                </div>

                {/* Uniform Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {zoneLevels.map((lvl) => {
                    const idx = lvl.levelNumber - 1;
                    const isCurrent = lvl.levelNumber === currentLevelNumber;
                    const isDone = completedLevels.includes(lvl.levelNumber);
                    const isLocked = !isStageUnlockedByZoneRules(
                      lvl.levelNumber,
                      completedLevels
                    );
                    const stars = stageStars[lvl.levelNumber] || (isDone ? 1 : 0);

                    const cardThemeClass = isLocked
                      ? 'border-white/5 bg-slate-950/40 opacity-60'
                      : isCurrent
                      ? zone.theme === 'emerald'
                        ? 'border-emerald-400/80 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : zone.theme === 'sky'
                        ? 'border-sky-400/80 bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : zone.theme === 'emerald'
                      ? 'border-emerald-500/20 bg-emerald-950/40 hover:border-emerald-400/40'
                      : zone.theme === 'sky'
                      ? 'border-sky-400/25 bg-sky-950/45 hover:border-sky-300/50'
                      : 'border-white/10 bg-slate-900/80 hover:border-amber-400/40';

                    const badgeThemeClass = isLocked
                      ? 'bg-slate-900 border-red-500/30 text-slate-500'
                      : isDone
                      ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-200 border-amber-300 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                      : zone.theme === 'emerald'
                      ? 'bg-emerald-700/30 border-emerald-400/50 text-emerald-200'
                      : zone.theme === 'sky'
                      ? 'bg-sky-700/35 border-sky-300/60 text-sky-100'
                      : 'bg-red-500/25 border-red-400/50 text-white';

                    const titleColorClass =
                      zone.theme === 'emerald'
                        ? 'text-emerald-200'
                        : zone.theme === 'sky'
                        ? 'text-sky-100'
                        : 'text-white';

                    const playBtnClass = isLocked
                      ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                      : zone.theme === 'emerald'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white cursor-pointer border border-emerald-300/40 shadow-md'
                      : zone.theme === 'sky'
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black cursor-pointer border border-sky-200/60 shadow-md'
                      : 'btn-3d-orange text-white cursor-pointer';

                    return (
                      <div
                        key={lvl.levelNumber}
                        className={`px-3 py-2.5 rounded-2xl border transition flex items-center justify-between gap-2.5 ${cardThemeClass}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl font-extrabold text-xs tabular-nums flex items-center justify-center shrink-0 border shadow-md p-1 ${badgeThemeClass}`}
                          >
                            {isLocked ? (
                              <GlowingRedLock3DIcon className="w-6 h-6" />
                            ) : isDone ? (
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-300 shadow-sm border border-amber-200 flex items-center justify-center text-[9px]">
                                🔴
                              </div>
                            ) : (
                              lvl.levelNumber
                            )}
                          </div>

                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 tabular-nums">
                              <span
                                className={`font-bold text-xs sm:text-sm ${titleColorClass}`}
                              >
                                {t.stageWord} {lvl.levelNumber}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-300 font-semibold flex items-center gap-0.5">
                                <GoldRing3DIcon className="w-3.5 h-3.5 inline-block" />
                                <span>{lvl.rings.length}</span>
                              </span>
                              {!isLocked && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-[11px] tracking-tighter">
                                    {[1, 2, 3].map((s) => (
                                      <span
                                        key={s}
                                        className={
                                          s <= stars
                                            ? 'text-amber-400'
                                            : 'text-slate-600'
                                        }
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            if (isLocked) return;
                            onSelectLevel(idx);
                            onClose();
                          }}
                          className={`min-h-[44px] px-5 py-2.5 rounded-2xl font-black text-xs tracking-wider transition shrink-0 whitespace-nowrap uppercase cursor-pointer hover:scale-105 active:scale-95 ${
                            isLocked
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-500 text-slate-950 shadow-[0_4px_0_rgb(5,150,105)]'
                          }`}
                        >
                          {isLocked ? '🔒' : t.playShortBtn}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

