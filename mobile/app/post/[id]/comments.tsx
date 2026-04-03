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
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/providers/AuthProvider";
import type { CommentWithAuthor } from "../../../src/types/database";

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g`;
  return `${Math.floor(days / 30)}ay`;
}

export default function CommentsModal() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles!comments_user_id_fkey(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments((data as CommentWithAuthor[]) ?? []);
    } catch {
      Alert.alert("Hata", "Yorumlar yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Klavye açılınca listeyi alta kaydır
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      if (comments.length > 0) {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    });
    return () => showSub.remove();
  }, [comments.length]);

  const handleSend = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !user || isSending) return;

    setIsSending(true);

    const username =
      (user.user_metadata?.username as string) ?? "kullanici";
    const displayName =
      (user.user_metadata?.display_name as string) ?? username;

    const optimisticComment: CommentWithAuthor = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      post_id: postId,
      content: trimmed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: user.id,
        username,
        display_name: displayName,
        avatar_url: null,
        bio: null,
        created_at: "",
        updated_at: "",
      },
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          post_id: postId,
          content: trimmed,
        })
        .select("*, profiles!comments_user_id_fkey(*)")
        .single();

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) =>
          c.id === optimisticComment.id ? (data as CommentWithAuthor) : c
        )
      );
    } catch {
      setComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id)
      );
      setNewComment(trimmed);
      Alert.alert("Hata", "Yorum gönderilemedi. Tekrar deneyin.");
    } finally {
      setIsSending(false);
    }
  };

  const renderComment = useCallback(
    ({ item }: { item: CommentWithAuthor }) => {
      const initial = item.profiles.display_name.charAt(0).toUpperCase();
      const isOptimistic = item.id.startsWith("temp-");

      return (
        <View
          className={`flex-row px-4 py-3 border-b border-zinc-800/60 ${
            isOptimistic ? "opacity-60" : ""
          }`}
        >
          <View className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center mr-3">
            <Text className="text-xs font-bold text-zinc-300">{initial}</Text>
          </View>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-white font-bold text-[13px]"
                numberOfLines={1}
              >
                {item.profiles.display_name}
              </Text>
              <Text
                className="text-zinc-500 text-[12px]"
                numberOfLines={1}
              >
                @{item.profiles.username}
              </Text>
              <Text className="text-zinc-600 text-[10px]">·</Text>
              <Text className="text-zinc-500 text-[11px]">
                {formatTimeAgo(item.created_at)}
              </Text>
            </View>
            <Text className="text-zinc-200 text-[14px] leading-[20px] mt-0.5">
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  const keyExtractor = useCallback(
    (item: CommentWithAuthor) => item.id,
    []
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <Text className="text-white text-lg font-bold">Yorumlar</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Yorum Listesi */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D9BF0" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            comments.length === 0
              ? { flex: 1, justifyContent: "center", alignItems: "center" }
              : { paddingVertical: 16 }
          }
          ListEmptyComponent={
            <View className="items-center">
              <Ionicons name="chatbubble-outline" size={40} color="#3f3f46" />
              <Text className="text-zinc-500 text-sm mt-3">
                Henüz yorum yok. İlk yorumu sen yaz!
              </Text>
            </View>
          }
        />
      )}

      {/* Yorum Yazma Alanı */}
      <View className="flex-row items-end px-4 py-3 border-t border-zinc-800 gap-3">
        <TextInput
          ref={inputRef}
          className="flex-1 bg-zinc-900 text-white rounded-2xl px-4 py-2.5 text-[14px] border border-zinc-800 max-h-32"
          placeholder="Yorum yaz..."
          placeholderTextColor="#52525b"
          value={newComment}
          onChangeText={setNewComment}
          multiline
          textAlignVertical="top"
          editable={!isSending}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newComment.trim() || isSending}
          activeOpacity={0.7}
          className={`w-10 h-10 rounded-full items-center justify-center mb-0.5 ${
            newComment.trim() && !isSending ? "bg-[#1D9BF0]" : "bg-zinc-800"
          }`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color={newComment.trim() ? "#fff" : "#52525b"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
