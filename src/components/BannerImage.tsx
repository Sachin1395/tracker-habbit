import { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';

type Props = {
  imageSrc?: string | null;
};

export default function BannerImage({ imageSrc }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900" style={{ aspectRatio: '21 / 6' }}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
          <ImageIcon className="w-7 h-7" />
          <span className="text-sm font-medium text-slate-500">Banner Image</span>
          <span className="text-xs text-slate-600">Replace with your image</span>
        </div>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition z-10"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
