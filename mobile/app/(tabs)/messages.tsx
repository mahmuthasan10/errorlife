import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ChatWithDetails } from '@errorlife/shared/types';

export default function MessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Sadece chat ve mesajları çek
      const { data: chatData, error } = await supabase
        .from('chats')
        .select('*, messages(*)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      
      if (chatData && chatData.length > 0) {
        // En garantili yöntem: Karşı tarafın ID'lerini toplayıp profilleri kendimiz çekiyoruz
        const otherUserIds = chatData.map(c => c.user1_id === user.id ? c.user2_id : c.user1_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', otherUserIds);

        const formattedChats = chatData.map((chat: any) => {
          const targetId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
          const otherProfile = profiles?.find(p => p.id === targetId) || {};
          
          return {
            ...chat,
            otherUser: otherProfile, 
            lastMessage: chat.messages && chat.messages.length > 0 ? chat.messages[0] : null,
          };
        });
        
        setChats(formattedChats as unknown as ChatWithDetails[]);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error("Mesajlar çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchChats)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [fetchChats])
  );

  const renderItem = ({ item }: { item: ChatWithDetails }) => {
    const otherUser = item.otherUser || {}; 
    const lastMessage = item.lastMessage; 
    
    const displayName = otherUser.display_name || otherUser.username || 'Kullanıcı';
    const displayAvatar = otherUser.avatar_url || 'https://via.placeholder.com/150';
    const messageText = lastMessage?.content || 'Mesaj yok';
    const hasUnread = lastMessage && !lastMessage.is_read && lastMessage.sender_id !== user?.id;

    return (
      <TouchableOpacity 
        onPress={() => router.push(`/messages/${item.id}` as never)}
        className="flex-row items-center p-4 border-b border-zinc-900"
      >
        <Image 
          source={{ uri: displayAvatar }} 
          className="w-13 h-13 rounded-full bg-zinc-800 mr-3"
          style={{ width: 52, height: 52, borderRadius: 26 }} // Garantili yuvarlak
        />
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{displayName}</Text>
          <Text className={`mt-1 ${hasUnread ? 'text-white font-semibold' : 'text-zinc-500'}`} numberOfLines={1}>
            {messageText}
          </Text>
        </View>
        {hasUnread && <View className="w-3 h-3 rounded-full bg-[#1D9BF0] ml-2" />}
      </TouchableOpacity>
    );
  };

  return (
    // SafeAreaView sayesinde saat/pil göstergesinin (çentik) altına inmez
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* Header */}
      <View className="border-b border-zinc-800 px-4 pb-3 pt-2">
        <Text className="text-white text-xl font-bold">Mesajlar</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1D9BF0" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center p-8 mt-20">
              <Text className="text-zinc-500 text-center">Henüz bir mesajlaşmanız yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}