import { useState } from 'react';
import { X, ImageIcon } from 'lucide-react';

type Props = {
  imageSrc?: string | null;
};

export default function BannerImage({ imageSrc }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="glass relative w-full overflow-hidden rounded-[20px]"
      style={{ height: '200px' }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <ImageIcon className="w-8 h-8" style={{ color: '#71717A' }} />
          <span className="text-sm font-medium" style={{ color: '#A1A1AA' }}>Banner Image</span>
          <span className="text-xs" style={{ color: '#71717A' }}>Replace with your image</span>
        </div>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition z-10"
        style={{
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" style={{ color: '#F5F5F5' }} />
      </button>
    </div>
  );
}
