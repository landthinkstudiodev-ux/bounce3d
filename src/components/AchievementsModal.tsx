import React from 'react';
import { I18nStrings, GameLang } from '../game/i18n';
import { getAchievements, claimAchievementReward, Achievement, AchievementState } from '../services/achievementService';
import { soundFX } from '../game/audio';
import { ArcadeIconTile, TrophyCrest3DIcon, GoldRing3DIcon, TreasureChest3DIcon, EmeraldGem3DIcon } from './ArcadeIcons';

interface AchievementsModalProps {
  t: I18nStrings;
  lang: GameLang;
  onRefreshCoins: () => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  t,
  lang,
  onRefreshCoins,
  onClose,
}) => {
  const [items, setItems] = React.useState<{ achievement: Achievement; state: AchievementState }[]>([]);

  React.useEffect(() => {
    setItems(getAchievements());
  }, []);

  const handleClaim = (id: string) => {
    soundFX.playRingCollect();
    const earned = claimAchievementReward(id);
    if (earned > 0) {
      onRefreshCoins();
      setItems(getAchievements());
    }
  };

  const isId = lang === 'id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-slate-950 p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] modal-juice-pop">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ArcadeIconTile glowColor="amber" className="w-11 h-11 shrink-0">
              <TrophyCrest3DIcon className="w-7 h-7" />
            </ArcadeIconTile>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-400">
                {isId ? 'Piala & Prestasi' : 'Trophies & Achievements'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isId ? 'Selesaikan misi karir & raih koin cincin eksklusif!' : 'Complete career milestones & earn exclusive ring coins!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="py-4 space-y-3 overflow-y-auto">
          {items.map(({ achievement, state }) => {
            const title = isId ? achievement.titleId : achievement.titleEn;
            const desc = isId ? achievement.descId : achievement.descEn;

            return (
              <div
                key={achievement.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 flex items-center justify-center p-1.5 shrink-0 shadow-md">
                      {achievement.icon === '💍' || achievement.icon === '👑' ? (
                        <GoldRing3DIcon className="w-7 h-7" />
                      ) : achievement.icon === '💎' ? (
                        <EmeraldGem3DIcon className="w-7 h-7" />
                      ) : (
                        <TreasureChest3DIcon className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white">
                        {title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {desc}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-amber-300 font-bold tabular-nums bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                          <GoldRing3DIcon className="w-3.5 h-3.5 inline-block" />
                          <span>+{achievement.rewardCoins} {isId ? 'Cincin' : 'Coins'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {state.isClaimed ? (
                      <span className="px-4 py-3 rounded-2xl bg-emerald-500 font-black text-slate-950 shadow-[0_4px_0_rgb(5,150,105)] text-xs whitespace-nowrap">
                        ✓ {isId ? 'Diklaim' : 'Claimed'}
                      </span>
                    ) : state.isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(achievement.id)}
                        className="px-4 py-3 rounded-2xl bg-emerald-500 font-black text-slate-950 shadow-[0_4px_0_rgb(5,150,105)] hover:scale-105 active:scale-95 transition text-xs whitespace-nowrap cursor-pointer uppercase"
                      >
                        {isId ? 'Klaim' : 'Claim'}
                      </button>
                    ) : (
                      <span className="px-4 py-3 rounded-2xl bg-slate-950 text-slate-400 font-black text-xs border border-slate-700 whitespace-nowrap">
                        {state.progress}/{achievement.target}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (state.progress / achievement.target) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-sky-500 font-black text-white shadow-[0_4px_0_rgb(2,132,199)] hover:scale-105 active:scale-95 transition text-xs uppercase tracking-wider cursor-pointer"
          >
            {isId ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
