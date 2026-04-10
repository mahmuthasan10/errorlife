import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserProfile, getFollowers } from "@/lib/profile-queries";
import UsersListClient from "../_components/users-list-client";

interface FollowersPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: FollowersPageProps) {
  const { username } = await params;
  return { title: `@${username} Takipçileri | ErrorLife` };
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params;

  const [profile, { profiles: followers, nextCursor }] = await Promise.all([
    getUserProfile(username),
    getFollowers(username),
  ]);

  if (!profile) notFound();

  return (
    <div>
      {/* Başlık */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-zinc-800 bg-black px-4 py-3">
        <Link
          href={`/profile/${username}`}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-zinc-800"
        >
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <div>
          <p className="font-bold text-white">{profile.display_name}</p>
          <p className="text-sm text-zinc-500">@{username}</p>
        </div>
      </div>

      {/* Takipçi listesi */}
      {followers.length === 0 ? (
        <div className="px-4 py-12 text-center text-zinc-500">
          <p className="text-lg font-bold text-white">Henüz takipçi yok</p>
          <p className="mt-1 text-sm">Bu hesabı takip eden kimse yok.</p>
        </div>
      ) : (
        <UsersListClient
          initialUsers={followers}
          username={username}
          mode="followers"
          initialCursor={nextCursor}
        />
      )}
    </div>
  );
}
