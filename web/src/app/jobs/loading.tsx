function JobSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />

        {/* İçerik */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Meta: isim, kullanıcı adı, tarih */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-20 rounded bg-zinc-800/60" />
            <div className="h-3 w-12 rounded bg-zinc-800/40" />
          </div>

          {/* Başlık */}
          <div className="h-5 w-3/4 rounded bg-zinc-800/70" />

          {/* Açıklama satırları */}
          <div className="h-3 w-full rounded bg-zinc-800/40" />
          <div className="h-3 w-full rounded bg-zinc-800/35" />
          <div className="h-3 w-2/3 rounded bg-zinc-800/30" />

          {/* Etiketler */}
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 rounded-full bg-zinc-800/30" />
            <div className="h-5 w-20 rounded-full bg-zinc-800/30" />
            <div className="h-5 w-14 rounded-full bg-zinc-800/30" />
          </div>

          {/* Footer: bütçe & durum */}
          <div className="flex items-center gap-4 pt-1">
            <div className="h-3.5 w-20 rounded bg-zinc-800/25" />
            <div className="h-3.5 w-14 rounded bg-zinc-800/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800/50" />
          <div className="h-6 w-20 animate-pulse rounded bg-zinc-800" />
        </div>

        {/* Tab navigasyonu */}
        <div className="flex">
          {["w-24", "w-32", "w-28"].map((width, i) => (
            <div key={i} className="flex flex-1 items-center justify-center py-3">
              <div className={`h-3.5 ${width} animate-pulse rounded bg-zinc-800/50`} />
            </div>
          ))}
        </div>
      </div>

      {/* İlan iskeletleri */}
      <JobSkeleton />
      <JobSkeleton />
      <JobSkeleton />
      <JobSkeleton />
      <JobSkeleton />
    </div>
  );
}
