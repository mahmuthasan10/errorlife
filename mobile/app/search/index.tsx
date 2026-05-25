import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Profile, PostWithAuthor, JobWithAuthor } from "@errorlife/shared/types";
import {
  searchPosts,
  searchUsers,
  searchJobs,
  fetchTrendingTags,
  type TrendingTag,
} from "../../src/lib/queries/search";
import PostCard from "../../src/components/feed/PostCard";
import Avatar from "../../src/components/ui/Avatar";
import { usePostInteraction } from "../../src/hooks/usePostInteraction";
import { useAuth } from "../../src/providers/AuthProvider";
import { formatTimeAgo } from "../../src/utils/format-time";

type Tab = "posts" | "users" | "jobs";

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "posts", label: "Gönderiler", icon: "document-text-outline" },
  { key: "users", label: "Kullanıcılar", icon: "people-outline" },
  { key: "jobs",  label: "İlanlar",     icon: "briefcase-outline" },
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<JobWithAuthor[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toggleLike, toggleBookmark } = usePostInteraction({ userId, setPosts });

  // Debounce 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Trending tags ilk render'da
  useEffect(() => {
    void fetchTrendingTags(12).then(setTrending);
  }, []);

  // Arama yap
  useEffect(() => {
    if (!debouncedQuery) {
      setPosts([]);
      setUsers([]);
      setJobs([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);

    (async () => {
      const [p, u, j] = await Promise.all([
        searchPosts(debouncedQuery),
        searchUsers(debouncedQuery),
        searchJobs(debouncedQuery),
      ]);
      if (cancelled) return;
      setPosts(p);
      setUsers(u);
      setJobs(j);
      setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleProfilePress = useCallback(
    (username: string) => router.push(`/profile/${username}`),
    [router]
  );

  const handlePostPress = useCallback(
    (postId: string) => router.push(`/post/${postId}`),
    [router]
  );

  const handleComment = useCallback(
    (postId: string) => router.push(`/post/${postId}/comments`),
    [router]
  );

  const handleJobPress = useCallback(
    (jobId: string) => router.push(`/jobs/${jobId}`),
    [router]
  );

  const handleTagPress = useCallback(
    (slug: string) => {
      setQuery(`#${slug}`);
      setActiveTab("posts");
    },
    []
  );

  // ─── Renderers ──────────────────────────────────────────────────

  const renderPost = useCallback(
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

  const renderUser = useCallback(
    ({ item }: { item: Profile }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleProfilePress(item.username)}
        className="flex-row px-4 py-3 border-b border-zinc-800"
      >
        <Avatar uri={item.avatar_url} fallback={item.display_name} size={48} />
        <View className="flex-1 ml-3 min-w-0">
          <Text className="text-white font-bold text-[15px]" numberOfLines={1}>
            {item.display_name}
          </Text>
          <Text className="text-zinc-500 text-[13px]" numberOfLines={1}>
            @{item.username}
          </Text>
          {item.bio && (
            <Text className="text-zinc-300 text-[13px] mt-1" numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          <Text className="text-zinc-500 text-xs mt-1">
            {item.followers_count} takipçi
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleProfilePress]
  );

  const renderJob = useCallback(
    ({ item }: { item: JobWithAuthor }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleJobPress(item.id)}
        className="px-4 py-3 border-b border-zinc-800"
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-white font-bold text-[15px]" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-zinc-400 text-[13px] mt-1" numberOfLines={2}>
              {item.description}
            </Text>
            {item.job_tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 mt-2">
                {item.job_tags.map(({ tags }) => (
                  <View
                    key={tags.id}
                    className="bg-zinc-800 rounded-full px-2.5 py-0.5"
                  >
                    <Text className="text-zinc-400 text-xs">#{tags.name}</Text>
                  </View>
                ))}
              </View>
            )}
            {item.profiles && (
              <Text className="text-zinc-500 text-xs mt-2">
                @{item.profiles.username} · {formatTimeAgo(item.created_at)}
              </Text>
            )}
          </View>
          {item.budget != null && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={14} color="#22c55e" />
              <Text className="text-emerald-400 text-sm font-bold">
                ₺{item.budget.toLocaleString("tr-TR")}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handleJobPress]
  );

  // ─── İçerik ─────────────────────────────────────────────────────

  const content = useMemo(() => {
    if (!debouncedQuery) {
      // Boş durumda trending tags
      return (
        <View className="px-4 py-5">
          <Text className="text-white text-lg font-bold mb-3">Trend Etiketler</Text>
          {trending.length === 0 ? (
            <Text className="text-zinc-500 text-sm">Henüz etiket yok.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {trending.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.7}
                  onPress={() => handleTagPress(t.slug)}
                  className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5"
                >
                  <Text className="text-zinc-300 text-sm">
                    #{t.name}{" "}
                    <Text className="text-zinc-500 text-xs">
                      ({t.post_count})
                    </Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    if (isSearching) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator color="#1D9BF0" size="large" />
        </View>
      );
    }

    const emptyMessage = (label: string) => (
      <View className="items-center py-12 px-6">
        <Ionicons name="search-outline" size={40} color="#3f3f46" />
        <Text className="text-zinc-500 text-sm mt-3 text-center">
          “{debouncedQuery}” için {label} bulunamadı.
        </Text>
      </View>
    );

    switch (activeTab) {
      case "posts":
        return posts.length === 0 ? (
          emptyMessage("gönderi")
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
          />
        );
      case "users":
        return users.length === 0 ? (
          emptyMessage("kullanıcı")
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="handled"
          />
        );
      case "jobs":
        return jobs.length === 0 ? (
          emptyMessage("ilan")
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJob}
            keyExtractor={(j) => j.id}
            keyboardShouldPersistTaps="handled"
          />
        );
    }
  }, [
    debouncedQuery,
    isSearching,
    activeTab,
    posts,
    users,
    jobs,
    trending,
    renderPost,
    renderUser,
    renderJob,
    handleTagPress,
  ]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-black">
      {/* Header: geri + arama input */}
      <View className="flex-row items-center px-4 py-2.5 border-b border-zinc-800 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800">
          <Ionicons name="search" size={16} color="#71717a" />
          <TextInput
            className="flex-1 ml-2 text-white text-[14px]"
            placeholder="Ara..."
            placeholderTextColor="#52525b"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close-circle" size={18} color="#52525b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab bar — sadece arama yapılınca göster */}
      {debouncedQuery.length > 0 && (
        <View className="flex-row border-b border-zinc-800">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 items-center justify-center py-3"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? "#fff" : "#71717a"}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </View>
                {isActive && (
                  <View className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-500" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View className="flex-1">{content}</View>
    </SafeAreaView>
  );
}
