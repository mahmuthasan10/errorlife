"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteJob, updateJobStatus } from "@/app/actions/jobs";

interface JobOwnerActionsProps {
  jobId: string;
  currentStatus: "open" | "in_progress" | "closed";
}

export default function JobOwnerActions({ jobId, currentStatus }: JobOwnerActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(status: "open" | "in_progress" | "closed") {
    startTransition(async () => {
      await updateJobStatus(jobId, status);
    });
  }

  function handleDelete() {
    if (!confirm("İlanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;
    startTransition(async () => {
      const result = await deleteJob(jobId);
      if (!result.error) {
        router.push("/jobs");
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        İlan Yönetimi
      </p>

      <div className="space-y-2">
        {currentStatus !== "open" && (
          <button
            onClick={() => handleStatusChange("open")}
            disabled={isPending}
            className="w-full rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
          >
            Açık Olarak İşaretle
          </button>
        )}
        {currentStatus !== "in_progress" && (
          <button
            onClick={() => handleStatusChange("in_progress")}
            disabled={isPending}
            className="w-full rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20 disabled:opacity-50"
          >
            Devam Ediyor Olarak İşaretle
          </button>
        )}
        {currentStatus !== "closed" && (
          <button
            onClick={() => handleStatusChange("closed")}
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-600/30 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-700/50 disabled:opacity-50"
          >
            İlanı Kapat
          </button>
        )}

        <div className="border-t border-zinc-800 pt-2">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
          >
            <Trash2 size={14} />
            İlanı Sil
          </button>
        </div>
      </div>
    </div>
  );
}
