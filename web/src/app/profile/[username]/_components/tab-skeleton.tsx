export default function TabSkeleton() {
  return (
    <div className="divide-y divide-zinc-800">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-24 rounded bg-zinc-800" />
                <div className="h-3 w-20 rounded bg-zinc-800/60" />
              </div>
              <div className="h-3 w-full rounded bg-zinc-800/40" />
              <div className="h-3 w-3/4 rounded bg-zinc-800/40" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-3 w-10 rounded bg-zinc-800/30" />
            <div className="h-3 w-10 rounded bg-zinc-800/30" />
            <div className="h-3 w-10 rounded bg-zinc-800/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
