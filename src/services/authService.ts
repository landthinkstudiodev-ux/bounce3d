import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export interface PlayerUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  isAnonymous: boolean;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function subscribeAuth(callback: (user: PlayerUser | null) => void) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }

    const player: PlayerUser = {
      uid: user.uid,
      displayName: user.displayName || (user.isAnonymous ? 'Tamu ' + user.uid.slice(-4) : 'Pemain Bounce'),
      photoURL: user.photoURL || undefined,
      isAnonymous: user.isAnonymous,
    };

    // Auto check daily login streak
    try {
      await checkAndApplyDailyStreak(player.uid);
    } catch (err) {
      console.warn('Daily streak check failed on auth change:', err);
    }

    // Save/update profile in Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: player.uid,
          displayName: player.displayName.slice(0, 64),
          photoURL: (player.photoURL || '').slice(0, 512) || undefined,
          isAnonymous: player.isAnonymous,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      // Non-fatal, but logged
      console.warn('Could not sync user profile to Firestore:', err);
    }

    callback(player);
  });
}

export async function loginWithGoogle(): Promise<PlayerUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const player: PlayerUser = {
    uid: user.uid,
    displayName: user.displayName || 'Pemain Google',
    photoURL: user.photoURL || undefined,
    isAnonymous: false,
  };

  try {
    await checkAndApplyDailyStreak(player.uid);
  } catch (err) {
    console.warn('Daily streak check failed on Google login:', err);
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: player.uid,
        displayName: player.displayName.slice(0, 64),
        photoURL: (player.photoURL || '').slice(0, 512) || undefined,
        isAnonymous: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  return player;
}

export async function playAsGuest(): Promise<PlayerUser> {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    const player: PlayerUser = {
      uid: user.uid,
      displayName: localStorage.getItem('bounce_guest_name') || ('Tamu ' + user.uid.slice(-4)),
      photoURL: localStorage.getItem('bounce_guest_avatar') || undefined,
      isAnonymous: true,
    };

    try {
      await checkAndApplyDailyStreak(player.uid);
    } catch (err) {
      console.warn('Daily streak check failed on guest login:', err);
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: player.uid,
          displayName: player.displayName.slice(0, 64),
          photoURL: (player.photoURL || '').slice(0, 512) || undefined,
          isAnonymous: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Ignore Firestore write error in guest mode
    }

    return player;
  } catch (err) {
    console.warn('Firebase anonymous auth fallback to local guest session:', err);
    let guestUid = localStorage.getItem('bounce_guest_uid');
    if (!guestUid) {
      guestUid = 'guest_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('bounce_guest_uid', guestUid);
    }
    const guestName = localStorage.getItem('bounce_guest_name') || ('Tamu ' + guestUid.slice(-4));
    const guestAvatar = localStorage.getItem('bounce_guest_avatar') || undefined;

    const localPlayer: PlayerUser = {
      uid: guestUid,
      displayName: guestName,
      photoURL: guestAvatar,
      isAnonymous: true,
    };

    try {
      await checkAndApplyDailyStreak(localPlayer.uid);
    } catch (e) {
      console.warn('Daily streak check failed on local guest fallback:', e);
    }

    return localPlayer;
  }
}

export async function logoutPlayer(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore signout errors
  }
}

export async function updateUserProfileName(newName: string): Promise<PlayerUser | null> {
  const cleanName = newName.trim().slice(0, 24) || 'Pemain Bounce';
  localStorage.setItem('bounce_guest_name', cleanName);

  const user = auth.currentUser;
  const uid = user ? user.uid : localStorage.getItem('bounce_guest_uid') || 'guest_local';
  
  const player: PlayerUser = {
    uid,
    displayName: cleanName,
    photoURL: user?.photoURL || localStorage.getItem('bounce_guest_avatar') || undefined,
    isAnonymous: !user || user.isAnonymous,
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid: player.uid,
        displayName: cleanName,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-fatal
  }

  return player;
}

export async function updatePlayerAvatar(avatarUrl: string): Promise<PlayerUser | null> {
  localStorage.setItem('bounce_guest_avatar', avatarUrl);

  const user = auth.currentUser;
  const uid = user ? user.uid : localStorage.getItem('bounce_guest_uid') || 'guest_local';

  const player: PlayerUser = {
    uid,
    displayName: localStorage.getItem('bounce_guest_name') || (user?.displayName || 'Tamu ' + uid.slice(-4)),
    photoURL: avatarUrl,
    isAnonymous: !user || user.isAnonymous,
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid: player.uid,
        photoURL: avatarUrl,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    // Non-fatal
  }

  return player;
}

