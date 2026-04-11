"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageSquare,
  UserPlus,
  MessageCircle,
  Bell,
} from "lucide-react";
import { markAsRead } from "@/app/actions/notifications";
import { createClient } from "@/utils/supabase/client";
import type {
  InteractionNotificationRow,
  FollowNotificationRow,
  MessageNotificationRow,
} from "@/types/database";

// ── Yardımcı ─────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}g`;
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

function Avatar({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className: string;
}) {
  if (url) return <img src={url} alt={name} className={className} />;
  return (
    <div
      className={`${className} flex items-center justify-center bg-zinc-800 text-sm font-bold text-zinc-400`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function UnreadDot() {
  return <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />;
}

// ── Tab ───────────────────────────────────────────────────────

type Tab = "interactions" | "follows" | "messages";

const TABS: { id: Tab; label: string }[] = [
  { id: "interactions", label: "Etkileşimler" },
  { id: "follows", label: "Takipler" },
  { id: "messages", label: "Mesajlar" },
];

// ── Etkileşim Satırı ──────────────────────────────────────────

function InteractionRow({ row }: { row: InteractionNotificationRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isComment = row.kind === "comment";
  const Icon = isComment ? MessageSquare : Heart;
  const iconColor = isComment ? "text-orange-400" : "text-red-400";

  const actionText =
    isComment
      ? "gönderine yorum yaptı."
      : row.actor_count === 1
        ? "gönderini beğendi."
        : `ve diğer ${row.actor_count - 1} kişi gönderini beğendi.`;

  function handleClick() {
    startTransition(async () => {
      if (!row.is_read) {
        if (isComment && row.notification_id) {
          await markAsRead(row.notification_id);
        } else if (!isComment && row.post_id) {
          const supabase = createClient();
          await supabase.rpc("mark_like_notifications_read", {
            p_post_id: row.post_id,
          });
        }
      }
      router.push(`/post/${row.post_id}`);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex w-full items-start gap-3 border-b border-zinc-800 px-4 py-3 text-left transition-colors hover:bg-zinc-900/50 disabled:opacity-60 ${
        !row.is_read ? "bg-blue-500/10" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          url={row.latest_actor_avatar_url}
          name={row.latest_actor_display_name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span
          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black ${iconColor}`}
        >
          <Icon className="h-3 w-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#e7e9ea]">
          <span className="font-bold">{row.latest_actor_display_name}</span>{" "}
          {actionText}
        </p>
        <span className="text-xs text-zinc-500">{timeAgo(row.latest_at)}</span>
      </div>
      {!row.is_read && <UnreadDot />}
    </button>
  );
}

// ── Takip Satırı ──────────────────────────────────────────────

function FollowRow({ row }: { row: FollowNotificationRow }) {
  const [isPending, startTransition] = useTransition();

  function handleRead() {
    if (!row.is_read) {
      startTransition(() => {
        void markAsRead(row.notification_id);
      });
    }
  }

  return (
    <Link
      href={`/profile/${row.actor_username}`}
      onClick={handleRead}
      className={`flex w-full items-start gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-900/50 ${
        !row.is_read ? "bg-blue-500/10" : ""
      } ${isPending ? "opacity-60" : ""}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          url={row.actor_avatar_url}
          name={row.actor_display_name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-blue-400">
          <UserPlus className="h-3 w-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#e7e9ea]">
          <span className="font-bold">{row.actor_display_name}</span> seni takip
          etmeye başladı.
        </p>
        <span className="text-xs text-zinc-500">{timeAgo(row.created_at)}</span>
      </div>
      {!row.is_read && <UnreadDot />}
    </Link>
  );
}

// ── Mesaj Satırı ──────────────────────────────────────────────

function MessageRow({ row }: { row: MessageNotificationRow }) {
  const hasUnread = row.unread_count > 0;

  return (
    <Link
      href={`/messages/${row.chat_id}`}
      className={`flex items-center gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-900/50 ${
        hasUnread ? "bg-blue-500/10" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          url={row.other_user_avatar_url}
          name={row.other_user_display_name}
          className="h-11 w-11 rounded-full object-cover"
        />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-purple-400">
          <MessageCircle className="h-3 w-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm font-bold ${hasUnread ? "text-white" : "text-zinc-300"}`}
          >
            {row.other_user_display_name}
          </span>
          <span
            className={`shrink-0 text-xs ${hasUnread ? "font-semibold text-blue-400" : "text-zinc-500"}`}
          >
            {timeAgo(row.last_message_at)}
          </span>
        </div>
        <p
          className={`truncate text-sm ${hasUnread ? "font-semibold text-white" : "text-zinc-500"}`}
        >
          {row.last_message_content ?? "Henüz mesaj yok"}
        </p>
      </div>
      {hasUnread && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
          {row.unread_count > 9 ? "9+" : row.unread_count}
        </div>
      )}
    </Link>
  );
}

// ── Boş Durum ─────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
        <Bell className="h-7 w-7 text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────

interface Props {
  interactions: InteractionNotificationRow[];
  follows: FollowNotificationRow[];
  messages: MessageNotificationRow[];
}

export default function NotificationsTabsClient({
  interactions,
  follows,
  messages,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("interactions");

  const badgeMap: Record<Tab, number> = {
    interactions: interactions.filter((r) => !r.is_read).length,
    follows: follows.filter((r) => !r.is_read).length,
    messages: messages.reduce((s, r) => s + r.unread_count, 0),
  };

  return (
    <>
      {/* Tab Bar */}
      <div className="sticky top-[52px] z-10 flex border-b border-zinc-800 bg-black">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = badgeMap[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
                isActive ? "text-[#e7e9ea]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {badge > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* İçerik */}
      {activeTab === "interactions" && (
        <div>
          {interactions.length === 0 ? (
            <EmptyState message="Henüz yorum veya beğeni bildirimin yok." />
          ) : (
            interactions.map((row) => (
              <InteractionRow
                key={
                  row.kind === "comment"
                    ? row.notification_id
                    : `like-${row.post_id}`
                }
                row={row}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "follows" && (
        <div>
          {follows.length === 0 ? (
            <EmptyState message="Henüz seni takip eden olmadı." />
          ) : (
            follows.map((row) => (
              <FollowRow key={row.notification_id} row={row} />
            ))
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div>
          {messages.length === 0 ? (
            <EmptyState message="Henüz mesajlaşman yok." />
          ) : (
            messages.map((row) => <MessageRow key={row.chat_id} row={row} />)
          )}
        </div>
      )}
    </>
  );
}
