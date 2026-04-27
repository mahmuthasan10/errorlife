import type { PostWithAuthor } from "@errorlife/shared/types";
import { supabase } from "./supabase";

export const FEED_PAGE_SIZE = 10;

const POST_SELECT = `
  *,
  profiles!posts_user_id_fkey(*),
  post_tags(tags(*)),
  user_likes:likes!left(user_id),
  user_bookmarks:bookmarks!left(user_id)
` as const;

export type FetchPostsPageParams = {
  page: number;
  userId: string | null;
  pageSize?: number;
};

export async function fetchPostsPage({
  page,
  userId,
  pageSize = FEED_PAGE_SIZE,
}: FetchPostsPageParams): Promise<PostWithAuthor[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userId) {
    query = query
      .eq("user_likes.user_id", userId)
      .eq("user_bookmarks.user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as PostWithAuthor[]) ?? [];
}

export async function fetchPostById(
  postId: string,
  userId: string | null
): Promise<PostWithAuthor | null> {
  let query = supabase.from("posts").select(POST_SELECT).eq("id", postId);

  if (userId) {
    query = query
      .eq("user_likes.user_id", userId)
      .eq("user_bookmarks.user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;

  return (data as unknown as PostWithAuthor) ?? null;
}

export async function insertLike(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .insert({ user_id: userId, post_id: postId });
  if (error) throw error;
}

export async function deleteLike(userId: string, postId: string): Promise<void> {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw error;
}

export async function insertBookmark(
  userId: string,
  postId: string
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, post_id: postId });
  if (error) throw error;
}

export async function deleteBookmark(
  userId: string,
  postId: string
): Promise<void> {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("post_id", postId);
  if (error) throw error;
}
