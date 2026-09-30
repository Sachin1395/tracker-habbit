import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

const PRIMARY = '#F5F5F5';
const SECONDARY = '#A1A1AA';
const MUTED = '#71717A';
const RED = '#EF4444';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ error: string | null }>;
};

export default function DeleteAccountModal({ open, onClose, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const result = await onConfirm();
    if (result.error) {
      setError(result.error);
      setBusy(false);
    }
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
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.18)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Trash2 className="w-5 h-5" style={{ color: RED }} />
            </div>
            <h3 className="font-semibold text-lg" style={{ color: PRIMARY }}>Delete Account</h3>
          </div>
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

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: RED }} />
            <div className="text-sm" style={{ color: SECONDARY }}>
              This permanently deletes your account, all your tasks, XP, and stats. This action cannot be undone.
            </div>
          </div>

          {error && (
            <div className="text-sm rounded-lg px-4 py-2.5" style={{ color: RED, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={busy}
              className="btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl font-semibold transition"
              style={{ background: RED, color: '#FFFFFF' }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = '#DC2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = RED; }}
            >
              {busy ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
