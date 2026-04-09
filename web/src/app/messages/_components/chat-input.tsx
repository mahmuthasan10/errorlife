"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { sendMessage } from "@/app/actions/chat";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const TYPING_TIMEOUT_MS = 2000;

interface ChatInputProps {
  chatId: string;
  currentUserId: string;
}

export default function ChatInput({ chatId, currentUserId }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Broadcast kanalını aç
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`typing:${chatId}`, {
        config: { broadcast: { self: false } },
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [chatId]);

  const sendTypingEvent = useCallback(
    (typing: boolean) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping: typing },
      });
    },
    [currentUserId]
  );

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingEvent(false);
    }
  }, [sendTypingEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    if (!text.trim()) {
      stopTyping();
      return;
    }

    // İlk tuş vuruşunda typing: true gönder
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingEvent(true);
    }

    // Debounce: her tuşta timeout sıfırla
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingEvent(false);
      typingTimeoutRef.current = null;
    }, TYPING_TIMEOUT_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) return;

    // Mesaj gönderilirken typing'i anında kapat
    stopTyping();
    setContent("");

    startTransition(async () => {
      const result = await sendMessage(chatId, trimmed);
      if (result.error) {
        setContent(trimmed);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-zinc-800 bg-black px-3 py-2.5"
    >
      <textarea
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Bir mesaj yazın..."
        rows={1}
        className="flex-1 resize-none rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-[15px] text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-40"
      >
        <SendHorizontal size={18} />
      </button>
    </form>
  );
}
