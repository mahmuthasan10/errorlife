import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import Avatar from "../../src/components/ui/Avatar";
import PostCard from "../../src/components/feed/PostCard";
import FeedSkeletonList from "../../src/components/feed/FeedSkeletonList";
import { usePostInteraction } from "../../src/hooks/usePostInteraction";
import type { Profile, PostWithAuthor } from "../../src/types/database";

const POST_SELECT = `
  *,
  profiles!posts_user_id_fkey(*),
  post_tags(tags(*)),
  user_likes:likes!left(user_id),
  user_bookmarks:bookmarks!left(user_id)
` as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { toggleLike, toggleBookmark } = usePostInteraction({ userId, setPosts });

  // ─── Profil + Gönderiler ──────────────────────────────────────────────
  const fetchProfileAndPosts = useCallback(async () => {
    if (!user) return;

    try {
      // Profil bilgisi
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      // Kullanıcının kendi gönderileri
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("user_id", user.id)
        .eq("user_likes.user_id", user.id)
        .eq("user_bookmarks.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts((postsData as unknown as PostWithAuthor[]) ?? []);
    } catch {
      Alert.alert("Hata", "Profil yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          await supabase.auth.signOut();
        },
      },
    ]);
  }, []);

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

  const renderEmpty = useCallback(
    () => (
      <View className="items-center py-16 px-6">
        <Ionicons name="document-outline" size={44} color="#3f3f46" />
        <Text className="text-zinc-500 text-base mt-4 text-center">
          Henüz gönderi paylaşmadın.{"\n"}İlk gönderini paylaş!
        </Text>
      </View>
    ),
    []
  );

  const renderFooter = useCallback(
    () => <View className="h-24" />,
    []
  );

  // ─── Profil Header ────────────────────────────────────────────────────
  const ProfileHeader = useCallback(() => {
    if (!profile) return null;

    const initial = profile.display_name?.charAt(0).toUpperCase() ?? "?";
    const postCount = posts.length;

    return (
      <View className="border-b border-zinc-800 pb-4">
        {/* Üst alan: Avatar + Düzenle / Çıkış */}
        <View className="flex-row items-start justify-between px-4 pt-4 mb-4">
          <Avatar
            uri={profile.avatar_url}
            fallback={profile.display_name || initial}
            size={72}
          />

          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/edit-profile" as never)}
              className="border border-zinc-700 rounded-full px-4 py-2"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text className="text-white text-[13px] font-semibold">Profili Düzenle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignOut}
              disabled={isSigningOut}
              className="border border-zinc-700 rounded-full p-2"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color="#71717a" />
              ) : (
                <Ionicons name="log-out-outline" size={18} color="#71717a" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* İsim + Kullanıcı adı */}
        <View className="px-4 mb-3">
          <Text className="text-white text-[20px] font-bold leading-tight">
            {profile.display_name}
          </Text>
          <Text className="text-zinc-500 text-[15px] mt-0.5">@{profile.username}</Text>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <Text className="text-zinc-300 text-[15px] leading-[22px] px-4 mb-3">
            {profile.bio}
          </Text>
        ) : null}

        {/* İstatistikler */}
        <View className="flex-row gap-4 px-4">
          <View className="flex-row items-center gap-1">
            <Text className="text-white font-bold text-[15px]">{postCount}</Text>
            <Text className="text-zinc-500 text-[14px]">Gönderi</Text>
          </View>
        </View>
      </View>
    );
  }, [profile, posts.length, isSigningOut, handleSignOut, router]);

  // ─── Yükleniyor ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="border-b border-zinc-800 px-4 py-3">
          <Text className="text-white text-xl font-bold">Profil</Text>
        </View>
        {/* Profil Header Skeleton */}
        <View className="px-4 pt-4 pb-6 border-b border-zinc-800">
          <View className="flex-row items-start justify-between mb-4">
            <View className="w-[72px] h-[72px] rounded-full bg-zinc-800" />
            <View className="w-32 h-9 rounded-full bg-zinc-800 mt-1" />
          </View>
          <View className="w-40 h-5 bg-zinc-800 rounded-md mb-2" />
          <View className="w-24 h-4 bg-zinc-800 rounded-md mb-3" />
          <View className="w-full h-4 bg-zinc-800 rounded-md mb-1.5" />
          <View className="w-3/4 h-4 bg-zinc-800 rounded-md" />
        </View>
        <FeedSkeletonList count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ProfileHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
    </SafeAreaView>
  );
}
