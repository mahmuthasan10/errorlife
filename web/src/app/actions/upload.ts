"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { SettingsResult } from "./settings";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const COVER_MAX_BYTES = 4 * 1024 * 1024;  // 4 MB

// Magic bytes: dosya içeriği MIME type ile uyuşuyor mu?
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png":  [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header — WebP
};

async function validateMagicBytes(file: File): Promise<boolean> {
  const signatures = MAGIC_BYTES[file.type];
  if (!signatures) return false;
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return signatures.some((sig) =>
    sig.every((byte, i) => header[i] === byte)
  );
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] ?? "jpg";
}

async function deleteOldFile(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  // Hata olursa sessizce geç — eski dosyanın silinmemesi işlemi engellememeli
  await supabase.storage.from("avatars").remove([path]);
}

export async function uploadAvatar(formData: FormData): Promise<SettingsResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geçerli bir dosya seçin.", success: null };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Yalnızca JPEG, PNG, WebP veya GIF yükleyebilirsiniz.", success: null };
  }

  if (!(await validateMagicBytes(file))) {
    return { error: "Dosya içeriği geçersiz veya bozuk.", success: null };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "Profil fotoğrafı en fazla 2 MB olabilir.", success: null };
  }

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { error: "Bu işlem için giriş yapmalısınız.", success: null };

  try {
    const ext = getExtension(file.type);
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    // Eski avatar URL'ini al
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("id", user.id)
      .maybeSingle();

    // Yeni dosyayı yükle
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: "Yükleme başarısız. Lütfen tekrar deneyin.", success: null };
    }

    // Public URL al
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Profili güncelle
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      // Yüklenen dosyayı temizle
      await deleteOldFile(supabase, path);
      return { error: "Profil güncellenemedi. Lütfen tekrar deneyin.", success: null };
    }

    // Eski dosyayı sil (URL'den path çıkar)
    if (profile?.avatar_url) {
      try {
        const url = new URL(profile.avatar_url);
        const oldPath = url.pathname.split("/avatars/")[1];
        if (oldPath) await deleteOldFile(supabase, oldPath);
      } catch {
        // URL parse hatası — yoksay
      }
    }

    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
    revalidatePath("/settings");
    revalidatePath("/", "layout");
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", success: null };
  }

  return { error: null, success: "Profil fotoğrafı başarıyla güncellendi." };
}

export async function uploadPostImage(
  formData: FormData
): Promise<{ error: string | null; url: string | null }> {
  const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geçerli bir dosya seçin.", url: null };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Yalnızca JPEG, PNG, WebP veya GIF yükleyebilirsiniz.", url: null };
  }

  if (!(await validateMagicBytes(file))) {
    return { error: "Dosya içeriği geçersiz veya bozuk.", url: null };
  }

  if (file.size > POST_IMAGE_MAX_BYTES) {
    return { error: "Gönderi görseli en fazla 5 MB olabilir.", url: null };
  }

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { error: "Bu işlem için giriş yapmalısınız.", url: null };

  try {
    const ext = getExtension(file.type);
    const path = `${user.id}/post-images/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: "Yükleme başarısız. Lütfen tekrar deneyin.", url: null };
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return { error: null, url: urlData.publicUrl };
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", url: null };
  }
}

export async function uploadCover(formData: FormData): Promise<SettingsResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Geçerli bir dosya seçin.", success: null };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Yalnızca JPEG, PNG, WebP veya GIF yükleyebilirsiniz.", success: null };
  }

  if (!(await validateMagicBytes(file))) {
    return { error: "Dosya içeriği geçersiz veya bozuk.", success: null };
  }

  if (file.size > COVER_MAX_BYTES) {
    return { error: "Kapak fotoğrafı en fazla 4 MB olabilir.", success: null };
  }

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { error: "Bu işlem için giriş yapmalısınız.", success: null };

  try {
    const ext = getExtension(file.type);
    const path = `${user.id}/cover-${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    // Eski kapak URL'ini al
    const { data: profile } = await supabase
      .from("profiles")
      .select("cover_url, username")
      .eq("id", user.id)
      .maybeSingle();

    // Yeni dosyayı yükle
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { error: "Yükleme başarısız. Lütfen tekrar deneyin.", success: null };
    }

    // Public URL al
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Profili güncelle
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      await deleteOldFile(supabase, path);
      return { error: "Profil güncellenemedi. Lütfen tekrar deneyin.", success: null };
    }

    // Eski dosyayı sil
    if (profile?.cover_url) {
      try {
        const url = new URL(profile.cover_url);
        const oldPath = url.pathname.split("/avatars/")[1];
        if (oldPath) await deleteOldFile(supabase, oldPath);
      } catch {
        // URL parse hatası — yoksay
      }
    }

    if (profile?.username) {
      revalidatePath(`/profile/${profile.username}`);
    }
    revalidatePath("/settings");
    revalidatePath("/", "layout");
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", success: null };
  }

  return { error: null, success: "Kapak fotoğrafı başarıyla güncellendi." };
}
