"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { updateProfileSchema } from "@errorlife/shared/schemas";

export type SettingsResult = {
  error: string | null;
  success: string | null;
};

export async function updateProfileSettings(
  formData: FormData
): Promise<SettingsResult> {
  const rawPassword = formData.get("newPassword");
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") || null,
    avatarUrl: null,
    coverUrl: null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri.", success: null };
  }

  // Şifre ayrıca kontrol edilir (updateProfileSchema'da yok, opsiyonel alan)
  const newPassword = typeof rawPassword === "string" && rawPassword.length > 0
    ? rawPassword
    : undefined;

  if (newPassword && newPassword.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır.", success: null };
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
        error: "Profil güncellenemedi. Lütfen tekrar deneyin.",
        success: null,
      };
    }

    // Şifre değişikliği varsa uygula
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        return {
          error: "Şifre güncellenemedi. Lütfen tekrar deneyin.",
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

  const successMsg = newPassword
    ? "Profil ve şifre başarıyla güncellendi."
    : "Profil başarıyla güncellendi.";

  return { error: null, success: successMsg };
}
