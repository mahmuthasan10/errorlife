"use server";

import { createClient } from "@/utils/supabase/server";
import { getOrCreateChat } from "@/lib/chat-queries";
import { uuidSchema, sendMessageSchema } from "@/lib/schemas";

export type ChatActionResult = {
  error: string | null;
};

export async function startChat(
  targetUserId: string
): Promise<{ chatId: string | null; error: string | null }> {
  const parsed = uuidSchema.safeParse(targetUserId);
  if (!parsed.success) {
    return { chatId: null, error: "Geçersiz kullanıcı kimliği." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { chatId: null, error: "Mesaj göndermek için giriş yapmalısınız." };
  }

  if (user.id === parsed.data) {
    return { chatId: null, error: "Kendinize mesaj gönderemezsiniz." };
  }

  return getOrCreateChat(parsed.data);
}

export async function markMessagesAsRead(
  chatId: string
): Promise<ChatActionResult> {
  const parsed = uuidSchema.safeParse(chatId);
  if (!parsed.success) {
    return { error: "Geçersiz sohbet ID." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Bu işlem için giriş yapmalısınız." };
  }

  try {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("chat_id", parsed.data)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    return { error: null };
  } catch {
    return { error: "Mesajlar okundu olarak işaretlenemedi." };
  }
}

export async function sendMessage(
  chatId: string,
  content: string
): Promise<ChatActionResult> {
  const parsed = sendMessageSchema.safeParse({ chatId, content });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Mesaj göndermek için giriş yapmalısınız." };
  }

  try {
    const { error: insertError } = await supabase.from("messages").insert({
      chat_id: parsed.data.chatId,
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
