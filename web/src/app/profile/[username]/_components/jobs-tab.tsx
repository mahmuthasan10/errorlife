import Link from "next/link";
import { Briefcase, Clock, DollarSign } from "lucide-react";
import { getUserJobs } from "@/lib/profile-queries";
import type { JobWithAuthor } from "@/types/database";

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHours < 24) return `${diffHours}sa`;
  return `${diffDays}g`;
}

const statusMap: Record<string, { label: string; className: string }> = {
  open: { label: "Açık", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  in_progress: { label: "Devam Ediyor", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  closed: { label: "Kapalı", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

function JobRow({ job }: { job: JobWithAuthor }) {
  const status = statusMap[job.status] ?? statusMap.open;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block px-4 py-4 transition-colors hover:bg-zinc-950/50"
    >
      {/* Başlık & Durum */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-white">{job.title}</h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Açıklama */}
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
        {job.description}
      </p>

      {/* Etiketler */}
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

      {/* Footer — Bütçe & Tarih */}
      <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
        {job.budget && (
          <div className="flex items-center gap-1">
            <DollarSign size={14} />
            <span>{job.budget.toLocaleString("tr-TR")} ₺</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{formatRelativeTime(job.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function JobsTab({ userId }: { userId: string }) {
  const jobs = await getUserJobs(userId);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
        <Briefcase size={48} strokeWidth={1.5} />
        <p className="text-lg">Henüz ilan oluşturulmadı.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {jobs.map((job) => (
        <JobRow key={job.id} job={job} />
      ))}
    </div>
  );
}