export interface LoginStreakInfo {
  lastLoginDate: string; // YYYY-MM-DD
  currentStreak: number; // 1 to 7
  claimedDays: number[]; // e.g. [1, 2, 3]
  chestKeys: number;     // earned chest keys
}

const STREAK_STORAGE_PREFIX = 'bounce3d_auth_streak_';

export function getLoginStreakData(uid: string): LoginStreakInfo {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_PREFIX + uid) || localStorage.getItem('bounce3d_daily_streak_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lastLoginDate: parsed.lastLoginDate || '',
        currentStreak: parsed.currentStreak || 1,
        claimedDays: Array.isArray(parsed.claimedDays) ? parsed.claimedDays : [],
        chestKeys: typeof parsed.chestKeys === 'number' ? parsed.chestKeys : 0,
      };
    }
  } catch {
    // ignore
  }
  return {
    lastLoginDate: '',
    currentStreak: 1,
    claimedDays: [],
    chestKeys: 0,
  };
}

export async function saveLoginStreakData(uid: string, streakInfo: LoginStreakInfo): Promise<void> {
  try {
    localStorage.setItem(STREAK_STORAGE_PREFIX + uid, JSON.stringify(streakInfo));
    localStorage.setItem('bounce3d_daily_streak_state', JSON.stringify(streakInfo));

    if (uid && !uid.startsWith('guest_local')) {
      const userRef = doc(db, 'users', uid);
      await setDoc(
        userRef,
        {
          loginStreak: streakInfo,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Could not sync streak to storage/Firestore:', err);
  }
}

export async function checkAndApplyDailyStreak(uid: string): Promise<LoginStreakInfo> {
  const current = getLoginStreakData(uid);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  if (!current.lastLoginDate) {
    // Initial login or unrecorded streak date
    const initialInfo: LoginStreakInfo = {
      lastLoginDate: todayStr,
      currentStreak: 1,
      claimedDays: [],
      chestKeys: current.chestKeys || 0,
    };
    await saveLoginStreakData(uid, initialInfo);
    return initialInfo;
  }

  if (current.lastLoginDate === todayStr) {
    // Same day login: maintain current status
    return current;
  }

  // Parse YYYY-MM-DD to UTC timestamp for day difference calculation
  const parseYMD = (str: string) => {
    const parts = str.split('-').map((v) => parseInt(v, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return 0;
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  };

  const lastMs = parseYMD(current.lastLoginDate);
  const todayMs = parseYMD(todayStr);

  if (lastMs === 0) {
    const resetInfo: LoginStreakInfo = {
      lastLoginDate: todayStr,
      currentStreak: 1,
      claimedDays: [],
      chestKeys: current.chestKeys || 0,
    };
    await saveLoginStreakData(uid, resetInfo);
    return resetInfo;
  }

  const diffDays = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  let updatedStreak = current.currentStreak;
  let updatedClaimedDays = [...current.claimedDays];

  if (diffDays === 1) {
    // Consecutive daily login
    if (current.claimedDays.length >= 7) {
      // Finished previous 7-day reward cycle; start a fresh cycle
      updatedStreak = 1;
      updatedClaimedDays = [];
    } else {
      updatedStreak = Math.min(7, current.currentStreak + 1);
    }
  } else if (diffDays > 1 || diffDays < 0) {
    // Missed a day or date changed -> reset streak counter and claims
    updatedStreak = 1;
    updatedClaimedDays = [];
  }

  const updatedInfo: LoginStreakInfo = {
    lastLoginDate: todayStr,
    currentStreak: updatedStreak,
    claimedDays: updatedClaimedDays,
    chestKeys: current.chestKeys || 0,
  };

  await saveLoginStreakData(uid, updatedInfo);
  return updatedInfo;
}

export async function recordLoginStreakClaim(
  uid: string,
  dayNumber: number,
  rewardRings: number,
  earnedKeys: number = 0
): Promise<LoginStreakInfo> {
  const current = getLoginStreakData(uid);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const nextClaimedDays = Array.from(new Set([...current.claimedDays, dayNumber]));
  const nextKeys = current.chestKeys + earnedKeys;

  const updatedInfo: LoginStreakInfo = {
    lastLoginDate: todayStr,
    currentStreak: dayNumber,
    claimedDays: nextClaimedDays,
    chestKeys: nextKeys,
  };

  await saveLoginStreakData(uid, updatedInfo);
  return updatedInfo;
}


