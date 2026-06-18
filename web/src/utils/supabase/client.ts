import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mimari Koruma: Eğer değişkenler eksikse uygulamayı çökertmek yerine konsola net hata basıyoruz
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "🚨 CRITICAL ERROR: Supabase ortam değişkenleri eksik! " +
    "Lütfen NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini kontrol edin."
  );
}

export const createClient = () =>
  createBrowserClient(
    supabaseUrl || "https://missing-supabase-url.supabase.co",
    supabaseAnonKey || "missing-anon-key"
  );