import { Home, Briefcase, User, LogOut, TrendingUp } from "lucide-react";
import type { PostWithAuthor } from "@/types/database";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./actions";
import CreatePostForm from "./_components/create-post-form";
import DeletePostButton from "./_components/delete-post-button";
import { LikeButton, BookmarkButton, CommentButton } from "./_components/interaction-buttons";

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

        {/* Sorun paylaş formu */}
        <CreatePostForm />

        {/* Gönderi listesi */}
        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center text-zinc-500">
            <p className="text-lg">Henüz gönderi yok.</p>
            <p className="mt-1 text-sm">İlk gönderiyi sen paylaş!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwner={currentUserId === post.user_id}
              isLiked={likedPostIds.has(post.id)}
              isBookmarked={bookmarkedPostIds.has(post.id)}
            />
          ))
        )}
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

function PostCard({
  post,
  isOwner,
  isLiked,
  isBookmarked,
}: {
  post: PostWithAuthor;
  isOwner: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
}) {
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
          {/* Kullanıcı bilgisi + Sil butonu */}
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
            {isOwner && <DeletePostButton postId={post.id} />}
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
          <div className="mt-3 flex max-w-md items-center justify-between">
            <CommentButton postId={post.id} count={post.comment_count} />
            <LikeButton
              postId={post.id}
              initialActive={isLiked}
              initialCount={post.like_count}
            />
            <BookmarkButton
              postId={post.id}
              initialActive={isBookmarked}
              initialCount={post.bookmark_count}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
