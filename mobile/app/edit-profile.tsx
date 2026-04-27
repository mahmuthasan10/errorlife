import { useEffect, useState } from "react";
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
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../src/providers/AuthProvider";
import Avatar from "../src/components/ui/Avatar";
import type { Profile } from "../src/types/database";

const MAX_DISPLAY_NAME = 60;
const MAX_USERNAME = 30;
const MAX_BIO = 160;

export default function EditProfileModal() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Mevcut profili yükle ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          Alert.alert("Hata", "Profil bilgileri yüklenemedi.");
          router.back();
          return;
        }
        const p = data as Profile;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setIsLoading(false);
      });
  }, [user, router]);

  // ─── Kaydet ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || isSaving) return;

    const trimmedName = displayName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedBio = bio.trim();

    // Validasyon
    if (trimmedName.length < 2) {
      Alert.alert("Hata", "İsim en az 2 karakter olmalı.");
      return;
    }
    if (trimmedUsername.length < 3) {
      Alert.alert("Hata", "Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      Alert.alert(
        "Hata",
        "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir."
      );
      return;
    }

    // Değişiklik yoksa çık
    if (
      trimmedName === profile?.display_name &&
      trimmedUsername === profile?.username &&
      trimmedBio === (profile?.bio ?? "")
    ) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      // Kullanıcı adı benzersizlik kontrolü (kendi adı hariç)
      if (trimmedUsername !== profile?.username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", trimmedUsername)
          .neq("id", user.id)
          .maybeSingle();

        if (existing) {
          Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor.");
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: trimmedName,
          username: trimmedUsername,
          bio: trimmedBio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        // Unique constraint ihlali
        if (error.code === "23505") {
          Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor.");
        } else {
          Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
        }
        return;
      }

      router.back();
    } catch {
      Alert.alert("Hata", "Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    displayName.trim() !== (profile?.display_name ?? "") ||
    username.trim().toLowerCase() !== (profile?.username ?? "") ||
    bio.trim() !== (profile?.bio ?? "");

  const canSave = hasChanges && !isSaving && !isLoading;

  // ─── Yükleniyor ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black"
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-white text-base">İptal</Text>
          </TouchableOpacity>
          <Text className="text-white font-bold text-base">Profili Düzenle</Text>
          <View className="w-16" />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#1D9BF0" />
        </View>
      </KeyboardAvoidingView>
    );
  }

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
          disabled={isSaving}
        >
          <Text className={`text-base ${isSaving ? "text-zinc-600" : "text-white"}`}>
            İptal
          </Text>
        </TouchableOpacity>

        <Text className="text-white font-bold text-base">Profili Düzenle</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
          className={`rounded-full px-5 py-2 ${
            canSave ? "bg-[#1D9BF0]" : "bg-[#1D9BF0]/40"
          }`}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              className={`font-bold text-sm ${
                canSave ? "text-white" : "text-white/50"
              }`}
            >
              Kaydet
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar alanı */}
        <View className="items-center py-6 border-b border-zinc-800">
          <Avatar
            uri={profile?.avatar_url ?? null}
            fallback={profile?.display_name ?? "?"}
            size={80}
          />
          <Text className="text-zinc-500 text-xs mt-3">
            Profil fotoğrafı değiştirme yakında eklenecek
          </Text>
        </View>

        {/* Form alanları */}
        <View className="px-4 pt-5 gap-5">
          {/* Ad Soyad */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Ad Soyad *
            </Text>
            <TextInput
              className="bg-zinc-900 text-white text-[15px] rounded-xl px-4 py-3.5 border border-zinc-800"
              placeholder="Adın ve soyadın"
              placeholderTextColor="#52525b"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={MAX_DISPLAY_NAME}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!isSaving}
            />
            <Text className="text-zinc-600 text-xs mt-1 text-right">
              {displayName.trim().length}/{MAX_DISPLAY_NAME}
            </Text>
          </View>

          {/* Kullanıcı Adı */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Kullanıcı Adı *
            </Text>
            <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
              <Text className="text-zinc-500 text-[15px] py-3.5">@</Text>
              <TextInput
                className="flex-1 text-white text-[15px] py-3.5 ml-1"
                placeholder="kullanici_adi"
                placeholderTextColor="#52525b"
                value={username}
                onChangeText={(t) =>
                  setUsername(t.toLowerCase().replace(/\s/g, ""))
                }
                maxLength={MAX_USERNAME}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
            <Text className="text-zinc-600 text-xs mt-1 text-right">
              {username.trim().length}/{MAX_USERNAME}
            </Text>
          </View>

          {/* Bio */}
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">
              Bio
            </Text>
            <TextInput
              className="bg-zinc-900 text-white text-[15px] rounded-xl px-4 py-3.5 border border-zinc-800 min-h-[100px]"
              placeholder="Kendini kısaca tanıt..."
              placeholderTextColor="#52525b"
              value={bio}
              onChangeText={setBio}
              maxLength={MAX_BIO}
              multiline
              textAlignVertical="top"
              editable={!isSaving}
            />
            <Text className="text-zinc-600 text-xs mt-1 text-right">
              {bio.trim().length}/{MAX_BIO}
            </Text>
          </View>

          {/* Alt boşluk */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
