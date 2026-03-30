import { Home, Briefcase, User, LogOut, TrendingUp, Bell, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { PostWithAuthor } from "@/types/database";
import { logout } from "./actions";
import CreatePostForm from "./_components/create-post-form";
import RealtimeFeed from "./_components/realtime-feed";

const trendingTags = [
  { name: "React", slug: "react", postCount: 142 },
  { name: "Next.js", slug: "nextjs", postCount: 98 },
  { name: "TypeScript", slug: "typescript", postCount: 87 },
  { name: "Supabase", slug: "supabase", postCount: 65 },
  { name: "TailwindCSS", slug: "tailwindcss", postCount: 53 },
];

async function getPosts(): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (*),
      post_tags (
        tags (*)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return (data as PostWithAuthor[]) ?? [];
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getUserInteractions(userId: string) {
  const supabase = await createClient();

  const [likesResult, bookmarksResult] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", userId),
    supabase.from("bookmarks").select("post_id").eq("user_id", userId),
  ]);

  const likedPostIds = new Set(
    likesResult.data?.map((l) => l.post_id) ?? []
  );
  const bookmarkedPostIds = new Set(
    bookmarksResult.data?.map((b) => b.post_id) ?? []
  );

  return { likedPostIds, bookmarkedPostIds };
}

export default async function HomePage() {
  const [posts, currentUser] = await Promise.all([
    getPosts(),
    getCurrentUser(),
  ]);

  const currentUserId = currentUser?.id ?? null;

  // Profil linki için username'i çek
  let currentUsername: string | null = null;
  if (currentUserId) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", currentUserId)
      .maybeSingle();
    currentUsername = profile?.username ?? null;
  }

  const { likedPostIds, bookmarkedPostIds } = currentUserId
    ? await getUserInteractions(currentUserId)
    : { likedPostIds: new Set<string>(), bookmarkedPostIds: new Set<string>() };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl">
      {/* Sol Kolon — Navigasyon */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-zinc-800 px-4 py-6">
        <div className="space-y-2">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <span className="text-lg font-bold text-black">E</span>
            </div>
            <span className="text-xl font-bold">ErrorLife</span>
          </div>

          <NavLink href="/" icon={<Home size={22} />} label="Ana Sayfa" active />
          <NavLink href="/jobs" icon={<Briefcase size={22} />} label="İlanlar" />
          <NavLink href="/notifications" icon={<Bell size={22} />} label="Bildirimler" />
          <NavLink href="/messages" icon={<Mail size={22} />} label="Mesajlar" />
          <NavLink href={currentUsername ? `/profile/${currentUsername}` : "/login"} icon={<User size={22} />} label="Profil" />

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-4 rounded-full px-3 py-3 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <LogOut size={22} />
              <span className="text-lg">Çıkış</span>
            </button>
          </form>
        </div>

        <button className="w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90">
          Sorun Paylaş
        </button>
      </aside>

      {/* Orta Kolon — Akış (Feed) */}
      <main className="flex-1 border-r border-zinc-800">
        {/* Üst başlık */}
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
          <h2 className="text-xl font-bold">Ana Sayfa</h2>
        </div>

        {/* Sorun paylaş formu */}
        <CreatePostForm />

        {/* Gönderi listesi — Realtime */}
        <RealtimeFeed
          initialPosts={posts}
          currentUserId={currentUserId}
          likedPostIds={Array.from(likedPostIds)}
          bookmarkedPostIds={Array.from(bookmarkedPostIds)}
        />
      </main>

      {/* Sağ Kolon — Trend Etiketler */}
      <aside className="sticky top-0 hidden h-screen w-80 px-6 py-6 lg:block">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="mb-4 text-xl font-bold">Trend Etiketler</h3>
          <div className="space-y-4">
            {trendingTags.map((tag) => (
              <div key={tag.slug} className="group cursor-pointer">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-zinc-500" />
                  <span className="font-semibold text-white group-hover:underline">
                    #{tag.name}
                  </span>
                </div>
                <p className="ml-6 text-sm text-zinc-500">
                  {tag.postCount} gönderi
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-4 rounded-full px-3 py-3 transition-colors hover:bg-zinc-900 ${
        active ? "font-bold text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-lg">{label}</span>
    </a>
  );
}

