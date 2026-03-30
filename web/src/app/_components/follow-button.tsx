"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFollowUser } from "@/app/actions/follows";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  followersCount: number;
}

export default function FollowButton({
  targetUserId,
  isFollowing,
  followersCount,
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    { isFollowing, followersCount },
    (current) => ({
      isFollowing: !current.isFollowing,
      followersCount: current.isFollowing
        ? current.followersCount - 1
        : current.followersCount + 1,
    })
  );

  function handleClick() {
    startTransition(async () => {
      setOptimistic(null);
      await toggleFollowUser(targetUserId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
        optimistic.isFollowing
          ? "border border-zinc-600 bg-transparent text-white hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
          : "bg-white text-black hover:opacity-90"
      }`}
    >
      {optimistic.isFollowing ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
