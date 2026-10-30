import React, { useState, useEffect } from 'react';
import { I18nStrings } from '../game/i18n';
import { PlayerUser } from '../services/authService';
import { ArcadeIconTile, LeaderboardBar3DIcon, TrophyCrest3DIcon, Stopwatch3DIcon } from './ArcadeIcons';
import {
  fetchTopScores,
  fetchTopSpeedruns,
  LeaderboardScoreEntry,
  SpeedrunRecordEntry,
} from '../services/leaderboardService';

interface LeaderboardModalProps {
  t: I18nStrings;
  player: PlayerUser | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  t,
  player,
  onClose,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'speedrun'>('scores');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [scores, setScores] = useState<LeaderboardScoreEntry[]>([]);
  const [speedruns, setSpeedruns] = useState<SpeedrunRecordEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (activeTab === 'scores') {
      fetchTopScores(25)
        .then((data) => {
          if (isMounted) {
            setScores(data || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      fetchTopSpeedruns(selectedLevel, 25)
        .then((data) => {
          if (isMounted) {
            setSpeedruns(data || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedLevel]);

  const top1 = scores[0];
  const top2 = scores[1];
  const top3 = scores[2];
  const listScores = scores.slice(3);

  const top1Speed = speedruns[0];
  const top2Speed = speedruns[1];
  const top3Speed = speedruns[2];
  const listSpeedruns = speedruns.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl border-2 border-amber-400/50 bg-slate-950/95 p-4 sm:p-5 shadow-[0_0_35px_rgba(251,191,36,0.22)] flex flex-col max-h-[92vh] modal-juice-pop">
        {/* Header Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ArcadeIconTile glowColor="amber" className="w-11 h-11 sm:w-12 sm:h-12 shrink-0">
              <LeaderboardBar3DIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </ArcadeIconTile>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent uppercase">
                {t.leaderboardTitle || 'Papan Peringkat Global'}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold">
                Pemain Terbaik & Record Speedrun Dunia
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

        {/* Auth Banner Prompt */}
        {!player && (
          <div className="mt-2.5 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
            <span className="text-[11px] text-amber-200 font-semibold">
              💡 Masuk akun Google untuk mencatat skor & nama Anda di papan peringkat.
            </span>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition cursor-pointer shrink-0"
            >
              Masuk
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-2.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('scores')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'scores'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🌟</span>
            <span>{t.leaderboardTabScores || 'Skor Tertinggi'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speedrun')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'speedrun'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⏱️</span>
            <span>{t.leaderboardTabSpeedrun || 'Speedrun Stage'}</span>
          </button>
        </div>

        {/* Speedrun Stage Filters */}
        {activeTab === 'speedrun' && (
          <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-thin">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-cyan-400 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Babak {lvl}
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard Body */}
        <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1 min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Memuat data leaderboard...</span>
            </div>
          ) : activeTab === 'scores' ? (
            scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-xs p-4">
                <span className="text-3xl mb-2">⭐</span>
                <span>Belum ada skor tercatat. Jadilah yang pertama di papan peringkat!</span>
              </div>
            ) : (
              <>
                {/* Miniclip Top 3 Winner Podium */}
                <div className="grid grid-cols-3 gap-2 my-1 items-end pt-2">
                  {/* Rank 2 (Left) */}
                  <div className="flex flex-col items-center p-2 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700 text-center relative shadow-md">
                    <span className="text-lg absolute -top-3">🥈</span>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-slate-800 flex items-center justify-center font-black text-sm text-slate-200 mt-1 overflow-hidden">
                      {top2?.photoURL && top2.photoURL.length > 5 ? (
                        <img src={top2.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        top2?.photoURL || (top2?.displayName ? top2.displayName[0].toUpperCase() : '-')
                      )}
                    </div>
                    <span className="text-[11px] font-black text-white truncate max-w-[80px] mt-1">
                      {top2 ? top2.displayName : '-'}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 tabular-nums">
                      {top2 ? top2.score.toLocaleString() : '0'}
                    </span>
                  </div>

                  {/* Rank 1 (Center - Gold Highlight) */}
                  <div className="flex flex-col items-center p-2.5 rounded-2xl bg-gradient-to-b from-amber-500/25 via-amber-900/40 to-slate-900/95 border-2 border-amber-400 text-center relative shadow-lg shadow-amber-500/20 -translate-y-1">
                    <span className="text-2xl absolute -top-4 animate-bounce">👑</span>
                    <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-950 flex items-center justify-center font-black text-base text-amber-300 mt-1 shadow-md overflow-hidden">
                      {top1?.photoURL && top1.photoURL.length > 5 ? (
                        <img src={top1.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        top1?.photoURL || (top1?.displayName ? top1.displayName[0].toUpperCase() : '1')
                      )}
                    </div>
                    <span className="text-xs font-black text-amber-300 truncate max-w-[95px] mt-1">
                      {top1 ? top1.displayName : '-'}
                    </span>
                    <span className="text-xs font-black text-amber-400 tabular-nums">
                      {top1 ? top1.score.toLocaleString() : '0'}
                    </span>
                  </div>

                  {/* Rank 3 (Right) */}
                  <div className="flex flex-col items-center p-2 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900/90 border border-amber-700/50 text-center relative shadow-md">
                    <span className="text-lg absolute -top-3">🥉</span>
                    <div className="w-10 h-10 rounded-full border-2 border-amber-600 bg-slate-800 flex items-center justify-center font-black text-sm text-amber-400 mt-1 overflow-hidden">
                      {top3?.photoURL && top3.photoURL.length > 5 ? (
                        <img src={top3.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        top3?.photoURL || (top3?.displayName ? top3.displayName[0].toUpperCase() : '-')
                      )}
                    </div>
                    <span className="text-[11px] font-black text-white truncate max-w-[80px] mt-1">
                      {top3 ? top3.displayName : '-'}
                    </span>
                    <span className="text-[10px] font-black text-amber-400/90 tabular-nums">
                      {top3 ? top3.score.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>

                {/* Ranked List (Ranks 4+) */}
                {listScores.map((entry, idx) => {
                  const rank = idx + 4;
                  const isMe = player && player.uid === entry.uid;
                  return (
                    <div
                      key={entry.uid || idx}
                      className={`flex items-center justify-between p-2 px-3 rounded-2xl border transition ${
                        isMe
                          ? 'bg-amber-500/20 border-amber-400/80 shadow-md'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 text-center text-xs font-black text-slate-400">
                          #{rank}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 overflow-hidden shrink-0">
                          {entry.photoURL && entry.photoURL.length > 5 ? (
                            <img src={entry.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            entry.photoURL || (entry.displayName ? entry.displayName[0].toUpperCase() : 'P')
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <span>{entry.displayName}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-[9px] text-amber-300 font-extrabold">
                                Kamu
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Stage: #{entry.levelReached || 1}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-amber-400 tabular-nums">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                          Poin
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          ) : speedruns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400 text-xs p-4">
              <span className="text-3xl mb-2">⏱️</span>
              <span>Belum ada rekor waktu untuk Babak {selectedLevel}. Jadilah yang tercepat!</span>
            </div>
          ) : (
            speedruns.map((rec, idx) => {
              const isMe = player && player.uid === rec.uid;
              return (
                <div
                  key={rec.uid || idx}
                  className={`flex items-center justify-between p-2 px-3 rounded-2xl border transition ${
                    isMe
                      ? 'bg-cyan-500/20 border-cyan-400/80 shadow-md'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center text-xs font-black text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <span>{rec.displayName}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-[9px] text-cyan-300 font-extrabold">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Babak {rec.levelNumber}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-cyan-300 tabular-nums">
                      {rec.timeSec.toFixed(2)}s
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                      Speedrun
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Player Rank Status */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-[11px]">
            <span>👤</span>
            <span>{player ? player.displayName : 'Tamu Anonim'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
