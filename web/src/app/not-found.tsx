import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-extrabold text-zinc-700">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Sayfa Bulunamadı</h1>
      <p className="mt-2 text-zinc-500">
        Aradığın sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
