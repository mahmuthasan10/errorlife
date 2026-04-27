import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import { formatTimeAgo } from "../../src/utils/format-time";
import type { ChatWithDetails, Message } from "../../src/types/database";

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      // 1) Kullanıcının dahil olduğu tüm sohbetleri, her iki tarafın profiliyle çek
      const { data: rawChats, error: chatsError } = await supabase
        .from("chats")
        .select(
          `
          *,
          user1:profiles!chats_user1_id_fkey(*),
          user2:profiles!chats_user2_id_fkey(*)
        `
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (chatsError) throw chatsError;
      if (!rawChats || rawChats.length === 0) {
        setChats([]);
        return;
      }

      // 2) Tüm sohbet ID'leri için son mesajları tek seferde çek
      const chatIds = rawChats.map((c) => c.id);

      const { data: allMessages } = await supabase
        .from("messages")
        .select("*")
        .in("chat_id", chatIds)
        .order("created_at", { ascending: false });

      // chat_id bazında son mesajı ve okunmamış sayısını hesapla
      const lastMessageMap = new Map<string, Message>();
      const unreadMap = new Map<string, number>();

      if (allMessages) {
        for (const msg of allMessages as Message[]) {
          if (!lastMessageMap.has(msg.chat_id)) {
            lastMessageMap.set(msg.chat_id, msg);
          }
          // Karşı taraftan gelen ve okunmamış mesajları say
          if (msg.sender_id !== user.id && !msg.is_read) {
            unreadMap.set(msg.chat_id, (unreadMap.get(msg.chat_id) ?? 0) + 1);
          }
        }
      }

      // 3) Sonuçları birleştir
      const result: ChatWithDetails[] = rawChats.map((chat) => {
        const otherUser =
          chat.user1_id === user.id ? chat.user2 : chat.user1;

        return {
          id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          created_at: chat.created_at,
          otherUser,
          lastMessage: lastMessageMap.get(chat.id) ?? null,
          unreadCount: unreadMap.get(chat.id) ?? 0,
        };
      });

      // Son mesaja göre sırala (en yeni mesaj üstte)
      result.sort((a, b) => {
        const dateA = a.lastMessage?.created_at ?? a.created_at;
        const dateB = b.lastMessage?.created_at ?? b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setChats(result);
    } catch {
      Alert.alert("Hata", "Sohbetler yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // İlk yükleme
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Realtime: Yeni mesaj geldiğinde listeyi güncelle
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("inbox-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChats]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchChats();
  }, [fetchChats]);

  const handleChatPress = useCallback(
    (chatId: string) => {
      router.push(`/messages/${chatId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatWithDetails }) => {
      const { otherUser, lastMessage, unreadCount } = item;
      const hasUnread = unreadCount > 0;
      const initial = otherUser.display_name?.charAt(0).toUpperCase() ?? "?";

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleChatPress(item.id)}
          className="flex-row items-center px-4 py-3 border-b border-zinc-800"
        >
          {/* Avatar */}
          <View className="relative mr-3">
            {otherUser.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                className="w-12 h-12 rounded-full bg-zinc-800"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-zinc-800 items-center justify-center">
                <Text className="text-base font-bold text-zinc-300">
                  {initial}
                </Text>
              </View>
            )}
            {/* Okunmamış göstergesi (mavi nokta) */}
            {hasUnread && (
              <View className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1D9BF0] border-2 border-black" />
            )}
          </View>

          {/* İçerik */}
          <View className="flex-1 min-w-0">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className={`text-[15px] flex-shrink ${
                  hasUnread
                    ? "text-white font-bold"
                    : "text-zinc-200 font-semibold"
                }`}
                numberOfLines={1}
              >
                {otherUser.display_name}
              </Text>
              {lastMessage && (
                <Text className="text-zinc-500 text-xs ml-2">
                  {formatTimeAgo(lastMessage.created_at)}
                </Text>
              )}
            </View>

            <View className="flex-row items-center">
              <Text
                className={`flex-1 text-[13px] ${
                  hasUnread ? "text-zinc-200 font-medium" : "text-zinc-500"
                }`}
                numberOfLines={1}
              >
                {lastMessage
                  ? lastMessage.sender_id === user?.id
                    ? `Sen: ${lastMessage.content}`
                    : lastMessage.content
                  : "Henüz mesaj yok"}
              </Text>
              {hasUnread && (
                <View className="ml-2 bg-[#1D9BF0] rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
                  <Text className="text-white text-[11px] font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#52525b"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      );
    },
    [handleChatPress, user?.id]
  );

  const keyExtractor = useCallback((item: ChatWithDetails) => item.id, []);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <Ionicons name="chatbubbles-outline" size={48} color="#3f3f46" />
        <Text className="text-zinc-500 text-base mt-4 text-center">
          Henüz sohbetin yok.{"\n"}Birinin profiline gidip mesaj gönder!
        </Text>
      </View>
    );
  }, [isLoading]);

  // Skeleton loading
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="border-b border-zinc-800 px-4 py-3">
          <Text className="text-white text-xl font-bold">Mesajlar</Text>
        </View>
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              className="flex-row items-center px-4 py-3 border-b border-zinc-800"
            >
              <View className="w-12 h-12 rounded-full bg-zinc-800 mr-3" />
              <View className="flex-1">
                <View className="flex-row justify-between mb-2">
                  <View className="w-28 h-3.5 bg-zinc-800 rounded-md" />
                  <View className="w-10 h-3 bg-zinc-800 rounded-md" />
                </View>
                <View className="w-48 h-3 bg-zinc-800 rounded-md" />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
      <View className="border-b border-zinc-800 px-4 py-3">
        <Text className="text-white text-xl font-bold">Mesajlar</Text>
      </View>

      {/* Chat Listesi */}
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#1D9BF0"
            colors={["#1D9BF0"]}
            progressBackgroundColor="#18181b"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
