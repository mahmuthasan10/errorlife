"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { loadMoreNotifications } from "@/app/actions/pagination";
import NotificationItem from "@/app/_components/notification-item";
import type { NotificationWithActor } from "@/types/database";

const PAGE_SIZE = 20;

export default function NotificationsListClient({
  initialNotifications,
}: {
  initialNotifications: NotificationWithActor[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [hasMore, setHasMore] = useState(
    initialNotifications.length === PAGE_SIZE
  );
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    const cursor = notifications[notifications.length - 1]?.created_at;
    if (!cursor || isPending) return;
    startTransition(async () => {
      const more = await loadMoreNotifications(cursor);
      if (more.length > 0)
        setNotifications((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  return (
    <div>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}

      {hasMore && (
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
