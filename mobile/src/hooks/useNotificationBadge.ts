import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

interface BadgeCounts {
  notifCount: number;
  messageCount: number;
}

export function useNotificationBadge(): BadgeCounts {
  const { user } = useAuth();
  const [counts, setCounts] = useState<BadgeCounts>({
    notifCount: 0,
    messageCount: 0,
  });

  useEffect(() => {
    if (!user) {
      setCounts({ notifCount: 0, messageCount: 0 });
      return;
    }

    let cancelled = false;

    async function refetch() {
      const { data } = await supabase.rpc("get_badge_counts");
      if (cancelled) return;
      const row = data?.[0];
      if (row) {
        setCounts({
          notifCount: Number(row.notif_count ?? 0),
          messageCount: Number(row.message_count ?? 0),
        });
      }
    }

    void refetch();

    const channel = supabase
      .channel(`badge-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => { void refetch(); }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if ((payload.new as { sender_id?: string }).sender_id !== user.id) {
            void refetch();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => { void refetch(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return counts;
}
