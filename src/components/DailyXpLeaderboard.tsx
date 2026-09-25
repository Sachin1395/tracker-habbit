import { ChevronLeft, ChevronRight, Zap, ArrowDown } from 'lucide-react';
import { formatDateNice, addDays, toLocalDateStr } from '@/lib/dates';

export type DailyLeaderboardEntry = {
  userId: string;
  name: string;
  dailyXp: number;
};

type Props = {
  selectedDate: string;
  onPrev: () => void;
  onNext: () => void;
  entries: DailyLeaderboardEntry[];
  currentUserId: string | undefined;
};

export default function DailyXpLeaderboard({ selectedDate, onPrev, onNext, entries, currentUserId }: Props) {
  const activeEntries = entries.filter((e) => e.dailyXp > 0);
  const minXP = activeEntries.length > 0 ? Math.min(...activeEntries.map((e) => e.dailyXp)) : 0;
  const isToday = selectedDate === toLocalDateStr(new Date());

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Daily XP Leaderboard</h3>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="text-white font-medium min-w-[10rem] text-center">
            {formatDateNice(selectedDate)}
            {isToday && <span className="text-amber-400 text-xs ml-2">(Today)</span>}
          </div>
          <button
            onClick={onNext}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {activeEntries.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No XP earned on this date.
          </div>
        )}
        {activeEntries.map((entry, i) => {
          const isMin = entry.dailyXp === minXP;
          const isMe = entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 px-6 py-3 transition ${
                isMin ? 'bg-rose-500/10 border-l-2 border-rose-500' : ''
              } ${isMe && !isMin ? 'bg-amber-500/5' : ''}`}
            >
              <div className="w-8 text-center font-bold text-slate-400">{i + 1}</div>
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm flex-shrink-0">
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-white font-medium">{entry.name}</span>
                {isMe && <span className="text-amber-400 text-xs ml-2">(You)</span>}
                {isMin && (
                  <span className="ml-2 inline-flex items-center gap-1 text-rose-400 text-xs font-medium">
                    <ArrowDown className="w-3 h-3" /> Lowest
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Zap className="w-4 h-4" />
                {entry.dailyXp}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
