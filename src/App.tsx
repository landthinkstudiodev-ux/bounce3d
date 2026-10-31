import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BounceGameEngine } from './game/BounceGameEngine';
import { GameState, HudSnapshot } from './game/types';
import { BOUNCE_LEVELS } from './game/levels';
import { soundFX } from './game/audio';
import {
  detectNationalLanguage,
  GameLang,
  setSavedLanguage,
  TRANSLATIONS,
} from './game/i18n';
import { BlueprintModal } from './components/BlueprintModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ShareGameModal } from './components/ShareGameModal';
import { AuthModal } from './components/AuthModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { PlayerUser, subscribeAuth } from './services/authService';
import { submitGlobalScore, submitSpeedrunTime } from './services/leaderboardService';
import { DailyMission, loadDailyMissions, updateMissionProgress, saveDailyMissions } from './services/dailyMissionService';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import {
  BALL_SKIN_META,
  BallSkinId,
  ShopItem,
  TRAIL_EFFECT_META,
  TrailEffectId,
  getShopItems,
  saveShopItems,
  getPlayerCoins,
  addPlayerCoins,
  canSpinToday,
  recordSpinToday,
  getEquippedSkin,
  setEquippedSkin,
  getEquippedTrail,
  setEquippedTrail,
} from './services/shopService';
import { DailySpinModal } from './components/DailySpinModal';
import { ShopModal } from './components/ShopModal';
import { updatePlayerStats, getPlayerStats } from './services/achievementService';
import { AchievementsModal } from './components/AchievementsModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { ChestUnboxingModal } from './components/ChestUnboxingModal';
import { ZoneTransitionModal } from './components/ZoneTransitionModal';
import { GoldVictoryToast } from './components/GoldVictoryToast';
import {
  SplashScreen3D,
  PreLevelBriefingCard,
  SettingsModal,
  GrandFinaleEndingModal,
  computeStageStars,
  loadStageStars,
  saveStageStars,
  isStageUnlockedByZoneRules,
  getHighestUnlockedStageIndex,
} from './components/SplashAndLoopModals';
import {
  RingIcon,
  SpinIcon,
  ShopIcon,
  MissionIcon,
  TrophyIcon,
  MedalIcon,
  LeaderboardIcon,
  ShareIcon,
  Settings3DIcon,
} from './components/ArcadeIcons';
import { ArcadeAssetIcon } from './components/ArcadeAssetManager';
import { JuiceParticleBurst, ParticleBurstRef } from './components/JuiceParticleBurst';

const STORAGE_UNLOCKED_KEY = 'bounce_unlocked_level';
const STORAGE_COMPLETED_KEY = 'bounce_completed_levels';

function formatSpeedrunTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return '--:--.-';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor(Math.round((seconds - Math.floor(seconds)) * 10));
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )}.${tenths}`;
}

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BounceGameEngine | null>(null);

  const [lang, setLang] = useState<GameLang>(() => detectNationalLanguage());
  const t = TRANSLATIONS[lang];

  const [gameState, setGameState] = useState<GameState>('START');

  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    const completedSet = new Set<number>();
    try {
      const raw = localStorage.getItem(STORAGE_COMPLETED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((n) => {
            if (typeof n === 'number' && Number.isFinite(n)) {
              completedSet.add(n);
            }
          });
        }
      }
      const rawTimes = localStorage.getItem('bounce_best_times');
      if (rawTimes) {
        const parsedTimes = JSON.parse(rawTimes);
        if (parsedTimes && typeof parsedTimes === 'object') {
          Object.keys(parsedTimes).forEach((k) => {
            const stageNum = parseInt(k, 10);
            if (Number.isFinite(stageNum) && stageNum >= 1) {
              completedSet.add(stageNum);
            }
          });
        }
      }
    } catch {
      // ignore storage errors
    }

    const sorted = Array.from(completedSet).sort((a, b) => a - b);
    const contiguous: number[] = [];
    for (const lvl of sorted) {
      if (lvl === 1 || contiguous.includes(lvl - 1) || lvl === 12 || lvl === 23) {
        contiguous.push(lvl);
      } else {
        break;
      }
    }
    return contiguous;
  });

  // Automatically point selectedLevelIdx to the player's latest unlocked stage on load
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(() =>
    getHighestUnlockedStageIndex(completedLevels)
  );

  const [unlockedMaxLevel, setUnlockedMaxLevel] = useState<number>(() => {
    const highestDone = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
    return Math.min(BOUNCE_LEVELS.length, Math.max(1, highestDone + 1));
  });

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showGrandFinaleModal, setShowGrandFinaleModal] = useState<boolean>(false);
  const [stageStars, setStageStars] = useState<Record<number, number>>(() =>
    loadStageStars()
  );
  const [lastEarnedStars, setLastEarnedStars] = useState<number>(3);
  const [bgmVolume, setBgmVolume] = useState<number>(() =>
    soundFX.getBgmVolume()
  );
  const [sfxVolume, setSfxVolume] = useState<number>(() =>
    soundFX.getSfxVolume()
  );
  const [controlSensitivity, setControlSensitivity] = useState<number>(() => {
    try {
      const saved = parseFloat(
        localStorage.getItem('bounce_control_sensitivity') || '1'
      );
      if (Number.isFinite(saved)) return Math.max(0.6, Math.min(1.5, saved));
    } catch {}
    return 1.0;
  });

  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [hapticsOn, setHapticsOn] = useState<boolean>(() =>
    soundFX.isHapticsEnabled()
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeBtn, setActiveBtn] = useState<{
    left: boolean;
    right: boolean;
    jump: boolean;
  }>({ left: false, right: false, jump: false });

  // Player & Social Features
  const [player, setPlayer] = useState<PlayerUser | null>(null);
  const playerRef = useRef<PlayerUser | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  // Rewarded Video Ad Revive System (capped at 3x per game)
  const [adRevivesLeft, setAdRevivesLeft] = useState<number>(3);
  const [showRewardedAd, setShowRewardedAd] = useState<boolean>(false);
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() => loadDailyMissions());
  const [showDailyMissionsModal, setShowDailyMissionsModal] = useState<boolean>(false);
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => getShopItems());
  const [playerCoins, setPlayerCoins] = useState<number>(() => getPlayerCoins());
  const [equippedSkin, setEquippedSkinState] = useState<BallSkinId>(() =>
    getEquippedSkin()
  );
  const [equippedTrail, setEquippedTrailState] = useState<TrailEffectId>(() =>
    getEquippedTrail()
  );
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showSpinModal, setShowSpinModal] = useState<boolean>(false);
  const [canSpin, setCanSpin] = useState<boolean>(() => canSpinToday());
  const [showAchievementsModal, setShowAchievementsModal] = useState<boolean>(false);
  const [showDailyStreakModal, setShowDailyStreakModal] = useState<boolean>(false);
  const [showChestUnboxingModal, setShowChestUnboxingModal] = useState<boolean>(false);
  const [showZoneTransition, setShowZoneTransition] = useState<boolean>(false);

  // Auto-launch Daily Streak Modal ONLY AFTER Splash Screen has finished so modals never overlap
  useEffect(() => {
    if (showSplash) return;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;
      const saved = localStorage.getItem('bounce3d_daily_streak_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastClaimDate !== todayStr) {
          setShowDailyStreakModal(true);
        }
      } else {
        setShowDailyStreakModal(true);
      }
    } catch {
      // ignore
    }
  }, [showSplash]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setPlayer(user);
    });
    return () => unsub();
  }, []);

  // Keep unlockedMaxLevel synchronized sequentially (highest completed stage + 1)
  useEffect(() => {
    if (completedLevels.length === 0) return;
    const highestDone = Math.max(...completedLevels);
    const sequentialUnlock = Math.min(BOUNCE_LEVELS.length, highestDone + 1);
    if (unlockedMaxLevel !== sequentialUnlock && unlockedMaxLevel < sequentialUnlock) {
      setUnlockedMaxLevel(sequentialUnlock);
      try {
        localStorage.setItem(STORAGE_UNLOCKED_KEY, String(sequentialUnlock));
      } catch {
        // ignore storage errors
      }
    }
  }, [completedLevels, unlockedMaxLevel]);

  const [hud, setHud] = useState<HudSnapshot>({
    levelNumber: 1,
    biome: 'CLASSIC',
    levelTitle: t.stages[1].title,
    difficultyTag: BOUNCE_LEVELS[0].difficultyTag,
    lives: 3,
    score: 0,
    highScore: 0,
    collectedRings: 0,
    totalRings: BOUNCE_LEVELS[0].rings.length,
    ballType: 'NORMAL',
    exitUnlocked: false,
    progressPercent: 0,
    toastMessage: null,
    canRevive: true,
    graphicsMode: 'HIGH',
    hintEnabled: false,
    activeHint: t.hintCollectAllRings(BOUNCE_LEVELS[0].rings.length),
    elapsedTimeSec: 0,
    bestTimeSec: null,
    isNewRecord: false,
    stageIntro: null,
  });

  const particleBurstRef = useRef<ParticleBurstRef | null>(null);
  const prevRingsRef = useRef<number>(0);

  useEffect(() => {
    if (hud.collectedRings > prevRingsRef.current && prevRingsRef.current >= 0) {
      if (prevRingsRef.current > 0) {
        particleBurstRef.current?.triggerBurst(window.innerWidth / 2, window.innerHeight * 0.25, 'gold');
      }
    }
    prevRingsRef.current = hud.collectedRings;
  }, [hud.collectedRings]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new BounceGameEngine(canvasContainerRef.current, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onStateChange: (newState, finalScore, levelNumber) => {
        setGameState(newState);
        if (newState === 'WIN' || newState === 'ZONE_COMPLETE') {
          const earned = computeStageStars(
            levelNumber,
            engine.getElapsedLevelTime(),
            engine.getLives(),
            finalScore
          );
          setLastEarnedStars(earned);
          setStageStars((prevStars) => {
            const bestForStage = Math.max(prevStars[levelNumber] || 0, earned);
            const nextStars = { ...prevStars, [levelNumber]: bestForStage };
            saveStageStars(nextStars);
            return nextStars;
          });

          if (levelNumber === BOUNCE_LEVELS.length || newState === 'ZONE_COMPLETE') {
            setShowGrandFinaleModal(true);
          }

          setCompletedLevels((prev) => {
            const next = prev.includes(levelNumber)
              ? prev
              : [...prev, levelNumber];
            try {
              localStorage.setItem(STORAGE_COMPLETED_KEY, JSON.stringify(next));
            } catch {
              // ignore storage errors
            }
            return next;
          });

          setUnlockedMaxLevel((prevMax) => {
            // Sequential stage unlock: completing stage N unlocks stage N + 1
            const nextMax = Math.min(
              BOUNCE_LEVELS.length,
              Math.max(prevMax, levelNumber + 1)
            );
            try {
              localStorage.setItem(STORAGE_UNLOCKED_KEY, String(nextMax));
            } catch {
              // ignore storage errors
            }
            if (levelNumber === 11) {
              setSelectedLevelIdx(11);
              setShowZoneTransition(true);
              engine.showToast('🌿 Selamat! Zona 2: Hutan & Satwa (Babak 12) Terbuka!');
            } else if (levelNumber === 22) {
              setSelectedLevelIdx(22);
              setShowZoneTransition(true);
              engine.showToast('❄️ Selamat! Zona 3: Es & Gletser (Babak 23) Terbuka!');
            }
            return nextMax;
          });

          // Update Achievement Stats
          const curStats = getPlayerStats();
          updatePlayerStats({
            wins: curStats.wins + 1,
            fastestTimeSec: engine.getElapsedLevelTime(),
            totalRingsCollected: curStats.totalRingsCollected + engine.getCollectedRings(),
          });

          // Cloud Leaderboard Submission
          if (playerRef.current) {
            submitGlobalScore(finalScore, levelNumber);
            submitSpeedrunTime(playerRef.current, levelNumber, engine.getElapsedLevelTime());
          }
        } else if (newState === 'GAMEOVER') {
          if (playerRef.current) {
            submitGlobalScore(finalScore, levelNumber);
          }
        }
      },
    });

    engineRef.current = engine;
    const initialIdx = getHighestUnlockedStageIndex(completedLevels);
    if (initialIdx > 0) {
      engine.loadLevel(initialIdx);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore if blocked by iframe/browser policy
    }
  }, []);

  const handleToggleLanguage = useCallback(() => {
    const nextLang: GameLang = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    setSavedLanguage(nextLang);
    engineRef.current?.setLanguage(nextLang);
  }, [lang]);

  const handleStartGame = useCallback(
    (levelIdx: number = selectedLevelIdx) => {
      const targetStageNumber = levelIdx + 1;
      if (!isStageUnlockedByZoneRules(targetStageNumber, completedLevels)) {
        engineRef.current?.showToast(t.toastStageLocked(targetStageNumber));
        return;
      }
      setSelectedLevelIdx(levelIdx);
      soundFX.startBgm();
      engineRef.current?.startGame(levelIdx);
    },
    [selectedLevelIdx, t, completedLevels]
  );

  const handleRestartCurrentStage = useCallback(() => {
    engineRef.current?.restartCurrentLevel();
  }, []);

  const handleReturnToMainMenu = useCallback(() => {
    engineRef.current?.returnToMainMenu();
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextIdx = hud.levelNumber % BOUNCE_LEVELS.length;
    const nextStageNumber = nextIdx + 1;
    if (!isStageUnlockedByZoneRules(nextStageNumber, completedLevels)) {
      engineRef.current?.showToast(t.toastStageLocked(nextStageNumber));
      return;
    }
    setSelectedLevelIdx(nextIdx);
    engineRef.current?.startNextLevel();
  }, [hud.levelNumber, completedLevels, t]);

  const handleRevive = useCallback(() => {
    engineRef.current?.reviveAtCheckpoint();
  }, []);

  const handleClaimRewardedAd = useCallback(() => {
    setAdRevivesLeft((prev) => Math.max(0, prev - 1));
    setShowRewardedAd(false);
    engineRef.current?.reviveWithExtraLife();
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleToggleGraphics = useCallback(() => {
    engineRef.current?.toggleGraphicsMode();
  }, []);

  const handleToggleHint = useCallback(() => {
    engineRef.current?.toggleHint();
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    soundFX.setMuted(next);
    engineRef.current?.showToast(next ? '🔇 Suara Dimatikan' : '🔊 Suara Diaktifkan');
  }, [muted]);

  const handleToggleHaptics = useCallback(() => {
    const next = !hapticsOn;
    setHapticsOn(next);
    soundFX.setHapticsEnabled(next);
    if (next) soundFX.vibrate(20);
  }, [hapticsOn]);

  const handleShareVictory = useCallback(async () => {
    const timeStr = formatSpeedrunTime(hud.elapsedTimeSec);
    const bestStr = formatSpeedrunTime(hud.bestTimeSec ?? hud.elapsedTimeSec);
    const localizedTitle =
      t.stages[hud.levelNumber]?.title || hud.levelTitle;
    const shareTitle = t.shareTitle(hud.levelNumber);
    const shareText = t.shareBody(
      hud.levelNumber,
      localizedTitle,
      timeStr,
      bestStr,
      hud.score,
      hud.collectedRings,
      hud.totalRings
    );

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        engineRef.current?.showToast(t.toastShared);
        return;
      }
    } catch {
      // fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(
        `${shareText}\n${window.location.href}`
      );
      engineRef.current?.showToast(t.toastCopied);
    } catch {
      engineRef.current?.showToast(t.toastReadyShare);
    }
  }, [
    hud.collectedRings,
    hud.elapsedTimeSec,
    hud.bestTimeSec,
    hud.levelNumber,
    hud.levelTitle,
    hud.score,
    hud.totalRings,
    t,
  ]);

  const handleDownloadVictoryBadgePng = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 800, 450);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 450);

    // Classic Red Brick Accent Strip at Bottom
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 395, 800, 55);
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 4;
    for (let x = 0; x < 800; x += 64) {
      ctx.strokeRect(x, 395, 64, 28);
      ctx.strokeRect(x - 32, 423, 64, 27);
    }

    // Gold Arcade Border
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 772, 422);

    // Glossy 3D Red Ball Emblem
    const ballGrad = ctx.createRadialGradient(115, 115, 10, 130, 135, 62);
    ballGrad.addColorStop(0, '#fda4af');
    ballGrad.addColorStop(0.35, '#ef4444');
    ballGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(130, 135, 58, 0, Math.PI * 2);
    ctx.fill();

    // Gold Hoop Ring around Emblem
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(130, 135, 76, 28, -0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Header & Title
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.fillText('BOUNCE ROLLING: 3D ADVENTURE', 235, 82);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      hud.levelNumber === 11 && gameState === 'ZONE_COMPLETE'
        ? t.badgeChampionship
        : t.badgeStageVictory(hud.levelNumber),
      235,
      115
    );

    const localizedTitle =
      t.stages[hud.levelNumber]?.title || hud.levelTitle;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(localizedTitle, 235, 158);

    // Metrics Boxes
    const metrics = [
      {
        label: t.badgeMetricClearTime,
        value: formatSpeedrunTime(hud.elapsedTimeSec),
        color: '#fde047',
      },
      {
        label: t.badgeMetricBestTime(hud.isNewRecord),
        value: formatSpeedrunTime(hud.bestTimeSec ?? hud.elapsedTimeSec),
        color: '#34d399',
      },
      {
        label: t.badgeMetricTotalScore,
        value: String(hud.score).padStart(6, '0'),
        color: '#ffffff',
      },
      {
        label: t.badgeMetricGoldHoops,
        value: `${hud.collectedRings} / ${hud.totalRings}`,
        color: '#facc15',
      },
    ];

    metrics.forEach((m, idx) => {
      const boxX = 42 + idx * 182;
      const boxY = 235;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 2;
      ctx.fillRect(boxX, boxY, 168, 115);
      ctx.strokeRect(boxX, boxY, 168, 115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(m.label, boxX + 14, boxY + 34);

      ctx.fillStyle = m.color;
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.fillText(m.value, boxX + 14, boxY + 80);
    });

    const link = document.createElement('a');
    link.download = `bounce-${hud.levelNumber}-victory.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    engineRef.current?.showToast(t.toastBadgeDownloaded);
  }, [
    gameState,
    hud.bestTimeSec,
    hud.collectedRings,
    hud.elapsedTimeSec,
    hud.isNewRecord,
    hud.levelNumber,
    hud.levelTitle,
    hud.score,
    hud.totalRings,
    t,
  ]);

  const bindTouchProps = (keyName: 'left' | 'right' | 'jump') => ({
    onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
    },
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      soundFX.vibrate(8);
      setActiveBtn((prev) => ({ ...prev, [keyName]: true }));
      engineRef.current?.setTouchInput(keyName, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setActiveBtn((prev) => ({ ...prev, [keyName]: false }));
      engineRef.current?.setTouchInput(keyName, false);
    },
    onPointerCancel: () => {
      setActiveBtn((prev) => ({ ...prev, [keyName]: false }));
      engineRef.current?.setTouchInput(keyName, false);
    },
  });

  const getBallHudIconClass = () => {
    if (hud.ballType === 'BIG') {
      return 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-300 shadow-md border-2 border-amber-300 transition-transform';
    }
    return 'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-300 shadow-md border border-amber-300 transition-transform';
  };

  const activeStageBlueprint =
    BOUNCE_LEVELS[
      gameState === 'START' ? selectedLevelIdx : hud.levelNumber - 1
    ] ?? BOUNCE_LEVELS[0];

  const activeStageSubtitle =
    t.stages[activeStageBlueprint.levelNumber]?.subtitle ||
    activeStageBlueprint.subtitle;

  return (
    <div className="relative flex flex-col justify-between w-full h-full overflow-hidden select-none bg-slate-950">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={canvasContainerRef}
        className="w-full h-full absolute inset-0"
      />

      {/* Gameplay HUD & Touch Controls — Visible ONLY when PLAYING */}
      {gameState === 'PLAYING' && (
        <>
          {/* Top Arena Progress Hairline */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950/50 z-20 pointer-events-none">
            <div
              style={{
                transform: `scaleX(${hud.progressPercent / 100})`,
                transformOrigin: 'left',
              }}
              className="w-full h-full bg-gradient-to-r from-red-500 to-amber-400 transition-transform duration-150"
            />
          </div>

          {/* Standardized 3-Zone Top HUD with Safe-Area Support */}
          <header className="absolute top-2 pt-[env(safe-area-inset-top)] left-0 right-0 px-3 sm:px-5 flex justify-between items-center pointer-events-none z-10">
            {/* Zone 1 (Left): Ball State & Lives */}
            <div className="frosted-hud px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl flex items-center gap-2">
              <div className={getBallHudIconClass()} />
              <span className="text-xs sm:text-base font-extrabold text-white tabular-nums">
                ×{hud.lives}
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-slate-300">
                · {hud.ballType === 'BIG' ? t.ballBig : t.ballSmall}
              </span>
            </div>

            {/* Zone 2 (Center): Rings Counter & Live Timer */}
            <div className="frosted-hud px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-[3px] ${
                  hud.exitUnlocked ? 'border-emerald-400' : 'border-amber-400'
                }`}
              />
              <span
                className={`text-xs sm:text-base font-extrabold tabular-nums ${
                  hud.exitUnlocked ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {hud.collectedRings}/{hud.totalRings}
              </span>
              <span className="text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 tabular-nums">
                {formatSpeedrunTime(hud.elapsedTimeSec)}
              </span>
            </div>

            {/* Zone 1.5 (Power-Ups): Rendered when active in Zone 11 */}
            {(hud.hasShield || hud.hasSpeedBoost || hud.hasMagnet) && (
              <div className="frosted-hud px-2.5 py-1 rounded-2xl flex items-center gap-1.5 border border-cyan-400/50 bg-cyan-950/40">
                <ArcadeAssetIcon iconKey="shield" className="w-5 h-5 filter drop-shadow" />
                <ArcadeAssetIcon iconKey="speed_boost" className="w-5 h-5 filter drop-shadow" />
                <ArcadeAssetIcon iconKey="magnet" className="w-5 h-5 filter drop-shadow" />
              </div>
            )}

            {/* Invincibility Star 30s Visual Badge */}
            {Boolean(hud.starInvincibleTimeLeftSec && hud.starInvincibleTimeLeftSec > 0) && (
              <div className="frosted-hud px-3 py-1 rounded-2xl flex items-center gap-1.5 border border-amber-400/80 bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-orange-500/30 text-amber-300 font-extrabold text-xs animate-pulse shadow-[0_0_14px_rgba(251,191,36,0.6)]">
                <span className="text-sm">⭐</span>
                <span className="tabular-nums font-black text-amber-200">
                  {hud.starInvincibleTimeLeftSec}s
                </span>
              </div>
            )}

            {/* Zone 3 (Right): Stage/Score, Hint Toggle, Fullscreen, Pause */}
            <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              <div className="frosted-hud px-3 py-1 rounded-2xl text-right hidden sm:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider tabular-nums">
                  {t.stageWord} {hud.levelNumber}
                </div>
                <div className="text-xs font-extrabold text-white tabular-nums">
                  {String(hud.score).padStart(6, '0')}
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleHint}
                className={`min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] px-2.5 rounded-2xl flex items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                  hud.hintEnabled
                    ? 'bg-amber-400 text-slate-950 shadow-lg border border-amber-200'
                    : 'frosted-hud text-amber-300 hover:bg-slate-900/90'
                }`}
                title={`${t.hintBtn} (H)`}
                aria-label={t.hintBtn}
              >
                <span>💡</span>
                <span className="hidden md:inline">{t.hintBtn}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="frosted-hud hover:bg-slate-900/90 text-slate-200 min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] rounded-2xl flex items-center justify-center text-sm font-bold transition cursor-pointer"
                title={t.fullscreenBtn}
                aria-label={t.fullscreenBtn}
              >
                {isFullscreen ? '🗗' : '⛶'}
              </button>

              <button
                type="button"
                onClick={handleRestartCurrentStage}
                className="frosted-hud hover:bg-slate-900/90 text-amber-300 min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] rounded-2xl flex items-center justify-center transition cursor-pointer"
                title="Cepat Ulang (Quick Retry)"
                aria-label="Quick Retry"
              >
                <ArcadeAssetIcon iconKey="retry" className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
              </button>

              <button
                type="button"
                onClick={handleTogglePause}
                className="frosted-hud hover:bg-slate-900/90 text-white min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] rounded-2xl flex items-center justify-center transition cursor-pointer"
                title={t.pauseTitle}
                aria-label={t.pauseTitle}
              >
                <ArcadeAssetIcon iconKey="pause" className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
              </button>
            </div>
          </header>

          {/* Compact 1-Line Hint Pill (Off by default, shown only when 💡 is clicked) */}
          {hud.hintEnabled && (
            <div className="absolute top-14 sm:top-16 left-1/2 transform -translate-x-1/2 pointer-events-auto z-10">
              <div className="frosted-hud border-amber-400/50 rounded-full px-3.5 py-1 flex items-center gap-2">
                <span className="text-xs font-bold text-amber-200 whitespace-nowrap">
                  {hud.activeHint}
                </span>
                <button
                  type="button"
                  onClick={handleToggleHint}
                  className="text-xs text-slate-400 hover:text-white font-bold px-1 cursor-pointer transition"
                  aria-label="Close Hint"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Non-Intrusive Toast Notification */}
          <div
            className={`absolute ${
              hud.hintEnabled ? 'top-24' : 'top-14 sm:top-16'
            } left-1/2 transform -translate-x-1/2 frosted-hud border-amber-400/60 text-amber-300 font-extrabold px-4 py-1 rounded-full text-xs tracking-wide transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap ${
              hud.toastMessage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {hud.toastMessage || t.toastCheckpoint}
          </div>

          {/* Centered Floating Stage Intro Card (2 seconds at level start) */}
          {hud.stageIntro?.visible && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-bounce-in w-11/12 max-w-sm">
              <div className="bg-slate-950/85 backdrop-blur-md border border-amber-500/50 rounded-2xl p-4 sm:p-5 text-center shadow-2xl shadow-amber-500/20">
                <div className="inline-block px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] uppercase tracking-wider mb-2">
                  {hud.levelNumber >= 12 ? 'Zona 2: Hutan & Satwa' : 'Zona 1: Klasik'} • {hud.stageIntro.subtitle}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1.5 drop-shadow">
                  {hud.stageIntro.title}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-amber-300">
                  🎯 {hud.stageIntro.objective}
                </p>
              </div>
            </div>
          )}

          {/* Proportional Thumb-Zone Touch Controls with Safe-Area Insets */}
          <div className="absolute bottom-12 sm:bottom-14 pb-[env(safe-area-inset-bottom)] left-0 right-0 px-4 sm:px-8 flex justify-between items-end pointer-events-none z-10">
            {/* Left / Right Thumb Controls */}
            <div className="flex gap-2.5 sm:gap-4 pointer-events-auto">
              <button
                type="button"
                {...bindTouchProps('left')}
                className={`touch-btn touch-btn-dir rounded-2xl flex items-center justify-center text-white cursor-pointer ${
                  activeBtn.left ? 'active' : ''
                }`}
                aria-label="Left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 sm:h-9 sm:w-9"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.8}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                {...bindTouchProps('right')}
                className={`touch-btn touch-btn-dir rounded-2xl flex items-center justify-center text-white cursor-pointer ${
                  activeBtn.right ? 'active' : ''
                }`}
                aria-label="Right"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 sm:h-9 sm:w-9"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.8}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Right Thumb Jump Control */}
            <div className="pointer-events-auto">
              <button
                type="button"
                {...bindTouchProps('jump')}
                className={`touch-btn touch-btn-jump rounded-full flex items-center justify-center text-amber-300 cursor-pointer ${
                  activeBtn.jump ? 'active' : ''
                }`}
                aria-label="Jump"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 sm:h-11 sm:w-11"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Adaptive Modern Frosted Arcade Menu Overlay (1-Col Portrait / 2-Col Landscape) */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm flex flex-col justify-center items-center z-20 p-2 sm:p-4 overflow-y-auto">
          <div className="frosted-card menu-card-adaptive rounded-3xl relative">
            {/* Top Social & Profile Utility Bar */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer max-w-[55%]"
                title={player ? player.displayName : t.accountTitle}
              >
                {player?.photoURL ? (
                  <img
                    src={player.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <span className="text-sm">👤</span>
                )}
                <span className="text-xs font-bold text-slate-200 truncate">
                  {player ? player.displayName : t.playAsGuest}
                </span>
                {player?.isAnonymous && (
                  <span className="text-[10px] text-amber-300 font-semibold px-1 rounded bg-amber-400/20">
                    Tamu
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Coin Wallet Badge */}
                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black transition cursor-pointer tabular-nums shadow-sm hover:scale-105"
                  title="Cincin Emas"
                >
                  <RingIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                  <span>{playerCoins}</span>
                </button>

                {/* Daily Streak Bonus Button */}
                <button
                  type="button"
                  onClick={() => setShowDailyStreakModal(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/40 hover:to-yellow-500/40 border border-amber-400/60 text-amber-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title="Bonus Streak Harian"
                >
                  <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                  <span className="hidden sm:inline">Streak</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowSpinModal(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title="Putar Roda Harian"
                >
                  <SpinIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                  {canSpin && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title="Toko"
                >
                  <ShopIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                  <span className="hidden sm:inline">Toko</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDailyMissionsModal(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title={t.dailyMissionsTitle}
                >
                  <MissionIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                  <span className="hidden sm:inline">Misi</span>
                  {dailyMissions.some((m) => m.completed && !m.claimed) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAchievementsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title={lang === 'id' ? 'Piala & Prestasi' : 'Trophies'}
                >
                  <MedalIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowLeaderboard(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title={t.leaderboardTitle}
                >
                  <LeaderboardIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title={t.shareGameBtn}
                >
                  <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 text-xs font-extrabold transition cursor-pointer shadow-sm hover:scale-105"
                  title="Pengaturan & Suara"
                >
                  <Settings3DIcon className="w-5 h-5 sm:w-6 sm:h-6 filter drop-shadow" />
                </button>
              </div>
            </div>

            <div className="menu-grid-adaptive">
              {/* LEFT COLUMN: 3D Logo Lockup, Full Stage Info, Primary 3D Action CTAs & Settings Footer */}
              <div className="menu-left-col">
                <div>
                  {/* Miniclip 3D Logo Lockup with User's Uploaded Asset */}
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
                    <img
                      src="/assets/aistudio/image_f1216a49.png"
                      alt="Bounce Rolling 3D Adventure Logo"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-xl border-2 border-amber-400/90 object-cover shrink-0 select-none pointer-events-none"
                    />
                    <div className="min-w-0 relative">
                      <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-orange-500/25 rounded-xl blur-md animate-pulse pointer-events-none" />
                      <h1 className="title-3d-bounce relative text-xl sm:text-2xl font-black tracking-wide leading-none uppercase truncate">
                        {gameState === 'START' && 'BOUNCE 3D'}
                        {gameState === 'PAUSED' && t.titlePaused}
                        {gameState === 'WIN' && t.titleStageClear(hud.levelNumber)}
                        {gameState === 'ZONE_COMPLETE' && t.titleAllClear}
                        {gameState === 'GAMEOVER' && t.titleGameOver}
                      </h1>
                      <div className="text-[11px] sm:text-xs text-amber-200/90 font-bold uppercase tracking-wider mt-0.5 relative">
                        {gameState === 'START' ? 'Rolling Adventure' : t.classicArcadeBadge}
                      </div>
                    </div>
                  </div>

                  {/* Full Uncut Stage Metadata & Subtitle */}
                  <div className="mt-1 text-xs font-semibold text-slate-200 leading-snug tabular-nums flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/30">
                      {t.stageWord} {activeStageBlueprint.levelNumber}
                    </span>
                    <span className="text-white font-bold truncate max-w-[140px] sm:max-w-none">
                      {activeStageSubtitle}
                    </span>
                    <span className="text-slate-500" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-amber-300 font-extrabold whitespace-nowrap">
                      🟡 {activeStageBlueprint.rings.length} {t.ringWord}
                    </span>
                  </div>
                </div>

                {/* Fase 2: Persiapan Pra-Level (Pre-Level Briefing Card) */}
                {gameState === 'START' && (
                  <PreLevelBriefingCard
                    blueprint={activeStageBlueprint}
                    lang={lang}
                    earnedStars={
                      stageStars[activeStageBlueprint.levelNumber] ||
                      (completedLevels.includes(activeStageBlueprint.levelNumber)
                        ? 1
                        : 0)
                    }
                    bestTimeSec={
                      engineRef.current
                        ? engineRef.current.getBestTime(
                            activeStageBlueprint.levelNumber
                          )
                        : null
                    }
                  />
                )}

                {/* Miniclip 3D Tactile Pushable Action Buttons */}
                <div className="space-y-1.5 my-1">
                  {gameState === 'GAMEOVER' ? (
                    <div className="space-y-1.5">
                      {adRevivesLeft > 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowRewardedAd(true)}
                          className="w-full min-h-[42px] py-2 px-3 rounded-xl btn-3d-amber text-slate-950 font-display text-xs sm:text-sm tracking-wide cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                        >
                          <span>📺</span>
                          <span>{t.watchAdReviveBtn(adRevivesLeft)}</span>
                        </button>
                      ) : (
                        <div className="w-full py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-500 text-xs text-center font-bold">
                          {t.adRevivesExhausted}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartGame(hud.levelNumber - 1)}
                          className="w-full min-h-[38px] py-1.5 px-2 rounded-xl btn-3d-orange text-white font-display text-xs tracking-wider cursor-pointer uppercase"
                        >
                          {t.retryStageBtn(hud.levelNumber)}
                        </button>
                        <button
                          type="button"
                          onClick={handleReturnToMainMenu}
                          className="w-full min-h-[38px] py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border-b-2 border-slate-950 text-slate-200 font-bold text-xs transition cursor-pointer active:translate-y-0.5"
                        >
                          {t.mainMenuBtn}
                        </button>
                      </div>
                    </div>
                  ) : gameState === 'PAUSED' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className="w-full min-h-[42px] py-2 px-3 rounded-xl btn-3d-green text-white font-display text-sm tracking-wider cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                      >
                        <span>▶</span>
                        <span>{t.resumeBtn}</span>
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={handleRestartCurrentStage}
                          className="w-full min-h-[36px] py-1.5 px-2 rounded-xl btn-3d-orange text-white font-display text-xs tracking-wider cursor-pointer uppercase"
                        >
                          {t.restartShortBtn}
                        </button>
                        <button
                          type="button"
                          onClick={handleReturnToMainMenu}
                          className="w-full min-h-[36px] py-1.5 px-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border-b-2 border-slate-950 text-rose-300 font-bold text-xs transition cursor-pointer active:translate-y-0.5"
                        >
                          {t.mainMenuBtn}
                        </button>
                      </div>
                    </>
                  ) : gameState === 'WIN' ? (
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      className="w-full min-h-[44px] py-2 px-3 rounded-xl btn-3d-green text-white font-display text-sm sm:text-base tracking-wider cursor-pointer flex items-center justify-center gap-2 uppercase"
                    >
                      <span>★</span>
                      <span>{t.nextStageBtn(hud.levelNumber + 1)}</span>
                      <span>★</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Dual Play Buttons: 1) Lanjutkan Petualangan & 2) Mulai Babak Baru */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStartGame(
                              gameState === 'ZONE_COMPLETE'
                                ? 0
                                : selectedLevelIdx
                            )
                          }
                          className="w-full min-h-[44px] py-2 px-3 rounded-xl btn-3d-orange text-white font-display text-xs sm:text-sm tracking-wider cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                        >
                          <span>▶</span>
                          <span className="truncate">
                            {gameState === 'ZONE_COMPLETE'
                              ? t.playAgainBtn
                              : lang === 'id'
                              ? `Lanjutkan (Babak ${selectedLevelIdx + 1})`
                              : `Continue (Stage ${selectedLevelIdx + 1})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLevelIdx(0);
                            handleStartGame(0);
                          }}
                          className="w-full min-h-[44px] py-2 px-3 rounded-xl btn-3d-green text-white font-display text-xs sm:text-sm tracking-wider cursor-pointer flex items-center justify-center gap-1.5 uppercase"
                          title={
                            lang === 'id'
                              ? 'Mulai petualangan dari Babak 1'
                              : 'Start adventure from Stage 1'
                          }
                        >
                          <span>🔄</span>
                          <span className="truncate">
                            {lang === 'id'
                              ? 'Mulai Baru (Babak 1)'
                              : 'New Game (Stage 1)'}
                          </span>
                        </button>
                      </div>

                      {/* Prominent Main Menu Navigation Bar: Level Select, Shop/Skins, Settings */}
                      {/* Minimalist Main Menu */}
                      <div className="flex flex-col items-center justify-center gap-6 py-6">
                        {/* Play Button - Large & Bouncy */}
                        <BouncyButton
                          onClick={() => handleStartGame(1)}
                          className="w-32 h-32 rounded-full bg-emerald-500 shadow-[0_8px_0_rgb(5,150,105)] flex items-center justify-center text-4xl"
                        >
                          ▶️
                        </BouncyButton>

                        {/* Bottom Row - Subtle, Icon-only Navigation */}
                        <div className="flex gap-4 p-4 rounded-3xl bg-slate-900/50 backdrop-blur-sm border border-white/10">
                          <BouncyButton onClick={() => setShowLevelModal(true)} className="p-3 bg-slate-800 rounded-2xl text-xl">🗺️</BouncyButton>
                          <BouncyButton onClick={() => setShowShopModal(true)} className="p-3 bg-slate-800 rounded-2xl text-xl">🎨</BouncyButton>
                          <BouncyButton onClick={() => setShowLeaderboardModal(true)} className="p-3 bg-slate-800 rounded-2xl text-xl">🏆</BouncyButton>
                          <BouncyButton onClick={() => setShowSettingsModal(true)} className="p-3 bg-slate-800 rounded-2xl text-xl">⚙️</BouncyButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unified Settings, Language, Fullscreen & High Score Bar */}
                <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-left">
                    <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] block leading-tight">
                      {t.highScoreLabel}
                    </span>
                    <div className="font-extrabold text-amber-300 tabular-nums text-xs sm:text-sm">
                      {String(hud.highScore).padStart(6, '0')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className="min-h-[34px] px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-[11px] cursor-pointer transition whitespace-nowrap flex items-center gap-1"
                      title={
                        lang === 'id'
                          ? 'Pengaturan Audio & Kontrol'
                          : 'Audio & Control Settings'
                      }
                    >
                      <span>⚙️</span>
                      <span className="hidden sm:inline">
                        {lang === 'id' ? 'Pengaturan' : 'Settings'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleLanguage}
                      className="min-h-[34px] px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-amber-200 font-bold text-[11px] cursor-pointer transition whitespace-nowrap"
                      title="Bahasa / Language"
                    >
                      {t.langBadge}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className={`min-h-[34px] px-2 rounded-xl font-bold text-[11px] border flex items-center gap-1 cursor-pointer transition whitespace-nowrap ${
                        !muted
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/5 text-slate-500'
                      }`}
                      title={t.soundOn}
                    >
                      <span>{muted ? '🔇' : '🔊'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleHaptics}
                      className={`min-h-[34px] px-2 rounded-xl font-bold text-[11px] border flex items-center gap-1 cursor-pointer transition whitespace-nowrap ${
                        hapticsOn
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/5 text-slate-500'
                      }`}
                      title={t.hapticOn}
                    >
                      <span>📳</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleGraphics}
                      className="min-h-[34px] px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sky-300 font-bold text-[11px] cursor-pointer transition whitespace-nowrap"
                      title="HD / 60FPS"
                    >
                      {hud.graphicsMode === 'PERFORMANCE'
                        ? t.graphicsEco
                        : t.graphicsHd}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="min-h-[34px] px-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs cursor-pointer transition"
                      title={t.fullscreenBtn}
                      aria-label={t.fullscreenBtn}
                    >
                      {isFullscreen ? '🗗' : '⛶'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Victory Record Card (on Win) + 11-Stage Selector Grid */}
              <div className="flex flex-col justify-center gap-2.5">
                {/* Victory Summary & Share Card (Only on WIN / ZONE_COMPLETE) */}
                {(gameState === 'WIN' || gameState === 'ZONE_COMPLETE') && (
                  <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/10">
                    <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
                      <div className="p-1.5 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {t.clearTimeLabel}
                        </div>
                        <div className="text-xs font-extrabold text-amber-300 mt-0.5 tabular-nums">
                          {formatSpeedrunTime(hud.elapsedTimeSec)}
                        </div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {hud.isNewRecord ? t.newRecordLabel : t.bestTimeLabel}
                        </div>
                        <div className="text-xs font-extrabold text-emerald-300 mt-0.5 tabular-nums">
                          {formatSpeedrunTime(
                            hud.bestTimeSec ?? hud.elapsedTimeSec
                          )}
                        </div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/5">
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {t.scoreLabel}
                        </div>
                        <div className="text-xs font-extrabold text-white mt-0.5 tabular-nums">
                          {hud.score}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleShareVictory}
                        className="min-h-[34px] py-1.5 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>📤</span>
                        <span>{t.shareBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadVictoryBadgePng}
                        className="min-h-[34px] py-1.5 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>🖼️</span>
                        <span>{t.downloadPngBtn}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowLeaderboard(true)}
                        className="min-h-[34px] py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>🏆</span>
                        <span>{t.leaderboardBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowShareModal(true)}
                        className="min-h-[34px] py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>🚀</span>
                        <span>{t.shareGameBtn}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PILIHAN ZONA (ZONE 1 / ZONE 2 / ZONE 3 SELECTOR) & 11-STAGE GRID */}
                {(() => {
                  const currentStageIdx =
                    gameState === 'START'
                      ? selectedLevelIdx
                      : hud.levelNumber - 1;
                  const activeZoneId: 1 | 2 | 3 =
                    currentStageIdx < 11 ? 1 : currentStageIdx < 22 ? 2 : 3;

                  const zoneDefs = [
                    {
                      id: 1 as const,
                      shortLabel: lang === 'id' ? 'Zona 1' : 'Zone 1',
                      icon: '🧱',
                      title: t.zone1Title,
                      subtitle:
                        lang === 'id'
                          ? 'Bata Merah Klasik & Kastil Raja (Babak 1–11)'
                          : 'Classic Red Brick & Boss Castle (Stages 1–11)',
                      features:
                        lang === 'id'
                          ? '🧱 Bata Klasik · 🔵 Pompa Ukuran · 👑 Boss Babak 11'
                          : '🧱 Classic Brick · 🔵 Size Pumps · 👑 Stage 11 Boss',
                      startIdx: 0,
                      endIdx: 11,
                      rangeText: '1–11',
                      tabActiveClass:
                        'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.45)] font-black',
                      tabIdleClass:
                        'bg-slate-900/85 hover:bg-slate-800/90 text-amber-200/90 border-amber-500/30',
                      cardBorderClass:
                        'border-amber-400/45 bg-gradient-to-br from-amber-950/50 via-slate-900/90 to-slate-950/90',
                      headerTextClass: 'text-amber-300',
                    },
                    {
                      id: 2 as const,
                      shortLabel: lang === 'id' ? 'Zona 2' : 'Zone 2',
                      icon: '🌿',
                      title: t.zone2Title,
                      subtitle: t.zone2Subtitle,
                      features:
                        lang === 'id'
                          ? '🌿 Hutan Tropis · 🐊 Rawa & Satwa · 👑 Boss Babak 22'
                          : '🌿 Lush Jungle · 🐊 Wildlife Valley · 👑 Stage 22 Boss',
                      startIdx: 11,
                      endIdx: 22,
                      rangeText: '12–22',
                      tabActiveClass:
                        'bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 border-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.45)] font-black',
                      tabIdleClass:
                        'bg-slate-900/85 hover:bg-slate-800/90 text-emerald-200/90 border-emerald-500/30',
                      cardBorderClass:
                        'border-emerald-400/50 bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-slate-950/90',
                      headerTextClass: 'text-emerald-300',
                    },
                    {
                      id: 3 as const,
                      shortLabel: lang === 'id' ? 'Zona 3' : 'Zone 3',
                      icon: '❄️',
                      title: t.zone3Title,
                      subtitle: t.zone3Subtitle,
                      features:
                        lang === 'id'
                          ? '❄️ Lantai Es Licin · 🧊 Gletser Runtuh · 🐻‍❄️ Beruang Kutub'
                          : '❄️ Slippery Ice · 🧊 Falling Glaciers · 🐻‍❄️ Polar Bears',
                      startIdx: 22,
                      endIdx: 33,
                      rangeText: '23–33',
                      tabActiveClass:
                        'bg-gradient-to-b from-sky-300 to-cyan-500 text-slate-950 border-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.5)] font-black',
                      tabIdleClass:
                        'bg-slate-900/85 hover:bg-slate-800/90 text-sky-200/90 border-sky-400/35',
                      cardBorderClass:
                        'border-sky-400/55 bg-gradient-to-br from-sky-950/65 via-slate-900/90 to-cyan-950/60',
                      headerTextClass: 'text-sky-300',
                    },
                  ];

                  const activeZone =
                    zoneDefs.find((z) => z.id === activeZoneId) || zoneDefs[0];
                  const zoneStages = BOUNCE_LEVELS.slice(
                    activeZone.startIdx,
                    activeZone.endIdx
                  );

                  const selectStageAndPreview = (idx: number) => {
                    const stageNumber = idx + 1;
                    if (!isStageUnlockedByZoneRules(stageNumber, completedLevels)) {
                      engineRef.current?.showToast(
                        lang === 'id'
                          ? `🔒 Selesaikan Babak ${stageNumber - 1} dulu untuk membuka Babak ${stageNumber}!`
                          : `🔒 Clear Stage ${stageNumber - 1} first to unlock Stage ${stageNumber}!`
                      );
                      return;
                    }
                    setSelectedLevelIdx(idx);
                    if (gameState === 'START') {
                      engineRef.current?.loadLevel(idx);
                    } else {
                      handleStartGame(idx);
                    }
                  };

                  const getZoneStarsEarned = (startIdx: number, endIdx: number) => {
                    let sum = 0;
                    for (let s = startIdx + 1; s <= endIdx; s++) {
                      sum +=
                        stageStars[s] || (completedLevels.includes(s) ? 1 : 0);
                    }
                    return sum;
                  };

                  return (
                    <div className="flex flex-col gap-2">
                      {/* Header Row: PILIH ZONA + Full Stage List Modal Trigger */}
                      <div className="flex items-center justify-between text-xs px-0.5">
                        <span className="font-extrabold text-white tracking-wider uppercase flex items-center gap-1.5">
                          <span>🗺️</span>
                          <span>
                            {lang === 'id'
                              ? 'PILIH ZONA PERMAINAN (1–3)'
                              : 'SELECT GAME ZONE (1–3)'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLevelModal(true)}
                          className="text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer transition text-[11px]"
                        >
                          {t.fullStageListBtn}
                        </button>
                      </div>

                      {/* 3 Interactive Zone Selector Tabs with Star Progress */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {zoneDefs.map((z) => {
                          const isZoneActive = z.id === activeZoneId;
                          const zoneStars = getZoneStarsEarned(
                            z.startIdx,
                            z.endIdx
                          );
                          return (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() => selectStageAndPreview(z.startIdx)}
                              className={`min-h-[48px] px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center active:translate-y-[1px] ${
                                isZoneActive ? z.tabActiveClass : z.tabIdleClass
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] sm:text-xs font-extrabold tracking-tight flex items-center gap-1 truncate">
                                  <span>{z.icon}</span>
                                  <span>{z.shortLabel}</span>
                                </span>
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-bold tabular-nums ${
                                    isZoneActive
                                      ? 'bg-black/20 text-slate-950'
                                      : 'bg-white/10 text-amber-300'
                                  }`}
                                >
                                  ★{zoneStars}/33
                                </span>
                              </div>
                              <div
                                className={`text-[9px] sm:text-[10px] truncate mt-0.5 ${
                                  isZoneActive
                                    ? 'text-slate-900 font-bold'
                                    : 'text-slate-400 font-medium'
                                }`}
                              >
                                {z.id === 1
                                  ? lang === 'id'
                                    ? 'Bata Klasik (1–11)'
                                    : 'Brick (1–11)'
                                  : z.id === 2
                                  ? lang === 'id'
                                    ? 'Hutan (12–22)'
                                    : 'Jungle (12–22)'
                                  : lang === 'id'
                                  ? 'Gletser Es (23–33)'
                                  : 'Glacier (23–33)'}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Zone Card & 11-Stage Selector Grid */}
                      <div
                        className={`rounded-2xl border p-2.5 shadow-lg transition-colors ${activeZone.cardBorderClass}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span>{activeZone.icon}</span>
                              <span
                                className={`text-xs sm:text-sm font-extrabold tracking-wide truncate ${activeZone.headerTextClass}`}
                              >
                                {activeZone.title}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-300 truncate mt-0.5">
                              {activeZone.subtitle}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[10px] font-extrabold text-white whitespace-nowrap tabular-nums">
                            {t.stageWord} {activeZone.rangeText}
                          </span>
                        </div>

                        {/* Physics / Biome Feature Tag Pill */}
                        <div className="mb-2 px-2 py-1 rounded-lg bg-black/35 border border-white/10 text-[10px] font-semibold text-slate-200 truncate">
                          {activeZone.features}
                        </div>

                        {/* 11 Stage Buttons for the Selected Zone */}
                        <div className="grid grid-cols-6 gap-1.5">
                          {zoneStages.map((lvl) => {
                            const idx = lvl.levelNumber - 1;
                            const isSelected = currentStageIdx === idx;
                            const isDone = completedLevels.includes(
                              lvl.levelNumber
                            );
                            const isLocked = !isStageUnlockedByZoneRules(
                              lvl.levelNumber,
                              completedLevels
                            );
                            const isBossStage =
                              lvl.levelNumber === 11 ||
                              lvl.levelNumber === 22 ||
                              lvl.levelNumber === 33;
                            const stars =
                              stageStars[lvl.levelNumber] || (isDone ? 1 : 0);
                            const stageSub =
                              t.stages[lvl.levelNumber]?.subtitle ||
                              lvl.subtitle;

                            const activeTileStyle =
                              activeZoneId === 3
                                ? 'bg-gradient-to-b from-sky-300 to-cyan-500 text-slate-950 font-black ring-2 ring-white border-b-2 border-sky-700 shadow-md cursor-pointer'
                                : activeZoneId === 2
                                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-950 font-black ring-2 ring-amber-300 border-b-2 border-emerald-800 shadow-md cursor-pointer'
                                : 'stage-tile-active text-white ring-2 ring-amber-300 cursor-pointer';

                            const idleTileStyle =
                              activeZoneId === 3
                                ? 'bg-sky-950/85 hover:bg-sky-800/80 border border-sky-400/40 text-sky-100 cursor-pointer'
                                : activeZoneId === 2
                                ? 'bg-emerald-950/85 hover:bg-emerald-800/80 border border-emerald-400/40 text-emerald-100 cursor-pointer'
                                : 'stage-tile-default text-slate-200 hover:brightness-125 cursor-pointer';

                            return (
                              <button
                                key={lvl.levelNumber}
                                type="button"
                                onClick={() => selectStageAndPreview(idx)}
                                title={
                                  isLocked
                                    ? t.toastStageLocked(lvl.levelNumber)
                                    : `${t.stageWord} ${lvl.levelNumber}: ${stageSub}`
                                }
                                className={`min-h-[38px] sm:min-h-[42px] rounded-xl font-display text-xs sm:text-sm transition-transform flex flex-col items-center justify-center leading-none tabular-nums active:translate-y-[2px] ${
                                  isLocked
                                    ? 'bg-slate-900/60 border-b-2 border-slate-950 text-slate-600 cursor-pointer opacity-60'
                                    : isSelected
                                    ? activeTileStyle
                                    : isDone
                                    ? 'stage-tile-done text-emerald-100 hover:brightness-110 cursor-pointer'
                                    : idleTileStyle
                                }`}
                              >
                                <span>
                                  {isLocked
                                    ? '🔒'
                                    : isBossStage
                                    ? `${lvl.levelNumber}👑`
                                    : lvl.levelNumber}
                                </span>
                                {!isLocked && stars > 0 && (
                                  <span className="text-[8px] text-amber-300 tracking-tighter mt-0.5">
                                    {'★'.repeat(stars)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 33-Stage Full List Modal */}
      {showLevelModal && (
        <BlueprintModal
          lang={lang}
          currentLevelNumber={hud.levelNumber}
          unlockedMaxLevel={unlockedMaxLevel}
          completedLevels={completedLevels}
          stageStars={stageStars}
          onSelectLevel={(idx) => handleStartGame(idx)}
          onClose={() => setShowLevelModal(false)}
        />
      )}

      {/* Global Leaderboard Modal */}
      {showLeaderboardModal && (
        <LeaderboardModal
          lang={lang}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {/* Share Game Modal */}
      {showShareModal && (
        <ShareGameModal
          t={t}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Auth / Profile Modal */}
      {showAuthModal && (
        <AuthModal
          t={t}
          player={player}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(p) => setPlayer(p)}
        />
      )}

      {/* Rewarded Video Ad Revive Modal */}
      {showRewardedAd && (
        <RewardedAdModal
          t={t}
          onRewardClaimed={handleClaimRewardedAd}
          onClose={() => setShowRewardedAd(false)}
        />
      )}

      {/* Daily Missions Modal */}
      {showDailyMissionsModal && (
        <DailyMissionsModal
          t={t}
          missions={dailyMissions}
          onClaimReward={(missionId, reward) => {
            const next = dailyMissions.map((m) =>
              m.id === missionId ? { ...m, claimed: true } : m
            );
            setDailyMissions(next);
            saveDailyMissions(next);
            engineRef.current?.showToast(`+${reward} Skor Bonus Misi!`);
          }}
          onTriggerParticleBurst={(x, y, preset) => {
            particleBurstRef.current?.triggerBurst(x, y, preset);
          }}
          onClose={() => setShowDailyMissionsModal(false)}
        />
      )}

      {/* Daily Spin Wheel Modal */}
      {showSpinModal && (
        <DailySpinModal
          t={t}
          canSpin={canSpin}
          onSpinResult={(coins, label) => {
            setCanSpin(false);
            recordSpinToday();
            if (coins > 0) {
              const nextCoins = addPlayerCoins(coins);
              setPlayerCoins(nextCoins);
            }
            engineRef.current?.showToast(`🎁 Hadiah Roda: ${label}`);
          }}
          onClose={() => setShowSpinModal(false)}
        />
      )}

      {/* Shop & 3D Customization Modal */}
      {showShopModal && (
        <ShopModal
          t={t}
          items={shopItems}
          playerCoins={playerCoins}
          equippedSkin={equippedSkin}
          equippedTrail={equippedTrail}
          onBuyItem={(item) => {
            const coinCostMatch = item.priceFormatted.match(/(\d+)\s*Cincin/i);
            if (coinCostMatch) {
              const cost = parseInt(coinCostMatch[1], 10);
              if (playerCoins < cost) {
                engineRef.current?.showToast(
                  lang === 'id'
                    ? `⚠️ Cincin belum cukup! Butuh ${cost} Cincin.`
                    : `⚠️ Not enough rings! Need ${cost} Rings.`
                );
                return;
              }
              const nc = addPlayerCoins(-cost);
              setPlayerCoins(nc);
            }

            const next = shopItems.map((si) =>
              si.id === item.id ||
              (item.id === 'starter_pack' && si.id === 'skin_gold')
                ? { ...si, isPurchased: true }
                : si
            );
            setShopItems(next);
            saveShopItems(next);

            if (item.type === 'starter_pack') {
              const addAmt =
                item.id === 'coin_pack_10000'
                  ? 10000
                  : item.id === 'coin_pack_2500'
                  ? 2500
                  : 500;
              const nc = addPlayerCoins(addAmt);
              setPlayerCoins(nc);
              if (item.id === 'starter_pack') {
                setEquippedSkin('skin_gold');
                setEquippedSkinState('skin_gold');
                engineRef.current?.setBallSkin('skin_gold');
              }
              engineRef.current?.showToast(
                `🎉 Paket Aktif! +${addAmt} Cincin Emas`
              );
            } else if (item.type === 'remove_ads') {
              engineRef.current?.showToast(
                '🚫 Iklan Berhasil Dihapus Selamanya!'
              );
            } else if (item.type === 'ball_skin') {
              const skinId = item.id as BallSkinId;
              setEquippedSkin(skinId);
              setEquippedSkinState(skinId);
              engineRef.current?.setBallSkin(skinId);
              engineRef.current?.showToast(
                `✨ ${BALL_SKIN_META[skinId]?.nameId || item.title} Dipasang!`
              );
            } else if (item.type === 'trail_effect') {
              const trailId = item.id as TrailEffectId;
              setEquippedTrail(trailId);
              setEquippedTrailState(trailId);
              engineRef.current?.setTrailEffect(trailId);
              engineRef.current?.showToast(
                `✨ ${TRAIL_EFFECT_META[trailId]?.nameId || item.title} Dipasang!`
              );
            }
          }}
          onEquipSkin={(skinId) => {
            setEquippedSkin(skinId);
            setEquippedSkinState(skinId);
            engineRef.current?.setBallSkin(skinId);
            engineRef.current?.showToast(
              `🎨 ${BALL_SKIN_META[skinId]?.nameId || 'Skin Bola'} Aktif!`
            );
          }}
          onEquipTrail={(trailId) => {
            setEquippedTrail(trailId);
            setEquippedTrailState(trailId);
            engineRef.current?.setTrailEffect(trailId);
            engineRef.current?.showToast(
              `✨ ${TRAIL_EFFECT_META[trailId]?.nameId || 'Efek Jejak'} Aktif!`
            );
          }}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {/* Achievements / Trophies Modal */}
      {showAchievementsModal && (
        <AchievementsModal
          t={t}
          lang={lang}
          onRefreshCoins={() => setPlayerCoins(getPlayerCoins())}
          onClose={() => setShowAchievementsModal(false)}
        />
      )}

      {/* Daily Login Streak Modal */}
      {showDailyStreakModal && (
        <DailyStreakModal
          isOpen={showDailyStreakModal}
          onClose={() => setShowDailyStreakModal(false)}
          userRings={playerCoins}
          playerUid={player?.uid || 'guest_local'}
          onClaimReward={(rings, keys, day, isChestReward) => {
            const updatedCoins = addPlayerCoins(rings);
            setPlayerCoins(updatedCoins);
            if (!isChestReward) {
              const keyText = keys > 0 ? ` & +${keys} Kunci Peti 🗝️` : '';
              engineRef.current?.showToast(`🎉 Bonus Hari ke-${day}: +${rings} Cincin${keyText}!`);
            }
          }}
          onOpenChestModal={() => {
            setShowChestUnboxingModal(true);
          }}
        />
      )}

      {/* 3D Chest Unboxing Modal */}
      {showChestUnboxingModal && (
        <ChestUnboxingModal
          isOpen={showChestUnboxingModal}
          onClose={() => setShowChestUnboxingModal(false)}
          rewardRings={3000}
          onClaimRewards={(rings) => {
            const updatedCoins = addPlayerCoins(rings);
            setPlayerCoins(updatedCoins);
            engineRef.current?.showToast(`✨ Peti Super Terbuka: +${rings} Cincin Emas!`);
          }}
        />
      )}

      {/* Zone 2 Transition Modal */}
      {showZoneTransition && (
        <ZoneTransitionModal
          t={t}
          onClose={() => {
            setShowZoneTransition(false);
            handleStartGame(11);
          }}
        />
      )}

      {/* Fase 1: Settings Modal (Audio, SFX, Sensitivity) */}
      <SettingsModal
        isOpen={showSettingsModal}
        lang={lang}
        muted={muted}
        bgmVolume={bgmVolume}
        sfxVolume={sfxVolume}
        controlSensitivity={controlSensitivity}
        hapticsOn={hapticsOn}
        graphicsMode={hud.graphicsMode}
        onChangeBgmVolume={(v) => {
          setBgmVolume(v);
          soundFX.setBgmVolume(v);
        }}
        onChangeSfxVolume={(v) => {
          setSfxVolume(v);
          soundFX.setSfxVolume(v);
        }}
        onChangeSensitivity={(mult) => {
          setControlSensitivity(mult);
          engineRef.current?.setControlSensitivity(mult);
        }}
        onToggleMute={handleToggleMute}
        onToggleHaptics={handleToggleHaptics}
        onToggleGraphics={handleToggleGraphics}
        onToggleLanguage={handleToggleLanguage}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Fase 4: Gold Victory Toast / Star Rating Screen */}
      <GoldVictoryToast
        isOpen={gameState === 'WIN'}
        levelNumber={hud.levelNumber}
        score={hud.score}
        clearTime={hud.elapsedTimeSec}
        bestTime={engineRef.current ? engineRef.current.getBestTime(hud.levelNumber) : null}
        isNewRecord={engineRef.current ? engineRef.current.getIsNewRecord() : false}
        earnedStars={lastEarnedStars}
        collectedRings={hud.collectedRings}
        totalRings={hud.totalRings}
        lang={lang}
        onNext={handleNextLevel}
        onReplay={handleRestartCurrentStage}
        onMenu={handleReturnToMainMenu}
      />

      {/* Fase 5: Grand Finale Ending Cutscene & Champion Modal (Stage 33) */}
      <GrandFinaleEndingModal
        isOpen={showGrandFinaleModal || gameState === 'ZONE_COMPLETE'}
        lang={lang}
        t={t}
        totalScore={hud.score}
        highScore={hud.highScore}
        stageStars={stageStars}
        completedLevels={completedLevels}
        onDownloadCertificate={handleDownloadVictoryBadgePng}
        onShareVictory={handleShareVictory}
        onPlayFromStart={() => {
          setShowGrandFinaleModal(false);
          handleStartGame(0);
        }}
        onCloseToMenu={() => {
          setShowGrandFinaleModal(false);
          handleReturnToMainMenu();
        }}
      />

      {/* Fase 1: 3D Splash & Asset Loading Screen */}
      {showSplash && (
        <SplashScreen3D
          lang={lang}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Screen-Space Juicy Particle Burst Canvas Overlay */}
      <JuiceParticleBurst ref={particleBurstRef} />
    </div>
  );
}
