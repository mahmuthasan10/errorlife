import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { getTrendingTags, getAllTags } from "@/lib/tag-queries";

export default async function TrendingSection() {
  const [trending, allTags] = await Promise.all([
    getTrendingTags(10),
    getAllTags(),
  ]);

  return (
    <div className="space-y-6">
      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <TrendingUp size={16} />
            <span>Trend Konular</span>
          </div>
          <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 overflow-hidden">
            {trending.map((tag, i) => (
              <Link
                key={tag.id}
                href={`/search?tag=${tag.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900 transition-colors"
              >
                <div>
                  <p className="text-xs text-zinc-500">#{i + 1} Trend</p>
                  <p className="font-bold text-white">#{tag.name}</p>
                  <p className="text-xs text-zinc-500">{tag.post_count} gönderi</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tüm etiketler */}
      {allTags.length > 0 && (
        <section>
          <p className="mb-3 text-sm font-semibold text-zinc-400">Tüm Etiketler</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?tag=${tag.slug}`}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white hover:text-white"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
