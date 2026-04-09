import Link from "next/link";
import type { Profile } from "@/types/database";

interface UserListItemProps {
  user: Profile;
}

export default function UserListItem({ user }: UserListItemProps) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3 transition-colors hover:bg-zinc-900/50"
    >
      {/* Avatar */}
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt={user.display_name}
          className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
          {user.display_name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* İsim & kullanıcı adı */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white hover:underline">
          {user.display_name}
        </p>
        <p className="truncate text-sm text-zinc-500">@{user.username}</p>
        {user.bio && (
          <p className="mt-0.5 truncate text-sm text-zinc-400">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
