import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface LeaderboardScore {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  levelReached: number;
  updatedAt: any;
}

export interface DailyLeaderboardScore {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  dateString: string;
  updatedAt: any;
}

const GLOBAL_LEADERBOARD_COL = 'leaderboard_scores';
const DAILY_LEADERBOARD_COL = 'daily_leaderboard_scores';

export async function submitGlobalScore(score: number, levelReached: number) {
  if (!auth.currentUser) return;
  const user = auth.currentUser;
  
  const scoreRef = doc(db, GLOBAL_LEADERBOARD_COL, user.uid);
  await setDoc(scoreRef, {
    uid: user.uid,
    displayName: user.displayName || 'Guest',
    photoURL: user.photoURL || '',
    score,
    levelReached,
    updatedAt: serverTimestamp(),
  });
}

export async function submitDailyScore(score: number) {
  if (!auth.currentUser) return;
  const user = auth.currentUser;
  const dateString = new Date().toISOString().split('T')[0];
  
  const scoreRef = doc(db, DAILY_LEADERBOARD_COL, dateString, 'scores', user.uid);
  await setDoc(scoreRef, {
    uid: user.uid,
    displayName: user.displayName || 'Guest',
    photoURL: user.photoURL || '',
    score,
    dateString,
    updatedAt: serverTimestamp(),
  });
}

export async function getGlobalLeaderboard(limitCount = 20) {
  const q = query(
    collection(db, GLOBAL_LEADERBOARD_COL),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as LeaderboardScore);
}

export async function getDailyLeaderboard(limitCount = 20) {
  const dateString = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, DAILY_LEADERBOARD_COL, dateString, 'scores'),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as DailyLeaderboardScore);
}

export async function submitSpeedrunTime(player: any, levelNumber: number, timeSec: number) {
  if (!auth.currentUser) return;
  const user = auth.currentUser;
  
  const recordRef = doc(db, 'leaderboard_speedruns', `${user.uid}_${levelNumber}`);
  await setDoc(recordRef, {
    uid: user.uid,
    displayName: user.displayName || 'Guest',
    levelNumber,
    timeSec,
    updatedAt: serverTimestamp(),
  });
}
