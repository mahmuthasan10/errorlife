import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { PostWithAuthor } from "@errorlife/shared/types";
import Avatar from "../../../src/components/ui/Avatar";
import PostInteractionBar from "../../../src/components/feed/PostInteractionBar";
import { useAuth } from "../../../src/providers/AuthProvider";
import { usePostInteraction } from "../../../src/hooks/usePostInteraction";
import {
  fetchPostById,
} from "../../../src/lib/post-queries";
import { formatTimeAgo } from "../../../src/utils/format-time";

export default function PostDetailScreen() {
  const { id: postId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Single-post setter shim for usePostInteraction (postslar listesi yerine tek post)
  const setPosts = useCallback<
    React.Dispatch<React.SetStateAction<PostWithAuthor[]>>
  >((updater) => {
    setPost((prev) => {
      if (!prev) return prev;
      const next =
        typeof updater === "function" ? updater([prev]) : (updater as PostWithAuthor[]);
      return next[0] ?? prev;
    });
  }, []);

  const { toggleLike, toggleBookmark } = usePostInteraction({
    userId: user?.id ?? null,
    setPosts,
  });

  const load = useCallback(async () => {
    if (!postId) return;
    try {
      setHasError(false);
      const data = await fetchPostById(postId, user?.id ?? null);
      setPost(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComment = useCallback(() => {
    if (!postId) return;
    router.push(`/post/${postId}/comments`);
  }, [postId, router]);

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-black">
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D9BF0" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasError || !post) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-black">
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color="#52525b" />
          <Text className="text-zinc-500 text-sm mt-3 text-center">
            Gönderi yüklenemedi veya kaldırılmış olabilir.
          </Text>
          <TouchableOpacity
            onPress={load}
            className="mt-4 px-4 py-2 rounded-full bg-zinc-800"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-semibold">Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const liked = (post.user_likes?.length ?? 0) > 0;
  const bookmarked = (post.user_bookmarks?.length ?? 0) > 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      <Header onBack={() => router.back()} />

      <ScrollView className="flex-1">
        <View className="px-4 py-3 border-b border-zinc-800">
          <View className="flex-row items-center">
            <Avatar
              uri={post.profiles.avatar_url}
              fallback={post.profiles.display_name}
            />
            <View className="ml-3 flex-1">
              <Text className="text-white font-bold text-[15px]" numberOfLines={1}>
                {post.profiles.display_name}
              </Text>
              <Text className="text-zinc-500 text-[13px]" numberOfLines={1}>
                @{post.profiles.username}
              </Text>
            </View>
          </View>

          <Text className="text-zinc-100 text-[17px] leading-[24px] mt-3">
            {post.content}
          </Text>

          {post.post_tags.length > 0 && (
            <View className="flex-row flex-wrap mt-3 gap-1.5">
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

          <Text className="text-zinc-500 text-xs mt-3">
            {formatTimeAgo(post.created_at)}
          </Text>

          <PostInteractionBar
            liked={liked}
            bookmarked={bookmarked}
            likeCount={post.like_count}
            commentCount={post.comment_count}
            bookmarkCount={post.bookmark_count}
            onLike={() => toggleLike(post.id)}
            onComment={handleComment}
            onBookmark={() => toggleBookmark(post.id)}
          />
        </View>

        <TouchableOpacity
          onPress={handleComment}
          activeOpacity={0.7}
          className="flex-row items-center justify-center py-4 border-b border-zinc-800"
        >
          <Ionicons name="chatbubble-outline" size={16} color="#1D9BF0" />
          <Text className="text-[#1D9BF0] text-sm font-semibold ml-2">
            Yorumları gör ({post.comment_count})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text className="text-white text-lg font-bold ml-4">Gönderi</Text>
    </View>
  );
}
