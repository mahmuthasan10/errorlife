import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import type { PostWithAuthor } from "@errorlife/shared/types";
import {
  deleteBookmark,
  deleteLike,
  insertBookmark,
  insertLike,
} from "../lib/post-queries";

type SetPosts = React.Dispatch<React.SetStateAction<PostWithAuthor[]>>;

export type UsePostInteractionParams = {
  userId: string | null;
  setPosts: SetPosts;
};

export type UsePostInteractionResult = {
  toggleLike: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
};

function applyLikeToggle(
  posts: PostWithAuthor[],
  postId: string,
  userId: string,
  nextLiked: boolean
): PostWithAuthor[] {
  return posts.map((post) => {
    if (post.id !== postId) return post;
    return {
      ...post,
      like_count: Math.max(0, post.like_count + (nextLiked ? 1 : -1)),
      user_likes: nextLiked ? [{ user_id: userId }] : [],
    };
  });
}

function applyBookmarkToggle(
  posts: PostWithAuthor[],
  postId: string,
  userId: string,
  nextBookmarked: boolean
): PostWithAuthor[] {
  return posts.map((post) => {
    if (post.id !== postId) return post;
    return {
      ...post,
      bookmark_count: Math.max(0, post.bookmark_count + (nextBookmarked ? 1 : -1)),
      user_bookmarks: nextBookmarked ? [{ user_id: userId }] : [],
    };
  });
}

function isCurrentlyLiked(post: PostWithAuthor): boolean {
  return (post.user_likes?.length ?? 0) > 0;
}

function isCurrentlyBookmarked(post: PostWithAuthor): boolean {
  return (post.user_bookmarks?.length ?? 0) > 0;
}

export function usePostInteraction({
  userId,
  setPosts,
}: UsePostInteractionParams): UsePostInteractionResult {
  const inFlight = useRef<Set<string>>(new Set());

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!userId) return;
      const key = `like:${postId}`;
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);

      let nextLiked = false;
      setPosts((prev) => {
        const post = prev.find((p) => p.id === postId);
        if (!post) return prev;
        nextLiked = !isCurrentlyLiked(post);
        return applyLikeToggle(prev, postId, userId, nextLiked);
      });

      try {
        if (nextLiked) {
          await insertLike(userId, postId);
        } else {
          await deleteLike(userId, postId);
        }
      } catch {
        setPosts((prev) => applyLikeToggle(prev, postId, userId, !nextLiked));
        Alert.alert("Hata", "Beğeni işlemi başarısız oldu.");
      } finally {
        inFlight.current.delete(key);
      }
    },
    [userId, setPosts]
  );

  const toggleBookmark = useCallback(
    async (postId: string) => {
      if (!userId) return;
      const key = `bookmark:${postId}`;
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);

      let nextBookmarked = false;
      setPosts((prev) => {
        const post = prev.find((p) => p.id === postId);
        if (!post) return prev;
        nextBookmarked = !isCurrentlyBookmarked(post);
        return applyBookmarkToggle(prev, postId, userId, nextBookmarked);
      });

      try {
        if (nextBookmarked) {
          await insertBookmark(userId, postId);
        } else {
          await deleteBookmark(userId, postId);
        }
      } catch {
        setPosts((prev) =>
          applyBookmarkToggle(prev, postId, userId, !nextBookmarked)
        );
        Alert.alert("Hata", "Kaydetme işlemi başarısız oldu.");
      } finally {
        inFlight.current.delete(key);
      }
    },
    [userId, setPosts]
  );

  return { toggleLike, toggleBookmark };
}
