"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/utils";
import { uuidSchema, LIMITS } from "@/lib/schemas";

export type ActionResult = {
  error: string | null;
};

const tagsArraySchema = z
  .array(z.string().min(LIMITS.post.tagName.min).max(LIMITS.post.tagName.max))
  .max(LIMITS.post.tags.max);

export async function createPost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const content = (formData.get("content") as string)?.trim();
  const tagsRaw = formData.get("tags") as string | null;
  const imageUrl = (formData.get("image_url") as string | null) || null;

  if (!content) {
    return { error: "Gönderi içeriği boş olamaz." };
  }

  if (content.length > LIMITS.post.content.max) {
    return { error: `Gönderi en fazla ${LIMITS.post.content.max} karakter olabilir.` };
  }

  let tags: string[] = [];
  if (tagsRaw) {
    try {
      const raw = JSON.parse(tagsRaw);
      const tagsResult = tagsArraySchema.safeParse(raw);
      if (!tagsResult.success) {
        return { error: "Geçersiz etiket formatı." };
      }
      tags = tagsResult.data;
    } catch {
      return { error: "Etiketler ayrıştırılamadı." };
    }
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Gönderi paylaşmak için giriş yapmalısınız." };
    }

    const tagObjects = tags.map((name) => ({ name, slug: slugify(name) }));

    const { error: rpcError } = await supabase.rpc("create_post_with_tags", {
      p_content: content,
      p_image_url: imageUrl ?? undefined,
      p_tags: tagObjects,
    });

    if (rpcError) {
      return { error: "Gönderi paylaşılamadı. Lütfen tekrar deneyin." };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function editPost(
  postId: string,
  content: string,
  tags: string[]
): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(postId);
  if (!parsedId.success) return { error: "Geçersiz gönderi ID." };

  const trimmed = content?.trim();
  if (!trimmed) return { error: "Gönderi içeriği boş olamaz." };
  if (trimmed.length > LIMITS.post.content.max)
    return { error: `Gönderi en fazla ${LIMITS.post.content.max} karakter olabilir.` };

  const tagsResult = z
    .array(z.string().min(LIMITS.post.tagName.min).max(LIMITS.post.tagName.max))
    .max(LIMITS.post.tags.max)
    .safeParse(tags);
  if (!tagsResult.success) return { error: "Geçersiz etiket formatı." };

  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { error: "Bu işlem için giriş yapmalısınız." };

    const { error: updateError } = await supabase
      .from("posts")
      .update({ content: trimmed })
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (updateError) return { error: "Gönderi güncellenemedi." };

    // Mevcut etiketleri sil, yenilerini ekle
    await supabase.from("post_tags").delete().eq("post_id", parsedId.data);

    for (const tagName of tagsResult.data) {
      const slug = slugify(tagName);
      await supabase.from("tags").upsert({ name: tagName, slug }, { onConflict: "slug" });
      const { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", slug)
        .single();
      if (tag) {
        await supabase
          .from("post_tags")
          .insert({ post_id: parsedId.data, tag_id: tag.id })
          .throwOnError();
      }
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { error: null };
}

export async function deletePost(postId: string): Promise<ActionResult> {
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
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (deleteError) {
      return { error: "Gönderi silinemedi. Lütfen tekrar deneyin." };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
