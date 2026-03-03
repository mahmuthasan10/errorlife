"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthResult = {
  error: string | null;
};

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-posta ve şifre alanları zorunludur." };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "E-posta veya şifre hatalı." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin." };
      }
      return { error: `Giriş başarısız: ${error.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  redirect("/");
}
