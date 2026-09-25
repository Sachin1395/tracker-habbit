import { ChevronLeft, ChevronRight, Zap, ArrowDown } from 'lucide-react';
import { formatDateNice, toLocalDateStr } from '@/lib/dates';

const ORANGE = '#FF9F1C';
const RED = '#EF4444';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

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
    <div className="glass rounded-[18px] overflow-hidden">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold" style={{ color: PRIMARY }}>Daily XP Leaderboard</h3>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onPrev}
            className="btn-secondary w-9 h-9 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: SECONDARY }} />
          </button>
          <div className="font-medium min-w-[10rem] text-center" style={{ color: PRIMARY }}>
            {formatDateNice(selectedDate)}
            {isToday && <span className="text-xs ml-2" style={{ color: ORANGE }}>(Today)</span>}
          </div>
          <button
            onClick={onNext}
            className="btn-secondary w-9 h-9 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" style={{ color: SECONDARY }} />
          </button>
        </div>
      </div>
      <div>
        {activeEntries.length === 0 && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: MUTED }}>
            No XP earned on this date.
          </div>
        )}
        {activeEntries.map((entry, i) => {
          const isMin = entry.dailyXp === minXP;
          const isMe = entry.userId === currentUserId;
          return (
            <div
              key={entry.userId}
              className="flex items-center gap-4 px-6 py-3 transition"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: isMin ? 'rgba(239,68,68,0.06)' : 'transparent',
                borderLeft: isMin ? '2px solid rgba(239,68,68,0.5)' : 'none',
              }}
            >
              <div className="w-8 text-center font-bold" style={{ color: MUTED }}>{i + 1}</div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#A1A1AA' }}
              >
                {entry.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="font-medium" style={{ color: PRIMARY }}>{entry.name}</span>
                {isMe && <span className="text-xs ml-2" style={{ color: ORANGE }}>(You)</span>}
                {isMin && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: RED }}>
                    <ArrowDown className="w-3 h-3" /> Lowest
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: ORANGE }}>
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
