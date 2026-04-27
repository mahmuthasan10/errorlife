import { useCallback, useEffect, useRef, useState } from "react";
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
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/providers/AuthProvider";
import JobCard from "../../src/components/jobs/JobCard";
import FeedSkeletonList from "../../src/components/feed/FeedSkeletonList";
import FeedEmptyState from "../../src/components/feed/FeedEmptyState";
import NewPostsBanner from "../../src/components/feed/NewPostsBanner";
import type { JobWithAuthor } from "../../src/types/database";

const PAGE_SIZE = 10;

const JOB_SELECT = `
  *,
  profiles!jobs_user_id_fkey(*),
  job_tags(tags(*))
` as const;

type StatusFilter = "all" | "open" | "in_progress";

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "open", label: "Açık" },
  { key: "in_progress", label: "Devam Eden" },
];

export default function JobsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const flatListRef = useRef<FlatList<JobWithAuthor>>(null);
  const pageRef = useRef(0);

  const [jobs, setJobs] = useState<JobWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  // ─── Veri çekme ───────────────────────────────────────────────────────
  const fetchJobs = useCallback(
    async (pageNumber: number, mode: "initial" | "refresh" | "more", filter: StatusFilter) => {
      try {
        const from = pageNumber * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("jobs")
          .select(JOB_SELECT)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (filter !== "all") {
          query = query.eq("status", filter);
        }

        const { data, error } = await query;
        if (error) throw error;

        const fetched = (data as unknown as JobWithAuthor[]) ?? [];
        const more = fetched.length === PAGE_SIZE;

        setJobs((prev) => (mode === "more" ? mergeUnique(prev, fetched) : fetched));
        setHasMore(more);
        setHasError(false);
        pageRef.current = pageNumber;
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // İlk yükleme + filtre değişimi
  useEffect(() => {
    setIsLoading(true);
    setJobs([]);
    pageRef.current = 0;
    fetchJobs(0, "initial", activeFilter);
  }, [fetchJobs, activeFilter]);

  // ─── Realtime: Yeni iş ilanı ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("feed:jobs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jobs" },
        (payload) => {
          // Kendi ilanımız real-time gelirse sayacı artırma
          if (payload.new.user_id !== user?.id) {
            setNewJobsCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs" },
        (payload) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === payload.new.id
                ? { ...j, ...(payload.new as Partial<JobWithAuthor>) }
                : j
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "jobs" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) setJobs((prev) => prev.filter((j) => j.id !== id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setNewJobsCount(0);
    pageRef.current = 0;
    fetchJobs(0, "refresh", activeFilter);
  }, [fetchJobs, activeFilter]);

  const handleLoadNewJobs = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    handleRefresh();
  }, [handleRefresh]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoading || isRefreshing) return;
    setIsLoadingMore(true);
    fetchJobs(pageRef.current + 1, "more", activeFilter);
  }, [isLoadingMore, hasMore, isLoading, isRefreshing, fetchJobs, activeFilter]);

  const handleFilterChange = useCallback((filter: StatusFilter) => {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
    setNewJobsCount(0);
  }, [activeFilter]);

  const renderItem = useCallback(
    ({ item }: { item: JobWithAuthor }) => (
      <JobCard job={item} onPress={(id) => router.push(`/jobs/${id}` as never)} />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: JobWithAuthor) => item.id, []);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <FeedEmptyState
        variant={hasError ? "error" : "empty"}
        onRetry={handleRefresh}
      />
    );
  }, [isLoading, hasError, handleRefresh]);

  const renderFooter = useCallback(() => {
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
      <View className="border-b border-zinc-800 px-4 pb-0 pt-3 z-10 bg-black">
        <Text className="text-white text-xl font-bold mb-3">İş İlanları</Text>

        {/* Filtre Sekmeleri */}
        <View className="flex-row gap-1">
          {FILTER_TABS.map((tab) => {
            const isActive = tab.key === activeFilter;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => handleFilterChange(tab.key)}
                className={`px-4 py-2 rounded-full mb-3 ${
                  isActive ? "bg-[#1D9BF0]" : "bg-zinc-800"
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    isActive ? "text-white" : "text-zinc-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="flex-1 relative">
        {/* Yeni İlan Balonu */}
        <NewPostsBanner count={newJobsCount} onPress={handleLoadNewJobs} />

        {isLoading ? (
          <FeedSkeletonList count={6} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={jobs}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
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
            maxToRenderPerBatch={8}
            windowSize={5}
          />
        )}
      </View>

      {/* FAB: Yeni İlan */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/new-job" as never)}
        className="absolute bottom-6 right-5 w-14 h-14 rounded-full bg-[#1D9BF0] items-center justify-center shadow-lg shadow-black/50"
        style={{ elevation: 8 }}
      >
        <Ionicons name="briefcase-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function mergeUnique(prev: JobWithAuthor[], next: JobWithAuthor[]): JobWithAuthor[] {
  const seen = new Set(prev.map((j) => j.id));
  const additions = next.filter((j) => !seen.has(j.id));
  return additions.length === 0 ? prev : [...prev, ...additions];
}
