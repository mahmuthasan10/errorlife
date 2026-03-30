import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  // Sohbet odasini ve karsi tarafin bilgilerini cek
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col border-x border-zinc-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/messages"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* Karsi taraf profili */}
        <Link
          href={`/profile/${otherUser.username}`}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.display_name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-zinc-300">
                {otherUser.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              {otherUser.display_name}
            </p>
            <p className="text-xs text-zinc-500">@{otherUser.username}</p>
          </div>
        </Link>
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
