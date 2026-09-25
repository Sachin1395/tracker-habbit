<div className="relative w-full overflow-hidden rounded-[20px] border border-white/10">
  {imageSrc ? (
    <img
      src={imageSrc}
      alt="Banner"
      className="block w-full h-auto"
    />
  ) : (
    <div className="w-full aspect-[1600/595] flex flex-col items-center justify-center gap-2">
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
