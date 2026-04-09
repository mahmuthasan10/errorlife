import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getChatMessages } from "@/lib/chat-queries";
import type { Profile } from "@/types/database";
import ChatRoom from "../_components/chat-room";

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select(
      `
      *,
      user1:profiles!chats_user1_id_fkey(*),
      user2:profiles!chats_user2_id_fkey(*)
    `
    )
    .eq("id", chatId)
    .maybeSingle();

  if (chatError || !chat) {
    redirect("/messages");
  }

  const otherUser =
    chat.user1_id === user.id
      ? (chat.user2 as Profile)
      : (chat.user1 as Profile);

  const initialMessages = await getChatMessages(chatId);

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-2xl flex-col border-x border-zinc-800 md:h-dvh">
      {/* Sticky Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 bg-black px-3 py-2.5">
        <Link
          href="/messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Karşı taraf profili */}
        <Link
          href={`/profile/${otherUser.username}`}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.display_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-zinc-300">
                {otherUser.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-white">
              {otherUser.display_name}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {otherUser.bio || "ErrorLife kullanıcısı"}
            </p>
          </div>
        </Link>

        {/* Seçenekler */}
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-zinc-900">
          <MoreVertical size={18} className="text-zinc-400" />
        </button>
      </div>

      {/* Chat Room (Client Component) */}
      <ChatRoom
        chatId={chatId}
        currentUserId={user.id}
        initialMessages={initialMessages}
      />
    </div>
  );
}
