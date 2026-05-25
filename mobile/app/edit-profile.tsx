import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../src/providers/AuthProvider";
import Avatar from "../src/components/ui/Avatar";
import { profileSchema } from "../src/validation/profile";
import {
  fetchProfile,
  updateProfile,
  checkUsernameAvailable,
} from "../src/lib/queries/profile";
import { logger } from "../src/lib/logger";
import type { Profile } from "@errorlife/shared/types";

const MAX_DISPLAY_NAME = 60;
const MAX_USERNAME     = 30;
const MAX_BIO          = 160;

export default function EditProfileModal() {
  const router = useRouter();
  const { user } = useAuth();
  const mounted = useRef(true);

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername]       = useState("");
  const [bio, setBio]                 = useState("");
  const [isSaving, setIsSaving]       = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id)
      .then((p) => {
        if (!mounted.current) return;
        setProfile(p);
        setDisplayName(p.display_name ?? "");
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        logger.error("edit_profile.load_failed", { err: String(err) });
        Alert.alert("Hata", "Profil bilgileri yüklenemedi.");
        router.back();
      });
  }, [user, router]);

  const handleSave = async () => {
    if (!user || isSaving) return;

    const parsed = profileSchema.safeParse({ display_name: displayName, username, bio });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      Alert.alert("Hata", first?.message ?? "Geçersiz form verisi.");
      return;
    }

    const values = parsed.data;

    if (
      values.display_name === profile?.display_name &&
      values.username     === profile?.username &&
      (values.bio ?? null) === (profile?.bio ?? null)
    ) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      if (values.username !== profile?.username) {
        const available = await checkUsernameAvailable(values.username, user.id);
        if (!available) {
          Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor.");
          return;
        }
      }

      await updateProfile(user.id, values);
      if (mounted.current) router.back();
    } catch (err: unknown) {
      if (!mounted.current) return;
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        Alert.alert("Hata", "Bu kullanıcı adı zaten kullanılıyor.");
      } else {
        Alert.alert("Hata", "Profil güncellenirken bir sorun oluştu.");
      }
    } finally {
      if (mounted.current) setIsSaving(false);
    }
  };

  const hasChanges =
    displayName.trim()                !== (profile?.display_name ?? "") ||
    username.trim().toLowerCase()     !== (profile?.username ?? "") ||
    bio.trim()                        !== (profile?.bio ?? "");

  const canSave = hasChanges && !isSaving && !isLoading;

  if (isLoading) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={isSaving}
        >
          <Text className={`text-base ${isSaving ? "text-zinc-600" : "text-white"}`}>İptal</Text>
        </TouchableOpacity>

        <Text className="text-white font-bold text-base">Profili Düzenle</Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
          className={`rounded-full px-5 py-2 ${canSave ? "bg-[#1D9BF0]" : "bg-[#1D9BF0]/40"}`}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className={`font-bold text-sm ${canSave ? "text-white" : "text-white/50"}`}>
              Kaydet
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="items-center py-6 border-b border-zinc-800">
          <Avatar uri={profile?.avatar_url ?? null} fallback={profile?.display_name ?? "?"} size={80} />
          <Text className="text-zinc-500 text-xs mt-3">
            Profil fotoğrafı değiştirme yakında eklenecek
          </Text>
        </View>

        <View className="px-4 pt-5 gap-5">
          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">Ad Soyad *</Text>
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
            <Text className="text-zinc-600 text-xs mt-1 text-right">{displayName.trim().length}/{MAX_DISPLAY_NAME}</Text>
          </View>

          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">Kullanıcı Adı *</Text>
            <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
              <Text className="text-zinc-500 text-[15px] py-3.5">@</Text>
              <TextInput
                className="flex-1 text-white text-[15px] py-3.5 ml-1"
                placeholder="kullanici_adi"
                placeholderTextColor="#52525b"
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ""))}
                maxLength={MAX_USERNAME}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isSaving}
              />
            </View>
            <Text className="text-zinc-600 text-xs mt-1 text-right">{username.trim().length}/{MAX_USERNAME}</Text>
          </View>

          <View>
            <Text className="text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wider">Bio</Text>
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
            <Text className="text-zinc-600 text-xs mt-1 text-right">{bio.trim().length}/{MAX_BIO}</Text>
          </View>

          <View className="h-8" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
