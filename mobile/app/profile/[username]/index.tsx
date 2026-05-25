import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, PostWithAuthor } from "@errorlife/shared/types";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/providers/AuthProvider";
import PostCard from "../../../src/components/feed/PostCard";
import FeedSkeletonList from "../../../src/components/feed/FeedSkeletonList";
import { usePostInteraction } from "../../../src/hooks/usePostInteraction";

const POST_SELECT = `
  *,
  profiles!posts_user_id_fkey(*),
  post_tags(tags(*)),
  user_likes:likes!left(user_id),
  user_bookmarks:bookmarks!left(user_id)
` as const;

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Takip & Mesaj durumu
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessagingLoading, setIsMessagingLoading] = useState(false);

  const { toggleLike, toggleBookmark } = usePostInteraction({
    userId: currentUserId,
    setPosts,
  });

  const isOwnProfile = currentUserId === profile?.id;

  // ─── Veri Yükle ────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!username) return;
    try {
      setNotFound(false);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        return;
      }

      setProfile(profileData as Profile);

      // Başkasının profili ise takip durumunu çek
      if (currentUserId && currentUserId !== (profileData as Profile).id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", (profileData as Profile).id)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("user_id", (profileData as Profile).id)
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
  }, [username, currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void load();
  }, [load]);

  // ─── Takip / Takipten Çık ──────────────────────────────────────
  const handleFollowToggle = useCallback(async () => {
    if (!user || !profile || isFollowLoading) return;

    const wasFollowing = isFollowing;
    setIsFollowLoading(true);
    // Optimistik güncelle
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followers_count: wasFollowing
              ? Math.max((prev.followers_count ?? 0) - 1, 0)
              : (prev.followers_count ?? 0) + 1,
          }
        : prev
    );

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profile.id });
        if (error) throw error;
      }
    } catch {
      // Hata durumunda geri al
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followers_count: wasFollowing
                ? (prev.followers_count ?? 0) + 1
                : Math.max((prev.followers_count ?? 0) - 1, 0),
            }
          : prev
      );
      Alert.alert("Hata", "İşlem gerçekleştirilemedi. Tekrar dene.");
    } finally {
      setIsFollowLoading(false);
    }
  }, [user, profile, isFollowing, isFollowLoading]);

  // ─── Mesaj At (chat bul veya oluştur) ─────────────────────────
  const handleMessagePress = useCallback(async () => {
    if (!user || !profile || isMessagingLoading) return;

    setIsMessagingLoading(true);
    try {
      // DB trigger user1_id < user2_id sırasını garanti eder
      // aynı sırayı kullanarak mevcut sohbeti doğrudan bul
      const [smallerId, largerId] =
        user.id < profile.id
          ? [user.id, profile.id]
          : [profile.id, user.id];

      const { data: existingChat } = await supabase
        .from("chats")
        .select("id")
        .eq("user1_id", smallerId)
        .eq("user2_id", largerId)
        .maybeSingle();

      if (existingChat) {
        router.push(`/messages/${existingChat.id}`);
        return;
      }

      // Yoksa yeni sohbet oluştur
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({ user1_id: user.id, user2_id: profile.id })
        .select("id")
        .single();

      if (error) {
        // Unique constraint → başka bir istek zaten oluşturmuş olabilir
        if (error.code === "23505") {
          const { data: retryChat } = await supabase
            .from("chats")
            .select("id")
            .eq("user1_id", smallerId)
            .eq("user2_id", largerId)
            .single();
          if (retryChat) {
            router.push(`/messages/${retryChat.id}`);
            return;
          }
        }
        throw error;
      }

      router.push(`/messages/${newChat.id}`);
    } catch {
      Alert.alert("Hata", "Sohbet başlatılamadı. Tekrar dene.");
    } finally {
      setIsMessagingLoading(false);
    }
  }, [user, profile, router, isMessagingLoading]);

  // ─── PostCard handlers ─────────────────────────────────────────
  const handleProfilePress = useCallback(
    (uname: string) => {
      if (uname === username) return;
      router.push(`/profile/${uname}`);
    },
    [router, username]
  );

  const handlePostPress = useCallback(
    (postId: string) => router.push(`/post/${postId}`),
    [router]
  );

  const handleComment = useCallback(
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
        onProfilePress={handleProfilePress}
      />
    ),
    [toggleLike, toggleBookmark, handleComment, handlePostPress, handleProfilePress]
  );

  const keyExtractor = useCallback((item: PostWithAuthor) => item.id, []);

  // ─── Profil Header ─────────────────────────────────────────────
  const ProfileHeader = useCallback(() => {
    if (!profile) return null;
    const initial = profile.display_name?.charAt(0).toUpperCase() ?? "?";

    return (
      <View className="border-b border-zinc-800 pb-4">
        {/* Kapak fotoğrafı */}
        {profile.cover_url ? (
          <Image
            source={{ uri: profile.cover_url }}
            className="w-full h-32 bg-zinc-800"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-zinc-900" />
        )}

        {/* Avatar + Butonlar */}
        <View className="flex-row items-end justify-between px-4 pb-4 -mt-12">
          <View
            className="rounded-full border-4 border-black bg-zinc-800 items-center justify-center overflow-hidden"
            style={{ width: 88, height: 88, borderRadius: 44 }}
          >
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
            ) : (
              <Text className="text-white text-3xl font-bold">{initial}</Text>
            )}
          </View>

          <View className="flex-row gap-2 mb-2">
            {isOwnProfile ? (
              /* Kendi profilim → Düzenle */
              <TouchableOpacity
                onPress={() => router.push("/edit-profile" as never)}
                className="border border-zinc-700 rounded-full px-4 py-2"
                activeOpacity={0.7}
              >
                <Text className="text-white text-[13px] font-semibold">
                  Profili Düzenle
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Takip Et / Takip Ediliyor */}
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  disabled={isFollowLoading}
                  activeOpacity={0.7}
                  className={`rounded-full px-4 py-2 flex-row items-center gap-1.5 ${
                    isFollowing
                      ? "border border-zinc-600 bg-transparent"
                      : "bg-white"
                  }`}
                >
                  {isFollowLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={isFollowing ? "#fff" : "#000"}
                    />
                  ) : (
                    <Text
                      className={`text-[13px] font-semibold ${
                        isFollowing ? "text-white" : "text-black"
                      }`}
                    >
                      {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Mesaj At */}
                <TouchableOpacity
                  onPress={handleMessagePress}
                  disabled={isMessagingLoading}
                  className="border border-zinc-700 rounded-full px-3 py-2 flex-row items-center gap-1.5"
                  activeOpacity={0.7}
                >
                  {isMessagingLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="mail-outline" size={14} color="#fff" />
                  )}
                  {!isMessagingLoading && (
                    <Text className="text-white text-[13px] font-semibold">
                      Mesaj
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* İsim & Kullanıcı adı */}
        <View className="px-4 mb-3">
          <Text className="text-white text-[20px] font-bold leading-tight">
            {profile.display_name}
          </Text>
          <Text className="text-zinc-500 text-[15px] mt-0.5">
            @{profile.username}
          </Text>
        </View>

        {/* Bio */}
        {profile.bio && (
          <Text className="text-zinc-300 text-[15px] leading-[22px] px-4 mb-3">
            {profile.bio}
          </Text>
        )}

        {/* Takip sayıları */}
        <View className="flex-row gap-5 px-4">
          <Text className="text-sm">
            <Text className="text-white font-bold">{profile.following_count ?? 0}</Text>
            <Text className="text-zinc-500"> Takip Edilen</Text>
          </Text>
          <Text className="text-sm">
            <Text className="text-white font-bold">{profile.followers_count ?? 0}</Text>
            <Text className="text-zinc-500"> Takipçi</Text>
          </Text>
        </View>
      </View>
    );
  }, [
    profile,
    isOwnProfile,
    isFollowing,
    isFollowLoading,
    isMessagingLoading,
    router,
    handleFollowToggle,
    handleMessagePress,
  ]);

  // ─── Render ────────────────────────────────────────────────────
  if (notFound) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <Header onBack={() => router.back()} title="Profil" />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-outline" size={40} color="#52525b" />
          <Text className="text-zinc-500 text-sm mt-3 text-center">
            "@{username}" bulunamadı.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <Header onBack={() => router.back()} title="Profil" />
        <FeedSkeletonList count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <Header
        onBack={() => router.back()}
        title={profile?.display_name ?? "Profil"}
      />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ProfileHeader}
        ListEmptyComponent={
          <View className="items-center py-12 px-6">
            <Ionicons name="document-text-outline" size={36} color="#3f3f46" />
            <Text className="text-zinc-500 text-sm mt-3 text-center">
              Henüz gönderi yok.
            </Text>
          </View>
        }
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
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-zinc-800 gap-3">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
