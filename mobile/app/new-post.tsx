import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { optimizePost } from "@/lib/ai";

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIOptimize = async () => {
    if (!content.trim() || isAILoading) return;
    setIsAILoading(true);

    try {
      const res = await optimizePost(content);

      if (!res.ok) {
        Alert.alert("AI Hatası", res.error);
        return;
      }

      const tagsLine =
        res.data.suggestedTags.length > 0
          ? "\n\n" + res.data.suggestedTags.map((t) => `#${t}`).join(" ")
          : "";

      setContent(res.data.optimizedText + tagsLine);
    } catch {
      Alert.alert("Hata", "AI servisi şu an yanıt veremiyor.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() || !user || isPublishing) return;
    setIsPublishing(true);

    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      router.back();
    } catch {
      Alert.alert("Hata", "Gönderi paylaşılırken bir sorun oluştu.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg">İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePublish}
          disabled={!content.trim() || isPublishing || isAILoading}
          className={`px-5 py-1.5 rounded-full ${
            content.trim() && !isAILoading ? "bg-[#1D9BF0]" : "bg-[#1D9BF0]/50"
          }`}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold">Paylaş</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-4">
        <TextInput
          className="text-white text-lg"
          placeholder="Neler düşünüyorsunuz?"
          placeholderTextColor="#71717a"
          multiline
          autoFocus
          editable={!isAILoading}
          value={content}
          onChangeText={setContent}
          maxLength={500}
          style={{ textAlignVertical: "top", minHeight: 150 }}
        />

        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-zinc-500 text-xs">
            {content.length}/500
          </Text>

          <TouchableOpacity
            onPress={handleAIOptimize}
            disabled={!content.trim() || isAILoading || isPublishing}
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              content.trim() && !isAILoading
                ? "border-[#1D9BF0] bg-[#1D9BF0]/10"
                : "border-zinc-800"
            }`}
            activeOpacity={0.7}
          >
            {isAILoading ? (
              <>
                <ActivityIndicator size="small" color="#1D9BF0" />
                <Text className="ml-2 font-semibold text-[#1D9BF0]">
                  İyileştiriliyor...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={content.trim() ? "#1D9BF0" : "#52525b"}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    content.trim() ? "text-[#1D9BF0]" : "text-zinc-500"
                  }`}
                >
                  AI ile İyileştir
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
