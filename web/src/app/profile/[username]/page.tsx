import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Heart,
  Briefcase,
} from "lucide-react";
import { getUserProfile } from "@/lib/profile-queries";
import { createClient } from "@/utils/supabase/server";
import FollowButton from "@/app/_components/follow-button";
import PostsTab from "./_components/posts-tab";
import LikesTab from "./_components/likes-tab";
import JobsTab from "./_components/jobs-tab";
import TabSkeleton from "./_components/tab-skeleton";

// ── Tab Sabitleri ─────────────────────────────────────────

type TabKey = "posts" | "likes" | "jobs";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "posts", label: "Gönderiler", icon: <FileText size={16} /> },
  { key: "likes", label: "Beğeniler", icon: <Heart size={16} /> },
  { key: "jobs", label: "İlanlar", icon: <Briefcase size={16} /> },
];

// ── Yardımcı ──────────────────────────────────────────────

function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

// ── Sayfa ─────────────────────────────────────────────────

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { username } = await params;
  const resolvedSearch = await searchParams;
  const activeTab: TabKey =
    (resolvedSearch.tab as TabKey) || "posts";

  const [profile, authResult] = await Promise.all([
    getUserProfile(username),
    createClient().then((s) => s.auth.getUser()),
  ]);

  if (!profile) notFound();

  const currentUserId = authResult.data?.user?.id ?? null;
  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-zinc-800 bg-black/80 px-4 py-2 backdrop-blur-md">
        <Link
          href="/"
          className="rounded-full p-2 transition-colors hover:bg-zinc-900"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-lg font-bold leading-tight">
            {profile.display_name}
          </h2>
          <p className="text-xs text-zinc-500">@{profile.username}</p>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className="relative">
        <div className="h-48 bg-zinc-900" />

        {/* Avatar — banner üzerine taşıyor */}
        <div className="absolute -bottom-16 left-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-32 w-32 rounded-full border-4 border-black object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-black bg-zinc-800 text-4xl font-bold text-white">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Aksiyon Butonu — sağ üst */}
        <div className="flex justify-end px-4 pt-3">
          {isOwnProfile ? (
            <Link
              href="/settings"
              className="rounded-full border border-zinc-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-900"
            >
              Profili Düzenle
            </Link>
          ) : (
            <FollowButton
              targetUserId={profile.id}
              isFollowing={profile.isFollowing}
              followersCount={profile.followers_count}
            />
          )}
        </div>
      </div>

      {/* ── Profil Bilgileri ── */}
      <div className="mt-10 px-4">
        <h1 className="text-xl font-bold">{profile.display_name}</h1>
        <p className="text-zinc-500">@{profile.username}</p>

        {profile.bio && (
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">
            {profile.bio}
          </p>
        )}

        <div className="mt-3 flex items-center gap-1 text-sm text-zinc-500">
          <CalendarDays size={16} />
          <span>{formatJoinDate(profile.created_at)} tarihinde katıldı</span>
        </div>

        {/* Takipçi / Takip sayıları */}
        <div className="mt-3 flex gap-5">
          <Link
            href={`/profile/${username}/following`}
            className="group text-sm"
          >
            <span className="font-bold text-white">
              {profile.following_count}
            </span>{" "}
            <span className="text-zinc-500 group-hover:underline">
              Takip Edilen
            </span>
          </Link>
          <Link
            href={`/profile/${username}/followers`}
            className="group text-sm"
          >
            <span className="font-bold text-white">
              {profile.followers_count}
            </span>{" "}
            <span className="text-zinc-500 group-hover:underline">
              Takipçi
            </span>
          </Link>
        </div>
      </div>

      {/* ── Tab Navigasyonu (searchParams) ── */}
      <div className="mt-4 flex border-b border-zinc-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/profile/${username}?tab=${tab.key}`}
              className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-white"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Tab İçeriği (Suspense ile lazy-load) ── */}
      <div className="flex-1">
        <Suspense key={activeTab} fallback={<TabSkeleton />}>
          {activeTab === "posts" && <PostsTab userId={profile.id} />}
          {activeTab === "likes" && <LikesTab userId={profile.id} />}
          {activeTab === "jobs" && <JobsTab userId={profile.id} />}
        </Suspense>
      </div>
    </div>
  );
}
