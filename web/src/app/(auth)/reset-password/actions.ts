"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = {
  error: string | null;
};

const passwordSchema = z
  .object({
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export async function updatePassword(
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { error: "Şifre güncellenemedi. Lütfen tekrar deneyin." };
  } catch {
    return { error: "Beklenmeyen bir hata oluştu." };
  }

  redirect("/");
}
