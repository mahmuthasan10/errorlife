"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function FollowersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
        <RotateCcw className="h-7 w-7 text-zinc-500" />
      </div>
      <div>
        <p className="font-bold text-white">Takipçiler yüklenemedi</p>
        <p className="mt-1 text-sm text-zinc-500">
          Bir sorun oluştu. Lütfen tekrar deneyin.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
