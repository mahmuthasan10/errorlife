import { createClient } from "@/utils/supabase/server";
import type { NotificationWithActor, Profile } from "@/types/database";

const NOTIFICATIONS_LIMIT = 50;

/**
 * Mevcut kullanıcının bildirimlerini, actor profil bilgisiyle birlikte döndürür.
 * En yeni bildirim en üstte (created_at DESC).
 */
export async function getUserNotifications(): Promise<NotificationWithActor[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_LIMIT);

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    user_id: item.user_id,
    actor_id: item.actor_id,
    type: item.type,
    entity_id: item.entity_id,
    is_read: item.is_read,
    created_at: item.created_at,
    actor: item.actor as unknown as Profile,
  }));
}
