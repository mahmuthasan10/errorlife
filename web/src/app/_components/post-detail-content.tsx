import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type {
  PostWithAuthor,
  CommentWithAuthor,
} from "@/types/database";
import { LikeButton, BookmarkButton } from "./interaction-buttons";
import CommentSection from "./comment-form";

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PostDetailContentProps {
  post: PostWithAuthor;
  comments: CommentWithAuthor[];
  isLiked: boolean;
  isBookmarked: boolean;
  currentUserName?: string;
  currentUserDisplayName?: string;
  currentUserId?: string;
}

export default function PostDetailContent({
  post,
  comments,
  isLiked,
  isBookmarked,
  currentUserName,
  currentUserDisplayName,
  currentUserId,
}: PostDetailContentProps) {
  return (
    <div>
      {/* Post içeriği */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${post.profiles.username}`}
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            {post.profiles.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.display_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                <span className="text-sm font-bold text-zinc-300">
                  {post.profiles.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/profile/${post.profiles.username}`}
              className="font-bold text-white hover:underline"
            >
              {post.profiles.display_name}
            </Link>
            <p className="text-sm text-zinc-500">
              <Link
                href={`/profile/${post.profiles.username}`}
                className="hover:underline"
              >
                @{post.profiles.username}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
          {post.content}
        </p>

        {/* Görsel */}
        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image_url}
              alt="Gönderi görseli"
              className="max-h-96 w-full object-cover"
            />
          </div>
        )}

        {/* Etiketler */}
        {post.post_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.post_tags.map(({ tags }) => (
              <span
                key={tags.id}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400"
              >
                #{tags.name}
              </span>
            ))}
          </div>
        )}

        <p className="mt-3 text-sm text-zinc-500">
          {formatFullDate(post.created_at)}
        </p>
      </div>

      {/* İstatistik çubuğu */}
      <div className="flex items-center gap-6 border-y border-zinc-800 px-4 py-2 text-sm text-zinc-500">
        <span>
          <strong className="text-white">{post.comment_count}</strong> Yorum
        </span>
        <span>
          <strong className="text-white">{post.like_count}</strong> Beğeni
        </span>
        <span>
          <strong className="text-white">{post.bookmark_count}</strong> Kayıt
        </span>
      </div>

      {/* Etkileşim butonları */}
      <div className="flex items-center justify-around border-b border-zinc-800 px-4 py-2">
        <span className="flex items-center gap-2 text-zinc-500">
          <MessageCircle size={20} />
        </span>
        <LikeButton
          postId={post.id}
          initialActive={isLiked}
          initialCount={post.like_count}
        />
        <BookmarkButton
          postId={post.id}
          initialActive={isBookmarked}
          initialCount={post.bookmark_count}
        />
      </div>

      {/* Yorum bölümü */}
      <CommentSection
        postId={post.id}
        initialComments={comments}
        currentUserName={currentUserName}
        currentUserDisplayName={currentUserDisplayName}
        currentUserId={currentUserId}
      />
    </div>
  );
}
