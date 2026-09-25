import { CheckCircle2, Circle, Zap } from 'lucide-react';
import type { TaskWithProfile } from '@/lib/supabase';

const ORANGE = '#FF9F1C';
const GREEN = '#22C55E';
const MUTED = '#71717A';
const PRIMARY = '#F5F5F5';

export default function TodaysTasks({ tasks }: { tasks: TaskWithProfile[] }) {
  return (
    <div className="glass rounded-[18px] overflow-hidden">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="font-semibold" style={{ color: PRIMARY }}>Today's Tasks (All Users)</h3>
      </div>
      <div className="max-h-[24rem] overflow-y-auto">
        {tasks.length === 0 && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: MUTED }}>
            No tasks scheduled for today yet.
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 px-6 py-3 transition"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: GREEN }} />
            ) : (
              <Circle className="w-5 h-5 flex-shrink-0" style={{ color: '#3F3F46' }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#A1A1AA' }}
                >
                  {task.profiles?.name ?? 'Unknown'}
                </span>
                <span
                  className="text-sm truncate"
                  style={task.completed ? { color: MUTED, textDecoration: 'line-through' } : { color: PRIMARY }}
                >
                  {task.task_name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: ORANGE }}>
              <Zap className="w-3.5 h-3.5" />
              {task.xp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
