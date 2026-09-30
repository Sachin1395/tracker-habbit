import { Zap, Calendar, CalendarDays } from 'lucide-react';

const ORANGE = '#FF9F1C';

type Props = {
  dailyXp: number;
  weeklyXp: number;
  overallXp: number;
  weekLabel: string;
};

export default function XpSummary({ dailyXp, weeklyXp, overallXp, weekLabel }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <XpCard icon={<Calendar className="w-5 h-5" />} label="Daily XP" value={dailyXp} sub="Today" />
      <XpCard icon={<CalendarDays className="w-5 h-5" />} label="Weekly XP" value={weeklyXp} sub={weekLabel} />
      <XpCard icon={<Zap className="w-5 h-5" />} label="Overall XP" value={overallXp} sub="Lifetime" />
    </div>
  );
}

function XpCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="glass glass-hover rounded-[18px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: ORANGE }}>{icon}</span>
        <span className="text-sm font-medium" style={{ color: '#A1A1AA' }}>{label}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color: ORANGE }}>{value.toLocaleString()}</div>
      <div className="text-xs mt-1" style={{ color: '#71717A' }}>{sub}</div>
    </div>
  );
}
