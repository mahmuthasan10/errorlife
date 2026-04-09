"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import type { ActionResult } from "../actions";

// ── Zod Şemaları ──────────────────────────────────────────────

const createBidSchema = z.object({
  amount: z
    .number()
    .min(1, "Teklif tutarı en az 1 TL olmalıdır."),
  estimatedDays: z
    .number()
    .min(1, "Tahmini süre en az 1 gün olmalıdır."),
  coverLetter: z
    .string()
    .trim()
    .min(10, "Kapak yazısı en az 10 karakter olmalıdır.")
    .max(2000, "Kapak yazısı en fazla 2000 karakter olabilir."),
});

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
  formData: FormData
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

    // FormData → raw values
    const rawAmount = formData.get("amount") as string | null;
    const rawDays = formData.get("estimatedDays") as string | null;
    const rawCover = formData.get("coverLetter") as string | null;

    // Zod validasyonu
    const parsed = createBidSchema.safeParse({
      amount: rawAmount ? parseFloat(rawAmount) : 0,
      estimatedDays: rawDays ? parseInt(rawDays, 10) : 0,
      coverLetter: rawCover ?? "",
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError.message };
    }

    const { amount, estimatedDays, coverLetter } = parsed.data;

    // Daha önce bu ilana teklif verilmiş mi?
    const { data: existingBid, error: lookupError } = await supabase
      .from("bids")
      .select("id, status")
      .eq("job_id", jobId)
      .eq("expert_id", user.id)
      .maybeSingle();

    if (lookupError) {
      return { error: `Teklif kontrol edilemedi: ${lookupError.message}` };
    }

    if (existingBid) {
      // (a) pending veya accepted → engelle
      if (existingBid.status === "pending" || existingBid.status === "accepted") {
        return { error: "Zaten aktif bir teklifiniz var." };
      }

      // (b) rejected → mevcut teklifi güncelle ve tekrar pending yap
      if (existingBid.status === "rejected") {
        const { error: updateError } = await supabase
          .from("bids")
          .update({
            amount,
            estimated_days: estimatedDays,
            cover_letter: coverLetter,
            status: "pending" as const,
          })
          .eq("id", existingBid.id);

        if (updateError) {
          return { error: `Teklif güncellenemedi: ${updateError.message}` };
        }

        revalidatePath(`/jobs/${jobId}`);
        revalidatePath("/jobs");
        return { error: null };
      }
    }

    // (c) Hiç teklif yoksa → yeni INSERT
    const { error: insertError } = await supabase.from("bids").insert({
      job_id: jobId,
      expert_id: user.id,
      amount,
      estimated_days: estimatedDays,
      cover_letter: coverLetter,
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

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { error: null };
}

export async function acceptBid(
  bidId: string,
  jobId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    // GÜVENLİK: İlan sahibi kontrolü
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("user_id, status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return { error: "İlan bulunamadı." };
    }

    if (job.user_id !== user.id) {
      return { error: "Yalnızca ilan sahibi teklif kabul edebilir." };
    }

    if (job.status !== "open") {
      return { error: "Bu ilan artık teklif kabul etmiyor." };
    }

    // Teklifi kabul et (DB trigger gerisini halledecek)
    const { error: updateError } = await supabase
      .from("bids")
      .update({ status: "accepted" as const })
      .eq("id", bidId)
      .eq("job_id", jobId);

    if (updateError) {
      return { error: updateError.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { error: null };
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("user_id", user.id);

    if (error) {
      return { error: `İlan silinemedi: ${error.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/jobs");
  return { error: null };
}

export async function updateJobStatus(
  jobId: string,
  status: "open" | "in_progress" | "closed"
): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    const { error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", jobId)
      .eq("user_id", user.id);

    if (error) {
      return { error: `İlan durumu güncellenemedi: ${error.message}` };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { error: null };
}

export async function rejectBid(
  bidId: string,
  jobId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Bu işlem için giriş yapmalısınız." };
    }

    // GÜVENLİK: İlan sahibi kontrolü
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("user_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return { error: "İlan bulunamadı." };
    }

    if (job.user_id !== user.id) {
      return { error: "Yalnızca ilan sahibi teklif reddedebilir." };
    }

    const { error: updateError } = await supabase
      .from("bids")
      .update({ status: "rejected" as const })
      .eq("id", bidId)
      .eq("job_id", jobId);

    if (updateError) {
      return { error: updateError.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { error: null };
}
