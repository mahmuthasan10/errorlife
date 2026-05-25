import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../src/providers/AuthProvider";
import { NotificationSkeletonList } from "../../src/components/notifications/NotificationSkeleton";
import Avatar from "../../src/components/ui/Avatar";
import {
  useInteractionNotifications,
  useFollowNotifications,
  useMessageNotifications,
  useJobNotifications,
  notificationKeys,
} from "../../src/hooks/queries/useNotifications";
import {
  useMarkInteractionRead,
  useMarkFollowRead,
  useMarkJobRead,
} from "../../src/hooks/mutations/useMarkNotificationRead";
import { logger } from "../../src/lib/logger";
import type {
  InteractionNotificationRow,
  FollowNotificationRow,
  MessageNotificationRow,
  JobNotificationRow,
} from "@errorlife/shared/types";

type Tab = "interactions" | "follows" | "messages" | "jobs";

const TABS: { key: Tab; label: string }[] = [
  { key: "interactions", label: "Etkileşimler" },
  { key: "follows",      label: "Takipler" },
  { key: "messages",     label: "Mesajlar" },
  { key: "jobs",         label: "İlanlar" },
];

// Beğeni → post detay, yorum → comments — whitelist ile güvenli routing
type InteractionKind = "like" | "comment";
const ROUTE_BY_KIND: Record<InteractionKind, (postId: string) => string> = {
  like:    (id) => `/post/${id}`,
  comment: (id) => `/post/${id}/comments`,
};

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
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <View className="w-14 h-14 rounded-full bg-zinc-900 items-center justify-center mb-3">
        <Ionicons name="notifications-outline" size={28} color="#52525b" />
      </View>
      <Text className="text-zinc-500 text-center text-sm">{message}</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("interactions");

  const {
    data: interactions = [],
    isLoading: iLoadingI,
    refetch: refetchI,
  } = useInteractionNotifications();

  const {
    data: follows = [],
    isLoading: iLoadingF,
    refetch: refetchF,
  } = useFollowNotifications();

  const {
    data: messages = [],
    isLoading: iLoadingM,
    refetch: refetchM,
  } = useMessageNotifications();

  const {
    data: jobs = [],
    isLoading: iLoadingJ,
    refetch: refetchJ,
  } = useJobNotifications();

  const { mutate: markInteractionRead } = useMarkInteractionRead();
  const { mutate: markFollowRead }      = useMarkFollowRead();
  const { mutate: markJobRead }         = useMarkJobRead();

  const isLoading = iLoadingI || iLoadingF || iLoadingM || iLoadingJ;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ekrana her odaklanıldığında stale olan verileri invalidate et
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all(user.id) });
    }, [queryClient, user])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchI(), refetchF(), refetchM(), refetchJ()]);
    setIsRefreshing(false);
  }, [refetchI, refetchF, refetchM, refetchJ]);

  const handleInteractionPress = useCallback(
    (row: InteractionNotificationRow) => {
      if (!row.post_id) {
        logger.warn("notifications.interaction.missing_post_id", { row: row as unknown as Record<string, unknown> });
        return;
      }

      if (!row.is_read) {
        markInteractionRead(row);
      }

      const builder = ROUTE_BY_KIND[row.kind as InteractionKind];
      if (!builder) {
        logger.error("notifications.interaction.unknown_kind", { kind: row.kind });
        return;
      }
      router.push(builder(row.post_id));
    },
    [router, markInteractionRead]
  );

  const handleFollowPress = useCallback(
    (row: FollowNotificationRow) => {
      if (!row.is_read) {
        markFollowRead(row);
      }
    },
    [markFollowRead]
  );

  const handleJobPress = useCallback(
    (row: JobNotificationRow) => {
      if (!row.is_read) {
        markJobRead(row);
      }
      if (row.job_id) {
        router.push(`/jobs/${row.job_id}`);
      } else {
        logger.warn("notifications.job.missing_job_id", { row: row as unknown as Record<string, unknown> });
      }
    },
    [router, markJobRead]
  );

  // ─── Badge sayıları ────────────────────────────────────────
  const badgeMap: Record<Tab, number> = {
    interactions: interactions.filter((r) => !r.is_read).length,
    follows:      follows.filter((r) => !r.is_read).length,
    messages:     messages.reduce((s, r) => s + r.unread_count, 0),
    jobs:         jobs.filter((r) => !r.is_read).length,
  };

  // ─── Render fonksiyonları ──────────────────────────────────
  const renderInteraction = ({ item }: { item: InteractionNotificationRow }) => {
    const isComment = item.kind === "comment";
    const iconName  = isComment ? "chatbubble" : "heart";
    const iconColor = isComment ? "#fb923c" : "#f87171";
    const text = isComment
      ? "gönderine yorum yaptı."
      : item.actor_count === 1
        ? "gönderini beğendi."
        : `ve diğer ${item.actor_count - 1} kişi gönderini beğendi.`;

    return (
      <TouchableOpacity
        onPress={() => handleInteractionPress(item)}
        activeOpacity={0.7}
        className={`flex-row items-start gap-3 px-4 py-3 border-b border-zinc-800 ${
          !item.is_read ? "bg-blue-500/10" : ""
        }`}
      >
        <View>
          <Avatar uri={item.latest_actor_avatar_url} fallback={item.latest_actor_display_name} />
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
            <Ionicons name={iconName} size={12} color={iconColor} />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm">
            <Text className="font-bold">{item.latest_actor_display_name}</Text>{" "}
            {text}
          </Text>
          <Text className="text-zinc-500 text-xs mt-0.5">{timeAgo(item.latest_at)}</Text>
        </View>
        {!item.is_read && <View className="w-2 h-2 mt-2 rounded-full bg-blue-500" />}
      </TouchableOpacity>
    );
  };

  const renderFollow = ({ item }: { item: FollowNotificationRow }) => (
    <TouchableOpacity
      onPress={() => handleFollowPress(item)}
      activeOpacity={0.7}
      className={`flex-row items-start gap-3 px-4 py-3 border-b border-zinc-800 ${
        !item.is_read ? "bg-blue-500/10" : ""
      }`}
    >
      <View>
        <Avatar uri={item.actor_avatar_url} fallback={item.actor_display_name} />
        <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
          <Ionicons name="person-add" size={12} color="#60a5fa" />
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm">
          <Text className="font-bold">{item.actor_display_name}</Text> seni takip etmeye başladı.
        </Text>
        <Text className="text-zinc-500 text-xs mt-0.5">{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read && <View className="w-2 h-2 mt-2 rounded-full bg-blue-500" />}
    </TouchableOpacity>
  );

  const renderJob = ({ item }: { item: JobNotificationRow }) => {
    let iconName: "briefcase" | "checkmark-circle" | "close-circle" = "briefcase";
    let iconColor = "#06b6d4";
    let actionText = "ilanına teklif verdi.";

    if (item.type === "BID_ACCEPTED") {
      iconName = "checkmark-circle";
      iconColor = "#22c55e";
      actionText = "teklifini kabul etti.";
    } else if (item.type === "BID_REJECTED") {
      iconName = "close-circle";
      iconColor = "#f87171";
      actionText = "teklifini reddetti.";
    }

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(item)}
        activeOpacity={0.7}
        className={`flex-row items-start gap-3 px-4 py-3 border-b border-zinc-800 ${
          !item.is_read ? "bg-blue-500/10" : ""
        }`}
      >
        <View>
          <Avatar uri={item.actor_avatar_url} fallback={item.actor_display_name} />
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
            <Ionicons name={iconName} size={12} color={iconColor} />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm">
            <Text className="font-bold">{item.actor_display_name}</Text>{" "}
            {actionText}
          </Text>
          {item.job_title && (
            <Text numberOfLines={1} className="text-zinc-400 text-sm mt-0.5">
              “{item.job_title}”
            </Text>
          )}
          <Text className="text-zinc-500 text-xs mt-0.5">{timeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View className="w-2 h-2 mt-2 rounded-full bg-blue-500" />}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: MessageNotificationRow }) => {
    const hasUnread = item.unread_count > 0;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/messages/${item.chat_id}`)}
        activeOpacity={0.7}
        className={`flex-row items-center gap-3 px-4 py-3 border-b border-zinc-800 ${
          hasUnread ? "bg-blue-500/10" : ""
        }`}
      >
        <View>
          <Avatar
            uri={item.other_user_avatar_url}
            fallback={item.other_user_display_name}
            size={44}
          />
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
            <Ionicons name="chatbubble-ellipses" size={12} color="#c084fc" />
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className={`text-sm font-bold flex-1 ${hasUnread ? "text-white" : "text-zinc-300"}`}>
              {item.other_user_display_name}
            </Text>
            <Text className={`text-xs ${hasUnread ? "text-blue-400 font-semibold" : "text-zinc-500"}`}>
              {timeAgo(item.last_message_at)}
            </Text>
          </View>
          <Text numberOfLines={1} className={`text-sm ${hasUnread ? "text-white font-semibold" : "text-zinc-500"}`}>
            {item.last_message_content ?? "Henüz mesaj yok"}
          </Text>
        </View>
        {hasUnread && (
          <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {item.unread_count > 9 ? "9+" : item.unread_count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    if (isLoading) return <NotificationSkeletonList count={6} />;

    switch (activeTab) {
      case "interactions":
        return interactions.length === 0 ? (
          <EmptyState message="Henüz yorum veya beğeni bildirimin yok." />
        ) : (
          <FlatList
            data={interactions}
            keyExtractor={(r) =>
              r.kind === "comment"
                ? (r.notification_id ?? r.post_id)
                : `like-${r.post_id}`
            }
            renderItem={renderInteraction}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1D9BF0"
                colors={["#1D9BF0"]}
                progressBackgroundColor="#18181b"
              />
            }
          />
        );
      case "follows":
        return follows.length === 0 ? (
          <EmptyState message="Henüz seni takip eden olmadı." />
        ) : (
          <FlatList
            data={follows}
            keyExtractor={(r) => r.notification_id}
            renderItem={renderFollow}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1D9BF0"
                colors={["#1D9BF0"]}
                progressBackgroundColor="#18181b"
              />
            }
          />
        );
      case "messages":
        return messages.length === 0 ? (
          <EmptyState message="Henüz mesajlaşman yok." />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(r) => r.chat_id}
            renderItem={renderMessage}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1D9BF0"
                colors={["#1D9BF0"]}
                progressBackgroundColor="#18181b"
              />
            }
          />
        );
      case "jobs":
        return jobs.length === 0 ? (
          <EmptyState message="Henüz ilan/teklif bildirimin yok." />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(r) => r.notification_id}
            renderItem={renderJob}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1D9BF0"
                colors={["#1D9BF0"]}
                progressBackgroundColor="#18181b"
              />
            }
          />
        );
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      <View className="px-4 py-3 border-b border-zinc-800">
        <Text className="text-white text-xl font-bold">Bildirimler</Text>
      </View>

      <View className="flex-row border-b border-zinc-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge    = badgeMap[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 items-center justify-center py-3"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-1.5">
                <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-500"}`}>
                  {tab.label}
                </Text>
                {badge > 0 && (
                  <View className="bg-blue-500 rounded-full px-1.5 min-w-4 h-4 items-center justify-center">
                    <Text className="text-white text-[10px] font-bold">
                      {badge > 99 ? "99+" : badge}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && (
                <View className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
