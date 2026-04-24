"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  DollarSign,
  Send,
  Loader2,
} from "lucide-react";
import { loadMoreOpenJobs, loadMoreMyJobs, loadMoreMyBids } from "@/app/actions/pagination";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useJobFeed } from "./job-feed-context";
import type { JobWithAuthor, BidWithJob } from "@/types/database";

const PAGE_SIZE = 20;

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

function JobRow({ job }: { job: JobWithAuthor }) {
  const jStatus = jobStatusMap[job.status] ?? jobStatusMap.open;
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-950"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
        {job.profiles.display_name?.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate font-bold text-white">
            {job.profiles.display_name}
          </span>
          <span className="text-zinc-500">@{job.profiles.username}</span>
          <span className="text-zinc-600">&middot;</span>
          <span className="text-zinc-500">{formatRelativeTime(job.created_at)}</span>
        </div>
        <h3 className="mt-1 text-lg font-semibold text-white">{job.title}</h3>
        <p className="mt-1 line-clamp-3 text-zinc-400">{job.description}</p>
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
        <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
          {job.budget && (
            <div className="flex items-center gap-1">
              <DollarSign size={14} />
              <span>{job.budget.toLocaleString("tr-TR")} TL</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span className={jStatus.className}>{jStatus.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BidRow({ bid }: { bid: BidWithJob }) {
  const job = bid.jobs;
  const bidStatus = bidStatusMap[bid.status] ?? bidStatusMap.pending;
  const jStatus = jobStatusMap[job.status] ?? jobStatusMap.open;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block px-4 py-4 transition-colors hover:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{job.title}</h3>
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
}

function JobSkeleton({ title }: { title: string }) {
  return (
    <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
          <Briefcase size={18} className="text-zinc-600" />
        </div>
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-14 rounded bg-zinc-800" />
          </div>
          <p className="text-[15px] font-semibold text-zinc-400/70">{title}</p>
          <div className="h-3 w-3/4 rounded bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 text-center">
      <button
        onClick={onRetry}
        className="text-sm text-zinc-500 underline hover:text-zinc-300"
      >
        Yükleme başarısız. Tekrar dene
      </button>
    </div>
  );
}

function ScrollSentinel({
  sentinelRef,
  isPending,
}: {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  isPending: boolean;
}) {
  return (
    <div ref={sentinelRef} className="py-6 text-center text-zinc-500">
      {isPending && <Loader2 size={20} className="mx-auto animate-spin" />}
    </div>
  );
}

// ── Açık İlanlar ──────────────────────────────────────────

export function OpenJobsList({ initialJobs }: { initialJobs: JobWithAuthor[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [hasMore, setHasMore] = useState(initialJobs.length === PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isPendingJob, pendingTitle } = useJobFeed();

  function loadMore() {
    const cursor = jobs[jobs.length - 1]?.created_at;
    if (!cursor || isPending) return;
    startTransition(async () => {
      const { data: more, fetchError } = await loadMoreOpenJobs(cursor);
      if (fetchError) { setLoadError(true); return; }
      setLoadError(false);
      if (more.length > 0) setJobs((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadError);

  if (jobs.length === 0 && !isPendingJob) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <Briefcase size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz açık ilan bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div>
      {isPendingJob && <JobSkeleton title={pendingTitle} />}
      <div className="divide-y divide-zinc-800">
        {jobs.map((job) => <JobRow key={job.id} job={job} />)}
      </div>
      {loadError ? (
        <LoadError onRetry={loadMore} />
      ) : hasMore ? (
        <ScrollSentinel sentinelRef={sentinelRef} isPending={isPending} />
      ) : null}
    </div>
  );
}

// ── Benim İlanlarım ───────────────────────────────────────

export function MyJobsList({
  initialJobs,
  userId,
}: {
  initialJobs: JobWithAuthor[];
  userId: string;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [hasMore, setHasMore] = useState(initialJobs.length === PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { isPendingJob, pendingTitle } = useJobFeed();

  function loadMore() {
    const cursor = jobs[jobs.length - 1]?.created_at;
    if (!cursor || isPending) return;
    startTransition(async () => {
      const { data: more, fetchError } = await loadMoreMyJobs(userId, cursor);
      if (fetchError) { setLoadError(true); return; }
      setLoadError(false);
      if (more.length > 0) setJobs((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadError);

  if (jobs.length === 0 && !isPendingJob) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <Briefcase size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz ilan oluşturmadınız.</p>
      </div>
    );
  }

  return (
    <div>
      {isPendingJob && <JobSkeleton title={pendingTitle} />}
      <div className="divide-y divide-zinc-800">
        {jobs.map((job) => <JobRow key={job.id} job={job} />)}
      </div>
      {loadError ? (
        <LoadError onRetry={loadMore} />
      ) : hasMore ? (
        <ScrollSentinel sentinelRef={sentinelRef} isPending={isPending} />
      ) : null}
    </div>
  );
}

// ── Verdiğim Teklifler ────────────────────────────────────

export function MyBidsList({
  initialBids,
  userId,
}: {
  initialBids: BidWithJob[];
  userId: string;
}) {
  const [bids, setBids] = useState(initialBids);
  const [hasMore, setHasMore] = useState(initialBids.length === PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    const cursor = bids[bids.length - 1]?.created_at;
    if (!cursor || isPending) return;
    startTransition(async () => {
      const { data: more, fetchError } = await loadMoreMyBids(userId, cursor);
      if (fetchError) { setLoadError(true); return; }
      setLoadError(false);
      if (more.length > 0) setBids((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    });
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadError);

  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <Send size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz teklif vermediniz.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-zinc-800">
        {bids.map((bid) => <BidRow key={bid.id} bid={bid} />)}
      </div>
      {loadError ? (
        <LoadError onRetry={loadMore} />
      ) : hasMore ? (
        <ScrollSentinel sentinelRef={sentinelRef} isPending={isPending} />
      ) : null}
    </div>
  );
}
