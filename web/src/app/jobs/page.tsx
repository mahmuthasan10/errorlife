import { Briefcase, Clock, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { JobWithAuthor } from "@/types/database";
import CreateJobForm from "@/app/_components/create-job-form";

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

  if (error) {
    return [];
  }

  return (data as JobWithAuthor[]) ?? [];
}

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

export default async function JobsPage() {
  const jobs = await getOpenJobs();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <Link href="/" className="rounded-full p-2 transition-colors hover:bg-zinc-900">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold">İlanlar</h2>
      </div>

      {/* İlan Oluştur */}
      <CreateJobForm />

      {/* İlan Listesi */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-zinc-500">
          <Briefcase size={48} strokeWidth={1.5} />
          <p className="text-lg">Henüz açık ilan bulunmuyor.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {jobs.map((job) => (
            <article
              key={job.id}
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
                      <span>{job.budget.toLocaleString("tr-TR")} TL</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Açık</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
