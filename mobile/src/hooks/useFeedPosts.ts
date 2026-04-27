import { useCallback, useEffect, useRef, useState } from "react";
import type { PostWithAuthor } from "@errorlife/shared/types";
import { FEED_PAGE_SIZE, fetchPostsPage } from "../lib/post-queries";

type Status = {
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasError: boolean;
  hasMore: boolean;
};

const INITIAL_STATUS: Status = {
  isLoading: true,
  isRefreshing: false,
  isLoadingMore: false,
  hasError: false,
  hasMore: true,
};

export type UseFeedPostsResult = {
  posts: PostWithAuthor[];
  setPosts: React.Dispatch<React.SetStateAction<PostWithAuthor[]>>;
  status: Status;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

export function useFeedPosts(userId: string | null): UseFeedPostsResult {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [status, setStatus] = useState<Status>(INITIAL_STATUS);
  const pageRef = useRef(0);

  const loadPage = useCallback(
    async (pageNumber: number, mode: "initial" | "refresh" | "more") => {
      try {
        const fetched = await fetchPostsPage({ page: pageNumber, userId });
        const hasMore = fetched.length === FEED_PAGE_SIZE;

        setPosts((prev) =>
          mode === "more" ? mergeUnique(prev, fetched) : fetched
        );
        setStatus((s) => ({
          ...s,
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
          hasError: false,
          hasMore,
        }));
        pageRef.current = pageNumber;
      } catch {
        setStatus((s) => ({
          ...s,
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
          hasError: true,
        }));
      }
    },
    [userId]
  );

  useEffect(() => {
    setStatus(INITIAL_STATUS);
    pageRef.current = 0;
    loadPage(0, "initial");
  }, [loadPage]);

  const refresh = useCallback(async () => {
    setStatus((s) => ({ ...s, isRefreshing: true, hasError: false }));
    await loadPage(0, "refresh");
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    setStatus((s) => {
      if (s.isLoadingMore || !s.hasMore || s.isLoading || s.isRefreshing) {
        return s;
      }
      return { ...s, isLoadingMore: true };
    });

    if (
      status.isLoadingMore ||
      !status.hasMore ||
      status.isLoading ||
      status.isRefreshing
    ) {
      return;
    }

    await loadPage(pageRef.current + 1, "more");
  }, [
    loadPage,
    status.isLoadingMore,
    status.hasMore,
    status.isLoading,
    status.isRefreshing,
  ]);

  return { posts, setPosts, status, refresh, loadMore };
}

function mergeUnique(
  prev: PostWithAuthor[],
  next: PostWithAuthor[]
): PostWithAuthor[] {
  const seen = new Set(prev.map((p) => p.id));
  const additions = next.filter((p) => !seen.has(p.id));
  return additions.length === 0 ? prev : [...prev, ...additions];
}
