import React, { useState, useEffect } from 'react';
import { getGlobalLeaderboard, getDailyLeaderboard, LeaderboardScore, DailyLeaderboardScore } from '../services/leaderboardService';
import { X } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
  lang: 'id' | 'en';
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'daily'>('global');
  const [scores, setScores] = useState<(LeaderboardScore | DailyLeaderboardScore)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'global') {
      getGlobalLeaderboard().then(setScores).finally(() => setLoading(false));
    } else {
      getDailyLeaderboard().then(setScores).finally(() => setLoading(false));
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">
            {lang === 'id' ? 'Papan Peringkat' : 'Leaderboard'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 rounded-2xl font-black shadow-[0_4px_0_rgb(30,41,59)] hover:scale-105 active:scale-95 transition ${
              activeTab === 'global' ? 'bg-amber-500 text-slate-950 shadow-[0_4px_0_rgb(180,83,9)]' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {lang === 'id' ? 'Global' : 'Global'}
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-3 rounded-2xl font-black shadow-[0_4px_0_rgb(30,41,59)] hover:scale-105 active:scale-95 transition ${
              activeTab === 'daily' ? 'bg-amber-500 text-slate-950 shadow-[0_4px_0_rgb(180,83,9)]' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {lang === 'id' ? 'Harian' : 'Daily'}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading...</div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-white/5">
                <div className="w-8 text-center font-black text-amber-500">#{index + 1}</div>
                {score.photoURL && <img src={score.photoURL} className="w-8 h-8 rounded-full" alt="" />}
                <div className="flex-1 font-bold text-white">{score.displayName}</div>
                <div className="font-black text-emerald-400">{score.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
