import { Coffee } from 'lucide-react';

export default function TreatedBy({ name }: { name: string | null }) {
  return (
    <div className="glass glass-hover rounded-[18px] p-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.12)' }}
        >
          <Coffee className="w-5 h-5" style={{ color: '#22D3EE' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: '#22D3EE' }}>Treated By</h3>
          <p className="font-medium text-base mt-0.5" style={{ color: '#F5F5F5' }}>
            {name ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
