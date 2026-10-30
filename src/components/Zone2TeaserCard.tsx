import React from 'react';
import { I18nStrings } from '../game/i18n';
import { EmeraldGem3DIcon } from './ArcadeIcons';

interface Zone2TeaserCardProps {
  t: I18nStrings;
  unlockedMaxLevel: number;
  completedLevels: number[];
  selectedLevelIdx?: number;
  onSelectStage: (stageIndex: number) => void;
}

export const Zone2TeaserCard: React.FC<Zone2TeaserCardProps> = ({
  t,
  unlockedMaxLevel,
  completedLevels,
  selectedLevelIdx,
  onSelectStage,
}) => {
  const zone2StageNumbers = Array.from({ length: 11 }, (_, i) => i + 12);
  const isZone2Unlocked = unlockedMaxLevel >= 12;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/70 p-2 sm:p-2.5 shadow-md ${
        isZone2Unlocked ? 'shadow-emerald-950/30' : 'opacity-75'
      }`}
    >
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <EmeraldGem3DIcon
              className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${
                isZone2Unlocked
                  ? 'filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                  : 'grayscale'
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 truncate">
                  {t.zone2Title}
                </span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md whitespace-nowrap ${
                    isZone2Unlocked
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  }`}
                >
                  {isZone2Unlocked
                    ? t.langCode === 'id'
                      ? 'TERBUKA'
                      : 'UNLOCKED'
                    : t.lockedBtn}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/80 truncate">
                {t.zone2Subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* 11 Interactive Stage Buttons for Zone 2 (Stages 12 to 22) */}
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 pt-1 border-t border-emerald-500/20">
          {zone2StageNumbers.map((stageNum) => {
            const idx = stageNum - 1;
            const isLocked = stageNum > unlockedMaxLevel;
            const isDone = completedLevels.includes(stageNum);
            const isSelected = selectedLevelIdx === idx;

            return (
              <button
                key={stageNum}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return;
                  onSelectStage(idx);
                }}
                title={
                  isLocked
                    ? t.toastStageLocked(stageNum)
                    : `${t.stageWord} ${stageNum}`
                }
                className={`min-h-[30px] sm:min-h-[34px] rounded-lg text-[10px] sm:text-xs font-bold transition-transform flex items-center justify-center gap-0.5 tabular-nums active:translate-y-[1px] ${
                  isLocked
                    ? 'bg-slate-950/80 border border-slate-800 text-emerald-900/60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-emerald-500 border-2 border-amber-300 text-slate-950 font-black ring-2 ring-amber-300/60 cursor-pointer shadow-md'
                    : isDone
                    ? 'bg-emerald-600/35 border border-emerald-400/70 text-emerald-100 hover:bg-emerald-600/55 cursor-pointer'
                    : 'bg-emerald-900/80 border border-emerald-400/60 text-emerald-200 hover:bg-emerald-700/80 cursor-pointer'
                }`}
              >
                {isLocked ? '🔒' : isDone ? `${stageNum}✓` : stageNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


