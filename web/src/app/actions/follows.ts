"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "../actions";

const followSchema = z.object({
  targetUserId: z.string().uuid("Geçersiz kullanıcı ID formatı."),
});

export async function toggleFollowUser(
  targetUserId: string
): Promise<ActionResult> {
  const parsed = followSchema.safeParse({ targetUserId });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
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
        return { error: `Takipten çıkılamadı: ${error.message}` };
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
        return { error: `Takip edilemedi: ${error.message}` };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  // Hedef kullanıcının username'ini bilmediğimiz için genel profil path'ini revalidate et
  revalidatePath("/", "layout");
  return { error: null };
}
