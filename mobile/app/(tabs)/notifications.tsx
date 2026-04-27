import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { NotificationSkeletonList } from "../../src/components/notifications/NotificationSkeleton";
import type {
  InteractionNotificationRow,
  FollowNotificationRow,
  MessageNotificationRow,
} from "@errorlife/shared/types";

type Tab = "interactions" | "follows" | "messages";

const TABS: { key: Tab; label: string }[] = [
  { key: "interactions", label: "Etkileşimler" },
  { key: "follows", label: "Takipler" },
  { key: "messages", label: "Mesajlar" },
];

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
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-zinc-800 items-center justify-center"
    >
      <Text className="text-zinc-400 font-bold text-sm">
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
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
  const [activeTab, setActiveTab] = useState<Tab>("interactions");

  const [interactions, setInteractions] = useState<InteractionNotificationRow[]>([]);
  const [follows, setFollows] = useState<FollowNotificationRow[]>([]);
  const [messages, setMessages] = useState<MessageNotificationRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const [iRes, fRes, mRes] = await Promise.all([
        supabase.rpc("get_interaction_notifications"),
        supabase.rpc("get_follow_notifications"),
        supabase.rpc("get_message_notifications"),
      ]);

      if (iRes.error) throw iRes.error;
      if (fRes.error) throw fRes.error;
      if (mRes.error) throw mRes.error;

      setInteractions((iRes.data ?? []) as InteractionNotificationRow[]);
      setFollows((fRes.data ?? []) as FollowNotificationRow[]);
      setMessages((mRes.data ?? []) as MessageNotificationRow[]);
    } catch {
      // sessizce yut; boş liste UI'da empty state gösterir
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchAll();
  }, [fetchAll]);

  // ─── Etkileşim satırı tıklama ───────────────────────────────
  const handleInteractionPress = useCallback(
    async (row: InteractionNotificationRow) => {
      if (!row.is_read) {
        if (row.kind === "comment" && row.notification_id) {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", row.notification_id);
        } else if (row.kind === "like" && row.post_id) {
          await supabase.rpc("mark_like_notifications_read", {
            p_post_id: row.post_id,
          });
        }
        // Yerel state'i güncelle (refetch'e gerek yok)
        setInteractions((prev) =>
          prev.map((r) =>
            (r.kind === "comment" && r.notification_id === row.notification_id) ||
            (r.kind === "like" && r.post_id === row.post_id)
              ? { ...r, is_read: true }
              : r
          )
        );
      }
      router.push(`/post/${row.post_id}/comments`);
    },
    [router]
  );

  // ─── Takip satırı tıklama (sadece okundu işareti — mobilde profil route'u yok) ───
  const handleFollowPress = useCallback(async (row: FollowNotificationRow) => {
    if (row.is_read) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", row.notification_id);
    setFollows((prev) =>
      prev.map((r) =>
        r.notification_id === row.notification_id ? { ...r, is_read: true } : r
      )
    );
  }, []);

  // ─── Tab içerikleri ────────────────────────────────────────
  const renderInteraction = ({ item }: { item: InteractionNotificationRow }) => {
    const isComment = item.kind === "comment";
    const iconName = isComment ? "chatbubble" : "heart";
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
          <Avatar
            url={item.latest_actor_avatar_url}
            name={item.latest_actor_display_name}
          />
          <View
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center"
          >
            <Ionicons name={iconName} size={12} color={iconColor} />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-white text-sm">
            <Text className="font-bold">{item.latest_actor_display_name}</Text>{" "}
            {text}
          </Text>
          <Text className="text-zinc-500 text-xs mt-0.5">
            {timeAgo(item.latest_at)}
          </Text>
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
        <Avatar url={item.actor_avatar_url} name={item.actor_display_name} />
        <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
          <Ionicons name="person-add" size={12} color="#60a5fa" />
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm">
          <Text className="font-bold">{item.actor_display_name}</Text> seni takip
          etmeye başladı.
        </Text>
        <Text className="text-zinc-500 text-xs mt-0.5">
          {timeAgo(item.created_at)}
        </Text>
      </View>
      {!item.is_read && <View className="w-2 h-2 mt-2 rounded-full bg-blue-500" />}
    </TouchableOpacity>
  );

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
            url={item.other_user_avatar_url}
            name={item.other_user_display_name}
            size={44}
          />
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black items-center justify-center">
            <Ionicons name="chatbubble-ellipses" size={12} color="#c084fc" />
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              numberOfLines={1}
              className={`text-sm font-bold flex-1 ${
                hasUnread ? "text-white" : "text-zinc-300"
              }`}
            >
              {item.other_user_display_name}
            </Text>
            <Text
              className={`text-xs ${
                hasUnread ? "text-blue-400 font-semibold" : "text-zinc-500"
              }`}
            >
              {timeAgo(item.last_message_at)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            className={`text-sm ${
              hasUnread ? "text-white font-semibold" : "text-zinc-500"
            }`}
          >
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

  // ─── Tab badge sayıları ────────────────────────────────────
  const badgeMap: Record<Tab, number> = {
    interactions: interactions.filter((r) => !r.is_read).length,
    follows: follows.filter((r) => !r.is_read).length,
    messages: messages.reduce((s, r) => s + r.unread_count, 0),
  };

  // ─── Render ───────────────────────────────────────────────
  const renderTabContent = () => {
    if (isLoading) {
      return <NotificationSkeletonList count={6} />;
    }

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
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      {/* Başlık */}
      <View className="px-4 py-3 border-b border-zinc-800">
        <Text className="text-white text-xl font-bold">Bildirimler</Text>
      </View>

      {/* Tab seçici */}
      <View className="flex-row border-b border-zinc-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = badgeMap[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 items-center justify-center py-3"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-zinc-500"
                  }`}
                >
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

      {/* İçerik */}
      <View className="flex-1">{renderTabContent()}</View>
    </SafeAreaView>
  );
}
