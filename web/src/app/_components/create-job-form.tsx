"use client";

import { useState, useRef } from "react";
import { Briefcase, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { createJob } from "@/app/actions/jobs";
import { useJobFeed } from "@/app/jobs/_components/job-feed-context";

export default function CreateJobForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { setPendingJob, clearPendingJob } = useJobFeed();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    const title = (formData.get("title") as string) ?? "";
    setPendingJob(title);

    try {
      const result = await createJob(formData);
      if (result.error) {
        clearPendingJob();
        setError(result.error);
      } else {
        formRef.current?.reset();
        setIsOpen(false);
        setError(null);
        // Context'i temizleme: revalidatePath sonrası yeni veri gelince otomatik kaybolacak
        // Küçük bir gecikme ile kaldır — liste yenilenmeden önce skeleton görünsün
        setTimeout(() => clearPendingJob(), 1500);
      }
    } catch {
      clearPendingJob();
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b border-zinc-800">
      {/* Toggle butonu */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-zinc-950"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
            <Briefcase size={18} className="text-zinc-400" />
          </div>
          <span className="text-zinc-500">Yeni ilan oluştur...</span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-zinc-500" />
        ) : (
          <ChevronDown size={18} className="text-zinc-500" />
        )}
      </button>

      {/* Form alanı */}
      {isOpen && (
        <div className="px-4 pb-4">
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            {/* Başlık */}
            <div>
              <label
                htmlFor="job-title"
                className="mb-1.5 block text-sm font-medium text-zinc-400"
              >
                İlan Başlığı
              </label>
              <input
                id="job-title"
                name="title"
                type="text"
                placeholder="Örn: React Native mobil uygulama geliştirme"
                minLength={10}
                maxLength={200}
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label
                htmlFor="job-description"
                className="mb-1.5 block text-sm font-medium text-zinc-400"
              >
                İlan Detayları / Sorun Açıklaması
              </label>
              <textarea
                id="job-description"
                name="description"
                placeholder="Projenizi veya sorununuzu detaylı bir şekilde açıklayın..."
                minLength={20}
                maxLength={3000}
                required
                className="min-h-[100px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
              />
            </div>

            {/* Bütçe */}
            <div>
              <label
                htmlFor="job-budget"
                className="mb-1.5 block text-sm font-medium text-zinc-400"
              >
                Tahmini Bütçe (TL)
              </label>
              <input
                id="job-budget"
                name="budget"
                type="number"
                placeholder="Belirtmek istemiyorsanız boş bırakın"
                min={0}
                step={0.01}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
              />
            </div>

            {/* Hata mesajı */}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Butonlar */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="rounded-full px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  "İlan Oluştur"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
