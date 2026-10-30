import React, { useEffect, useState } from 'react';
import { LevelBlueprint } from '../game/types';
import { GameLang, I18nStrings } from '../game/i18n';
import { BOUNCE_LEVELS } from '../game/levels';
import { soundFX } from '../game/audio';
import { BALL_SKIN_META, getEquippedSkin } from '../services/shopService';

const STORAGE_STARS_KEY = 'bounce_stage_stars_v1';

/**
 * Rule confirmed by user:
 * Stage 1 (Zone 1 start), Stage 12 (Zone 2 start), and Stage 23 (Zone 3 start)
 * are ALWAYS unlocked from the beginning.
 * Subsequent stages within each zone (2..11, 13..22, 24..33) unlock sequentially
 * when the previous stage (N - 1) is completed.
 */
export function isStageUnlockedByZoneRules(
  stageNumber: number,
  completedLevels: number[]
): boolean {
  if (stageNumber <= 1) {
    return true;
  }
  if (stageNumber === 12) {
    return completedLevels.includes(11);
  }
  if (stageNumber === 23) {
    return completedLevels.includes(22);
  }
  // Strict 1-by-1 sequential rule: Stage N requires Stage N - 1 completed!
  return completedLevels.includes(stageNumber - 1);
}

export function getUnlockedStageCount(completedLevels: number[]): number {
  let count = 0;
  for (let s = 1; s <= BOUNCE_LEVELS.length; s++) {
    if (isStageUnlockedByZoneRules(s, completedLevels)) {
      count++;
    }
  }
  return count;
}

/**
 * Returns the 0-based index of the player's latest unlocked progression stage
 * based on their completed stages (or 0 if no stages completed yet).
 */
export function getHighestUnlockedStageIndex(completedLevels: number[]): number {
  if (!completedLevels || completedLevels.length === 0) {
    return 0;
  }
  const highestCompleted = Math.max(...completedLevels);
  const nextStage = Math.min(BOUNCE_LEVELS.length, highestCompleted + 1);
  return Math.max(0, nextStage - 1);
}

export function getStageParTime(levelNumber: number): number {
  const bp = BOUNCE_LEVELS[levelNumber - 1];
  if (!bp) return 60;
  // Calibrate par time based on distance to exit portal and boss complexity
  const isBoss = levelNumber === 11 || levelNumber === 22 || levelNumber === 33;
  const baseSec = Math.round(bp.exitRingX * 0.42) + bp.rings.length * 2;
  return isBoss ? Math.max(75, baseSec + 15) : Math.max(38, baseSec);
}

export function getStageTargetScore(levelNumber: number): number {
  const bp = BOUNCE_LEVELS[levelNumber - 1];
  if (!bp) return 5000;
  return bp.rings.length * 500 + 2500;
}

export function computeStageStars(
  levelNumber: number,
  clearTimeSec: number,
  livesLeft: number,
  score: number
): 1 | 2 | 3 {
  const parTime = getStageParTime(levelNumber);
  const targetScore = getStageTargetScore(levelNumber);
  let stars = 1; // 1 Star guaranteed for collecting all rings and reaching the Exit Gate
  if (clearTimeSec <= parTime * 1.25 || score >= targetScore) {
    stars = 2;
  }
  if (clearTimeSec <= parTime && livesLeft >= 2) {
    stars = 3;
  }
  return stars as 1 | 2 | 3;
}

