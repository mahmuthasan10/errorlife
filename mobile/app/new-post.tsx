import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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

// ─── Turkish slugify (web/src/lib/utils.ts ile aynı) ──────────
const TURKISH_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TURKISH_MAP[c] ?? c)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Web ile aynı regex (Türkçe karakter desteği dahil) ────────
function extractHashtags(text: string): string[] {
  const regex =
    /(?:^|\s)#([a-zA-Z0-9À-ɏğüşöçıİĞÜŞÖÇ]{1,30})(?=\s|$)/g;
  const found: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const tag = match[1].toLowerCase();
    if (!found.includes(tag)) found.push(tag);
  }
  return found;
}

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const aiAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      aiAbortRef.current?.abort();
    };
  }, []);

  // ─── İçerik değişince etiketleri çıkar (web ile aynı) ────────
  function handleContentChange(text: string) {
    setContent(text);
    const detected = extractHashtags(text);
    setSuggestedTags(Array.from(new Set(detected)));
  }

  // ─── Chip'ten etiketi çıkar (web: sadece state, text değil) ──
  function removeTag(tagToRemove: string) {
    setSuggestedTags((prev) => prev.filter((t) => t !== tagToRemove));
  }

  // ─── AI Optimize ──────────────────────────────────────────────
  const handleAIOptimize = async () => {
    if (!content.trim() || isAILoading) return;

    aiAbortRef.current?.abort();
    aiAbortRef.current = new AbortController();
    setIsAILoading(true);

    const res = await optimizePost(content, aiAbortRef.current.signal);
    setIsAILoading(false);

    if (!res.ok) {
      if (res.error.kind === "network" && res.error.message === "İstek iptal edildi.") return;
      Alert.alert("AI Hatası", res.error.message);
      return;
    }

    const newTagsText =
      res.data.suggestedTags.length > 0
        ? "\n\n" + res.data.suggestedTags.map((t) => `#${t}`).join(" ")
        : "";
    const newContent = res.data.optimizedText + newTagsText;
    setContent(newContent);
    setSuggestedTags(extractHashtags(newContent));
  };

  // ─── Yayınla ──────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!content.trim() || !user || isPublishing) return;
    setIsPublishing(true);

    try {
      if (suggestedTags.length > 0) {
        // Web ile aynı RPC — etiketler ayrı tabloya kaydedilir
        const tagObjects = suggestedTags.map((name) => ({
          name,
          slug: slugify(name),
        }));
        const { error } = await supabase.rpc("create_post_with_tags", {
          p_content: content.trim(),
          p_image_url: null,
          p_tags: tagObjects,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert({
          user_id: user.id,
          content: content.trim(),
        });
        if (error) throw error;
      }
      router.back();
    } catch {
      Alert.alert("Hata", "Gönderi paylaşılırken bir sorun oluştu.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
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

      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Metin girişi */}
        <TextInput
          className="text-white text-lg"
          placeholder="Neler düşünüyorsunuz?"
          placeholderTextColor="#71717a"
          multiline
          autoFocus
          editable={!isAILoading}
          value={content}
          onChangeText={handleContentChange}
          maxLength={500}
          style={{ textAlignVertical: "top", minHeight: 150 }}
        />

        {/* ─── Etiket chip'leri (web ile aynı violet stil) ─── */}
        {suggestedTags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {suggestedTags.map((tag) => (
              <View
                key={tag}
                className="flex-row items-center bg-violet-500/15 px-2.5 py-1 rounded-full"
              >
                <Text className="text-violet-400 text-xs font-medium">
                  #{tag}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTag(tag)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="ml-1"
                >
                  <Ionicons name="close" size={12} color="#a78bfa" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ─── Alt toolbar ─────────────────────────────────── */}
        <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-zinc-800">
          <Text className="text-zinc-500 text-xs">{content.length}/500</Text>

          <TouchableOpacity
            onPress={handleAIOptimize}
            disabled={!content.trim() || isAILoading || isPublishing}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${
              content.trim() && !isAILoading
                ? "border-zinc-700 bg-transparent"
                : "border-zinc-800"
            }`}
            activeOpacity={0.7}
          >
            {isAILoading ? (
              <>
                <ActivityIndicator size="small" color="#1D9BF0" />
                <Text className="font-medium text-[#1D9BF0] text-xs">
                  İyileştiriliyor...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={content.trim() ? "#d4d4d8" : "#52525b"}
                />
                <Text
                  className={`font-medium text-xs ${
                    content.trim() ? "text-zinc-300" : "text-zinc-500"
                  }`}
                >
                  AI ile İyileştir
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
