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
import { Link } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (username.length < 3) {
      Alert.alert("Hata", "Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        Alert.alert("Kayıt Hatası", error.message);
        return;
      }

      Alert.alert(
        "Kayıt Başarılı",
        "E-posta adresine bir doğrulama bağlantısı gönderildi. Lütfen e-postanı kontrol et."
      );
    } catch (err) {
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
          ErrorLife
        </Text>
        <Text className="text-gray-400 text-center mb-10">
          Yeni hesap oluştur
        </Text>

        <View className="mb-4">
          <TextInput
            className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
            placeholder="Kullanıcı Adı"
            placeholderTextColor="#71717a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View className="mb-4">
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

        <View className="mb-6">
          <TextInput
            className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base border border-zinc-800"
            placeholder="Şifre"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            loading ? "bg-blue-400" : "bg-blue-500"
          }`}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Kayıt Ol
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400">Zaten hesabın var mı? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500 font-semibold">Giriş Yap</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
