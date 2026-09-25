import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  imageSrc?: string | null;
};

export default function BannerImage({ imageSrc }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-[20px] border border-white/10"
      style={{ aspectRatio: '1600 / 595' }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-sm font-medium text-zinc-400">
            Banner Image
          </span>
          <span className="text-xs text-zinc-500">
            Replace with your image
          </span>
        </div>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center z-20"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
