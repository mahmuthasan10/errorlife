import Link from "next/link";
import { FileText, Users, Briefcase, DollarSign } from "lucide-react";
import { searchPosts, searchUsers, searchJobs } from "@/lib/search-queries";
import type { PostWithAuthor, Profile, JobWithAuthor } from "@/types/database";

type Tab = "posts" | "users" | "jobs";

interface SearchResultsProps {
  query: string;
  tagSlug: string;
  tab: Tab;
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "şimdi";
  if (diffMin < 60) return `${diffMin}dk`;
  if (diffHour < 24) return `${diffHour}sa`;
  if (diffDay < 7) return `${diffDay}g`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function PostCard({ post }: { post: PostWithAuthor }) {
  const tags = post.post_tags?.map((pt) => pt.tags) ?? [];
  return (
    <Link href={`/post/${post.id}`} className="block border-b border-zinc-800 px-4 py-4 hover:bg-zinc-950 transition-colors">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {post.profiles.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={post.profiles.display_name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white">
              {post.profiles.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-white truncate">{post.profiles.display_name}</span>
            <span className="text-zinc-500 truncate">@{post.profiles.username}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500 shrink-0">{formatRelativeTime(post.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap break-words">{post.content}</p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-blue-400"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-4 text-xs text-zinc-500">
            <span>{post.like_count} beğeni</span>
            <span>{post.comment_count} yorum</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function UserCard({ user }: { user: Profile }) {
  return (
    <Link href={`/profile/${user.username}`} className="flex gap-3 border-b border-zinc-800 px-4 py-4 hover:bg-zinc-950 transition-colors">
      <div className="flex-shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-base font-bold text-white">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white">{user.display_name}</p>
        <p className="text-sm text-zinc-500">@{user.username}</p>
        {user.bio && <p className="mt-1 text-sm text-zinc-300 line-clamp-2">{user.bio}</p>}
        <p className="mt-1 text-xs text-zinc-500">{user.followers_count} takipçi</p>
      </div>
    </Link>
  );
}

function JobCard({ job }: { job: JobWithAuthor }) {
  const tags = job.job_tags?.map((jt) => jt.tags) ?? [];
  return (
    <Link href={`/jobs/${job.id}`} className="block border-b border-zinc-800 px-4 py-4 hover:bg-zinc-950 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{job.title}</p>
          <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{job.description}</p>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag.id} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            @{job.profiles.username} · {formatRelativeTime(job.created_at)}
          </p>
        </div>
        {job.budget && (
          <div className="flex shrink-0 items-center gap-1 text-green-400 text-sm font-semibold">
            <DollarSign size={14} />
            {job.budget.toLocaleString("tr-TR")} ₺
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-zinc-500">
      <p className="text-lg font-semibold">{label}</p>
      <p className="mt-1 text-sm">Farklı anahtar kelimeler deneyin.</p>
    </div>
  );
}

export default async function SearchResults({ query, tagSlug, tab }: SearchResultsProps) {
  if (tab === "posts") {
    const posts = await searchPosts(query, tagSlug);
    return posts.length === 0
      ? <EmptyState label="Gönderi bulunamadı" />
      : <div>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>;
  }

  if (tab === "users") {
    const users = await searchUsers(query);
    return users.length === 0
      ? <EmptyState label="Kullanıcı bulunamadı" />
      : <div>{users.map((u) => <UserCard key={u.id} user={u} />)}</div>;
  }

  // jobs
  const jobs = await searchJobs(query, tagSlug);
  return jobs.length === 0
    ? <EmptyState label="İlan bulunamadı" />
    : <div>{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>;
}
