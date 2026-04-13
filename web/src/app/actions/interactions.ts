"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { uuidSchema, addCommentSchema } from "@/lib/schemas";
import type { ActionResult } from "../actions";

export async function toggleLike(postId: string): Promise<ActionResult> {
  const parsed = uuidSchema.safeParse(postId);
  if (!parsed.success) {
    return { error: "Geçersiz gönderi ID." };
  }

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
      .insert({ user_id: user.id, post_id: parsed.data });

    if (insertError) {
      if (insertError.code === "23505") {
        // Zaten beğenilmiş → kaldır
        const { error: delError } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", parsed.data);

        if (delError) {
          return { error: "Beğeni kaldırılamadı. Lütfen tekrar deneyin." };
        }
      } else {
        return { error: "Beğeni eklenemedi. Lütfen tekrar deneyin." };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${parsed.data}`);
  return { error: null };
}

export async function toggleBookmark(postId: string): Promise<ActionResult> {
  const parsed = uuidSchema.safeParse(postId);
  if (!parsed.success) {
    return { error: "Geçersiz gönderi ID." };
  }

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
      .insert({ user_id: user.id, post_id: parsed.data });

    if (insertError) {
      if (insertError.code === "23505") {
        // Zaten kaydedilmiş → kaldır
        const { error: delError } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", parsed.data);

        if (delError) {
          return { error: "Yer imi kaldırılamadı. Lütfen tekrar deneyin." };
        }
      } else {
        return { error: "Yer imi eklenemedi. Lütfen tekrar deneyin." };
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${parsed.data}`);
  return { error: null };
}

export async function addComment(
  postId: string,
  content: string
): Promise<ActionResult> {
  const parsed = addCommentSchema.safeParse({ postId, content });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const supabase = await createClient();

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
      .insert({
        user_id: user.id,
        post_id: parsed.data.postId,
        content: parsed.data.content.trim(),
      });

    if (error) {
      return { error: "Yorum eklenemedi. Lütfen tekrar deneyin." };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${parsed.data.postId}`);
  return { error: null };
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<ActionResult> {
  const commentParsed = uuidSchema.safeParse(commentId);
  const postParsed = uuidSchema.safeParse(postId);
  if (!commentParsed.success || !postParsed.success) {
    return { error: "Geçersiz ID." };
  }

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
      .eq("id", commentParsed.data)
      .eq("user_id", user.id);

    if (error) {
      return { error: "Yorum silinemedi. Lütfen tekrar deneyin." };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postParsed.data}`);
  return { error: null };
}
