import { CheckCircle2, Circle, Zap } from 'lucide-react';
import type { TaskWithProfile } from '@/lib/supabase';

export default function TodaysTasks({ tasks }: { tasks: TaskWithProfile[] }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-white font-semibold">Today's Tasks (All Users)</h3>
      </div>
      <div className="divide-y divide-slate-800 max-h-[24rem] overflow-y-auto">
        {tasks.length === 0 && (
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            No tasks scheduled for today yet.
          </div>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-6 py-3">
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded">
                  {task.profiles?.name ?? 'Unknown'}
                </span>
                <span
                  className={`text-sm truncate ${
                    task.completed ? 'text-slate-500 line-through' : 'text-white'
                  }`}
                >
                  {task.task_name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
              {task.xp}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
