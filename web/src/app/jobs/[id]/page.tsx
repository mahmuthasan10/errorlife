import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { JobWithAuthor, BidWithExpert } from "@/types/database";
import CreateBidForm from "@/app/_components/create-bid-form";
import BidActionButtons from "@/app/_components/accept-bid-button";

// ── Veri Çekme ─────────────────────────────────────────────

async function getJob(id: string): Promise<JobWithAuthor | null> {
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
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as JobWithAuthor;
}

async function getBids(jobId: string): Promise<BidWithExpert[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bids")
    .select(`
      *,
      profiles:expert_id (*)
    `)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as BidWithExpert[];
}

// ── Yardımcı ───────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const statusLabels: Record<string, { label: string; className: string }> = {
  open: {
    label: "Açık",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  in_progress: {
    label: "Devam Ediyor",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  closed: {
    label: "Kapalı",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

// ── Sayfa ──────────────────────────────────────────────────

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [job, bids] = await Promise.all([getJob(id), getBids(id)]);

  if (!job) notFound();

  const isOwner = user?.id === job.user_id;
  const userBid = user ? bids.find((b) => b.expert_id === user.id) : null;
  const hasRejectedBid = userBid?.status === "rejected";
  const hasActiveBid = userBid?.status === "pending" || userBid?.status === "accepted";
  const canBid = !isOwner && job.status === "open" && !!user && !hasActiveBid;
  const status = statusLabels[job.status] ?? statusLabels.open;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/jobs"
          className="rounded-full p-2 transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold">İlan Detayı</h2>
      </div>

      {/* İlan Bilgileri */}
      <div className="border-b border-zinc-800 px-4 py-5">
        {/* Yazar Bilgisi */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
            {job.profiles.display_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold text-white">
              {job.profiles.display_name}
            </p>
            <p className="text-sm text-zinc-500">
              @{job.profiles.username}
            </p>
          </div>
          <span
            className={`ml-auto rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Başlık */}
        <h1 className="mt-4 text-2xl font-bold text-white">{job.title}</h1>

        {/* Açıklama */}
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-zinc-300">
          {job.description}
        </p>

        {/* Etiketler */}
        {job.job_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.job_tags.map((jt) => (
              <span
                key={jt.tags.id}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                #{jt.tags.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta Bilgiler */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
          {job.budget && (
            <div className="flex items-center gap-1.5">
              <DollarSign size={15} />
              <span className="font-medium text-zinc-300">
                {job.budget.toLocaleString("tr-TR")} ₺
              </span>
              <span>Bütçe</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar size={15} />
            <span>{formatDate(job.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText size={15} />
            <span>{bids.length} teklif</span>
          </div>
        </div>
      </div>

      {/* Teklif Formu */}
      {canBid && (
        <div className="border-b border-zinc-800 px-4 py-5">
          {hasRejectedBid && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              Önceki teklifiniz reddedildi. Aşağıdan güncelleyerek tekrar gönderebilirsiniz.
            </div>
          )}
          <CreateBidForm jobId={job.id} isRetry={hasRejectedBid} />
        </div>
      )}

      {/* Giriş yapmamış kullanıcı için bilgi */}
      {!user && job.status === "open" && (
        <div className="border-b border-zinc-800 px-4 py-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
            <p className="text-sm text-zinc-400">
              Teklif vermek için{" "}
              <Link href="/login" className="font-medium text-white underline">
                giriş yapın
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Teklifler Listesi */}
      <div className="px-4 py-5">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Teklifler ({bids.length})
        </h3>

        {bids.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-zinc-500">
            <User size={36} strokeWidth={1.5} />
            <p className="text-sm">Henüz teklif verilmemiş.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid) => {
              const isPending = bid.status === "pending";
              const isAccepted = bid.status === "accepted";
              const isRejected = bid.status === "rejected";

              return (
                <div
                  key={bid.id}
                  className={`rounded-xl border p-4 ${
                    isAccepted
                      ? "border-green-500/30 bg-green-500/5"
                      : isRejected
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  {/* Teklif Başlığı */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
                        {bid.profiles.display_name?.charAt(0).toUpperCase() ??
                          "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {bid.profiles.display_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          @{bid.profiles.username}
                        </p>
                      </div>
                    </div>

                    {/* Durum badge veya Kabul/Reddet butonları */}
                    {isAccepted ? (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                        Kabul Edildi
                      </span>
                    ) : isRejected ? (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                        Reddedildi
                      </span>
                    ) : (
                      isOwner &&
                      isPending &&
                      job.status === "open" && (
                        <BidActionButtons bidId={bid.id} jobId={job.id} />
                      )
                    )}
                  </div>

                  {/* Teklif Detayları */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <DollarSign size={14} className="text-zinc-500" />
                      <span className="font-semibold">
                        {bid.amount.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock size={14} className="text-zinc-500" />
                      <span>{bid.estimated_days} gün</span>
                    </div>
                  </div>

                  {/* Kapak Yazısı */}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                    {bid.cover_letter}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
