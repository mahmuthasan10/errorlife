"use client";

import { useState, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { createBid } from "@/app/actions/jobs";

interface CreateBidFormProps {
  jobId: string;
  isRetry?: boolean;
}

export default function CreateBidForm({ jobId, isRetry = false }: CreateBidFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const result = await createBid(jobId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setSuccess(true);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
        <p className="text-sm font-medium text-green-400">
          Teklifiniz başarıyla gönderildi!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="mb-3 text-base font-semibold text-white">
        {isRetry ? "Teklifimi Güncelle ve Tekrar Gönder" : "Teklif Ver"}
      </h3>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        {/* Teklif Miktarı & Tahmini Süre — yan yana */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="bid-amount"
              className="mb-1.5 block text-sm font-medium text-zinc-400"
            >
              Teklif Miktarı (₺)
            </label>
            <input
              id="bid-amount"
              name="amount"
              type="number"
              placeholder="Örn: 500"
              min={1}
              step={1}
              required
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>
          <div>
            <label
              htmlFor="bid-days"
              className="mb-1.5 block text-sm font-medium text-zinc-400"
            >
              Tahmini Süre (Gün)
            </label>
            <input
              id="bid-days"
              name="estimatedDays"
              type="number"
              placeholder="Örn: 7"
              min={1}
              step={1}
              required
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Kapak Yazısı */}
        <div>
          <label
            htmlFor="bid-cover"
            className="mb-1.5 block text-sm font-medium text-zinc-400"
          >
            Kapak Yazısı
          </label>
          <textarea
            id="bid-cover"
            name="coverLetter"
            placeholder="Neden bu iş için en uygun adaysınız? Deneyiminizi ve yaklaşımınızı açıklayın..."
            minLength={10}
            maxLength={2000}
            required
            className="min-h-[100px] w-full resize-y rounded-xl border border-zinc-800 bg-black px-4 py-2.5 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
          />
        </div>

        {/* Hata mesajı */}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Gönder butonu */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send size={14} />
                {isRetry ? "Tekrar Gönder" : "Teklif Gönder"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
