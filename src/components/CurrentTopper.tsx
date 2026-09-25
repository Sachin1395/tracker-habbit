import { Crown, Zap } from 'lucide-react';
import type { LeaderboardEntry } from './OverallLeaderboard';

const ORANGE = '#FF9F1C';

export default function CurrentTopper({ topper }: { topper: LeaderboardEntry | null }) {
  if (!topper) {
    return (
      <div className="glass glass-hover rounded-[18px] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-5 h-5" style={{ color: ORANGE }} />
          <h3 className="font-semibold" style={{ color: '#F5F5F5' }}>Current Topper</h3>
        </div>
        <p className="text-sm" style={{ color: '#71717A' }}>No completed tasks yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div
      className="glass glass-hover rounded-[18px] p-6 relative overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,159,28,0.18)' }}
    >
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5" style={{ color: ORANGE }} />
          <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: ORANGE }}>Current Topper</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(255,159,28,0.12)', color: ORANGE }}
            >
              {topper.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: '#F5F5F5' }}>{topper.name}</div>
              <div className="text-xs" style={{ color: '#71717A' }}>Lifetime leader</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 font-bold text-2xl" style={{ color: ORANGE }}>
              <Zap className="w-5 h-5" />
              {topper.totalXp.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: '#71717A' }}>Total XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
