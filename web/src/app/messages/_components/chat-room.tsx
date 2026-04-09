"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Message } from "@/types/database";
import { markMessagesAsRead } from "@/app/actions/chat";
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

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-800 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function ChatRoom({
  chatId,
  currentUserId,
  initialMessages,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // Sohbet açıldığında okunmamış mesajları okundu işaretle
  useEffect(() => {
    markMessagesAsRead(chatId);
  }, [chatId]);

  // Realtime: Yeni mesajlar
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-messages:${chatId}`)
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

          // Karşı taraf mesaj gönderdi → okundu işaretle ve typing durdu
          if (newMessage.sender_id !== currentUserId) {
            setIsOtherTyping(false);
            markMessagesAsRead(chatId);
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  // Realtime: Typing broadcast dinle
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`typing:${chatId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as {
          userId: string;
          isTyping: boolean;
        };
        if (data.userId !== currentUserId) {
          setIsOtherTyping(data.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  return (
    <>
      {/* Mesaj Listesi */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
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
                  className={`max-w-[75%] px-3.5 py-2 ${
                    isMine
                      ? "rounded-2xl rounded-br-sm bg-blue-600 text-white"
                      : "rounded-2xl rounded-bl-sm bg-zinc-800 text-zinc-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-0.5 text-right text-[11px] ${
                      isMine ? "text-blue-200/70" : "text-zinc-500"
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Yazıyor göstergesi */}
        {isOtherTyping && <TypingDots />}

        <div ref={bottomRef} />
      </div>

      {/* Mesaj Gönderme Formu */}
      <ChatInput chatId={chatId} currentUserId={currentUserId} />
    </>
  );
}
