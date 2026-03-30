"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { PostWithAuthor } from "@/types/database";
import DeletePostButton from "./delete-post-button";
import {
  LikeButton,
  BookmarkButton,
  CommentButton,
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
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [likedSet, setLikedSet] = useState<Set<string>>(() => new Set(likedPostIds));
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(() => new Set(bookmarkedPostIds));

  // Server revalidation'dan gelen prop değişikliklerini state'e senkronize et
  const postsKey = useMemo(() => initialPosts.map((p) => `${p.id}:${p.updated_at}`).join(), [initialPosts]);
  useEffect(() => {
    setPosts(initialPosts);
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

  if (posts.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-zinc-500">
        <p className="text-lg">Henüz gönderi yok.</p>
        <p className="mt-1 text-sm">İlk gönderiyi sen paylaş!</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwner={currentUserId === post.user_id}
          isLiked={likedSet.has(post.id)}
          isBookmarked={bookmarkedSet.has(post.id)}
        />
      ))}
    </>
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
    <article className="relative border-b border-zinc-800 px-4 py-4 transition-colors hover:bg-zinc-950/50">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 transition-opacity hover:opacity-80"
          >
            <span className="text-sm font-bold text-zinc-300">
              {post.profiles.display_name.charAt(0).toUpperCase()}
            </span>
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
              <ClickGuard as="span">
                <DeletePostButton postId={post.id} />
              </ClickGuard>
            )}
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
          </ClickGuard>
        </div>
      </div>
    </article>
  );
}
