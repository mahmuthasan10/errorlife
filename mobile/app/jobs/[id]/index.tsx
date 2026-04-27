import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../src/lib/supabase";
import { useAuth } from "../../../src/providers/AuthProvider";
import Avatar from "../../../src/components/ui/Avatar";
import { formatTimeAgo } from "../../../src/utils/format-time";
import type { JobWithAuthor } from "../../../src/types/database";
import type { BidWithExpert as Bid } from "@errorlife/shared/types";

const STATUS_CONFIG = {
  open: {
    label: "Açık",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  in_progress: {
    label: "Devam Ediyor",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  closed: {
    label: "Kapandı",
    color: "text-zinc-500",
    bg: "bg-zinc-800",
    dot: "bg-zinc-500",
  },
} as const;

// Profiles join → expert_id foreign key
const BID_SELECT = `
  *,
  profiles!bids_expert_id_fkey(*)
` as const;

const JOB_SELECT = `
  *,
  profiles!jobs_user_id_fkey(*),
  job_tags(tags(*))
` as const;

// ─── Bid Row Bileşeni ─────────────────────────────────────────────────────────

const BID_STATUS_MAP = {
  pending: { label: "Bekliyor", color: "text-zinc-400" },
  accepted: { label: "Kabul Edildi", color: "text-emerald-400" },
  rejected: { label: "Reddedildi", color: "text-red-400" },
} as const;

function BidRow({
  bid,
  isOwner,
  onAccept,
  onReject,
}: {
  bid: Bid;
  isOwner: boolean;
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
}) {
  const bidStatus = BID_STATUS_MAP[bid.status];

  return (
    <View className="px-4 py-3.5 border-b border-zinc-800/60">
      <View className="flex-row items-start">
        <Avatar
          uri={bid.profiles.avatar_url}
          fallback={bid.profiles.display_name}
          size={36}
        />
        <View className="flex-1 ml-3">
          {/* İsim + tarih */}
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              <Text className="text-white font-semibold text-[14px]" numberOfLines={1}>
                {bid.profiles.display_name}
              </Text>
              <Text className="text-zinc-500 text-xs">@{bid.profiles.username}</Text>
            </View>
            <Text className="text-zinc-500 text-xs">{formatTimeAgo(bid.created_at)}</Text>
          </View>

          {/* Tutar + süre + durum */}
          <View className="flex-row items-center gap-2 mb-2 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Ionicons name="cash-outline" size={13} color="#22c55e" />
              <Text className="text-emerald-400 font-bold text-[14px]">
                ₺{bid.amount.toLocaleString("tr-TR")}
              </Text>
            </View>
            <Text className="text-zinc-700">·</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={13} color="#71717a" />
              <Text className="text-zinc-400 text-[13px]">{bid.estimated_days} gün</Text>
            </View>
            <Text className="text-zinc-700">·</Text>
            <Text className={`text-[12px] ${bidStatus.color}`}>{bidStatus.label}</Text>
          </View>

          {/* Kapak yazısı */}
          <Text className="text-zinc-400 text-[13px] leading-[19px]" numberOfLines={4}>
            {bid.cover_letter}
          </Text>

          {/* Kabul / Reddet — sadece ilan sahibi + bekleyen teklifler */}
          {isOwner && bid.status === "pending" && (
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onAccept(bid.id)}
                className="flex-row items-center gap-1 bg-emerald-500/15 rounded-full px-3 py-1.5"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="checkmark-outline" size={14} color="#22c55e" />
                <Text className="text-emerald-400 text-xs font-semibold">Kabul Et</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onReject(bid.id)}
                className="flex-row items-center gap-1 bg-red-500/10 rounded-full px-3 py-1.5"
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="close-outline" size={14} color="#f87171" />
                <Text className="text-red-400 text-xs font-semibold">Reddet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [job, setJob] = useState<JobWithAuthor | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Teklif formu
  const [bidAmount, setBidAmount] = useState("");
  const [bidDays, setBidDays] = useState("");
  const [bidCoverLetter, setBidCoverLetter] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);

  const daysRef = useRef<TextInput>(null);
  const coverRef = useRef<TextInput>(null);

  const isOwner = user?.id === job?.user_id;
  const hasBid = bids.some((b) => b.expert_id === user?.id);

  // ─── Veri Yükleme ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [jobRes, bidsRes] = await Promise.all([
          supabase.from("jobs").select(JOB_SELECT).eq("id", id).single(),
          supabase
            .from("bids")
            .select(BID_SELECT)
            .eq("job_id", id)
            .order("created_at", { ascending: false }),
        ]);

        if (jobRes.error) {
          Alert.alert("Hata", "İlan bulunamadı.");
          router.back();
          return;
        }

        setJob(jobRes.data as unknown as JobWithAuthor);
        if (!bidsRes.error) {
          setBids((bidsRes.data as unknown as Bid[]) ?? []);
        }
      } catch {
        Alert.alert("Hata", "İlan yüklenirken bir sorun oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // ─── Real-Time ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`job-detail:${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setJob((prev) =>
            prev
              ? { ...prev, ...(payload.new as Partial<JobWithAuthor>) }
              : prev
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `job_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("bids")
            .select(BID_SELECT)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setBids((prev) => [data as unknown as Bid, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bids",
          filter: `job_id=eq.${id}`,
        },
        (payload) => {
          setBids((prev) =>
            prev.map((b) =>
              b.id === payload.new.id
                ? { ...b, ...(payload.new as Partial<Bid>) }
                : b
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ─── Teklif Gönder (RPC) ───────────────────────────────────────────────
  const handleSubmitBid = async () => {
    if (!user || !id || isSubmittingBid) return;

    const amount = parseFloat(bidAmount.trim());
    const days = parseInt(bidDays.trim(), 10);
    const coverLetter = bidCoverLetter.trim();

    if (!bidAmount.trim() || isNaN(amount) || amount < 1) {
      Alert.alert("Hata", "Teklif tutarı en az 1 TL olmalıdır.");
      return;
    }
    if (!bidDays.trim() || isNaN(days) || days < 1) {
      Alert.alert("Hata", "Tahmini süre en az 1 gün olmalıdır.");
      return;
    }
    if (coverLetter.length < 10) {
      Alert.alert("Hata", "Kapak yazısı en az 10 karakter olmalıdır.");
      return;
    }

    setIsSubmittingBid(true);
    try {
      const { error } = await supabase.rpc("create_bid", {
        p_job_id: id,
        p_amount: amount,
        p_estimated_days: days,
        p_cover_letter: coverLetter,
      });

      if (error) {
        Alert.alert("Hata", error.message || "Teklif gönderilemedi.");
        return;
      }

      setBidAmount("");
      setBidDays("");
      setBidCoverLetter("");
      setShowBidForm(false);
    } catch {
      Alert.alert("Hata", "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // ─── Teklif Kabul (RPC) ────────────────────────────────────────────────
  const handleAcceptBid = useCallback(
    (bidId: string) => {
      if (!user || !isOwner || !id) return;

      Alert.alert(
        "Teklifi Kabul Et",
        "Bu teklifi kabul etmek istiyor musun? DB trigger diğer teklifleri otomatik reddeder.",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Kabul Et",
            onPress: async () => {
              setIsUpdatingStatus(true);
              try {
                const { error } = await supabase.rpc("accept_bid", {
                  p_bid_id: bidId,
                  p_job_id: id,
                });
                if (error) throw error;
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "İşlem sırasında bir sorun oluştu.";
                Alert.alert("Hata", msg);
              } finally {
                setIsUpdatingStatus(false);
              }
            },
          },
        ]
      );
    },
    [user, isOwner, id]
  );

  // ─── Teklif Reddet (RPC) ──────────────────────────────────────────────
  const handleRejectBid = useCallback(
    async (bidId: string) => {
      if (!user || !isOwner || !id) return;

      setIsUpdatingStatus(true);
      try {
        const { error } = await supabase.rpc("reject_bid", {
          p_bid_id: bidId,
          p_job_id: id,
        });
        if (error) throw error;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Teklif reddedilemedi.";
        Alert.alert("Hata", msg);
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [user, isOwner, id]
  );

  // ─── İlan Kapat (RPC) ─────────────────────────────────────────────────
  const handleCloseJob = useCallback(() => {
    if (!id) return;

    Alert.alert("İlanı Kapat", "Bu ilanı kapatmak istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Kapat",
        style: "destructive",
        onPress: async () => {
          setIsUpdatingStatus(true);
          try {
            const { error } = await supabase.rpc("update_job_status", {
              p_job_id: id,
              p_status: "closed",
            });
            if (error) throw error;
          } catch (err: unknown) {
            const msg =
              err instanceof Error ? err.message : "Durum güncellenemedi.";
            Alert.alert("Hata", msg);
          } finally {
            setIsUpdatingStatus(false);
          }
        },
      },
    ]);
  }, [id]);

  // ─── Render ────────────────────────────────────────────────────────────
  const renderBid = useCallback(
    ({ item }: { item: Bid }) => (
      <BidRow
        bid={item}
        isOwner={isOwner}
        onAccept={handleAcceptBid}
        onReject={handleRejectBid}
      />
    ),
    [isOwner, handleAcceptBid, handleRejectBid]
  );

  const keyExtractor = useCallback((item: Bid) => item.id, []);

  // ─── Job Header (FlatList ListHeaderComponent) ─────────────────────────
  const JobHeader = useCallback(() => {
    if (!job) return null;

    const status = STATUS_CONFIG[job.status];
    const { profiles } = job;

    return (
      <View>
        {/* İlan detayı */}
        <View className="px-4 pt-4 pb-5 border-b border-zinc-800">
          {/* Yazar */}
          <View className="flex-row items-center mb-4">
            <Avatar
              uri={profiles.avatar_url}
              fallback={profiles.display_name}
              size={40}
            />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold text-[14px]">
                {profiles.display_name}
              </Text>
              <Text className="text-zinc-500 text-xs">
                @{profiles.username} · {formatTimeAgo(job.created_at)}
              </Text>
            </View>

            {/* Durum badge */}
            <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${status.bg}`}>
              <View className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <Text className={`text-[12px] font-semibold ${status.color}`}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Başlık */}
          <Text className="text-white text-[20px] font-bold leading-[26px] mb-2.5">
            {job.title}
          </Text>

          {/* Açıklama */}
          <Text className="text-zinc-300 text-[15px] leading-[23px] mb-4">
            {job.description}
          </Text>

          {/* Etiketler */}
          {job.job_tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {job.job_tags.map(({ tags }) => (
                <View key={tags.id} className="bg-zinc-800 rounded-full px-3 py-1">
                  <Text className="text-zinc-400 text-[12px]">#{tags.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bütçe */}
          {job.budget != null && (
            <View className="flex-row items-center gap-2 bg-zinc-900 rounded-xl px-4 py-3 mb-4">
              <Ionicons name="cash-outline" size={18} color="#22c55e" />
              <Text className="text-zinc-400 text-[13px]">Bütçe:</Text>
              <Text className="text-emerald-400 font-bold text-[15px]">
                ₺{job.budget.toLocaleString("tr-TR")}
              </Text>
            </View>
          )}

          {/* İlan sahibi: Kapat */}
          {isOwner && job.status !== "closed" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCloseJob}
              disabled={isUpdatingStatus}
              className="flex-row items-center justify-center gap-2 border border-zinc-700 rounded-xl py-3"
            >
              {isUpdatingStatus ? (
                <ActivityIndicator size="small" color="#71717a" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={16} color="#71717a" />
                  <Text className="text-zinc-400 text-[14px] font-medium">İlanı Kapat</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Teklifler başlığı */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Text className="text-white font-bold text-[16px]">
            Teklifler
            {bids.length > 0 && (
              <Text className="text-zinc-500 font-normal"> ({bids.length})</Text>
            )}
          </Text>

          {/* Teklif ver — sadece başkasının ilanı, açık ve teklif verilmemiş */}
          {!isOwner && job.status === "open" && !hasBid && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowBidForm((v) => !v)}
              className="bg-[#1D9BF0] rounded-full px-4 py-2"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text className="text-white font-semibold text-[13px]">
                {showBidForm ? "Vazgeç" : "Teklif Ver"}
              </Text>
            </TouchableOpacity>
          )}

          {!isOwner && hasBid && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text className="text-emerald-400 text-[12px]">Teklif verildi</Text>
            </View>
          )}
        </View>

        {/* Teklif formu */}
        {showBidForm && !isOwner && (
          <View className="px-4 py-4 border-b border-zinc-800 bg-zinc-900/40">
            {/* Tutar */}
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Teklif Tutarı (₺) *
            </Text>
            <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4 mb-3">
              <Ionicons name="cash-outline" size={16} color="#52525b" />
              <TextInput
                className="flex-1 text-white text-[15px] py-3 ml-2"
                placeholder="0"
                placeholderTextColor="#52525b"
                value={bidAmount}
                onChangeText={(t) => setBidAmount(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => daysRef.current?.focus()}
                editable={!isSubmittingBid}
              />
            </View>

            {/* Tahmini süre */}
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Tahmini Süre (Gün) *
            </Text>
            <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4 mb-3">
              <Ionicons name="time-outline" size={16} color="#52525b" />
              <TextInput
                ref={daysRef}
                className="flex-1 text-white text-[15px] py-3 ml-2"
                placeholder="7"
                placeholderTextColor="#52525b"
                value={bidDays}
                onChangeText={(t) => setBidDays(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => coverRef.current?.focus()}
                editable={!isSubmittingBid}
              />
            </View>

            {/* Kapak yazısı */}
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Kapak Yazısı * (en az 10 karakter)
            </Text>
            <TextInput
              ref={coverRef}
              className="bg-zinc-900 text-white text-[15px] rounded-xl px-4 py-3 border border-zinc-800 min-h-[100px] mb-4"
              placeholder="Neden sen uygun adaysın? Deneyimlerini, yaklaşımını anlat..."
              placeholderTextColor="#52525b"
              value={bidCoverLetter}
              onChangeText={setBidCoverLetter}
              maxLength={2000}
              multiline
              textAlignVertical="top"
              editable={!isSubmittingBid}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmitBid}
              disabled={isSubmittingBid}
              className={`rounded-xl py-3.5 items-center ${
                isSubmittingBid ? "bg-[#1D9BF0]/40" : "bg-[#1D9BF0]"
              }`}
            >
              {isSubmittingBid ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-bold text-[15px]">Teklif Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [
    job,
    isOwner,
    bids.length,
    hasBid,
    showBidForm,
    bidAmount,
    bidDays,
    bidCoverLetter,
    isSubmittingBid,
    isUpdatingStatus,
    handleCloseJob,
    handleSubmitBid,
  ]);

  const renderEmpty = useCallback(
    () => (
      <View className="items-center py-12 px-6">
        <Ionicons name="document-text-outline" size={40} color="#3f3f46" />
        <Text className="text-zinc-500 text-base mt-3 text-center">
          Henüz teklif yok.{"\n"}İlk teklifi sen ver!
        </Text>
      </View>
    ),
    []
  );

  // ─── Yükleniyor ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-[17px]">İlan Detayı</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1D9BF0" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
      keyboardVerticalOffset={insets.bottom}
    >
      <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            className="text-white font-bold text-[17px] flex-1"
            numberOfLines={1}
          >
            {job?.title ?? "İlan Detayı"}
          </Text>
        </View>

        <FlatList
          data={bids}
          renderItem={renderBid}
          keyExtractor={keyExtractor}
          ListHeaderComponent={JobHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={<View style={{ height: 40 }} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={5}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