export function loadStageStars(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_STARS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function saveStageStars(starsMap: Record<number, number>): void {
  try {
    localStorage.setItem(STORAGE_STARS_KEY, JSON.stringify(starsMap));
  } catch {
    // ignore storage errors
  }
}

export interface DetectedObstacleTag {
  icon: string;
  label: string;
}

export function detectBlueprintObstacles(
  bp: LevelBlueprint,
  lang: GameLang
): DetectedObstacleTag[] {
  const tags: DetectedObstacleTag[] = [];

  if (bp.biome === 'ICE' || bp.blocks.some((b) => b.isIce)) {
    tags.push({
      icon: '❄️',
      label: lang === 'id' ? 'Lantai Es Licin' : 'Slippery Ice Floor',
    });
  }

  const movingBlocks = bp.blocks.filter((b) => b.moveRange && b.moveRange > 0);
  if (movingBlocks.length > 0) {
    const hasVerticalDrop = movingBlocks.some((b) => b.moveAxis === 'y');
    tags.push({
      icon: hasVerticalDrop ? '🧊' : '🧱',
      label:
        bp.biome === 'ICE' && hasVerticalDrop
          ? lang === 'id'
            ? 'Gletser Runtuh'
            : 'Falling Glaciers'
          : lang === 'id'
          ? 'Platform Bergerak'
          : 'Moving Platforms',
    });
  }

  if (bp.levelNumber === 33) {
    tags.push({
      icon: '👑',
      label:
        lang === 'id'
          ? 'Raja Gletser Abadi (18 Cincin)'
          : 'Eternal Ice King Boss (18 Rings)',
    });
  }

  if (bp.snowballs && bp.snowballs.length > 0) {
    tags.push({
      icon: '⛄',
      label:
        lang === 'id'
          ? `Bola Salju Menggelinding (${bp.snowballs.length})`
          : `Rolling Snowballs (${bp.snowballs.length})`,
    });
  }

  if (bp.slopes && bp.slopes.length > 0) {
    tags.push({
      icon: bp.biome === 'ICE' ? '🏔️' : '📐',
      label:
        bp.biome === 'ICE'
          ? lang === 'id'
            ? `Gunung Es Naik-Turun (${bp.slopes.length / 2} Puncak)`
            : `Undulating Ice Mountains (${bp.slopes.length / 2} Peaks)`
          : lang === 'id'
          ? 'Tanjakan Curam 45°'
          : '45° Steep Slopes',
    });
  }

  if (bp.jacks && bp.jacks.length > 0) {
    tags.push({
      icon: bp.biome === 'ICE' ? '❄️' : '⚙️',
      label:
        bp.biome === 'ICE'
          ? lang === 'id'
            ? `Bintang Kristal Es (${bp.jacks.length})`
            : `Frost Crystal Stars (${bp.jacks.length})`
          : lang === 'id'
          ? `Bintang Duri (${bp.jacks.length})`
          : `Moving Jacks (${bp.jacks.length})`,
    });
  }

  if (bp.spikes && bp.spikes.length > 0) {
    tags.push({
      icon: '🔺',
      label:
        bp.biome === 'ICE'
          ? lang === 'id'
            ? `Stalaktit & Duri Es (${bp.spikes.length})`
            : `Icicle & Spike Traps (${bp.spikes.length})`
          : lang === 'id'
          ? `Jarum Duri (${bp.spikes.length} Titik)`
          : `Spike Traps (${bp.spikes.length})`,
    });
  }

  if (bp.waterPools && bp.waterPools.length > 0) {
    tags.push({
      icon: '💧',
      label:
        lang === 'id'
          ? `Kolam Apung/Selam (${bp.waterPools.length})`
          : `Water Pools (${bp.waterPools.length})`,
    });
  }

  if (bp.pumps && bp.pumps.length > 0) {
    tags.push({
      icon: '🔵',
      label:
        lang === 'id'
          ? `Pompa Ukuran Bola (${bp.pumps.length})`
          : `Size Pumps (${bp.pumps.length})`,
    });
  }

  return tags.slice(0, 4);
}

/* ============================================================================
 * 1. FASE MASUK: 3D SPLASH / ASSET LOADING SCREEN
 * ============================================================================ */
interface SplashScreen3DProps {
  lang: GameLang;
  onFinish: () => void;
}

export const SplashScreen3D: React.FC<SplashScreen3DProps> = ({
  lang,
  onFinish,
}) => {
  const [progress, setProgress] = useState<number>(16);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  const equippedSkin = getEquippedSkin();
  const skinMeta = BALL_SKIN_META[equippedSkin] || BALL_SKIN_META.default_red;

  const loadingSteps =
    lang === 'id'
      ? [
          'Menginisialisasi Mesin Fisika 3D & Pencahayaan WebGL...',
          'Menyiapkan Material Bola Pantul & Cincin Emas 3D...',
          'Membangun Zona 1 (Bata Klasik) & Zona 2 (Hutan Satwa)...',
          'Membekukan Zona 3 (Lantai Es Licin & Gletser Runtuh)...',
          'Semua Aset 3D Siap Dimainkan!',
        ]
      : [
          'Initializing 3D Physics Engine & WebGL Lighting...',
          'Preparing Bounce Ball Materials & 3D Gold Rings...',
          'Building Zone 1 (Classic Brick) & Zone 2 (Jungle)...',
          'Freezing Zone 3 (Slippery Ice & Falling Glaciers)...',
          'All 3D Assets Ready to Play!',
        ];

  const triggerSmoothExit = () => {
    setIsExiting(true);
    window.setTimeout(() => {
      onFinish();
    }, 220);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + 21);
        setStepIndex(Math.min(4, Math.floor((next / 100) * 4)));
        return next;
      });
    }, 210);

    const autoDone = window.setTimeout(() => {
      setIsExiting(true);
      window.setTimeout(() => {
        onFinish();
      }, 220);
    }, 1450);

    return () => {
      clearInterval(interval);
      clearTimeout(autoDone);
    };
  }, [onFinish]);

  const zoneReadiness = [
    {
      id: 1,
      icon: '🧱',
      name: lang === 'id' ? 'Zona 1: Bata' : 'Zone 1: Brick',
      ready: progress >= 35,
    },
    {
      id: 2,
      icon: '🌿',
      name: lang === 'id' ? 'Zona 2: Hutan' : 'Zone 2: Jungle',
      ready: progress >= 65,
    },
    {
      id: 3,
      icon: '❄️',
      name: lang === 'id' ? 'Zona 3: Gletser' : 'Zone 3: Glacier',
      ready: progress >= 90,
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-4 sm:p-6 text-white select-none pointer-events-auto transition-opacity duration-200 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-amber-400/45 bg-slate-900/95 p-6 sm:p-7 shadow-2xl text-center relative">
        {/* Top-Right Instant Fast Skip Button */}
        <button
          type="button"
          onClick={triggerSmoothExit}
          className="absolute top-4 right-4 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-extrabold text-amber-300 cursor-pointer transition whitespace-nowrap"
        >
          {lang === 'id' ? '⚡ Lewati Cepat' : '⚡ Fast Skip'}
        </button>

        {/* Animated 3D Bounce Ball + Golden Ring Showcase */}
        <div className="relative mx-auto w-28 h-28 flex flex-col items-center justify-end mb-3">
          {/* Outer Rotating Golden Ring */}
          <div className="absolute inset-2 rounded-full border-4 border-amber-400/70 shadow-[0_0_20px_rgba(250,204,21,0.35)] animate-pulse pointer-events-none" />
          {/* 3D Glossy Sphere with Equipped Skin */}
          <div
            className="w-14 h-14 rounded-full shadow-[0_10px_28px_rgba(239,68,68,0.65)] border-2 border-white/40 animate-bounce z-10"
            style={{
              background: skinMeta.cssGradient,
            }}
          />
          <div className="w-16 h-2.5 rounded-full bg-amber-400/35 blur-[2px] mt-1.5" />
        </div>

        <div className="text-[11px] font-bold tracking-widest uppercase text-amber-400 mb-1">
          {lang === 'id'
            ? 'PETUALANGAN BOLA PANTUL 3D'
            : '3D BOUNCE ADVENTURE'}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wider text-white mb-1.5">
          BOUNCE <span className="text-amber-400">3D</span>
        </h1>
        <p className="text-xs text-slate-300 mb-4">
          {lang === 'id'
            ? '3 Zona Dunia · 33 Babak Fisika · 99 Bintang'
            : '3 World Zones · 33 Physics Stages · 99 Stars'}
        </p>

        {/* 3D World Asset Readiness Checklist */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {zoneReadiness.map((z) => (
            <div
              key={z.id}
              className={`px-2 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors ${
                z.ready
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-950/70 border-white/10 text-slate-500'
              }`}
            >
              <span>{z.ready ? '✓' : z.icon}</span>
              <span className="truncate">{z.name}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 border border-white/10 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums mb-4">
          <span className="truncate">{loadingSteps[stepIndex]}</span>
          <span className="font-extrabold text-amber-300 ml-2">{progress}%</span>
        </div>

        <button
          type="button"
          onClick={triggerSmoothExit}
          className="w-full min-h-[42px] py-2.5 px-4 rounded-xl btn-3d-orange text-white font-display text-xs sm:text-sm tracking-wider uppercase cursor-pointer"
        >
          {lang === 'id' ? '▶ Masuk ke Menu Utama' : '▶ Enter Main Menu'}
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. FASE PERSIAPAN PRA-LEVEL: KARTU INFORMASI LEVEL (PRE-LEVEL BRIEFING)
 * ============================================================================ */
interface PreLevelBriefingCardProps {
  blueprint: LevelBlueprint;
  lang: GameLang;
  earnedStars: number;
  bestTimeSec: number | null;
}

export const PreLevelBriefingCard: React.FC<PreLevelBriefingCardProps> = ({
  blueprint,
  lang,
  earnedStars,
  bestTimeSec,
}) => {
  const parTime = getStageParTime(blueprint.levelNumber);
  const targetScore = getStageTargetScore(blueprint.levelNumber);
  const obstacles = detectBlueprintObstacles(blueprint, lang);
  const isBoss =
    blueprint.levelNumber === 11 ||
    blueprint.levelNumber === 22 ||
    blueprint.levelNumber === 33;

  return (
    <div className="rounded-xl border border-white/15 bg-slate-950/75 p-2.5 text-left">
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/10">
        <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-amber-300">
          {lang === 'id'
            ? `📋 INFO PRA-LEVEL — BABAK ${blueprint.levelNumber}`
            : `📋 PRE-LEVEL INFO — STAGE ${blueprint.levelNumber}`}
          {isBoss ? (lang === 'id' ? ' (BOSS ZONA)' : ' (ZONE BOSS)') : ''}
        </span>
        <div
          className="flex items-center gap-0.5 text-xs tabular-nums"
          title={lang === 'id' ? 'Perolehan Bintang' : 'Star Rating'}
        >
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={
                s <= earnedStars ? 'text-amber-400' : 'text-slate-600'
              }
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Metrics Row: Target Score, Required Rings, Par Time, Best Time */}
      <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
        <div className="rounded-lg bg-white/5 px-1.5 py-1">
          <div className="text-[9px] text-slate-400 font-semibold">
            {lang === 'id' ? 'Target Skor' : 'Target Score'}
          </div>
          <div className="text-[11px] font-extrabold text-amber-300 tabular-nums">
            {targetScore.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 px-1.5 py-1">
          <div className="text-[9px] text-slate-400 font-semibold">
            {lang === 'id' ? 'Wajib Kumpul' : 'Required'}
          </div>
          <div className="text-[11px] font-extrabold text-white tabular-nums">
            🟡 {blueprint.rings.length}{' '}
            {lang === 'id' ? 'Cincin' : 'Rings'}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 px-1.5 py-1">
          <div className="text-[9px] text-slate-400 font-semibold">
            {lang === 'id' ? 'Target 3★' : '3★ Target'}
          </div>
          <div className="text-[11px] font-extrabold text-emerald-300 tabular-nums">
            &le; {parTime}s
            {bestTimeSec !== null ? ` (${bestTimeSec}s)` : ''}
          </div>
        </div>
      </div>

      {/* Detected Main Obstacles in Arena */}
      <div className="text-[10px] text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-bold text-slate-400">
          {lang === 'id' ? 'Rintangan Arena:' : 'Arena Hazards:'}
        </span>
        {obstacles.map((ob, i) => (
          <span key={i} className="inline-flex items-center gap-0.5 text-white">
            <span>{ob.icon}</span>
            <span>{ob.label}</span>
            {i < obstacles.length - 1 && (
              <span className="text-slate-600 ml-1" aria-hidden="true">
                ·
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. MODAL PENGATURAN LENGKAP (AUDIO, EFEK SUARA, SENSITIVITAS KONTROL)
 * ============================================================================ */
interface SettingsModalProps {
  isOpen: boolean;
  lang: GameLang;
  muted: boolean;
  bgmVolume: number;
  sfxVolume: number;
  controlSensitivity: number;
  hapticsOn: boolean;
  graphicsMode: 'HIGH' | 'PERFORMANCE';
  onChangeBgmVolume: (vol: number) => void;
  onChangeSfxVolume: (vol: number) => void;
  onChangeSensitivity: (mult: number) => void;
  onToggleMute: () => void;
  onToggleHaptics: () => void;
  onToggleGraphics: () => void;
  onToggleLanguage: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  lang,
  muted,
  bgmVolume,
  sfxVolume,
  controlSensitivity,
  hapticsOn,
  graphicsMode,
  onChangeBgmVolume,
  onChangeSfxVolume,
  onChangeSensitivity,
  onToggleMute,
  onToggleHaptics,
  onToggleGraphics,
  onToggleLanguage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/50 bg-slate-950 p-5 sm:p-6 text-white shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-amber-300">
              ⚙️ {lang === 'id' ? 'PENGATURAN PERMAINAN' : 'GAME SETTINGS'}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'id'
                ? 'Volume Audio, Efek Suara & Sensitivitas Kontrol Bola'
                : 'Audio Volume, Sound Effects & Ball Control Sensitivity'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* BGM Volume Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-200">
                🎵 {lang === 'id' ? 'Volume Musik Latar (BGM)' : 'Music Volume (BGM)'}
              </span>
              <span className="font-extrabold text-amber-300 tabular-nums">
                {muted ? '0%' : `${Math.round(bgmVolume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : Math.round(bgmVolume * 100)}
              onChange={(e) => onChangeBgmVolume(Number(e.target.value) / 100)}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* SFX Volume Slider + Live Audio Test */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-200">
                🔊 {lang === 'id' ? 'Volume Efek Suara (SFX)' : 'Sound Effects (SFX)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.init();
                    soundFX.playRingCollect();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 cursor-pointer transition"
                >
                  {lang === 'id' ? '🔔 Uji Suara' : '🔔 Test Sound'}
                </button>
                <span className="font-extrabold text-amber-300 tabular-nums">
                  {muted ? '0%' : `${Math.round(sfxVolume * 100)}%`}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : Math.round(sfxVolume * 100)}
              onChange={(e) => onChangeSfxVolume(Number(e.target.value) / 100)}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Control Sensitivity Slider & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-200">
                🎮{' '}
                {lang === 'id'
                  ? 'Sensitivitas Kontrol Bola'
                  : 'Ball Control Sensitivity'}
              </span>
              <span className="font-extrabold text-sky-300 tabular-nums">
                {Math.round(controlSensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={150}
              step={5}
              value={Math.round(controlSensitivity * 100)}
              onChange={(e) => onChangeSensitivity(Number(e.target.value) / 100)}
              className="w-full accent-sky-400 cursor-pointer mb-2"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {[
                {
                  val: 0.8,
                  label: lang === 'id' ? 'Halus 80%' : 'Smooth 80%',
                },
                {
                  val: 1.0,
                  label: lang === 'id' ? 'Normal 100%' : 'Normal 100%',
                },
                {
                  val: 1.25,
                  label: lang === 'id' ? 'Cepat 125%' : 'Fast 125%',
                },
                {
                  val: 1.45,
                  label: lang === 'id' ? 'Pro 145%' : 'Pro 145%',
                },
              ].map((opt) => {
                const active = Math.abs(controlSensitivity - opt.val) < 0.06;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      soundFX.playBounce();
                      onChangeSensitivity(opt.val);
                    }}
                    className={`min-h-[34px] px-1.5 py-1 rounded-xl font-bold text-[11px] border transition cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-sky-500 text-slate-950 border-sky-200 font-black'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Toggle Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onToggleMute}
              className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-left flex items-center justify-between cursor-pointer"
            >
              <span>{lang === 'id' ? 'Status Suara' : 'Audio Mute'}</span>
              <span className="font-extrabold text-amber-300">
                {muted ? '🔇 OFF' : '🔊 ON'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleHaptics}
              className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-left flex items-center justify-between cursor-pointer"
            >
              <span>{lang === 'id' ? 'Getar Haptik' : 'Haptics'}</span>
              <span className="font-extrabold text-emerald-300">
                {hapticsOn ? '📳 ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleGraphics}
              className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-left flex items-center justify-between cursor-pointer"
            >
              <span>{lang === 'id' ? 'Kualitas Grafis' : 'Graphics'}</span>
              <span className="font-extrabold text-sky-300">
                {graphicsMode === 'HIGH' ? '✨ HD' : '⚡ 60FPS'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleLanguage}
              className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-left flex items-center justify-between cursor-pointer"
            >
              <span>{lang === 'id' ? 'Bahasa' : 'Language'}</span>
              <span className="font-extrabold text-amber-200">
                {lang === 'id' ? '🇮🇩 ID' : '🌐 EN'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[42px] mt-5 py-2.5 px-4 rounded-xl btn-3d-orange text-white font-display text-xs sm:text-sm tracking-wider uppercase cursor-pointer"
        >
          {lang === 'id' ? 'Simpan & Tutup' : 'Save & Close'}
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. FASE ALUR TAMAT (ENDING CUTSCENE & KEMENANGAN TOTAL DI BABAK 33)
 * ============================================================================ */
interface GrandFinaleEndingModalProps {
  isOpen: boolean;
  lang: GameLang;
  t: I18nStrings;
  totalScore: number;
  highScore: number;
  stageStars: Record<number, number>;
  completedLevels: number[];
  onDownloadCertificate: () => void;
  onShareVictory: () => void;
  onPlayFromStart: () => void;
  onCloseToMenu: () => void;
}

export const GrandFinaleEndingModal: React.FC<GrandFinaleEndingModalProps> = ({
  isOpen,
  lang,
  totalScore,
  highScore,
  stageStars,
  completedLevels,
  onDownloadCertificate,
  onShareVictory,
  onPlayFromStart,
  onCloseToMenu,
}) => {
  if (!isOpen) return null;

  const totalStarsEarned = Object.values(stageStars).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const maxPossibleStars = BOUNCE_LEVELS.length * 3; // 99 Stars

  const championTitle =
    totalStarsEarned >= 85
      ? lang === 'id'
        ? 'GRAND MASTER BOUNCE 3D LEGENDARIS'
        : 'LEGENDARY BOUNCE 3D GRAND MASTER'
      : totalStarsEarned >= 60
      ? lang === 'id'
        ? 'KSATRIA PENAKLUK 3 ZONA'
        : 'CONQUEROR OF THE 3 ZONES'
      : lang === 'id'
      ? 'JUARA PETUALANGAN BOUNCE 3D'
      : 'BOUNCE 3D ADVENTURE CHAMPION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pointer-events-auto">
      <div className="w-full max-w-lg rounded-3xl border-2 border-amber-300 bg-gradient-to-b from-amber-950/95 via-slate-950 to-slate-950 p-6 text-white shadow-[0_0_60px_rgba(251,191,36,0.4)] text-center">
        {/* Crown & Trophy Emblem */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 border-2 border-white flex items-center justify-center text-4xl shadow-lg mb-3 animate-bounce">
          👑
        </div>

        <div className="text-xs font-black tracking-widest uppercase text-amber-300 mb-1">
          {lang === 'id'
            ? 'SEKUENS TAMAT · SELURUH 3 ZONA DITAKLUKKAN!'
            : 'ENDING SEQUENCE · ALL 3 ZONES CONQUERED!'}
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-wide mb-2">
          {lang === 'id'
            ? 'TAMAT! JUARA PENUH 33 BABAK'
            : 'VICTORY! 33-STAGE GRAND CHAMPION'}
        </h2>

        <p className="text-xs text-slate-300 max-w-md mx-auto mb-4">
          {lang === 'id'
            ? 'Selamat! Bola Merah berhasil menembus Istana Bata Klasik, Rimba Satwa Liar, hingga Puncak Raja Gletser Beku di Babak 33!'
            : 'Congratulations! You guided the Red Ball through the Classic Brick Castle, Wildlife Jungle, and the Glacial King Peak in Stage 33!'}
        </p>

        {/* Official Title Banner */}
        <div className="rounded-2xl border border-amber-400/50 bg-amber-500/15 px-4 py-2.5 mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
            {lang === 'id'
              ? 'GELAR KEHORMATAN PEMAIN'
              : 'OFFICIAL PLAYER TITLE'}
          </div>
          <div className="text-sm sm:text-base font-black text-amber-300 tracking-wide mt-0.5">
            🏆 {championTitle}
          </div>
        </div>

        {/* 🔥 TEASER ZONA 4: GUNUNG LAVA & MAGMA ABADI (COMING SOON) */}
        <div className="rounded-2xl border border-red-500/60 bg-gradient-to-r from-red-950/80 via-orange-950/80 to-amber-950/80 p-3 mb-4 text-center shadow-[0_0_20px_rgba(239,68,68,0.35)] animate-pulse">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider mb-0.5">
            <span>🌋</span>
            <span>
              {lang === 'id'
                ? 'COMING SOON — ZONA 4: GUNUNG LAVA & MAGMA'
                : 'COMING SOON — ZONE 4: LAVA MOUNTAIN & MAGMA'}
            </span>
            <span>🔥</span>
          </div>
          <p className="text-[11px] text-orange-200 font-medium leading-tight">
            {lang === 'id'
              ? 'Nantikan petualangan Bola Merah di atas lahar panas, sungai magma cair, dan Raja Gunung Volkano di pembaruan mendatang!'
              : 'Stay tuned for Red Ball adventures over boiling lava, liquid magma rivers, and Volcano Mountain King in upcoming updates!'}
          </p>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-2.5">
            <div className="text-[10px] text-slate-400 font-semibold">
              {lang === 'id' ? 'Total Bintang' : 'Total Stars'}
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 tabular-nums mt-0.5">
              ★ {totalStarsEarned} / {maxPossibleStars}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-2.5">
            <div className="text-[10px] text-slate-400 font-semibold">
              {lang === 'id' ? 'Skor Akhir' : 'Final Score'}
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-300 tabular-nums mt-0.5">
              {Math.max(totalScore, highScore).toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-2.5">
            <div className="text-[10px] text-slate-400 font-semibold">
              {lang === 'id' ? 'Babak Lulus' : 'Stages Cleared'}
            </div>
            <div className="text-sm sm:text-base font-black text-sky-300 tabular-nums mt-0.5">
              {Math.max(completedLevels.length, 1)} / {BOUNCE_LEVELS.length}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            type="button"
            onClick={onDownloadCertificate}
            className="min-h-[42px] py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <span>🖼️</span>
            <span>
              {lang === 'id' ? 'Unduh Lencana Tamat' : 'Download Badge PNG'}
            </span>
          </button>
          <button
            type="button"
            onClick={onShareVictory}
            className="min-h-[42px] py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <span>📤</span>
            <span>
              {lang === 'id' ? 'Bagikan Gelar Juara' : 'Share Victory'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPlayFromStart}
            className="min-h-[40px] py-2 px-3 rounded-xl btn-3d-orange text-white font-display text-xs uppercase cursor-pointer"
          >
            {lang === 'id' ? 'Main Lagi (Babak 1)' : 'Play Again (Stage 1)'}
          </button>
          <button
            type="button"
            onClick={onCloseToMenu}
            className="min-h-[40px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-200 font-bold text-xs uppercase cursor-pointer"
          >
            {lang === 'id' ? 'Kembali ke Menu' : 'Return to Menu'}
          </button>
        </div>
      </div>
    </div>
  );
};
