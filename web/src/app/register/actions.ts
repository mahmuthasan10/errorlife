"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

export type AuthResult = {
  error: string | null;
  success: string | null;
};

const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir."
    ),
  displayName: z
    .string()
    .min(1, "İsim alanı zorunludur.")
    .max(50, "İsim en fazla 50 karakter olabilir."),
});

export async function register(formData: FormData): Promise<AuthResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi.",
      success: null,
    };
  }

  const { email, password, username, displayName } = parsed.data;

  const supabase = await createClient();

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
      return { error: "Kayıt başarısız. Lütfen tekrar deneyin.", success: null };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.", success: null };
  }

  return {
    error: null,
    success: "Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.",
  };
}
