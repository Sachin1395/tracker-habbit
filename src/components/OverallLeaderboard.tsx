import { Trophy, Zap } from 'lucide-react';

const ORANGE = '#FF9F1C';

export type LeaderboardEntry = {
  userId: string;
  name: string;
  totalXp: number;
};

export default function OverallLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="glass rounded-[18px] overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Trophy className="w-5 h-5" style={{ color: ORANGE }} />
        <h3 className="font-semibold" style={{ color: '#F5F5F5' }}>Overall Leaderboard</h3>
      </div>
      <div>
        {entries.length === 0 && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: '#71717A' }}>
            No completed tasks yet.
          </div>
        )}
        {entries.map((entry, i) => (
          <div
            key={entry.userId}
            className="flex items-center gap-4 px-6 py-3 transition"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="w-8 text-center font-bold" style={{ color: '#71717A' }}>
              {i + 1}
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#A1A1AA' }}
            >
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 font-medium truncate" style={{ color: '#F5F5F5' }}>{entry.name}</div>
            <div className="flex items-center gap-1.5 font-semibold" style={{ color: ORANGE }}>
              <Zap className="w-4 h-4" />
              {entry.totalXp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
