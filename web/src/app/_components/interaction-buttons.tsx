"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Bookmark, MessageCircle, Share2 } from "lucide-react";
import { toggleLike, toggleBookmark } from "@/app/actions/interactions";

interface ToggleButtonProps {
  postId: string;
  initialActive: boolean;
  initialCount: number;
}

export function LikeButton({
  postId,
  initialActive,
  initialCount,
}: ToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);

  // Realtime/revalidation ile gelen prop değişikliklerini sadece idle durumda senkronize et
  useEffect(() => {
    if (!isPending) {
      setActive(initialActive);
      setCount(initialCount);
    }
  }, [initialActive, initialCount, isPending]);

  function handleClick() {
    setCount((prev) => (active ? prev - 1 : prev + 1));
    setActive((prev) => !prev);

    startTransition(async () => {
      await toggleLike(postId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`group flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-all active:scale-95 ${
        active
          ? "text-pink-500"
          : "text-zinc-500 hover:bg-pink-500/10 hover:text-pink-500"
      }`}
    >
      <Heart
        size={18}
        className={`transition-transform group-active:scale-90 ${active ? "fill-pink-500" : ""}`}
      />
      <span className="min-w-[1ch] text-sm">{count}</span>
    </button>
  );
}

export function BookmarkButton({
  postId,
  initialActive,
  initialCount,
}: ToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!isPending) {
      setActive(initialActive);
      setCount(initialCount);
    }
  }, [initialActive, initialCount, isPending]);

  function handleClick() {
    setCount((prev) => (active ? prev - 1 : prev + 1));
    setActive((prev) => !prev);

    startTransition(async () => {
      await toggleBookmark(postId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`group flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-all active:scale-95 ${
        active
          ? "text-green-400"
          : "text-zinc-500 hover:bg-green-500/10 hover:text-green-400"
      }`}
    >
      <Bookmark
        size={18}
        className={`transition-transform group-active:scale-90 ${active ? "fill-green-400" : ""}`}
      />
      <span className="min-w-[1ch] text-sm">{count}</span>
    </button>
  );
}

export function CommentButton({
  postId,
  count,
}: {
  postId: string;
  count: number;
}) {
  return (
    <Link
      href={`/post/${postId}`}
      onClick={(e) => e.stopPropagation()}
      className="group flex items-center gap-1.5 rounded-full px-2 py-1.5 text-zinc-500 transition-all hover:bg-blue-500/10 hover:text-blue-500 active:scale-95"
    >
      <MessageCircle
        size={18}
        className="transition-transform group-active:scale-90"
      />
      <span className="min-w-[1ch] text-sm">{count}</span>
    </Link>
  );
}

export function ShareButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false);

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <button
      onClick={handleShare}
      className={`group flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-all active:scale-95 ${
        copied
          ? "text-blue-400"
          : "text-zinc-500 hover:bg-blue-500/10 hover:text-blue-400"
      }`}
    >
      <Share2 size={18} className="transition-transform group-active:scale-90" />
      {copied && <span className="text-sm">Kopyalandı!</span>}
    </button>
  );
}
