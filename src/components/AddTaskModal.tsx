import { useState } from 'react';
import { X, Zap, Calendar, CheckCircle2 } from 'lucide-react';
import { XP_VALUES } from '@/lib/supabase';
import { todayStr } from '@/lib/dates';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (taskName: string, xp: number, taskDate: string, completed: boolean) => Promise<void>;
};

export default function AddTaskModal({ open, onClose, onAdd }: Props) {
  const [taskName, setTaskName] = useState('');
  const [xp, setXp] = useState<number>(10);
  const [taskDate, setTaskDate] = useState(todayStr());
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) {
      setError('Task name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    await onAdd(taskName.trim(), xp, taskDate, completed);
    setBusy(false);
    // Reset
    setTaskName('');
    setXp(10);
    setTaskDate(todayStr());
    setCompleted(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold text-lg">Add Task</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
              placeholder="What do you need to do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Zap className="w-4 h-4 inline mr-1 text-amber-400" />
              XP Value
            </label>
            <div className="grid grid-cols-5 gap-2">
              {XP_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setXp(v)}
                  className={`py-2.5 rounded-lg font-semibold text-sm transition ${
                    xp === v
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1 text-slate-400" />
              Date
            </label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition [color-scheme:dark]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
                completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              {completed && <CheckCircle2 className="w-4 h-4" />}
            </button>
            <span className="text-sm text-slate-300">Mark as completed now</span>
          </label>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold hover:from-amber-300 hover:to-orange-400 transition disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
