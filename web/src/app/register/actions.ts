"use server";

import { createClient } from "@/utils/supabase/server";

export type AuthResult = {
  error: string | null;
  success: string | null;
};

export async function register(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password || !username || !displayName) {
    return { error: "Tüm alanları doldurun.", success: null };
  }

  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır.", success: null };
  }

  if (username.length < 3) {
    return { error: "Kullanıcı adı en az 3 karakter olmalıdır.", success: null };
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return {
      error: "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.",
      success: null,
    };
  }

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Bu e-posta adresi zaten kayıtlı.", success: null };
      }
      return { error: `Kayıt başarısız: ${error.message}`, success: null };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", success: null };
  }

  return {
    error: null,
    success: "Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.",
  };
}
