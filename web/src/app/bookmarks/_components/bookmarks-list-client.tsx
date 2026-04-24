"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Loader2 } from "lucide-react";
import { loadMoreBookmarks } from "@/app/actions/pagination";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
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

function BookmarkedPostRow({ post }: { post: PostWithAuthor }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-950/50"
    >
      <Link
        href={`/profile/${post.profiles.username}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 transition-opacity hover:opacity-80"
      >
        <span className="text-sm font-bold text-zinc-300">
          {post.profiles.display_name.charAt(0).toUpperCase()}
        </span>
      </Link>

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

        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
          {post.content}
        </p>

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
          <span className="flex items-center gap-1 text-green-400">
            <Bookmark size={14} className="fill-green-400" />
            {post.bookmark_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BookmarksListClient({
  initialPosts,
  initialCursor,
}: {
  initialPosts: PostWithAuthor[];
  initialCursor: string | null;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadError, setLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor || isPending) return;
    startTransition(async () => {
      const { posts: more, nextCursor, fetchError } = await loadMoreBookmarks(cursor);
      if (fetchError) {
        setLoadError(true);
        return;
      }
      setLoadError(false);
      if (more.length > 0) setPosts((prev) => [...prev, ...more]);
      setCursor(nextCursor);
    });
  }

  const sentinelRef = useInfiniteScroll(loadMore, !!cursor && !loadError);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <Bookmark size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz kaydedilen gönderi yok.</p>
        <p className="text-sm">
          İlgini çeken gönderileri yer imi simgesine tıklayarak kaydedebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-zinc-800">
        {posts.map((post) => (
          <BookmarkedPostRow key={post.id} post={post} />
        ))}
      </div>

      {loadError ? (
        <div className="py-4 text-center">
          <button
            onClick={loadMore}
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Yükleme başarısız. Tekrar dene
          </button>
        </div>
      ) : cursor ? (
        <div ref={sentinelRef} className="py-6 text-center text-zinc-500">
          {isPending && <Loader2 size={20} className="mx-auto animate-spin" />}
        </div>
      ) : null}
    </div>
  );
}
