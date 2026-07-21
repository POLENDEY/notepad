export default function Loading() {
  return (
    <div className="page-shell animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-stone-200/80 dark:bg-stone-800" />
      <div className="h-4 w-64 rounded bg-stone-200/60 dark:bg-stone-800/80" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-2xl bg-stone-200/70 dark:bg-stone-800" />
        <div className="h-24 rounded-2xl bg-stone-200/70 dark:bg-stone-800" />
        <div className="h-24 rounded-2xl bg-stone-200/70 dark:bg-stone-800" />
      </div>
      <div className="h-40 rounded-3xl bg-stone-200/60 dark:bg-stone-800/80" />
    </div>
  );
}
