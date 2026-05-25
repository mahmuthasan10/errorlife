import type {
  InteractionNotificationRow,
  FollowNotificationRow,
  MessageNotificationRow,
  JobNotificationRow,
} from "@errorlife/shared/types";
import { supabase } from "../supabase";
import { logger } from "../logger";

export async function fetchInteractionNotifications(): Promise<InteractionNotificationRow[]> {
  const { data, error } = await supabase.rpc("get_interaction_notifications");
  if (error) {
    logger.error("notifications.fetch_interactions", { error: error.message });
    throw error;
  }
  return (data ?? []) as InteractionNotificationRow[];
}

export async function fetchFollowNotifications(): Promise<FollowNotificationRow[]> {
  const { data, error } = await supabase.rpc("get_follow_notifications");
  if (error) {
    logger.error("notifications.fetch_follows", { error: error.message });
    throw error;
  }
  return (data ?? []) as FollowNotificationRow[];
}

export async function fetchMessageNotifications(): Promise<MessageNotificationRow[]> {
  const { data, error } = await supabase.rpc("get_message_notifications");
  if (error) {
    logger.error("notifications.fetch_messages", { error: error.message });
    throw error;
  }
  return (data ?? []) as MessageNotificationRow[];
}

export async function fetchJobNotifications(): Promise<JobNotificationRow[]> {
  // Migration 024 uygulanıp `npx supabase gen types` koşulana dek generated
  // database tiplerinde bu RPC yok — `as never` ile geçici tip darboğazı.
  const { data, error } = await supabase.rpc("get_job_notifications" as never);
  if (error) {
    logger.error("notifications.fetch_jobs", { error: (error as { message: string }).message });
    throw error;
  }
  return (data ?? []) as JobNotificationRow[];
}

export async function markJobNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) {
    logger.error("notifications.mark_job_read", { error: error.message, notificationId });
    throw error;
  }
}

export async function markCommentNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) {
    logger.error("notifications.mark_comment_read", { error: error.message, notificationId });
    throw error;
  }
}

export async function markLikeNotificationsRead(postId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_like_notifications_read", {
    p_post_id: postId,
  });
  if (error) {
    logger.error("notifications.mark_like_read", { error: error.message, postId });
    throw error;
  }
}

export async function markFollowNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) {
    logger.error("notifications.mark_follow_read", { error: error.message, notificationId });
    throw error;
  }
}
