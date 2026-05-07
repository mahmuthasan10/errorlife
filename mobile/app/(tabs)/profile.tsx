import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import Avatar from "../../src/components/ui/Avatar";
import PostCard from "../../src/components/feed/PostCard";
import FeedSkeletonList from "../../src/components/feed/FeedSkeletonList";
import { usePostInteraction } from "../../src/hooks/usePostInteraction";

// ÇÖZÜM: Doğru Tipleri Import Etmek
import type { Profile, PostWithAuthor } from "@errorlife/shared/types";

const POST_SELECT = `
  *,
  profiles!posts_user_id_fkey(*),
  post_tags(tags(*)),
  user_likes:likes!left(user_id),
  user_bookmarks:bookmarks!left(user_id)
` as const;

export default function ProfileScreen() {
  const router = useRouter();
  // ÇÖZÜM: signOut hatası vermemesi için sadece user'ı al
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { toggleLike, toggleBookmark } = usePostInteraction({ userId, setPosts });

  const fetchProfileAndPosts = useCallback(async () => {
    if (!user) return;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (profileError) throw profileError;
      setProfile(profileData as Profile);

      const { data: postsData, error: postsError } = await supabase
        .from("posts").select(POST_SELECT).eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(50);
      if (postsError) throw postsError;
      setPosts((postsData as unknown as PostWithAuthor[]) ?? []);
    } catch {
      Alert.alert("Hata", "Profil yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchProfileAndPosts(); }, [fetchProfileAndPosts]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProfileAndPosts();
  }, [fetchProfileAndPosts]);

  // ÇÖZÜM: Manuel SignOut Fonksiyonu
  const handleSignOut = useCallback(() => {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  }, [router]);

  const handleComment = useCallback((postId: string) => router.push(`/post/${postId}/comments`), [router]);
  const handlePostPress = useCallback((postId: string) => router.push(`/post/${postId}/comments`), [router]);

  const renderItem = useCallback(({ item }: { item: PostWithAuthor }) => (
    <PostCard post={item} onLike={toggleLike} onBookmark={toggleBookmark} onComment={handleComment} onPress={handlePostPress} />
  ), [toggleLike, toggleBookmark, handleComment, handlePostPress]);

  const keyExtractor = useCallback((item: PostWithAuthor) => item.id, []);

  const ProfileHeader = useCallback(() => {
    if (!profile) return null;
    const initial = profile.display_name?.charAt(0).toUpperCase() ?? "?";
    return (
      <View className="border-b border-zinc-800 pb-4">
        {profile.cover_url ? (
          <Image source={{ uri: profile.cover_url }} className="w-full h-32 bg-zinc-800" resizeMode="cover" />
        ) : (
          <View className="w-full h-32 bg-zinc-900" />
        )}
        <View className="flex-row items-end justify-between px-4 pb-4 -mt-12">
          <View className="rounded-full border-4 border-black bg-zinc-800 items-center justify-center overflow-hidden" style={{ width: 88, height: 88, borderRadius: 44 }}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
            ) : (
              <Text className="text-white text-3xl font-bold">{initial}</Text>
            )}
          </View>
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity onPress={() => router.push("/edit-profile" as never)} className="border border-zinc-700 rounded-full px-4 py-2">
              <Text className="text-white text-[13px] font-semibold">Profili Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSignOut} disabled={isSigningOut} className="border border-red-500/30 bg-red-500/10 rounded-full p-2">
              {isSigningOut ? <ActivityIndicator size="small" color="#ef4444" /> : <Ionicons name="log-out-outline" size={18} color="#ef4444" />}
            </TouchableOpacity>
          </View>
        </View>
        <View className="px-4 mb-3">
          <Text className="text-white text-[20px] font-bold leading-tight">{profile.display_name}</Text>
          <Text className="text-zinc-500 text-[15px] mt-0.5">@{profile.username}</Text>
        </View>
        {profile.bio && <Text className="text-zinc-300 text-[15px] leading-[22px] px-4 mb-3">{profile.bio}</Text>}
      </View>
    );
  }, [profile, isSigningOut, handleSignOut, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="border-b border-zinc-800 px-4 py-3"><Text className="text-white text-xl font-bold">Profil</Text></View>
        <FeedSkeletonList count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <FlatList
        data={posts} renderItem={renderItem} keyExtractor={keyExtractor}
        ListHeaderComponent={ProfileHeader}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1D9BF0" />}
      />
    </SafeAreaView>
  );
}