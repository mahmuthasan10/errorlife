"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadMoreFollowers, loadMoreFollowing } from "@/app/actions/pagination";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import UserListItem from "./user-list-item";
import type { Profile } from "@/types/database";

export default function UsersListClient({
  initialUsers,
  username,
  mode,
  initialCursor,
}: {
  initialUsers: Profile[];
  username: string;
  mode: "followers" | "following";
  initialCursor: string | null;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadError, setLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor || isPending) return;
    startTransition(async () => {
      const { profiles, nextCursor, fetchError } =
        mode === "followers"
          ? await loadMoreFollowers(username, cursor)
          : await loadMoreFollowing(username, cursor);

      if (fetchError) { setLoadError(true); return; }
      setLoadError(false);
      if (profiles.length > 0) setUsers((prev) => [...prev, ...profiles]);
      setCursor(nextCursor);
    });
  }

  const sentinelRef = useInfiniteScroll(loadMore, !!cursor && !loadError);

  return (
    <div>
      {users.map((user) => (
        <UserListItem key={user.id} user={user} />
      ))}

      {loadError ? (
        <div className="py-4 text-center">
          <button onClick={loadMore} className="text-sm text-zinc-500 underline hover:text-zinc-300">
            Yükleme başarısız. Tekrar dene
          </button>
        </div>
      ) : cursor ? (
        <div ref={sentinelRef} className="py-6 text-center text-zinc-500">
          {isPending && <Loader2 size={20} className="mx-auto animate-spin" />}
        </div>
      ) : null}
    </div>
  );
}
