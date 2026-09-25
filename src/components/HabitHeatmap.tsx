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

const WEEKS = 26;
const ORANGE = '#FF9F1C';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

function intensityStyle(xp: number, max: number): React.CSSProperties {
  if (xp === 0) return { background: 'rgba(255,255,255,0.05)' };
  const ratio = max > 0 ? xp / max : 0;
  let alpha: number;
  if (ratio <= 0.25) alpha = 0.25;
  else if (ratio <= 0.5) alpha = 0.45;
  else if (ratio <= 0.75) alpha = 0.70;
  else return { background: ORANGE };
  return { background: `rgba(255,159,28,${alpha})` };
}

export default function HabitHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ day: DayData | null; x: number; y: number } | null>(null);

  const today = new Date();
  const todayDateStr = toLocalDateStr(today);
  const todayDay = today.getDay();
  const diffToSunday = todayDay === 0 ? 0 : 7 - todayDay;
  const endSunday = addDays(today, diffToSunday);
  const startMonday = addDays(endSunday, -(WEEKS * 7 - 1));

  const weeks: { date: Date; dayIdx: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(startMonday, w * 7);
    const days: { date: Date; dayIdx: number }[] = [];
    for (let d = 0; d < 7; d++) {
      days.push({ date: addDays(weekStart, d), dayIdx: d });
    }
    weeks.push(days);
  }

  const max = Math.max(0, ...Array.from(data.values()).map((d) => d.xp));

  return (
    <div className="glass rounded-[18px] p-6">
      <h3 className="font-semibold mb-1" style={{ color: PRIMARY }}>Habit Heatmap</h3>
      <p className="text-xs mb-4" style={{ color: SECONDARY }}>Your completed-task XP over the last 6 months</p>

      <div className="overflow-x-auto">
        <div className="flex gap-1 relative" onMouseLeave={() => setTooltip(null)}>
          <div className="flex flex-col gap-1 mr-2 text-[10px] pt-0.5" style={{ color: MUTED }}>
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
                    className="w-3.5 h-3.5 rounded-sm transition cursor-pointer"
                    style={{
                      ...(isFuture ? { background: 'rgba(255,255,255,0.02)', opacity: 0.3 } : intensityStyle(xp, max)),
                    }}
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

        <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: MUTED }}>
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,159,28,0.25)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,159,28,0.45)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,159,28,0.70)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: ORANGE }} />
          </div>
          <span>More</span>
        </div>
      </div>

      {tooltip && tooltip.day && (
        <div
          className="fixed z-50 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 56,
            transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="font-medium" style={{ color: PRIMARY }}>{formatDateNice(tooltip.day.date)}</div>
          <div style={{ color: SECONDARY }}>
            {tooltip.day.count > 0
              ? `${tooltip.day.count} task${tooltip.day.count !== 1 ? 's' : ''} · ${tooltip.day.xp} XP`
              : 'No tasks completed'}
          </div>
        </div>
      )}
    </div>
  );
}
