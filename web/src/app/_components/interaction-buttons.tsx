"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
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
  const [optimistic, setOptimistic] = useOptimistic(
    { active: initialActive, count: initialCount },
    (current) => ({
      active: !current.active,
      count: current.active ? current.count - 1 : current.count + 1,
    })
  );

  function handleClick() {
    startTransition(async () => {
      setOptimistic(null);
      await toggleLike(postId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 transition-colors ${
        optimistic.active
          ? "text-pink-500"
          : "text-zinc-500 hover:text-pink-500"
      }`}
    >
      <Heart
        size={18}
        className={optimistic.active ? "fill-pink-500" : ""}
      />
      <span className="text-sm">{optimistic.count}</span>
    </button>
  );
}

export function BookmarkButton({
  postId,
  initialActive,
  initialCount,
}: ToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { active: initialActive, count: initialCount },
    (current) => ({
      active: !current.active,
      count: current.active ? current.count - 1 : current.count + 1,
    })
  );

  function handleClick() {
    startTransition(async () => {
      setOptimistic(null);
      await toggleBookmark(postId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-2 transition-colors ${
        optimistic.active
          ? "text-green-400"
          : "text-zinc-500 hover:text-green-400"
      }`}
    >
      <Bookmark
        size={18}
        className={optimistic.active ? "fill-green-400" : ""}
      />
      <span className="text-sm">{optimistic.count}</span>
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
      className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-blue-400"
    >
      <MessageCircle size={18} />
      <span className="text-sm">{count}</span>
    </Link>
  );
}
