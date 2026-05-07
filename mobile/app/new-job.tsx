import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";

export default function NewJobModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(!!id);

  useEffect(() => {
    if (id) {
      supabase.from('jobs').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setDescription(data.description);
          if (data.budget) setBudget(data.budget.toString());
        }
        setIsLoadingData(false);
      });
    }
  }, [id]);

  const handleAIOptimize = async () => {
    if (description.length < 10) {
        Alert.alert("Uyarı", "AI iyileştirmesi için biraz daha detay yazmalısın.");
        return;
    }
    setIsAILoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/ai/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: description })
      });
      
      const result = await response.json();
      if (result.data) {
        // AI'dan gelen veriyi metne basıyoruz
        const tags = result.data.suggestedTags?.map((t: string) => `#${t}`).join(' ') || '';
        setDescription(`${result.data.optimizedText}\n\n${tags}`);
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      Alert.alert("API Bağlantı Hatası", "Web projenin açık olduğundan ve .env dosyasındaki IP adresinin doğruluğundan emin ol.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !description.trim() || !user) return;
    // TİP HATASI ÇÖZÜMÜ: undefined gönderiyoruz
    const budgetNum = budget.trim() ? parseFloat(budget.trim()) : undefined;

    setIsPublishing(true);
    try {
      if (id) {
        const { error } = await supabase.from('jobs').update({
          title: title.trim(),
          description: description.trim(),
          budget: budgetNum,
        }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("create_job", {
          p_title: title.trim(),
          p_description: description.trim(),
          p_budget: budgetNum,
        });
        if (error) throw error;
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Hata", err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoadingData) return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#1D9BF0" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()}><Text className="text-white text-base">İptal</Text></TouchableOpacity>
        <Text className="text-white font-bold text-base">{id ? "İlanı Düzenle" : "Yeni İlan"}</Text>
        <TouchableOpacity onPress={handlePublish} disabled={isPublishing} className="bg-[#1D9BF0] px-5 py-2 rounded-full">
          {isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <Text className="font-bold text-white">{id ? "Güncelle" : "Yayınla"}</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView className="p-4">
        <Text className="text-zinc-400 text-xs font-bold mb-2">BAŞLIK</Text>
        <TextInput className="bg-zinc-900 text-white p-4 rounded-xl mb-5 border border-zinc-800" value={title} onChangeText={setTitle} />
        
        <View className="flex-row justify-between items-center mb-2">
            <Text className="text-zinc-400 text-xs font-bold">AÇIKLAMA</Text>
            <TouchableOpacity onPress={handleAIOptimize} disabled={isAILoading} className="flex-row items-center">
                <Ionicons name="sparkles" size={14} color="#1D9BF0" />
                <Text className="text-[#1D9BF0] text-xs font-bold ml-1">AI ile İyileştir</Text>
            </TouchableOpacity>
        </View>
        <TextInput className="bg-zinc-900 text-white p-4 rounded-xl mb-5 border border-zinc-800 min-h-[150px]" multiline textAlignVertical="top" value={description} onChangeText={setDescription} />

        <Text className="text-zinc-400 text-xs font-bold mb-2">BÜTÇE (₺)</Text>
        <TextInput className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800" keyboardType="numeric" value={budget} onChangeText={setBudget} placeholder="Opsiyonel" placeholderTextColor="#52525b" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}