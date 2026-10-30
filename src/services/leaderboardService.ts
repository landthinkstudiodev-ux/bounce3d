import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PlayerUser } from './authService';

export interface LeaderboardScoreEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  levelReached: number;
  updatedAt: string;
}

export interface SpeedrunRecordEntry {
  uid: string;
  displayName: string;
  levelNumber: number;
  timeSec: number;
  updatedAt: string;
}

export async function submitHighScore(
  player: PlayerUser,
  score: number,
  levelReached: number
): Promise<void> {
  if (!player.uid || score <= 0) return;
  const path = `leaderboard_scores/${player.uid}`;

  try {
    const scoreRef = doc(db, 'leaderboard_scores', player.uid);
    const existingSnap = await getDoc(scoreRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as LeaderboardScoreEntry;
      if (existingData.score >= score) {
        // Existing score is already higher or equal
        return;
      }
    }

    const payload: LeaderboardScoreEntry = {
      uid: player.uid,
      displayName: (player.displayName || 'Pemain Bounce').slice(0, 64),
      score: Math.min(Math.floor(score), 10000000),
      levelReached: Math.min(Math.max(levelReached, 1), 11),
      updatedAt: new Date().toISOString(),
    };

    if (player.photoURL) {
      payload.photoURL = player.photoURL.slice(0, 512);
    }

    await setDoc(scoreRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function submitSpeedrunTime(
  player: PlayerUser,
  levelNumber: number,
  timeSec: number
): Promise<void> {
  if (!player.uid || timeSec <= 0) return;
  const docId = `${player.uid}_lvl${levelNumber}`;
  const path = `leaderboard_speedruns/${docId}`;

  try {
    const recordRef = doc(db, 'leaderboard_speedruns', docId);
    const existingSnap = await getDoc(recordRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as SpeedrunRecordEntry;
      if (existingData.timeSec <= timeSec) {
        // Existing time is faster or equal
        return;
      }
    }

    const payload: SpeedrunRecordEntry = {
      uid: player.uid,
      displayName: (player.displayName || 'Pemain Bounce').slice(0, 64),
      levelNumber,
      timeSec: Number(timeSec.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(recordRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchTopScores(limitCount: number = 25): Promise<LeaderboardScoreEntry[]> {
  const path = 'leaderboard_scores';
  try {
    const q = query(
      collection(db, path),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as LeaderboardScoreEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchTopSpeedruns(
  levelNumber: number,
  limitCount: number = 25
): Promise<SpeedrunRecordEntry[]> {
  const path = 'leaderboard_speedruns';
  try {
    const q = query(
      collection(db, path),
      where('levelNumber', '==', levelNumber),
      orderBy('timeSec', 'asc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SpeedrunRecordEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
