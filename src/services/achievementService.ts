export interface Achievement {
  id: string;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  icon: string;
  target: number;
  rewardCoins: number;
  category: 'win' | 'rings' | 'spin' | 'mission' | 'speed' | 'glacier' | 'star' | 'box' | 'tournament';
}

export interface AchievementState {
  id: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

const ACHIEVEMENTS_DEF: Achievement[] = [
  {
    id: 'first_win',
    titleId: 'Juara Pemula',
    titleEn: 'Rookie Champion',
    descId: 'Selesaikan stage pertama Anda di Bounce 3D.',
    descEn: 'Complete your first stage in Bounce 3D.',
    icon: '🏆',
    target: 1,
    rewardCoins: 50,
    category: 'win',
  },
  {
    id: 'ring_collector_50',
    titleId: 'Kolektor Cincin',
    titleEn: 'Ring Collector',
    descId: 'Kumpulkan total 50 cincin emas di semua petualangan.',
    descEn: 'Collect a total of 50 gold rings across all adventures.',
    icon: '💍',
    target: 50,
    rewardCoins: 100,
    category: 'rings',
  },
  {
    id: 'spin_master',
    titleId: 'Ahli Roda Harian',
    titleEn: 'Spin Master',
    descId: 'Putar Roda Keberuntungan Harian sebanyak 3 kali.',
    descEn: 'Spin the Daily Luck Wheel 3 times.',
    icon: '🎡',
    target: 3,
    rewardCoins: 75,
    category: 'spin',
  },
  {
    id: 'mission_master',
    titleId: 'Pahlawan Misi',
    titleEn: 'Mission Hero',
    descId: 'Selesaikan 5 misi harian secara total.',
    descEn: 'Complete 5 daily missions in total.',
    icon: '🎯',
    target: 5,
    rewardCoins: 150,
    category: 'mission',
  },
  {
    id: 'speed_runner',
    titleId: 'Kilat Petir',
    titleEn: 'Lightning Runner',
    descId: 'Selesaikan stage dengan catatan waktu di bawah 30 detik.',
    descEn: 'Clear any stage with a time under 30 seconds.',
    icon: '⚡',
    target: 1,
    rewardCoins: 100,
    category: 'speed',
  },
  {
    id: 'glacier_conqueror',
    titleId: 'Penakluk Gletser',
    titleEn: 'Glacier Conqueror',
    descId: 'Selesaikan salah satu babak di Zona 3 (Es Kutub).',
    descEn: 'Clear any stage in Zone 3 (Polar Glacier).',
    icon: '❄️',
    target: 1,
    rewardCoins: 200,
    category: 'glacier',
  },
  {
    id: 'star_power_master',
    titleId: 'Bintang Kebal',
    titleEn: 'Star Invincible',
    descId: 'Aktifkan Kekuatan Kebal Bintang Mario sebanyak 3 kali.',
    descEn: 'Activate Mario Star Invincibility 3 times.',
    icon: '⭐',
    target: 3,
    rewardCoins: 250,
    category: 'star',
  },
  {
    id: 'mystery_box_hunter',
    titleId: 'Pemburu Kotak Misteri',
    titleEn: 'Mystery Box Hunter',
    descId: 'Temukan dan buka 5 Kotak Misteri rahasia.',
    descEn: 'Find and open 5 secret Mystery Boxes.',
    icon: '🎁',
    target: 5,
    rewardCoins: 300,
    category: 'box',
  },
  {
    id: 'tournament_gladiator',
    titleId: 'Gladiator Turnamen',
    titleEn: 'Tournament Gladiator',
    descId: 'Ikuti dan catatkan skor di Turnamen Harian.',
    descEn: 'Participate and post a score in the Daily Tournament.',
    icon: '🛡️',
    target: 1,
    rewardCoins: 400,
    category: 'tournament',
  },
];

const STORAGE_ACHIEVEMENT_STATE = 'bounce_achievement_states_v2';
const STORAGE_STATS_KEY = 'bounce_player_stats_v2';

export interface PlayerStats {
  wins: number;
  totalRingsCollected: number;
  spinsCount: number;
  missionsCompleted: number;
  fastestTimeSec: number;
  glacierClears: number;
  starPowerActivations: number;
  mysteryBoxesOpened: number;
  tournamentsJoined: number;
}

export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    wins: 0,
    totalRingsCollected: 0,
    spinsCount: 0,
    missionsCompleted: 0,
    fastestTimeSec: 999,
    glacierClears: 0,
    starPowerActivations: 0,
    mysteryBoxesOpened: 0,
    tournamentsJoined: 0,
  };
}

export function updatePlayerStats(updates: Partial<PlayerStats>): PlayerStats {
  const current = getPlayerStats();
  const next = {
    ...current,
    ...updates,
    fastestTimeSec: updates.fastestTimeSec !== undefined
      ? Math.min(current.fastestTimeSec, updates.fastestTimeSec)
      : current.fastestTimeSec,
  };
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getAchievements(): { achievement: Achievement; state: AchievementState }[] {
  const stats = getPlayerStats();
  let statesMap: Record<string, AchievementState> = {};
  try {
    const raw = localStorage.getItem(STORAGE_ACHIEVEMENT_STATE);
    if (raw) {
      statesMap = JSON.parse(raw);
    }
  } catch {}

  return ACHIEVEMENTS_DEF.map((ach) => {
    let progress = 0;
    if (ach.category === 'win') progress = stats.wins;
    else if (ach.category === 'rings') progress = stats.totalRingsCollected;
    else if (ach.category === 'spin') progress = stats.spinsCount;
    else if (ach.category === 'mission') progress = stats.missionsCompleted;
    else if (ach.category === 'speed') progress = stats.fastestTimeSec <= 30 ? 1 : 0;
    else if (ach.category === 'glacier') progress = stats.glacierClears;
    else if (ach.category === 'star') progress = stats.starPowerActivations;
    else if (ach.category === 'box') progress = stats.mysteryBoxesOpened;
    else if (ach.category === 'tournament') progress = stats.tournamentsJoined;

    const isCompleted = progress >= ach.target;
    const existing = statesMap[ach.id];

    const state: AchievementState = {
      id: ach.id,
      progress: Math.min(progress, ach.target),
      isCompleted,
      isClaimed: existing ? existing.isClaimed : false,
    };

    return { achievement: ach, state };
  });
}

export function claimAchievementReward(id: string): number {
  const list = getAchievements();
  const found = list.find((item) => item.achievement.id === id);
  if (!found || !found.state.isCompleted || found.state.isClaimed) {
    return 0;
  }

  let statesMap: Record<string, AchievementState> = {};
  try {
    const raw = localStorage.getItem(STORAGE_ACHIEVEMENT_STATE);
    if (raw) statesMap = JSON.parse(raw);
  } catch {}

  statesMap[id] = {
    id,
    progress: found.state.progress,
    isCompleted: true,
    isClaimed: true,
  };

  try {
    localStorage.setItem(STORAGE_ACHIEVEMENT_STATE, JSON.stringify(statesMap));
  } catch {}

  return found.achievement.rewardCoins;
}
