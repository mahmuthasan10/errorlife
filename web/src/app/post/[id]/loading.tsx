function CommentSkeleton() {
  return (
    <div className="animate-pulse flex gap-3 border-b border-zinc-800 px-4 py-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-20 rounded bg-zinc-800" />
          <div className="h-3 w-16 rounded bg-zinc-800/50" />
        </div>
        <div className="h-3 w-full rounded bg-zinc-800/40" />
        <div className="h-3 w-4/5 rounded bg-zinc-800/30" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <div className="h-6 w-24 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Ana gönderi iskeleti */}
      <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 rounded bg-zinc-800" />
              <div className="h-3 w-20 rounded bg-zinc-800/60" />
            </div>
            <div className="h-4 w-full rounded bg-zinc-800/50" />
            <div className="h-4 w-5/6 rounded bg-zinc-800/40" />
            <div className="h-4 w-3/4 rounded bg-zinc-800/30" />
            <div className="flex items-center gap-6 pt-2">
              <div className="h-4 w-12 rounded bg-zinc-800/25" />
              <div className="h-4 w-12 rounded bg-zinc-800/25" />
              <div className="h-4 w-12 rounded bg-zinc-800/25" />
            </div>
          </div>
        </div>
      </div>

      {/* Yorum girişi iskeleti */}
      <div className="animate-pulse border-b border-zinc-800 px-4 py-3">
        <div className="h-10 w-full rounded-lg bg-zinc-800/30" />
      </div>

      {/* Yorumlar */}
      <CommentSkeleton />
      <CommentSkeleton />
      <CommentSkeleton />
    </div>
  );
}
