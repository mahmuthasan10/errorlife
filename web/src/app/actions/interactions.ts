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

    // Atomic toggle: önce INSERT dene, unique_violation → zaten var → DELETE
    const { error: insertError } = await supabase
      .from("likes")
      .insert({ user_id: user.id, post_id: postId });

    if (insertError) {
      if (insertError.code === "23505") {
        // Zaten beğenilmiş → kaldır
        const { error: delError } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        if (delError) {
          return { error: `Beğeni kaldırılamadı: ${delError.message}` };
        }
      } else {
        return { error: `Beğeni eklenemedi: ${insertError.message}` };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
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

    // Atomic toggle: önce INSERT dene, unique_violation → zaten var → DELETE
    const { error: insertError } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, post_id: postId });

    if (insertError) {
      if (insertError.code === "23505") {
        // Zaten kaydedilmiş → kaldır
        const { error: delError } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);

        if (delError) {
          return { error: `Yer imi kaldırılamadı: ${delError.message}` };
        }
      } else {
        return { error: `Yer imi eklenemedi: ${insertError.message}` };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
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
  revalidatePath(`/post/${postId}`);
  return { error: null };
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      return { error: `Yorum silinemedi: ${error.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { error: null };
}
