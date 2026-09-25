import { CheckCircle2, Circle, Trash2, Zap } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { formatDateShort } from '@/lib/dates';

const ORANGE = '#FF9F1C';
const GREEN = '#22C55E';
const MUTED = '#71717A';
const PRIMARY = '#F5F5F5';

type Props = {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function MyTasks({ tasks, onToggle, onDelete }: Props) {
  return (
    <div className="glass rounded-[18px] overflow-hidden">
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="font-semibold" style={{ color: PRIMARY }}>My Tasks</h3>
      </div>
      <div className="max-h-[24rem] overflow-y-auto">
        {tasks.length === 0 && (
          <div className="px-6 py-8 text-center text-sm" style={{ color: MUTED }}>
            No tasks yet. Click "Add Task" to get started.
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 px-6 py-3 transition"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <button
              onClick={() => onToggle(task)}
              className="flex-shrink-0 transition hover:scale-110"
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: GREEN }} />
              ) : (
                <Circle className="w-5 h-5" style={{ color: '#3F3F46' }} />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <span
                className="text-sm"
                style={task.completed ? { color: MUTED, textDecoration: 'line-through' } : { color: PRIMARY }}
              >
                {task.task_name}
              </span>
              <span className="text-xs ml-2" style={{ color: MUTED }}>{formatDateShort(task.task_date)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: ORANGE }}>
              <Zap className="w-3.5 h-3.5" />
              {task.xp}
            </div>
            <button
              onClick={() => onDelete(task)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition"
              style={{ color: MUTED }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
