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
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../src/lib/supabase";

// TODO: Canlıya alındıktan sonra `EXPO_PUBLIC_WEB_URL` env değişkenini
// production web URL'i ile doldur (.env veya app.json `extra`).
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen e-posta adresini gir.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${WEB_URL}/auth/callback?next=/reset-password` }
      );

      if (error) {
        Alert.alert("Hata", "E-posta gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }

      Alert.alert(
        "E-posta Gönderildi",
        "Şifre sıfırlama bağlantısı e-posta adresine gönderildi. Linke tıkladığında web sitemizde şifreni değiştirebilirsin.",
        [{ text: "Tamam", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Hata", "Beklenmeyen bir hata oluştu. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-black"
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-white text-3xl font-bold text-center mb-2">
          Şifremi Unuttum
        </Text>
        <Text className="text-gray-400 text-center mb-10">
          E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
        </Text>

        <View className="mb-6">
          <TextInput
            className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
            placeholder="E-posta"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            loading ? "bg-blue-400" : "bg-blue-500"
          }`}
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Sıfırlama Bağlantısı Gönder
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-blue-500 font-semibold">Girişe dön</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
