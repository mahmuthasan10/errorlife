"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getOrCreateChat } from "@/lib/chat-queries";

export type ChatActionResult = {
  error: string | null;
};

const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Mesaj içeriği boş olamaz.")
    .max(2000, "Mesaj en fazla 2000 karakter olabilir."),
});

export async function startChat(
  targetUserId: string
): Promise<{ chatId: string | null; error: string | null }> {
  return getOrCreateChat(targetUserId);
}

export async function sendMessage(
  chatId: string,
  content: string
): Promise<ChatActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Mesaj göndermek için giriş yapmalısınız." };
  }

  // Zod ile içerik doğrulama
  const parsed = messageSchema.safeParse({ content });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const { error: insertError } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: parsed.data.content,
    });

    if (insertError) {
      return { error: "Mesaj gönderilemedi." };
    }

    // revalidatePath yok — mesajlar Supabase Realtime ile anlık güncellenir
    return { error: null };
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
