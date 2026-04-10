"use client";

import { useEffect, createElement } from "react";
import { toast } from "sonner";
import { UserCheck, Heart, MessageCircle, DollarSign, MessageSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NotificationProviderProps {
  currentUserId: string;
}

interface NotificationPayload {
  type: "FOLLOW" | "BID" | "MESSAGE" | "LIKE" | "COMMENT";
  actor_id: string;
  entity_id: string | null;
}

const NOTIFICATION_CONFIG: Record<
  NotificationPayload["type"],
  { text: string; icon: typeof UserCheck; iconClass: string }
> = {
  FOLLOW: {
    text: "Biri seni takip etmeye başladı!",
    icon: UserCheck,
    iconClass: "text-blue-400",
  },
  BID: {
    text: "İlanına yeni bir teklif geldi!",
    icon: DollarSign,
    iconClass: "text-green-400",
  },
  MESSAGE: {
    text: "Yeni bir mesajın var!",
    icon: MessageCircle,
    iconClass: "text-purple-400",
  },
  LIKE: {
    text: "Gönderini birisi beğendi!",
    icon: Heart,
    iconClass: "text-red-500 fill-red-500",
  },
  COMMENT: {
    text: "Gönderine yeni bir yorum yapıldı!",
    icon: MessageSquare,
    iconClass: "text-orange-400",
  },
};

function handleNewNotification(payload: NotificationPayload) {
  const config = NOTIFICATION_CONFIG[payload.type];
  if (!config) return;

  toast(config.text, {
    icon: createElement(config.icon, {
      size: 18,
      className: config.iconClass,
    }),
  });
}

export default function NotificationProvider({ currentUserId }: NotificationProviderProps) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          handleNewNotification(payload.new as NotificationPayload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  return null;
}
