import { memo, useCallback } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatTimeAgo } from "../../utils/format-time";
import Avatar from "../ui/Avatar";
import type { JobWithAuthor } from "../../types/database";

const STATUS_CONFIG = {
  open: { label: "Açık", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  in_progress: {
    label: "Devam Ediyor",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  closed: { label: "Kapandı", color: "text-zinc-500", bg: "bg-zinc-800" },
} as const;

type JobCardProps = {
  job: JobWithAuthor;
  onPress?: (jobId: string) => void;
  onProfilePress?: (username: string) => void;
};

function JobCard({ job, onPress, onProfilePress }: JobCardProps) {
  const { profiles } = job;
  const status = STATUS_CONFIG[job.status];

  const handlePress = useCallback(() => onPress?.(job.id), [onPress, job.id]);
  const handleProfile = useCallback(
    () => onProfilePress?.(profiles.username),
    [onProfilePress, profiles.username]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className="border-b border-zinc-800 px-4 py-4"
    >
      {/* Üst satır: Avatar + isim + tarih */}
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleProfile}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className="mr-2.5"
        >
          <Avatar uri={profiles.avatar_url} fallback={profiles.display_name} size={36} />
        </TouchableOpacity>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center flex-wrap">
            <TouchableOpacity activeOpacity={0.7} onPress={handleProfile}>
              <Text className="text-white font-semibold text-[14px]" numberOfLines={1}>
                {profiles.display_name}
              </Text>
            </TouchableOpacity>
            <Text className="text-zinc-500 text-xs ml-1.5">@{profiles.username}</Text>
            <Text className="text-zinc-600 text-xs mx-1">·</Text>
            <Text className="text-zinc-500 text-xs">{formatTimeAgo(job.created_at)}</Text>
          </View>
        </View>

        {/* Status badge */}
        <View className={`rounded-full px-2.5 py-1 ${status.bg}`}>
          <Text className={`text-[11px] font-semibold ${status.color}`}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Başlık */}
      <Text className="text-white font-bold text-[16px] leading-[22px] mb-1.5" numberOfLines={2}>
        {job.title}
      </Text>

      {/* Açıklama */}
      <Text className="text-zinc-400 text-[14px] leading-[20px] mb-3" numberOfLines={3}>
        {job.description}
      </Text>

      {/* Alt satır: Etiketler + Bütçe */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row flex-wrap gap-1.5 flex-1 mr-3">
          {job.job_tags.slice(0, 3).map(({ tags }) => (
            <View key={tags.id} className="bg-zinc-800/80 rounded-full px-2 py-0.5">
              <Text className="text-zinc-400 text-[11px]">#{tags.name}</Text>
            </View>
          ))}
        </View>

        {job.budget != null && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="cash-outline" size={14} color="#71717a" />
            <Text className="text-zinc-400 text-[13px] font-medium">
              ₺{job.budget.toLocaleString("tr-TR")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default memo(JobCard);
