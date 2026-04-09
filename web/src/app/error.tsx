"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata loglama burada yapılabilir
    void error;
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-zinc-700">!</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Bir Hata Oluştu</h1>
      <p className="mt-2 text-zinc-500">
        Beklenmedik bir sorunla karşılaştık. Lütfen tekrar deneyin.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
        >
          Tekrar Dene
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-700 px-6 py-2.5 text-sm font-bold text-zinc-300 transition-colors hover:bg-zinc-900"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
