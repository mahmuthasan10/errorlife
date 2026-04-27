"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { uuidSchema } from "@errorlife/shared/schemas";
import type { ActionResult } from "../actions";

export async function markAsRead(
  notificationId: string
): Promise<ActionResult> {
  const parsed = uuidSchema.safeParse(notificationId);
  if (!parsed.success) {
    return { error: "Geçersiz bildirim ID." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Bu işlem için giriş yapmalısınız." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Bildirim güncellenemedi." };
  }

  revalidatePath("/notifications");
  return { error: null };
}
