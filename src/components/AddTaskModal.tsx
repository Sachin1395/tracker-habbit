import { useState } from 'react';
import { X, Zap, Calendar, CheckCircle2 } from 'lucide-react';
import { XP_VALUES } from '@/lib/supabase';
import { todayStr } from '@/lib/dates';

const ORANGE = '#FF9F1C';
const GREEN = '#22C55E';
const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';

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
    try {
      await onAdd(taskName.trim(), xp, taskDate, completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
      setBusy(false);
      return;
    }
    setBusy(false);
    setTaskName('');
    setXp(10);
    setTaskDate(todayStr());
    setCompleted(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-md rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-semibold text-lg" style={{ color: PRIMARY }}>Add Task</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={{ color: MUTED }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: SECONDARY }}>Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              autoFocus
              className="glass-input w-full px-4 py-2.5 rounded-xl text-white placeholder-slate-500"
              style={{ color: PRIMARY }}
              placeholder="What do you need to do?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: SECONDARY }}>
              <Zap className="w-4 h-4 inline mr-1" style={{ color: ORANGE }} />
              XP Value
            </label>
            <div className="grid grid-cols-5 gap-2">
              {XP_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setXp(v)}
                  className="py-2.5 rounded-xl font-semibold text-sm transition"
                  style={
                    xp === v
                      ? { background: ORANGE, color: '#000000' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: SECONDARY }
                  }
                  onMouseEnter={(e) => {
                    if (xp !== v) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    if (xp !== v) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: SECONDARY }}>
              <Calendar className="w-4 h-4 inline mr-1" style={{ color: MUTED }} />
              Date
            </label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl"
              style={{ color: PRIMARY, colorScheme: 'dark' }}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setCompleted(!completed)}
              className="w-6 h-6 rounded-md flex items-center justify-center transition"
              style={
                completed
                  ? { background: GREEN, color: '#000000' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }
              }
            >
              {completed && <CheckCircle2 className="w-4 h-4" />}
            </button>
            <span className="text-sm" style={{ color: SECONDARY }}>Mark as completed now</span>
          </label>

          {error && (
            <div className="text-sm rounded-lg px-4 py-2.5" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full py-2.5"
          >
            {busy ? 'Adding…' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
