"use client";

import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { acceptBid, rejectBid } from "@/app/actions/jobs";

interface BidActionButtonsProps {
  bidId: string;
  jobId: string;
}

export default function BidActionButtons({ bidId, jobId }: BidActionButtonsProps) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading("accept");

    try {
      const result = await acceptBid(bidId, jobId);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setError(null);
    setLoading("reject");

    try {
      const result = await rejectBid(bidId, jobId);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(null);
    }
  }

  const isDisabled = loading !== null;

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Reddet */}
        <button
          type="button"
          onClick={handleReject}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {loading === "reject" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Reddediliyor...
            </>
          ) : (
            <>
              <X size={14} />
              Reddet
            </>
          )}
        </button>

        {/* Kabul Et */}
        <button
          type="button"
          onClick={handleAccept}
          disabled={isDisabled}
          className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading === "accept" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Kabul Ediliyor...
            </>
          ) : (
            <>
              <Check size={14} />
              Kabul Et
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
