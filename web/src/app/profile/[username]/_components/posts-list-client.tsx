"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, FileText, Loader2 } from "lucide-react";
import { loadMoreUserPosts } from "@/app/actions/pagination";
import type { PostWithAuthor } from "@/types/database";

const PAGE_SIZE = 20;

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

        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
          {post.content}
        </p>

        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt="Gönderi görseli"
            className="mt-2 max-h-72 w-full rounded-xl object-cover"
          />
        )}

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

export default function PostsListClient({
  initialPosts,
  userId,
}: {
  initialPosts: PostWithAuthor[];
  userId: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    const cursor = posts[posts.length - 1]?.created_at;
    if (!cursor || isPending) return;
    startTransition(async () => {
      const more = await loadMoreUserPosts(userId, cursor);
      if (more.length > 0) setPosts((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <FileText size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz gönderi paylaşılmadı.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-zinc-800">
        {posts.map((post) => (
          <PostRow key={post.id} post={post} />
        ))}
      </div>

      {hasMore && (
        <div className="py-6 text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Yükleniyor...
              </span>
            ) : (
              "Daha Fazla Yükle"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
