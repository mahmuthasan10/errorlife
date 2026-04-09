import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getUserChats } from "@/lib/chat-queries";
import type { ChatWithDetails } from "@/types/database";

export const metadata: Metadata = {
  title: "Mesajlar | ErrorLife",
};

function formatChatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) {
    return date.toLocaleDateString("tr-TR", { weekday: "short" });
  }
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const chats = await getUserChats();
  const currentUserId = user.id;

  return (
    <div className="mx-auto min-h-screen max-w-2xl border-x border-zinc-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black px-4 py-3">
        <h2 className="text-xl font-bold">Mesajlar</h2>
      </div>

      {/* Sohbet Listesi */}
      {chats.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {chats.map((chat) => (
            <ChatRow key={chat.id} chat={chat} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatRow({ chat, currentUserId }: { chat: ChatWithDetails; currentUserId: string }) {
  const { otherUser, lastMessage } = chat;
  const initial = otherUser.display_name.charAt(0).toUpperCase();
  const timeStr = lastMessage
    ? formatChatTime(lastMessage.created_at)
    : formatChatTime(chat.created_at);

  // Okunmamış mesaj var mı? (Son mesaj benden değilse ve okunmadıysa)
  const hasUnread =
    lastMessage !== null &&
    lastMessage.sender_id !== currentUserId &&
    !lastMessage.is_read;

  return (
    <Link
      href={`/messages/${chat.id}`}
      className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-950/50"
    >
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800">
        {otherUser.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.display_name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-zinc-300">{initial}</span>
        )}
      </div>

      {/* Bilgiler */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate font-bold ${hasUnread ? "text-white" : "text-zinc-300"}`}>
            {otherUser.display_name}
          </span>
          <span className={`shrink-0 text-xs ${hasUnread ? "text-blue-400 font-semibold" : "text-zinc-500"}`}>
            {timeStr}
          </span>
        </div>
        <p className={`truncate text-sm ${hasUnread ? "font-semibold text-white" : "text-zinc-500"}`}>
          {lastMessage ? lastMessage.content : "Henüz mesaj yok"}
        </p>
      </div>

      {/* Okunmamış göstergesi */}
      {hasUnread && (
        <div className="flex-shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        </div>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
        <MessageCircle size={32} className="text-zinc-600" />
      </div>
      <h3 className="text-lg font-bold text-white">Henüz mesajınız yok</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Birinin profilinden &quot;Mesaj Gönder&quot; butonuna tıklayarak sohbet
        başlatabilirsiniz.
      </p>
    </div>
  );
}
