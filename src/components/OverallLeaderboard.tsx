import { Trophy, Zap, Percent } from 'lucide-react';

const ORANGE = '#FF9F1C';
const SECONDARY = '#A1A1AA';
const PRIMARY = '#F5F5F5';
const MUTED = '#71717A';

export type LeaderboardMode = 'xp' | 'completion';

export type LeaderboardEntry = {
  userId: string;
  name: string;
  totalXp: number;
  weeklyCompletedXp: number;
  weeklyPlannedXp: number;
  completionRate: number;
};

type Props = {
  entries: LeaderboardEntry[];
  mode: LeaderboardMode;
  onModeChange: (mode: LeaderboardMode) => void;
};

export default function OverallLeaderboard({ entries, mode, onModeChange }: Props) {
  const sorted = [...entries].sort((a, b) => {
    if (mode === 'xp') {
      return b.weeklyCompletedXp - a.weeklyCompletedXp || a.name.localeCompare(b.name);
    }
    return b.completionRate - a.completionRate || a.name.localeCompare(b.name);
  });

  const activeEntries =
    mode === 'xp'
      ? sorted.filter((e) => e.weeklyCompletedXp > 0)
      : sorted.filter((e) => e.weeklyPlannedXp > 0);

  return (
    <div className="glass rounded-[18px] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5" style={{ color: ORANGE }} />
          <h3 className="font-semibold" style={{ color: PRIMARY }}>Overall Leaderboard</h3>
        </div>

        <div
          className="flex rounded-xl p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => onModeChange('xp')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            style={
              mode === 'xp'
                ? { background: ORANGE, color: '#000000' }
                : { color: SECONDARY }
            }
          >
            <Zap className="w-3.5 h-3.5" />
            XP
          </button>
          <button
            onClick={() => onModeChange('completion')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            style={
              mode === 'completion'
                ? { background: ORANGE, color: '#000000' }
                : { color: SECONDARY }
            }
          >
            <Percent className="w-3.5 h-3.5" />
            Rate
          </button>
        </div>
      </div>

      <div>
        {activeEntries.length === 0 && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: MUTED }}>
            {mode === 'xp' ? 'No completed tasks this week.' : 'No tasks planned this week.'}
          </div>
        )}
        {activeEntries.map((entry, i) => (
          <div
            key={entry.userId}
            className="flex items-center gap-4 px-6 py-3 transition"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div className="w-8 text-center font-bold" style={{ color: MUTED }}>
              {i + 1}
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: SECONDARY }}
            >
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 font-medium truncate" style={{ color: PRIMARY }}>{entry.name}</div>
            {mode === 'xp' ? (
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: ORANGE }}>
                <Zap className="w-4 h-4" />
                {entry.weeklyCompletedXp.toLocaleString()}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: ORANGE }}>
                <Percent className="w-4 h-4" />
                {entry.completionRate.toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
