import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserProfile, getFollowing } from "@/lib/profile-queries";
import UserListItem from "../_components/user-list-item";

interface FollowingPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: FollowingPageProps) {
  const { username } = await params;
  return { title: `@${username} Takip Ettikleri | ErrorLife` };
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params;

  const [profile, following] = await Promise.all([
    getUserProfile(username),
    getFollowing(username),
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

      {/* Takip edilen listesi */}
      {following.length === 0 ? (
        <div className="px-4 py-12 text-center text-zinc-500">
          <p className="text-lg font-bold text-white">Henüz kimseyi takip etmiyor</p>
          <p className="mt-1 text-sm">Bu hesap henüz kimseyi takip etmiyor.</p>
        </div>
      ) : (
        following.map((user) => <UserListItem key={user.id} user={user} />)
      )}
    </div>
  );
}
