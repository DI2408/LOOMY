export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="h-4 w-32 animate-pulse rounded-full bg-stone-200/80" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-stone-200/70" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-stone-200/60" />
        <div className="flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-stone-200/70" />
          <div className="h-11 w-28 animate-pulse rounded-xl bg-stone-200/50" />
        </div>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">LOOMY</p>
    </div>
  );
}
