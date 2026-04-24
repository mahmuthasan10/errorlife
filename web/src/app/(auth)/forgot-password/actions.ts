"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = {
  error: string | null;
  success?: boolean;
};

const emailSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
});

export async function sendPasswordReset(
  formData: FormData
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz e-posta." };
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${origin}/auth/callback?next=/reset-password` }
    );
    if (error) return { error: "E-posta gönderilemedi. Lütfen tekrar deneyin." };
  } catch {
    return { error: "Beklenmeyen bir hata oluştu." };
  }

  return { error: null, success: true };
}
