"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { ActionResult } from "../actions";

export async function toggleLike(postId: string): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Beğenmek için giriş yapmalısınız." };
    }

    // Mevcut beğeniyi kontrol et
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (existingLike) {
      // Beğeniyi kaldır
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) {
        return { error: `Beğeni kaldırılamadı: ${error.message}` };
      }
    } else {
      // Beğeni ekle
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, post_id: postId });

      if (error) {
        return { error: `Beğeni eklenemedi: ${error.message}` };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function toggleBookmark(postId: string): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Kaydetmek için giriş yapmalısınız." };
    }

    // Mevcut yer imini kontrol et
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (existingBookmark) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (error) {
        return { error: `Yer imi kaldırılamadı: ${error.message}` };
      }
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, post_id: postId });

      if (error) {
        return { error: `Yer imi eklenemedi: ${error.message}` };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function addComment(
  postId: string,
  content: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const trimmed = content?.trim();

  if (!trimmed) {
    return { error: "Yorum içeriği boş olamaz." };
  }

  if (trimmed.length > 500) {
    return { error: "Yorum en fazla 500 karakter olabilir." };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Yorum yapmak için giriş yapmalısınız." };
    }

    const { error } = await supabase
      .from("comments")
      .insert({ user_id: user.id, post_id: postId, content: trimmed });

    if (error) {
      return { error: `Yorum eklenemedi: ${error.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}
