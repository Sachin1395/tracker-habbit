import { CheckCircle2, Circle, Trash2, Zap } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { formatDateShort } from '@/lib/dates';

type Props = {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export default function MyTasks({ tasks, onToggle, onDelete }: Props) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-white font-semibold">My Tasks</h3>
      </div>
      <div className="divide-y divide-slate-800 max-h-[24rem] overflow-y-auto">
        {tasks.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No tasks yet. Click "Add Task" to get started.
          </div>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-3 px-6 py-3 hover:bg-slate-800/40 transition">
            <button
              onClick={() => onToggle(task)}
              className="flex-shrink-0 transition hover:scale-110"
              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 hover:text-emerald-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${
                  task.completed ? 'text-slate-500 line-through' : 'text-white'
                }`}
              >
                {task.task_name}
              </span>
              <span className="text-xs text-slate-500 ml-2">{formatDateShort(task.task_date)}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
              {task.xp}
            </div>
            <button
              onClick={() => onDelete(task)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition"
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
