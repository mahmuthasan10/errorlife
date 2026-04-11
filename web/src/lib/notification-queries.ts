import { createClient } from "@/utils/supabase/server";
import type {
  NotificationWithActor,
  NotificationType,
  Profile,
  InteractionNotificationRow,
  FollowNotificationRow,
  MessageNotificationRow,
} from "@/types/database";

const NOTIFICATIONS_LIMIT = 20;

/**
 * Cursor-tabanlı pagination için kullanılır (loadMoreNotifications action'ı).
 * Mevcut API değiştirilmedi — geriye dönük uyumlu.
 */
export async function getUserNotifications(): Promise<NotificationWithActor[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(`*, actor:profiles!notifications_actor_id_fkey(*)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_LIMIT);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    user_id: item.user_id,
    actor_id: item.actor_id,
    type: item.type as NotificationType,
    entity_id: item.entity_id,
    is_read: item.is_read,
    created_at: item.created_at,
    actor: item.actor as unknown as Profile,
  }));
}

// ── 3-Sekmeli Sistem ──────────────────────────────────────────

/**
 * Etkileşimler sekmesi:
 * - Yorumlar bireysel, beğeniler post bazında gruplanmış.
 * - Gruplama veritabanı seviyesinde yapılır (get_interaction_notifications RPC).
 */
export async function getInteractionNotifications(): Promise<
  InteractionNotificationRow[]
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase.rpc("get_interaction_notifications");

  if (error || !data) return [];

  return (data as InteractionNotificationRow[]).map((row) => ({
    ...row,
    actor_count: Number(row.actor_count),
  }));
}

/**
 * Takipler sekmesi: sadece FOLLOW tipi bildirimler.
 */
export async function getFollowNotifications(): Promise<FollowNotificationRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase.rpc("get_follow_notifications");

  if (error || !data) return [];

  return data as FollowNotificationRow[];
}

/**
 * Mesajlar sekmesi: notifications tablosuna kopyalamadan,
 * doğrudan chats + messages tablolarından beslenir.
 */
export async function getMessageNotifications(): Promise<MessageNotificationRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return [];

  const { data, error } = await supabase.rpc("get_message_notifications");

  if (error || !data) return [];

  return (data as MessageNotificationRow[]).map((row) => ({
    ...row,
    unread_count: Number(row.unread_count),
  }));
}
