import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PlayerUser } from './authService';

export interface TournamentEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  timeSec: number;
  updatedAt: string;
}

export interface DailyTournamentInfo {
  dateStr: string;
  seedLevelNumber: number;
  titleId: string;
  titleEn: string;
  rewardCoins: number;
}

export function getTodayTournamentInfo(): DailyTournamentInfo {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  
  // Deterministic daily seed level from Zone 3 (stages 23 to 33)
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const seedLevelNumber = 23 + (dayOfYear % 11);

  return {
    dateStr,
    seedLevelNumber,
    titleId: `Turnamen Es Harian (Babak ${seedLevelNumber})`,
    titleEn: `Daily Glacier Tournament (Stage ${seedLevelNumber})`,
    rewardCoins: 500,
  };
}

export async function submitTournamentScore(
  player: PlayerUser,
  score: number,
  timeSec: number
): Promise<void> {
  if (!player.uid) return;
  const tourney = getTodayTournamentInfo();
  const docId = `${tourney.dateStr}_${player.uid}`;
  const path = `daily_tournaments/${docId}`;

  try {
    const entryRef = doc(db, 'daily_tournaments', docId);
    const existingSnap = await getDoc(entryRef);

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as TournamentEntry;
      if (existingData.score >= score && existingData.timeSec <= timeSec) {
        return;
      }
    }

    const payload: TournamentEntry = {
      uid: player.uid,
      displayName: (player.displayName || 'Pemain Bounce').slice(0, 64),
      score: Math.min(Math.floor(score), 10000000),
      timeSec: Number(timeSec.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    if (player.photoURL) {
      // payload.photoURL = player.photoURL.slice(0, 512); // optional if needed
    }

    await setDoc(entryRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchTournamentLeaderboard(limitCount: number = 20): Promise<TournamentEntry[]> {
  const tourney = getTodayTournamentInfo();
  const path = 'daily_tournaments';
  try {
    const q = query(
      collection(db, path),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TournamentEntry);
  } catch (error) {
    // Return empty array if offline or error
    return [];
  }
}
