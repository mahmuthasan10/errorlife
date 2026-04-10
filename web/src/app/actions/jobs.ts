"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import type { ActionResult } from "../actions";

const uuidSchema = z.string().uuid("Geçersiz ID formatı.");

// ── createJob ─────────────────────────────────────────────────
export async function createJob(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const rawTitle = formData.get("title") as string | null;
  const rawDescription = formData.get("description") as string | null;
  const rawBudget = formData.get("budget") as string | null;
  const budget = rawBudget && rawBudget.trim() !== "" ? parseFloat(rawBudget) : null;

  try {
    const { error } = await supabase.rpc("create_job", {
      p_title: rawTitle ?? "",
      p_description: rawDescription ?? "",
      p_budget: budget,
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
  const parsedJobId = uuidSchema.safeParse(jobId);
  if (!parsedJobId.success) return { error: "Geçersiz ilan ID." };

  const supabase = await createClient();

  const rawAmount = formData.get("amount") as string | null;
  const rawDays = formData.get("estimatedDays") as string | null;
  const rawCover = formData.get("coverLetter") as string | null;

  try {
    const { error } = await supabase.rpc("create_bid", {
      p_job_id: parsedJobId.data,
      p_amount: rawAmount ? parseFloat(rawAmount) : 0,
      p_estimated_days: rawDays ? parseInt(rawDays, 10) : 0,
      p_cover_letter: rawCover ?? "",
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
