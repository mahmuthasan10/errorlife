import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function NewPostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // AI İyileştirme Fonksiyonu
  const handleAIOptimize = async () => {
    if (!content.trim()) return;
    setIsAILoading(true);
    
    try {
      // DİKKAT: Burası senin Web API'nin Endpoint'ine gitmeli.
      // Örnek: const response = await fetch('https://senin-siten.com/api/ai/optimize', { ... })
      
      // Şimdilik simüle ediyoruz:
      setTimeout(() => {
        setContent(prev => prev + '\n\n#Yazılım #Kariyer #Mentorluk');
        setIsAILoading(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsAILoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() || !user) return;
    setIsPublishing(true);

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      router.back(); // Gönderi atıldıktan sonra geri dön
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Üst Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg">İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handlePublish} 
          disabled={!content.trim() || isPublishing}
          className={`px-5 py-1.5 rounded-full ${content.trim() ? 'bg-[#1D9BF0]' : 'bg-[#1D9BF0]/50'}`}
        >
          {isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold">Paylaş</Text>}
        </TouchableOpacity>
      </View>

      {/* Yazı Alanı */}
      <View className="flex-1 p-4">
        <TextInput
          className="text-white text-lg"
          placeholder="Neler düşünüyorsunuz?"
          placeholderTextColor="#71717a"
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
          style={{ textAlignVertical: 'top', minHeight: 150 }}
        />
        
        {/* AI İle İyileştir Butonu */}
        <View className="flex-row justify-end mt-4">
          <TouchableOpacity 
            onPress={handleAIOptimize}
            disabled={!content.trim() || isAILoading}
            className={`flex-row items-center px-4 py-2 rounded-full border ${content.trim() ? 'border-[#1D9BF0] bg-[#1D9BF0]/10' : 'border-zinc-800'}`}
          >
            {isAILoading ? (
              <ActivityIndicator size="small" color="#1D9BF0" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color={content.trim() ? "#1D9BF0" : "#52525b"} />
                <Text className={`ml-2 font-semibold ${content.trim() ? 'text-[#1D9BF0]' : 'text-zinc-500'}`}>
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