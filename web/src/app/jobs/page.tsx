import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { JobWithAuthor, BidWithJob } from "@/types/database";
import CreateJobForm from "@/app/_components/create-job-form";
import FetchError from "@/app/_components/fetch-error";
import {
  OpenJobsList,
  MyJobsList,
  MyBidsList,
} from "./_components/jobs-feed-client";
import { JobFeedProvider } from "./_components/job-feed-context";

export const metadata: Metadata = {
  title: "İlanlar | ErrorLife",
  description: "Freelance iş ilanlarını keşfedin ve teklif verin.",
};

const PAGE_SIZE = 20;

const JOB_SELECT = `
  *,
  profiles (*),
  job_tags (tags (*))
` as const;

const BID_SELECT = `
  *,
  jobs (*, profiles (*))
` as const;

async function getOpenJobs(): Promise<{ jobs: JobWithAuthor[]; fetchError: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) return { jobs: [], fetchError: true };
  return { jobs: (data as JobWithAuthor[]) ?? [], fetchError: false };
}

async function getMyJobs(userId: string): Promise<{ jobs: JobWithAuthor[]; fetchError: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) return { jobs: [], fetchError: true };
  return { jobs: (data as JobWithAuthor[]) ?? [], fetchError: false };
}

async function getMyBids(userId: string): Promise<{ bids: BidWithJob[]; fetchError: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select(BID_SELECT)
    .eq("expert_id", userId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) return { bids: [], fetchError: true };
  return { bids: (data as BidWithJob[]) ?? [], fetchError: false };
}

type TabKey = "all" | "my-jobs" | "my-bids";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "Açık İlanlar" },
  { key: "my-jobs", label: "Benim İlanlarım" },
  { key: "my-bids", label: "Verdiğim Teklifler" },
];

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

  let jobs: JobWithAuthor[] = [];
  let myBids: BidWithJob[] = [];
  let fetchError = false;

  if (activeTab === "my-jobs" && user) {
    const result = await getMyJobs(user.id);
    jobs = result.jobs;
    fetchError = result.fetchError;
  } else if (activeTab === "my-bids" && user) {
    const result = await getMyBids(user.id);
    myBids = result.bids;
    fetchError = result.fetchError;
  } else {
    const result = await getOpenJobs();
    jobs = result.jobs;
    fetchError = result.fetchError;
  }

  const errorMessages: Record<TabKey, string> = {
    all: "İlanlar yüklenemedi.",
    "my-jobs": "İlanlarınız yüklenemedi.",
    "my-bids": "Teklifleriniz yüklenemedi.",
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black">
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

      {/* İlan Oluştur + Liste — ortak context içinde */}
      <JobFeedProvider>
        {activeTab !== "my-bids" && <CreateJobForm />}

        {fetchError ? (
          <FetchError message={errorMessages[activeTab]} />
        ) : activeTab === "my-bids" ? (
          <MyBidsList initialBids={myBids} userId={user?.id ?? ""} />
        ) : activeTab === "my-jobs" ? (
          <MyJobsList initialJobs={jobs} userId={user?.id ?? ""} />
        ) : (
          <OpenJobsList initialJobs={jobs} />
        )}
      </JobFeedProvider>
    </div>
  );
}
