"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/utils";

export type ActionResult = {
  error: string | null;
};

export async function createPost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const content = (formData.get("content") as string)?.trim();
  const tagsRaw = formData.get("tags") as string | null;
  const tags: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

  if (!content) {
    return { error: "Gönderi içeriği boş olamaz." };
  }

  if (content.length > 500) {
    return { error: "Gönderi en fazla 500 karakter olabilir." };
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
      p_user_id: user.id,
      p_content: content,
      p_tags: tagObjects,
    });

    if (rpcError) {
      return { error: `Gönderi paylaşılamadı: ${rpcError.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/");
  return { error: null };
}

export async function deletePost(postId: string): Promise<ActionResult> {
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
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      return { error: `Gönderi silinemedi: ${deleteError.message}` };
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
