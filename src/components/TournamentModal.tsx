import React, { useEffect, useState } from 'react';
import { PlayerUser } from '../services/authService';
import {
  DailyTournamentInfo,
  TournamentEntry,
  fetchTournamentLeaderboard,
  getTodayTournamentInfo,
} from '../services/tournamentService';
import { BOUNCE_LEVELS } from '../game/levels';

interface TournamentModalProps {
  player: PlayerUser | null;
  onClose: () => void;
  onPlayTournamentStage: (stageIndex: number) => void;
  onOpenAuth: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  player,
  onClose,
  onPlayTournamentStage,
  onOpenAuth,
}) => {
  const [tourneyInfo] = useState<DailyTournamentInfo>(getTodayTournamentInfo());
  const [entries, setEntries] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const list = await fetchTournamentLeaderboard(25);
      setEntries(list);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleStartPlay = () => {
    // Map stageNumber to index (stageNumber - 1)
    const stageIdx = tourneyInfo.seedLevelNumber - 1;
    onPlayTournamentStage(stageIdx);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 border-2 border-sky-400/60 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl shadow-sky-500/20 text-white relative animate-bounce-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold transition cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <div className="text-xs uppercase font-extrabold text-sky-400 tracking-wider">
              Turnamen Harian Zona 3
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {tourneyInfo.titleEn}
            </h2>
          </div>
        </div>

        <div className="bg-sky-950/60 border border-sky-400/30 rounded-2xl p-4 mb-4 text-center">
          <div className="text-xs text-sky-200 mb-1">
            ❄️ Tantangan Gletser Harian · Hadiah Pemenang: <span className="text-amber-300 font-extrabold">+{tourneyInfo.rewardCoins} Koin Emas</span>
          </div>
          <div className="text-xs font-semibold text-slate-300 mb-3">
            Babak: Babak {tourneyInfo.seedLevelNumber} ({BOUNCE_LEVELS[tourneyInfo.seedLevelNumber - 1]?.subtitle || 'Es Kutub'})
          </div>
          <button
            type="button"
            onClick={handleStartPlay}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-sky-500/30 transition transform hover:scale-[1.02] cursor-pointer"
          >
            🚀 Mulai Mainkan Turnamen Sekarang!
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            🏆 Papan Peringkat Turnamen Hari Ini
          </span>
          {!player && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs text-amber-300 hover:underline cursor-pointer font-bold"
            >
              Masuk untuk Simpan Skor ➔
            </button>
          )}
        </div>

        <div className="bg-slate-950/80 border border-white/10 rounded-2xl max-h-56 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400 animate-pulse">
              Memuat peringkat turnamen...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Belum ada peserta hari ini. Jadilah yang pertama!
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry, idx) => (
                <div
                  key={entry.uid}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    player?.uid === entry.uid
                      ? 'bg-sky-500/25 border-sky-400 font-bold'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[160px] text-white">
                      {entry.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span className="text-amber-300 font-bold">⭐ {entry.score}</span>
                    <span className="text-slate-300 font-medium">⏱️ {entry.timeSec}s</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
