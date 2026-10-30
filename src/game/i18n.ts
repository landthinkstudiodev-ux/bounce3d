export type GameLang = 'id' | 'en';

const STORAGE_LANG_KEY = 'bounce_national_lang_v2';

/**
 * Automatically detects the user's national language based on:
 * 1. Saved preference in localStorage ('bounce_lang')
 * 2. Browser/OS locale (navigator.languages / navigator.language)
 * 3. National timezone (Asia/Jakarta, Asia/Makassar, Asia/Jayapura, Asia/Pontianak -> 'id')
 */
export function detectNationalLanguage(): GameLang {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'id' || saved === 'en') {
      return saved;
    }

    const langs =
      typeof navigator !== 'undefined'
        ? navigator.languages || [navigator.language]
        : [];
    for (const l of langs) {
      const lower = (l || '').toLowerCase();
      if (lower.startsWith('id') || lower.startsWith('ms') || lower.includes('-id')) {
        return 'id';
      }
    }

    const tz =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        : '';
    if (
      tz === 'Asia/Jakarta' ||
      tz === 'Asia/Pontianak' ||
      tz === 'Asia/Makassar' ||
      tz === 'Asia/Jayapura'
    ) {
      return 'id';
    }
  } catch {
    // ignore environment detection errors
  }

  // Default to Bahasa Indonesia ('id') as primary national language
  return 'id';
}

export function setSavedLanguage(lang: GameLang): void {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  } catch {
    // ignore storage errors
  }
}

export interface StageTranslation {
  title: string;
  subtitle: string;
}

export interface I18nStrings {
  langCode: GameLang;
  langBadge: string;
  // Titles
  titleStart: string;
  titlePaused: string;
  titleStageClear: (n: number) => string;
  titleAllClear: string;
  titleGameOver: string;
  classicArcadeBadge: string;
  // HUD
  stageWord: string;
  ringWord: string;
  ballBig: string;
  ballSmall: string;
  hintBtn: string;
  pauseTitle: string;
  // Menu & Buttons
  selectStageHeader: string;
  fullStageListBtn: string;
  openedOfTotal: (open: number, total: number) => string;
  playStageBtn: (n: number) => string;
  playAgainBtn: string;
  retryStageBtn: (n: number) => string;
  nextStageBtn: (n: number) => string;
  resumeBtn: string;
  restartShortBtn: string;
  mainMenuBtn: string;
  reviveBtn: string;
  lockedBtn: string;
  playShortBtn: string;
  // Victory Card & Share
  clearTimeLabel: string;
  bestTimeLabel: string;
  newRecordLabel: string;
  scoreLabel: string;
  shareBtn: string;
  downloadPngBtn: string;
  highScoreLabel: string;
  soundOn: string;
  soundOff: string;
  hapticOn: string;
  hapticOff: string;
  graphicsEco: string;
  graphicsHd: string;
  fullscreenBtn: string;
  // Share & Badge Texts
  shareTitle: (n: number) => string;
  shareBody: (
    n: number,
    title: string,
    timeStr: string,
    bestStr: string,
    score: number,
    rings: number,
    totalRings: number
  ) => string;
  badgeChampionship: string;
  badgeStageVictory: (n: number) => string;
  badgeMetricClearTime: string;
  badgeMetricBestTime: (isNew: boolean) => string;
  badgeMetricTotalScore: string;
  badgeMetricGoldHoops: string;
  // Toasts
  toastStageLocked: (n: number) => string;
  toastShared: string;
  toastCopied: string;
  toastReadyShare: string;
  toastBadgeDownloaded: string;
  toastGraphicsEco: string;
  toastGraphicsHd: string;
  toastInflateBig: string;
  toastDeflateSmall: string;
  toastExtraLife: string;
  toastCheckpoint: string;
  toastExitOpened: string;
  toastBallPopped: string;
  toastRespawned: string;
  toastRevived: string;
  toastHintOn: string;
  toastHintOff: string;
  // Contextual Hints (3-5 words)
  hintFinishRight: (dist: number) => string;
  hintMissedRingLeft: (dist: number) => string;
  hintDeflateAtPump: string;
  hintEnterNarrowGap: string;
  hintDeflateAndDive: string;
  hintDiveForRing: string;
  hintJumpOnWater: string;
  hintInflateAtPump: string;
  hintBounceBlueRubber: string;
  hintAvoidMovingJack: string;
  hintNearestRing: (dist: number, dir: 'up' | 'down' | 'right' | 'left') => string;
  hintCollectAllRings: (total: number) => string;
  stageObjective: (rings: number) => string;
  // Zone 1, 2 & 3
  zone1Title: string;
  zone2Title: string;
  zone2Subtitle: string;
  zone2Badge: string;
  zone2PreviewBtn: string;
  zone3Title: string;
  zone3Subtitle: string;
  playBtn: string; // Add this
  // Leaderboard
  leaderboardBtn: string;
  leaderboardTitle: string;
  leaderboardTabScores: string;
  leaderboardTabSpeedrun: string;
  leaderboardRank: string;
  leaderboardPlayer: string;
  leaderboardScore: string;
  leaderboardTime: string;
  leaderboardEmpty: string;
  leaderboardYourRank: string;
  // Auth
  loginWithGoogle: string;
  playAsGuest: string;
  guestUser: string;
  signOut: string;
  accountTitle: string;
  // Share
  shareGameBtn: string;
  shareGameTitle: string;
  shareGameDesc: string;
  copyLink: string;
  shareNative: string;
  shareSuccess: string;
  // Rewarded Ad (Revive with +1 Life, 3x max)
  watchAdReviveBtn: (remaining: number) => string;
  adRevivesExhausted: string;
  adRewardClaimed: string;
  adModalTitle: string;
  adModalDesc: string;
  adSkipBtn: string;
  adPlaying: string;
  // Daily Missions
  dailyMissionsTitle: string;
  dailyMissionsSubtitle: string;
  missionCollectRingsDesc: (target: number) => string;
  missionClearStagesDesc: (target: number) => string;
  missionSpeedRunDesc: string;
  // 11 Stage Titles & Subtitles
  stages: Record<number, StageTranslation>;
}

