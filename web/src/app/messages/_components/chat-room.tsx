"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Message } from "@/types/database";
import ChatInput from "./chat-input";

interface ChatRoomProps {
  chatId: string;
  currentUserId: string;
  initialMessages: Message[];
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatRoom({
  chatId,
  currentUserId,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Otomatik en alta kaydir
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Supabase Realtime aboneligi
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Duplikasyon kontrolu
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return (
    <>
      {/* Mesaj Listesi */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-500">
              Henüz mesaj yok. Sohbeti başlatın!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-zinc-800 text-zinc-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-right text-[11px] ${
                      isMine ? "text-blue-200" : "text-zinc-500"
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mesaj Gonderme Formu */}
      <ChatInput chatId={chatId} />
    </>
  );
}
