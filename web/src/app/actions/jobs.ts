"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { uuidSchema, createJobSchema, createBidSchema } from "@/lib/schemas";
import type { ActionResult } from "../actions";

// ── createJob ─────────────────────────────────────────────────
export async function createJob(formData: FormData): Promise<ActionResult> {
  const rawBudget = formData.get("budget") as string | null;
  const budget = rawBudget && rawBudget.trim() !== "" ? parseFloat(rawBudget) : null;

  const parsed = createJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    budget,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("create_job", {
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_budget: parsed.data.budget ?? undefined,
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath("/jobs");
  return { error: null };
}

// ── createBid ─────────────────────────────────────────────────
export async function createBid(
  jobId: string,
  formData: FormData
): Promise<ActionResult> {
  const rawAmount = formData.get("amount") as string | null;
  const rawDays = formData.get("estimatedDays") as string | null;

  const parsed = createBidSchema.safeParse({
    jobId,
    amount: rawAmount ? parseFloat(rawAmount) : 0,
    estimatedDays: rawDays ? parseInt(rawDays, 10) : 0,
    coverLetter: formData.get("coverLetter"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("create_bid", {
      p_job_id: parsed.data.jobId,
      p_amount: parsed.data.amount,
      p_estimated_days: parsed.data.estimatedDays,
      p_cover_letter: parsed.data.coverLetter,
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${parsed.data.jobId}`);
  revalidatePath("/jobs");
  return { error: null };
}

// ── acceptBid ─────────────────────────────────────────────────
export async function acceptBid(
  bidId: string,
  jobId: string
): Promise<ActionResult> {
  const parsedBidId = uuidSchema.safeParse(bidId);
  const parsedJobId = uuidSchema.safeParse(jobId);
  if (!parsedBidId.success || !parsedJobId.success)
    return { error: "Geçersiz ID." };

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("accept_bid", {
      p_bid_id: parsedBidId.data,
      p_job_id: parsedJobId.data,
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${parsedJobId.data}`);
  revalidatePath("/jobs");
  return { error: null };
}

// ── rejectBid ─────────────────────────────────────────────────
export async function rejectBid(
  bidId: string,
  jobId: string
): Promise<ActionResult> {
  const parsedBidId = uuidSchema.safeParse(bidId);
  const parsedJobId = uuidSchema.safeParse(jobId);
  if (!parsedBidId.success || !parsedJobId.success)
    return { error: "Geçersiz ID." };

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("reject_bid", {
      p_bid_id: parsedBidId.data,
      p_job_id: parsedJobId.data,
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${parsedJobId.data}`);
  revalidatePath("/jobs");
  return { error: null };
}

// ── deleteJob ─────────────────────────────────────────────────
export async function deleteJob(jobId: string): Promise<ActionResult> {
  const parsedJobId = uuidSchema.safeParse(jobId);
  if (!parsedJobId.success) return { error: "Geçersiz ilan ID." };

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
      .eq("id", parsedJobId.data)
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

// ── updateJobStatus ───────────────────────────────────────────
export async function updateJobStatus(
  jobId: string,
  status: "open" | "in_progress" | "closed"
): Promise<ActionResult> {
  const parsedJobId = uuidSchema.safeParse(jobId);
  if (!parsedJobId.success) return { error: "Geçersiz ilan ID." };

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("update_job_status", {
      p_job_id: parsedJobId.data,
      p_status: status,
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }

  revalidatePath(`/jobs/${parsedJobId.data}`);
  revalidatePath("/jobs");
  return { error: null };
}
