"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Görünen ad en az 2 karakter olmalıdır.")
    .max(50, "Görünen ad en fazla 50 karakter olabilir."),
  bio: z
    .string()
    .trim()
    .max(300, "Biyografi en fazla 300 karakter olabilir.")
    .optional()
    .transform((val) => val || null),
  newPassword: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 6,
      "Şifre en az 6 karakter olmalıdır."
    ),
});

export type SettingsResult = {
  error: string | null;
  success: string | null;
};

export async function updateProfileSettings(
  formData: FormData
): Promise<SettingsResult> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    newPassword: formData.get("newPassword") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: null };
  }

  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız.", success: null };
    }

    // Profil bilgilerini güncelle
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName,
        bio: parsed.data.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return {
        error: `Profil güncellenemedi: ${profileError.message}`,
        success: null,
      };
    }

    // Şifre değişikliği varsa uygula
    if (parsed.data.newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });

      if (passwordError) {
        return {
          error: `Şifre güncellenemedi: ${passwordError.message}`,
          success: null,
        };
      }
    }

    // Username'i al (revalidatePath için gerekli)
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
    revalidatePath("/settings");
    revalidatePath("/", "layout");
  } catch {
    return {
      error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
      success: null,
    };
  }

  const successMsg = parsed.data.newPassword
    ? "Profil ve şifre başarıyla güncellendi."
    : "Profil başarıyla güncellendi.";

  return { error: null, success: successMsg };
}
