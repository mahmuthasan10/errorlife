"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { loadMoreFeedPosts } from "@/app/actions/pagination";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { PostWithAuthor } from "@/types/database";
import DeletePostButton from "./delete-post-button";
import EditPostButton from "./edit-post-button";
import { usePostFeed } from "./post-feed-context";

const PAGE_SIZE = 20;
import {
  LikeButton,
  BookmarkButton,
  CommentButton,
  ShareButton,
} from "./interaction-buttons";
import ClickGuard from "./click-guard";

interface RealtimeFeedProps {
  initialPosts: PostWithAuthor[];
  currentUserId: string | null;
  likedPostIds: string[];
  bookmarkedPostIds: string[];
}

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

export default function RealtimeFeed({
  initialPosts,
  currentUserId,
  likedPostIds,
  bookmarkedPostIds,
}: RealtimeFeedProps) {
  const { isPendingPost, pendingContent } = usePostFeed();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [likedSet, setLikedSet] = useState<Set<string>>(() => new Set(likedPostIds));
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(() => new Set(bookmarkedPostIds));
  const [isLoadingMore, startLoadMore] = useTransition();

  // Server revalidation'dan gelen prop değişikliklerini state'e senkronize et
  const postsKey = useMemo(() => initialPosts.map((p) => `${p.id}:${p.updated_at}`).join(), [initialPosts]);
  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);
  }, [postsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const likedKey = useMemo(() => likedPostIds.join(), [likedPostIds]);
  useEffect(() => {
    setLikedSet(new Set(likedPostIds));
  }, [likedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const bookmarkedKey = useMemo(() => bookmarkedPostIds.join(), [bookmarkedPostIds]);
  useEffect(() => {
    setBookmarkedSet(new Set(bookmarkedPostIds));
  }, [bookmarkedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const { data, error } = await supabase
            .from("posts")
            .select(
              `
              *,
              profiles (*),
              post_tags (
                tags (*)
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            setPosts((prev) => {
              if (prev.some((p) => p.id === data.id)) return prev;
              return [data as PostWithAuthor, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === payload.new.id
                ? { ...post, ...payload.new }
                : post
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) =>
            prev.filter((post) => post.id !== payload.old.id)
          );
        }
      )
      // Likes Realtime — currentUserId varsa filtrele
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "likes",
          ...(currentUserId ? { filter: `user_id=eq.${currentUserId}` } : {}) },
        (payload) => {
          const postId = (payload.new as { post_id: string }).post_id;
          setLikedSet((prev) => new Set(prev).add(postId));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "likes" },
        async (payload) => {
          const old = payload.old as { user_id?: string; post_id?: string };
          if (old.post_id && old.user_id === currentUserId) {
            // REPLICA IDENTITY FULL — tam veri var, doğrudan kaldır
            setLikedSet((prev) => {
              const next = new Set(prev);
              next.delete(old.post_id!);
              return next;
            });
          } else if (currentUserId) {
            // REPLICA IDENTITY DEFAULT — sadece id gelir, kullanıcının beğenilerini yeniden çek
            const { data } = await supabase
              .from("likes")
              .select("post_id")
              .eq("user_id", currentUserId);
            if (data) {
              setLikedSet(new Set(data.map((l) => l.post_id)));
            }
          }
        }
      )
      // Bookmarks Realtime
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookmarks",
          ...(currentUserId ? { filter: `user_id=eq.${currentUserId}` } : {}) },
        (payload) => {
          const postId = (payload.new as { post_id: string }).post_id;
          setBookmarkedSet((prev) => new Set(prev).add(postId));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookmarks" },
        async (payload) => {
          const old = payload.old as { user_id?: string; post_id?: string };
          if (old.post_id && old.user_id === currentUserId) {
            setBookmarkedSet((prev) => {
              const next = new Set(prev);
              next.delete(old.post_id!);
              return next;
            });
          } else if (currentUserId) {
            const { data } = await supabase
              .from("bookmarks")
              .select("post_id")
              .eq("user_id", currentUserId);
            if (data) {
              setBookmarkedSet(new Set(data.map((b) => b.post_id)));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  function handleLoadMore() {
    const cursor = posts[posts.length - 1]?.created_at;
    if (!cursor || isLoadingMore) return;
    startLoadMore(async () => {
      const { data: more, fetchError } = await loadMoreFeedPosts(cursor);
      if (fetchError) { setLoadError(true); return; }
      setLoadError(false);
      if (more.length > 0) setPosts((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  const sentinelRef = useInfiniteScroll(handleLoadMore, hasMore && !loadError);

  if (posts.length === 0 && !isPendingPost) {
    return (
      <div className="px-4 py-12 text-center text-zinc-500">
        <p className="text-lg">Henüz gönderi yok.</p>
        <p className="mt-1 text-sm">İlk gönderiyi sen paylaş!</p>
      </div>
    );
  }

  return (
    <>
      {/* Optimistic pending post skeleton */}
      {isPendingPost && (
        <article className="animate-pulse border-b border-zinc-800 px-4 py-3">
          <div className="flex gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="h-3 w-24 rounded bg-zinc-800" />
                <div className="h-3 w-16 rounded bg-zinc-800" />
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-400/70">
                {pendingContent}
              </p>
            </div>
          </div>
        </article>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwner={currentUserId === post.user_id}
          isLiked={likedSet.has(post.id)}
          isBookmarked={bookmarkedSet.has(post.id)}
          onEditSuccess={(newContent, newTags) =>
            setPosts((prev) =>
              prev.map((p) =>
                p.id === post.id
                  ? {
                      ...p,
                      content: newContent,
                      post_tags: newTags.map((t) => ({ tags: t })),
                    }
                  : p
              )
            )
          }
        />
      ))}

      {loadError ? (
        <div className="py-4 text-center">
          <button
            onClick={handleLoadMore}
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Yükleme başarısız. Tekrar dene
          </button>
        </div>
      ) : hasMore ? (
        <div ref={sentinelRef} className="py-6 text-center text-zinc-500">
          {isLoadingMore && <Loader2 size={20} className="mx-auto animate-spin" />}
        </div>
      ) : null}
    </>
  );
}

function PostCard({
  post,
  isOwner,
  isLiked,
  isBookmarked,
  onEditSuccess,
}: {
  post: PostWithAuthor;
  isOwner: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  onEditSuccess?: (newContent: string, newTags: { id: string; name: string; slug: string; created_at: string }[]) => void;
}) {
  return (
    <article className="relative border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-900/50">
      {/* Tıklanabilir kart overlay — modal açar */}
      <Link
        href={`/post/${post.id}`}
        className="absolute inset-0 z-0"
        aria-label="Gönderiyi aç"
      />

      <div className="relative z-10 flex gap-3">
        {/* Avatar */}
        <ClickGuard>
          <Link
            href={`/profile/${post.profiles.username}`}
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            {post.profiles.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.display_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                <span className="text-sm font-bold text-zinc-300">
                  {post.profiles.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
        </ClickGuard>

        <div className="min-w-0 flex-1">
          {/* Kullanıcı bilgisi + Sil butonu */}
          <div className="flex items-center gap-2">
            <ClickGuard>
              <Link
                href={`/profile/${post.profiles.username}`}
                className="truncate font-bold text-white hover:underline"
              >
                {post.profiles.display_name}
              </Link>
            </ClickGuard>
            <ClickGuard>
              <Link
                href={`/profile/${post.profiles.username}`}
                className="truncate text-zinc-500 hover:underline"
              >
                @{post.profiles.username}
              </Link>
            </ClickGuard>
            <span className="text-zinc-600">·</span>
            <span className="shrink-0 text-zinc-500">
              {formatRelativeTime(post.created_at)}
            </span>
            {isOwner && (
              <ClickGuard as="span" className="ml-auto flex items-center gap-2">
                <EditPostButton
                  postId={post.id}
                  initialContent={post.content}
                  initialTags={post.post_tags.map((pt) => pt.tags)}
                  onSuccess={onEditSuccess}
                />
                <DeletePostButton postId={post.id} />
              </ClickGuard>
            )}
          </div>

          {/* İçerik */}
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
            {post.content}
          </p>

          {/* Görsel */}
          {post.image_url && (
            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt="Gönderi görseli"
                className="max-h-96 w-full object-cover"
              />
            </div>
          )}

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
          <ClickGuard className="relative z-10 mt-3 flex max-w-md items-center justify-between">
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
            <ShareButton postId={post.id} />
          </ClickGuard>
        </div>
      </div>
    </article>
  );
}
