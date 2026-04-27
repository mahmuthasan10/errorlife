import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";

const MAX_TITLE = 200;
const MAX_DESC = 3000;
const MIN_TITLE = 10;
const MIN_DESC = 20;

export default function NewJobModal() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();
  const canPublish =
    trimmedTitle.length >= MIN_TITLE &&
    trimmedDesc.length >= MIN_DESC &&
    !isPublishing;

  const handlePublish = async () => {
    if (!canPublish || !user) return;

    const budgetNum = budget.trim() ? parseFloat(budget.trim()) : null;
    if (budget.trim() && (isNaN(budgetNum!) || budgetNum! <= 0)) {
      Alert.alert("Hata", "Bütçe pozitif bir sayı olmalıdır.");
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase.rpc("create_job", {
        p_title: trimmedTitle,
        p_description: trimmedDesc,
        p_budget: budgetNum,
      });

      if (error) {
        Alert.alert("Hata", error.message || "İlan paylaşılırken bir sorun oluştu.");
        return;
      }

      router.back();
    } catch {
      Alert.alert("Hata", "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setIsPublishing(false);
    }
  };

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

        <Text className="text-white font-bold text-base">Yeni İlan</Text>

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

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4 gap-5">
          {/* Başlık */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              İlan Başlığı *
            </Text>
            <TextInput
              className="bg-zinc-900 text-white text-[15px] rounded-xl px-4 py-3.5 border border-zinc-800"
              placeholder="Örn: React Native Geliştirici Aranıyor"
              placeholderTextColor="#52525b"
              value={title}
              onChangeText={setTitle}
              maxLength={MAX_TITLE}
              returnKeyType="next"
              editable={!isPublishing}
            />
            <Text className={`text-xs mt-1 text-right ${trimmedTitle.length < MIN_TITLE ? "text-amber-600" : "text-zinc-600"}`}>
              {trimmedTitle.length}/{MAX_TITLE}
              {trimmedTitle.length < MIN_TITLE ? ` (en az ${MIN_TITLE})` : ""}
            </Text>
          </View>

          {/* Açıklama */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Açıklama *
            </Text>
            <TextInput
              className="bg-zinc-900 text-white text-[15px] rounded-xl px-4 py-3.5 border border-zinc-800 min-h-[140px]"
              placeholder="İlanı detaylı açıkla: ne bekliyorsun, hangi teknolojiler gerekli, süre vb."
              placeholderTextColor="#52525b"
              value={description}
              onChangeText={setDescription}
              maxLength={MAX_DESC}
              multiline
              textAlignVertical="top"
              editable={!isPublishing}
            />
            <Text className={`text-xs mt-1 text-right ${trimmedDesc.length < MIN_DESC ? "text-amber-600" : "text-zinc-600"}`}>
              {trimmedDesc.length}/{MAX_DESC}
              {trimmedDesc.length < MIN_DESC ? ` (en az ${MIN_DESC})` : ""}
            </Text>
          </View>

          {/* Bütçe (opsiyonel) */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Bütçe (₺) — Opsiyonel
            </Text>
            <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
              <Ionicons name="cash-outline" size={18} color="#52525b" />
              <TextInput
                className="flex-1 text-white text-[15px] py-3.5 ml-2"
                placeholder="0"
                placeholderTextColor="#52525b"
                value={budget}
                onChangeText={(t) => setBudget(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                editable={!isPublishing}
              />
            </View>
            <Text className="text-zinc-600 text-xs mt-1">
              Boş bırakabilirsin — teklif bazlı görüntülenir.
            </Text>
          </View>

          {/* Bilgi notu */}
          <View className="flex-row items-start gap-2 bg-zinc-900/60 rounded-xl p-3.5 mb-6">
            <Ionicons name="information-circle-outline" size={18} color="#71717a" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-zinc-500 text-[13px] leading-[18px]">
              İlanın yayınlandıktan sonra teklif alabilirsin. İstediğin zaman durumunu değiştirebilir veya silebilirsin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
