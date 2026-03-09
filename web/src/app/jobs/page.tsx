import {
  Briefcase,
  Clock,
  DollarSign,
  ArrowLeft,
  Send,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { JobWithAuthor, BidWithJob } from "@/types/database";
import CreateJobForm from "@/app/_components/create-job-form";

// ── Veri Çekme ────────────────────────────────────────────

async function getOpenJobs(): Promise<JobWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      profiles (*),
      job_tags (
        tags (*)
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as JobWithAuthor[]) ?? [];
}

async function getMyJobs(userId: string): Promise<JobWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(`
      *,
      profiles (*),
      job_tags (
        tags (*)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as JobWithAuthor[]) ?? [];
}

async function getMyBids(userId: string): Promise<BidWithJob[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bids")
    .select(`
      *,
      jobs (
        *,
        profiles (*)
      )
    `)
    .eq("expert_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as BidWithJob[]) ?? [];
}

// ── Yardımcı ──────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHour < 24) return `${diffHour}sa`;
  if (diffDay < 30) return `${diffDay}g`;
  return date.toLocaleDateString("tr-TR");
}

const jobStatusMap: Record<string, { label: string; className: string }> = {
  open: { label: "Açık", className: "text-green-400" },
  in_progress: { label: "Devam Ediyor", className: "text-yellow-400" },
  closed: { label: "Kapalı", className: "text-zinc-500" },
};

const bidStatusMap: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Beklemede",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  accepted: {
    label: "Kabul Edildi",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

// ── Tab Sabitleri ─────────────────────────────────────────

type TabKey = "all" | "my-jobs" | "my-bids";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "Açık İlanlar" },
  { key: "my-jobs", label: "Benim İlanlarım" },
  { key: "my-bids", label: "Verdiğim Teklifler" },
];

// ── Sayfa ─────────────────────────────────────────────────

interface JobsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedParams = await searchParams;
  const activeTab = (resolvedParams.tab as TabKey) || "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tab'a göre veri çek
  let jobs: JobWithAuthor[] = [];
  let myBids: BidWithJob[] = [];

  if (activeTab === "my-jobs" && user) {
    jobs = await getMyJobs(user.id);
  } else if (activeTab === "my-bids" && user) {
    myBids = await getMyBids(user.id);
  } else {
    jobs = await getOpenJobs();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="rounded-full p-2 transition-colors hover:bg-zinc-900"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-bold">İlanlar</h2>
        </div>

        {/* Tab Navigasyonu */}
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/jobs?tab=${tab.key}`}
                className={`relative flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* İlan Oluştur — sadece "all" ve "my-jobs" tablarında */}
      {activeTab !== "my-bids" && <CreateJobForm />}

      {/* İçerik */}
      {activeTab === "my-bids" ? (
        /* ── Verdiğim Teklifler ── */
        myBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
            <Send size={48} strokeWidth={1.5} />
            <p className="text-lg">Henüz teklif vermediniz.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {myBids.map((bid) => {
              const job = bid.jobs;
              const bidStatus = bidStatusMap[bid.status] ?? bidStatusMap.pending;
              const jStatus = jobStatusMap[job.status] ?? jobStatusMap.open;

              return (
                <Link
                  key={bid.id}
                  href={`/jobs/${job.id}`}
                  className="block px-4 py-4 transition-colors hover:bg-zinc-950"
                >
                  {/* İlan Başlığı & Durum */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white">
                        {job.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        @{job.profiles.username} &middot;{" "}
                        {formatRelativeTime(job.created_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${bidStatus.className}`}
                    >
                      {bidStatus.label}
                    </span>
                  </div>

                  {/* Teklif Detayları */}
                  <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{bid.amount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{bid.estimated_days} gün</span>
                    </div>
                    <span className={`ml-auto text-xs ${jStatus.className}`}>
                      İlan: {jStatus.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : /* ── Açık İlanlar / Benim İlanlarım ── */
      jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
          <Briefcase size={48} strokeWidth={1.5} />
          <p className="text-lg">
            {activeTab === "my-jobs"
              ? "Henüz ilan oluşturmadınız."
              : "Henüz açık ilan bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {jobs.map((job) => {
            const jStatus = jobStatusMap[job.status] ?? jobStatusMap.open;

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-950"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
                  {job.profiles.display_name?.charAt(0).toUpperCase() ?? "?"}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Meta */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-bold text-white">
                      {job.profiles.display_name}
                    </span>
                    <span className="text-zinc-500">
                      @{job.profiles.username}
                    </span>
                    <span className="text-zinc-600">&middot;</span>
                    <span className="text-zinc-500">
                      {formatRelativeTime(job.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {job.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1 line-clamp-3 text-zinc-400">
                    {job.description}
                  </p>

                  {/* Tags */}
                  {job.job_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.job_tags.map((jt) => (
                        <span
                          key={jt.tags.id}
                          className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                        >
                          #{jt.tags.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer — Budget & Status */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
                    {job.budget && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        <span>
                          {job.budget.toLocaleString("tr-TR")} TL
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span className={jStatus.className}>
                        {jStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
