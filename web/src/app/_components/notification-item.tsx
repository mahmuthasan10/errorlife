"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { UserPlus, DollarSign, MessageCircle, Heart, MessageSquare } from "lucide-react";
import { markAsRead } from "@/app/actions/notifications";
import type { NotificationWithActor, NotificationType } from "@/types/database";

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: typeof UserPlus;
    iconColor: string;
    getText: (displayName: string) => string;
    getHref: (notification: NotificationWithActor) => string;
  }
> = {
  FOLLOW: {
    icon: UserPlus,
    iconColor: "text-blue-400",
    getText: (name) => `${name} seni takip etmeye başladı.`,
    getHref: (n) => `/profile/${n.actor.username}`,
  },
  BID: {
    icon: DollarSign,
    iconColor: "text-green-400",
    getText: (name) => `${name} ilanına yeni bir teklif verdi.`,
    getHref: (n) => `/jobs/${n.entity_id}`,
  },
  MESSAGE: {
    icon: MessageCircle,
    iconColor: "text-purple-400",
    getText: (name) => `${name} sana bir mesaj gönderdi.`,
    getHref: (n) => `/messages/${n.entity_id}`,
  },
  LIKE: {
    icon: Heart,
    iconColor: "text-red-400",
    getText: (name) => `${name} gönderini beğendi.`,
    getHref: (n) => `/post/${n.entity_id}`,
  },
  COMMENT: {
    icon: MessageSquare,
    iconColor: "text-orange-400",
    getText: (name) => `${name} gönderine yorum yaptı.`,
    getHref: (n) => `/post/${n.entity_id}`,
  },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}dk`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}sa`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}g`;

  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

interface NotificationItemProps {
  notification: NotificationWithActor;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Actor hesabı silinmişse null gelir — çökmeyi önle
  if (!notification.actor) {
    return null;
  }

  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  function handleClick() {
    startTransition(async () => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      router.push(config.getHref(notification));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex w-full items-start gap-3 border-b border-zinc-800 px-4 py-3 text-left transition-colors hover:bg-zinc-900/50 ${
        !notification.is_read ? "bg-blue-500/10" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {notification.actor.avatar_url ? (
          <img
            src={notification.actor.avatar_url}
            alt={notification.actor.display_name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-400">
            {notification.actor.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Tip ikonu - avatar üzerinde sağ altta */}
        <div
          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black ${config.iconColor}`}
        >
          <Icon className="h-3 w-3" />
        </div>
      </div>

      {/* İçerik */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#e7e9ea]">
          <span className="font-bold">{notification.actor.display_name}</span>{" "}
          {config.getText(notification.actor.display_name).split(notification.actor.display_name)[1]}
        </p>
        <span className="text-xs text-zinc-500">
          {formatTimeAgo(notification.created_at)}
        </span>
      </div>

      {/* Okunmadı göstergesi */}
      {!notification.is_read && (
        <div className="mt-2 flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </button>
  );
}
