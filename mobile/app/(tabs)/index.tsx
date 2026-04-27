import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { PostWithAuthor } from "@errorlife/shared/types";
import { useAuth } from "../../src/providers/AuthProvider";
import { useFeedPosts } from "../../src/hooks/useFeedPosts";
import { useRealtimeFeed } from "../../src/hooks/useRealtimeFeed";
import { usePostInteraction } from "../../src/hooks/usePostInteraction";
import PostCard from "../../src/components/feed/PostCard";
import FeedSkeletonList from "../../src/components/feed/FeedSkeletonList";
import NewPostsBanner from "../../src/components/feed/NewPostsBanner";
import FeedEmptyState from "../../src/components/feed/FeedEmptyState";

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const flatListRef = useRef<FlatList<PostWithAuthor>>(null);

  const { posts, setPosts, status, refresh, loadMore } = useFeedPosts(userId);
  const { toggleLike, toggleBookmark } = usePostInteraction({ userId, setPosts });

  const [newPostsCount, setNewPostsCount] = useState(0);

  const handleNewPost = useCallback(() => {
    setNewPostsCount((c) => c + 1);
  }, []);

  useRealtimeFeed({ setPosts, onNewPost: handleNewPost });

  const handleRefresh = useCallback(async () => {
    setNewPostsCount(0);
    await refresh();
  }, [refresh]);

  const handleLoadNewPosts = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    handleRefresh();
  }, [handleRefresh]);

  const handleComment = useCallback(
    (postId: string) => router.push(`/post/${postId}/comments`),
    [router]
  );

  const handlePostPress = useCallback(
    (postId: string) => router.push(`/post/${postId}/comments`),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: PostWithAuthor }) => (
      <PostCard
        post={item}
        onLike={toggleLike}
        onBookmark={toggleBookmark}
        onComment={handleComment}
        onPress={handlePostPress}
      />
    ),
    [toggleLike, toggleBookmark, handleComment, handlePostPress]
  );

  const keyExtractor = useCallback((item: PostWithAuthor) => item.id, []);

  const renderEmpty = useCallback(() => {
    if (status.isLoading) return null;
    return (
      <FeedEmptyState
        variant={status.hasError ? "error" : "empty"}
        onRetry={handleRefresh}
      />
    );
  }, [status.isLoading, status.hasError, handleRefresh]);

  const renderFooter = useCallback(() => {
    if (!status.isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#1D9BF0" />
      </View>
    );
  }, [status.isLoadingMore]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="border-b border-zinc-800 px-4 py-3 z-10 bg-black">
        <Text className="text-white text-xl font-bold">ErrorLife</Text>
      </View>

      <View className="flex-1 relative">
        <NewPostsBanner count={newPostsCount} onPress={handleLoadNewPosts} />

        {status.isLoading && posts.length === 0 ? (
          <FeedSkeletonList count={6} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={posts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={status.isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#1D9BF0"
                colors={["#1D9BF0"]}
                progressBackgroundColor="#18181b"
              />
            }
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/new-post")}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#1D9BF0] items-center justify-center shadow-lg shadow-black/50"
        style={{ elevation: 8 }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
