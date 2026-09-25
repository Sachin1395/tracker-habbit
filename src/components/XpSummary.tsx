import { Zap, Calendar, CalendarDays } from 'lucide-react';
import { startOfWeek, endOfWeek, formatDateShort, todayStr } from '@/lib/dates';
import type { Task } from '@/lib/supabase';

type Props = {
  myTasks: Task[];
};

export default function XpSummary({ myTasks }: Props) {
  const today = todayStr();
  const weekStart = formatDateShort(toLocalDateStr(startOfWeek(new Date())));
  const weekEnd = formatDateShort(toLocalDateStr(endOfWeek(new Date())));

  const completed = myTasks.filter((t) => t.completed);

  const dailyXp = completed
    .filter((t) => t.task_date === today)
    .reduce((sum, t) => sum + t.xp, 0);

  const weekStartStr = toLocalDateStr(startOfWeek(new Date()));
  const weekEndStr = toLocalDateStr(endOfWeek(new Date()));
  const weeklyXp = completed
    .filter((t) => t.task_date >= weekStartStr && t.task_date <= weekEndStr)
    .reduce((sum, t) => sum + t.xp, 0);

  const overallXp = completed.reduce((sum, t) => sum + t.xp, 0);

  return (
    <div className="grid grid-cols-3 gap-4">
      <XpCard icon={<Calendar className="w-5 h-5" />} label="Daily XP" value={dailyXp} sub="Today" color="amber" />
      <XpCard icon={<CalendarDays className="w-5 h-5" />} label="Weekly XP" value={weeklyXp} sub={`${weekStart} – ${weekEnd}`} color="orange" />
      <XpCard icon={<Zap className="w-5 h-5" />} label="Overall XP" value={overallXp} sub="Lifetime" color="rose" />
    </div>
  );
}

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function XpCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: 'amber' | 'orange' | 'rose';
}) {
  const colors = {
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: 'text-orange-400' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', icon: 'text-rose-400' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-2xl p-5 border ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={c.icon}>{icon}</span>
        <span className="text-slate-300 text-sm font-medium">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value.toLocaleString()}</div>
      <div className="text-slate-500 text-xs mt-1">{sub}</div>
    </div>
  );
}
