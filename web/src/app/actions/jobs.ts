"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import type { ActionResult } from "../actions";

// ── Zod Şemaları ──────────────────────────────────────────────

const createJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Başlık en az 10 karakter olmalıdır.")
    .max(200, "Başlık en fazla 200 karakter olabilir."),
  description: z
    .string()
    .trim()
    .min(20, "Açıklama en az 20 karakter olmalıdır.")
    .max(3000, "Açıklama en fazla 3000 karakter olabilir."),
  budget: z
    .number()
    .positive("Bütçe sıfırdan büyük olmalıdır.")
    .nullable()
    .optional(),
});

// ── Server Actions ────────────────────────────────────────────

export async function createJob(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "İlan oluşturmak için giriş yapmalısınız." };
    }

    // FormData → raw values
    const rawTitle = formData.get("title") as string | null;
    const rawDescription = formData.get("description") as string | null;
    const rawBudget = formData.get("budget") as string | null;

    const budgetValue =
      rawBudget && rawBudget.trim() !== "" ? parseFloat(rawBudget) : null;

    // Zod validasyonu
    const parsed = createJobSchema.safeParse({
      title: rawTitle ?? "",
      description: rawDescription ?? "",
      budget: budgetValue,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError.message };
    }

    const { title, description, budget } = parsed.data;

    const { error: insertError } = await supabase.from("jobs").insert({
      user_id: user.id,
      title,
      description,
      budget: budget ?? null,
    });

    if (insertError) {
      return { error: `İlan oluşturulamadı: ${insertError.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/jobs");
  return { error: null };
}

export async function createBid(
  jobId: string,
  amount: number,
  estimatedDays: number,
  coverLetter: string
): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Teklif vermek için giriş yapmalısınız." };
    }

    if (amount <= 0) {
      return { error: "Teklif tutarı sıfırdan büyük olmalıdır." };
    }

    if (estimatedDays <= 0) {
      return { error: "Tahmini süre en az 1 gün olmalıdır." };
    }

    if (!coverLetter.trim() || coverLetter.length > 2000) {
      return { error: "Ön yazı 1-2000 karakter arasında olmalıdır." };
    }

    const { error: insertError } = await supabase.from("bids").insert({
      job_id: jobId,
      expert_id: user.id,
      amount,
      estimated_days: estimatedDays,
      cover_letter: coverLetter.trim(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { error: "Bu ilana zaten bir teklif vermişsiniz." };
      }
      return { error: `Teklif gönderilemedi: ${insertError.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/jobs");
  return { error: null };
}
