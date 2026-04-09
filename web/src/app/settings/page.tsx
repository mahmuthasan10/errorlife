import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Profile } from "@/types/database";
import SettingsForm from "./_components/settings-form";
import AvatarUpload from "./_components/avatar-upload";
import CoverUpload from "./_components/cover-upload";

export const metadata: Metadata = {
  title: "Ayarlar | ErrorLife",
};

async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-zinc-800 bg-black px-4 py-3">
        <Link
          href={`/profile/${profile.username}`}
          className="rounded-full p-2 transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold">Ayarlar</h2>
      </div>

      {/* İçerik */}
      <div className="px-4 py-6">
        {/* Kapak Fotoğrafı */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Kapak Fotoğrafı
          </p>
          <CoverUpload currentCoverUrl={profile.cover_url} />
        </div>

        {/* Profil Önizleme + Avatar */}
        <div className="mb-8 flex items-center gap-4">
          <AvatarUpload
            currentAvatarUrl={profile.avatar_url}
            displayName={profile.display_name}
          />
          <div>
            <p className="font-bold text-white">{profile.display_name}</p>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
            <p className="mt-0.5 text-xs text-zinc-600">Fotoğrafa tıkla &amp; değiştir</p>
          </div>
        </div>

        {/* Bölüm Başlığı */}
        <div className="mb-5 flex items-center gap-2 text-zinc-400">
          <Settings size={18} />
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Profil Bilgileri
          </h3>
        </div>

        <SettingsForm profile={profile} />
      </div>
    </div>
  );
}
