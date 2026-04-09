function PostSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />

        {/* İçerik */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* İsim & kullanıcı adı */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-800/60" />
          </div>

          {/* Metin satırları */}
          <div className="h-3 w-full rounded bg-zinc-800/50" />
          <div className="h-3 w-5/6 rounded bg-zinc-800/40" />
          <div className="h-3 w-2/3 rounded bg-zinc-800/30" />

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-8 pt-1">
            <div className="h-4 w-10 rounded bg-zinc-800/25" />
            <div className="h-4 w-10 rounded bg-zinc-800/25" />
            <div className="h-4 w-10 rounded bg-zinc-800/25" />
            <div className="h-4 w-10 rounded bg-zinc-800/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-1">
      {/* Orta Kolon — Feed İskeleti */}
      <main className="flex-1 border-r border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
          <div className="h-6 w-28 animate-pulse rounded bg-zinc-800" />
        </div>

        {/* Post oluşturma alanı iskeleti */}
        <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1">
              <div className="h-10 w-full rounded-lg bg-zinc-800/30" />
            </div>
          </div>
        </div>

        {/* Post iskeletleri */}
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </main>

      {/* Sağ Kolon — Trend İskeleti */}
      <aside className="sticky top-0 hidden h-screen w-80 px-6 py-6 lg:block">
        <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-4 h-6 w-36 rounded bg-zinc-800" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3.5 w-24 rounded bg-zinc-800/60" />
                <div className="ml-6 h-3 w-16 rounded bg-zinc-800/30" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
