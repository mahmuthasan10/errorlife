import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Profile } from "@/types/database";
import SettingsForm from "./_components/settings-form";

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
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
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
        {/* Profil Önizleme */}
        <div className="mb-8 flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-16 w-16 rounded-full border-2 border-zinc-800 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-800 text-2xl font-bold text-white">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-white">{profile.display_name}</p>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
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
