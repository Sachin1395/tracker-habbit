import { Crown, Zap } from 'lucide-react';
import type { LeaderboardEntry } from './OverallLeaderboard';

export default function CurrentTopper({ topper }: { topper: LeaderboardEntry | null }) {
  if (!topper) {
    return (
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="text-white font-semibold">Current Topper</h3>
        </div>
        <p className="text-slate-500 text-sm">No completed tasks yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Current Topper</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold text-lg">
              {topper.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold text-lg">{topper.name}</div>
              <div className="text-slate-400 text-xs">Lifetime leader</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-2xl">
              <Zap className="w-5 h-5" />
              {topper.totalXp.toLocaleString()}
            </div>
            <div className="text-slate-400 text-xs">Total XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
