"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/utils/supabase/client";

interface BadgeState {
  notifCount: number;
  messageCount: number;
}

const BadgeContext = createContext<BadgeState>({ notifCount: 0, messageCount: 0 });

export function useBadge() {
  return useContext(BadgeContext);
}

interface BadgeProviderProps {
  children: ReactNode;
  initialNotifCount: number;
  initialMessageCount: number;
  currentUserId: string;
}

export function BadgeProvider({
  children,
  initialNotifCount,
  initialMessageCount,
  currentUserId,
}: BadgeProviderProps) {
  const [counts, setCounts] = useState<BadgeState>({
    notifCount: initialNotifCount,
    messageCount: initialMessageCount,
  });

  useEffect(() => {
    const supabase = createClient();

    async function refetch() {
      const { data } = await supabase.rpc("get_badge_counts");
      if (data?.[0]) {
        setCounts({
          notifCount: Number(data[0].notif_count ?? 0),
          messageCount: Number(data[0].message_count ?? 0),
        });
      }
    }

    const channel = supabase
      .channel("badge-realtime")
      // Bildirim INSERT (yeni bildirim) veya UPDATE (okundu işareti) → yeniden çek
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => { void refetch(); }
      )
      // Yeni mesaj geldi veya mesaj okundu işaretlendi → yeniden çek
      // RLS sayesinde sadece bu kullanıcının sohbetlerindeki mesajlar tetikler
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Sadece karşı tarafın gönderdiği mesajlar ilgili
          if (payload.new.sender_id !== currentUserId) {
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
      void supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return (
    <BadgeContext.Provider value={counts}>
      {children}
    </BadgeContext.Provider>
  );
}