export const TRANSLATIONS: Record<GameLang, I18nStrings> = {
  id: {
    langCode: 'id',
    langBadge: '🇮🇩 ID',
    titleStart: 'BOUNCE',
    titlePaused: 'JEDA PERMAINAN',
    titleStageClear: (n) => `BABAK ${n} SELESAI!`,
    titleAllClear: 'JUARA 11 BABAK!',
    titleGameOver: 'PERMAINAN BERAKHIR',
    classicArcadeBadge: 'Arkade Klasik',
    stageWord: 'Babak',
    ringWord: 'Cincin',
    ballBig: 'Besar',
    ballSmall: 'Kecil',
    hintBtn: 'Petunjuk',
    pauseTitle: 'Jeda Permainan (P / Esc)',
    selectStageHeader: 'Pilih Zona & Babak (1–33)',
    fullStageListBtn: 'Daftar Lengkap ▸',
    openedOfTotal: (open, total) => `Terbuka ${open} dari ${total} Babak`,
    playStageBtn: (n) => `Mainkan Babak ${n}`,
    playAgainBtn: 'Main Lagi dari Babak 1',
    retryStageBtn: (n) => `Ulangi Babak ${n}`,
    nextStageBtn: (n) => `Lanjut ke Babak ${n}`,
    resumeBtn: 'Lanjutkan Permainan',
    restartShortBtn: 'Ulangi Babak',
    mainMenuBtn: 'Menu Utama',
    reviveBtn: 'Bangkit di Titik Simpan (+1 Bola)',
    lockedBtn: 'Terkunci',
    playShortBtn: 'Main',
    clearTimeLabel: 'Waktu',
    bestTimeLabel: 'Terbaik',
    newRecordLabel: 'Rekor Baru!',
    scoreLabel: 'Skor',
    shareBtn: 'Bagikan',
    downloadPngBtn: 'Unduh PNG',
    highScoreLabel: 'Skor Tertinggi',
    soundOn: 'Suara',
    soundOff: 'Bisu',
    hapticOn: 'Getar',
    hapticOff: 'Mati',
    graphicsEco: '60FPS',
    graphicsHd: 'HD',
    fullscreenBtn: 'Layar Penuh',
    shareTitle: (n) => `Bounce Rolling: Petualangan 3D — Babak ${n} Selesai!`,
    shareBody: (n, title, timeStr, bestStr, score, rings, totalRings) =>
      `🔴 Aku baru saja menamatkan Babak ${n}/11 (${title}) di Bounce Rolling: Petualangan 3D!\n⏱️ Waktu: ${timeStr} (Rekor: ${bestStr})\n🏆 Skor: ${score} · Cincin: ${rings}/${totalRings}`,
    badgeChampionship: 'SERTIFIKAT RESMI JUARA 11 BABAK',
    badgeStageVictory: (n) => `SERTIFIKAT RESMI LULUS BABAK ${n}`,
    badgeMetricClearTime: 'WAKTU SELESAI',
    badgeMetricBestTime: (isNew) =>
      isNew ? 'WAKTU TERBAIK (REKOR!)' : 'WAKTU TERBAIK',
    badgeMetricTotalScore: 'TOTAL SKOR',
    badgeMetricGoldHoops: 'CINCIN EMAS',
    toastStageLocked: (n) => `Babak ${n} Terkunci`,
    toastShared: 'REKOR DIBAGIKAN!',
    toastCopied: 'DISALIN KE PAPAN KLIP!',
    toastReadyShare: 'SIAP DIBAGIKAN!',
    toastBadgeDownloaded: 'SERTIFIKAT PNG DIUNDUH!',
    toastGraphicsEco: 'MODE HEMAT 60FPS',
    toastGraphicsHd: 'MODE GRAFIS HD',
    toastInflateBig: 'POMPA: BOLA BESAR (APUNG)',
    toastDeflateSmall: 'POMPA: BOLA KECIL',
    toastExtraLife: 'KRISTAL NYAWA! +1 BOLA',
    toastCheckpoint: 'TITIK SIMPAN AKTIF!',
    toastExitOpened: 'GERBANG AKHIR TERBUKA!',
    toastBallPopped: 'BOLA PECAH!',
    toastRespawned: 'KEMBALI KE TITIK SIMPAN',
    toastRevived: 'BANGKIT DI TITIK SIMPAN!',
    toastHintOn: 'PETUNJUK AKTIF',
    toastHintOff: 'PETUNJUK NONAKTIF',
    hintFinishRight: (dist) => `🏁 Garis Akhir: ${dist}m Kanan`,
    hintMissedRingLeft: (dist) => `⚠️ Cincin Terlewat (${dist}m Kiri)`,
    hintDeflateAtPump: '🔵 Kecilkan Bola di Pompa',
    hintEnterNarrowGap: '➡️ Masuk Celah Sempit',
    hintDeflateAndDive: '🔵 Kecilkan Bola & Selam',
    hintDiveForRing: '⬇️ Selam Ambil Cincin',
    hintJumpOnWater: '⬆️ Lompat di Atas Air',
    hintInflateAtPump: '🔴 Besarkan Bola di Pompa',
    hintBounceBlueRubber: '⬆️ Pantul di Karet Biru',
    hintAvoidMovingJack: '⚠️ Hindari Bintang Duri',
    hintNearestRing: (dist, dir) => {
      const dirMap = {
        up: 'Atas',
        down: 'Bawah',
        right: 'Kanan',
        left: 'Kiri',
      };
      return `🎯 Cincin: ${dist}m ${dirMap[dir]}`;
    },
    hintCollectAllRings: (total) => `🎯 Kumpulkan ${total} Cincin`,
    stageObjective: (rings) => `Kumpulkan ${rings} Cincin & Capai Gerbang Akhir`,
    zone1Title: 'ZONA 1: BATA KLASIK',
    zone2Title: 'ZONA 2: HUTAN & SATWA',
    zone2Subtitle: '11 Babak Rimba Hijau & Lembah Satwa (Babak 12–22)',
    zone2Badge: 'ZONA BARU',
    zone2PreviewBtn: 'Jelajahi Zona 2',
    zone3Title: 'ZONA 3: ES & GLETSER',
    zone3Subtitle: '11 Babak Es Licin, Gletser Runtuh & Beruang Kutub (Babak 23–33)',
    playBtn: 'Mainkan Zona 2 Sekarang!',
    leaderboardBtn: 'Papan Peringkat',
    leaderboardTitle: 'PAPAN PERINGKAT GLOBAL',
    leaderboardTabScores: 'Skor Tertinggi',
    leaderboardTabSpeedrun: 'Rekor Waktu Babak',
    leaderboardRank: 'Peringkat',
    leaderboardPlayer: 'Pemain',
    leaderboardScore: 'Skor',
    leaderboardTime: 'Waktu',
    leaderboardEmpty: 'Belum ada catatan skor di zona ini. Jadilah yang pertama mencetak rekor!',
    leaderboardYourRank: 'Peringkat Kamu',
    loginWithGoogle: 'Masuk dengan Akun Google',
    playAsGuest: 'Lanjut sebagai Tamu',
    guestUser: 'Tamu',
    signOut: 'Keluar',
    accountTitle: 'Profil Pemain',
    shareGameBtn: 'Bagikan Game',
    shareGameTitle: 'Ajak Teman Main Bounce 3D!',
    shareGameDesc: 'Bernostalgia main game bola merah legendaris dengan grafik 3D modern! Tembus 11 babak & puncaki leaderboard!',
    copyLink: 'Salin Tautan Game',
    shareNative: 'Bagikan Sekarang',
    shareSuccess: 'Tautan game berhasil disalin!',
    watchAdReviveBtn: (rem: number) => `📺 Tonton Iklan (+1 Bola · Sisa: ${rem}/3)`,
    adRevivesExhausted: 'Batas Iklan Habis (0/3)',
    adRewardClaimed: 'IKLAN SELESAI! +1 BOLA TAMBAHAN',
    adModalTitle: 'Tonton Iklan (+1 Bola Tambahan)',
    adModalDesc: 'Saksikan video singkat selama 5 detik untuk bangkit dan melanjutkan permainan!',
    adSkipBtn: 'Klaim Bola (+1)',
    adPlaying: 'Iklan Berlangsung',
    dailyMissionsTitle: 'Misi Harian',
    dailyMissionsSubtitle: 'Selesaikan misi hari ini & kumpulkan bonus skor!',
    missionCollectRingsDesc: (target) => `Kumpulkan ${target} Cincin Emas`,
    missionClearStagesDesc: (target) => `Tamatkan ${target} Babak Permainan`,
    missionSpeedRunDesc: 'Selesaikan babak dalam waktu < 45 detik',
    stages: {
      1: {
        title: 'BABAK 1: PEMANASAN BATA MERAH',
        subtitle: 'Pemanasan Bata Merah, Cincin & Kolam Apung',
      },
      2: {
        title: 'BABAK 2: JARUM & BINTANG DURI',
        subtitle: 'Pengenalan Bintang Duri Bergerak & Kolam Kembar',
      },
      3: {
        title: 'BABAK 3: LORONG BATA SEMPIT',
        subtitle: 'Lorong Sempit Beruntun & Bintang Duri Vertikal',
      },
      4: {
        title: 'BABAK 4: RUANG PANTUL TINGGI',
        subtitle: 'Lantai Karet Biru & Menara Cincin Tinggi',
      },
      5: {
        title: 'BABAK 5: SALURAN AIR DALAM',
        subtitle: 'Teka-Teki Apung vs Selam Dasar Air',
      },
      6: {
        title: 'BABAK 6: LINTASAN BINTANG KEMBAR',
        subtitle: 'Patroli Ganda Bintang Duri & Tanjakan Curam',
      },
      7: {
        title: 'BABAK 7: JEMBATAN BATA BERGERAK',
        subtitle: 'Jembatan Bata Bergerak di Atas Jurang',
      },
      8: {
        title: 'BABAK 8: LABIRIN JARUM & DURI',
        subtitle: 'Labirin Jarum Bergerak & Pompa Beruntun',
      },
      9: {
        title: 'BABAK 9: PENDAKIAN TIGA MENARA',
        subtitle: 'Tiga Menara Pantul & Kolam Berantai',
      },
      10: {
        title: 'BABAK 10: BENTENG BATA MERAH',
        subtitle: 'Benteng Bata Merah & Patroli Bintang Duri',
      },
      11: {
        title: 'BABAK 11: UJIAN PUNCAK TERAKHIR',
        subtitle: 'Ujian Puncak Babak 11 Petualangan Klasik',
      },
      12: {
        title: 'BABAK 12: GARDA PINTU RIMBA',
        subtitle: 'Padang Rumput Rimba & Jembatan Kayu Apung',
      },
      13: {
        title: 'BABAK 13: LEMBAH BURUNG & BINTANG DURI',
        subtitle: 'Pilar Rumput Tinggi & Patroli Bintang Duri',
      },
      14: {
        title: 'BABAK 14: DANAU RIMBA & RAWA BUAYA',
        subtitle: 'Kolam Air Hutan Dalam & Teka-Teki Cincin Dasar',
      },
      15: {
        title: 'BABAK 15: JEMBATAN KAYU HUTAN TROPIS',
        subtitle: 'Jembatan Kayu Bergerak di Atas Jurang Rimba',
      },
      16: {
        title: 'BABAK 16: SARANG LEBAH & KARET HIJAU',
        subtitle: 'Blok Karet Rumput & Menara Cincin Tinggi',
      },
      17: {
        title: 'BABAK 17: LABIRIN DURI HUTAN LIAR',
        subtitle: 'Duri Atap Pohon & Lorong Batang Kayu Sempit',
      },
      18: {
        title: 'BABAK 18: SUNGAI DERAS & POMPA RIMBA',
        subtitle: 'Kolam Berantai & Tukar Ukuran Bola Cepat',
      },
      19: {
        title: 'BABAK 19: TIGA MENARA POHON RAKSASA',
        subtitle: 'Menara Pohon Raksasa & Perisai Pelindung',
      },
      20: {
        title: 'BABAK 20: BENTENG SATWA RIMBA',
        subtitle: 'Benteng Rimba & Patroli Bintang Duri Ganda',
      },
      21: {
        title: 'BABAK 21: LEMBAH HALILINTAR HUTAN',
        subtitle: 'Platform Kecepatan Tinggi & Dorongan Kilat',
      },
      22: {
        title: 'BABAK 22: PUNCAK RIMBA — GRAND FINALE',
        subtitle: 'Ujian Puncak Akhir Zona 2 Rimba & Satwa',
      },
      23: {
        title: 'BABAK 23: GERBANG GLETSER & BOLA SALJU',
        subtitle: 'Es Kristal Licin, Lereng Gunung & Bola Salju Menggelinding',
      },
      24: {
        title: 'BABAK 24: JURANG BEKU & STALAKTIT ES',
        subtitle: 'Tebing Gunung Es, Stalaktit Langit & Bola Salju',
      },
      25: {
        title: 'BABAK 25: PUNGGUNG GUNUNG BOLA SALJU',
        subtitle: 'Puncak Gunung Ganda & Patroli Bola Salju Cepat',
      },
      26: {
        title: 'BABAK 26: LERENG GUNUNG ES NAIK-TURUN',
        subtitle: 'Tiga Puncak Gunung Gletser & Luncuran Kecepatan Tinggi',
      },
      27: {
        title: 'BABAK 27: SALURAN AIR GUA GLETSER',
        subtitle: 'Danau Es Beku, Bukit Gletser & Bola Salju',
      },
      28: {
        title: 'BABAK 28: LABIRIN TEROWONGAN ES LICIN',
        subtitle: 'Lorong Es Sempit di Puncak Gunung & Bola Salju',
      },
      29: {
        title: 'BABAK 29: MENARA PANTUL SALJU ABADI',
        subtitle: 'Pantulan Menara Es, Gunung Curam & Bola Salju',
      },
      30: {
        title: 'BABAK 30: BADAI SALJU & JEMBATAN GLETSER',
        subtitle: 'Jembatan Es Bergerak, Bola Salju Raksasa & Duri Es',
      },
      31: {
        title: 'BABAK 31: BENTENG PUNCAK GLETSER',
        subtitle: 'Benteng Es Berlapis, Gunung Curam & Bola Salju Raksasa',
      },
      32: {
        title: 'BABAK 32: LONGSORAN BOLA SALJU RAKSASA',
        subtitle: 'Gunung Es Curam & Longsoran Bola Salju Beruntun',
      },
      33: {
        title: 'BABAK 33: SINGGASANA RAJA GLETSER ABADI',
        subtitle: 'Level Raja Puncak (18 Cincin): Gunung Es, Bola Salju Raksasa & Raja Es',
      },
    },
  },
  en: {
    langCode: 'en',
    langBadge: '🌐 EN',
    titleStart: 'BOUNCE',
    titlePaused: 'GAME PAUSED',
    titleStageClear: (n) => `STAGE ${n} CLEAR!`,
    titleAllClear: '11-STAGE CHAMPION!',
    titleGameOver: 'GAME OVER',
    classicArcadeBadge: 'Classic Arcade',
    stageWord: 'Stage',
    ringWord: 'Rings',
    ballBig: 'Big',
    ballSmall: 'Small',
    hintBtn: 'Hint',
    pauseTitle: 'Pause Game (P / Esc)',
    selectStageHeader: 'Select Zone & Stage (1–33)',
    fullStageListBtn: 'Full List ▸',
    openedOfTotal: (open, total) => `Unlocked ${open} of ${total} Stages`,
    playStageBtn: (n) => `Play Stage ${n}`,
    playAgainBtn: 'Play Again from Stage 1',
    retryStageBtn: (n) => `Retry Stage ${n}`,
    nextStageBtn: (n) => `Next: Stage ${n}`,
    resumeBtn: 'Resume Game',
    restartShortBtn: 'Restart Stage',
    mainMenuBtn: 'Main Menu',
    reviveBtn: 'Revive at Checkpoint (+1 Ball)',
    lockedBtn: 'Locked',
    playShortBtn: 'Play',
    clearTimeLabel: 'Time',
    bestTimeLabel: 'Best',
    newRecordLabel: 'New Record!',
    scoreLabel: 'Score',
    shareBtn: 'Share',
    downloadPngBtn: 'Badge PNG',
    highScoreLabel: 'Best Score',
    soundOn: 'Sound',
    soundOff: 'Muted',
    hapticOn: 'Haptic',
    hapticOff: 'Off',
    graphicsEco: '60FPS',
    graphicsHd: 'HD',
    fullscreenBtn: 'Fullscreen',
    shareTitle: (n) => `Bounce Rolling: 3D Adventure — Stage ${n} Clear!`,
    shareBody: (n, title, timeStr, bestStr, score, rings, totalRings) =>
      `🔴 I just cleared Stage ${n}/11 (${title}) in Bounce Rolling: 3D Adventure!\n⏱️ Time: ${timeStr} (Best: ${bestStr})\n🏆 Score: ${score} · Rings: ${rings}/${totalRings}`,
    badgeChampionship: 'OFFICIAL 11-STAGE CHAMPIONSHIP BADGE',
    badgeStageVictory: (n) => `OFFICIAL STAGE ${n} VICTORY BADGE`,
    badgeMetricClearTime: 'CLEAR TIME',
    badgeMetricBestTime: (isNew) =>
      isNew ? 'BEST TIME (NEW RECORD!)' : 'BEST TIME',
    badgeMetricTotalScore: 'TOTAL SCORE',
    badgeMetricGoldHoops: 'GOLD HOOPS',
    toastStageLocked: (n) => `Stage ${n} Locked`,
    toastShared: 'RECORD SHARED!',
    toastCopied: 'COPIED TO CLIPBOARD!',
    toastReadyShare: 'READY TO SHARE!',
    toastBadgeDownloaded: 'BADGE PNG DOWNLOADED!',
    toastGraphicsEco: '60FPS ECO MODE',
    toastGraphicsHd: 'HD GRAPHICS MODE',
    toastInflateBig: 'INFLATOR: BIG BALL (FLOATS)',
    toastDeflateSmall: 'DEFLATOR: SMALL BALL',
    toastExtraLife: 'EXTRA LIFE! +1 BALL',
    toastCheckpoint: 'CHECKPOINT SAVED!',
    toastExitOpened: 'EXIT PORTAL OPENED!',
    toastBallPopped: 'BALL POPPED!',
    toastRespawned: 'RESPAWNED AT CHECKPOINT',
    toastRevived: 'REVIVED AT CHECKPOINT!',
    toastHintOn: 'HINT ON',
    toastHintOff: 'HINT OFF',
    hintFinishRight: (dist) => `🏁 Finish: ${dist}m Right`,
    hintMissedRingLeft: (dist) => `⚠️ Missed Ring (${dist}m Left)`,
    hintDeflateAtPump: '🔵 Deflate Ball at Pump',
    hintEnterNarrowGap: '➡️ Roll Through Narrow Gap',
    hintDeflateAndDive: '🔵 Deflate Ball & Dive',
    hintDiveForRing: '⬇️ Dive for Underwater Ring',
    hintJumpOnWater: '⬆️ Jump Across Water',
    hintInflateAtPump: '🔴 Inflate Ball at Pump',
    hintBounceBlueRubber: '⬆️ Bounce on Blue Rubber',
    hintAvoidMovingJack: '⚠️ Dodge Moving Jack',
    hintNearestRing: (dist, dir) => {
      const dirMap = {
        up: 'Up',
        down: 'Down',
        right: 'Right',
        left: 'Left',
      };
      return `🎯 Ring: ${dist}m ${dirMap[dir]}`;
    },
    hintCollectAllRings: (total) => `🎯 Collect ${total} Rings`,
    stageObjective: (rings) => `Collect ${rings} Rings & Reach Exit Portal`,
    zone1Title: 'ZONE 1: CLASSIC BRICK',
    zone2Title: 'ZONE 2: FOREST & WILDLIFE',
    zone2Subtitle: '11 Lush Jungle & Wildlife Valley Stages (Stages 12–22)',
    zone2Badge: 'NEW ZONE',
    zone2PreviewBtn: 'Explore Zone 2',
    zone3Title: 'ZONE 3: ICE & GLACIER',
    zone3Subtitle: '11 Slippery Ice Physics, Falling Glaciers & Polar Bears (Stages 23–33)',
    playBtn: 'Play Zone 2 Now!',
    leaderboardBtn: 'Leaderboard',
    leaderboardTitle: 'GLOBAL LEADERBOARD',
    leaderboardTabScores: 'Top Scores',
    leaderboardTabSpeedrun: 'Speedrun Times',
    leaderboardRank: 'Rank',
    leaderboardPlayer: 'Player',
    leaderboardScore: 'Score',
    leaderboardTime: 'Time',
    leaderboardEmpty: 'No records in this zone yet. Be the first to set a record!',
    leaderboardYourRank: 'Your Rank',
    loginWithGoogle: 'Sign in with Google',
    playAsGuest: 'Continue as Guest',
    guestUser: 'Guest',
    signOut: 'Sign Out',
    accountTitle: 'Player Profile',
    shareGameBtn: 'Share Game',
    shareGameTitle: 'Share Bounce 3D with Friends!',
    shareGameDesc: 'Relive the legendary red ball game in crisp 3D! Beat all 11 stages and climb the leaderboard!',
    copyLink: 'Copy Game Link',
    shareNative: 'Share Now',
    shareSuccess: 'Game link copied to clipboard!',
    watchAdReviveBtn: (rem: number) => `📺 Watch Ad (+1 Ball · Left: ${rem}/3)`,
    adRevivesExhausted: 'Ad Revives Limit Reached (0/3)',
    adRewardClaimed: 'AD COMPLETED! +1 EXTRA BALL',
    adModalTitle: 'Watch Ad (+1 Extra Ball)',
    adModalDesc: 'Watch a quick 5-second video to revive and keep playing!',
    adSkipBtn: 'Claim Ball (+1)',
    adPlaying: 'Ad Playing',
    dailyMissionsTitle: 'Daily Missions',
    dailyMissionsSubtitle: 'Complete today tasks & earn bonus scores!',
    missionCollectRingsDesc: (target) => `Collect ${target} Gold Rings`,
    missionClearStagesDesc: (target) => `Complete ${target} Game Stages`,
    missionSpeedRunDesc: 'Complete any stage in under 45 seconds',
    stages: {
      1: {
        title: 'STAGE 1: THE WARM-UP BRICK RUN',
        subtitle: 'Red Brick Warm-Up, Hoops & Floating Pool',
      },
      2: {
        title: 'STAGE 2: NEEDLES & FIRST JACK',
        subtitle: 'Moving Jacks & Twin Water Pools',
      },
      3: {
        title: 'STAGE 3: NARROW BRICK CORRIDORS',
        subtitle: 'Low-Ceiling Tunnels & Vertical Jacks',
      },
      4: {
        title: 'STAGE 4: HIGH BOUNCE CHAMBERS',
        subtitle: 'Blue Rubber Floors & High Ring Towers',
      },
      5: {
        title: 'STAGE 5: DEEP WATER AQUEDUCT',
        subtitle: 'Float vs Dive Underwater Puzzle',
      },
      6: {
        title: 'STAGE 6: TWIN JACK GAUNTLET',
        subtitle: 'Synchronized Jacks & Steep Brick Slopes',
      },
      7: {
        title: 'STAGE 7: MOVING BRICK BRIDGES',
        subtitle: 'Moving Brick Bridges Over Deep Chasms',
      },
      8: {
        title: 'STAGE 8: NEEDLE & JACK LABYRINTH',
        subtitle: 'Moving Spikes & Rapid Pump Switches',
      },
      9: {
        title: 'STAGE 9: TRIPLE TOWER ASCENT',
        subtitle: 'Three Bounce Towers & Chained Pools',
      },
      10: {
        title: 'STAGE 10: RED BRICK CITADEL',
        subtitle: 'Fortress Corridors & Moving Jack Patrols',
      },
      11: {
        title: 'STAGE 11: THE FINAL BOUNCE GAUNTLET',
        subtitle: 'The Ultimate 11th Stage Classic Finale',
      },
      12: {
        title: 'STAGE 12: JUNGLE GATEWAY',
        subtitle: 'Forest Grasslands & Floating Log Bridges',
      },
      13: {
        title: 'STAGE 13: BIRD VALLEY & NEEDLES',
        subtitle: 'Grass Jump Pillars & Moving Jack Patrols',
      },
      14: {
        title: 'STAGE 14: JUNGLE LAKE AQUEDUCT',
        subtitle: 'Deep Forest Water & Submerged Ring Puzzles',
      },
      15: {
        title: 'STAGE 15: TROPICAL WOOD BRIDGES',
        subtitle: 'Moving Log Bridges Across Deep Jungle Ravines',
      },
      16: {
        title: 'STAGE 16: GREEN RUBBER HONEYCOMB',
        subtitle: 'Grass Rubber Floors & High Canopy Rings',
      },
      17: {
        title: 'STAGE 17: WILD FOREST THORN LABYRINTH',
        subtitle: 'Canopy Thorns & Narrow Tree Bark Corridors',
      },
      18: {
        title: 'STAGE 18: JUNGLE RIVER & PUMP SWITCH',
        subtitle: 'Chained River Pools & Rapid Size Swaps',
      },
      19: {
        title: 'STAGE 19: TRIPLE GIANT TREE TOWERS',
        subtitle: 'Giant Canopy Towers & Shield Power-Ups',
      },
      20: {
        title: 'STAGE 20: JUNGLE CITADEL FORTRESS',
        subtitle: 'Forest Citadel & Synchronized Jack Guards',
      },
      21: {
        title: 'STAGE 21: LIGHTNING JUNGLE VALLEY',
        subtitle: 'High-Speed Log Platforms & Speed Boosts',
      },
      22: {
        title: 'STAGE 22: JUNGLE PEAK — GRAND FINALE',
        subtitle: 'The Ultimate Zone 2 Forest & Animal Finale',
      },
      23: {
        title: 'STAGE 23: GLACIAL GATEWAY',
        subtitle: 'Slippery Ice Friction & Momentum Sliding',
      },
      24: {
        title: 'STAGE 24: FROZEN CHASM & ICICLES',
        subtitle: 'Falling Glacier Blocks & Icicle Traps',
      },
      25: {
        title: 'STAGE 25: POLAR BEAR RIDGE',
        subtitle: 'Fierce Polar Bear Ice Patrols',
      },
      26: {
        title: 'STAGE 26: ICE SLIDE SLOPES',
        subtitle: 'Slippery 45° Ramps & Momentum Physics',
      },
      27: {
        title: 'STAGE 27: GLACIER CAVERN AQUEDUCT',
        subtitle: 'Freezing Submerged Water & Ice Diving',
      },
      28: {
        title: 'STAGE 28: SLIPPERY ICE LABYRINTH',
        subtitle: 'Narrow Frozen Tunnels & Precision Ice Slide',
      },
      29: {
        title: 'STAGE 29: FROSTBITE TOWERS',
        subtitle: 'High Bouncy Ice Pads & Frozen Towers',
      },
      30: {
        title: 'STAGE 30: BLIZZARD GAUNTLET',
        subtitle: 'Intense Glacier Blocks & Moving Icicles',
      },
      31: {
        title: 'STAGE 31: POLAR BEAR CITADEL',
        subtitle: 'Fortress of Ice & Heavy Glacier Traps',
      },
      32: {
        title: 'STAGE 32: GLACIER AVALANCHE',
        subtitle: 'Massive Avalanche & High-Speed Ice Dash',
      },
      33: {
        title: 'STAGE 33: GLACIAL PEAK — GRAND FINALE',
        subtitle: 'The Ultimate Zone 3 Ice Castle Boss Stage',
      },
    },
  },
};
