export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-stone-600">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-[#8b6914]"
        role="status"
        aria-label="Indlæser"
      />
      <p className="text-sm font-medium text-stone-800">Indlæser LOOMY…</p>
    </div>
  );
}
