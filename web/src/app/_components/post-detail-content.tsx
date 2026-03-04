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
}

export default function PostDetailContent({
  post,
  comments,
  isLiked,
  isBookmarked,
  currentUserName,
  currentUserDisplayName,
}: PostDetailContentProps) {
  return (
    <div>
      {/* Post içeriği */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800">
            <span className="text-sm font-bold text-zinc-300">
              {post.profiles.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-white">
              {post.profiles.display_name}
            </p>
            <p className="text-sm text-zinc-500">
              @{post.profiles.username}
            </p>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
          {post.content}
        </p>

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
      />
    </div>
  );
}
