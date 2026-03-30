"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Mail, Loader2 } from "lucide-react";
import { startChat } from "@/app/actions/chat";

interface MessageButtonProps {
  targetUserId: string;
}

export default function MessageButton({ targetUserId }: MessageButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startChat(targetUserId);
      if (result.chatId) {
        router.push(`/messages/${result.chatId}`);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 transition-colors hover:bg-zinc-900 disabled:opacity-50"
      title="Mesaj Gönder"
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin text-zinc-400" />
      ) : (
        <Mail size={18} className="text-white" />
      )}
    </button>
  );
}
