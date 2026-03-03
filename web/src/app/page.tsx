import { Home, Briefcase, User, LogOut, Heart, MessageCircle, Bookmark, TrendingUp } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import { logout } from "./actions";

// Dummy veriler — PostWithAuthor tipine uygun
const dummyPosts: PostWithAuthor[] = [
  {
    id: "1",
    user_id: "u1",
    content:
      "Next.js 16'da middleware ile Supabase Auth entegrasyonu yaparken cookie yönetimi gerçekten zorladı. Sonunda @supabase/ssr paketi ile çözdüm. Aynı sorunu yaşayan var mı?",
    image_url: null,
    like_count: 12,
    comment_count: 3,
    bookmark_count: 2,
    created_at: "2026-03-02T10:30:00Z",
    updated_at: "2026-03-02T10:30:00Z",
    profiles: {
      id: "u1",
      username: "ahmet_dev",
      display_name: "Ahmet Yılmaz",
      avatar_url: null,
      bio: "Full-stack developer",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    post_tags: [
      { tags: { id: "t1", name: "Next.js", slug: "nextjs", created_at: "2026-01-01T00:00:00Z" } },
      { tags: { id: "t2", name: "Supabase", slug: "supabase", created_at: "2026-01-01T00:00:00Z" } },
    ],
  },
  {
    id: "2",
    user_id: "u2",
    content:
      "TypeScript strict mode açıkken 'any' kullanmak yerine generic type'lar ile çalışmak başta zor ama uzun vadede hayat kurtarıyor. Type safety > hız.",
    image_url: null,
    like_count: 24,
    comment_count: 7,
    bookmark_count: 5,
    created_at: "2026-03-02T09:15:00Z",
    updated_at: "2026-03-02T09:15:00Z",
    profiles: {
      id: "u2",
      username: "elif_codes",
      display_name: "Elif Kaya",
      avatar_url: null,
      bio: "TypeScript enthusiast",
      created_at: "2026-01-15T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    },
    post_tags: [
      { tags: { id: "t3", name: "TypeScript", slug: "typescript", created_at: "2026-01-01T00:00:00Z" } },
    ],
  },
  {
    id: "3",
    user_id: "u3",
    content:
      "Tailwind CSS v4 ile gelen @theme inline özelliği CSS variable yönetimini çok kolaylaştırmış. Dark mode geçişleri artık çok daha temiz.",
    image_url: null,
    like_count: 18,
    comment_count: 4,
    bookmark_count: 3,
    created_at: "2026-03-01T22:00:00Z",
    updated_at: "2026-03-01T22:00:00Z",
    profiles: {
      id: "u3",
      username: "can_frontend",
      display_name: "Can Demir",
      avatar_url: null,
      bio: "Frontend developer & UI designer",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
    },
    post_tags: [
      { tags: { id: "t4", name: "Tailwind", slug: "tailwind", created_at: "2026-01-01T00:00:00Z" } },
      { tags: { id: "t5", name: "CSS", slug: "css", created_at: "2026-01-01T00:00:00Z" } },
    ],
  },
];

const trendingTags = [
  { name: "React", slug: "react", postCount: 142 },
  { name: "Next.js", slug: "nextjs", postCount: 98 },
  { name: "TypeScript", slug: "typescript", postCount: 87 },
  { name: "Supabase", slug: "supabase", postCount: 65 },
  { name: "TailwindCSS", slug: "tailwindcss", postCount: 53 },
];

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  return `${diffDays}g`;
}

export default function HomePage() {
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
          <NavLink href="/profile" icon={<User size={22} />} label="Profil" />

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

        {/* Sorun paylaş inputu */}
        <div className="border-b border-zinc-800 px-4 py-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
              <User size={20} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="Bir sorun mu yaşıyorsun? Paylaş..."
                rows={2}
                className="w-full resize-none bg-transparent text-lg text-white placeholder-zinc-600 outline-none"
              />
              <div className="flex items-center justify-end border-t border-zinc-800 pt-3">
                <button className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90">
                  Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gönderi listesi */}
        {dummyPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
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

function PostCard({ post }: { post: PostWithAuthor }) {
  return (
    <article className="border-b border-zinc-800 px-4 py-4 transition-colors hover:bg-zinc-950/50">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <span className="text-sm font-bold text-zinc-300">
            {post.profiles.display_name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Kullanıcı bilgisi */}
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-white">
              {post.profiles.display_name}
            </span>
            <span className="truncate text-zinc-500">
              @{post.profiles.username}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="shrink-0 text-zinc-500">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          {/* İçerik */}
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
            {post.content}
          </p>

          {/* Etiketler */}
          {post.post_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.post_tags.map(({ tags }) => (
                <span
                  key={tags.id}
                  className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700"
                >
                  #{tags.name}
                </span>
              ))}
            </div>
          )}

          {/* Etkileşim butonları */}
          <div className="mt-3 flex max-w-md items-center justify-between text-zinc-500">
            <button className="flex items-center gap-2 transition-colors hover:text-blue-400">
              <MessageCircle size={18} />
              <span className="text-sm">{post.comment_count}</span>
            </button>
            <button className="flex items-center gap-2 transition-colors hover:text-pink-500">
              <Heart size={18} />
              <span className="text-sm">{post.like_count}</span>
            </button>
            <button className="flex items-center gap-2 transition-colors hover:text-green-400">
              <Bookmark size={18} />
              <span className="text-sm">{post.bookmark_count}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
