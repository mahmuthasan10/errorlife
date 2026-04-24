"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Başarılı kayıttan sonra 3 sn içinde /login'e yönlendir
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await register(formData);
      if (result.error) {
        setError(result.error);
      }
      if (result.success) {
        setSuccess(result.success);
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-8 px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <span className="text-xl font-bold text-black">E</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ErrorLife</h1>
          <p className="text-zinc-500">Yeni hesap oluşturun</p>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Başarı mesajı + CTA */}
        {success && (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
            <Link
              href="/login"
              className="block w-full rounded-full bg-white py-3 text-center text-sm font-bold text-black transition-opacity hover:opacity-90"
            >
              Giriş sayfasına git
            </Link>
            <p className="text-center text-xs text-zinc-500">
              3 saniye içinde otomatik yönlendirileceksiniz…
            </p>
          </div>
        )}

        {/* Form (başarıda gizle) */}
        {!success && (
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Görünen Ad
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="Mahmut Yıldız"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Kullanıcı Adı
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="mahmut_yildiz"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-400"
            >
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="En az 6 karakter"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>
        )}

        {/* Giriş linki */}
        <p className="text-center text-sm text-zinc-500">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/login"
            className="font-medium text-white hover:underline"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
