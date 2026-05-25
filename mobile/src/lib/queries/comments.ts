import type { CommentWithAuthor } from "@errorlife/shared/types";
import { supabase } from "../supabase";
import { logger } from "../logger";

export async function fetchComments(postId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("comments.fetch", { error: error.message, postId });
    throw error;
  }
  return (data as CommentWithAuthor[]) ?? [];
}

export async function createComment(params: {
  userId: string;
  postId: string;
  content: string;
}): Promise<CommentWithAuthor> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: params.userId,
      post_id: params.postId,
      content: params.content,
    })
    .select("*, profiles!comments_user_id_fkey(*)")
    .single();

  if (error) {
    logger.error("comments.create", { error: error.message, postId: params.postId });
    throw error;
  }
  return data as CommentWithAuthor;
}
