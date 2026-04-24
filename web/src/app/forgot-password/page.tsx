"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result = await sendPasswordReset(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <span className="text-xl font-bold text-black">E</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Şifremi Unuttum</h1>
          <p className="text-center text-zinc-500">
            E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen
              gelen kutunuzu kontrol edin.
            </div>
            <Link
              href="/login"
              className="block w-full rounded-full bg-white py-3 text-center text-sm font-bold text-black transition-opacity hover:opacity-90"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-zinc-400"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ornek@email.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500">
              <Link href="/login" className="font-medium text-white hover:underline">
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
