"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthResult = {
  error: string | null;
};

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Şifre alanı zorunludur."),
});

export async function login(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "E-posta veya şifre hatalı." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { error: "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin." };
      }
      return { error: "Giriş başarısız. Lütfen tekrar deneyin." };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  redirect("/");
}
