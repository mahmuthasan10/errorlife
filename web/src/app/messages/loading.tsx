function ChatRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-800" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-28 rounded bg-zinc-800" />
          <div className="h-3 w-10 rounded bg-zinc-800/50" />
        </div>
        <div className="h-3 w-3/4 rounded bg-zinc-800/40" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <div className="h-6 w-24 animate-pulse rounded bg-zinc-800" />
      </div>

      {/* Sohbet satırı iskeletleri */}
      <ChatRowSkeleton />
      <ChatRowSkeleton />
      <ChatRowSkeleton />
      <ChatRowSkeleton />
      <ChatRowSkeleton />
      <ChatRowSkeleton />
    </div>
  );
}
