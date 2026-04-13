"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { followSchema } from "@/lib/schemas";
import type { ActionResult } from "../actions";

export async function toggleFollowUser(
  targetUserId: string
): Promise<ActionResult> {
  const parsed = followSchema.safeParse({ targetUserId });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz kullanıcı ID." };
  }

  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Takip işlemi için giriş yapmalısınız." };
    }

    if (user.id === parsed.data.targetUserId) {
      return { error: "Kendinizi takip edemezsiniz." };
    }

    // Mevcut takip ilişkisini kontrol et
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", parsed.data.targetUserId)
      .maybeSingle();

    if (existingFollow) {
      // Takipten çık
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", parsed.data.targetUserId);

      if (error) {
        return { error: "Takipten çıkılamadı. Lütfen tekrar deneyin." };
      }
    } else {
      // Takip et — 23505 (unique_violation) idempotent: zaten takip ediliyorsa sessizce geç
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: parsed.data.targetUserId,
        });

      if (error && error.code !== "23505") {
        return { error: "Takip edilemedi. Lütfen tekrar deneyin." };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
