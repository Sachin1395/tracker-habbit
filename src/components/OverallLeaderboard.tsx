import { Trophy, Zap } from 'lucide-react';

export type LeaderboardEntry = {
  userId: string;
  name: string;
  totalXp: number;
};

export default function OverallLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-800">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-semibold">Overall Leaderboard</h3>
      </div>
      <div className="divide-y divide-slate-800">
        {entries.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No completed tasks yet.
          </div>
        )}
        {entries.map((entry, i) => (
          <div
            key={entry.userId}
            className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/40 transition"
          >
            <div
              className={`w-8 text-center font-bold ${
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'
              }`}
            >
              {i + 1}
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm flex-shrink-0">
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-white font-medium truncate">{entry.name}</div>
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Zap className="w-4 h-4" />
              {entry.totalXp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
