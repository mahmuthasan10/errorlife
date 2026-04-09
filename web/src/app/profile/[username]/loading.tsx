export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-zinc-800 bg-black px-4 py-2">
        <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-800/50" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-800/50" />
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="relative">
        <div className="h-48 animate-pulse bg-zinc-900" />

        {/* Avatar — banner üzerine taşıyor */}
        <div className="absolute -bottom-16 left-4">
          <div className="h-32 w-32 animate-pulse rounded-full border-4 border-black bg-zinc-800" />
        </div>

        {/* Aksiyon butonu iskeleti */}
        <div className="flex justify-end px-4 pt-3">
          <div className="h-9 w-32 animate-pulse rounded-full bg-zinc-800/50" />
        </div>
      </div>

      {/* ── Profil Bilgileri ── */}
      <div className="mt-10 animate-pulse px-4">
        {/* İsim */}
        <div className="h-6 w-44 rounded bg-zinc-800" />
        {/* Kullanıcı adı */}
        <div className="mt-1.5 h-4 w-28 rounded bg-zinc-800/50" />

        {/* Bio */}
        <div className="mt-4 space-y-2">
          <div className="h-3.5 w-full rounded bg-zinc-800/40" />
          <div className="h-3.5 w-4/5 rounded bg-zinc-800/35" />
        </div>

        {/* Katılım tarihi */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-800/30" />
          <div className="h-3.5 w-40 rounded bg-zinc-800/30" />
        </div>

        {/* Takipçi sayıları */}
        <div className="mt-3 flex gap-5">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-6 rounded bg-zinc-800/50" />
            <div className="h-3.5 w-20 rounded bg-zinc-800/30" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-6 rounded bg-zinc-800/50" />
            <div className="h-3.5 w-16 rounded bg-zinc-800/30" />
          </div>
        </div>
      </div>

      {/* ── Tab Navigasyonu ── */}
      <div className="mt-4 flex border-b border-zinc-800">
        {["w-20", "w-20", "w-16"].map((width, i) => (
          <div key={i} className="flex flex-1 items-center justify-center gap-2 py-3">
            <div className="h-4 w-4 animate-pulse rounded bg-zinc-800/40" />
            <div className={`h-3.5 ${width} animate-pulse rounded bg-zinc-800/40`} />
          </div>
        ))}
      </div>

      {/* ── Tab İçerik İskeleti ── */}
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse px-4 py-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-24 rounded bg-zinc-800" />
                  <div className="h-3 w-16 rounded bg-zinc-800/60" />
                </div>
                <div className="h-3 w-full rounded bg-zinc-800/40" />
                <div className="h-3 w-3/4 rounded bg-zinc-800/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
