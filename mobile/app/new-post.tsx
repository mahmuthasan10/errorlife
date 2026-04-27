import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";
import Avatar from "../src/components/ui/Avatar";
import type { Profile } from "../src/types/database";

const MAX_LENGTH = 500;

export default function NewPostModal() {
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const inputRef = useRef<TextInput>(null);

  const trimmed = content.trim();
  const canPublish = trimmed.length > 0 && !isPublishing;
  const charCount = trimmed.length;

  // Kullanıcı profilini çek (avatar için)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, display_name, username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  }, [user]);

  const handlePublish = async () => {
    if (!canPublish || !user) return;

    setIsPublishing(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: trimmed,
      });

      if (error) {
        Alert.alert("Hata", "Gönderi paylaşılırken bir sorun oluştu.");
        return;
      }

      router.back();
    } catch {
      Alert.alert("Hata", "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setIsPublishing(false);
    }
  };

  const avatarFallback =
    profile?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    "?";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-white text-base">İptal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePublish}
          disabled={!canPublish}
          activeOpacity={0.8}
          className={`rounded-full px-5 py-2 ${
            canPublish ? "bg-[#1D9BF0]" : "bg-[#1D9BF0]/40"
          }`}
        >
          {isPublishing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-bold text-sm ${
                canPublish ? "text-white" : "text-white/50"
              }`}
            >
              Yayınla
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Compose alanı */}
      <View className="flex-1 flex-row px-4 pt-3">
        {/* Avatar */}
        <View className="mr-3">
          <Avatar uri={profile?.avatar_url ?? null} fallback={avatarFallback} size={44} />
        </View>

        {/* TextInput */}
        <View className="flex-1">
          <TextInput
            ref={inputRef}
            className="text-white text-[16px] leading-[22px] flex-1"
            placeholder="Neler oluyor?"
            placeholderTextColor="#52525b"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_LENGTH}
            textAlignVertical="top"
            autoFocus
            editable={!isPublishing}
          />
        </View>
      </View>

      {/* Alt bar: karakter sayacı */}
      <View className="flex-row items-center justify-end px-4 py-3 border-t border-zinc-800">
        <Text
          className={`text-xs ${
            charCount > MAX_LENGTH * 0.9 ? "text-amber-500" : "text-zinc-500"
          }`}
        >
          {charCount}/{MAX_LENGTH}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
