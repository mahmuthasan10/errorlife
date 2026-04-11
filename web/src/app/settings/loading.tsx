export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <div className="h-6 w-20 animate-pulse rounded bg-zinc-800" />
      </div>

      <div className="space-y-6 px-4 py-6">
        {/* Avatar alanı iskeleti */}
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-zinc-800" />
          <div className="h-8 w-32 rounded bg-zinc-800/60" />
        </div>

        {/* Form alanları iskeleti */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-3.5 w-24 rounded bg-zinc-800/60" />
            <div className="h-10 w-full rounded-lg bg-zinc-800/30" />
          </div>
        ))}

        {/* Şifre alanı */}
        <div className="animate-pulse space-y-2">
          <div className="h-3.5 w-28 rounded bg-zinc-800/60" />
          <div className="h-10 w-full rounded-lg bg-zinc-800/30" />
        </div>

        {/* Kaydet butonu iskeleti */}
        <div className="animate-pulse h-10 w-28 rounded-full bg-zinc-800/50" />
      </div>
    </div>
  );
}
