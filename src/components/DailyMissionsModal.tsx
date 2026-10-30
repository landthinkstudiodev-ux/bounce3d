import React from 'react';
import { I18nStrings } from '../game/i18n';
import { DailyMission } from '../services/dailyMissionService';
import { soundFX } from '../game/audio';
import { ArcadeAssetIcon, ArcadeIconKey } from './ArcadeAssetManager';
import { ArcadeIconTile } from './ArcadeIcons';

interface DailyMissionsModalProps {
  t: I18nStrings;
  missions: DailyMission[];
  onClaimReward: (missionId: string, reward: number) => void;
  onClose: () => void;
  onTriggerParticleBurst?: (x: number, y: number, preset: 'emerald' | 'gold') => void;
}

// Circular SVG Progress Ring surrounding the 3D Arcade Tile Icon
interface ProgressRingIconProps {
  iconKey: ArcadeIconKey;
  percent: number; // 0 - 100
  isCompleted: boolean;
  isClaimed: boolean;
}

const MissionProgressRingIcon: React.FC<ProgressRingIconProps> = ({
  iconKey,
  percent,
  isCompleted,
  isClaimed,
}) => {
  const size = 72; // px
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2; // 33.5
  const circumference = 2 * Math.PI * radius; // ~210.48
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const gradientId = `mission-ring-grad-${iconKey}-${isCompleted ? 'done' : 'active'}`;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-[72px] h-[72px]">
      {/* SVG Circular Progress Ring */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90 transform drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isCompleted || isClaimed ? (
              <>
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(15, 23, 42, 0.85)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Centered 3D Glossy Arcade Icon Tile */}
      <ArcadeIconTile
        glowColor={isCompleted || isClaimed ? 'emerald' : 'amber'}
        className="w-13 h-13 sm:w-14 sm:h-14 relative z-10 p-2 shadow-lg"
      >
        <ArcadeAssetIcon iconKey={iconKey} className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow" />
      </ArcadeIconTile>

      {/* Percentage Badge Tag anchored at the bottom */}
      <div
        className={`absolute -bottom-1 z-20 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase shadow-md border ${
          isClaimed
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
            : isCompleted
            ? 'bg-amber-950/90 text-amber-300 border-amber-400/80 animate-pulse'
            : 'bg-slate-900/90 text-amber-200 border-amber-500/40'
        }`}
      >
        {isClaimed ? '✓ 100%' : `${clampedPercent}%`}
      </div>
    </div>
  );
};

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  t,
  missions,
  onClaimReward,
  onClose,
  onTriggerParticleBurst,
}) => {
  const totalMissions = missions.length;
  const completedCount = missions.filter((m) => m.completed || m.claimed).length;
  const claimedCount = missions.filter((m) => m.claimed).length;
  const overallPercent = totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 0;
  const totalPotentialScore = missions.reduce((sum, m) => sum + m.rewardScore, 0);

  const getMissionIconKey = (id: string): ArcadeIconKey => {
    switch (id) {
      case 'collect_rings':
        return 'ring';
      case 'clear_stages':
        return 'stage';
      case 'speed_run':
      case 'speedrun':
        return 'stopwatch';
      default:
        return 'mission';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] modal-juice-pop">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <ArcadeIconTile glowColor="emerald" className="w-12 h-12 sm:w-14 sm:h-14 shrink-0">
              <ArcadeAssetIcon iconKey="mission" className="w-7 h-7 sm:w-8 sm:h-8" />
            </ArcadeIconTile>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wider bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent uppercase">
                  {t.dailyMissionsTitle || 'Papan Misi Harian'}
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-semibold">
                {t.dailyMissionsSubtitle || 'Selesaikan misi setiap hari & klaim bonus skor!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Daily Mission Board Banner & Overall Board Tracker */}
        <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-inner flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                PAPAN HARIAN
              </span>
              <span className="text-xs font-bold text-slate-200">
                Progres Misi: <strong className="text-amber-300">{completedCount}/{totalMissions}</strong>
              </span>
            </div>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              {overallPercent}% Total
            </span>
          </div>

          {/* Overall Board Progress Bar */}
          <div className="w-full h-3 bg-slate-950/90 rounded-full border border-slate-800/90 p-0.5 relative overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-amber-300 rounded-full transition-all duration-700 relative overflow-hidden"
              style={{ width: `${overallPercent}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span>Total Potensi Hadiah: <strong className="text-amber-300">+{totalPotentialScore.toLocaleString()} Skor</strong></span>
            {claimedCount === totalMissions && totalMissions > 0 && (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                <ArcadeAssetIcon iconKey="checkmark" className="w-3.5 h-3.5" /> Semua Misi Selesai!
              </span>
            )}
          </div>
        </div>

        {/* Missions Board List */}
        <div className="py-3.5 space-y-3 overflow-y-auto pr-1">
          {missions.map((m) => {
            const desc =
              m.id === 'collect_rings'
                ? t.missionCollectRingsDesc(m.target)
                : m.id === 'clear_stages'
                ? t.missionClearStagesDesc(m.target)
                : t.missionSpeedRunDesc;

            const iconKey = getMissionIconKey(m.id);
            const percent = Math.min(100, Math.round((m.progress / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border transition-all duration-200 flex flex-col gap-2.5 ${
                  m.claimed
                    ? 'border-emerald-500/20 bg-slate-950/40 opacity-90'
                    : m.completed
                    ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)] bg-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Mission Icon with Progress Ring */}
                  <MissionProgressRingIcon
                    iconKey={iconKey}
                    percent={percent}
                    isCompleted={m.completed}
                    isClaimed={m.claimed}
                  />

                  {/* Mission Info & Reward */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {desc}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black">
                        <ArcadeAssetIcon iconKey="trophy" className="w-3.5 h-3.5" />
                        <span>+{m.rewardScore} Skor</span>
                      </div>
                    </div>

                    {/* High-End 3D Glossy Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Progres Target</span>
                        <span className="text-white tabular-nums font-extrabold">
                          {m.progress} / {m.target} ({percent}%)
                        </span>
                      </div>

                      <div className="w-full h-3 bg-slate-950/90 rounded-full border border-slate-800/80 p-0.5 relative overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${
                            m.claimed || m.completed
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
                              : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                          }`}
                          style={{ width: `${percent}%` }}
                        >
                          {/* Top Gloss sheen */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/35 rounded-t-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim / Status Action Footer */}
                <div className="flex items-center justify-end pt-1 border-t border-slate-800/40">
                  {m.claimed ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <ArcadeAssetIcon iconKey="checkmark" className="w-4 h-4" />
                      <span>Selesai & Diklaim</span>
                    </div>
                  ) : m.completed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        soundFX.playRingCollect();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = rect.left + rect.width / 2;
                        const y = rect.top + rect.height / 2;
                        if (onTriggerParticleBurst) {
                          onTriggerParticleBurst(x, y, 'emerald');
                        }
                        onClaimReward(m.id, m.rewardScore);
                      }}
                      className="px-4 py-1.5 rounded-xl btn-3d-green text-white font-extrabold text-xs tracking-wider cursor-pointer flex items-center gap-1.5 shadow-lg animate-bounce uppercase"
                    >
                      <ArcadeAssetIcon iconKey="trophy" className="w-4 h-4" />
                      <span>Klaim Reward</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <span>Progres berlangsung...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
