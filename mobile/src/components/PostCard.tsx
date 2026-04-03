import { memo, useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { PostWithAuthor } from "../types/database";

interface PostCardProps {
  post: PostWithAuthor;
  onComment?: (postId: string) => void;
  onProfilePress?: (username: string) => void;
  onPress?: (postId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ay`;
  return `${Math.floor(months / 12)}y`;
}

function PostCard({
  post,
  onComment,
  onProfilePress,
  onPress,
}: PostCardProps) {
  const { user } = useAuth();
  const { profiles } = post;
  const initial = profiles.display_name.charAt(0).toUpperCase();

  // Başlangıç değerlerini doğrudan post objesinden türet
  const [liked, setLiked] = useState(
    () => (post.user_likes?.length ?? 0) > 0
  );
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [likeBusy, setLikeBusy] = useState(false);

  const [bookmarked, setBookmarked] = useState(
    () => (post.user_bookmarks?.length ?? 0) > 0
  );
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmark_count);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const handleLike = useCallback(async () => {
    if (!user || likeBusy) return;
    setLikeBusy(true);

    // Optimistic güncelle
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !liked;

    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: user.id, post_id: post.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
        if (error) throw error;
      }
    } catch {
      // Rollback
      setLiked(prevLiked);
      setLikeCount(prevCount);
      Alert.alert("Hata", "Beğeni işlemi başarısız oldu.");
    } finally {
      setLikeBusy(false);
    }
  }, [user, liked, likeCount, likeBusy, post.id]);

  const handleBookmark = useCallback(async () => {
    if (!user || bookmarkBusy) return;
    setBookmarkBusy(true);

    // Optimistic güncelle
    const prevBookmarked = bookmarked;
    const prevCount = bookmarkCount;
    const nextBookmarked = !bookmarked;

    setBookmarked(nextBookmarked);
    setBookmarkCount((c) => c + (nextBookmarked ? 1 : -1));

    try {
      if (nextBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, post_id: post.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", post.id);
        if (error) throw error;
      }
    } catch {
      // Rollback
      setBookmarked(prevBookmarked);
      setBookmarkCount(prevCount);
      Alert.alert("Hata", "Kaydetme işlemi başarısız oldu.");
    } finally {
      setBookmarkBusy(false);
    }
  }, [user, bookmarked, bookmarkCount, bookmarkBusy, post.id]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(post.id)}
      className="flex-row border-b border-zinc-800 px-4 py-3"
    >
      {/* Avatar */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onProfilePress?.(profiles.username)}
        className="mr-3"
      >
        {profiles.avatar_url ? (
          <Image
            source={{ uri: profiles.avatar_url }}
            className="w-11 h-11 rounded-full bg-zinc-800"
          />
        ) : (
          <View className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center">
            <Text className="text-sm font-bold text-zinc-300">{initial}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* İçerik */}
      <View className="flex-1 min-w-0">
        {/* Üst satır */}
        <View className="flex-row items-center flex-wrap">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onProfilePress?.(profiles.username)}
          >
            <Text
              className="text-white font-bold text-[15px]"
              numberOfLines={1}
            >
              {profiles.display_name}
            </Text>
          </TouchableOpacity>
          <Text className="text-zinc-500 text-[13px] ml-1.5" numberOfLines={1}>
            @{profiles.username}
          </Text>
          <Text className="text-zinc-600 text-xs mx-1">·</Text>
          <Text className="text-zinc-500 text-xs">
            {formatTimeAgo(post.created_at)}
          </Text>
        </View>

        {/* Gönderi metni */}
        <Text className="text-zinc-100 text-[15px] leading-[22px] mt-1">
          {post.content}
        </Text>

        {/* Etiketler */}
        {post.post_tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2 gap-1.5">
            {post.post_tags.map(({ tags }) => (
              <View
                key={tags.id}
                className="bg-zinc-800/80 rounded-full px-2.5 py-0.5"
              >
                <Text className="text-zinc-400 text-xs">#{tags.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Etkileşim butonları */}
        <View className="flex-row items-center justify-between mt-3 mr-8">
          {/* Yorum */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onComment?.(post.id)}
            className="flex-row items-center gap-1.5 py-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chatbubble-outline" size={17} color="#71717a" />
            {post.comment_count > 0 && (
              <Text className="text-zinc-500 text-xs">
                {post.comment_count}
              </Text>
            )}
          </TouchableOpacity>

          {/* Beğen */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleLike}
            disabled={likeBusy}
            className="flex-row items-center gap-1.5 py-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={17}
              color={liked ? "#F91880" : "#71717a"}
            />
            {likeCount > 0 && (
              <Text
                className={`text-xs ${
                  liked ? "text-[#F91880]" : "text-zinc-500"
                }`}
              >
                {likeCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Kaydet */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleBookmark}
            disabled={bookmarkBusy}
            className="flex-row items-center gap-1.5 py-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={17}
              color={bookmarked ? "#1D9BF0" : "#71717a"}
            />
            {bookmarkCount > 0 && (
              <Text
                className={`text-xs ${
                  bookmarked ? "text-[#1D9BF0]" : "text-zinc-500"
                }`}
              >
                {bookmarkCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(PostCard);
