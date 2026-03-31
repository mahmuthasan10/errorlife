"use client";

import { useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { sendMessage } from "@/app/actions/chat";

interface ChatInputProps {
  chatId: string;
}

export default function ChatInput({ chatId }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) return;

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
      className="flex items-end gap-2 border-t border-zinc-800 bg-black/80 px-3 py-2.5 backdrop-blur-md"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
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
