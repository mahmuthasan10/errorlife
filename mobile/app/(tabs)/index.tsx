import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import PostCard from "../../src/components/PostCard";
import PostSkeleton from "../../src/components/PostSkeleton";
import type { PostWithAuthor } from "../../src/types/database";

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // FlatList'i kontrol etmek için Referans (En üste kaydırmak için)
  const flatListRef = useRef<FlatList>(null);
  
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- YENİ: Realtime State'i ---
  const [newPostsCount, setNewPostsCount] = useState(0);

  const fetchPosts = useCallback(async (pageNumber: number, isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
      setHasError(false);
    }

    try {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const userId = user?.id;

      let query = supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey(*),
          post_tags(tags(*)),
          user_likes:likes!left(user_id),
          user_bookmarks:bookmarks!left(user_id)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (userId) {
        query = query
          .eq("user_likes.user_id", userId)
          .eq("user_bookmarks.user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetchedPosts = (data as PostWithAuthor[]) ?? [];

      if (fetchedPosts.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isRefresh) {
        setPosts(fetchedPosts);
      } else {
        setPosts((prev) => [...prev, ...fetchedPosts]);
      }
    } catch (error) {
      setHasError(true);
      if (isRefresh) Alert.alert("Hata", "Gönderiler yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [user?.id]);

  // İlk Yükleme
  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts]);

  // --- YENİ: Supabase Realtime Dinleyicisi ---
  useEffect(() => {
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // Yeni bir post atıldığında sayacı 1 artır
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setPage(0);
    setNewPostsCount(0); // Sayfayı yenilediğimizde sayacı sıfırla
    fetchPosts(0, true);
  }, [fetchPosts]);

  // --- YENİ: Twitter Tarzı Balona Tıklama İşlevi ---
  const handleLoadNewPosts = () => {
    // 1. Listeyi pürüzsüz bir animasyonla en üste kaydır
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    // 2. Sayacı sıfırla ve veriyi yenile
    handleRefresh();
  };

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, false);
    }
  }, [isLoadingMore, hasMore, isLoading, isRefreshing, page, fetchPosts]);

  const handleComment = useCallback((postId: string) => {
    router.push(`/post/${postId}/comments`);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: PostWithAuthor }) => (
      <PostCard
        post={item}
        onComment={handleComment}
      />
    ),
    [handleComment]
  );

  const keyExtractor = useCallback((item: PostWithAuthor) => item.id, []);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-zinc-500 text-base">
          {hasError
            ? "Gönderiler yüklenemedi. Aşağı çekerek tekrar dene."
            : "Henüz gönderi yok. İlk gönderiyi sen paylaş!"}
        </Text>
      </View>
    );
  }, [isLoading, hasError]);

  const ListFooterComponent = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#1D9BF0" />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
      <View className="border-b border-zinc-800 px-4 py-3 z-10 bg-black">
        <Text className="text-white text-xl font-bold">ErrorLife</Text>
      </View>

      <View className="flex-1 relative">
        {/* YENİ: Twitter Tarzı "Yeni Gönderiler" Balonu */}
        {newPostsCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLoadNewPosts}
            className="absolute top-4 self-center z-50 bg-[#1D9BF0] px-4 py-2 rounded-full flex-row items-center shadow-lg shadow-black/50"
            style={{ elevation: 5 }}
          >
            <Ionicons name="arrow-up" size={16} color="white" className="mr-1" />
            <Text className="text-white font-bold ml-1">
              {newPostsCount} Yeni Gönderi
            </Text>
          </TouchableOpacity>
        )}

        {/* Feed */}
        {isLoading ? (
          <PostSkeleton count={6} />
        ) : (
          <FlatList
            ref={flatListRef} // Referansı bağladık
            data={posts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={ListFooterComponent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
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
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>

      {/* FAB */}
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