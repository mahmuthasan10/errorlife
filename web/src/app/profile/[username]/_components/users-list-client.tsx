"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadMoreFollowers, loadMoreFollowing } from "@/app/actions/pagination";
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
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor || isPending) return;
    startTransition(async () => {
      const result =
        mode === "followers"
          ? await loadMoreFollowers(username, cursor)
          : await loadMoreFollowing(username, cursor);

      if (result.profiles.length > 0) {
        setUsers((prev) => [...prev, ...result.profiles]);
      }
      setCursor(result.nextCursor);
    });
  }

  return (
    <div>
      {users.map((user) => (
        <UserListItem key={user.id} user={user} />
      ))}

      {cursor && (
        <div className="py-6 text-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Yükleniyor...
              </span>
            ) : (
              "Daha Fazla Yükle"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
