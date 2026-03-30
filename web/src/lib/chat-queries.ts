import { createClient } from "@/utils/supabase/server";
import type { ChatWithDetails, Message, Profile } from "@/types/database";

const MESSAGES_LIMIT = 50;

/**
 * Kullanıcının dahil olduğu tüm sohbet odalarını,
 * karşı tarafın profil bilgisi ve son mesajla birlikte döndürür.
 */
export async function getUserChats(): Promise<ChatWithDetails[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // Kullanıcının dahil olduğu tüm sohbetleri, her iki tarafın profiliyle çek
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select(
      `
      *,
      user1:profiles!chats_user1_id_fkey(*),
      user2:profiles!chats_user2_id_fkey(*)
    `
    )
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (chatsError || !chats || chats.length === 0) {
    return [];
  }

  // Her sohbet için son mesajı tek seferde çek
  const chatIds = chats.map((c) => c.id);

  const { data: allMessages } = await supabase
    .from("messages")
    .select("*")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });

  // chat_id bazında en son mesajı grupla
  const lastMessageMap = new Map<string, Message>();
  if (allMessages) {
    for (const msg of allMessages) {
      if (!lastMessageMap.has(msg.chat_id)) {
        lastMessageMap.set(msg.chat_id, msg as Message);
      }
    }
  }

  // Sonuçları birleştir
  const result: ChatWithDetails[] = chats.map((chat) => {
    const otherUser =
      chat.user1_id === user.id
        ? (chat.user2 as Profile)
        : (chat.user1 as Profile);

    return {
      id: chat.id,
      user1_id: chat.user1_id,
      user2_id: chat.user2_id,
      created_at: chat.created_at,
      otherUser,
      lastMessage: lastMessageMap.get(chat.id) ?? null,
    };
  });

  // Son mesaja göre sırala (mesajı olan sohbetler üstte)
  result.sort((a, b) => {
    const dateA = a.lastMessage?.created_at ?? a.created_at;
    const dateB = b.lastMessage?.created_at ?? b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return result;
}

/**
 * Belirli bir sohbet odasındaki mesajları döndürür.
 * En eskiden en yeniye sıralı (chat UI mantığı).
 */
export async function getChatMessages(chatId: string): Promise<Message[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(MESSAGES_LIMIT);

  if (error) {
    return [];
  }

  return (data as Message[]) ?? [];
}

/**
 * İki kullanıcı arasında mevcut sohbeti bulur veya yeni oluşturur.
 * Profildeki "Mesaj Gönder" butonu için kullanılır.
 */
export async function getOrCreateChat(
  targetUserId: string
): Promise<{ chatId: string | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { chatId: null, error: "Bu işlem için giriş yapmalısınız." };
  }

  if (user.id === targetUserId) {
    return { chatId: null, error: "Kendinize mesaj gönderemezsiniz." };
  }

  // Küçük UUID -> user1_id, büyük UUID -> user2_id
  const [user1Id, user2Id] =
    user.id < targetUserId
      ? [user.id, targetUserId]
      : [targetUserId, user.id];

  try {
    // Mevcut sohbeti ara
    const { data: existing, error: selectError } = await supabase
      .from("chats")
      .select("id")
      .eq("user1_id", user1Id)
      .eq("user2_id", user2Id)
      .maybeSingle();

    if (selectError) {
      return { chatId: null, error: "Sohbet aranırken bir hata oluştu." };
    }

    if (existing) {
      return { chatId: existing.id, error: null };
    }

    // Mevcut yoksa yeni oluştur (trigger sıralamayı garanti eder ama biz de sıralı gönderiyoruz)
    const { data: newChat, error: insertError } = await supabase
      .from("chats")
      .insert({ user1_id: user1Id, user2_id: user2Id })
      .select("id")
      .single();

    if (insertError) {
      return { chatId: null, error: "Sohbet oluşturulamadı." };
    }

    return { chatId: newChat.id, error: null };
  } catch {
    return { chatId: null, error: "Beklenmeyen bir hata oluştu." };
  }
}
