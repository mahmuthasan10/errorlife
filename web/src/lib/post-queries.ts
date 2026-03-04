import { createClient } from "@/utils/supabase/server";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/database";

export async function getPostById(
  postId: string
): Promise<PostWithAuthor | null> {
  const supabase = await createClient();

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
    .eq("id", postId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PostWithAuthor;
}

export async function getCommentsByPostId(
  postId: string
): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles (*)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data as CommentWithAuthor[]) ?? [];
}

export async function getPostInteractionState(
  postId: string,
  userId: string
): Promise<{ isLiked: boolean; isBookmarked: boolean }> {
  const supabase = await createClient();

  const [likeResult, bookmarkResult] = await Promise.all([
    supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle(),
    supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle(),
  ]);

  return {
    isLiked: !!likeResult.data,
    isBookmarked: !!bookmarkResult.data,
  };
}
