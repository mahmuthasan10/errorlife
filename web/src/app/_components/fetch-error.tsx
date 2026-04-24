"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";

interface FetchErrorProps {
  message?: string;
  className?: string;
}

export default function FetchError({
  message = "Veriler yüklenemedi.",
  className = "",
}: FetchErrorProps) {
  const router = useRouter();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 py-16 text-center ${className}`}
    >
      <AlertCircle size={40} className="text-zinc-600" />
      <p className="text-sm text-zinc-500">{message}</p>
      <button
        onClick={() => router.refresh()}
        className="flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
      >
        <RefreshCw size={14} />
        Tekrar Dene
      </button>
    </div>
  );
}
