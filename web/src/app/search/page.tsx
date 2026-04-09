import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Users, Briefcase } from "lucide-react";
import SearchInput from "./_components/search-input";
import TrendingSection from "./_components/trending-section";
import SearchResults from "./_components/search-results";

export const metadata: Metadata = {
  title: "Keşfet | ErrorLife",
  description: "Gönderiler, kullanıcılar ve ilanlar arasında arama yapın.",
};

type Tab = "posts" | "users" | "jobs";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "posts", label: "Gönderiler", icon: <FileText size={16} /> },
  { key: "users", label: "Kullanıcılar", icon: <Users size={16} /> },
  { key: "jobs", label: "İlanlar", icon: <Briefcase size={16} /> },
];

interface SearchPageProps {
  searchParams: Promise<{ q?: string; tag?: string; tab?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const tagSlug = params.tag?.trim() ?? "";
  const activeTab: Tab =
    params.tab === "users" || params.tab === "jobs" ? params.tab : "posts";

  const hasSearch = query.length > 0 || tagSlug.length > 0;
  const title = tagSlug
    ? `#${tagSlug}`
    : query
    ? `"${query}" için sonuçlar`
    : "Keşfet";

  return (
    <div className="flex flex-1">
      <main className="flex-1 border-r border-zinc-800">
        {/* Başlık */}
        <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
          <h2 className="mb-3 text-xl font-bold">Keşfet</h2>
          <SearchInput />
        </div>

        {hasSearch ? (
          <>
            {/* Tab Bar */}
            <div className="flex border-b border-zinc-800">
              {tabs.map(({ key, label, icon }) => {
                const tabParams = new URLSearchParams();
                if (query) tabParams.set("q", query);
                if (tagSlug) tabParams.set("tag", tagSlug);
                tabParams.set("tab", key);
                const isActive = activeTab === key;
                return (
                  <Link
                    key={key}
                    href={`/search?${tabParams.toString()}`}
                    className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors hover:bg-zinc-900 ${
                      isActive
                        ? "border-b-2 border-white text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    {icon}
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Arama başlığı */}
            {(query || tagSlug) && (
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="text-sm text-zinc-400">{title}</p>
              </div>
            )}

            {/* Sonuçlar */}
            <Suspense
              key={`${query}-${tagSlug}-${activeTab}`}
              fallback={
                <div className="flex justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                </div>
              }
            >
              <SearchResults query={query} tagSlug={tagSlug} tab={activeTab} />
            </Suspense>
          </>
        ) : (
          /* Arama yoksa trending + tüm etiketler */
          <div className="px-4 py-6">
            <Suspense
              fallback={
                <div className="flex justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                </div>
              }
            >
              <TrendingSection />
            </Suspense>
          </div>
        )}
      </main>

      {/* Sağ kolon — masaüstünde boş spacer */}
      <aside className="hidden w-80 lg:block" />
    </div>
  );
}
