import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { JobWithAuthor } from "@errorlife/shared/types";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../providers/AuthProvider";
import { useRouter } from "expo-router";

interface JobCardProps {
  job: JobWithAuthor;
  onPress?: (id: string) => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isOwner = user?.id === job.user_id;

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => onPress?.(job.id)}
      className="bg-black border-b border-zinc-800 p-4"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center flex-1">
          <Avatar uri={job.profiles?.avatar_url} size={32} fallback={job.profiles?.display_name?.[0] || "?"} />
          <View className="ml-3">
            <Text className="text-white font-bold">{job.profiles?.display_name}</Text>
            <Text className="text-zinc-500 text-xs">
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: tr })}
            </Text>
          </View>
        </View>

        {/* DÜZENLEME BUTONU: Sadece ilan bizimse çıkar */}
        {isOwner && (
          <TouchableOpacity 
            onPress={() => router.push({ pathname: "/new-job", params: { id: job.id } } as any)}
            className="p-2 -mr-2"
          >
            <Ionicons name="create-outline" size={20} color="#1D9BF0" />
          </TouchableOpacity>
        )}
      </View>

      <Text className="text-white text-lg font-bold mb-1">{job.title}</Text>
      <Text className="text-zinc-400 text-sm mb-3" numberOfLines={3}>{job.description}</Text>

      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {job.job_tags?.map((jt: any) => (
            <View key={jt.tags?.id} className="bg-zinc-900 px-2 py-1 rounded">
              <Text className="text-zinc-500 text-xs">#{jt.tags?.name}</Text>
            </View>
          ))}
        </View>
        {job.budget && <Text className="text-[#00BA7C] font-bold">₺{job.budget}</Text>}
      </View>
    </TouchableOpacity>
  );
}