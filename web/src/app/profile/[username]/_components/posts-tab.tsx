import Link from "next/link";
import { Heart, MessageCircle, Bookmark, FileText } from "lucide-react";
import { getUserPosts } from "@/lib/profile-queries";
import type { PostWithAuthor } from "@/types/database";

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

function PostRow({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-950/50"
    >
      {/* Avatar */}
      {post.profiles.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.profiles.avatar_url}
          alt={post.profiles.display_name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <span className="text-sm font-bold text-zinc-300">
            {post.profiles.display_name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Meta */}
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate font-bold text-white">
            {post.profiles.display_name}
          </span>
          <span className="truncate text-zinc-500">
            @{post.profiles.username}
          </span>
          <span className="text-zinc-600">&middot;</span>
          <span className="shrink-0 text-zinc-500">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>

        {/* İçerik */}
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
          {post.content}
        </p>

        {/* Görsel */}
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt="Gönderi görseli"
            className="mt-2 max-h-72 w-full rounded-xl object-cover"
          />
        )}

        {/* Etiketler */}
        {post.post_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {post.post_tags.map(({ tags }) => (
              <span
                key={tags.id}
                className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
              >
                #{tags.name}
              </span>
            ))}
          </div>
        )}

        {/* İstatistikler */}
        <div className="mt-2 flex items-center gap-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Heart size={14} />
            {post.like_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={14} />
            {post.comment_count}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark size={14} />
            {post.bookmark_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function PostsTab({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <FileText size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz gönderi paylaşılmadı.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </div>
  );
}
