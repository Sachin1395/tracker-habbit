import { Coffee } from 'lucide-react';

export default function TreatedBy({ name }: { name: string | null }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-500/15 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-teal-400 font-semibold text-sm uppercase tracking-wide">Treated By</h3>
          <p className="text-white font-medium text-base mt-0.5">
            {name ?? '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
