import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/providers/AuthProvider";
import type { Message, Profile } from "../../../src/types/database";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MESSAGES_LIMIT = 50;
const TYPING_TIMEOUT_MS = 2000;

// ─── Yardımcı fonksiyonlar ───────────────────────────────────────────

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) {
    return date.toLocaleDateString("tr-TR", { weekday: "long" });
  }
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

// ─── Typing Indicator Bileşeni ───────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createDotAnimation(dot1, 0);
    const a2 = createDotAnimation(dot2, 200);
    const a3 = createDotAnimation(dot3, 400);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
  });

  return (
    <View className="px-4 mb-2 flex-row justify-start">
      <View className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex-row items-center gap-1.5">
        <Animated.View
          style={dotStyle(dot1)}
          className="w-[6px] h-[6px] rounded-full bg-zinc-400"
        />
        <Animated.View
          style={dotStyle(dot2)}
          className="w-[6px] h-[6px] rounded-full bg-zinc-400"
        />
        <Animated.View
          style={dotStyle(dot3)}
          className="w-[6px] h-[6px] rounded-full bg-zinc-400"
        />
      </View>
    </View>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────

type MessageWithMeta = Message & { showDateSeparator?: boolean };

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageWithMeta[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const listRef = useRef<FlatList>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);

  // Typing debounce ref'leri
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ─── Tarih ayırıcıları ──────────────────────────────────────────

  const addDateSeparators = useCallback(
    (msgs: Message[]): MessageWithMeta[] => {
      if (msgs.length === 0) return [];

      const result: MessageWithMeta[] = [];
      let lastDateKey = "";

      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i];
        const dateKey = new Date(msg.created_at).toDateString();
        const meta: MessageWithMeta = { ...msg, showDateSeparator: false };

        if (dateKey !== lastDateKey) {
          meta.showDateSeparator = true;
          lastDateKey = dateKey;
        }

        result.push(meta);
      }

      return result.reverse();
    },
    []
  );

  // ─── Typing Broadcast ──────────────────────────────────────────

  const sendTypingEvent = useCallback(
    (typing: boolean) => {
      if (!broadcastChannelRef.current || !user) return;
      broadcastChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: user.id, isTyping: typing },
      });
    },
    [user]
  );

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingEvent(false);
    }
  }, [sendTypingEvent]);

  const handleTextChange = useCallback(
    (text: string) => {
      setNewMessage(text);

      // Boş text → typing durdu
      if (!text.trim()) {
        stopTyping();
        return;
      }

      // İlk tuş vuruşunda typing: true gönder
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTypingEvent(true);
      }

      // Her tuş vuruşunda timeout'u sıfırla (debounce)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTypingEvent(false);
        typingTimeoutRef.current = null;
      }, TYPING_TIMEOUT_MS);
    },
    [sendTypingEvent, stopTyping]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ─── Veri çekme ────────────────────────────────────────────────

  const fetchChatData = useCallback(async () => {
    if (!user || !chatId) return;

    try {
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select(
          `
          *,
          user1:profiles!chats_user1_id_fkey(*),
          user2:profiles!chats_user2_id_fkey(*)
        `
        )
        .eq("id", chatId)
        .single();

      if (chatError) throw chatError;

      const other = chat.user1_id === user.id ? chat.user2 : chat.user1;
      setOtherUser(other as Profile);

      const { data: msgs, error: msgsError } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_LIMIT);

      if (msgsError) throw msgsError;

      setMessages(addDateSeparators((msgs as Message[]) ?? []));

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch {
      Alert.alert("Hata", "Sohbet yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [user, chatId, addDateSeparators]);

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);

  // ─── Realtime: Yeni mesajları dinle ─────────────────────────────

  useEffect(() => {
    if (!user || !chatId) return;

    const channel = supabase
      .channel(`chat-messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;

          if (incoming.sender_id === user.id) return;

          // Karşı taraf mesaj gönderdi → typing durdu
          setIsOtherTyping(false);

          setMessages((prev) => addDateSeparators([incoming, ...prev]));

          supabase
            .from("messages")
            .update({ is_read: true })
            .eq("id", incoming.id)
            .then();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId, addDateSeparators]);

  // ─── Realtime: Typing Broadcast (ayrı kanal) ─────────────────

  useEffect(() => {
    if (!user || !chatId) return;

    const channel = supabase
      .channel(`typing:${chatId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as {
          userId: string;
          isTyping: boolean;
        };
        if (data.userId !== user.id) {
          setIsOtherTyping(data.isTyping);
        }
      })
      .subscribe();

    broadcastChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      broadcastChannelRef.current = null;
    };
  }, [user, chatId]);

  // ─── Mesaj gönderme ────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || !user || isSending) return;

    // Typing durumunu anında kapat
    stopTyping();

    setIsSending(true);
    setNewMessage("");

    const optimisticMsg: MessageWithMeta = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
      showDateSeparator: false,
    };

    setMessages((prev) => addDateSeparators([optimisticMsg, ...prev]));

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: trimmed,
        })
        .select("*")
        .single();

      if (error) throw error;

      setMessages((prev) =>
        addDateSeparators(
          prev.map((m) =>
            m.id === optimisticMsg.id ? (data as Message) : m
          )
        )
      );
    } catch {
      setMessages((prev) =>
        addDateSeparators(prev.filter((m) => m.id !== optimisticMsg.id))
      );
      setNewMessage(trimmed);
      Alert.alert("Hata", "Mesaj gönderilemedi. Tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  }, [user, chatId, newMessage, isSending, addDateSeparators, stopTyping]);

  // ─── Render ────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: MessageWithMeta }) => {
      const isMine = item.sender_id === user?.id;
      const isOptimistic = item.id.startsWith("temp-");

      return (
        <View>
          {item.showDateSeparator && (
            <View className="items-center my-3">
              <View className="bg-zinc-800/80 rounded-full px-3 py-1">
                <Text className="text-zinc-400 text-[11px] font-medium">
                  {formatDateSeparator(item.created_at)}
                </Text>
              </View>
            </View>
          )}

          <View
            className={`px-4 mb-1.5 flex-row ${
              isMine ? "justify-end" : "justify-start"
            }`}
          >
            <View
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                isMine
                  ? "bg-[#1D9BF0] rounded-br-md"
                  : "bg-zinc-800 rounded-bl-md"
              } ${isOptimistic ? "opacity-60" : ""}`}
            >
              <Text
                className={`text-[15px] leading-[20px] ${
                  isMine ? "text-white" : "text-zinc-100"
                }`}
              >
                {item.content}
              </Text>
              <View
                className={`flex-row items-center mt-1 gap-1 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <Text
                  className={`text-[10px] ${
                    isMine ? "text-white/60" : "text-zinc-500"
                  }`}
                >
                  {formatMessageTime(item.created_at)}
                </Text>
                {isMine && !isOptimistic && (
                  <Ionicons
                    name={item.is_read ? "checkmark-done" : "checkmark"}
                    size={12}
                    color={item.is_read ? "#60a5fa" : "rgba(255,255,255,0.5)"}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      );
    },
    [user?.id]
  );

  const keyExtractor = useCallback((item: MessageWithMeta) => item.id, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#1D9BF0" />
      </View>
    );
  }

  const headerInitial =
    otherUser?.display_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Header */}
      <View className="flex-row items-center px-3 py-3 border-b border-zinc-800 bg-black pt-14">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-2 p-1"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {otherUser?.avatar_url ? (
          <Image
            source={{ uri: otherUser.avatar_url }}
            className="w-9 h-9 rounded-full bg-zinc-800 mr-2.5"
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center mr-2.5">
            <Text className="text-xs font-bold text-zinc-300">
              {headerInitial}
            </Text>
          </View>
        )}

        <View className="flex-1 min-w-0">
          <Text className="text-white font-bold text-[15px]" numberOfLines={1}>
            {otherUser?.display_name ?? "Kullanıcı"}
          </Text>
          {isOtherTyping ? (
            <Text className="text-[#1D9BF0] text-[12px] font-medium">
              yazıyor...
            </Text>
          ) : (
            <Text className="text-zinc-500 text-[12px]" numberOfLines={1}>
              @{otherUser?.username ?? ""}
            </Text>
          )}
        </View>
      </View>

      {/* Mesaj Listesi (inverted) */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          messages.length === 0
            ? { flex: 1, justifyContent: "center", alignItems: "center" }
            : { paddingVertical: 12 }
        }
        ListEmptyComponent={
          <View className="items-center">
            <Ionicons name="chatbubble-outline" size={48} color="#3f3f46" />
            <Text className="text-zinc-500 text-sm mt-3 text-center">
              Henüz mesaj yok.{"\n"}Hadi ilk mesajı gönder!
            </Text>
          </View>
        }
      />

      {/* Yazıyor Göstergesi — FlatList ile Input arasında */}
      {isOtherTyping && <TypingIndicator />}

      {/* Mesaj Yazma Alanı */}
      <View className="flex-row items-end px-4 py-3 border-t border-zinc-800 gap-3 pb-8">
        <TextInput
          className="flex-1 bg-zinc-900 text-white rounded-2xl px-4 py-2.5 text-[14px] border border-zinc-800 max-h-32"
          placeholder="Mesaj yaz..."
          placeholderTextColor="#52525b"
          value={newMessage}
          onChangeText={handleTextChange}
          multiline
          textAlignVertical="top"
          editable={!isSending}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim() || isSending}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-full items-center justify-center mb-0.5 ${
            newMessage.trim() && !isSending ? "bg-[#1D9BF0]" : "bg-zinc-800"
          }`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={newMessage.trim() ? "#fff" : "#52525b"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
