import { useState } from 'react';
import { toLocalDateStr, addDays, formatDateNice } from '@/lib/dates';

type DayData = {
  date: string;
  xp: number;
  count: number;
};

type Props = {
  data: Map<string, DayData>;
};

// Show last ~26 weeks (roughly 6 months), GitHub-style.
const WEEKS = 26;

function intensityColor(xp: number, max: number): string {
  if (xp === 0) return 'bg-slate-800';
  const ratio = max > 0 ? xp / max : 0;
  if (ratio <= 0.25) return 'bg-amber-900/60';
  if (ratio <= 0.5) return 'bg-amber-700/70';
  if (ratio <= 0.75) return 'bg-amber-500/80';
  return 'bg-amber-400';
}

export default function HabitHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ day: DayData | null; x: number; y: number } | null>(null);

  // Build grid: columns = weeks, rows = days of week (Mon–Sun)
  const today = new Date();
  const todayDateStr = toLocalDateStr(today);

  // Find the Sunday of the current week, then go back WEEKS weeks
  const todayDay = today.getDay();
  const diffToSunday = todayDay === 0 ? 0 : 7 - todayDay;
  const endSunday = addDays(today, diffToSunday);
  const startMonday = addDays(endSunday, -(WEEKS * 7 - 1));

  const weeks: { date: Date; dayIdx: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(startMonday, w * 7);
    const days: { date: Date; dayIdx: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d);
      days.push({ date, dayIdx: d });
    }
    weeks.push(days);
  }

  const max = Math.max(0, ...Array.from(data.values()).map((d) => d.xp));

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <h3 className="text-white font-semibold mb-1">Habit Heatmap</h3>
      <p className="text-slate-400 text-xs mb-4">Your completed-task XP over the last 6 months</p>

      <div className="overflow-x-auto">
        <div className="flex gap-1 relative" onMouseLeave={() => setTooltip(null)}>
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2 text-[10px] text-slate-500 pt-0.5">
            <div className="h-3.5 leading-3.5">Mon</div>
            <div className="h-3.5 leading-3.5"></div>
            <div className="h-3.5 leading-3.5">Wed</div>
            <div className="h-3.5 leading-3.5"></div>
            <div className="h-3.5 leading-3.5">Fri</div>
            <div className="h-3.5 leading-3.5"></div>
            <div className="h-3.5 leading-3.5">Sun</div>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(({ date, dayIdx }) => {
                const dateStr = toLocalDateStr(date);
                const day = data.get(dateStr);
                const xp = day?.xp ?? 0;
                const count = day?.count ?? 0;
                const isFuture = dateStr > todayDateStr;
                return (
                  <div
                    key={dayIdx}
                    className={`w-3.5 h-3.5 rounded-sm transition hover:ring-1 hover:ring-white/30 cursor-pointer ${
                      isFuture ? 'bg-slate-800/30 opacity-30' : intensityColor(xp, max)
                    }`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ day: { date: dateStr, xp, count }, x: rect.left, y: rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip((prev) => prev ? { ...prev, x: rect.left, y: rect.top } : null);
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-800" />
            <div className="w-3 h-3 rounded-sm bg-amber-900/60" />
            <div className="w-3 h-3 rounded-sm bg-amber-700/70" />
            <div className="w-3 h-3 rounded-sm bg-amber-500/80" />
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.day && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 56,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-white font-medium">{formatDateNice(tooltip.day.date)}</div>
          <div className="text-slate-400">
            {tooltip.day.count > 0
              ? `${tooltip.day.count} task${tooltip.day.count !== 1 ? 's' : ''} · ${tooltip.day.xp} XP`
              : 'No tasks completed'}
          </div>
        </div>
      )}
    </div>
  );
}
